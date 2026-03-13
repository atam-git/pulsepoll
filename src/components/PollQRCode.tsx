'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface PollQRCodeProps {
  pollId: string
  pollTitle: string
  size?: number
  className?: string
  customUrl?: string // Add option for custom URL
}

export function PollQRCode({ pollId, pollTitle, size = 200, className = '', customUrl }: PollQRCodeProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generate the poll URL with QR tracking
  const pollUrl = customUrl || `${window.location.origin}/poll/${pollId}?utm_source=qr_code&utm_medium=qr&utm_campaign=poll_share`

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setLoading(true)
        setError(null)

        // Generate QR code as data URL
        const dataUrl = await QRCode.toDataURL(pollUrl, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })

        setQrCodeDataUrl(dataUrl)
      } catch (err) {
        console.error('Failed to generate QR code:', err)
        setError('Failed to generate QR code')
      } finally {
        setLoading(false)
      }
    }

    if (pollId) {
      generateQRCode()
    }
  }, [pollId, pollUrl, size])

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return

    const link = document.createElement('a')
    link.download = `poll-${pollId}-qr-code.png`
    link.href = qrCodeDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyPollUrl = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ width: size, height: size }}>
        <p className="text-red-500 text-sm text-center px-4">
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* QR Code Display */}
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <img 
            src={qrCodeDataUrl} 
            alt={`QR code for ${pollTitle}`}
            width={size}
            height={size}
            className="block"
          />
        </div>
      </div>

      {/* Poll URL Display */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Scan to access poll:</p>
        <p className="text-xs text-gray-600 break-all font-mono bg-gray-50 p-2 rounded">
          {pollUrl}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={downloadQRCode}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
        >
          Download QR Code
        </button>
        <button
          onClick={copyPollUrl}
          className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
        >
          Copy Link
        </button>
      </div>
    </div>
  )
}