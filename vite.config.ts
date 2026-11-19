import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // 벤더 청크 분리: 앱 코드만 바뀌면 three · react 청크는 캐시에 그대로 남는다.
  // three/webgpu 는 WebGPU 를 고를 때만 동적 import 하므로 three 그룹에서 뺀다
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three',
              test: (id) => /[\\/]node_modules[\\/]three[\\/]/.test(id) && !/three\.(webgpu|tsl)/.test(id),
              priority: 30,
            },
            {
              name: 'r3f',
              test: /[\\/]node_modules[\\/](@react-three|three-stdlib|three-mesh-bvh|camera-controls|maath|troika-[^\\/]+|suspend-react|its-fine|@monogrid|stats-gl|detect-gpu|meshline|@use-gesture)[\\/]/,
              priority: 20,
            },
            {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|zustand|use-sync-external-store)[\\/]/,
              // r3f 그룹보다 먼저 잡아야 진입 청크(스플래시)가 three · r3f 를 끌고 오지 않는다
              priority: 25,
            },
            {
              name: 'ui',
              test: /[\\/]node_modules[\\/](@radix-ui|@floating-ui|motion|motion-dom|motion-utils|framer-motion|lucide-react)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
