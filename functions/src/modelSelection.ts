export const FLASH_MODEL = 'gemini-3-flash-preview';
export const PRO_MODEL = 'gemini-3-pro-preview';
export const STABLE_FLASH_MODEL = 'gemini-2.5-flash';
export const STABLE_FLASH_LITE_MODEL = 'gemini-2.5-flash-lite';

export function modelCandidates(isProMode: boolean): string[] {
  return isProMode
    ? [PRO_MODEL, FLASH_MODEL, STABLE_FLASH_MODEL, STABLE_FLASH_LITE_MODEL]
    : [FLASH_MODEL, STABLE_FLASH_MODEL, STABLE_FLASH_LITE_MODEL];
}
