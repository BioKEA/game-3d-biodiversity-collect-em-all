import { useState, useEffect, memo } from 'react'

interface Props {
  tip: string | null
  onDismiss: () => void
}

const TutorialTip = memo(function TutorialTip({ tip, onDismiss }: Props) {
  const [visible, setVisible] = useState(false)
  const [currentTip, setCurrentTip] = useState<string | null>(null)

  useEffect(() => {
    if (tip && tip !== currentTip) {
      setCurrentTip(tip)
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onDismiss, 400)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [tip, currentTip, onDismiss])

  if (!currentTip) return null

  return (
    <div
      className="absolute bottom-[28%] left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[calc(100%-24px)] max-w-md"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? 0 : 8}px)`,
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <div
        className="px-3 py-2 sm:px-5 sm:py-3 rounded-xl border text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))',
          borderColor: 'rgba(251,191,36,0.25)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <p className="text-sm text-amber-200/90 font-medium leading-relaxed">
          {currentTip}
        </p>
      </div>
    </div>
  )
})

export default TutorialTip
