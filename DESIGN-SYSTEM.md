# iFi Design System - Fintech-Grade UI/UX

## Overview
This design system implements institutional-grade micro-interactions and animations across all pre-login pages, creating a trustworthy, intelligent, and responsive experience that balances sophistication with approachability.

## Design Philosophy
**"This feels serious, smart, and worth trusting with my financial future"**

- **Institutional Trust**: Dark base tones, professional typography, generous spacing
- **Intelligent Responsiveness**: Smooth micro-interactions inspired by Cleo's feel (not visuals)
- **Financial Clarity**: Clear hierarchy, high-conversion design, accessibility-first

---

## Color System

### Primary Palette
```css
--navy-base: #0a0e1a;        /* Deep navy - primary background */
--navy-elevated: #1a1f2e;    /* Elevated surfaces */
--navy-card: #0f1420;        /* Card backgrounds */
```

### Accent Colors
```css
--cyan-primary: #00d4ff;     /* Primary accent - CTAs, focus states */
--blue-secondary: #5c8df6;   /* Secondary accent - gradients */
--gradient-primary: linear-gradient(135deg, #00d4ff, #5c8df6);
```

### Semantic Colors
```css
--success: #00c853;
--error: #f44336;
--warning: #ffc107;
```

### Text Colors
```css
--text-primary: #ffffff;
--text-secondary: rgba(255, 255, 255, 0.7);
--text-tertiary: rgba(255, 255, 255, 0.6);
--text-dark: #0a0e1a;
```

---

## Typography

