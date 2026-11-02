import AlertPanel from './AlertPanel'

/** 3D 뷰포트 우상단. 전체 보기·오른쪽 패널과 상관없이 뷰포트에 붙는다 */
export default function ViewportAlert() {
  return (
    <div className="absolute top-[18px] right-3.5 z-40 w-[min(428px,calc(100%-28px))]">
      <AlertPanel />
    </div>
  )
}
