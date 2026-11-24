import { useGLTF as useDreiGLTF } from '@react-three/drei'
import { WebGLRenderer } from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

import { prepareShadowDecals } from './shadowDecals'

/**
 * 모든 GLB 로드는 여기를 거친다: KTX2(KHR_texture_basisu) 텍스처와 Meshopt 압축(factory.glb)을 디코딩.
 * Basis transcoder 는 public/basis/ 에서 제공.
 */
const TRANSCODER_PATH = `${import.meta.env.BASE_URL}basis/`

let ktx2: KTX2Loader | null = null

let supportDetected = false

function getKTX2Loader() {
  ktx2 ??= new KTX2Loader().setTranscoderPath(TRANSCODER_PATH)

  if (!supportDetected) {
    const probe = new WebGLRenderer()

    ktx2.detectSupport(probe)

    probe.dispose()
    probe.forceContextLoss()

    supportDetected = true
  }

  return ktx2
}

/** Canvas onCreated 에서 실제 렌더러로 GPU 텍스처 포맷을 다시 감지 */
export function configureKTX2(gl: WebGLRenderer) {
  ktx2 ??= new KTX2Loader().setTranscoderPath(TRANSCODER_PATH)

  ktx2.detectSupport(gl)

  supportDetected = true
}

type ExtendLoader = NonNullable<Parameters<typeof useDreiGLTF>[3]>

type LoaderKTX2 = Parameters<Parameters<ExtendLoader>[0]['setKTX2Loader']>[0]

type LoaderMeshopt = Parameters<Parameters<ExtendLoader>[0]['setMeshoptDecoder']>[0]

const extendLoader: ExtendLoader = (loader) => {
  loader.setKTX2Loader(getKTX2Loader() as unknown as LoaderKTX2)

  loader.setMeshoptDecoder(MeshoptDecoder as unknown as LoaderMeshopt)
}

/**
 * Draco 디코더 사용 여부. 모든 GLB 가 Meshopt 라서 끈다.
 * 켜 두면 drei 가 디코더를 gstatic CDN 에서 받으려 해서 오프라인 exe 에서 깨질 수 있다
 */
const USE_DRACO = false

/** 그림자 판 손질을 마친 GLB 원본 (캐시된 같은 scene 에는 한 번만) */
const prepared = new WeakSet<object>()

/** drei useGLTF + KTX2/Meshopt. 구운 그림자 판은 바닥 위에 그리도록 순서를 올린다 */
export function useGLTF(url: string) {
  const gltf = useDreiGLTF(url, USE_DRACO, true, extendLoader)

  if (!prepared.has(gltf.scene)) {
    prepareShadowDecals(gltf.scene)

    prepared.add(gltf.scene)
  }

  return gltf
}

/** Canvas 밖 Suspense 에서도 같은 캐시 키로 먼저 받는다 */
export function preloadGLTF(url: string) {
  return useDreiGLTF.preload(url, USE_DRACO, true, extendLoader)
}
