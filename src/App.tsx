import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import Marquee from 'react-fast-marquee'
import Logo from './components/Logo'
import { Reveal, SplitHeadline, CountUp } from './components/anim'
import { gsap, useGSAP } from './lib/gsap'
import { usePrefersReducedMotion } from './lib/useInView'

/* Heavy WebGL scenes are code-split and lazily loaded. */
const Hero3D = lazy(() => import('./components/Hero3D'))
const FloatingWeights = lazy(() => import('./components/FloatingWeights'))
const ShaderBackdrop = lazy(() => import('./components/ShaderBackdrop'))
const EquipmentBackdrop = lazy(() => import('./components/EquipmentBackdrop'))
const SaunaScene = lazy(() => import('./components/SaunaScene'))

/* ---- Your gym details. Edit here to update the whole site. ---- */
const GYM = {
  brand1: 'THE SD',
  brandAccent: '18',
  brand2: 'GYM',
  owner: 'Faizan Khan',
  phone: '+91 9332191227',
  whatsapp: '919332191227', // digits only, for wa.me link
  email: 'Faizyyy2828@gmail.com',
  address: 'Payel Multiplaza Mall, 4th Floor',
  addressLine2: 'Near Asansol Railway Station',
  hoursWeek: 'Mon – Sat · 6:00 AM – 10:00 PM',
  hoursSun: 'Sunday · 6:00 AM – 6:00 PM',
}

const WA_LINK = `https://wa.me/${GYM.whatsapp}?text=${encodeURIComponent(
  "Hi! I'm interested in joining THE SD18 GYM."
)}`

// Google Maps embed (no API key required) for the mall location
const MAP_SRC = 'https://www.google.com/maps?q=Payel+Multiplaza+Mall+Asansol+Railway+Station&output=embed'
const MAP_LINK = 'https://www.google.com/maps/search/?api=1&query=Payel+Multiplaza+Mall+Asansol'

interface Stat {
  n: string
  l: string
  /** numeric value to count up to */
  count: number
  suffix?: string
}
const STATS: Stat[] = [
  { n: '6 AM', l: 'Opens Daily', count: 6, suffix: ' AM' },
  { n: '4', l: 'Treadmills', count: 4 },
  { n: '2', l: 'Sauna & Steam', count: 2 },
  { n: '1 Day', l: 'Free Trial', count: 1, suffix: ' Day' },
]

const MARQUEE_WORDS = [
  'STRENGTH',
  'CARDIO',
  'SAUNA',
  'STEAM BATH',
  'PERSONAL TRAINING',
  'TREADMILLS',
  'RECOVERY',
  'NO GST',
  'FREE TRIAL',
  'ASANSOL',
]

interface Facility {
  icon: string
  title: string
  desc: string
}
const FACILITIES: Facility[] = [
  { icon: '🏋️', title: 'New Weight Machines', desc: 'A full floor of brand-new weight machines covering every muscle group and movement.' },
  { icon: '🏃', title: 'Cardio Zone', desc: 'Dedicated cardio equipment with 4 treadmills to build your engine and burn fat.' },
  { icon: '🔥', title: 'Sauna Room', desc: 'Unwind, recover, and detox in our sauna after every hard session.' },
  { icon: '💨', title: 'Steam Bath', desc: 'Loosen up tight muscles and speed up recovery in the steam bath.' },
  { icon: '💪', title: 'Personal Training', desc: 'One-on-one coaching packages to hit your goals faster with expert guidance.' },
  { icon: '✅', title: 'No Hidden Charges', desc: 'Transparent pricing — no GST, no extra fees. What you see is what you pay.' },
]

interface Plan {
  name: string
  price: string
  features: string[]
  featured: boolean
  cta: string
}
const PLANS: Plan[] = [
  { name: '3 Months', price: '6,000', features: ['Full gym access', 'All weight & cardio machines', 'Sauna & steam bath'], featured: false, cta: 'Get Started' },
  { name: '6 Months', price: '8,000', features: ['Everything in 3 months', 'Best short-term value', 'Sauna & steam bath'], featured: false, cta: 'Choose Plan' },
  { name: '12 Months', price: '15,000', features: ['Everything included', 'Lowest monthly cost', 'Priority support'], featured: true, cta: 'Join Now' },
]

