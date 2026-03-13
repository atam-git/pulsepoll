'use client'

import { LoginForm } from '@/components/AuthForms'

export default function LoginPage() {
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e6f4ea 0%, #f0f5ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px'
      }}
    >
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '48px 32px',
          width: '100%',
          maxWidth: '448px'
        }}
      >
        {/* Brand Header */}
        <div 
          style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}
        >
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}
          >
            <div 
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: 'var(--color-primary)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
            >
              C
            </div>
            <span 
              style={{
                fontSize: '18px',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-primary)'
              }}
            >
              ConnectNigeria
            </span>
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
