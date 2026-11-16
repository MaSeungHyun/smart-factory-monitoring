import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { isElectron } from '@/shared/lib/isElectron'

import './index.css'

const root = createRoot(document.getElementById('root')!)

// 일렉트론 스플래시 창이면 스플래시만 불러온다. 스플래시가 three.js 등 본 화면 번들을 기다리지 않게
const splash = isElectron() && new URLSearchParams(window.location.search).has('splash')

if (splash) {
  void import('@/app/components/SplashScreen').then(({ default: SplashScreen }) =>
    root.render(
      <StrictMode>
        <SplashScreen />
      </StrictMode>,
    ),
  )
} else {
  void Promise.all([import('@/app/App'), import('@/shared/components/ui/Tooltip')]).then(
    ([{ default: App }, { TooltipProvider }]) =>
      root.render(
        <StrictMode>
          <TooltipProvider delayDuration={300}>
            <App />
          </TooltipProvider>
        </StrictMode>,
      ),
  )
}
