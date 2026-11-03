import { useLoader } from '@react-three/fiber'

import boxUrl from '@/assets/models/box.glb?url'
import cameraUrl from '@/assets/models/main_camera.glb?url'
import hdrUrl from '@/assets/hdr/factory_hdr.exr?url'
import { FACTORY_GLB_URL } from '@/features/template'
import { EquirectEXRLoader } from '@/shared/lib/three/exrLoader'
import { preloadGLTF, useGLTF } from '@/shared/lib/three/gltfLoader'

import { MODEL_URL } from '../constants/modelUrls'

const MODEL_URLS = [FACTORY_GLB_URL, cameraUrl, boxUrl, ...Object.values(MODEL_URL)]

for (const url of MODEL_URLS) preloadGLTF(url)

useLoader.preload(EquirectEXRLoader, hdrUrl)

function SuspendGlb({ url }: { url: string }) {
  useGLTF(url)

  return null
}

function SuspendHdr() {
  useLoader(EquirectEXRLoader, hdrUrl)

  return null
}

/** 공장 GLB·HDR 이 캐시에 들어올 때까지 부모 Suspense 를 붙잡는다 */
export default function SuspendFactoryAssets() {
  return (
    <>
      {MODEL_URLS.map((url) => (
        <SuspendGlb key={url} url={url} />
      ))}

      <SuspendHdr />
    </>
  )
}
