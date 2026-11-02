export type VisionKind = 'robot' | 'scan'

export const visionPort: {
  hole: HTMLElement | null
  overlay: HTMLElement | null
  kind: VisionKind | null
  id: string | null
} = {
  hole: null,
  overlay: null,
  kind: null,
  id: null,
}
