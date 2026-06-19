"use client";

import { useId, useRef, useState } from "react";
import type { Lang } from "./i18n";
import { CameraIcon } from "./icons";
import { getMedFromImageAI } from "../../services/aiToolsService";
import type { RecognizedMedT } from "../../schemas/aiTools";

type ML = Record<Lang, string>;
const ml = (ko: string, en: string, ja: string, zh: string): ML => ({ ko, en, ja, zh });
const T = {
  capture: ml("사진으로 인식", "Scan a photo", "写真で認識", "拍照识别"),
  analyzing: ml("인식 중…", "Recognizing…", "認識中…", "识别中…"),
  tooBig: ml("이미지가 너무 큽니다(최대 5MB).", "Image too large (max 5MB).", "画像が大きすぎます（最大5MB）。", "图片过大（最大5MB）。"),
  badType: ml("지원하지 않는 이미지 형식입니다.", "Unsupported image type.", "未対応の画像形式です。", "不支持的图片格式。"),
  readFail: ml("이미지를 읽지 못했습니다.", "Could not read the image.", "画像を読み込めませんでした。", "无法读取图片。"),
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Allow re-selecting the same file.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const btnCls = compact
    ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[12.5px] font-bold text-ink-2 transition hover:border-brand hover:text-brand disabled:opacity-60"
    : "inline-flex h-[44px] items-center justify-center gap-2 rounded-xl bg-brand px-4 text-[14px] font-bold text-white shadow-sm transition hover:bg-brand-2 disabled:cursor-not-allowed disabled:bg-ink-4";

  return (
    <div className={compact ? "inline-flex flex-col items-start gap-1" : "space-y-2"}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} className={btnCls}>
        {loading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <CameraIcon className="h-[17px] w-[17px]" />
        )}
        {loading ? T.analyzing[lang] : T.capture[lang]}
      </button>
      {error && <p className="text-[12px] leading-snug text-danger">{error}</p>}
    </div>
  );
}
