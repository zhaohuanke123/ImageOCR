# Browser Compatibility Testing Guide

## Supported Browsers

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome | 100+ | Fully Supported |
| Firefox | 100+ | Fully Supported |
| Safari | 15+ | Partially Supported |
| Edge | 100+ | Fully Supported |

## Testing Checklist

### Chrome (Primary Target)
- [ ] Image viewer pan/zoom works smoothly
- [ ] All keyboard shortcuts function correctly
- [ ] File download (Save/Export) works
- [ ] SVG overlays render correctly
- [ ] Scroll performance with 500+ nodes
- [ ] Touch gestures on touch-enabled devices

### Firefox
- [ ] All Chrome tests pass
- [ ] SVG rendering is correct
- [ ] Performance is acceptable

### Safari
- [ ] Basic functionality works
- [ ] File System Access API fallback (download instead of save picker)
- [ ] SVG rendering without artifacts
- [ ] Keyboard shortcuts work

### Edge
- [ ] All Chrome tests pass (Chromium-based)
- [ ] No Edge-specific issues

## Known Issues

### Safari
1. **File System Access API not supported**
   - Fallback: Uses traditional download method
   - "Save" button triggers download instead of file picker

2. **Large SVG rendering**
   - May have performance issues with 1000+ nodes
   - Workaround: Use filters to reduce visible nodes

### Mobile Browsers
- Touch gestures partially supported
- Recommended: Use tablet or desktop for full functionality

## Feature Support Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Pan/Zoom | Yes | Yes | Yes | Yes |
| Keyboard shortcuts | Yes | Yes | Yes | Yes |
| File System Access API | Yes | No | No | Yes |
| SVG filters | Yes | Yes | Partial | Yes |
| CSS Grid | Yes | Yes | Yes | Yes |
| CSS Custom Properties | Yes | Yes | Yes | Yes |

## Automated Testing

### Running Playwright Tests (Future)

```bash
# Install Playwright
npm install -D @playwright/test

# Run browser tests
npx playwright test
```

### Manual Testing Procedure

1. **Load Test Data**
   - Open the application with a large dataset (500+ nodes)
   - Verify all data loads correctly

2. **Image Viewer**
   - Test pan (drag or arrow keys)
   - Test zoom (scroll wheel, +/- buttons, pinch)
   - Test brightness/contrast adjustments

3. **Node Interactions**
   - Click to select nodes
   - Double-click to edit
   - Multi-select with checkboxes
   - Delete nodes with Delete key

4. **Edge Interactions**
   - Click edges to select
   - Edit via modal
   - Add new edges

5. **Filters**
   - Toggle show/hide blocks, nodes, edges
   - Filter by search text
   - Filter roots only
   - Filter low confidence

6. **Save/Export**
   - Save changes (Ctrl+S)
   - Export as JSON
   - Export as Markdown

7. **Performance**
   - Check response time with 500+ nodes
   - Check scroll smoothness in panels
   - Check image rendering at various zoom levels

## Browser-Specific CSS Fixes

### Safari SVG Rendering
```css
/* Force GPU acceleration for Safari */
svg {
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### Firefox Scrollbar Styling
```css
/* Custom scrollbar for Firefox */
.sidebar {
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}
```

## Reporting Issues

When reporting browser compatibility issues, include:
1. Browser name and version
2. Operating system
3. Steps to reproduce
4. Expected behavior
5. Actual behavior
6. Screenshots or screen recording
