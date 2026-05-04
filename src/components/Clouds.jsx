'use client'

const CloudShape = ({ width = 200, opacity = 0.9, color = '#fff' }) => (
  <svg width={width} viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
    <ellipse cx="100" cy="55" rx="80" ry="28" fill={color} />
    <ellipse cx="70" cy="45" rx="45" ry="35" fill={color} />
    <ellipse cx="120" cy="40" rx="50" ry="38" fill={color} />
    <ellipse cx="150" cy="50" rx="38" ry="28" fill={color} />
    <ellipse cx="45" cy="55" rx="32" ry="22" fill={color} />
    {/* Shimmer highlight */}
    <ellipse cx="95" cy="28" rx="30" ry="14" fill="rgba(255,255,255,0.6)" />
  </svg>
)

const clouds = [
  { id: 1, top: '8%',  width: 260, duration: 55, delay: 0,    opacity: 0.88, scale: 1,    color: '#fff' },
  { id: 2, top: '20%', width: 180, duration: 72, delay: -18,   opacity: 0.75, scale: 0.85, color: '#fff5f8' },
  { id: 3, top: '35%', width: 320, duration: 48, delay: -10,   opacity: 0.65, scale: 1.1,  color: '#fff' },
  { id: 4, top: '5%',  width: 140, duration: 90, delay: -35,   opacity: 0.55, scale: 0.7,  color: '#ffe8f2' },
  { id: 5, top: '50%', width: 200, duration: 65, delay: -22,   opacity: 0.45, scale: 0.95, color: '#fff' },
  { id: 6, top: '15%', width: 240, duration: 80, delay: -50,   opacity: 0.6,  scale: 1.05, color: '#fff0f6' },
  { id: 7, top: '60%', width: 160, duration: 58, delay: -8,    opacity: 0.35, scale: 0.8,  color: '#fff' },
  { id: 8, top: '42%', width: 290, duration: 95, delay: -60,   opacity: 0.4,  scale: 1.2,  color: '#ffe0ee' },
]

export default function Clouds() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
      {clouds.map(c => (
        <div
          key={c.id}
          style={{
            position: 'absolute',
            top: c.top,
            left: '-300px',
            transform: `scale(${c.scale})`,
            transformOrigin: 'left center',
            animation: `cloud-drift ${c.duration}s ${c.delay}s linear infinite`,
            filter: 'drop-shadow(0 12px 32px rgba(255,130,180,0.18))',
          }}
        >
          <CloudShape width={c.width} opacity={c.opacity} color={c.color} />
        </div>
      ))}
    </div>
  )
}
