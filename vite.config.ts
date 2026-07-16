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
        '/api/interaction': {
          target: `http://127.0.0.1:5001/${projectId}/${region}/interaction`,
          changeOrigin: true,
          rewrite: () => '',
        },
        '/api/pairing': {
          target: `http://127.0.0.1:5001/${projectId}/${region}/pairing`,
          changeOrigin: true,
          rewrite: () => '',
        },
        '/api/recognize-med': {
          target: `http://127.0.0.1:5001/${projectId}/${region}/recognizeMed`,
          changeOrigin: true,
          rewrite: () => '',
        },
        '/api/pharmacies': {
          target: `http://127.0.0.1:5001/${projectId}/${region}/pharmacies`,
          changeOrigin: true,
          // 쿼리스트링(lat/lng/radius)은 보존하고 경로만 함수 루트로.
          rewrite: (p) => p.replace(/^\/api\/pharmacies/, ''),
        },
      },
    },
    build: {
      // Firebase SDK를 별도 벤더 청크로 분리해 초기 번들을 줄인다(앱 코드와 캐시 분리).
      // 분리 후에도 firebase 청크가 500kB를 넘어 경고가 남으므로 임계치를 올려 무음 처리.
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // rolldown-vite는 함수 형식만 허용. firebase/@firebase 모듈을 한 청크로 묶는다.
          manualChunks(id: string) {
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'firebase';
            }
            return undefined;
          },
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
