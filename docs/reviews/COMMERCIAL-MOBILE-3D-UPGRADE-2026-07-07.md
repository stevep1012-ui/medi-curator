# Commercial Readiness and Mobile Capture Upgrade — 2026-07-07

## Scope

User requested a full product pass for paid commercial value, premium 3D interactive design, and a fix for mobile prescription/photo input recognition.

## Product audit summary

Highest-impact gaps found:

1. Mobile file picker opened after async auth/consent checks. On mobile Safari and Android Chrome, this can lose the direct user gesture and prevent the camera/photo picker from opening.
2. Large mobile camera photos could exceed the 5MB image limit before upload.
3. Some mobile file pickers can leave `file.type` blank, causing otherwise valid JPG/PNG/HEIC photos to be rejected.
4. The hero message was too generic for a paid product. It did not clearly sell the repeat-use loop.
5. The medication capture card did not strongly explain the prescription/med-bag workflow or the privacy-safe confirmation step.

## Implementation

### Mobile prescription/photo capture

- Updated `src/app/components/MedCapture.tsx`.
- Picker now opens synchronously inside the user click handler.
- Auth and sensitive-health consent checks now run after the user selects a file.
- Added mobile image MIME fallback via `src/services/imageFileService.ts`.
- Added client-side JPEG compression for oversized JPG/PNG/WebP images before sending to the server.
- Kept separate mobile paths:
  - camera: `<input type="file" accept="image/*" capture="environment">`
  - photo library: `<input type="file" accept="image/*">`
- Original images/base64 are still not persisted.

### Paid product value

- Updated hero positioning in `src/app/components/Menu.tsx` and `src/app/page.tsx`.
- Reframed the product as an AI health notebook for daily medication and symptom management.
- Added premium value chips in the hero:
  - photo recognition,
  - local med list,
  - consultation brief.
- Updated `src/app/components/ProductGrowthPanel.tsx` to emphasize subscription value:
  - reusable med list from prescription/med-bag photos,
  - consultation brief with verification questions,
  - family/caregiver lists and weekly check-ins.

### Premium 3D design layer

- Updated `src/app/globals.css`.
- Added richer fixed background depth, premium hero surface, glass-like value chips, and stronger 3D hero shell.
- Existing Three.js hero pills remain lazy-loaded and reduced-motion safe.
- Verified visually in browser: hero renders with 3D medication objects, readable text, no clipping, and no console errors.

## Verification

- `npm run test -- --pool=vmThreads --no-file-parallelism --maxWorkers=1` PASS
- `npm run lint` PASS
- `npm run build` PASS
- `npm run scan:secrets` PASS
- `npm run scan:bundle` PASS
- `npm run audit:redteam:nonlegal:report` PASS
- Local preview HTTP 200
- Browser smoke on local preview PASS
- Browser console JS errors: 0
- Visual inspection: premium 3D background and readable layout PASS

## Remaining commercial work

- Real payment provider and plan pricing are still not connected.
- Full Firebase Auth account deletion remains separate from data deletion.
- Real custom answer-email verification for non-login emails remains separate.
- Family/caregiver workflows are positioned as Plus value but still need backend product implementation.
