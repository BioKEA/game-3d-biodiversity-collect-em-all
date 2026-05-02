import { useState, useEffect } from 'react'

interface Props {
  onDismiss: () => void
}

export default function ConservationPrompt({ onDismiss }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onClick={handleDismiss}
    >
      <div
        className="relative max-w-sm w-full rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(16,24,40,0.95), rgba(10,30,20,0.95))',
          border: '1px solid rgba(74,222,128,0.15)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(74,222,128,0.05)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
          transition: 'transform 0.3s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with nature imagery */}
        <div className="relative px-6 pt-6 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🌿</span>
            <h3 className="text-white font-bold text-base">Real creatures need your help too</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <p className="text-white/60 text-sm leading-relaxed">
            The creatures in this game are inspired by California&apos;s real wildlife — many of which face real conservation challenges.
          </p>

          {/* CalATBI link */}
          <a
            href="https://www.calatbi.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(74,222,128,0.08), rgba(34,197,94,0.04))',
              border: '1px solid rgba(74,222,128,0.15)',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🔬</span>
              <div>
                <p className="text-emerald-300 text-sm font-semibold mb-1">
                  Love collecting creatures? Do it for real
                </p>
                <p className="text-white/50 text-xs leading-relaxed">
                  CalATBI catalogs every species in California&apos;s wild places. Join citizen scientists documenting real biodiversity.
                </p>
                <p className="text-emerald-400/60 text-[10px] mt-2 font-medium">
                  calatbi.org →
                </p>
              </div>
            </div>
          </a>

          {/* CalAlive link */}
          <a
            href="https://www.calalive.org/get-involved"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(59,130,246,0.04))',
              border: '1px solid rgba(96,165,250,0.15)',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🦋</span>
              <div>
                <p className="text-blue-300 text-sm font-semibold mb-1">
                  Support biodiversity in California
                </p>
                <p className="text-white/50 text-xs leading-relaxed">
                  CalAlive connects people with conservation efforts across the state — volunteer, donate, or spread the word.
                </p>
                <p className="text-blue-400/60 text-[10px] mt-2 font-medium">
                  calalive.org/get-involved →
                </p>
              </div>
            </div>
          </a>

          <div className="pt-1">
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl text-white/50 text-xs hover:text-white/70 transition-colors"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
