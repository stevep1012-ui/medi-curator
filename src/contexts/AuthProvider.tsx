import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, authProviders, firebaseConfigured } from '../firebase';
import { getActiveConsent } from '../services/consentService';
import type { ConsentRecord } from '../schemas/consent';
import { AuthContext } from './authContext';
import type { LoginProvider } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);

  const fetchConsent = async (u: User | null) => {
    if (!u) { setConsent(null); return; }
    try { setConsent(await getActiveConsent(u.uid)); }
    catch { setConsent(null); }
  };

  useEffect(() => {
    if (!auth) {
      queueMicrotask(() => setLoading(false));
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await fetchConsent(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithProvider = async (provider: LoginProvider) => {
    if (!auth || !authProviders) return;
    await signInWithPopup(auth, authProviders[provider]);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setConsent(null);
  };

  const refreshConsent = async () => fetchConsent(user);

  return (
    <AuthContext.Provider value={{ user, loading, consent, refreshConsent, loginWithProvider, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
