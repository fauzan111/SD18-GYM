/* Central GSAP setup — register plugins once and re-export helpers. */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Avoid ScrollTrigger recalculating/refreshing on mobile URL-bar resize, which
// causes pin jumps and layout thrash while scrolling.
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger, useGSAP }
