'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ShareIcon,
  QrCodeIcon,
  CodeBracketIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'

export default function SharePage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(type)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const embedCode = `<iframe 
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'}/embed/POLL_ID" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;">
</iframe>`

  const embedCodeWithOptions = `<iframe 
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'}/embed/POLL_ID?theme=light&compact=false&title=true&description=true&results=true" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;">
</iframe>`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Share & Embed</h1>
        <p className="text-gray-600 mt-2">
          Share your polls via link, QR code, or embed them on your website
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/polls"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
          >
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3 group-hover:bg-green-200">
              <ShareIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Share Existing Poll</h3>
              <p className="text-sm text-gray-600">Go to your polls and click share</p>
            </div>
            <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/poll/create"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3 group-hover:bg-blue-200">
              <DocumentDuplicateIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Create New Poll</h3>
              <p className="text-sm text-gray-600">Create a poll to share</p>
            </div>
            <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>

      {/* Sharing Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Direct Link Sharing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <LinkIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Direct Link Sharing</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Share your polls with a simple link that works anywhere
          </p>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Example voting link:</p>
              <code className="text-sm text-gray-800 bg-white px-2 py-1 rounded border">
                https://yoursite.com/vote/poll-id
              </code>
            </div>
            <div className="text-sm text-gray-600">
              <h4 className="font-medium mb-2">Perfect for:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Social media posts</li>
                <li>Email campaigns</li>
                <li>Text messages</li>
                <li>Slack or Teams channels</li>
              </ul>
            </div>
          </div>
        </div>

        {/* QR Code Sharing */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <QrCodeIcon className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">QR Code Sharing</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Generate QR codes for easy mobile access to your polls
          </p>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="w-24 h-24 bg-white border-2 border-dashed border-gray-300 rounded-lg mx-auto flex items-center justify-center mb-2">
                <QrCodeIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">QR codes generated automatically</p>
            </div>
            <div className="text-sm text-gray-600">
              <h4 className="font-medium mb-2">Perfect for:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Print materials (flyers, posters)</li>
                <li>Event presentations</li>
                <li>Business cards</li>
                <li>Physical locations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Embed Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <CodeBracketIcon className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-lg font-semibold text-gray-900">Embed on Your Website</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* iframe Embed */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">iframe Embed</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Simple iframe embedding for any website
            </p>
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <pre className="text-green-400 text-sm overflow-x-auto">
                <code>{embedCode}</code>
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(embedCode, 'iframe')}
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copiedCode === 'iframe'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copiedCode === 'iframe' ? 'Copied!' : 'Copy iframe Code'}
            </button>
          </div>

          {/* Advanced iframe Embed */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Advanced iframe Options</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Customize your embed with URL parameters
            </p>
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <pre className="text-green-400 text-sm overflow-x-auto">
                <code>{embedCodeWithOptions}</code>
              </pre>
            </div>
            <button
              onClick={() => copyToClipboard(embedCodeWithOptions, 'advanced')}
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copiedCode === 'advanced'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copiedCode === 'advanced' ? 'Copied!' : 'Copy Advanced Code'}
            </button>
            
            {/* URL Parameters */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Available Parameters:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li><code>theme=light|dark</code> - Color theme</li>
                <li><code>compact=true|false</code> - Compact layout</li>
                <li><code>title=true|false</code> - Show poll title</li>
                <li><code>description=true|false</code> - Show description</li>
                <li><code>results=true|false</code> - Show results after voting</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Embed Features */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-md font-medium text-gray-900 mb-4">Embed Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">🎨</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Theme Options</h4>
              <p className="text-sm text-gray-600">Light and dark themes available</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Responsive</h4>
              <p className="text-sm text-gray-600">Works perfectly on all devices</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">⚙️</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Configurable</h4>
              <p className="text-sm text-gray-600">Hide/show elements via URL parameters</p>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">💡 Sharing Best Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-blue-900 mb-2">For Maximum Engagement:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use clear, compelling poll titles</li>
              <li>• Add context or instructions</li>
              <li>• Share in relevant communities</li>
              <li>• Include a call-to-action</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-2">For Website Embedding:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Test on different screen sizes</li>
              <li>• Consider your site's color scheme</li>
              <li>• Place polls in high-traffic areas</li>
              <li>• Monitor performance regularly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Ready to Share Your Polls?</h2>
        <p className="text-green-100 mb-6">
          Create engaging polls and share them with the world using our powerful sharing tools
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/poll/create"
            className="px-6 py-3 bg-white text-green-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Create New Poll
          </Link>
          <Link
            href="/polls"
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors border border-green-400"
          >
            Share Existing Poll
          </Link>
        </div>
      </div>
    </div>
  )
}