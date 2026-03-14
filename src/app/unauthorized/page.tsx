'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <span className="text-6xl">🚫</span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>
        
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. This area is restricted to administrators only.
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={() => router.back()}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Go Back
          </Button>

          <Button
            href="/dashboard"
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Go to Dashboard
          </Button>

          <Button
            href="/"
            variant="ghost"
            size="lg"
            className="w-full"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
