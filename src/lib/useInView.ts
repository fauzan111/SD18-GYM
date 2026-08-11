import { useEffect, useRef, useState } from 'react'

/**
 * Returns a ref + `inView` flag that flips true when the element is within
 * `rootMargin` of the viewport. Used to mount/unmount heavy WebGL canvases so
 * only the ones near the viewport actually render (major scroll-perf win).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(rootMargin = '200px 0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin })
    obs.observe(el)
    return () => obs.disconnect()
  }, [rootMargin])

  return { ref, inView }
}

/** True when the user has requested reduced motion. Reactive to changes. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return reduced
}
