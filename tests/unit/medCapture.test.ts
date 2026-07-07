import { describe, expect, it } from 'vitest';
import { normalizeImageMimeType } from '../../src/services/imageFileService';

describe('MedCapture mobile image handling', () => {
  it('keeps supported browser-provided mime types', () => {
    expect(normalizeImageMimeType({ type: 'image/heic', name: 'camera.HEIC' } as File)).toBe('image/heic');
    expect(normalizeImageMimeType({ type: 'image/webp', name: 'photo.webp' } as File)).toBe('image/webp');
  });

  it('infers image type when mobile file picker leaves file.type blank', () => {
    expect(normalizeImageMimeType({ type: '', name: 'prescription.JPG' } as File)).toBe('image/jpeg');
    expect(normalizeImageMimeType({ type: '', name: 'med-bag.png' } as File)).toBe('image/png');
    expect(normalizeImageMimeType({ type: '', name: 'album.heif' } as File)).toBe('image/heif');
  });

  it('returns unsupported mime type unchanged so UI can reject it', () => {
    expect(normalizeImageMimeType({ type: 'application/pdf', name: 'rx.pdf' } as File)).toBe('application/pdf');
  });
});
