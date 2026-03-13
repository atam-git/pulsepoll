'use client'

import { PollCreationWizard } from '@/components/PollCreationWizard'

export default function CreatePollPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Create a <span className="text-blue-600">Poll</span>
        </h1>
        <PollCreationWizard />
      </div>
    </div>
  )
}
