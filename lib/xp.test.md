# XP Engine Test Documentation

## Overview
The XP engine uses atomic database transactions to ensure concurrency safety. All XP operations are handled by the `add_xp` PostgreSQL function which locks the user's row during updates.

## Unit Tests

### Test 1: Basic XP Addition
```typescript
// Test adding XP to a user
const result = await addXP(userId, 50, "Completed tutorial")

expect(result.xp).toBe(50)
expect(result.level).toBe(2) // Level 2 threshold is 50 XP
expect(result.xpEarned).toBe(50)
```

### Test 2: Level Up Detection
```typescript
// User has 100 XP (level 2), add 20 more XP
const result = await addXP(userId, 20, "Daily quest")

expect(result.xp).toBe(120)
expect(result.level).toBe(3) // Level 3 threshold is 120 XP
expect(result.leveledUp).toBe(true)
```

### Test 3: Multiple Level Ups
```typescript
// User has 0 XP, add 500 XP at once
const result = await addXP(userId, 500, "Major achievement")

expect(result.xp).toBe(500)
expect(result.level).toBe(6) // Should skip multiple levels
expect(result.leveledUp).toBe(true)
```

### Test 4: Calculate Level Function
```typescript
expect(calculateLevel(0)).toBe(1)
expect(calculateLevel(50)).toBe(2)
expect(calculateLevel(120)).toBe(3)
expect(calculateLevel(220)).toBe(4)
expect(calculateLevel(5000)).toBeGreaterThan(10) // Beyond defined thresholds
```

### Test 5: XP Progress Calculation
```typescript
// User at level 2 (50 XP) with 85 XP total
// Next level (3) requires 120 XP
// Progress: (85 - 50) / (120 - 50) = 35 / 70 = 50%
expect(getXPProgress(85, 2)).toBe(50)
```

## Concurrency Tests

### Test 6: Concurrent XP Addition (Same User)
Simulate multiple concurrent requests adding XP to the same user:

```typescript
// Simulate 10 concurrent XP additions
const promises = Array.from({ length: 10 }, () => 
  addXP(userId, 10, "Concurrent test")
)

const results = await Promise.all(promises)

// Verify total XP is correct (no lost updates)
const finalResult = await getUserStats(userId)
expect(finalResult.xp).toBe(100) // 10 * 10 XP

// Verify all XP events were logged
const events = await getXPEvents(userId)
expect(events.length).toBe(10)
```

### Test 7: Race Condition with Level Up
Test that level-up detection works correctly under concurrent load:

```typescript
// User starts with 110 XP (level 2)
// Add 10 XP twice concurrently (both should push to level 3)
const [result1, result2] = await Promise.all([
  addXP(userId, 10, "Quest 1"),
  addXP(userId, 10, "Quest 2")
])

// Final XP should be 130 (110 + 10 + 10)
const final = await getUserStats(userId)
expect(final.xp).toBe(130)
expect(final.level).toBe(3)

// At least one should report leveled up
expect(result1.leveledUp || result2.leveledUp).toBe(true)
```

## Database Verification Queries

### Verify Atomicity
```sql
-- Check that XP events match user_stats
SELECT 
  u.user_id,
  u.xp as current_xp,
  COALESCE(SUM(x.amount), 0) as total_xp_from_events
FROM user_stats u
LEFT JOIN xp_events x ON u.user_id = x.user_id
GROUP BY u.user_id, u.xp
HAVING u.xp != COALESCE(SUM(x.amount), 0);

-- Should return 0 rows if atomic operations are working correctly
```

### Verify No Lost Updates
```sql
-- Count XP events vs expected count
SELECT 
  user_id,
  COUNT(*) as event_count,
  SUM(amount) as total_xp
FROM xp_events
WHERE user_id = $1
GROUP BY user_id;
```

### Test Level Calculation Correctness
```sql
-- Verify calculated level matches stored level
SELECT 
  user_id,
  xp,
  level as stored_level,
  calculate_level(xp) as calculated_level
FROM user_stats
WHERE level != calculate_level(xp);

-- Should return 0 rows if levels are correctly calculated
```

## Performance Tests

### Test 8: High-Load Scenario
Simulate 100 users each receiving 10 XP additions:

```typescript
const users = Array.from({ length: 100 }, (_, i) => `user-${i}`)

const allPromises = users.flatMap(userId =>
  Array.from({ length: 10 }, () => addXP(userId, 10, "Load test"))
)

const start = Date.now()
await Promise.all(allPromises)
const duration = Date.now() - start

console.log(`Processed 1000 XP additions in ${duration}ms`)
expect(duration).toBeLessThan(10000) // Should complete in under 10 seconds
```

## Integration Test Checklist

- [ ] Create test user with initial XP = 0
- [ ] Add XP and verify level increases correctly
- [ ] Add XP to reach multiple level thresholds
- [ ] Verify XP events are logged correctly
- [ ] Test concurrent XP additions (no lost updates)
- [ ] Verify database transaction rollback on error
- [ ] Test XP addition with negative amounts (should fail)
- [ ] Verify RLS policies (users can only see their own XP)
- [ ] Test admin override capabilities
- [ ] Verify level calculation matches thresholds array

## Expected Behavior

1. **Atomicity**: XP additions must be atomic - no partial updates
2. **Consistency**: Total XP in user_stats must equal sum of xp_events
3. **Isolation**: Concurrent operations should not interfere with each other
4. **Durability**: Once committed, XP changes are permanent

## Error Handling

- Invalid user ID: Should throw error
- Negative XP: Should be allowed (for penalties)
- Database connection failure: Should throw and not partially update
- RLS violation: Should throw authentication error
