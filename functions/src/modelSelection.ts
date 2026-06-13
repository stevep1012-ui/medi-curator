export const FLASH_MODEL = 'gemini-3-flash-preview';
export const PRO_MODEL = 'gemini-3-pro-preview';

export function modelCandidates(isProMode: boolean): string[] {
  return isProMode ? [PRO_MODEL, FLASH_MODEL] : [FLASH_MODEL];
}
