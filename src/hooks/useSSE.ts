import { useEffect, useRef, useState, useCallback } from 'react'

export interface SSEMessage {
  type: string
  data: any
  timestamp?: string
}

export interface SSEConnectionState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connectionId: string | null
  lastMessage: SSEMessage | null
  messageCount: number
}

export interface UseSSEOptions {
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onMessage?: (message: SSEMessage) => void
  onConnect?: (connectionId: string) => void
  onDisconnect?: () => void
  onError?: (error: string) => void
}

/**
 * Custom hook for managing Server-Sent Events connections
 */
export function useSSE(url: string | null, options: UseSSEOptions = {}) {
  const {
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options

  const [state, setState] = useState<SSEConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    connectionId: null,
    lastMessage: null,
    messageCount: 0
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isManuallyClosedRef = useRef(false)

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!url || eventSourceRef.current) {
      return
    }

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }))

    try {
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('SSE connection opened:', url)
        reconnectAttemptsRef.current = 0
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null
        }))
      }

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data)
          
          setState(prev => ({
            ...prev,
            lastMessage: message,
            messageCount: prev.messageCount + 1
          }))

          // Handle connection message
          if (message.type === 'connection' && message.data?.connectionId) {
            setState(prev => ({
              ...prev,
              connectionId: message.data.connectionId
            }))
            onConnect?.(message.data.connectionId)
          }

          // Call message handler
          onMessage?.(message)

        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }

      eventSource.onerror = (event) => {
        console.error('SSE connection error:', event)
        
        const errorMessage = 'Connection error occurred'
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: errorMessage
        }))

        onError?.(errorMessage)

        // Attempt reconnection if not manually closed
        if (!isManuallyClosedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            cleanup()
            connect()
          }, reconnectInterval)
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setState(prev => ({
            ...prev,
            error: 'Maximum reconnection attempts reached'
          }))
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create connection'
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: errorMessage
      }))
      onError?.(errorMessage)
    }
  }, [url, onMessage, onConnect, onError, maxReconnectAttempts, reconnectInterval, cleanup])

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true
    cleanup()
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectionId: null
    }))
    onDisconnect?.()
  }, [cleanup, onDisconnect])

  const reconnect = useCallback(() => {
    isManuallyClosedRef.current = false
    reconnectAttemptsRef.current = 0
    cleanup()
    if (url) {
      connect()
    }
  }, [cleanup, connect, url])

  // Connect when URL is provided
  useEffect(() => {
    if (url && !isManuallyClosedRef.current) {
      connect()
    }
    return cleanup
  }, [url, connect, cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isManuallyClosedRef.current = true
      cleanup()
    }
  }, [cleanup])

  return {
    ...state,
    connect,
    disconnect,
    reconnect
  }
}

/**
 * Hook specifically for poll real-time updates
 */
export function usePollSSE(pollId: string | null, options: Omit<UseSSEOptions, 'onMessage'> & {
  onVoteUpdate?: (voteData: any, pollResults: any) => void
  onResultUpdate?: (results: any) => void
  onStatusChange?: (status: string, reason?: string) => void
  onPollUpdate?: (updates: any) => void
}) {
  const {
    onVoteUpdate,
    onResultUpdate,
    onStatusChange,
    onPollUpdate,
    ...sseOptions
  } = options

  const url = pollId ? `/api/polls/${pollId}/events` : null

  const handleMessage = useCallback((message: SSEMessage) => {
    switch (message.type) {
      case 'vote':
        onVoteUpdate?.(message.data.vote, message.data.results)
        break
      case 'result':
        onResultUpdate?.(message.data.results)
        break
      case 'status':
        onStatusChange?.(message.data.status, message.data.reason)
        break
      case 'poll_update':
        onPollUpdate?.(message.data.updates)
        break
      case 'heartbeat':
        // Handle heartbeat silently
        break
      default:
        console.log('Unknown SSE message type:', message.type, message.data)
    }
  }, [onVoteUpdate, onResultUpdate, onStatusChange, onPollUpdate])

  return useSSE(url, {
    ...sseOptions,
    onMessage: handleMessage
  })
}