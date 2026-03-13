import { NextRequest, NextResponse } from 'next/server'

export interface PerformanceMetrics {
  avgResponseTime: number
  p95ResponseTime: number
  requestCount: number
  errorRate: number
  cacheHitRate: number
  activeConnections: number
}

interface TimerEntry {
  label: string
  startTime: number
}

interface MetricEntry {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp: number
}

const MAX_RESPONSE_TIMES = 10000

export class PerformanceMonitor {
  private timers = new Map<string, TimerEntry>()
  private responseTimes: { endpoint: string; duration: number }[] = []
  private requestCount = 0
  private errorCount = 0
  private cacheHits = 0
  private cacheRequests = 0
  private activeConnections = 0
  private metrics: MetricEntry[] = []
  private timerCounter = 0

  startTimer(label: string): string {
    const timerId = `${label}:${Date.now()}:${this.timerCounter++}`
    this.timers.set(timerId, {
      label,
      startTime: performance.now(),
    })
    return timerId
  }

  endTimer(timerId: string): number {
    const entry = this.timers.get(timerId)
    if (!entry) return -1

    const duration = performance.now() - entry.startTime
    this.timers.delete(timerId)

    this.responseTimes.push({ endpoint: entry.label, duration })
    if (this.responseTimes.length > MAX_RESPONSE_TIMES) {
      this.responseTimes = this.responseTimes.slice(-MAX_RESPONSE_TIMES)
    }

    return duration
  }

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({ name, value, tags, timestamp: Date.now() })

    if (this.metrics.length > MAX_RESPONSE_TIMES) {
      this.metrics = this.metrics.slice(-MAX_RESPONSE_TIMES)
    }
  }

  recordRequest(isError: boolean = false): void {
    this.requestCount++
    if (isError) this.errorCount++
  }

  recordCacheAccess(hit: boolean): void {
    this.cacheRequests++
    if (hit) this.cacheHits++
  }

  incrementConnections(): void {
    this.activeConnections++
  }

  decrementConnections(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1)
  }

  getMetrics(): PerformanceMetrics {
    return {
      avgResponseTime: this.getAverageResponseTime(),
      p95ResponseTime: this.getP95ResponseTime(),
      requestCount: this.requestCount,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      cacheHitRate: this.cacheRequests > 0 ? this.cacheHits / this.cacheRequests : 0,
      activeConnections: this.activeConnections,
    }
  }

  getAverageResponseTime(endpoint?: string): number {
    const times = endpoint
      ? this.responseTimes.filter((r) => r.endpoint === endpoint)
      : this.responseTimes

    if (times.length === 0) return 0
    const sum = times.reduce((acc, r) => acc + r.duration, 0)
    return sum / times.length
  }

  private getP95ResponseTime(): number {
    if (this.responseTimes.length === 0) return 0
    const sorted = [...this.responseTimes].sort((a, b) => a.duration - b.duration)
    const index = Math.ceil(sorted.length * 0.95) - 1
    return sorted[index].duration
  }

  withPerformanceTracking(
    handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
    label: string
  ): (req: NextRequest, context?: any) => Promise<NextResponse> {
    return async (req: NextRequest, context?: any): Promise<NextResponse> => {
      const timerId = this.startTimer(label)
      this.incrementConnections()

      try {
        const response = await handler(req, context)
        const duration = this.endTimer(timerId)
        const isError = response.status >= 400
        this.recordRequest(isError)

        this.recordMetric('response_time', duration, { endpoint: label })

        return response
      } catch (error) {
        this.endTimer(timerId)
        this.recordRequest(true)
        throw error
      } finally {
        this.decrementConnections()
      }
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()
