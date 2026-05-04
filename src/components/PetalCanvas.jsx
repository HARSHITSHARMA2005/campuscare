'use client'
import { useEffect, useRef } from 'react'

export default function PetalCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let petals = []
    let blobs = []
    let W, H

    const COLORS = [
      'rgba(255,120,170,', 'rgba(255,160,200,', 'rgba(240,64,138,',
      'rgba(255,200,220,', 'rgba(255,100,160,', 'rgba(250,180,210,',
    ]

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }

    function drawPetal(x, y, r, rot, color, alpha) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rot)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(r * 0.5, -r * 0.9, r * 1.3, -r * 0.4, r * 0.9, 0)
      ctx.bezierCurveTo(r * 1.3, r * 0.4, r * 0.5, r * 0.9, 0, 0)
      ctx.fillStyle = color + alpha + ')'
      ctx.shadowColor = color + '0.3)'
      ctx.shadowBlur = 6
      ctx.fill()
      ctx.restore()
    }

    function spawnPetal() {
      return {
        x: Math.random() * W,
        y: -20,
        r: 9 + Math.random() * 16,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        vx: (Math.random() - 0.5) * 1.4,
        vy: 0.6 + Math.random() * 1.8,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.012 + Math.random() * 0.02,
        swayAmt: 0.6 + Math.random() * 1.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0.3 + Math.random() * 0.5,
      }
    }

    function spawnBlob() {
      return {
        x: Math.random() * W, y: Math.random() * H,
        r: 80 + Math.random() * 180,
        alpha: 0.06 + Math.random() * 0.1,
        pulse: Math.random() * Math.PI * 2,
        pSpeed: 0.003 + Math.random() * 0.006,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.15,
        hue: 320 + Math.random() * 40,
      }
    }

    // Initialize AFTER resize so W and H are defined
    resize()

    for (let i = 0; i < 8; i++) blobs.push(spawnBlob())
    for (let i = 0; i < 35; i++) {
      const p = spawnPetal()
      p.y = Math.random() * H
      petals.push(p)
    }

    let frame = 0

    function draw() {
      ctx.clearRect(0, 0, W, H)

      // Glow blobs
      for (const b of blobs) {
        b.pulse += b.pSpeed
        b.x += b.vx
        b.y += b.vy
        if (b.x < -b.r) b.x = W + b.r
        if (b.x > W + b.r) b.x = -b.r
        if (b.y < -b.r) b.y = H + b.r
        if (b.y > H + b.r) b.y = -b.r

        // Guard against NaN
        if (!isFinite(b.x) || !isFinite(b.y) || !isFinite(b.r)) continue

        const a = b.alpha * (0.6 + Math.sin(b.pulse) * 0.4)
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        g.addColorStop(0, `hsla(${b.hue}, 90%, 75%, ${a})`)
        g.addColorStop(1, `hsla(${b.hue}, 90%, 75%, 0)`)
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
      }

      if (frame % 20 === 0 && petals.length < 65) petals.push(spawnPetal())

      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i]
        p.sway += p.swaySpeed
        p.x += p.vx + Math.sin(p.sway) * p.swayAmt
        p.y += p.vy
        p.rot += p.rotSpeed
        if (p.y > H + 30) { petals.splice(i, 1); continue }
        drawPetal(p.x, p.y, p.r, p.rot, p.color, p.alpha)
      }

      frame++
      animId = requestAnimationFrame(draw)
    }

    draw()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  )
}