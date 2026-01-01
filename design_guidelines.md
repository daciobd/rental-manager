# Design Guidelines: Rental Property Management System

## Design Approach
**System Selected:** Material Design 3 with productivity-focused adaptations
**Justification:** Information-dense management application requiring clarity, consistency, and efficient data visualization. Material Design provides robust patterns for forms, tables, and dashboard layouts while maintaining modern aesthetics.

## Typography Hierarchy

**Font Stack:**
- Primary: 'Inter' (Google Fonts) - exceptional readability for data-heavy interfaces
- Fallback: system-ui, -apple-system, sans-serif

**Scale:**
- Display (Dashboard metrics): text-4xl (36px), font-bold
- Page Headers: text-2xl (24px), font-semibold
- Section Headers: text-xl (20px), font-semibold
- Card Titles: text-lg (18px), font-semibold
- Body/Forms: text-base (16px), font-normal
- Labels: text-sm (14px), font-medium
- Captions/Meta: text-xs (12px), font-normal

## Layout System

**Spacing Units:** Use Tailwind's 4, 6, 8, 12, and 16 for consistent rhythm
- Component padding: p-6 (24px)
- Section spacing: mb-8 (32px)
- Card gaps: gap-4 (16px)
- Form field spacing: gap-6 (24px)
- Page margins: p-8 on desktop, p-4 on mobile

**Container Strategy:**
- Max width: max-w-7xl (1280px) for main content
- Dashboard cards: 4-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Forms: 2-column grid (grid-cols-1 md:grid-cols-2)
- Tables: Full-width with horizontal scroll on mobile

## Component Library

### Navigation & Header
- Top navigation bar with tab-based switching
- Tabs: Horizontal scrolling on mobile, full-width on desktop
- Active state: Underline indicator (border-b-2) instead of background fill
- Sticky header with elevation shadow on scroll

### Cards & Containers
- Property/Contract cards: Elevated with subtle shadow (shadow-sm), rounded-lg
- Left border accent (border-l-4) to indicate status/category
- Header section with title + action buttons (flex justify-between)
- Info grid: 3-4 columns on desktop, stack on mobile
- Expandable cards for detailed information

### Dashboard Metrics
- Stat cards: Elevated (shadow-md), rounded-xl
- Large number display with supporting label above
- Icon integration (heroicons) top-right for visual categorization
- Subtle background pattern or gradient overlay for visual interest
- Grid layout adapting from 4 → 2 → 1 columns

### Forms & Inputs
- Outlined input style (border-2) with focus ring (ring-2)
- Labels above inputs with required asterisk indicator
- Helper text below inputs (text-sm)
- Error states with red border + message
- Grouped related fields with visual dividers (border-t)
- Action buttons right-aligned, primary + secondary pattern

### Tables & Data Display
- Striped rows for better scanning (odd:bg-gray-50)
- Fixed header on scroll for long lists
- Sortable column headers with arrow indicators
- Row actions: Dropdown menu (3-dot icon) on hover
- Status badges: Rounded-full pills with icon + text
- Pagination controls at bottom-right

### Status Indicators
- Badge component: rounded-full, px-3 py-1, text-xs font-semibold
- Icon + text combination for clarity
- Distinct patterns for: Paid (check icon), Pending (clock), Overdue (alert)

### Receipts/Documents
- Print-optimized layout with clean typography
- Two-column layout for sender/recipient info
- Table for itemization
- Signature area with dotted line
- Print button with PDF export capability

### Modals & Overlays
- Backdrop blur effect (backdrop-blur-sm)
- Centered modal with max-w-2xl
- Close button top-right (X icon)
- Footer with action buttons (Cancel + Primary action)

## Responsive Behavior

**Breakpoints:**
- Mobile: < 768px - Single column, stacked cards, hamburger menu
- Tablet: 768px-1024px - 2-column grids, visible navigation
- Desktop: > 1024px - Full multi-column layouts

**Mobile Adaptations:**
- Tab navigation: Horizontal scroll or dropdown selector
- Tables: Card view transformation for complex data
- Forms: Single column with larger touch targets (min-h-12)
- Dashboard: Stack metrics vertically with full-width cards

## Interactions & Feedback

**Minimal Animation Philosophy:**
- Transition durations: transition-all duration-200
- Hover states: Subtle scale (hover:scale-105) on cards only
- Focus states: Ring-based focus indicators for accessibility
- Loading: Skeleton screens for data fetching, no spinners
- Toasts: Bottom-right notifications for actions (3s duration)

## Accessibility Standards

- Minimum touch target: 44×44px for all interactive elements
- Keyboard navigation: Full tab order, visible focus indicators
- ARIA labels: All icons have aria-label attributes
- Form validation: Error messages linked via aria-describedby
- Semantic HTML: Proper heading hierarchy, table structure

## Icons
**Library:** Heroicons (outline style via CDN)
- Dashboard: chart-bar, currency-dollar, home, document-text
- Actions: pencil, trash, eye, printer, download
- Status: check-circle, clock, exclamation-triangle
- Navigation: chevron-right, bars-3

## Images
**No hero images required** - Utility application focused on data display and workflows. Images only appear in:
- Empty states: Illustrative SVG for "no properties yet" messaging
- User avatars: Small circular placeholders (40×40px)
- Property thumbnails: Optional square images (80×80px) in property cards

This design prioritizes clarity, efficiency, and data accessibility over visual storytelling.