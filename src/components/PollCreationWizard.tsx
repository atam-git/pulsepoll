'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ListBulletIcon,
  CheckCircleIcon,
  ArrowsUpDownIcon,
  HandThumbUpIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

type PollType = 'single' | 'multiple' | 'ranking' | 'yesno' | 'survey'

interface PollOption {
  id: string
  text: string
  imageUrl?: string
  uploading?: boolean
}

interface PollSettings {
  privacy: 'public' | 'unlisted' | 'private'
  expirationDate: string
  maxVotes: number | ''
  allowAnonymous: boolean
  requireCaptcha: boolean
}

interface PollFormData {
  title: string
  description: string
  type: PollType
  options: PollOption[]
  settings: PollSettings
}

interface FormErrors {
  title?: string
  description?: string
  type?: string
  options?: string
  settings?: string
}

const POLL_TYPES: { value: PollType; label: string; description: string; icon: typeof ListBulletIcon }[] = [
  { value: 'single', label: 'Single Choice', description: 'Voters pick one option', icon: ListBulletIcon },
  { value: 'multiple', label: 'Multiple Choice', description: 'Voters pick multiple options', icon: CheckCircleIcon },
  { value: 'ranking', label: 'Ranking', description: 'Voters rank options in order', icon: ArrowsUpDownIcon },
  { value: 'yesno', label: 'Yes / No', description: 'Simple yes or no question', icon: HandThumbUpIcon },
  { value: 'survey', label: 'Survey', description: 'Multiple questions in one poll', icon: ClipboardDocumentListIcon },
]

