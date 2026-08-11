import { useRef, type ElementType, type ReactNode, type CSSProperties } from 'react'
import { gsap, useGSAP } from '../lib/gsap'

type Dir = 'up' | 'down' | 'left' | 'right'

interface RevealProps {
  children: ReactNode
  as?: ElementType
  className?: string
  style?: CSSProperties
  /** direction the element slides in from */
  from?: Dir
  /** extra delay (seconds) — used for card grids to create a stagger cascade */
  delay?: number
  id?: string
}

const offset = (dir: Dir): { x?: number; y?: number } => {
  switch (dir) {
    case 'up':
      return { y: 48 }
    case 'down':
      return { y: -48 }
    case 'left':
      return { x: 60 }
    case 'right':
      return { x: -60 }
  }
}

/* GSAP + ScrollTrigger powered reveal — replaces the old IntersectionObserver version. */
export function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  style,
  from = 'up',
  delay = 0,
  id,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      gsap.from(el, {
        autoAlpha: 0,
        ...offset(from),
        duration: 0.9,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    },
    { scope: ref }
  )

  return (
    <Tag ref={ref} className={className} style={style} id={id}>
      {children}
    </Tag>
  )
}

type HeadlineLine = string | { text: string; className?: string }

interface SplitHeadlineProps {
  /** lines of text; each is split into per-character animated spans */
  lines: HeadlineLine[]
  className?: string
}

/* Hero headline: staggered per-character reveal on load. */
export function SplitHeadline({ lines, className = '' }: SplitHeadlineProps) {
  const ref = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      const chars = ref.current?.querySelectorAll('.char')
      if (!chars || !chars.length) return
      gsap.from(chars, {
        yPercent: 120,
        opacity: 0,
        rotateX: -80,
        duration: 1,
        ease: 'back.out(1.7)',
        stagger: 0.04,
        delay: 0.25,
      })
    },
    { scope: ref }
  )

  return (
    <h1 ref={ref} className={className}>
      {lines.map((line, li) => {
        const text = typeof line === 'string' ? line : line.text
        const lineClass = typeof line === 'string' ? '' : line.className ?? ''
        return (
          <span className={`line ${lineClass}`} key={li}>
            {[...text].map((c, i) => (
              <span className="char" key={i}>
                {c === ' ' ? ' ' : c}
              </span>
            ))}
            {li < lines.length - 1 && <br />}
          </span>
        )
      })}
    </h1>
  )
}

interface CountUpProps {
  /** numeric target to count up to */
  to: number
  /** text shown before the number (e.g. currency) */
  prefix?: string
  /** text shown after the number */
  suffix?: string
  className?: string
}

/* Count-up number that fires when scrolled into view. */
export function CountUp({ to, prefix = '', suffix = '', className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const obj = { val: 0 }
      gsap.to(obj, {
        val: to,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
        onUpdate: () => {
          el.textContent = `${prefix}${Math.round(obj.val)}${suffix}`
        },
      })
    },
    { scope: ref }
  )

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  )
}
