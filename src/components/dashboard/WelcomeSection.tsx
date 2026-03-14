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
    <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {userName} 👋
        </h1>
        <p className="mt-2 text-base text-slate-600">{subtitle}</p>
      </div>

      {/* CTA Banner */}
      <div className="flex flex-col gap-4 rounded-xl bg-slate-900 p-8 text-white sm:flex-row sm:items-center sm:gap-6 md:max-w-md shadow-md hover:shadow-lg transition-shadow duration-300">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">{ctaTitle}</h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">{ctaDescription}</p>
        </div>
        <Button
          href={ctaButtonHref}
          variant="primary"
          rounded="full"
          size="md"
          className="shrink-0 whitespace-nowrap"
        >
          {ctaButtonText}
        </Button>
      </div>
    </div>
  )
}
