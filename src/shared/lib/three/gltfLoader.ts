import { useGLTF as useDreiGLTF } from '@react-three/drei'
import { WebGLRenderer } from 'three'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

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

/** drei useGLTF + KTX2/Meshopt (Draco 기본값 유지) */
export function useGLTF(url: string) {
  return useDreiGLTF(url, true, true, extendLoader)
}

/** Canvas 밖 Suspense 에서도 같은 캐시 키로 먼저 받는다 */
export function preloadGLTF(url: string) {
  return useDreiGLTF.preload(url, true, true, extendLoader)
}