const STEPS = ['Basic Info', 'Options', 'Settings', 'Review']

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export function PollCreationWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState<PollFormData>({
    title: '',
    description: '',
    type: 'single',
    options: [
      { id: generateId(), text: '' },
      { id: generateId(), text: '' },
    ],
    settings: {
      privacy: 'public',
      expirationDate: '',
      maxVotes: '',
      allowAnonymous: true,
      requireCaptcha: false,
    },
  })

  const validateStep = (s: number): boolean => {
    const newErrors: FormErrors = {}

    if (s === 0) {
      // Title is now optional - no validation needed
      if (!formData.type) newErrors.type = 'Select a poll type'
    }

    if (s === 1) {
      if (formData.type !== 'yesno') {
        const validOptions = formData.options.filter(o => o.text.trim() || o.imageUrl)
        if (validOptions.length < 2) newErrors.options = 'At least 2 options are required (each option must have text or an image)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step) && step < STEPS.length - 1) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 0) setStep(step - 1)
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { id: generateId(), text: '' }],
    }))
  }

  const removeOption = (id: string) => {
    if (formData.options.length <= 2) return
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(o => o.id !== id),
    }))
  }

  const updateOption = (id: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(o => (o.id === id ? { ...o, text } : o)),
    }))
  }

  const uploadImage = async (id: string, file: File) => {
    try {
      // Set uploading state
      setFormData(prev => ({
        ...prev,
        options: prev.options.map(o => (o.id === id ? { ...o, uploading: true } : o)),
      }))

      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload image')
      }

      const data = await response.json()
      
      // Update option with image URL
      setFormData(prev => ({
        ...prev,
        options: prev.options.map(o => 
          o.id === id ? { ...o, imageUrl: data.imageUrl, uploading: false } : o
        ),
      }))
    } catch (error) {
      console.error('Image upload error:', error)
      // Reset uploading state on error
      setFormData(prev => ({
        ...prev,
        options: prev.options.map(o => (o.id === id ? { ...o, uploading: false } : o)),
      }))
      alert('Failed to upload image. Please try again.')
    }
  }

  const removeImage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(o => 
        o.id === id ? { ...o, imageUrl: undefined } : o
      ),
    }))
  }

  const handleSubmit = async () => {
    if (!validateStep(step)) return

    try {
      setSubmitting(true)
      setSubmitError(null)

      const body = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        options: formData.type === 'yesno'
          ? [{ text: 'Yes' }, { text: 'No' }]
          : formData.options.filter(o => o.text.trim() || o.imageUrl).map(o => ({ 
              text: o.text || '', 
              imageUrl: o.imageUrl 
            })),
        settings: {
          privacy: formData.settings.privacy,
          expirationDate: formData.settings.expirationDate || undefined,
          maxVotes: formData.settings.maxVotes || undefined,
          allowAnonymous: formData.settings.allowAnonymous,
          requireCaptcha: formData.settings.requireCaptcha,
        },
      }

      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create poll')
      }

      const data = await response.json()
      router.push(`/poll/${data.poll?.id || data.id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create poll')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <button
              onClick={() => { if (i < step) setStep(i) }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i === step
                  ? 'bg-blue-600 text-white'
                  : i < step
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {i + 1}
            </button>
            <span className={`ml-2 text-sm hidden sm:inline ${i === step ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 mx-3 ${i < step ? 'bg-blue-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Step 1: Basic Info */}
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Poll Title (optional)</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What would you like to ask? (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add more context to your poll"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Poll Type</label>
              {errors.type && <p className="mb-2 text-sm text-red-600">{errors.type}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POLL_TYPES.map(pt => {
                  const Icon = pt.icon
                  return (
                    <button
                      key={pt.value}
                      onClick={() => setFormData(prev => ({ ...prev, type: pt.value }))}
                      className={`flex items-start p-4 border-2 rounded-lg text-left transition-colors ${
                        formData.type === pt.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-6 h-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{pt.label}</div>
                        <div className="text-sm text-gray-600">{pt.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Options */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Poll Options</h2>

            {formData.type === 'yesno' ? (
              <div className="text-gray-600 bg-blue-50 p-4 rounded-lg">
                Yes/No polls automatically have two options: <strong>Yes</strong> and <strong>No</strong>.
              </div>
            ) : (
              <>
                {errors.options && <p className="text-sm text-red-600">{errors.options}</p>}
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg mb-4">
                  💡 <strong>Tip:</strong> Each option needs either text, an image, or both. You can create image-only options by uploading an image without adding text.
                </div>
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-gray-600 w-6 text-center">{index + 1}.</span>
                        <input
                          type="text"
                          value={option.text}
                          onChange={e => updateOption(option.id, e.target.value)}
                          placeholder={`Option ${index + 1} (optional if image added)`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                        />
                        <button
                          onClick={() => removeOption(option.id)}
                          disabled={formData.options.length <= 2}
                          className="p-2 text-gray-600 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Image Upload Section */}
                      <div className="ml-8">
                        {option.imageUrl ? (
                          <div className="relative inline-block">
                            <img
                              src={option.imageUrl}
                              alt={`Option ${index + 1} image`}
                              className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              onClick={() => removeImage(option.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  uploadImage(option.id, file)
                                }
                              }}
                              className="hidden"
                              id={`image-upload-${option.id}`}
                              disabled={option.uploading}
                            />
                            <label
                              htmlFor={`image-upload-${option.id}`}
                              className={`flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                                option.uploading ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <PhotoIcon className="w-4 h-4" />
                              {option.uploading ? 'Uploading...' : 'Add Image'}
                            </label>
                            <span className="text-xs text-gray-600">Optional</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addOption}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Option
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 3: Settings */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
              <select
                value={formData.settings.privacy}
                onChange={e => setFormData(prev => ({ ...prev, settings: { ...prev.settings, privacy: e.target.value as PollSettings['privacy'] } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="public">Public - Anyone can find and vote</option>
                <option value="unlisted">Unlisted - Only people with the link can vote</option>
                <option value="private">Private - Only invited users can vote</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (optional)</label>
              <input
                type="datetime-local"
                value={formData.settings.expirationDate}
                onChange={e => setFormData(prev => ({ ...prev, settings: { ...prev.settings, expirationDate: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Votes (optional)</label>
              <input
                type="number"
                min="1"
                value={formData.settings.maxVotes}
                onChange={e => setFormData(prev => ({ ...prev, settings: { ...prev.settings, maxVotes: e.target.value ? parseInt(e.target.value) : '' } }))}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-gray-700">Allow Anonymous Voting</div>
                <div className="text-sm text-gray-600">Voters don't need to sign in</div>
              </div>
              <button
                onClick={() => setFormData(prev => ({ ...prev, settings: { ...prev.settings, allowAnonymous: !prev.settings.allowAnonymous } }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.settings.allowAnonymous ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.settings.allowAnonymous ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-gray-700">Require CAPTCHA</div>
                <div className="text-sm text-gray-600">Prevent automated voting</div>
              </div>
              <button
                onClick={() => setFormData(prev => ({ ...prev, settings: { ...prev.settings, requireCaptcha: !prev.settings.requireCaptcha } }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.settings.requireCaptcha ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.settings.requireCaptcha ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Review Your Poll</h2>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Title</h3>
                <p className="text-gray-900 font-medium">{formData.title}</p>
              </div>

              {formData.description && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                  <p className="text-gray-900">{formData.description}</p>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Poll Type</h3>
                <p className="text-gray-900">{POLL_TYPES.find(p => p.value === formData.type)?.label}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Options</h3>
                <div className="space-y-3">
                  {formData.type === 'yesno' ? (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        <span className="text-gray-900">Yes</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        <span className="text-gray-900">No</span>
                      </div>
                    </>
                  ) : (
                    formData.options.filter(o => o.text.trim() || o.imageUrl).map(o => (
                      <div key={o.id} className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        <span className="text-gray-900">{o.text || 'Image only'}</span>
                        {o.imageUrl && (
                          <img
                            src={o.imageUrl}
                            alt={`${o.text || 'Option'} image`}
                            className="w-16 h-12 object-cover rounded border border-gray-200"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Settings</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Privacy: {formData.settings.privacy}</p>
                  <p>Expiration: {formData.settings.expirationDate || 'None'}</p>
                  <p>Max Votes: {formData.settings.maxVotes || 'Unlimited'}</p>
                  <p>Anonymous: {formData.settings.allowAnonymous ? 'Yes' : 'No'}</p>
                  <p>CAPTCHA: {formData.settings.requireCaptcha ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-1 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Poll'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
