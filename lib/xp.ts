export function triggerXPFloat(amount: number, x?: number, y?: number) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent("trigger-xp-float", {
      detail: { amount, x, y },
    }),
  )
}

/**
 * Triggers the Level Up modal and confetti effects
 * @param level The new level reached
 */
export function triggerLevelUp(level: number) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent("trigger-level-up", {
      detail: { level },
    }),
  )
}
