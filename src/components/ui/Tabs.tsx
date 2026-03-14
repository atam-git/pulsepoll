'use client'

import { ReactNode, useState, useRef, useEffect } from 'react'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

interface TabsProps {
  tabs: TabItem[]
  defaultActive?: string
  onTabChange?: (tabId: string) => void
  color?: 'green' | 'blue'
  className?: string
}

export function Tabs({
  tabs,
  defaultActive,
  onTabChange,
  color = 'green',
  className = ''
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultActive || tabs[0]?.id || '')
  const tabListRef = useRef<HTMLDivElement>(null)
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const colorMap = {
    green: 'border-green-500 text-green-600',
    blue: 'border-blue-500 text-blue-600'
  }

  const activeColor = colorMap[color]

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
  }

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    let nextTab: string | null = null
    const tabIds = tabs.map(t => t.id)
    const currentIndex = tabIds.indexOf(tabId)

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      nextTab = tabIds[currentIndex - 1] || tabIds[tabIds.length - 1]
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      nextTab = tabIds[currentIndex + 1] || tabIds[0]
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextTab = tabIds[0]
    } else if (e.key === 'End') {
      e.preventDefault()
      nextTab = tabIds[tabIds.length - 1]
    }

    if (nextTab) {
      setActiveTab(nextTab)
      onTabChange?.(nextTab)
      // Focus the next tab button
      setTimeout(() => {
        tabButtonRefs.current[nextTab!]?.focus()
      }, 0)
    }
  }

  const currentTab = tabs.find(t => t.id === activeTab)

  return (
    <div className={className}>
      {/* Tab list */}
      <div className="border-b border-gray-200">
        <nav
          ref={tabListRef}
          className="-mb-px flex space-x-4 sm:space-x-8"
          role="tablist"
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              ref={el => {
                if (el) tabButtonRefs.current[tab.id] = el
              }}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={e => handleKeyDown(e, tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? `border-b-2 ${activeColor}`
                  : 'border-transparent text-gray-800 hover:text-gray-900 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {currentTab && (
        <div
          id={`tabpanel-${currentTab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${currentTab.id}`}
          className="mt-0"
        >
          {currentTab.content}
        </div>
      )}
    </div>
  )
}
