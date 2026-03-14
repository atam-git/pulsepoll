import { Button } from '@/components/ui/Button'

interface WelcomeSectionProps {
  userName: string
  userAvatar?: string
  subtitle?: string
  ctaTitle?: string
  ctaDescription?: string
  ctaButtonText?: string
  ctaButtonHref?: string
}

export function WelcomeSection({
  userName,
  subtitle = 'Here\'s what\'s happening with your polls today.',
  ctaTitle = 'Create engaging polls',
  ctaDescription = 'Start gathering insights from your audience with beautiful, interactive polls.',
  ctaButtonText = 'Create a Poll',
  ctaButtonHref = '/poll/create',
}: WelcomeSectionProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Welcome, {userName} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>

      {/* CTA Banner */}
      <div className="flex flex-col gap-4 rounded-xl bg-secondary-base p-6 text-white sm:flex-row sm:items-center sm:justify-between md:max-w-md">
        <div>
          <h2 className="text-base font-semibold">{ctaTitle}</h2>
          <p className="mt-1 text-sm text-gray-300">{ctaDescription}</p>
        </div>
        <Button
          href={ctaButtonHref}
          variant="primary"
          rounded="full"
          size="md"
          className="shrink-0"
        >
          {ctaButtonText}
        </Button>
      </div>
    </div>
  )
}