/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const projectId = env.VITE_FIREBASE_PROJECT_ID || 'demo-medi-curator';
  const region = 'asia-northeast3';
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'firebase-runtime-config',
        configureServer(server) {
          server.middlewares.use('/__/firebase/init.json', (_req, res) => {
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify(firebaseConfig));
          });
        },
      },
    ],
    server: {
      proxy: {
        '/api/curate': {
          target: `http://127.0.0.1:5001/${projectId}/${region}/curate`,
          changeOrigin: true,
          rewrite: () => '',
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/unit/**/*.test.{ts,tsx}'],
      exclude: ['tests/e2e/**', 'node_modules/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'json-summary'],
        // 1차 셋업: 테스트가 작성된 모듈만 임계치 적용.
        // 후속 PR에서 pharmacyService/symptomService/PharmacyFinder/SearchHistory 추가 시 확장.
        include: [
          'src/schemas/**',
          'src/services/geminiService.ts',
          'src/components/SymptomInput.tsx',
        ],
        exclude: ['src/**/*.d.ts'],
        thresholds: {
          'src/schemas/**': { lines: 95, statements: 95, functions: 95, branches: 85 },
          'src/services/geminiService.ts': { lines: 90, statements: 90, functions: 90, branches: 80 },
          'src/components/SymptomInput.tsx': { lines: 40, statements: 40, functions: 40, branches: 40 },
        },
      },
    },
  };
});
