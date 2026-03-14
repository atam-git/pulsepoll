'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { PollCreationWizard } from '@/components/PollCreationWizard'

export default function EditPollPage() {
  const router = useRouter()
  const params = useParams()
  const pollId = params.id as string
  const [poll, setPoll] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPoll()
  }, [pollId])

  const fetchPoll = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/polls/${pollId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch poll')
      }
      
      const data = await response.json()
      setPoll(data.poll)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load poll')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Poll</h2>
            <p className="text-red-600 mb-4">{error || 'Poll not found'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-6 sm:mb-8">
          Edit <span className="text-green-600">Poll</span>
        </h1>
        <PollCreationWizard existingPoll={poll} isEditing={true} />
      </div>
    </div>
  )
}
