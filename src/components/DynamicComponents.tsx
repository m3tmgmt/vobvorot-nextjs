'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Lazy load heavy animation components to prevent scroll blocking
const Effects = dynamic(() => import("@/components/Effects").then(mod => ({ default: mod.Effects })), { 
  ssr: false,
  loading: () => null
})

const CursorEffect = dynamic(() => import("@/components/CursorEffect"), { 
  ssr: false,
  loading: () => null
})

const ParticleSystem = dynamic(() => import("@/components/ParticleSystem"), { 
  ssr: false,
  loading: () => null
})

const MatrixEffectWrapper = dynamic(() => import("@/components/MatrixEffectWrapper"), { 
  ssr: false,
  loading: () => null
})

const KonamiActivator = dynamic(() => import("@/components/KonamiActivator"), { 
  ssr: false,
  loading: () => null
})

const SecretMenu = dynamic(() => import("@/components/SecretMenu"), { 
  ssr: false,
  loading: () => null
})

export function DynamicComponents() {
  return (
    <Suspense fallback={null}>
      <MatrixEffectWrapper />
      <CursorEffect />
      <ParticleSystem />
      <Effects />
      <KonamiActivator />
      <SecretMenu />
    </Suspense>
  )
}