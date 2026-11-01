/**
 * 상주 3D 뷰 DOM 이동: Canvas 는 앱 전체에서 한 번만 마운트하고,
 * 화면(탭)이 바뀌면 Canvas 를 감싼 DOM 노드만 현재 화면의 슬롯으로 옮긴다 (WebGL 컨텍스트 / GLB 유지).
 */
let host: HTMLElement | null = null

let parking: HTMLElement | null = null

let slot: HTMLElement | null = null

function place() {
  if (!host) return

  const target = slot ?? parking

  if (target && host.parentElement !== target) target.prepend(host)
}

export const sceneHost = {
  register(element: HTMLElement | null, park: HTMLElement | null) {
    host = element

    parking = park

    place()
  },

  attach(element: HTMLElement) {
    slot = element

    place()
  },

  detach(element: HTMLElement) {
    if (slot !== element) return

    slot = null

    place()
  },
}
