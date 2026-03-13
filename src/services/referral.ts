/**
 * Referral Source Tracking Service
 * Handles tracking and analysis of poll access referral sources
 */

export interface ReferralData {
  source: string
  medium: string
  campaign?: string
  content?: string
  term?: string
  url: string
  timestamp: Date
}

export interface ReferralStats {
  source: string
  count: number
  percentage: number
  firstSeen: Date
  lastSeen: Date
}

export class ReferralTracker {
  /**
   * Parse referral information from request headers and URL parameters
   */
  static parseReferralData(
    referer: string | null,
    userAgent: string | null,
    searchParams: URLSearchParams
  ): ReferralData {
    const timestamp = new Date()
    
    // Check for UTM parameters first (highest priority)
    const utmSource = searchParams.get('utm_source')
    const utmMedium = searchParams.get('utm_medium')
    const utmCampaign = searchParams.get('utm_campaign')
    const utmContent = searchParams.get('utm_content')
    const utmTerm = searchParams.get('utm_term')

    if (utmSource) {
      return {
        source: utmSource,
        medium: utmMedium || 'unknown',
        campaign: utmCampaign || undefined,
        content: utmContent || undefined,
        term: utmTerm || undefined,
        url: referer || 'direct',
        timestamp
      }
    }

    // Parse referer URL if available
    if (referer && referer !== '') {
      try {
        const refererUrl = new URL(referer)
        const domain = refererUrl.hostname.toLowerCase()
        
        // Social media platforms
        if (domain.includes('facebook.com') || domain.includes('fb.com')) {
          return {
            source: 'facebook',
            medium: 'social',
            url: referer,
            timestamp
          }
        }
        
        if (domain.includes('twitter.com') || domain.includes('t.co')) {
          return {
            source: 'twitter',
            medium: 'social',
            url: referer,
            timestamp
          }
        }
        
        if (domain.includes('linkedin.com')) {
          return {
            source: 'linkedin',
            medium: 'social',
            url: referer,
            timestamp
          }
        }
        
        if (domain.includes('reddit.com')) {
          return {
            source: 'reddit',
            medium: 'social',
            url: referer,
            timestamp
          }
        }
        
        if (domain.includes('instagram.com')) {
          return {
            source: 'instagram',
            medium: 'social',
            url: referer,
            timestamp
          }
        }
        
        // Search engines
        if (domain.includes('google.com') || domain.includes('google.')) {
          return {
            source: 'google',
            medium: 'search',
            term: refererUrl.searchParams.get('q') || undefined,
            url: referer,
            timestamp
          }
        }
        
        if (domain.includes('bing.com')) {
          return {
            source: 'bing',
            medium: 'search',
            term: refererUrl.searchParams.get('q') || undefined,
            url: referer,
            timestamp
          }
        }
        
        if (domain.includes('yahoo.com')) {
          return {
            source: 'yahoo',
            medium: 'search',
            term: refererUrl.searchParams.get('p') || undefined,
            url: referer,
            timestamp
          }
        }
        
        if (domain.includes('duckduckgo.com')) {
          return {
            source: 'duckduckgo',
            medium: 'search',
            term: refererUrl.searchParams.get('q') || undefined,
            url: referer,
            timestamp
          }
        }
        
        // Email clients
        if (domain.includes('mail.') || domain.includes('outlook.') || domain.includes('gmail.')) {
          return {
            source: 'email',
            medium: 'email',
            url: referer,
            timestamp
          }
        }
        
        // Generic external referral
        return {
          source: domain,
          medium: 'referral',
          url: referer,
          timestamp
        }
        
      } catch (error) {
        console.error('Error parsing referer URL:', error)
      }
    }

    // Check for QR code access
    if (searchParams.get('qr') === 'true' || searchParams.get('source') === 'qr') {
      return {
        source: 'qr_code',
        medium: 'qr',
        url: 'qr_code',
        timestamp
      }
    }

    // Check for embed access
    if (searchParams.get('embed') === 'true' || searchParams.get('source') === 'embed') {
      return {
        source: 'embed',
        medium: 'embed',
        url: referer || 'embed',
        timestamp
      }
    }

    // Check for mobile app
    if (userAgent && userAgent.toLowerCase().includes('mobile')) {
      return {
        source: 'mobile_app',
        medium: 'app',
        url: 'mobile_app',
        timestamp
      }
    }

    // Default to direct access
    return {
      source: 'direct',
      medium: 'direct',
      url: 'direct',
      timestamp
    }
  }

