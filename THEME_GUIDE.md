# Theme System Guide

## Overview
Your SkillSync app now has a complete theme system with 3 themes:
1. **White (Light)** - Clean white background
2. **Black (Dark)** - Pure black background
3. **Dark Gray** - Medium gray background

## How to Use

### Theme Switcher
A theme switcher button has been added to:
- Dashboard page (top navigation)
- Courses page (top navigation)
- Home page (top right corner)

Click the theme button and select from:
- ☀️ **White** - Light theme
- 🌙 **Black** - Dark theme
- 🎨 **Dark Gray** - Gray theme

### Theme Persistence
The selected theme is automatically saved in the browser's local storage and will persist across sessions.

## Technical Details

### Files Modified
1. **`app/globals.css`** - Added `.dark-gray` theme CSS variables
2. **`app/layout.tsx`** - Wrapped app with ThemeProvider
3. **`components/theme-switcher.tsx`** - New theme switcher component
4. **`app/dashboard/page.tsx`** - Added theme switcher to navigation
5. **`app/courses/page.tsx`** - Added theme switcher to navigation
6. **`components/Home.tsx`** - Added theme switcher to home page

### Theme Configuration
The ThemeProvider is configured in `app/layout.tsx`:
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="light"
  enableSystem={false}
  themes={['light', 'dark', 'dark-gray']}
>
```

### CSS Variables
Each theme defines CSS variables for:
- Background colors
- Foreground (text) colors
- Card colors
- Border colors
- Primary/secondary colors
- Accent colors
- And more...

## Customization
To customize theme colors, edit the CSS variables in `app/globals.css`:
- `:root` - Light theme colors
- `.dark` - Black theme colors
- `.dark-gray` - Gray theme colors
