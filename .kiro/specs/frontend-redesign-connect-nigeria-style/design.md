# Design Document: Connect Nigeria-Style Frontend Redesign

## Overview

This design document specifies the technical implementation for redesigning PulsePoll's frontend to match the Connect Nigeria dashboard layout style. The redesign transforms the user interface with a modern, professional appearance featuring sticky sidebar navigation, responsive mobile layouts, stats cards, data tables, and feature cards with hover effects.

### Design Goals

1. **Modern Professional Aesthetic**: Implement a clean, contemporary dashboard layout that matches Connect Nigeria's visual style
2. **Responsive Design**: Ensure seamless experience across desktop, tablet, and mobile devices with appropriate layout adaptations
3. **Component Reusability**: Create modular, reusable components that maintain consistency across the application
4. **Zero Functionality Impact**: Preserve all existing features, APIs, and user workflows without modification
5. **Performance**: Maintain or improve current performance metrics with efficient CSS and component rendering

### Key Design Principles

- **Layout-First Approach**: Focus on structural changes (sidebar, grids, cards) rather than feature modifications
- **Progressive Enhancement**: Desktop-first design with mobile adaptations through responsive breakpoints
- **Consistency**: Unified spacing, colors, typography, and interaction patterns throughout
- **Accessibility**: Maintain WCAG AA compliance with proper semantic HTML, keyboard navigation, and color contrast

## Architecture

### High-Level Architecture

The redesign follows a component-based architecture using Next.js 14 with React Server Components where appropriate and Client Components for interactive elements. The architecture maintains the existing data layer, API routes, and business logic while transforming only the presentation layer.

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Existing - No Changes)                                     │
│  - API Routes                                                │
│  - Business Logic                                            │
│  - Data Models                                               │
│  - Authentication                                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Presentation Layer                         │
│  (Redesigned)                                                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Layout     │  │  Components  │  │   Styling    │     │
│  │  Components  │  │   Library    │  │    System    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                 │
│                            ▼                                 │
│                    ┌──────────────┐                         │
│                    │    Pages     │                         │
│                    └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Layout Structure

The application uses a two-tier layout system:

1. **Root Layout** (`app/layout.tsx`): Provides global providers (SessionProvider, etc.)
2. **Dashboard Layout** (`app/dashboard/layout.tsx`): Implements the sidebar/mobile header navigation structure

```
┌────────────────────────────────────────────────────────┐
│  Desktop Layout (>= 1024px)                            │
│  ┌──────────┬──────────────────────────────────────┐  │
│  │          │                                      │  │
│  │ Sidebar  │        Main Content Area            │  │
│  │  (241px) │                                      │  │
│  │          │  ┌────────────────────────────────┐ │  │
│  │  - Logo  │  │  Welcome Section               │ │  │
│  │  - Nav   │  └────────────────────────────────┘ │  │
│  │  - Items │  ┌────────────────────────────────┐ │  │
│  │  - User  │  │  Stats Cards Grid              │ │  │
│  │  - Logout│  └────────────────────────────────┘ │  │
│  │          │  ┌────────────────────────────────┐ │  │
│  │          │  │  Data Tables                   │ │  │
│  │          │  └────────────────────────────────┘ │  │
│  │          │  ┌────────────────────────────────┐ │  │
│  │          │  │  Feature Cards                 │ │  │
│  │          │  └────────────────────────────────┘ │  │
│  └──────────┴──────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  Mobile Layout (< 1024px)                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Mobile Header (60px)                            │  │
│  │  Logo | Notifications | Hamburger                │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │        Main Content Area (Full Width)           │  │
│  │                                                  │  │
│  │  - Welcome Section                              │  │
│  │  - Stats Cards (2 columns)                      │  │
│  │  - Data Tables (Card View)                      │  │
│  │  - Feature Cards (1 column)                     │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

Following Tailwind CSS conventions:

- **Mobile**: < 768px (default)
- **Tablet**: >= 768px (md)
- **Desktop**: >= 1024px (lg)
- **Large Desktop**: >= 1280px (xl)

## Components and Interfaces

### Core Layout Components

#### 1. DashboardLayout Component

**Purpose**: Provides the main layout structure with sidebar and mobile header

**Location**: `src/components/layouts/DashboardLayout.tsx`

**Props Interface**:
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode
  user?: {
    name: string
    email: string
    avatar?: string
  }
}
```

**Responsibilities**:
- Render sidebar navigation on desktop (>= 1024px)
- Render mobile header on mobile/tablet (< 1024px)
- Manage mobile menu open/close state
- Provide consistent padding and background for main content area

#### 2. Sidebar Component

**Purpose**: Sticky left sidebar navigation for desktop

**Location**: `src/components/navigation/Sidebar.tsx`

**Props Interface**:
```typescript
interface SidebarProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  navigationItems: NavigationItem[]
  currentPath: string
}

interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavigationItem[]
}
```

**Key Features**:
- Fixed positioning with custom scrollbar
- Logo at top
- Navigation items with icons and active state highlighting
- User info section
- Logout button at bottom
- Horizontal divider between sections

**Styling**:
- Width: 241px
- Background: white
- Shadow: shadow-light-300
- Border radius: rounded-lg for menu items
- Active state: background color change + text color change

#### 3. MobileHeader Component

**Purpose**: Top navigation bar for mobile and tablet devices

**Location**: `src/components/navigation/MobileHeader.tsx`

**Props Interface**:
```typescript
interface MobileHeaderProps {
  onMenuToggle: () => void
  isMenuOpen: boolean
  user?: {
    name: string
    email: string
  }
}
```