interface Trial {
  name: string
  price: string
  unit: string
  desc: string
}
const TRIALS: Trial[] = [
  { name: 'Free Trial', price: '0', unit: '1 Day', desc: 'Come try the floor, machines, and facilities — completely free for a day.' },
  { name: 'Day Pass', price: '299', unit: 'Per Day', desc: 'Drop in for a single session with full access to all equipment.' },
  { name: 'PT · 12 Sessions', price: '8,000', unit: 'Personal Training', desc: '12 one-on-one personal training sessions with a dedicated coach.' },
  { name: 'PT · 24 Sessions', price: '14,000', unit: 'Personal Training', desc: '24 one-on-one sessions — the fastest path to serious results.' },
]

/* Aesthetic torch: a soft warm light that follows the cursor and lights up
   the dark page. Pointer-driven and rAF-throttled. */
function TorchCursor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.setProperty('--tx', `${x}px`)
          el.style.setProperty('--ty', `${y}px`)
          el.classList.add('active')
          raf = 0
        })
      }
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return <div className="torch" ref={ref} aria-hidden="true" />
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <Logo size={30} tagline={false} />
      <div className="nav-links">
        <a href="#facilities">Facilities</a>
        <a href="#pricing">Membership</a>
        <a href="#trials">Trial & PT</a>
        <a href="#contact">Contact</a>
        <a href={WA_LINK} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '12px 24px' }}>
          Join on WhatsApp
        </a>
      </div>
    </nav>
  )
}

