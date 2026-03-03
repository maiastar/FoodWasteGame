# Deployment Guide

## Quick Start (Local Testing)

### Option 1: Python Server (Recommended)
```bash
cd food-waste-simulator
python3 -m http.server 8001

# Open browser: http://localhost:8001
```

### Option 2: Node.js Server
```bash
cd food-waste-simulator
npx http-server -p 8001

# Open browser: http://localhost:8001
```

### Option 3: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

## Deployment Options

### Option 1: GitHub Pages (FREE, Easiest)

**Steps**:

1. **Create GitHub Repository**
```bash
cd food-waste-simulator
git init
git add .
git commit -m "Initial commit - Food Waste Simulator"
```

2. **Push to GitHub**
```bash
# Create repo on github.com first, then:
git remote add origin https://github.com/yourusername/food-waste-simulator.git
git branch -M main
git push -u origin main
```

3. **Enable GitHub Pages**
- Go to repository Settings
- Navigate to "Pages" section
- Source: Deploy from branch `main`, folder `/` (root)
- Click Save

4. **Access Your Game**
- URL: `https://yourusername.github.io/food-waste-simulator/`
- Usually live within 2-3 minutes

**Pros**:
- Completely free
- Easy updates (just git push)
- Custom domains available
- Reliable hosting

**Cons**:
- Public repository required (or GitHub Pro for private)
- Takes a few minutes to update

### Option 2: Itch.io (FREE, Game-Focused)

**Steps**:

1. **Create Account**
   - Sign up at https://itch.io/

2. **Create New Project**
   - Dashboard → "Create new project"
   - Project type: HTML
   - Pricing: Free or "Name your price"

3. **Prepare Upload**
```bash
cd food-waste-simulator
zip -r food-waste-sim.zip . -x "*.DS_Store" "*/node_modules/*"
```

4. **Upload**
   - Upload ZIP file
   - Set viewport: 1280x720 (or check "fullscreen")
   - Check "This file will be played in the browser"
   - Save & publish

5. **Access Your Game**
   - URL: `https://yourusername.itch.io/food-waste-simulator`

**Pros**:
- Game-specific platform
- Built-in analytics
- Community features
- Donation system available

**Cons**:
- Requires account
- Updates require re-upload

### Option 3: Netlify (FREE, Professional)

**Steps**:

1. **Sign Up**
   - Create account at https://netlify.com

2. **Deploy via Drag-and-Drop**
   - Drag `food-waste-simulator` folder to Netlify dashboard
   - Auto-deploys instantly

3. **OR Deploy via Git**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd food-waste-simulator
netlify deploy --prod
```

4. **Access Your Game**
   - URL: `https://random-name-12345.netlify.app/`
   - Can set custom domain

**Pros**:
- Instant deploys
- Automatic HTTPS
- Custom domains easy
- Preview deployments

**Cons**:
- Requires account
- Free tier has bandwidth limits (generous though)

### Option 4: Vercel (FREE, Similar to Netlify)

Same process as Netlify - excellent alternative.

## Pre-Deployment Checklist

### Technical
- [ ] Test in Chrome, Firefox, Safari
- [ ] Test on mobile device (iPhone/Android)
- [ ] Check console for errors (F12)
- [ ] Verify all scenes load correctly
- [ ] Test save/load functionality
- [ ] Confirm all minigames work
- [ ] Check performance (60 FPS)

### Content
- [ ] All text is kid-friendly
- [ ] Educational tips are accurate
- [ ] Credits include asset sources
- [ ] README is updated
- [ ] Help system works (press ?)

### Assets
- [ ] Images are optimized
- [ ] Audio files are compressed
- [ ] Total bundle size <10MB
- [ ] Fonts load correctly

## Optimization Tips

### 1. Minify JavaScript (Optional)
```bash
# Install terser
npm install -g terser

# Minify files
terser js/models/Household.js -o js/models/Household.min.js -c -m
# Repeat for all JS files
```

### 2. Optimize Images
- Use tools like TinyPNG or ImageOptim
- Target: <100KB per sprite
- Format: PNG for sprites with transparency, JPG for backgrounds

### 3. Enable Compression
Most hosts (GitHub Pages, Netlify, Vercel) automatically compress files with gzip.

