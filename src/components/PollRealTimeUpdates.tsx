'use client'

import { useEffect, useState } from 'react'
import { usePollSSE } from '@/hooks/useSSE'

interface PollRealTimeUpdatesProps {
  pollId: string
  onPollUpdate?: (poll: any) => void
  onVoteReceived?: (voteData: any, results: any) => void
  showConnectionStatus?: boolean
}

/**
 * Component that handles real-time updates for a poll
 */
export function PollRealTimeUpdates({
  pollId,
  onPollUpdate,
  onVoteReceived,
  showConnectionStatus = false
}: PollRealTimeUpdatesProps) {
  const [notifications, setNotifications] = useState<string[]>([])

  const {
    isConnected,
    isConnecting,
    error,
    connectionId,
    messageCount,
    reconnect
  } = usePollSSE(pollId, {
    onVoteUpdate: (voteData, pollResults) => {
      console.log('New vote received:', voteData)
      onVoteReceived?.(voteData, pollResults)
      onPollUpdate?.(pollResults)
      
      setNotifications(prev => [
        ...prev.slice(-4), // Keep last 4 notifications
        `New vote received at ${new Date().toLocaleTimeString()}`
      ])
    },
    onResultUpdate: (results) => {
      console.log('Poll results updated:', results)
      onPollUpdate?.(results)
    },
    onStatusChange: (status, reason) => {
      console.log('Poll status changed:', status, reason)
      setNotifications(prev => [
        ...prev.slice(-4),
        `Poll status changed to ${status}${reason ? `: ${reason}` : ''}`
      ])
    },
    onPollUpdate: (updates) => {
      console.log('Poll updated:', updates)
      onPollUpdate?.(updates)
      setNotifications(prev => [
        ...prev.slice(-4),
        `Poll updated at ${new Date().toLocaleTimeString()}`
      ])
    },
    onConnect: (connId) => {
      console.log('Connected to real-time updates:', connId)
      setNotifications(prev => [
        ...prev.slice(-4),
        'Connected to real-time updates'
      ])
    },
    onDisconnect: () => {
      console.log('Disconnected from real-time updates')
      setNotifications(prev => [
        ...prev.slice(-4),
        'Disconnected from real-time updates'
      ])
    },
    onError: (errorMsg) => {
      console.error('Real-time connection error:', errorMsg)
      setNotifications(prev => [
        ...prev.slice(-4),
        `Connection error: ${errorMsg}`
      ])
    }
  })

  // Clear notifications after 10 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications([])
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [notifications])

  if (!showConnectionStatus && notifications.length === 0) {
    return null
  }

  return (
    <div className="poll-realtime-updates">
      {showConnectionStatus && (
        <div className="connection-status mb-4 p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 
                isConnecting ? 'bg-yellow-500' : 
                'bg-red-500'
              }`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 
                 isConnecting ? 'Connecting...' : 
                 'Disconnected'}
              </span>
              {connectionId && (
                <span className="text-xs text-gray-500">
                  ID: {connectionId.slice(-8)}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {messageCount > 0 && (
                <span className="text-xs text-gray-500">
                  {messageCount} messages
                </span>
              )}
              {error && !isConnected && (
                <button
                  onClick={reconnect}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-2 text-sm text-red-600">
              Error: {error}
            </div>
          )}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="notifications space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="notification p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 animate-fade-in"
            >
              {notification}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Hook for managing poll data with real-time updates
 */
export function usePollWithRealTime(initialPoll: any) {
  const [poll, setPoll] = useState(initialPoll)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const handlePollUpdate = (updatedData: any) => {
    setPoll((prevPoll: any) => ({
      ...prevPoll,
      ...updatedData,
      options: updatedData.options || prevPoll.options,
      metadata: {
        ...prevPoll.metadata,
        ...updatedData.metadata
      }
    }))
    setLastUpdate(new Date())
  }

  const handleVoteReceived = (voteData: any, results: any) => {
    setPoll((prevPoll: any) => ({
      ...prevPoll,
      ...results,
      metadata: {
        ...prevPoll.metadata,
        totalVotes: results.totalVotes,
        uniqueVoters: results.uniqueVoters
      }
    }))
    setLastUpdate(new Date())
  }

  return {
    poll,
    lastUpdate,
    handlePollUpdate,
    handleVoteReceived,
    setPoll
  }
}