/* Pinned + parallax creed band with a custom WebGL shader behind it. */
function CreedBand() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      // Respect reduced-motion: skip the pinned scrub timeline entirely (no
      // pin/scrub layout work), leaving the band as a static, readable panel.
      if (reduced) return
      const inner = el.querySelector('.creed-inner')
      const words = el.querySelectorAll('.creed-word')

      const mm = gsap.matchMedia()

      // Desktop only: full pinned + scrubbed parallax. Pinning is unreliable on
      // mobile (it re-lays-out and jumps the scroll position as the URL bar and
      // lazy content change the viewport), so we never pin on small screens.
      mm.add('(min-width: 861px)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top top',
            end: '+=120%',
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        })
        tl.from(words, { yPercent: 130, opacity: 0, stagger: 0.18, ease: 'none' })
          .to(inner, { scale: 1.12, ease: 'none' }, 0)
      })

      // Mobile: a lightweight, non-pinned reveal — no scroll hijacking.
      mm.add('(max-width: 860px)', () => {
        gsap.from(words, {
          yPercent: 40,
          opacity: 0,
          stagger: 0.12,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 75%' },
        })
      })
    },
    { scope: ref, dependencies: [reduced] }
  )

  return (
    <section className="creed" ref={ref}>
      <Suspense fallback={null}>
        <ShaderBackdrop />
      </Suspense>
      <div className="creed-overlay" />
      <div className="creed-inner">
        <div className="creed-copy">
          <div className="eyebrow">The SD18 Creed</div>
          <h2 className="creed-line">
            <span className="creed-word">Fly</span> <span className="creed-word">towards</span>{' '}
            <span className="creed-word accent">your</span> <span className="creed-word accent">dream.</span>
          </h2>
          <p className="creed-sub">Show up. Lift heavy. Recover well. Repeat — in the heart of Asansol.</p>
          <div className="creed-tag">🔥 Unwind in our sauna &amp; steam bath after every session.</div>
        </div>
        <div className="creed-scene" aria-hidden="true">
          <Suspense fallback={null}>
            <SaunaScene />
          </Suspense>
          <span className="scene-caption">Sauna &amp; Steam Recovery</span>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  // Smooth-scroll for in-page anchor links. This replaces CSS `scroll-behavior:
  // smooth`, which we removed because it conflicts with GSAP ScrollTrigger and
  // caused the page to auto-scroll on mobile. Here we only animate scrolling in
  // response to an actual anchor click — never during ScrollTrigger's own updates.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
      if (!link) return
      const id = link.getAttribute('href')?.slice(1)
      if (!id) return
      const target = document.getElementById(id)
      if (!target) return
      e.preventDefault()
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <>
      <TorchCursor />
      <Navbar />

      {/* HERO */}
      <header className="hero">
        <Suspense fallback={<div className="hero-canvas hero-canvas-fallback" />}>
          <Hero3D />
        </Suspense>
        <div className="container hero-content">
          <div className="eyebrow">Asansol · Strength · Cardio · Recovery</div>
          <SplitHeadline lines={['Forge Your', { text: 'Limits.', className: 'accent' }]} />
          <p className="hero-tag">
            THE SD18 GYM — new weight machines, a full cardio zone, sauna &amp; steam bath. Right above Payel Multiplaza
            Mall, near Asansol Railway Station.
          </p>
          <div className="hero-actions">
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="btn btn-primary">
              Book Free Trial →
            </a>
            <a href="#pricing" className="btn btn-ghost">
              View Membership
            </a>
          </div>
        </div>
        <div className="hero-fade" />
        <div className="scroll-hint">
          Scroll<span>↓</span>
        </div>
      </header>

      {/* STATS */}
      <section className="container" style={{ paddingTop: 0 }}>
        <div className="stats">
          {STATS.map((s) => (
            <div className="stat" key={s.l}>
              <h3>
                <CountUp to={s.count} suffix={s.suffix} />
              </h3>
              <p>{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* KEYWORD MARQUEE */}
      <div className="marquee-strip">
        <Marquee gradient={false} speed={55} autoFill>
          {MARQUEE_WORDS.map((w) => (
            <span className="marquee-item" key={w}>
              {w}
              <span className="marquee-dot">✦</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* FACILITIES — with ambient floating 3D equipment behind it */}
      <section className="section container equip-section" id="facilities">
        <Suspense fallback={null}>
          <EquipmentBackdrop
            items={[
              { piece: 'kettlebell', position: [-4.6, 1.6, -1], scale: 0.85, spin: 0.4 },
              { piece: 'dumbbell', position: [4.4, -1.8, -1.5], scale: 0.7, spin: 0.35 },
              { piece: 'plate', position: [4.2, 2, -2], scale: 0.7, spin: 0.6 },
            ]}
          />
        </Suspense>
        <Reveal>
          <div className="eyebrow">Everything You Need</div>
          <h2 className="section-title">
            World-Class
            <br />
            Facilities
          </h2>
          <p className="section-sub">New machines, cardio, and recovery — all under one roof in the heart of Asansol.</p>
        </Reveal>
        <div className="grid-3">
          {FACILITIES.map((c, i) => (
            <Reveal className="card" key={c.title} delay={(i % 3) * 0.1}>
              <div className="icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PINNED CREED BAND (parallax + custom WebGL shader) */}
      <CreedBand />

      {/* MEMBERSHIP PRICING — with ambient floating 3D weights behind it */}
      <section className="section container pricing-section" id="pricing">
        <Suspense fallback={null}>
          <div className="pricing-webgl" aria-hidden="true">
            <FloatingWeights />
          </div>
        </Suspense>
        <Reveal>
          <div className="eyebrow">No GST · No Extra Charges</div>
          <h2 className="section-title">Membership Plans</h2>
          <p className="section-sub">Straightforward pricing in INR. The longer you commit, the more you save.</p>
        </Reveal>
        <div className="grid-3">
          {PLANS.map((p, i) => (
            <Reveal className={`price-card ${p.featured ? 'featured' : ''}`} key={p.name} delay={i * 0.1}>
              {p.featured && <div className="price-badge">Best Value</div>}
              <h3>{p.name}</h3>
              <div className="price">₹{p.price}</div>
              <ul className="price-list">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noreferrer"
                className={`btn ${p.featured ? 'btn-primary' : 'btn-ghost'}`}
                style={{ marginTop: 'auto', justifyContent: 'center' }}
              >
                {p.cta}
              </a>
            </Reveal>
          ))}
        </div>
        <p className="policy-note">
          All memberships are non-refundable, non-transferable, and cannot be cancelled once activated.
        </p>
      </section>

      {/* TRIAL & PERSONAL TRAINING — with ambient floating 3D equipment */}
      <section className="section container equip-section" id="trials">
        <Suspense fallback={null}>
          <EquipmentBackdrop
            items={[
              { piece: 'barbell', position: [-4.3, 1.9, -2], scale: 0.5, spin: 0.25 },
              { piece: 'plate', position: [-4.4, -1.8, -1], scale: 0.6, spin: 0.5 },
              { piece: 'kettlebell', position: [4.6, -1.4, -1.5], scale: 0.75, spin: 0.45 },
            ]}
          />
        </Suspense>
        <Reveal>
          <div className="eyebrow">Try Us · Train With Us</div>
          <h2 className="section-title">Trials &amp; Personal Training</h2>
          <p className="section-sub">New here? Start with a free day. Ready to level up? Train one-on-one with a coach.</p>
        </Reveal>
        <div className="grid-4">
          {TRIALS.map((t, i) => (
            <Reveal className="card trial-card" key={t.name} delay={(i % 4) * 0.08}>
              <div className="trial-unit">{t.unit}</div>
              <h3>{t.name}</h3>
              <div className="trial-price">{t.price === '0' ? 'FREE' : `₹${t.price}`}</div>
              <p>{t.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* VISIT US — map + contact person */}
      <section className="section container" id="visit">
        <Reveal>
          <div className="eyebrow">Come Train With Us</div>
          <h2 className="section-title">Visit The Gym</h2>
          <p className="section-sub">Find us on the 4th floor of Payel Multiplaza Mall, right beside Asansol Railway Station.</p>
        </Reveal>
        <div className="visit-grid">
          <Reveal className="map-wrap" from="right">
            <iframe
              title="THE SD18 GYM location"
              src={MAP_SRC}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a href={MAP_LINK} target="_blank" rel="noreferrer" className="btn btn-ghost map-btn">
              Open in Google Maps ↗
            </a>
          </Reveal>

          <Reveal className="person-card" from="left">
            <div className="person-photo">
              <img
                src={`${import.meta.env.BASE_URL}faizan.jpg`}
                alt={GYM.owner}
                width={800}
                height={600}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="person-body">
              <div className="eyebrow">Your Contact</div>
              <h3>{GYM.owner}</h3>
              <p className="person-role">Head Coach · SD18 GYM</p>
              <div className="person-links">
                <a href={WA_LINK} target="_blank" rel="noreferrer" className="btn btn-primary">
                  💬 WhatsApp
                </a>
                <a href={`tel:${GYM.phone.replace(/\s/g, '')}`} className="btn btn-ghost">
                  📞 Call
                </a>
              </div>
              <a className="person-mail" href={`mailto:${GYM.email}`}>
                {GYM.email}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="section container">
        <Reveal className="cta-band">
          <h2>
            Your First Day
            <br />
            Is Free.
          </h2>
          <p>Come tour the floor, try the machines, and feel the vibe. Message us on WhatsApp to book.</p>
          <a href={WA_LINK} target="_blank" rel="noreferrer" className="btn btn-primary">
            Claim Free Trial
          </a>
        </Reveal>
      </section>

      {/* FOOTER / CONTACT */}
      <footer className="footer" id="contact">
        <div className="container footer-grid">
          <div>
            <Logo size={30} />
            <p style={{ marginTop: 16 }}>{GYM.address}</p>
            <p>{GYM.addressLine2}</p>
          </div>
          <div>
            <h4>Hours</h4>
            <p>{GYM.hoursWeek}</p>
            <p>{GYM.hoursSun}</p>
          </div>
          <div>
            <h4>Contact</h4>
            <p>{GYM.owner}</p>
            <a href={`tel:${GYM.phone.replace(/\s/g, '')}`}>{GYM.phone}</a>
            <a href={WA_LINK} target="_blank" rel="noreferrer">
              WhatsApp us
            </a>
            <a href={`mailto:${GYM.email}`}>{GYM.email}</a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} THE SD18 GYM. All rights reserved.</span>
          <span>Fly Towards Your Dream · Asansol</span>
        </div>
      </footer>
    </>
  )
}
