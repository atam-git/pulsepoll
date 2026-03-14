'use client'

import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { PollCreationWizard } from '@/components/PollCreationWizard'

export default function CreatePollPage() {
  const { data: session } = useSession()

  return (
    <DashboardLayout user={session?.user}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
          Create a <span className="text-green-600">Poll</span>
        </h1>
        <PollCreationWizard />
      </div>
    </DashboardLayout>
  )
}
