'use client'

import { LoginForm } from '@/components/AuthForms'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
