# iFi Image Generation Requirements

## Overview
This document outlines the image requirements for the iFi platform's pre-login pages. All images should follow the fintech-grade design aesthetic: institutional, professional, and trustworthy.

---

## Design Aesthetic Guidelines

### Color Palette
- **Primary Navy**: #0a0e1a, #141b2b, #1a2332
- **Intelligence Cyan**: #00d4ff
- **Intelligence Blue**: #5c8df6
- **White/Light**: #ffffff, #f8f9fa

### Style Principles
- Clean, minimal interfaces
- Data-driven visualizations
- Professional mockups (not overly glossy)
- Subtle shadows and depth
- High contrast for readability
- Institutional credibility

---

## 1. Features Page Images (6 Total)

### Location: `html/features.html`
**Current State**: Placeholder gradient boxes with colored icons
**Target**: Replace with actual interface mockups

#### 1.1 Dashboard Feature
- **Description**: iFi platform dashboard showing financial overview
- **Content to Show**:
  - Net worth chart (line graph trending upward)
  - Account balances (checking, savings, investment accounts)
  - Quick stats cards (monthly spending, savings rate, investment returns)
  - Clean navigation sidebar
- **Dimensions**: 800x600px (landscape)
- **Gradient**: Blue gradient (#5c8df6 to #4a6fd5)

#### 1.2 Budgeting Feature
- **Description**: Budget allocation and tracking interface
- **Content to Show**:
  - Pie chart or donut chart showing category breakdown
  - Budget categories with progress bars (Housing 65%, Food 80%, Transport 45%)
  - Monthly spending trends
  - "On Track" / "Over Budget" indicators
- **Dimensions**: 800x600px (landscape)
- **Gradient**: Teal gradient (#26a69a to #00897b)

#### 1.3 Transactions Feature
- **Description**: Transaction list and search interface
- **Content to Show**:
  - List of transactions with icons (Starbucks coffee icon, Gas station, Amazon)
  - Filters/search bar at top
  - Category tags (Food, Shopping, Bills)
  - Transaction amounts (negative in red, positive in green)
  - Date grouping (Today, Yesterday, This Week)
- **Dimensions**: 800x600px (landscape)
- **Gradient**: Orange gradient (#ff6f00 to #e65100)

#### 1.4 Investments Feature
- **Description**: Investment portfolio interface
- **Content to Show**:
  - Portfolio pie chart (Stocks 60%, Bonds 25%, Cash 15%)
  - Holdings list (AAPL, GOOGL, MSFT with share counts)
  - Performance graph (1Y return +12.5%)
  - Asset allocation recommendations
- **Dimensions**: 800x600px (landscape)
- **Gradient**: Green gradient (#00c853 to #00a843)

#### 1.5 AI Advisor Feature
- **Description**: Chat interface with iFi AI financial advisor
- **Content to Show**:
  - Chat bubbles showing conversation:
    - User: "Should I invest more in stocks?"
    - AI: "Based on your risk profile and 30-year timeline, increasing stock allocation from 60% to 70% could improve expected returns by 1.2% annually..."
  - AI avatar/icon at top
  - Message input field at bottom
  - Suggested questions chips
- **Dimensions**: 800x600px (landscape)
- **Gradient**: Cyan-blue gradient (#00d4ff to #5c8df6)

#### 1.6 Economy News Feature
- **Description**: Financial news and market data feed
- **Content to Show**:
  - News cards with headlines:
    - "Fed Holds Rates Steady"
    - "S&P 500 Reaches New High"
    - "Tech Stocks Rally on Earnings"
  - Market tickers (SPY +0.5%, QQQ +0.8%)
  - Date/time stamps
  - Read time indicators
- **Dimensions**: 800x600px (landscape)
- **Gradient**: Purple gradient (#9c27b0 to #7b1fa2)

---

## 2. How It Works Page Images (4 Total)

### Location: `html/how-it-works.html`
**Current State**: Emoji placeholders (👤🔗📈⚡)
**Target**: Process flow mockups

#### 2.1 Create Account (Step 1)
- **Description**: Signup/onboarding screen
- **Content to Show**:
  - Welcome screen with "Get Started" form
  - Name, email, password fields (partially filled)
  - Goal selection (Save for retirement, Pay off debt, Build wealth)
  - Progress indicator (Step 1 of 4)
- **Dimensions**: 600x400px (4:3 ratio)
- **Style**: Clean onboarding UI

#### 2.2 Connect Accounts (Step 2)
- **Description**: Account linking interface
- **Content to Show**:
  - Bank/institution logos (Chase, Bank of America, Vanguard)
  - "Securely connect" buttons
  - 256-bit encryption badge
  - "Skip this step" option
- **Dimensions**: 600x400px (4:3 ratio)
- **Style**: Trust-building with security badges

#### 2.3 See Insights (Step 3)
- **Description**: Initial insights dashboard
- **Content to Show**:
  - "Your Financial Snapshot" header
  - Key metrics discovered:
    - "You're paying $847/year in unnecessary fees"
    - "You could save $2,300 more per year"
    - "Your portfolio is 12% underdiversified"
  - Recommendation cards
- **Dimensions**: 600x400px (4:3 ratio)
- **Style**: Data visualization emphasis

#### 2.4 Take Action (Step 4)
- **Description**: Action recommendations interface
- **Content to Show**:
  - Actionable steps with checkboxes:
    - ✓ "Switch to low-fee index funds (Save $680/year)"
    - ✓ "Automate savings (Save $2,300/year)"
    - □ "Rebalance portfolio (Reduce risk 15%)"
  - "Schedule Automation" button
  - Progress tracker
- **Dimensions**: 600x400px (4:3 ratio)
- **Style**: Clear call-to-action emphasis

---

## 3. Pricing Page Enhancement (Optional)

### Location: `html/pricing.html`
**Current State**: Text-based features with emojis
**Target**: Feature comparison icons/graphics

#### Suggested Enhancements:
- **AI Badge Icon**: Replace 🤖 with custom AI chip icon
- **Premium Card Background**: Subtle circuit board pattern
- **Feature Icons**: Custom SVG icons for each feature
  - Lock icon for security
  - Chart icon for analytics
  - Lightning icon for automation

---

## 4. Contact Page Enhancement (Optional)

### Location: `html/contact-us.html`
**Current State**: Text-based contact methods
**Target**: Add support team illustration

#### Suggested Addition:
- **Support Team Graphic**: Professional illustration of support staff
- **Response Time Visual**: Clock/timer graphic showing 24-hour response
- **Trust Badges**: SSL certified, SOC 2 compliant icons

---

## Implementation Notes

### File Naming Convention
```
features-dashboard.png
features-budgeting.png
features-transactions.png
features-investments.png
features-ai-advisor.png
features-economy-news.png

how-it-works-step1.png
how-it-works-step2.png
how-it-works-step3.png
how-it-works-step4.png
```

### Storage Location
```
iFi/
  assets/
    images/
      features/
        dashboard.png
        budgeting.png
        ...
      how-it-works/
        step1.png
        step2.png
        ...
```

### HTML Integration
Once images are generated, update HTML files:

**Features (features.html):**
```html
<div class="feature-visual">
  <img src="../assets/images/features/dashboard.png" alt="iFi Dashboard Interface" />
</div>
```

**How It Works (how-it-works.html):**
```html
<div class="step-visual">
  <img src="../assets/images/how-it-works/step1.png" alt="Create Account Step" />
</div>
```

### CSS Adjustments Needed
After adding images, update CSS to remove placeholder backgrounds:

```css
/* features.css */
.feature-visual {
  background: transparent; /* Remove gradient */
  padding: 0; /* Remove padding */
}

.feature-visual img {
  width: 100%;
  height: auto;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
```

---

## Image Generation Tools

### Recommended Approaches:

1. **Figma/Sketch Mockups** (Best Quality)
   - Create actual interface designs
   - Export as high-res PNG
   - Maintains fintech aesthetic

2. **Screenshot + Edit** (Fast)
   - Build actual HTML/CSS components
   - Screenshot in browser
   - Edit in Photoshop/Figma

3. **AI Generation** (DALL-E, Midjourney)
   - Prompt: "Professional fintech dashboard interface, dark navy blue (#0a0e1a) background, cyan accents (#00d4ff), clean modern UI, financial charts, minimal design, institutional style"
   - Requires post-processing for accuracy

4. **Stock Images + Overlay** (Acceptable)
   - Purchase fintech UI kit
   - Customize colors to match brand
   - Add iFi branding

---

## Priority Order

### Phase 1 (High Priority):
1. Features page images (most visible, user-facing)
2. How It Works step illustrations

### Phase 2 (Medium Priority):
3. Pricing page icon enhancements
4. Contact page support illustration

### Phase 3 (Low Priority):
5. Decorative graphics
6. Background patterns
7. Loading animations

---

## Quality Standards

All images must:
- ✅ Match fintech color palette (#0a0e1a, #00d4ff, #5c8df6)
- ✅ Be optimized for web (<200KB each)
- ✅ Look professional and institutional
- ✅ Be responsive (work at multiple sizes)
- ✅ Include proper alt text for accessibility
- ✅ Be copyright-free or properly licensed

---

## Next Steps

1. **Create assets folder structure**
2. **Generate images using preferred method**
3. **Optimize images (compress, resize)**
4. **Update HTML to reference images**
5. **Adjust CSS to remove placeholders**
6. **Test on various screen sizes**
7. **Add loading states for images**

---

*Last Updated: 2025*
*Version: 1.0*
