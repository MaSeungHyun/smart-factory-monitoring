/**
 * WebGLRenderer.setViewport / setScissor 원점은 왼쪽 아래,
 * WebGPURenderer 는 왼쪽 위다 (three r187: WebGPU 백엔드는 y 를 뒤집지 않고 GPU 에 그대로 넘긴다).
 * 아래 기준 y 를 렌더러 원점에 맞춰 준다.
 *
 * setViewport / setScissor 인자는 논리 픽셀(getSize)이다.
 * 양쪽 렌더러가 내부에서 pixelRatio 를 곱해 드로잉 버퍼 좌표로 바꾼다.
 * 뒤집기와 클램프도 getSize 단위로 해야 한다 (getDrawingBufferSize 를 쓰면 비율이 한 번 더 곱인다).
 */

/** three/webgpu WebGPURenderer 인스턴스인지 (모듈을 직접 가져오지 않고 플래그만 본다) */
export function isWebGPURenderer(gl: unknown) {
  return Boolean(gl) && typeof gl === 'object' && (gl as { isWebGPURenderer?: boolean }).isWebGPURenderer === true
}

/**
 * 뷰포트·시저 y.
 * `yFromBottom` 은 캔버스 아래쪽부터의 거리 (WebGL 과 같은 값, getSize 단위).
 * WebGPU 는 `canvasHeight - yFromBottom - height` 로 위쪽 원점에 맞춘다.
 */
export function viewportY(gl: unknown, yFromBottom: number, height: number, canvasHeight: number) {
  if (!isWebGPURenderer(gl)) return yFromBottom

  return canvasHeight - yFromBottom - height
}

/**
 * 뷰포트·시저 사각형을 논리 픽셀 정수로 캔버스 안 [0, width]×[0, height] 에 자른다.
 * 접혔거나 화면 밖이라 남는 영역이 없으면 null.
 */
export function clampViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const left = Math.max(0, Math.floor(x))

  const top = Math.max(0, Math.floor(y))

  const right = Math.min(Math.floor(canvasWidth), Math.floor(x + width))

  const bottom = Math.min(Math.floor(canvasHeight), Math.floor(y + height))

  const nextWidth = right - left

  const nextHeight = bottom - top

  if (nextWidth <= 0 || nextHeight <= 0) return null

  return { x: left, y: top, width: nextWidth, height: nextHeight }
}
