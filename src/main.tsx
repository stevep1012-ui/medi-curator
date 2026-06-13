import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './app/globals.css';
import Home from './app/page';

// Vite 진입점: react-handoff 셸(app/page.tsx)을 마운트한다.
// 셸이 i18n·테마·인증을 자체 포함하므로 별도 Provider 래핑은 필요 없다.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
