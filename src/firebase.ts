import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, type Auth, type AuthProvider } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let authProviders: Record<'google' | 'apple' | 'kakao', AuthProvider> | null = null;

if (firebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  authProviders = {
    google: new GoogleAuthProvider(),
    apple: new OAuthProvider('apple.com'),
    // Firebase Console > Authentication > Sign-in method 에서 OIDC provider ID를 `kakao`로 등록해야 함.
    kakao: new OAuthProvider('oidc.kakao'),
  };
  db = getFirestore(app);
}

export { auth, authProviders, db };
