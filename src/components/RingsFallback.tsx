export function RingsFallback() {
  return (
    <svg className="hero-rings-fallback" viewBox="0 0 280 180" aria-hidden>
      <defs>
        <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3e0b0" />
          <stop offset="45%" stopColor="#d4a85c" />
          <stop offset="100%" stopColor="#8a6a38" />
        </linearGradient>
        <linearGradient id="ring-rose" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0d0c0" />
          <stop offset="50%" stopColor="#c08b74" />
          <stop offset="100%" stopColor="#8a5a4a" />
        </linearGradient>
        <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#ring-glow)" fill="none" strokeWidth="14" strokeLinecap="round">
        <ellipse
          cx="118"
          cy="96"
          rx="58"
          ry="52"
          stroke="url(#ring-rose)"
          transform="rotate(-18 118 96)"
        />
        <ellipse
          cx="168"
          cy="88"
          rx="56"
          ry="50"
          stroke="url(#ring-gold)"
          transform="rotate(22 168 88)"
        />
      </g>
    </svg>
  );
}
