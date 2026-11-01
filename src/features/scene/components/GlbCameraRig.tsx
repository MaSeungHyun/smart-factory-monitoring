import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, type ComponentRef } from 'react'
import { PerspectiveCamera, Vector3, type Object3D } from 'three'

import { FACTORY_GLB_URL } from '@/features/template'
import { useMonitorState } from '@/shared/hooks/useMonitorView'
import { useGLTF } from '@/shared/lib/three/gltfLoader'
import { DEFAULT_ROBOT_ID, monitorView, type MonitorViewState } from '@/shared/stores/monitorView'

import { glbCameraPose, type CameraPose } from '../lib/glbCameraPose'
import { robotCameraPose } from '../lib/robotCameraPose'
import { scanCameraPose } from '../lib/scanCameraPose'
import { warehouseCameraPose } from '../lib/warehouseCameraPose'

/** factory.glb 카메라 노드 (대소문자 무시) */
const MAIN_CAM = 'main_cam'

const ROBOT_CAM = 'robot_cam'

const DURATION = 1.4

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2)

interface Flight {
  from: CameraPose & { fov: number }
  to: CameraPose
  elapsed: number
}

function placeCamera(camera: PerspectiveCamera, position: Vector3, fov: number) {
  camera.position.copy(position)

  camera.fov = fov

  camera.updateProjectionMatrix()
}

function goalPose(state: MonitorViewState, main: CameraPose | null, robotCam: CameraPose | null, scene: Object3D) {
  if (state.view === 'main') return main

  if (state.view === 'warehouse') return warehouseCameraPose(main?.fov)

  if (state.view === 'scan') {
    const scanner = scene.getObjectByName(state.scannerId)

    return scanner ? scanCameraPose(scanner, state.angle, robotCam?.fov ?? main?.fov) : main
  }

  if (!robotCam) return main

  const reference = scene.getObjectByName(DEFAULT_ROBOT_ID)

  const robot = scene.getObjectByName(state.robotId)

  if (!reference || !robot) return robotCam

  return robotCameraPose(robotCam, reference, robot, state.angle)
}

/**
 * 카메라: 시작은 항상 main_cam 위치/fov. 화면 상태가 바뀌면(레일 탭, 로봇 선택, 시점 버튼)
 * 목표 시점으로 위치 + OrbitControls 타깃 + fov 를 부드럽게 보간. Esc 는 메인으로.
 */
export default function GlbCameraRig() {
  const { scene: glb } = useGLTF(FACTORY_GLB_URL)

  const get = useThree((state) => state.get)

  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)

  const flight = useRef<Flight | null>(null)

  const placed = useRef(false)

  const state = useMonitorState()

  const poses = useMemo(() => ({ main: glbCameraPose(glb, MAIN_CAM), robot: glbCameraPose(glb, ROBOT_CAM) }), [glb])

  useLayoutEffect(() => {
    const { camera, scene } = get()

    const orbit = controls.current

    if (!(camera instanceof PerspectiveCamera) || !orbit) return

    if (!placed.current && poses.main) {
      placed.current = true

      placeCamera(camera, poses.main.position, poses.main.fov ?? camera.fov)

      orbit.target.copy(poses.main.target)

      orbit.update()
    }

    const goal = goalPose(state, poses.main, poses.robot, scene)

    if (!goal) return

    flight.current = {
      from: { position: camera.position.clone(), target: orbit.target.clone(), fov: camera.fov },
      to: goal,
      elapsed: 0,
    }
  }, [get, poses, state])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') monitorView.set('main')
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const point = useMemo(() => new Vector3(), [])

  useFrame(({ camera }, delta) => {
    const active = flight.current

    const orbit = controls.current

    if (!active || !orbit || !(camera instanceof PerspectiveCamera)) return

    active.elapsed = Math.min(active.elapsed + delta, DURATION)

    const k = ease(active.elapsed / DURATION)

    placeCamera(
      camera,
      point.lerpVectors(active.from.position, active.to.position, k),
      active.from.fov + ((active.to.fov ?? active.from.fov) - active.from.fov) * k,
    )

    orbit.target.lerpVectors(active.from.target, active.to.target, k)

    orbit.update()

    if (active.elapsed >= DURATION) flight.current = null
  })

  return <OrbitControls ref={controls} makeDefault enableDamping={false} />
}