### Font Family
```css
font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Weight Hierarchy
- **700** - Headlines, section titles
- **600** - Subheadings, CTA buttons
- **500** - Body emphasis, labels
- **400** - Body text, descriptions

### Size Scale
```css
--text-xs: 0.875rem;    /* 14px - labels, captions */
--text-sm: 1rem;        /* 16px - body text */
--text-md: 1.1rem;      /* 17.6px - large body */
--text-lg: 1.25rem;     /* 20px - subheadings */
--text-xl: 1.5rem;      /* 24px - card titles */
--text-2xl: 2rem;       /* 32px - section titles */
--text-3xl: 2.5rem;     /* 40px - hero headlines */
```

---

## Animation System

### Timing Values
```css
--instant: 150ms;       /* Immediate feedback (button press) */
--fast: 250ms;          /* Quick interactions (hover) */
--normal: 350ms;        /* Standard transitions (cards, buttons) */
--deliberate: 500ms;    /* Entrance animations, complex transitions */
--slow: 600ms;          /* Scroll reveals */
```

### Easing Functions
```css
--ease-standard: cubic-bezier(0.2, 0.0, 0.2, 1);  /* Material Design standard */
--ease-entrance: cubic-bezier(0.0, 0.0, 0.2, 1);  /* Entering screen */
--ease-exit: cubic-bezier(0.4, 0.0, 1, 1);        /* Leaving screen */
```

---

## Micro-Interactions

### Button States

#### Primary Buttons (.btn-primary, .cta-button, .btn-premium)
```css
/* Rest State */
padding: 1.25rem 3rem;
background: linear-gradient(135deg, #00d4ff, #5c8df6);
box-shadow: 0 6px 20px rgba(0, 212, 255, 0.3);

/* Hover State */
transform: translateY(-2px) scale(1.02);
box-shadow: 0 8px 28px rgba(0, 212, 255, 0.4);
+ Shimmer effect (gradient sweep)

/* Active State */
transform: translateY(0) scale(1);
box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
transition-duration: 150ms;

/* Focus State */
outline: 4px solid rgba(0, 212, 255, 0.4);
outline-offset: 2px;

/* Loading State */
Spinning border animation
opacity: 0.7;
pointer-events: none;
```

#### Secondary Buttons (.btn-secondary, .btn-outline)
```css
/* Rest State */
border: 2px solid rgba(92, 141, 246, 0.5);
background: transparent;

/* Hover State */
background: rgba(92, 141, 246, 0.1);
border-color: #5c8df6;
transform: translateY(-2px);
```

### Navigation Links
```css
/* Underline Animation */
::after pseudo-element slides in from left
width: 0 → 100% over 350ms
Gradient underline: linear-gradient(90deg, #00d4ff, #5c8df6)

/* Hover Color */
color: #00d4ff;

/* Active State */
color: #00d4ff;
underline visible at 100% width
```

### Cards (Purpose, Dashboard, Feature, Pricing)
```css
/* Hover State */
transform: translateY(-4px);
border-color: #00d4ff;
box-shadow: 0 12px 32px rgba(0, 212, 255, 0.2);

/* Icon Wrapper Hover */
transform: scale(1.05) rotate(5deg);
box-shadow: 0 8px 20px rgba(0, 212, 255, 0.3);
```

### Form Inputs
```css
/* Focus State */
border-color: #00d4ff;
box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.08);
Label color shifts to cyan

/* Valid State */
border-color: #00c853;
Checkmark icon appears on right

/* Invalid State */
border-color: #f44336;
Shake animation (400ms)
Error message slides down
```

---

## Scroll-Triggered Animations

### Reveal Pattern
```javascript
IntersectionObserver with:
- threshold: 0.15 (trigger at 15% visibility)
- rootMargin: '0px 0px -50px 0px'
```

### Staggered Card Reveal
```css
/* Base State */
opacity: 0;
transform: translateY(30px);

/* Revealed State */
opacity: 1;
transform: translateY(0);
transition: 600ms cubic-bezier(0.0, 0.0, 0.2, 1);

/* Stagger Delays */
Card 1: 0ms
Card 2: 100-150ms
Card 3: 200-300ms
Card 4: 300-450ms
```

### Section Headers
```css
/* Entrance Animation */
@keyframes fadeSlideUp {
    from {
        opacity: 0;
        transform: translateY(24px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

---

## Hero Entrance Animations

### Sequence Timing
```css
Headline:   0ms delay   (appears first)
Subheading: 150ms delay (follows headline)
CTA Button: 300ms delay (appears last)
Hero Image: 450ms delay (optional)

Duration: 500ms
Easing: cubic-bezier(0.0, 0.0, 0.2, 1)
```

### Pattern
```css
opacity: 0 → 1
transform: translateY(24px) → translateY(0)
```

---

## Spacing System

### Padding Scale
```css
--space-xs: 0.5rem;     /* 8px */
--space-sm: 1rem;       /* 16px */
--space-md: 1.5rem;     /* 24px */
--space-lg: 2rem;       /* 32px */
--space-xl: 3rem;       /* 48px */
--space-2xl: 4rem;      /* 64px */
```

### Section Spacing
```css
Page padding: 4rem 2rem;
Section gap: 3rem;
Card padding: 3rem;
Form gap: 1.5rem;
```

---

## Shadow System

### Elevation Levels
```css
--shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.1);
--shadow-md: 0 8px 32px rgba(0, 0, 0, 0.15);
--shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.2);
--shadow-cyan: 0 6px 20px rgba(0, 212, 255, 0.3);
--shadow-cyan-lg: 0 12px 32px rgba(0, 212, 255, 0.25);
```

### Usage
- **sm**: Input focus rings, small cards
- **md**: Content cards, form sections
- **lg**: Hero sections, elevated panels
- **cyan**: Primary CTAs, interactive elements
- **cyan-lg**: Card hover states, featured elements

---

## Border Radius Scale

```css
--radius-sm: 8px;       /* Input fields, small cards */
--radius-md: 12px;      /* Buttons, standard cards */
--radius-lg: 20px;      /* Large cards, sections */
--radius-full: 50%;     /* Icons, avatars */
```

---

## Responsive Breakpoints

```css
--mobile: 480px;
--tablet: 768px;
--desktop: 1024px;
--wide: 1400px;
```

### Layout Adjustments
- **Desktop (1024px+)**: 2-column grids, full padding
- **Tablet (768px)**: 1-column grids, reduced padding
- **Mobile (480px)**: Single column, compact spacing

---

## Accessibility Features

### Focus Indicators
```css
All interactive elements:
- 4px outline with cyan color
- 2px offset for visual separation
- High contrast (WCAG AAA compliant)
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Logical tab order
- Visible focus states
- Skip links for navigation

### Color Contrast
- Text on dark background: 7:1+ ratio (AAA)
- Primary CTAs: 4.5:1+ ratio (AA large)
- Focus indicators: 3:1+ ratio

---

## Implementation Files

### CSS Files
- `main.css` - Global styles, header navigation
- `animations.css` - Micro-interactions, keyframes, universal animation classes
- `contact-us.css` - Contact page specific styling
- `how-it-works.css` - How It Works page styling
- `[page].css` - Individual page styles

### JavaScript Files
- `animations.js` - Scroll observer, form enhancements, interaction handlers
- `site.js` - General site functionality

### Usage Pattern
```html
<link rel="stylesheet" href="../css/main.css">
<link rel="stylesheet" href="../css/animations.css">
<link rel="stylesheet" href="../css/[page].css">

<script src="../js/animations.js"></script>
```

---

## Page-Specific Implementation

### Contact Us Page ✅
- **Content**: Pure contact methods + form (NO FAQ, NO student discounts)
- **Interactions**: 
  - Contact methods reveal on scroll with stagger
  - Form inputs with focus glow
  - Submit button with loading → success states
  - Icon rotation on card hover

### How It Works Page ✅
- **Structure**: 4 sections (purpose, onboarding, examples, tiers)
- **Animations**: 
  - Purpose cards stagger reveal
  - Onboarding flow entrance
  - Dashboard examples scroll reveal
  - Tier comparison cards

### Remaining Pages ⏳
- Login, Signup, Features, Pricing, Forgot pages
- Need to apply animation system consistently

---

## Best Practices

### Performance
✅ Use CSS transforms (translateY, scale) over position/top/left
✅ IntersectionObserver instead of scroll listeners
✅ Unobserve elements after reveal
✅ GPU-accelerated properties only

### Consistency
✅ Same timing values across all pages
✅ Identical button hover states
✅ Unified color tokens
✅ Consistent spacing scale

### User Experience
✅ Reduced motion support
✅ Clear focus indicators
✅ Loading states for async actions
✅ Success/error feedback
✅ Accessible keyboard navigation

---

## Testing Checklist

- [ ] All buttons have hover, active, focus states
- [ ] Navigation links have underline animation
- [ ] Cards lift on hover with cyan glow
- [ ] Form inputs show focus state
- [ ] Scroll reveals trigger at 15% visibility
- [ ] Hero animations play on page load
- [ ] Reduced motion preference respected
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA/AAA
- [ ] Loading states work on submit
- [ ] Success/error states display correctly

---

## Future Enhancements

### Phase 2 (Optional)
- Parallax effect for hero sections
- Lottie animations for illustrations
- Cursor trail effects (subtle)
- Page transition animations
- Skeleton loading states
- Toast notifications system
- Modal/dialog animations

### Performance Optimizations
- Lazy load below-fold animations
- Preload critical animation CSS
- Debounce resize handlers
- Use requestAnimationFrame for custom animations

---

## Resources

### Design Inspiration
- **Cleo**: Micro-interaction feel (not copying visuals)
- **Stripe**: Clean fintech professionalism
- **Plaid**: Trust and security emphasis

### Technical References
- Material Design Motion System
- Framer Motion patterns
- WCAG 2.1 Accessibility Guidelines
- Web Animation Performance Best Practices

---

**Last Updated**: 2025-01-20
**Version**: 1.0.0
**Status**: Phase 1 Complete (Contact Us + How It Works)
