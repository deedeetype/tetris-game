'use client'

import dynamic from 'next/dynamic'

const Tetris = dynamic(() => import('@/components/Tetris'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading Tetris...</div>
    </div>
  )
})

export default function Home() {
  return <Tetris />
}
