import { NextRequest } from 'next/server'

export interface SSEConnection {
  id: string
  pollId: string
  userId?: string
  controller: ReadableStreamDefaultController
  lastPing: Date
  metadata: {
    userAgent?: string
    ipAddress?: string
    connectedAt: Date
  }
}

export interface PollUpdateEvent {
  type: 'vote' | 'result' | 'status' | 'comment' | 'poll_update'
  pollId: string
  data: any
  timestamp: Date
}

/**
 * Real-time engine for managing Server-Sent Events connections
 */
export class RealTimeEngine {
  private static instance: RealTimeEngine
  private connections: Map<string, SSEConnection> = new Map()
  private pollSubscriptions: Map<string, Set<string>> = new Map() // pollId -> connectionIds
  private heartbeatInterval: NodeJS.Timeout | null = null
  private cleanupInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.startHeartbeat()
    this.startCleanup()
  }

  static getInstance(): RealTimeEngine {
    if (!RealTimeEngine.instance) {
      RealTimeEngine.instance = new RealTimeEngine()
    }
    return RealTimeEngine.instance
  }

  /**
   * Create a new SSE connection for a poll
   */
  createConnection(
    pollId: string,
    req: NextRequest,
    userId?: string
  ): { stream: ReadableStream; connectionId: string } {
    const connectionId = this.generateConnectionId()
    
    const stream = new ReadableStream({
      start: (controller) => {
        // Create connection record
        const connection: SSEConnection = {
          id: connectionId,
          pollId,
          userId,
          controller,
          lastPing: new Date(),
          metadata: {
            userAgent: req.headers.get('user-agent') || undefined,
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
            connectedAt: new Date()
          }
        }

        // Store connection
        this.connections.set(connectionId, connection)

        // Subscribe to poll updates
        this.subscribeToPoll(pollId, connectionId)

        // Send initial connection message
        this.sendToConnection(connectionId, {
          type: 'connection',
          data: {
            connectionId,
            pollId,
            connectedAt: connection.metadata.connectedAt
          }
        })

        console.log(`SSE connection established: ${connectionId} for poll ${pollId}`)
      },
      cancel: () => {
        this.removeConnection(connectionId)
      }
    })

    return { stream, connectionId }
  }

  /**
   * Remove a connection
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      // Unsubscribe from poll
      this.unsubscribeFromPoll(connection.pollId, connectionId)
      
      // Remove connection
      this.connections.delete(connectionId)
      
      console.log(`SSE connection removed: ${connectionId}`)
    }
  }

  /**
   * Subscribe a connection to poll updates
   */
  private subscribeToPoll(pollId: string, connectionId: string): void {
    if (!this.pollSubscriptions.has(pollId)) {
      this.pollSubscriptions.set(pollId, new Set())
    }
    this.pollSubscriptions.get(pollId)!.add(connectionId)
  }

  /**
   * Unsubscribe a connection from poll updates
   */
  private unsubscribeFromPoll(pollId: string, connectionId: string): void {
    const subscribers = this.pollSubscriptions.get(pollId)
    if (subscribers) {
      subscribers.delete(connectionId)
      if (subscribers.size === 0) {
        this.pollSubscriptions.delete(pollId)
      }
    }
  }

  /**
   * Broadcast an update to all subscribers of a poll
   */
  broadcastToPoll(pollId: string, event: Omit<PollUpdateEvent, 'pollId' | 'timestamp'>): void {
    const subscribers = this.pollSubscriptions.get(pollId)
    if (!subscribers || subscribers.size === 0) {
      return
    }

    const fullEvent: PollUpdateEvent = {
      ...event,
      pollId,
      timestamp: new Date()
    }

    console.log(`Broadcasting to ${subscribers.size} connections for poll ${pollId}:`, event.type)

    subscribers.forEach(connectionId => {
      this.sendToConnection(connectionId, {
        type: event.type,
        data: fullEvent.data,
        timestamp: fullEvent.timestamp
      })
    })
  }

  /**
   * Send a message to a specific connection
   */
  private sendToConnection(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      return
    }

    try {
      const sseMessage = this.formatSSEMessage(message)
      connection.controller.enqueue(new TextEncoder().encode(sseMessage))
      connection.lastPing = new Date()
    } catch (error) {
      console.error(`Error sending to connection ${connectionId}:`, error)
      this.removeConnection(connectionId)
    }
  }

  /**
   * Format message for SSE
   */
  private formatSSEMessage(message: any): string {
    const data = JSON.stringify(message)
    return `data: ${data}\n\n`
  }

  /**
   * Send heartbeat to all connections
   */
  private sendHeartbeat(): void {
    const heartbeatMessage = {
      type: 'heartbeat',
      timestamp: new Date()
    }

    this.connections.forEach((connection, connectionId) => {
      this.sendToConnection(connectionId, heartbeatMessage)
    })
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat()
    }, 30000) // 30 seconds
  }

  /**
   * Clean up stale connections
   */
  private cleanupStaleConnections(): void {
    const now = new Date()
    const staleThreshold = 5 * 60 * 1000 // 5 minutes

    const staleConnections: string[] = []

    this.connections.forEach((connection, connectionId) => {
      const timeSinceLastPing = now.getTime() - connection.lastPing.getTime()
      if (timeSinceLastPing > staleThreshold) {
        staleConnections.push(connectionId)
      }
    })

    staleConnections.forEach(connectionId => {
      console.log(`Cleaning up stale connection: ${connectionId}`)
      this.removeConnection(connectionId)
    })

    if (staleConnections.length > 0) {
      console.log(`Cleaned up ${staleConnections.length} stale connections`)
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections()
    }, 60000) // 1 minute
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number
    connectionsByPoll: Record<string, number>
    oldestConnection?: Date
    newestConnection?: Date
  } {
    const connectionsByPoll: Record<string, number> = {}
    let oldestConnection: Date | undefined
    let newestConnection: Date | undefined

    this.connections.forEach(connection => {
      // Count by poll
      connectionsByPoll[connection.pollId] = (connectionsByPoll[connection.pollId] || 0) + 1

      // Track oldest/newest
      const connectedAt = connection.metadata.connectedAt
      if (!oldestConnection || connectedAt < oldestConnection) {
        oldestConnection = connectedAt
      }
      if (!newestConnection || connectedAt > newestConnection) {
        newestConnection = connectedAt
      }
    })

    return {
      totalConnections: this.connections.size,
      connectionsByPoll,
      oldestConnection,
      newestConnection
    }
  }

  /**
   * Get connections for a specific poll
   */
  getPollConnections(pollId: string): SSEConnection[] {
    const subscribers = this.pollSubscriptions.get(pollId)
    if (!subscribers) {
      return []
    }

    return Array.from(subscribers)
      .map(connectionId => this.connections.get(connectionId))
      .filter((connection): connection is SSEConnection => connection !== undefined)
  }

  /**
   * Shutdown the real-time engine
   */
  shutdown(): void {
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    // Close all connections
    this.connections.forEach((connection, connectionId) => {
      try {
        connection.controller.close()
      } catch (error) {
        console.error(`Error closing connection ${connectionId}:`, error)
      }
    })

    // Clear data structures
    this.connections.clear()
    this.pollSubscriptions.clear()

    console.log('Real-time engine shutdown complete')
  }
}

