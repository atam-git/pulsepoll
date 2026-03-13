'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, FileText } from 'lucide-react'

interface Poll {
  _id: string
  title: string
  description?: string
  type: string
  isPublic: boolean
  createdAt: string
  totalVotes: number
  creator: {
    name?: string
    email: string
  }
}

export default function DirectoryPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    fetchPolls()
  }, [sortBy])

  const fetchPolls = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/polls/public?sort=${sortBy}&search=${encodeURIComponent(searchTerm)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch polls')
      }

      const data = await response.json()
      setPolls(data.polls || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load polls')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPolls()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '32px 16px' }}>
      <div className="container mx-auto">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 
            style={{
              fontSize: '32px',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-black)',
              marginBottom: '8px'
            }}
          >
            Article & Poll Directory
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--color-mid-gray)' }}>
            Discover and participate in public articles and polls
          </p>
        </div>

        {/* Search and Filters */}
        <div 
          className="card"
          style={{ padding: '24px', marginBottom: '32px', background: '#FFFFFF' }}
        >
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search articles and polls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
                <Search 
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-mid-gray)'
                  }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '12px 28px' }}
              >
                Search
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label 
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-dark-gray)',
                whiteSpace: 'nowrap'
              }}
            >
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
              style={{ padding: '12px 20px' }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Most Popular</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div 
              style={{
                width: '48px',
                height: '48px',
                border: '3px solid var(--color-light-gray)',
                borderTop: '3px solid var(--color-primary)',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite'
              }}
            />
            <p style={{ color: 'var(--color-mid-gray)' }}>Loading articles and polls...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div 
            style={{
              background: 'rgba(220, 53, 69, 0.1)',
              border: '1px solid #DC3545',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              marginBottom: '32px',
              color: '#DC3545'
            }}
          >
            <p style={{ marginBottom: '12px' }}>{error}</p>
            <button
              onClick={fetchPolls}
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#DC3545',
                cursor: 'pointer',
                background: 'none',
                border: 'none'
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Polls Grid */}
        {!loading && !error && (
          <>
            {polls.length === 0 ? (
              <div 
                className="card"
                style={{
                  padding: '48px 32px',
                  textAlign: 'center',
                  background: '#FFFFFF'
                }}
              >
                <FileText 
                  size={64}
                  style={{
                    color: 'var(--color-light-gray)',
                    margin: '0 auto 16px'
                  }}
                />
                <h3 
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--color-black)',
                    marginBottom: '8px'
                  }}
                >
                  No articles or polls found
                </h3>
                <p 
                  style={{
                    fontSize: '14px',
                    color: 'var(--color-mid-gray)',
                    marginBottom: '24px'
                  }}
                >
                  {searchTerm ? 'Try adjusting your search terms.' : 'Be the first to create a public poll!'}
                </p>
                <Link href="/poll/create" className="btn btn-primary">
                  Create Poll
                </Link>
              </div>
            ) : (
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '24px'
                }}
              >
                {polls.map((poll) => (
                  <div 
                    key={poll._id}
                    className="card"
                    style={{
                      padding: '24px',
                      background: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ flex: 1, marginBottom: '16px' }}>
                      <h3 
                        style={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: 'var(--color-black)',
                          marginBottom: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {poll.title}
                      </h3>
                      {poll.description && (
                        <p 
                          style={{
                            fontSize: '14px',
                            color: 'var(--color-mid-gray)',
                            lineHeight: '1.6',
                            marginBottom: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {poll.description}
                        </p>
                      )}
                      <div 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '13px',
                          color: 'var(--color-mid-gray)',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--color-light-gray)'
                        }}
                      >
                        <span style={{ textTransform: 'capitalize' }}>{poll.type} poll</span>
                        <span>{poll.totalVotes} votes</span>
                      </div>
                    </div>

                    <div 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: 'var(--color-mid-gray)' }}>
                        <p style={{ marginBottom: '2px' }}>By {poll.creator.name || poll.creator.email}</p>
                        <p>{formatDate(poll.createdAt)}</p>
                      </div>
                      <Link
                        href={`/poll/${poll._id}`}
                        className="btn btn-primary"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
