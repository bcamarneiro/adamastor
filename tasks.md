# Adamastor Development Tasks

## Overview

This document outlines the strategic approach to developing Adamastor, a Portuguese parliament transparency platform. We use a **page-based exploratory testing approach** combined with **CCPM (Claude Code PM)** epic-based development.

## Current Status

**Completed:**
- ✅ Issue #42: Removed confusing party voting section (PR #201)
- ✅ Issue #14: E2E tests for comparison filtering (PR #202)

**PRDs Created (Ready for Epic Parsing):**
1. [Testing & Quality Epic](.claude/prds/testing-quality-epic.md) - 3 issues
2. [UX/UI Improvements](.claude/prds/ux-ui-improvements.md) - 5 issues
3. [Feature Enhancements](.claude/prds/feature-enhancements.md) - 4 issues
4. [Data & Performance](.claude/prds/data-performance.md) - 5 issues
5. [Platform Completeness](.claude/prds/platform-completeness.md) - 4 issues
6. [Innovative Features](.claude/prds/innovative-features.md) - 2 issues

## Prioritization Framework

### IT Architect Perspective: Critical Path Analysis

**What breaks core value?**
1. **Privacy Policy (#87)** - Legal compliance blocker for EU users
2. **Data Constraints (#85)** - Prevents data integrity issues
3. **CI Optimization (#33)** - Developer productivity bottleneck
4. **Data Source URLs (#43)** - Platform credibility foundation

**What compounds over time?**
- CI slowness (#33) - Impacts every PR
- Data quality issues (#85, #43) - Trust erosion
- Missing tests (#15, #65) - Technical debt accumulation

### Product Manager Perspective

**North Star Metric:** User trust and engagement with democratic transparency

**Critical User Journeys:**
1. **Discover Deputy Performance** (Landing → Ranking → Deputy Profile)
2. **Compare Options** (Battle Royale, District/Party Comparisons)
3. **Track Initiatives** (Initiatives page → Legislative proposals)
4. **Understand Impact** (Waste Calculator)

**Jobs-to-be-Done:**
- "Help me understand my deputy's performance"
- "Help me compare political options objectively"
- "Help me hold representatives accountable"

## 4-Tier Priority Stack

### Tier 0: Critical (Do First)
**Blockers & Compliance**
- Privacy Policy (#87) - **MANDATORY** for EU compliance
- Any critical bugs found during exploratory testing
- Data constraints (#85) - Quick win, prevents data corruption

### Tier 1: Quick Wins (High ROI)
**Low effort, high impact**
- Sentry source maps (#9) - Better debugging
- Ranking formula panel (#38) - Transparency improvement
- Cross-links between pages (#28) - Navigation improvement
- CI optimization (#33) - Developer velocity

### Tier 2: High Impact Features
**Core value drivers**
- Party comparison in Battle Royale (#51) - Extends popular feature
- Data source URLs (#43) - Platform credibility
- Mobile responsiveness testing (#15) - Accessibility
- Deputy activity visualization (#40) - Engagement driver

### Tier 3: Strategic Bets
**Experimental & long-term**
- AI legal simplifier (#113) - Differentiation
- Stylized avatars (#107) - Visual identity
- Vercel Edge caching (#122) - Performance at scale

## Page-Based Exploratory Testing Approach

Before implementing features, validate current state and identify issues through systematic page testing.

### Testing Flow (10 Pages)

**1. Landing Page (`/`)**
- Hero section & value proposition
- Feature cards (6 cards)
- Navigation to all sections
- Mobile responsiveness

**2. Ranking Page (`/classificacao`)**
- Deputy list with grades
- Sorting functionality
- Search/filter capabilities
- Performance with 230+ deputies
- Formula explanation access

**3. Deputy Profile Pages (`/deputados/[shortName]`)**
- Basic info display
- Performance metrics
- Attendance visualization
- Voting records
- Navigation to related content

**4. Parliament Page (`/parlamento`)**
- Overview statistics
- Current composition
- Party breakdown
- Links to deputy list

**5. Battle Royale (`/batalha-real`)**
- Deputy-vs-deputy comparison
- District comparison (`/distritos/comparar`) - ✅ Tested (Issue #14)
- Party comparison - **Not implemented yet (#51)**
- Results display
- Reset functionality

**6. Districts Pages**
- Districts list (`/distritos`)
- District detail pages
- Deputy-by-district view
- Comparison link

**7. Parties Pages**
- Parties list (`/partidos`)
- Party detail pages - **Not implemented yet (#46)**
- Deputy-by-party view
- Party statistics

**8. Initiatives Page (`/iniciativas`)**
- Legislative proposals list
- Filtering/sorting
- Proposal details
- Deputy authorship links

**9. Waste Calculator (`/calculadora-desperdicio`)**
- Input functionality
- Calculations accuracy
- Results display
- Educational messaging

**10. Info Pages**
- About page
- Privacy policy - **Not implemented yet (#87)**
- Contact information
- Footer links

### Testing Capture Template

For each page, document:
```markdown
## Page: [Page Name]

### What Works Well
- [Feature/functionality that works correctly]

### Issues Found
- **[Severity: High/Medium/Low]**: [Description]
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Related issue: #XXX (if exists)

### Enhancement Opportunities
- [Potential improvement]
- Related PRD: [link to relevant PRD]

### Mobile/Tablet Notes
- [Responsive behavior observations]
```

## CCPM Workflow

### Next Steps for Epic Creation

1. **Parse PRDs into Epics**
   ```bash
   /pm:prd-parse testing-quality-epic
   /pm:prd-parse ux-ui-improvements
   /pm:prd-parse feature-enhancements
   /pm:prd-parse data-performance
   /pm:prd-parse platform-completeness
   /pm:prd-parse innovative-features
   ```

2. **Decompose Epics into Tasks**
   ```bash
   /pm:epic-decompose
   ```

3. **Sync to GitHub Issues**
   ```bash
   /pm:epic-sync
   ```
   Creates hierarchical issue structure:
   - 1 Epic issue (parent)
   - Multiple Task issues (children)
   - Proper labels and relationships

4. **Start Implementation**
   ```bash
   /pm:issue-start <issue-number>
   ```
   Automatically:
   - Creates branch following naming convention
   - Updates issue status
   - Sets up work context

## Recommended Development Sequence

### Phase 1: Validation & Critical Fixes (Week 1-2)
1. **Exploratory Testing** - Complete all 10 pages, document findings
2. **Privacy Policy** (#87) - Create mandatory compliance page
3. **Critical Bug Fixes** - Address any P0 issues from testing
4. **Data Constraints** (#85) - Quick database integrity fix

### Phase 2: Quick Wins (Week 3-4)
1. **Sentry Source Maps** (#9) - Improve debugging
2. **Ranking Formula Panel** (#38) - Add transparency
3. **Cross-links** (#28) - Improve navigation
4. **Mobile Testing** (#15) - E2E responsive tests

### Phase 3: High Impact Features (Week 5-8)
1. **Party Comparison** (#51) - Extend Battle Royale
2. **Data Source URLs** (#43) - Add provenance
3. **Deputy Activity Viz** (#40) - Enhance profiles
4. **CI Optimization** (#33) - Speed up pipeline

### Phase 4: Platform Maturity (Week 9-12)
1. **Party Detail Pages** (#46) - Complete party section
2. **Advanced Filters** (#10) - Ranking page enhancements
3. **International Search** (#112) - Diaspora support
4. **Feature Flags Testing** (#65) - Quality assurance

### Phase 5: Strategic Bets (Future)
1. **AI Legal Simplifier** (#113) - POC & validation
2. **Stylized Avatars** (#107) - Design exploration
3. **Edge Caching** (#122) - Performance optimization

## Issue Mapping to PRDs

### Testing & Quality Epic (3 issues)
- ✅ #14 - Comparison filtering tests (DONE)
- #15 - Mobile responsiveness testing
- #65 - Feature flags testing

### UX/UI Improvements (5 issues)
- ✅ #42 - Remove party voting section (DONE)
- #38 - Collapsible ranking formula
- #40 - Deputy activity visualization
- #27 - Improve deputy absence stats
- #28 - Cross-links between pages

### Feature Enhancements (4 issues)
- #51 - Battle Royale party comparison
- #46 - Party detail page
- #10 - Advanced ranking filters
- #106 - Deputy contact information

### Data & Performance (5 issues)
- #43 - Trackable data source URLs
- #33 - Optimize CI migrations
- #85 - Database ranking constraint
- #6 - Legislature auto-detection
- #122 - Vercel Edge API caching

### Platform Completeness (4 issues)
- #112 - International voting circle search
- #87 - Privacy policy page
- #9 - Sentry source maps
- #8 - SEO domain update

### Innovative Features (2 issues)
- #113 - AI legal language simplifier
- #107 - Stylized deputy avatars

## Success Metrics

**Platform Health:**
- Test coverage > 80%
- CI pipeline < 2 minutes
- Zero P0 bugs in production
- Privacy compliance achieved

**User Engagement:**
- Avg session duration increase
- Cross-page navigation increase
- Battle Royale usage increase
- Mobile traffic growth

**Developer Velocity:**
- PRs merged per week
- Time from issue → deployment
- Bug fix turnaround time

## Notes

- **Always test before implementing** - Exploratory testing validates assumptions
- **Page-based organization** - Aligns with user mental model
- **CCPM for complex work** - Use epic workflow for multi-task features
- **Standard workflow for bugs** - Quick fixes go straight to PR
- **Continuous validation** - E2E tests prevent regression

---

**Last Updated:** 2026-01-27
