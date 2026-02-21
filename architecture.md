# Plulai Scaling Architecture (10k+ Concurrent Users)

## Caching Strategy
- **Static Content**: Courses and lessons are cached with `revalidateTag(..., 'max')` to leverage CDN-level caching.
- **User Data**: Stats and progress use short-lived revalidation (60s) with `updateTag` on write to ensure "read-your-writes" consistency.
- **AI Responses**: Common motivational phrases are cached in an LRU (in-memory for demo, Redis for prod) to reduce LLM costs and latency.

## Concurrency & Data Integrity
- **XP Engine**: Uses PostgreSQL stored procedures (RPC) for atomic updates. `add_xp` handles locking and calculation server-side to prevent race conditions during rapid XP gain.

## Infrastructure Recommendations
- **Edge Runtime**: Use `edge` for API routes (like `/api/bloo`) where possible to reduce cold starts.
- **Redis (Upstash)**: Use for global rate limiting and session storage beyond standard JWTs.
- **PostHog**: Integrated via server-side events for performance monitoring and user journey tracking.

## Scaling Checklist
- [ ] Move `rateLimitMap` to Redis (Upstash) for multi-instance consistency.
- [ ] Implement `updateTag` in server actions for instant UI updates.
- [ ] Set up database read replicas if SQL load exceeds primary capacity.
- [ ] Configure Sentry for error tracking and bottleneck identification.
