'use client'

import { PollCreationWizard } from '@/components/PollCreationWizard'

export default function CreatePollPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-6 sm:mb-8">
          Create a <span className="text-green-600">Poll</span>
        </h1>
        <PollCreationWizard />
      </div>
    </div>
  )
}
