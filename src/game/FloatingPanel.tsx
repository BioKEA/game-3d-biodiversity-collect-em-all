import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  width?: 'sm' | 'md' | 'lg' | 'xl'
}

const WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-5xl', // ~1024px — for data-dense panels like BayDex
}

export default function FloatingPanel({ title, subtitle, onClose, children, width = 'md' }: Props) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3">
      {/* Backdrop — click to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 100%)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div
        className={`relative w-full ${WIDTHS[width]} flex flex-col`}
        style={{
          maxHeight: 'calc(100% - 24px)',
          background: 'linear-gradient(135deg, rgba(10,22,40,0.97) 0%, rgba(8,16,30,0.98) 100%)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)',
          animation: 'panel-enter 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="relative z-30 flex items-center justify-between px-4 pt-3 pb-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-white font-bold text-base tracking-wide">{title}</h2>
            {subtitle && <p className="text-white/35 text-[11px] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 text-xs transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes panel-enter {
          0% { opacity: 0; transform: scale(0.95) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
