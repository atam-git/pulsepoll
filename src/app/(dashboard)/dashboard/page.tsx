'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { WelcomeSection } from '@/components/dashboard/WelcomeSection'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import { DataTableCard } from '@/components/dashboard/DataTableCard'
import { FeatureGrid } from '@/components/dashboard/FeatureGrid'
import Link from 'next/link'
import {
  ChartBarIcon,
  PlusCircleIcon,
  FolderIcon,
  ShareIcon,
  EyeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface Poll {
  id: string
  title: string
  type: string
  status: string
  createdAt: string
  metadata: {
    totalVotes: number
    viewCount: number
  }
  settings: {
    expiresAt?: string
    isPublic: boolean
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [polls, setPolls] = useState<Poll[]>([])
  const [totalPolls, setTotalPolls] = useState(0)

  useEffect(() => {
    setLoading(false)
    fetchPolls()
  }, [])

  const fetchPolls = async () => {
    try {
      const response = await fetch('/api/user/polls?sort=newest&limit=5')
      if (response.ok) {
        const data = await response.json()
        setPolls(data.polls)
        setTotalPolls(data.pagination.total)
      }
    } catch {
      // silently fail, dashboard still usable
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const isExpired = (poll: Poll) =>
    poll.settings.expiresAt && new Date(poll.settings.expiresAt) <= new Date()

  const activePolls = polls.filter(p => p.status === 'active' && !isExpired(p)).length
  const totalVotes = polls.reduce((sum, p) => sum + p.metadata.totalVotes, 0)
  const totalViews = polls.reduce((sum, p) => sum + p.metadata.viewCount, 0)

  const stats = [
    {
      id: 'total',
      icon: ClipboardDocumentListIcon,
      iconBgColor: 'bg-blue-500',
      label: 'Total Polls',
      value: totalPolls,
    },
    {
      id: 'active',
      icon: CheckCircleIcon,
      iconBgColor: 'bg-green-500',
      label: 'Active Polls',
      value: activePolls,
    },
    {
      id: 'votes',
      icon: UsersIcon,
      iconBgColor: 'bg-purple-500',
      label: 'Total Votes',
      value: totalVotes,
    },
    {
      id: 'views',
      icon: EyeIcon,
      iconBgColor: 'bg-orange-500',
      label: 'Total Views',
      value: totalViews,
    },
  ]

  const tableColumns = [
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
    { key: 'votes', label: 'Votes' },
    { key: 'date', label: 'Created' },
  ]

  const tableData = polls.map(poll => ({
    id: poll.id,
    title: poll.title || 'Untitled Poll',
    status: isExpired(poll) ? 'Expired' : poll.status,
    votes: poll.metadata.totalVotes,
    date: new Date(poll.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }))

  const features = [
    {
      id: 'create',
      icon: PlusCircleIcon,
      title: 'Create Poll',
      description: 'Build a new poll with multiple question types and customizable settings.',
      linkText: 'Get Started',
      linkHref: '/poll/create',
    },
    {
      id: 'polls',
      icon: FolderIcon,
      title: 'My Polls',
      description: 'View and manage all your polls in one place.',
      linkText: 'View Polls',
      linkHref: '/polls',
    },
    {
      id: 'analytics',
      icon: ChartBarIcon,
      title: 'Analytics',
      description: 'View detailed analytics and insights from your poll responses.',
      linkText: 'View Analytics',
      linkHref: '/analytics',
    },
    {
      id: 'share',
      icon: ShareIcon,
      title: 'Share & Embed',
      description: 'Share your polls via link, QR code, or embed them on your website.',
      linkText: 'Learn More',
      linkHref: '/share',
    },
  ]

  const renderCell = (key: string, value: any, row: any) => {
    if (key === 'status') {
      const colors: Record<string, string> = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        Expired: 'bg-red-100 text-red-800',
        draft: 'bg-yellow-100 text-yellow-800',
      }
      return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[value] || 'bg-gray-100 text-gray-800'}`}>
          {value}
        </span>
      )
    }
    if (key === 'title') {
      return (
        <Link href={`/polls/${row.id}`} className="font-medium text-gray-900 hover:text-green-600 transition-colors">
          {value}
        </Link>
      )
    }
    return value
  }

  return (
    <div className="space-y-8">
      <WelcomeSection
        userName={session?.user?.name || session?.user?.email || "User"}
      />

      <StatsGrid stats={stats} />

      <DataTableCard
        title="Recent Polls"
        viewAllHref="/dashboard"
        columns={tableColumns}
        data={tableData}
        emptyMessage="You haven't created any polls yet."
        emptyAction={{ label: 'Create your first poll', href: '/poll/create' }}
        renderCell={renderCell}
        onRowClick={(row) => router.push(`/polls/${row.id}`)}
      />

      <FeatureGrid features={features} />
    </div>
  )
}
