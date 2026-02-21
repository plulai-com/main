export const trackEvent = (name: string, properties?: Record<string, any>) => {
  // Mock tracking for production scale
  console.log(`[Monitoring] Event: ${name}`, properties)

  // Example PostHog integration:
  // posthog.capture(name, properties)
}

export const trackXPChange = (userId: string, amount: number, reason: string) => {
  trackEvent("xp_earned", { userId, amount, reason })
}

export const trackLevelUp = (userId: string, level: number) => {
  trackEvent("level_up", { userId, level })
}

export const trackError = (error: Error, context?: string) => {
  console.error(`[Monitoring] Error in ${context || "app"}:`, error)

  // Example Sentry integration:
  // Sentry.captureException(error)
}
