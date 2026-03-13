'use client'

import Link from 'next/link'
import { Search, MapPin, Star, Briefcase, Home as HouseIcon, Users, Calendar, Truck, Tag, FileText, BookOpen, Heart, Cpu, MapPin as MapPinIcon } from 'lucide-react'
import { useState } from 'react'

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    { label: 'All', icon: 'all' },
    { label: 'Businesses', icon: Briefcase },
    { label: 'Real Estate', icon: Home },
    { label: 'Jobs', icon: Users },
    { label: 'Events', icon: Calendar },
    { label: 'Cars', icon: Truck },
    { label: 'Deals', icon: Tag },
  ]

  const categoryGrid = [
    { label: 'Businesses', icon: Briefcase, href: '/poll/create' },
    { label: 'Real Estate', icon: HouseIcon, href: '/poll/create' },
    { label: 'Jobs', icon: Users, href: '/poll/create' },
    { label: 'Events', icon: Calendar, href: '/poll/create' },
    { label: 'Cars', icon: Truck, href: '/poll/create' },
    { label: 'Deals', icon: Tag, href: '/poll/create' },
    { label: 'Articles', icon: FileText, href: '/directory' },
    { label: 'Education', icon: BookOpen, href: '/poll/create' },
    { label: 'Health', icon: Heart, href: '/poll/create' },
    { label: 'Technology', icon: Cpu, href: '/poll/create' },
    { label: 'Travel', icon: MapPinIcon, href: '/poll/create' },
    { label: 'Entertainment', icon: Calendar, href: '/poll/create' },
  ]

  const featuredBusinesses = [
    {
      id: 1,
      name: 'TechHub Lagos',
      category: 'Technology',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=160&fit=crop',
      location: 'Lagos, Nigeria',
      badge: 'Featured'
    },
    {
      id: 2,
      name: 'Prime Real Estate',
      category: 'Real Estate',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=160&fit=crop',
      location: 'Abuja, Nigeria',
      badge: 'Featured'
    },
    {
      id: 3,
      name: 'Job Connect Services',
      category: 'Recruitment',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=160&fit=crop',
      location: 'Nigeria',
      badge: 'Featured'
    },
  ]

  const articles = [
    {
      id: 1,
      title: 'Top 10 Growing Businesses in Nigeria',
      category: 'Business',
      excerpt: 'Discover the fastest-growing businesses in Nigeria and what makes them successful.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
      date: '2024-03-10',
      readTime: '5 min read'
    },
    {
      id: 2,
      title: 'Real Estate Investment Guide for Nigerians',
      category: 'Real Estate',
      excerpt: 'Complete guide to investing in Nigerian real estate with tips and strategies.',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=200&fit=crop',
      date: '2024-03-09',
      readTime: '8 min read'
    },
    {
      id: 3,
      title: 'Career Development: Your Path to Success',
      category: 'Career',
      excerpt: 'Learn how to develop your career and advance in your chosen field.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
      date: '2024-03-08',
      readTime: '6 min read'
    },
  ]

  const stats = [
    { value: '50,000+', label: 'Registered Businesses' },
    { value: '1M+', label: 'Monthly Visitors' },
    { value: '36', label: 'States Covered' },
    { value: '15+', label: 'Years in Operation' },
  ]

  return (
    <div style={{ background: '#FFFFFF' }}>
      {/* Hero Section */}
      <section 
        style={{
          background: 'linear-gradient(135deg, #006400 0%, #004d00 60%, #003300 100%)',
          padding: '80px 16px',
          textAlign: 'center',
          color: '#FFFFFF'
        }}
        className="section-padding"
      >
        <div className="container mx-auto">
          <h1 
            style={{
              fontSize: '48px',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              marginBottom: '16px',
              lineHeight: '1.2'
            }}
            className="animate-fade-in"
          >
            Nigeria's #1 Information Portal
          </h1>
          <p 
            style={{
              fontSize: '20px',
              color: 'rgba(255,255,255,0.85)',
              marginBottom: '40px',
              maxWidth: '700px',
              margin: '0 auto'
            }}
            className="animate-fade-in-up"
          >
            Find businesses, jobs, events, real estate & more — all in one place.
          </p>

          {/* Search Bar */}
          <div 
            style={{
              maxWidth: '680px',
              margin: '0 auto 24px'
            }}
            className="animate-fade-in-up"
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search for businesses, services, jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field flex-1"
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  fontSize: '16px'
                }}
              />
              <button 
                className="btn btn-accent"
                style={{
                  background: '#FFA500',
                  color: '#FFFFFF',
                  padding: '14px 32px'
                }}
              >
                <Search size={20} />
                Search
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div 
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '12px'
            }}
            className="animate-fade-in-up"
          >
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeCategory === cat.label ? '#FFA500' : 'rgba(255,255,255,0.15)',
                  color: '#FFFFFF',
                  fontWeight: activeCategory === cat.label ? 600 : 400,
                  transition: 'all 0.2s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="section-padding" style={{ background: '#FFFFFF' }}>
        <div className="container mx-auto">
          <h2 
            style={{
              fontSize: '36px',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              textAlign: 'center',
              marginBottom: '48px',
              color: 'var(--color-black)'
            }}
          >
            Browse by Category
          </h2>

          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '24px'
            }}
          >
            {categoryGrid.map((cat, idx) => {
              const IconComponent = cat.icon
              return (
                <Link href={cat.href} key={idx}>
                  <div 
                    className="card hover:shadow-card"
                    style={{
                      padding: '24px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        background: '#e6f4ea',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        color: 'var(--color-primary)'
                      }}
                    >
                      <IconComponent size={24} />
                    </div>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--color-dark-gray)',
                        marginTop: '12px'
                      }}
                    >
                      {cat.label}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      <section className="section-padding" style={{ background: '#F8F9FA' }}>
        <div className="container mx-auto">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 
              style={{
                fontSize: '36px',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-black)',
                marginBottom: '12px'
              }}
            >
              Featured Businesses
            </h2>
            <p 
              style={{
                fontSize: '16px',
                color: 'var(--color-mid-gray)'
              }}
            >
              Discover top-rated businesses in Nigeria
            </p>
          </div>

          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}
          >
            {featuredBusinesses.map((business) => (
              <div key={business.id} className="card">
                <img 
                  src={business.image} 
                  alt={business.name}
                  style={{
                    width: '100%',
                    height: '160px',
                    objectFit: 'cover',
                    borderRadius: '12px 12px 0 0'
                  }}
                />
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h3 
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: 'var(--color-black)'
                      }}
                    >
                      {business.name}
                    </h3>
                    <span 
                      className="badge badge-featured"
                      style={{ fontSize: '11px', padding: '3px 10px' }}
                    >
                      {business.badge}
                    </span>
                  </div>
                  <p 
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                      marginBottom: '8px'
                    }}
                  >
                    {business.category}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        fill={i < Math.floor(business.rating) ? '#FFA500' : '#E9ECEF'}
                        color="#FFA500"
                      />
                    ))}
                    <span style={{ fontSize: '13px', color: 'var(--color-mid-gray)', marginLeft: '4px' }}>
                      {business.rating}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-mid-gray)' }}>
                    <MapPin size={14} />
                    {business.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar Section */}
      <section 
        style={{
          background: 'var(--color-primary)',
          padding: '40px 16px',
          color: '#FFFFFF'
        }}
      >
        <div className="container mx-auto">
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '32px',
              textAlign: 'center'
            }}
          >
            {stats.map((stat, idx) => (
              <div key={idx}>
                <div 
                  style={{
                    fontSize: '36px',
                    fontWeight: 800,
                    color: 'var(--color-accent)',
                    marginBottom: '8px'
                  }}
                >
                  {stat.value}
                </div>
                <p 
                  style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.85)'
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Request Banner */}
      <section 
        style={{
          background: 'linear-gradient(135deg, #FFA500 0%, #cc8400 100%)',
          padding: '56px 32px',
          textAlign: 'center',
          color: '#FFFFFF'
        }}
        className="section-padding"
      >
        <div className="container mx-auto">
          <h2 
            style={{
              fontSize: '32px',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              marginBottom: '12px'
            }}
          >
            Need a Service? Get Quotes Fast!
          </h2>
          <p 
            style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.90)',
              marginBottom: '28px',
              maxWidth: '600px',
              margin: '0 auto 28px'
            }}
          >
            Post your request and receive competitive quotes from pre-screened businesses within 24 hours.
          </p>
          <Link href="/poll/create">
            <button 
              className="btn btn-large"
              style={{
                background: '#FFFFFF',
                color: '#FFA500',
                borderRadius: '9999px',
                padding: '14px 36px',
                fontWeight: 700,
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Request a Quote
            </button>
          </Link>
          <div 
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '24px',
              marginTop: '32px',
              fontSize: '14px'
            }}
          >
            {['No Hidden Fees', 'Quotes Within 24 Hours', 'Pre-Screened Businesses', 'Compare Multiple Offers'].map((feature, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>✓</span>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Articles Section */}
      <section className="section-padding" style={{ background: '#FFFFFF' }}>
        <div className="container mx-auto">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 
              style={{
                fontSize: '36px',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-black)',
                marginBottom: '12px'
              }}
            >
              Latest Articles
            </h2>
            <p 
              style={{
                fontSize: '16px',
                color: 'var(--color-mid-gray)'
              }}
            >
              Stay informed with trending Nigerian business & lifestyle content
            </p>
          </div>

          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}
          >
            {articles.map((article) => (
              <div key={article.id} className="card">
                <img 
                  src={article.image} 
                  alt={article.title}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                  }}
                />
                <div className="card-body">
                  <span 
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {article.category}
                  </span>
                  <h3 
                    style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      color: 'var(--color-black)',
                      margin: '8px 0',
                      lineHeight: '1.4'
                    }}
                  >
                    {article.title}
                  </h3>
                  <p 
                    style={{
                      fontSize: '14px',
                      color: 'var(--color-mid-gray)',
                      lineHeight: '1.6',
                      marginBottom: '12px'
                    }}
                  >
                    {article.excerpt}
                  </p>
                  <div 
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-mid-gray)',
                      marginBottom: '12px'
                    }}
                  >
                    {article.date} • {article.readTime}
                  </div>
                  <Link href="/directory" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '14px' }}>
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="section-padding" style={{ background: '#F8F9FA' }}>
        <div className="container mx-auto" style={{ textAlign: 'center' }}>
          <h2 
            style={{
              fontSize: '36px',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-black)',
              marginBottom: '12px'
            }}
          >
            Download the App
          </h2>
          <p 
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--color-dark-gray)',
              marginBottom: '12px'
            }}
          >
            Get Quotes on the Go
          </p>
          <p 
            style={{
              fontSize: '16px',
              color: 'var(--color-mid-gray)',
              marginBottom: '32px',
              maxWidth: '600px',
              margin: '0 auto 32px'
            }}
          >
            Download the ConnectNigeria Quote Request app and connect with verified service providers anytime.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ padding: '12px 24px' }}>
              Google Play
            </button>
            <button className="btn btn-secondary" style={{ padding: '12px 24px' }}>
              App Store
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        style={{
          background: 'var(--color-black)',
          padding: '56px 16px 24px',
          color: '#FFFFFF'
        }}
      >
        <div className="container mx-auto">
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '32px',
              marginBottom: '40px'
            }}
          >
            {/* Brand Column */}
            <div>
              <h4 
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'var(--color-accent)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  C
                </span>
                ConnectNigeria
              </h4>
              <p 
                style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: '1.6',
                  marginBottom: '16px'
                }}
              >
                Nigeria's most trusted information portal. Connecting people to businesses, opportunities, and more since 2009.
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'].map((social) => (
                  <a 
                    key={social} 
                    href="#" 
                    style={{
                      width: '36px',
                      height: '36px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    {social.charAt(0).toUpperCase()}
                  </a>
                ))}
              </div>
            </div>

            {/* Explore Links */}
            <div>
              <h5 
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                  marginBottom: '16px'
                }}
              >
                Explore
              </h5>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Businesses', 'Real Estate', 'Jobs', 'Events', 'Cars', 'Deals'].map((item) => (
                  <a 
                    key={item}
                    href="#"
                    style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.65)',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>

            {/* Company Links */}
            <div>
              <h5 
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                  marginBottom: '16px'
                }}
              >
                Company
              </h5>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['About Us', 'Advertise', 'Careers', 'Press', 'Contact Us'].map((item) => (
                  <a 
                    key={item}
                    href="#"
                    style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.65)',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>

            {/* Support Links */}
            <div>
              <h5 
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                  marginBottom: '16px'
                }}
              >
                Support
              </h5>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Help Center', 'Privacy Policy', 'Terms of Use', 'Cookie Policy'].map((item) => (
                  <a 
                    key={item}
                    href="#"
                    style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.65)',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          {/* Bottom Bar */}
          <div 
            style={{
              borderTop: '1px solid rgba(255,255,255,0.10)',
              paddingTop: '20px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.45)',
              textAlign: 'center'
            }}
          >
            © 2026 ConnectNigeria. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
