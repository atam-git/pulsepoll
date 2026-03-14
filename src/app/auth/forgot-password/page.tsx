'use client'

import { ForgotPasswordForm } from '@/components/AuthForms'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center py-8 px-4 sm:py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8">
          <ForgotPasswordForm />
        </div>
        <p className="text-center text-slate-500 text-xs mt-8">
          PulsePoll © 2025 • All rights reserved
        </p>
      </div>
    </div>
  )
}
