/**
 * three/webgpu 청크와 GPU 어댑터를 캔버스가 생기기 전에 미리 준비한다.
 * 캔버스는 GLB · HDR 이 다 받아진 뒤에야 마운트되므로, 그때 시작하면 청크 다운로드 · 파싱과
 * GPU 초기화가 에셋 로딩 뒤에 줄지어 붙는다. 미리 시작하면 에셋 로딩과 겹친다.
 */

type WebGPUModule = typeof import('three/webgpu')

interface GpuNavigator {
  gpu?: { requestAdapter: () => Promise<unknown> }
}

let modulePromise: Promise<WebGPUModule> | null = null

let adapterPromise: Promise<unknown> | null = null

/** three/webgpu 모듈 (한 번만 받는다. FactoryScene 의 렌더러 생성도 같은 Promise 를 쓴다) */
export function loadWebGPU() {
  modulePromise ??= import('three/webgpu')

  return modulePromise
}

/**
 * WebGPU 를 고른 경우 앱 시작 직후에 부른다: 모듈 받기 + GPU 프로세스의 WebGPU(Dawn) 깨우기.
 * 미리 받은 어댑터는 쓰지 않는다 (렌더러가 같은 옵션으로 자기 어댑터 · 디바이스를 만든다)
 */
export function prefetchWebGPU() {
  const gpu = (navigator as GpuNavigator).gpu

  if (!gpu) return

  loadWebGPU().catch(() => {
    // 실패하면 렌더러 생성 쪽이 다시 받아 보고 WebGL 로 내린다
    modulePromise = null
  })

  adapterPromise ??= gpu.requestAdapter().catch(() => null)
}