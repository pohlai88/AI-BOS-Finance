// ============================================================================
// USE SIMULATION CONTROLLER - Extracted logic hook
// Manages stage progression, shake intensity, and collapse events
// ============================================================================

import { useState, useEffect, useCallback } from 'react'
import type { SimulationState, ShakeLevel } from './types'

interface UseSimulationControllerOptions {
  maxStages?: number
  cycleTimeMs?: number
  collapseDelayMs?: number
  autoPlay?: boolean
}

export const useSimulationController = (
  options: UseSimulationControllerOptions = {}
) => {
  const {
    maxStages = 6,
    cycleTimeMs = 2000,
    collapseDelayMs = 1500,
    autoPlay = true,
  } = options

  const [state, setState] = useState<SimulationState>({
    stage: 0,
    shakeLevel: 'none',
    isCollapsed: false,
  })

  const [isPaused, setIsPaused] = useState(!autoPlay)

  // Reset the simulation
  const reset = useCallback(() => {
    setState({
      stage: 0,
      shakeLevel: 'none',
      isCollapsed: false,
    })
  }, [])

  // Trigger manual collapse
  const triggerCollapse = useCallback(() => {
    setState((prev) => ({
      ...prev,
      shakeLevel: 'critical',
    }))

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isCollapsed: true,
        shakeLevel: 'none',
      }))
    }, collapseDelayMs)
  }, [collapseDelayMs])

  // Advance to next stage
  const advanceStage = useCallback(() => {
    setState((prev) => {
      // Reset cycle if we've completed
      if (prev.stage >= maxStages + 1) {
        return { stage: 0, shakeLevel: 'none', isCollapsed: false }
      }

      const nextStage = prev.stage + 1
      let nextShake: ShakeLevel = prev.shakeLevel

      // Progressive decay logic based on stage
      if (nextStage === Math.floor(maxStages * 0.6)) {
        nextShake = 'light'
      }
      if (nextStage === Math.floor(maxStages * 0.8)) {
        nextShake = 'moderate'
      }
      if (nextStage === maxStages) {
        nextShake = 'critical'
        // Schedule collapse
        setTimeout(() => {
          setState((s) => ({ ...s, isCollapsed: true, shakeLevel: 'none' }))
        }, collapseDelayMs)
      }

      return {
        stage: nextStage,
        shakeLevel: nextShake,
        isCollapsed: prev.isCollapsed,
      }
    })
  }, [maxStages, collapseDelayMs])

  // Auto-advance interval
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(advanceStage, cycleTimeMs)
    return () => clearInterval(interval)
  }, [isPaused, cycleTimeMs, advanceStage])

  return {
    ...state,
    isPaused,
    setIsPaused,
    reset,
    advanceStage,
    triggerCollapse,
  }
}