/**
 * Helper functions for common real-time operations
 */
export class RealTimeHelper {
  private static engine = RealTimeEngine.getInstance()

  /**
   * Broadcast vote update to poll subscribers
   */
  static broadcastVoteUpdate(pollId: string, voteData: any, pollResults: any): void {
    this.engine.broadcastToPoll(pollId, {
      type: 'vote',
      data: {
        vote: voteData,
        results: pollResults,
        timestamp: new Date()
      }
    })
  }

  /**
   * Broadcast poll result update
   */
  static broadcastResultUpdate(pollId: string, results: any): void {
    this.engine.broadcastToPoll(pollId, {
      type: 'result',
      data: {
        results,
        timestamp: new Date()
      }
    })
  }

  /**
   * Broadcast poll status change
   */
  static broadcastStatusChange(pollId: string, status: string, reason?: string): void {
    this.engine.broadcastToPoll(pollId, {
      type: 'status',
      data: {
        status,
        reason,
        timestamp: new Date()
      }
    })
  }

  /**
   * Broadcast poll update (title, description, etc.)
   */
  static broadcastPollUpdate(pollId: string, updates: any): void {
    this.engine.broadcastToPoll(pollId, {
      type: 'poll_update',
      data: {
        updates,
        timestamp: new Date()
      }
    })
  }

  /**
   * Get real-time statistics
   */
  static getStats() {
    return this.engine.getStats()
  }
}