**Key Features**:
- Logo on left
- Notification bell icon
- Hamburger menu icon on right
- Minimum height: 60px
- Shadow effect for depth

#### 4. MobileMenu Component

**Purpose**: Slide-out navigation menu for mobile

**Location**: `src/components/navigation/MobileMenu.tsx`

**Props Interface**:
```typescript
interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navigationItems: NavigationItem[]
  currentPath: string
  user?: {
    name: string
    email: string
  }
}
```

**Key Features**:
- Overlay backdrop with click-to-close
- Slide-in animation from right
- Full navigation items
- User info at top
- Logout button at bottom

### Content Components

#### 5. WelcomeSection Component

**Purpose**: Personalized greeting and CTA banner

**Location**: `src/components/dashboard/WelcomeSection.tsx`

**Props Interface**:
```typescript
interface WelcomeSectionProps {
  userName: string
  userAvatar?: string
  subtitle?: string
  ctaText?: string
  ctaDescription?: string
  ctaButtonText?: string
  ctaButtonHref?: string
  onCtaClick?: () => void
}
```

**Layout**:
- Desktop: Horizontal layout (greeting left, CTA right)
- Mobile: Vertical layout (greeting top, CTA bottom)

**Styling**:
- Greeting: 20px text, semibold
- Subtitle: gray-500 color
- CTA Banner: slate-900 background, rounded-xl, 24px padding
- Button: primary-base background, rounded-full (desktop) / rounded-xl (mobile)

#### 6. StatsCard Component

**Purpose**: Display individual metric with icon, label, value, and description

**Location**: `src/components/dashboard/StatsCard.tsx`

**Props Interface**:
```typescript
interface StatsCardProps {
  icon: React.ComponentType<{ className?: string }>
  iconBackgroundColor: string
  label: string
  value: string | number
  description?: string
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}
```

**Styling**:
- Background: gray-100
- Border radius: rounded-lg
- Padding: 24px
- Icon container: 48px x 48px, rounded-full
- Value: 2xl semibold
- Label: small text
- Description: xs text

#### 7. StatsGrid Component

**Purpose**: Responsive grid container for stats cards

**Location**: `src/components/dashboard/StatsGrid.tsx`

**Props Interface**:
```typescript
interface StatsGridProps {
  stats: Array<{
    id: string
    icon: React.ComponentType<{ className?: string }>
    iconBackgroundColor: string
    label: string
    value: string | number
    description?: string
  }>
}
```

**Grid Configuration**:
- Mobile (< 768px): 2 columns
- Tablet (>= 768px, < 1280px): 3 columns
- Desktop (>= 1280px): 4 columns
- Gap: 16px

#### 8. DataTableCard Component

**Purpose**: Display tabular data with header and "View All" link

**Location**: `src/components/dashboard/DataTableCard.tsx`

**Props Interface**:
```typescript
interface DataTableCardProps {
  title: string
  viewAllHref?: string
  columns: Array<{
    key: string
    label: string
    width?: string
  }>
  data: Array<Record<string, any>>
  emptyStateMessage?: string
  emptyStateAction?: {
    label: string
    href: string
  }
  renderCell?: (key: string, value: any, row: any) => React.ReactNode
  onRowClick?: (row: any) => void
}
```

**Key Features**:
- White background with border
- Header with title and "View All" link
- Column headers with gray-50 background
- Hover effect on rows
- Mobile: Switch to card view
- Empty state with centered message and action button

**Styling**:
- Border radius: rounded-lg
- Border: border-gray-200
- Padding: 24px (header), 16px (cells)
- Hover: hover:bg-muted/50

#### 9. FeatureCard Component

**Purpose**: Interactive card with hover effect for feature promotion

**Location**: `src/components/dashboard/FeatureCard.tsx`

**Props Interface**:
```typescript
interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  linkText: string
  linkHref: string
  onClick?: () => void
}
```

**Key Features**:
- Default: white background, gray border
- Hover: primary-base background, white text
- Smooth 200ms transition
- Icon container changes from primary-base/10 to white/20 on hover
- Minimum height: 260px

**Styling**:
- Border radius: rounded-2xl
- Padding: 24px
- Icon container: 44px x 44px, rounded-xl
- Title: xl or 2xl semibold
- Description: base text, leading-8
- CTA link: arrow icon, bottom alignment

#### 10. FeatureGrid Component

**Purpose**: Responsive grid container for feature cards

**Location**: `src/components/dashboard/FeatureGrid.tsx`

**Props Interface**:
```typescript
interface FeatureGridProps {
  features: Array<{
    id: string
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    linkText: string
    linkHref: string
  }>
}
```

**Grid Configuration**:
- Mobile (< 768px): 1 column
- Tablet (>= 768px, < 1280px): 2 columns
- Desktop (>= 1280px): 4 columns
- Gap: 16px

### Utility Components

#### 11. Card Component

**Purpose**: Base card component for consistent styling

**Location**: `src/components/ui/Card.tsx`

**Props Interface**:
```typescript
interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}
```

#### 12. Button Component

**Purpose**: Consistent button styling across application

**Location**: `src/components/ui/Button.tsx`

**Props Interface**:
```typescript
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  rounded?: 'default' | 'full'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  href?: string
  className?: string
}
```

## Data Models

No new data models are required for this redesign. All existing models remain unchanged:

- User
- Poll
- Vote
- Session
- Export
- AuditLog
- SystemMetrics

The redesign only affects the presentation layer and does not modify data structures, API contracts, or database schemas.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