### 4. Add Service Worker (PWA - Advanced)
Make game installable and work offline:
```javascript
// sw.js
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('food-waste-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/css/styles.css',
        '/js/main.js',
        // ... all files
      ]);
    })
  );
});
```

## Sharing Your Game

### For Schools
- Embed in Google Classroom: Share URL
- Add to school website: Use iframe
```html
<iframe src="https://your-game-url.com" width="1280" height="720"></iframe>
```

### For Friends/Family
- Share direct link
- Works on any device with modern browser
- No installation required

### For Portfolio
- Add to personal website
- Include on resume/CV
- Showcase on LinkedIn

## Mobile Optimization

### Responsive Design
Game already scales automatically via Phaser config, but test:
- Portrait vs landscape
- Touch controls (tap instead of click)
- Virtual keyboard issues

### Mobile-Specific Tweaks
```javascript
// In config.js, add:
if (isMobile()) {
    config.scale.mode = Phaser.Scale.RESIZE;
    config.scale.parent = 'game-container';
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
```

## Analytics (Optional)

### Simple Analytics
Add to `index.html`:
```html
<!-- Google Analytics (free) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-ID');
</script>
```

### Track Game Events
```javascript
// In your game code
function trackEvent(action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': 'Game',
            'event_label': label
        });
    }
}

// Usage
trackEvent('minigame_completed', 'Shopping');
```

## Troubleshooting

### Issue: Game doesn't load
- Check browser console (F12) for errors
- Verify all script files are loading (Network tab)
- Confirm Phaser CDN is accessible

### Issue: Assets not loading
- Check file paths (case-sensitive on some servers!)
- Verify assets exist in correct folders
- Use browser dev tools to see 404 errors

### Issue: Save/load not working
- localStorage must be enabled in browser
- Some browsers block localStorage in "private/incognito" mode
- Check browser settings

### Issue: Mobile doesn't work
- Ensure touch events are enabled
- Check viewport meta tag in HTML
- Test on actual devices, not just browser dev tools

## Custom Domain (Optional)

### GitHub Pages with Custom Domain
1. Add `CNAME` file to repository:
```
yourgame.com
```

2. Update DNS settings with your domain provider:
```
Type: CNAME
Name: @
Value: yourusername.github.io
```

### Netlify/Vercel Custom Domain
- Add domain in dashboard
- Follow DNS configuration instructions
- Automatic HTTPS included

## Maintenance

### Updating Content
1. Edit JSON files in `assets/data/`
2. Test locally
3. Deploy (git push or re-upload)

### Adding Features
1. Create new scene or modify existing
2. Test thoroughly
3. Update version number
4. Deploy with changelog

### Bug Fixes
- Keep a list of known issues
- Prioritize game-breaking bugs
- Test fixes across browsers

## Performance Monitoring

### Check Page Load Time
- Use Chrome DevTools Lighthouse
- Target: Load in <3 seconds on 3G
- Optimize based on suggestions

### Monitor FPS
```javascript
// Add to main.js for development
if (window.location.hostname === 'localhost') {
    setInterval(() => {
        console.log('FPS:', game.loop.actualFps.toFixed(1));
    }, 5000);
}
```

## Going Live Checklist

- [ ] Game fully tested
- [ ] All placeholders replaced (or acceptable)
- [ ] Educational content verified
- [ ] README updated with game URL
- [ ] Credits/attribution added
- [ ] Shared with test users
- [ ] Feedback incorporated
- [ ] Final bug fixes
- [ ] Deployed to production
- [ ] URL shared with target audience

## Estimated Deployment Times

- **GitHub Pages**: 5-10 minutes (first time)
- **Itch.io**: 10-15 minutes (upload + configure)
- **Netlify/Vercel**: 5 minutes (drag-drop)
- **Custom Domain**: +30 minutes (DNS propagation)

## Support Resources

- **Phaser Documentation**: https://photonstorm.github.io/phaser3-docs/
- **Phaser Examples**: https://phaser.io/examples
- **Phaser Discord**: Community support
- **Stack Overflow**: Tag questions with [phaser.js]

---

**Ready to deploy?** Start with local testing, then choose GitHub Pages for simplicity or itch.io for game community features!
