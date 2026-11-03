/** 리더선: 기준점에서 위로 올라가는 길이 (px) */
export const LEADER_RISE = 90

/** 리더선: 위로 올라간 뒤 꺾여 가로로 가는 길이 (px, 오른쪽 공간이 없으면 왼쪽으로) */
export const LEADER_RUN = 48

/** 카드가 화면 위쪽 끝에서 띄우는 여백 (px, HUD 아래) */
export const LEADER_TOP = 64

/** 카드가 화면 좌우 끝에서 띄우는 여백 (px) */
export const LEADER_MARGIN = 12

/** 선 끝을 카드 테두리 안쪽으로 겹치게 넣는 길이 (px, 반픽셀 틈 방지) */
export const LEADER_OVERLAP = 1

export interface LeaderLayout {
  points: string
  cardX: number
  cardY: number
}

/** ㄱ자 리더선: 점에서 위로 올라간 뒤 옆으로 꺾이고, 선 끝이 카드 가까운 옆면의 세로 가운데에 붙는다 (실제 카드 크기 기준) */
export function leaderLayout(ax: number, ay: number, cardWidth: number, cardHeight: number, viewWidth: number): LeaderLayout {
  const right = ax + LEADER_RUN + cardWidth + LEADER_MARGIN <= viewWidth

  const ex = right ? ax + LEADER_RUN : ax - LEADER_RUN

  // 위 공간이 모자라면 덜 올라가지만 기준점 아래로는 절대 내려가지 않는다
  const turn = Math.min(Math.max(ay - LEADER_RISE, LEADER_TOP + cardHeight / 2), ay)

  const cardX = right ? ex : ex - cardWidth

  // 카드 세로 가운데를 가로선 높이에 맞춘다
  const cardY = turn - cardHeight / 2

  // 가로선을 카드 쪽으로 조금 더 넣어 카드 옆면과 끊김 없이 붙인다
  const tip = right ? ex + LEADER_OVERLAP : ex - LEADER_OVERLAP

  return { points: `${ax},${ay} ${ax},${turn} ${tip},${turn}`, cardX, cardY }
}
