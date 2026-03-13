'use client'

import { useState } from 'react'

interface PollEmbedCodeProps {
  pollId: string
  pollTitle: string
}

interface EmbedConfig {
  width: string
  height: string
  showTitle: boolean
  showDescription: boolean
  showResults: boolean
  theme: 'light' | 'dark'
  compact: boolean
}

export function PollEmbedCode({ pollId, pollTitle }: PollEmbedCodeProps) {
  const [config, setConfig] = useState<EmbedConfig>({
    width: '100%',
    height: '400px',
    showTitle: true,
    showDescription: true,
    showResults: true,
    theme: 'light',
    compact: false
  })
  const [copySuccess, setCopySuccess] = useState(false)

  const generateEmbedUrl = () => {
    const baseUrl = `${window.location.origin}/embed/${pollId}`
    const params = new URLSearchParams()
    
    if (!config.showTitle) params.set('title', 'false')
    if (!config.showDescription) params.set('description', 'false')
    if (!config.showResults) params.set('results', 'false')
    if (config.theme !== 'light') params.set('theme', config.theme)
    if (config.compact) params.set('compact', 'true')
    
    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }

  const generateEmbedCode = () => {
    const embedUrl = generateEmbedUrl()
    return `<iframe 
  src="${embedUrl}" 
  width="${config.width}" 
  height="${config.height}"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;"
  title="${pollTitle}">
</iframe>`
  }

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(generateEmbedCode())
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy embed code:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuration Options */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Embed Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dimensions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width
            </label>
            <input
              type="text"
              value={config.width}
              onChange={(e) => setConfig({ ...config, width: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g., 100%, 500px"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height
            </label>
            <input
              type="text"
              value={config.height}
              onChange={(e) => setConfig({ ...config, height: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="e.g., 400px, 50vh"
            />
          </div>
        </div>

        {/* Display Options */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Options
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.showTitle}
                onChange={(e) => setConfig({ ...config, showTitle: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show poll title</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.showDescription}
                onChange={(e) => setConfig({ ...config, showDescription: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show poll description</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.showResults}
                onChange={(e) => setConfig({ ...config, showResults: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show results after voting</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.compact}
                onChange={(e) => setConfig({ ...config, compact: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Compact mode (smaller text and spacing)</span>
            </label>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={config.theme === 'light'}
                onChange={(e) => setConfig({ ...config, theme: e.target.value as 'light' | 'dark' })}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Light</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={config.theme === 'dark'}
                onChange={(e) => setConfig({ ...config, theme: e.target.value as 'light' | 'dark' })}
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Dark</span>
            </label>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <iframe
            src={generateEmbedUrl()}
            width="100%"
            height="300px"
            style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
            title={`Preview: ${pollTitle}`}
          />
        </div>
      </div>

      {/* Embed Code */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Embed Code</h3>
        <div className="relative">
          <textarea
            value={generateEmbedCode()}
            readOnly
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono resize-none"
          />
          <button
            onClick={copyEmbedCode}
            className={`absolute top-2 right-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
              copySuccess
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {copySuccess ? 'Copied!' : 'Copy'}
          </button>
        </div>
        
        {copySuccess && (
          <p className="mt-2 text-green-600 text-sm">
            Embed code copied to clipboard!
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Copy the embed code above</li>
          <li>Paste it into your website's HTML where you want the poll to appear</li>
          <li>The poll will be responsive and work on all devices</li>
          <li>Visitors can vote directly from your website</li>
        </ol>
      </div>
    </div>
  )
}