import { LRUCache } from "lru-cache"

// Simple in-memory cache for common AI responses
const aiCache = new LRUCache<string, string>({
  max: 1000, // Store 1000 responses
  ttl: 1000 * 60 * 60 * 24, // 24 hour TTL
})

/**
 * Cache an AI response for a specific event/input
 */
export function getCachedAIResponse(key: string): string | undefined {
  return aiCache.get(key)
}

export function setCachedAIResponse(key: string, response: string) {
  aiCache.set(key, response)
}

/**
 * Generates a cache key based on context and language
 */
export function generateAICacheKey(context: string, lang: string, value?: number): string {
  return `${context}:${lang}:${value || ""}`
}
