import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { ConsentRecord } from '../schemas/consent';

export type LoginProvider = 'google' | 'apple' | 'kakao';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** 현재 사용자의 최신 활성 동의(null = 미동의/철회). consent.version 이 CONSENT_VERSION 과 다르면 재동의 필요. */
  consent: ConsentRecord | null;
  /** 동의 저장 후 호출하여 컨텍스트 재조회 */
  refreshConsent: () => Promise<void>;
  loginWithProvider: (provider: LoginProvider) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
