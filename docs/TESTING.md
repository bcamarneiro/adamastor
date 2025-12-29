# Manual Testing Guide

This guide is for non-technical contributors who want to help test the application. No coding experience is required!

## Getting Started

- **Staging URL**: https://adamastor-staging.vercel.app
- **Parliament Source**: https://www.parlamento.pt (for data verification)

## Test 1: Deputy Search

**Objective:** Verify the search functionality works correctly

### Steps

1. Go to the homepage
2. Locate the search bar in the navigation
3. Type a deputy name (e.g., "Pedro", "Ana", "Maria")
4. Wait for results to appear (should be within 1-2 seconds)
5. **Click** on a search result
6. Verify you are navigated to the deputy's profile page
7. Go back and search again
8. Use **keyboard navigation** (↑↓ arrows) to highlight a result
9. Press **Enter** to select
10. Verify navigation works
11. Press **Escape** to close the search dropdown

### Expected Results

- Results appear as you type (after 2+ characters)
- Clicking a result navigates to the deputy page
- Keyboard navigation works smoothly
- Escape closes the dropdown

### Report Issues

Note any problems with:
- Search results not appearing
- Click not navigating
- Slow response times
- Visual glitches

---

## Test 2: Deputy Profile Accuracy

**Objective:** Verify deputy data matches the official Parliament website

### Steps

1. Pick 5 random deputies from the rankings page
2. For each deputy, open their profile page
3. Open the official Parliament page for comparison:
   - Go to https://www.parlamento.pt/DeputadoGP/Paginas/Deputados_ef.aspx
   - Find the same deputy
   - Click on their name to see their biography
4. Compare the following data:
   - Name (should match)
   - Party (should match current party)
   - District (should match)
   - Photo (should be the same person)
   - Profession (if displayed)

### Report Template

```
Deputy: [Name]
Our Page: [URL]
Parliament Page: [URL]

Discrepancies Found:
- [ ] Name mismatch: [details]
- [ ] Party mismatch: [details]
- [ ] District mismatch: [details]
- [ ] Photo issue: [details]
- [ ] Other: [details]

Screenshots: [attach if applicable]
```

---

## Test 3: District/Party Comparison Pages

**Objective:** Verify filtering and sorting work correctly

### Steps

1. Go to the Rankings page
2. Test district filter:
   - Select a district (e.g., "Lisboa", "Porto")
   - Verify only deputies from that district appear
3. Test party filter:
   - Select a party
   - Verify only deputies from that party appear
4. Test sorting:
   - Sort by Grade (A→F)
   - Sort by Name
   - Verify order changes correctly
5. Test combinations:
   - Filter by district AND party
   - Verify results are correct

### Expected Results

- Filters apply immediately
- Results update without page reload
- Count displays correctly
- Sorting works in both directions

---

## Test 4: Mobile Responsiveness

**Objective:** Verify the app works well on mobile devices

### Steps

1. Open the staging URL on a mobile device (or use browser DevTools mobile mode)
2. Test the following pages:
   - Homepage
   - Rankings page
   - Deputy profile page
   - Search functionality
3. Check:
   - Text is readable (not too small)
   - Buttons are tappable (not too small)
   - Navigation menu works
   - No horizontal scrolling required
   - Images display correctly

### Report Template

```
Device: [e.g., iPhone 14, Samsung Galaxy S23]
Browser: [e.g., Safari, Chrome]

Issues Found:
- Page: [which page]
- Issue: [description]
- Screenshot: [attach]
```

---

## Test 5: Photo Display

**Objective:** Verify deputy photos load correctly

### Steps

1. Go to the Rankings page
2. Scroll through the list of deputies
3. Note any deputies showing:
   - Placeholder image (question mark or generic silhouette)
   - Broken image icon
   - Wrong photo (different person)
4. Click on deputies with issues to see their profile
5. Check if the Parliament website has a photo for them

### Report Template

```
Deputies with Photo Issues:
1. [Name] - [Issue type: missing/broken/wrong]
2. [Name] - [Issue type]
...

Verified against Parliament website: Yes/No
```

---

## How to Submit Reports

1. Create a GitHub issue using the "Manual Testing Task" template
2. Include:
   - Which test you performed
   - Browser and device used
   - Steps to reproduce any issues
   - Screenshots when helpful
3. Label the issue with `testing`

## Questions?

If you have questions about testing, open a GitHub issue with the `question` label.

Thank you for helping improve the application!
