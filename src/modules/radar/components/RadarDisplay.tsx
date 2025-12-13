import { useEffect, useRef } from 'react'

export interface RadarPoint {
  id: string
  angle: number // 0-360 degrees
  distance: number // 0-1 (percentage of max range)
  label?: string
  color?: string
  size?: number
}

export interface RadarConfig {
  size: number
  rings: number
  sweepSpeed: number // seconds per rotation
  sweepColor: string
  ringColor: string
  backgroundColor: string
  gridColor: string
  angleMarkers: boolean
  showLabels: boolean
  fadeTrail: boolean
}

interface RadarDisplayProps {
  config: RadarConfig
  points: RadarPoint[]
  onPointClick?: (point: RadarPoint) => void
}

export default function RadarDisplay({
  config,
  points,
  onPointClick,
}: RadarDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const sweepAngleRef = useRef(0)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = config.size / 2
    const centerY = config.size / 2
    const maxRadius = config.size / 2 - 40

    const drawGrid = () => {
      ctx.strokeStyle = config.gridColor
      ctx.lineWidth = 1

      // Draw concentric circles
      for (let i = 1; i <= config.rings; i++) {
        const radius = (maxRadius / config.rings) * i
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw radial lines (8 directions)
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(
          centerX + Math.cos(angle) * maxRadius,
          centerY + Math.sin(angle) * maxRadius
        )
        ctx.stroke()
      }
    }

    const drawAngleMarkers = () => {
      if (!config.angleMarkers) return

      ctx.fillStyle = config.ringColor
      ctx.font = '11px "Orbitron", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      for (let angle = 0; angle < 360; angle += 30) {
        const radian = (angle - 90) * (Math.PI / 180)
        const x = centerX + Math.cos(radian) * (maxRadius + 25)
        const y = centerY + Math.sin(radian) * (maxRadius + 25)

        ctx.save()
        ctx.translate(x, y)
        ctx.fillText(`${angle}°`, 0, 0)
        ctx.restore()
      }
    }

    const drawSweep = (sweepAngle: number) => {
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(sweepAngle)

      // Create a pie slice sweep (90 degree arc trailing behind the pointer)
      const sweepArc = Math.PI / 2 // 90 degrees

      // Create angular gradient effect by drawing multiple thin slices
      const slices = 45 // Number of gradient steps
      for (let i = 0; i < slices; i++) {
        const angle = -(i / slices) * sweepArc
        const nextAngle = -((i + 1) / slices) * sweepArc

        // Calculate opacity: brightest at leading edge (0), fading towards the back
        const progress = i / slices
        const baseOpacity = (1 - progress) * 0.05 // 5% max opacity at leading edge

        // Radial gradient from center to edge for each slice
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius)
        gradient.addColorStop(0, `rgba(149, 199, 253, 0)`) // transparent at center
        gradient.addColorStop(0.3, `rgba(149, 199, 253, ${baseOpacity * 0.3})`)
        gradient.addColorStop(0.6, `rgba(149, 199, 253, ${baseOpacity * 0.6})`)
        gradient.addColorStop(0.85, `rgba(149, 199, 253, ${baseOpacity})`)
        gradient.addColorStop(1, `rgba(149, 199, 253, ${baseOpacity * 1.2})`) // brightest at edge

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, maxRadius, angle, nextAngle, true)
        ctx.lineTo(0, 0)
        ctx.fill()
      }

      ctx.restore()
    }

    const drawPoints = (currentSweepAngle: number) => {
      points.forEach((point) => {
        const pointAngle = (point.angle - 90) * (Math.PI / 180)
        const pointRadius = point.distance * maxRadius
        const x = centerX + Math.cos(pointAngle) * pointRadius
        const y = centerY + Math.sin(pointAngle) * pointRadius

        // Calculate if point should be visible (has been swept over)
        const normalizedSweepAngle =
          ((currentSweepAngle * 180) / Math.PI + 90) % 360
        const angleDiff = (point.angle - normalizedSweepAngle + 360) % 360

        // Point is visible if sweep has passed it recently
        const isVisible = angleDiff > 0 && angleDiff < 360
        const opacity = isVisible ? Math.max(0, 1 - angleDiff / 360) : 0

        // Check if point is currently under or near the sweep (within 15 degrees)
        const isUnderSweep = angleDiff >= 345 || angleDiff <= 15

        if (opacity > 0) {
          // Draw shining light blue radial gradient for points in motion (95-99% transparency)
          if (isUnderSweep) {
            const shineGradient = ctx.createRadialGradient(
              x,
              y,
              0,
              x,
              y,
              (point.size || 6) * 8
            )
            shineGradient.addColorStop(0, 'rgba(149, 199, 253, 0.05)') // 95% transparent
            shineGradient.addColorStop(0.3, 'rgba(149, 199, 253, 0.03)') // 97% transparent
            shineGradient.addColorStop(0.6, 'rgba(149, 199, 253, 0.02)') // 98% transparent
            shineGradient.addColorStop(0.8, 'rgba(149, 199, 253, 0.01)') // 99% transparent
            shineGradient.addColorStop(1, 'rgba(149, 199, 253, 0)') // fully transparent

            ctx.fillStyle = shineGradient
            ctx.beginPath()
            ctx.arc(x, y, (point.size || 6) * 8, 0, Math.PI * 2)
            ctx.fill()
          }

          // Draw glow
          const glowGradient = ctx.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            (point.size || 6) * 3
          )
          glowGradient.addColorStop(
            0,
            (point.color || '#95C7FD') +
              Math.floor(opacity * 180)
                .toString(16)
                .padStart(2, '0')
          )
          glowGradient.addColorStop(
            0.5,
            (point.color || '#95C7FD') +
              Math.floor(opacity * 80)
                .toString(16)
                .padStart(2, '0')
          )
          glowGradient.addColorStop(1, (point.color || '#95C7FD') + '00')

          ctx.fillStyle = glowGradient
          ctx.beginPath()
          ctx.arc(x, y, (point.size || 6) * 3, 0, Math.PI * 2)
          ctx.fill()

          // Draw point
          ctx.fillStyle = point.color || '#FFFFFF'
          ctx.globalAlpha = opacity
          ctx.beginPath()
          ctx.arc(x, y, point.size || 6, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1

          // Draw label
          if (config.showLabels && point.label && opacity > 0.5) {
            ctx.fillStyle = point.color || '#95C7FD'
            ctx.font = '11px "Orbitron", monospace'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            ctx.globalAlpha = opacity
            ctx.fillText(point.label, x, y + (point.size || 6) + 4)
            ctx.globalAlpha = 1
          }
        }
      })
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const deltaTime = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      // Update sweep angle
      sweepAngleRef.current += (2 * Math.PI * deltaTime) / config.sweepSpeed
      if (sweepAngleRef.current > Math.PI * 2) {
        sweepAngleRef.current -= Math.PI * 2
      }

      // Clear canvas
      ctx.fillStyle = config.backgroundColor
      ctx.fillRect(0, 0, config.size, config.size)

      // Draw radar elements
      drawGrid()
      drawAngleMarkers()
      drawPoints(sweepAngleRef.current)
      drawSweep(sweepAngleRef.current)

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [config, points])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPointClick) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = config.size / 2
    const centerY = config.size / 2
    const maxRadius = config.size / 2 - 40

    // Check if clicked on any point
    for (const point of points) {
      const pointAngle = (point.angle - 90) * (Math.PI / 180)
      const pointRadius = point.distance * maxRadius
      const px = centerX + Math.cos(pointAngle) * pointRadius
      const py = centerY + Math.sin(pointAngle) * pointRadius

      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
      if (distance <= (point.size || 6) * 2) {
        onPointClick(point)
        break
      }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={config.size}
      height={config.size}
      className="cursor-pointer rounded-lg"
      onClick={handleCanvasClick}
      style={{ boxShadow: '0 0 40px rgba(149, 199, 253, 0.2)' }}
    />
  )
}
