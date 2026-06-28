"use client";

import { useId, useRef, useState } from "react";
import type { Lang } from "./i18n";
import { CameraIcon } from "./icons";
import { getAuthInstance } from "../../firebase";
import { hasConsent } from "../../services/consentService";
import { getMedFromImageAI } from "../../services/aiToolsService";
import type { RecognizedMedT } from "../../schemas/aiTools";

type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });
const T = {
  camera: ml("카메라", "Camera", "カメラ", "相机"),
  library: ml("사진 선택", "Photo library", "写真を選択", "选择照片"),
  analyzing: ml("인식 중…", "Recognizing…", "認識中…", "识别中…"),
  tooBig: ml("이미지가 너무 큽니다(최대 5MB).", "Image too large (max 5MB).", "画像が大きすぎます（最大5MB）。", "图片过大（最大5MB）。"),
  badType: ml("지원하지 않는 이미지 형식입니다.", "Unsupported image type.", "未対応の画像形式です。", "不支持的图片格式。"),
  readFail: ml("이미지를 읽지 못했습니다.", "Could not read the image.", "画像を読み込めませんでした。", "无法读取图片。"),
  loginRequired: ml("처방전·약봉투 판독은 로그인 후 사용할 수 있어요.", "Sign in to scan prescriptions or medication bags.", "処方箋・薬袋の認識はログイン後に利用できます。", "登录后可识别处方或药袋。"),
  consentRequired: ml("개인정보 화면에서 민감정보 처리 동의를 먼저 저장해 주세요.", "Save sensitive-health consent in Privacy first.", "プライバシー画面で健康情報処理への同意を先に保存してください。", "请先在隐私设置中保存敏感健康信息处理同意。"),
  privacy: ml("사진은 저장하지 않고, 인식된 텍스트만 기기에 저장할 수 있어요.", "Photos are not saved; only recognized text can be stored on this device.", "写真は保存せず、認識したテキストだけを端末に保存できます。", "不保存照片，只可将识别出的文字存储在本机。"),
} as const;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const MAX_BYTES = 5 * 1024 * 1024;

function readAsBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      if (comma < 0) return reject(new Error("bad data url"));
      resolve({ base64: result.slice(comma + 1), mimeType: file.type });
    };
    reader.onerror = () => reject(new Error("read error"));
    reader.readAsDataURL(file);
  });
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

  async function openPicker(ref: React.RefObject<HTMLInputElement | null>) {
    if (loading) return;
    if (!(await ensureReady())) return;
    ref.current?.click();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ALLOWED.has(file.type)) {
      setError(T.badType[lang]);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(T.tooBig[lang]);
      return;
    }
    setLoading(true);
    try {
      const { base64, mimeType } = await readAsBase64(file);
      const rec = await getMedFromImageAI(base64, mimeType, lang);
      onRecognized(rec);
    } catch (e) {
      setError(e instanceof Error ? e.message : T.readFail[lang]);
    } finally {
      setLoading(false);
      // Allow re-selecting the same file / taking another photo.
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (libraryInputRef.current) libraryInputRef.current.value = "";
    }
  }

  const btnCls = compact
    ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[12.5px] font-bold text-ink-2 transition hover:border-brand hover:text-brand disabled:opacity-60"
    : "inline-flex h-[44px] items-center justify-center gap-2 rounded-xl bg-brand px-4 text-[14px] font-bold text-white shadow-sm transition hover:bg-brand-2 disabled:cursor-not-allowed disabled:bg-ink-4";

  return (
    <div className={compact ? "inline-flex flex-col items-start gap-1" : "space-y-2"}>
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
      <div className={compact ? "flex flex-wrap gap-2" : "flex flex-wrap gap-2.5"}>
        <button type="button" onClick={() => void openPicker(cameraInputRef)} disabled={loading} className={btnCls}>
          {loading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <CameraIcon className="h-[17px] w-[17px]" />
          )}
          {loading ? T.analyzing[lang] : T.camera[lang]}
        </button>
        <button type="button" onClick={() => void openPicker(libraryInputRef)} disabled={loading} className={btnCls}>
          {loading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <CameraIcon className="h-[17px] w-[17px]" />
          )}
          {loading ? T.analyzing[lang] : T.library[lang]}
        </button>
      </div>
      {!compact && <p className="text-[11.5px] leading-snug text-ink-4">{T.privacy[lang]}</p>}
      {error && <p className="text-[12px] leading-snug text-danger">{error}</p>}
    </div>
  );
}
