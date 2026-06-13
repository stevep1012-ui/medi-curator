// Firebase client bootstrap.
// Config is loaded at RUNTIME from '/__/firebase/init.json' (served by Firebase
// Hosting in prod, by the Vite dev plugin locally) so no VITE_FIREBASE_* keys are
// embedded in the bundle. App Check uses reCAPTCHA Enterprise; its public site
// key (VITE_RECAPTCHA_ENTERPRISE_SITE_KEY) is the only client-embedded value and
// is safe to expose. All initialization is lazy + side-effect-free at import.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken,
  type AppCheck,
} from 'firebase/app-check';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

interface FirebaseRuntimeConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

let appPromise: Promise<FirebaseApp> | null = null;
let appCheckInstance: AppCheck | null = null;

async function loadConfig(): Promise<FirebaseRuntimeConfig> {
  const res = await fetch('/__/firebase/init.json');
  if (!res.ok) throw new Error(`firebase config load failed: ${res.status}`);
  return (await res.json()) as FirebaseRuntimeConfig;
}

export async function getFirebaseApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = loadConfig().then((config) => {
      const app = initializeApp(config);
      const siteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY as string | undefined;
      if (siteKey) {
        try {
          appCheckInstance = initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(siteKey),
            isTokenAutoRefreshEnabled: true,
          });
        } catch {
          appCheckInstance = null;
        }
      }
      return app;
    });
  }
  return appPromise;
}

export async function getAuthInstance(): Promise<Auth> {
  return getAuth(await getFirebaseApp());
}

export async function getDb(): Promise<Firestore> {
  return getFirestore(await getFirebaseApp());
}

// Returns a fresh App Check token, or null if App Check is unavailable
// (e.g. test/dev without a site key). Never throws.
export async function getAppCheckToken(): Promise<string | null> {
  try {
    await getFirebaseApp();
    if (!appCheckInstance) return null;
    const { token } = await getToken(appCheckInstance, false);
    return token;
  } catch {
    return null;
  }
}

// Returns the current user's ID token, or null if signed out. Never throws.
export async function getIdToken(): Promise<string | null> {
  try {
    const auth = await getAuthInstance();
    const user = auth.currentUser;
    return user ? await user.getIdToken() : null;
  } catch {
    return null;
  }
}

export async function signInWithGoogle(): Promise<User> {
  const auth = await getAuthInstance();
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  const auth = await getAuthInstance();
  await signOut(auth);
}

export async function watchAuth(cb: (user: User | null) => void): Promise<() => void> {
  const auth = await getAuthInstance();
  return onAuthStateChanged(auth, cb);
}
