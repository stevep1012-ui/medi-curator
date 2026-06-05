# DEPLOY-FIREBASE-2026-06-05

## Status
PARTIAL DEPLOYMENT COMPLETE

## Firebase Project
- Display name: `MediQ`
- Project ID: `mediq-kr-2026`
- Web App ID: `1:984292044393:web:e434866f0ba90490583cf8`
- Firestore location: `asia-northeast3`

## Deployed
- Firebase Hosting
- Firestore default database
- Firestore Security Rules
- Firestore indexes

## URLs
- Hosting: `https://mediq-kr-2026.web.app`
- Console: `https://console.firebase.google.com/project/mediq-kr-2026/overview`

## Pending
- Cloud Functions `curate`
- Cloud Functions `dsr`
- Functions secret `GEMINI_API_KEY`
- Authentication provider configuration
- Google Maps API key

## Notes
- Hosting currently includes rewrites for `curate` and `dsr`, but the function endpoints are not deployed.
- The obsolete `symptomHistory` index was removed because server-side symptom history is disabled.
