"use client";

import { useId, useRef, useState } from "react";
import type { Lang } from "./i18n";
import { CameraIcon } from "./icons";
import { getAuthInstance } from "../../firebase";
import { hasConsent } from "../../services/consentService";
import { getMedFromImageAI } from "../../services/aiToolsService";
import { normalizeImageMimeType } from "../../services/imageFileService";
import type { RecognizedMedT } from "../../schemas/aiTools";

type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });
const T = {
  camera: ml("카메라 촬영", "Camera", "カメラで撮影", "相机拍照"),
  library: ml("사진 선택", "Photo library", "写真を選択", "选择照片"),
  analyzing: ml("처방전·약봉투 읽는 중", "Reading image", "画像を読取中", "正在读取图片"),
  tooBig: ml("이미지가 너무 큽니다. 5MB 이하 사진으로 다시 시도해 주세요.", "Image is too large. Try a photo under 5MB.", "画像が大きすぎます。5MB以下で再試行してください。", "图片过大。请使用 5MB 以下照片。"),
  badType: ml("지원하지 않는 이미지 형식입니다. JPG, PNG, WebP, HEIC 사진을 사용해 주세요.", "Unsupported image type. Use JPG, PNG, WebP, or HEIC.", "未対応の画像形式です。JPG、PNG、WebP、HEICを使用してください。", "不支持的图片格式。请使用 JPG、PNG、WebP 或 HEIC。"),
  readFail: ml("이미지를 읽지 못했습니다. 사진을 다시 선택해 주세요.", "Could not read the image. Choose the photo again.", "画像を読み込めませんでした。もう一度選択してください。", "无法读取图片。请重新选择。"),
  loginRequired: ml("처방전·약봉투 판독은 로그인 후 사용할 수 있어요.", "Sign in to scan prescriptions or medication bags.", "処方箋・薬袋の認識はログイン後に利用できます。", "登录后可识别处方或药袋。"),
  consentRequired: ml("개인정보 화면에서 민감정보 처리 동의를 먼저 저장해 주세요.", "Save sensitive-health consent in Privacy first.", "プライバシー画面で健康情報処理への同意を先に保存してください。", "请先在隐私设置中保存敏感健康信息处理同意。"),
  privacy: ml("모바일에서 촬영 또는 앨범 선택을 지원합니다. 사진 원본은 저장하지 않고, 확인한 텍스트만 기기에 저장합니다.", "Use camera or photo library on mobile. Photos are not saved, only confirmed text stays on this device.", "モバイルで撮影またはアルバム選択に対応。写真は保存せず、確認済みテキストのみ端末に保存します。", "移动端支持拍照或相册选择。不保存原图，只在本机保存确认后的文字。"),
} as const;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1600;
const JPEG_QUALITY = 0.82;

function dataUrlToBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("bad data url");
  return dataUrl.slice(comma + 1);
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("read error"));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image decode error"));
    img.src = dataUrl;
  });
}

async function compressToJpeg(file: File): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const dataUrl = await readAsDataUrl(file);
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);
    const compressed = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    return { base64: dataUrlToBase64(compressed), mimeType: "image/jpeg" };
  } catch {
    return null;
  }
}

async function readPreparedImage(file: File, mimeType: string): Promise<{ base64: string; mimeType: string }> {
  const canCanvasCompress = mimeType === "image/jpeg" || mimeType === "image/png" || mimeType === "image/webp";
  if (canCanvasCompress && file.size > MAX_BYTES) {
    const compressed = await compressToJpeg(file);
    if (compressed && Math.ceil((compressed.base64.length * 3) / 4) <= MAX_BYTES) return compressed;
  }

  const dataUrl = await readAsDataUrl(file);
  const base64 = dataUrlToBase64(dataUrl);
  if (Math.ceil((base64.length * 3) / 4) > MAX_BYTES) throw new Error("too_big");
  return { base64, mimeType };
}

interface Props {
  lang: Lang;
  onRecognized: (rec: RecognizedMedT) => void;
  compact?: boolean;
}

export default function MedCapture({ lang, onRecognized, compact = false }: Props) {
  const inputId = useId();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureReady(): Promise<boolean> {
    setError(null);
    try {
      const auth = await getAuthInstance();
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setError(T.loginRequired[lang]);
        return false;
      }
      const ok = await hasConsent(uid);
      if (!ok) {
        setError(T.consentRequired[lang]);
        return false;
      }
      return true;
    } catch {
      setError(T.loginRequired[lang]);
      return false;
    }
  }

  function openPicker(ref: React.RefObject<HTMLInputElement | null>) {
    if (loading) return;
    setError(null);
    // Important for mobile Safari and Android Chrome: file inputs must open inside
    // the direct user gesture. Auth and consent checks happen after selection.
    ref.current?.click();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const mimeType = normalizeImageMimeType(file);
    if (!ALLOWED.has(mimeType)) {
      setError(T.badType[lang]);
      return;
    }
    if (!(await ensureReady())) return;

    setLoading(true);
    try {
      const prepared = await readPreparedImage(file, mimeType);
      const rec = await getMedFromImageAI(prepared.base64, prepared.mimeType, lang);
      onRecognized(rec);
    } catch (e) {
      const message = e instanceof Error && e.message === "too_big" ? T.tooBig[lang] : e instanceof Error ? e.message : T.readFail[lang];
      setError(message);
    } finally {
      setLoading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (libraryInputRef.current) libraryInputRef.current.value = "";
    }
  }

  const btnCls = compact
    ? "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 text-[12.5px] font-extrabold text-ink-2 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-tint-2 hover:text-brand disabled:opacity-60"
    : "group inline-flex h-[50px] items-center justify-center gap-2 rounded-full bg-ink px-5 text-[14px] font-extrabold text-surface shadow-[0_18px_42px_-24px_rgba(0,0,0,.72)] transition hover:-translate-y-0.5 hover:bg-brand active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-ink-4";

  return (
    <div className={compact ? "inline-flex flex-col items-start gap-1" : "space-y-3"}>
      <input
        ref={cameraInputRef}
        id={`${inputId}-camera`}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <input
        ref={libraryInputRef}
        id={`${inputId}-library`}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <div className={compact ? "flex flex-wrap gap-2" : "grid gap-2.5 sm:grid-cols-2"}>
        <button type="button" onClick={() => openPicker(cameraInputRef)} disabled={loading} className={btnCls}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-current transition group-hover:translate-x-0.5">
            {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <CameraIcon className="h-[17px] w-[17px]" />}
          </span>
          {loading ? T.analyzing[lang] : T.camera[lang]}
        </button>
        <button type="button" onClick={() => openPicker(libraryInputRef)} disabled={loading} className={btnCls}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-current transition group-hover:translate-x-0.5">
            {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <CameraIcon className="h-[17px] w-[17px]" />}
          </span>
          {loading ? T.analyzing[lang] : T.library[lang]}
        </button>
      </div>
      {!compact && <p className="text-[11.5px] leading-snug text-ink-4">{T.privacy[lang]}</p>}
      {error && <p className="rounded-xl bg-danger-tint px-3 py-2 text-[12px] font-bold leading-snug text-danger">{error}</p>}
    </div>
  );
}
