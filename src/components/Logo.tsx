interface LogoProps {
  size?: number
  tagline?: boolean
}

/* Vector recreation of the SD18 mark — sharp on dark, says GYM, with tagline. */
export default function Logo({ size = 34, tagline = true }: LogoProps) {
  return (
    <div className="logo" style={{ ['--logo-size' as string]: `${size}px` }}>
      <svg className="logo-mark" viewBox="0 0 60 60" aria-hidden="true">
        <g>
          <polygon points="8,52 26,8 34,8 16,52" fill="#e11d2a" />
          <polygon points="22,52 40,8 48,8 30,52" fill="#f4f4f5" />
        </g>
      </svg>
      <div className="logo-text">
        <div className="logo-word">
          SD<span className="logo-accent">18</span> <span className="logo-sub">GYM</span>
        </div>
        {tagline && <div className="logo-tag">Fly towards your dream</div>}
      </div>
    </div>
  )
}
