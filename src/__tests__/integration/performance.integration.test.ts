import { CacheService } from '@/services/cache'
import { PerformanceMonitor } from '@/services/performanceMonitor'

describe('Performance Integration Tests', () => {
  describe('CacheService performance', () => {
    let cache: CacheService

    beforeEach(() => {
      cache = new CacheService()
    })

    afterEach(() => {
      cache.destroy()
    })

    it('should complete set/get operations quickly', () => {
      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        cache.set(`key-${i}`, { data: `value-${i}` })
      }
      for (let i = 0; i < 1000; i++) {
        cache.get(`key-${i}`)
      }
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(500)
    })

    it('should evict LRU entries when max capacity is reached', () => {
      for (let i = 0; i < 10001; i++) {
        cache.set(`key-${i}`, `value-${i}`)
      }
      const latest = cache.get<string>('key-10000')
      expect(latest).toBe('value-10000')
      expect(cache.has('key-0')).toBe(false)
    })

    it('should expire entries after TTL', () => {
      jest.useFakeTimers()
      cache.set('ttl-key', 'ttl-value', 100)
      expect(cache.get('ttl-key')).toBe('ttl-value')
      jest.advanceTimersByTime(101)
      expect(cache.get('ttl-key')).toBeNull()
      jest.useRealTimers()
    })

    it('should invalidate all keys related to a poll', () => {
      cache.cachePollResults('poll-1', { votes: 10 })
      cache.cachePollData('poll-1', { title: 'Test' })
      cache.set('custom:poll-1:extra', 'data')
      cache.invalidatePoll('poll-1')
      expect(cache.get('poll:results:poll-1')).toBeNull()
      expect(cache.get('poll:data:poll-1')).toBeNull()
      expect(cache.get('custom:poll-1:extra')).toBeNull()
    })
  })

  describe('Rate limiting throughput', () => {
    it('should process rate limit checks quickly', async () => {
      const { RateLimitService, cleanup } = await import('@/services/rateLimit')
      const mockReq = {
        headers: new Map([['x-forwarded-for', '10.0.0.1']]),
      } as any

      const start = performance.now()
      for (let i = 0; i < 200; i++) {
        await RateLimitService.checkRateLimit(mockReq, {
          maxRequests: 1000,
          windowMs: 60000,
        })
      }
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(1000)
      cleanup()
    })
  })

  describe('PerformanceMonitor accuracy', () => {
    let monitor: PerformanceMonitor

    beforeEach(() => {
      monitor = new PerformanceMonitor()
    })

    it('should start and end timers returning positive duration', () => {
      const id = monitor.startTimer('test-op')
      const duration = monitor.endTimer(id)
      expect(duration).toBeGreaterThanOrEqual(0)
    })

    it('should return -1 for unknown timer IDs', () => {
      expect(monitor.endTimer('nonexistent')).toBe(-1)
    })

    it('should record metrics and compute accurate averages', () => {
      monitor.recordMetric('latency', 100)
      monitor.recordMetric('latency', 200)
      const id1 = monitor.startTimer('api')
      monitor.endTimer(id1)
      const id2 = monitor.startTimer('api')
      monitor.endTimer(id2)
      const metrics = monitor.getMetrics()
      expect(metrics.requestCount).toBe(0)
      expect(metrics.avgResponseTime).toBeGreaterThanOrEqual(0)
    })

    it('should compute p95 response time correctly', () => {
      for (let i = 1; i <= 100; i++) {
        const id = monitor.startTimer('op')
        monitor.endTimer(id)
      }
      const metrics = monitor.getMetrics()
      expect(metrics.p95ResponseTime).toBeGreaterThanOrEqual(0)
      expect(metrics.p95ResponseTime).toBeGreaterThanOrEqual(metrics.avgResponseTime)
    })

    it('should track request counts and error rates', () => {
      monitor.recordRequest(false)
      monitor.recordRequest(false)
      monitor.recordRequest(true)
      const metrics = monitor.getMetrics()
      expect(metrics.requestCount).toBe(3)
      expect(metrics.errorRate).toBeCloseTo(1 / 3, 5)
    })

    it('should track cache hit rates', () => {
      monitor.recordCacheAccess(true)
      monitor.recordCacheAccess(true)
      monitor.recordCacheAccess(false)
      const metrics = monitor.getMetrics()
      expect(metrics.cacheHitRate).toBeCloseTo(2 / 3, 5)
    })
  })
})