  /**
   * Generate referral tracking URL with UTM parameters
   */
  static generateTrackingUrl(
    baseUrl: string,
    source: string,
    medium: string,
    campaign?: string,
    content?: string,
    term?: string
  ): string {
    const url = new URL(baseUrl)
    
    url.searchParams.set('utm_source', source)
    url.searchParams.set('utm_medium', medium)
    
    if (campaign) url.searchParams.set('utm_campaign', campaign)
    if (content) url.searchParams.set('utm_content', content)
    if (term) url.searchParams.set('utm_term', term)
    
    return url.toString()
  }

  /**
   * Generate social media sharing URLs with tracking
   */
  static generateSocialUrls(pollUrl: string, pollTitle: string) {
    const encodedUrl = encodeURIComponent(pollUrl)
    const encodedTitle = encodeURIComponent(pollTitle)
    
    return {
      twitter: this.generateTrackingUrl(
        `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
        'twitter',
        'social',
        'poll_share'
      ),
      facebook: this.generateTrackingUrl(
        `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        'facebook',
        'social',
        'poll_share'
      ),
      linkedin: this.generateTrackingUrl(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        'linkedin',
        'social',
        'poll_share'
      ),
      reddit: this.generateTrackingUrl(
        `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
        'reddit',
        'social',
        'poll_share'
      )
    }
  }

  /**
   * Analyze referral statistics from vote data
   */
  static analyzeReferralStats(votes: any[]): ReferralStats[] {
    const referralMap = new Map<string, {
      count: number
      firstSeen: Date
      lastSeen: Date
    }>()

    // Process each vote's referral data
    votes.forEach(vote => {
      const referralSource = vote.referralSource || vote.metadata?.demographics?.referralSource || 'direct'
      const timestamp = new Date(vote.createdAt || vote.metadata?.submittedAt)
      
      if (referralMap.has(referralSource)) {
        const existing = referralMap.get(referralSource)!
        existing.count++
        if (timestamp < existing.firstSeen) existing.firstSeen = timestamp
        if (timestamp > existing.lastSeen) existing.lastSeen = timestamp
      } else {
        referralMap.set(referralSource, {
          count: 1,
          firstSeen: timestamp,
          lastSeen: timestamp
        })
      }
    })

    // Convert to array and calculate percentages
    const totalVotes = votes.length
    const stats: ReferralStats[] = Array.from(referralMap.entries()).map(([source, data]) => ({
      source,
      count: data.count,
      percentage: totalVotes > 0 ? Math.round((data.count / totalVotes) * 100) : 0,
      firstSeen: data.firstSeen,
      lastSeen: data.lastSeen
    }))

    // Sort by count (descending)
    return stats.sort((a, b) => b.count - a.count)
  }

  /**
   * Get top referral sources
   */
  static getTopReferralSources(votes: any[], limit: number = 10): ReferralStats[] {
    const stats = this.analyzeReferralStats(votes)
    return stats.slice(0, limit)
  }

  /**
   * Format referral source for display
   */
  static formatReferralSource(source: string): string {
    const sourceMap: { [key: string]: string } = {
      'direct': 'Direct Access',
      'google': 'Google Search',
      'bing': 'Bing Search',
      'yahoo': 'Yahoo Search',
      'duckduckgo': 'DuckDuckGo Search',
      'facebook': 'Facebook',
      'twitter': 'Twitter',
      'linkedin': 'LinkedIn',
      'reddit': 'Reddit',
      'instagram': 'Instagram',
      'email': 'Email',
      'qr_code': 'QR Code',
      'embed': 'Embedded Widget',
      'mobile_app': 'Mobile App'
    }

    return sourceMap[source] || source.charAt(0).toUpperCase() + source.slice(1)
  }
}