# Asset Integration Guide

## Overview

This guide explains how to source and integrate free game assets for the Food Waste Simulator. The game currently uses emoji placeholders, but you can replace them with proper sprites for a more polished look.

## Recommended Free Asset Sources

### 1. Kenney.nl (Best for Prototyping)
**URL**: https://kenney.nl/assets

**Why**: 
- 100% free, CC0 license (use anywhere, no attribution needed)
- Consistent art style
- Large collection of food, UI, and character assets

**Recommended Packs**:
- **Food Pack**: https://kenney.nl/assets/food-pack
  - 200+ food item sprites (fruits, vegetables, meats, dairy)
  - Perfect for inventory and minigames
  
- **UI Pack**: https://kenney.nl/assets/ui-pack
  - Buttons, panels, icons
  - Multiple color themes
  
- **Casual Game UI**: https://kenney.nl/assets/casual-game-ui
  - Cartoony buttons and panels
  - Great for kid-friendly interface

**How to Use**:
1. Download the pack (PNG or sprite sheet)
2. Place sprites in `assets/sprites/`
3. Update sprite keys in food-database.json
4. Load in BootScene.js using `this.load.image()` or `this.load.atlas()`

### 2. OpenGameArt.org
**URL**: https://opengameart.org/

**Search Terms**:
- "food sprites"
- "kitchen items"
- "cartoon characters"
- "grocery store"

**Licensing**: Varies - check each asset's license (most are CC-BY or CC0)

### 3. Itch.io Asset Library
**URL**: https://itch.io/game-assets/free

**Filter**: Free + 2D + Food/Cooking

**Notable Free Packs**:
- Search "food pixel art" for retro-style food sprites
- Many free UI kits available
- Character generators

### 4. Freepik (With Attribution)
**URL**: https://www.freepik.com/

**Free Tier**: Requires attribution in game credits

**Best For**: Character illustrations, backgrounds, detailed food art

## Integration Steps

### Step 1: Download Assets

Example - Kenney Food Pack:
```bash
# Download and extract to assets/sprites/
cd food-waste-simulator/assets/sprites/
# Extract kenney-food-pack.zip here
```

### Step 2: Create Sprite Atlas (Optional)

For better performance, combine sprites into an atlas:

**Using Free Tools**:
- **TexturePacker** (free version): https://www.codeandweb.com/texturepacker
- **Shoebox** (free): https://renderhjs.net/shoebox/
- **Free Texture Packer**: https://free-tex-packer.com/

**Manual Approach** (for prototyping):
- Keep individual PNG files
- Load each in BootScene:

```javascript
this.load.image('apple', 'assets/sprites/apple.png');
this.load.image('banana', 'assets/sprites/banana.png');
// etc.
```

### Step 3: Update Food Database

Update `assets/data/food-database.json` with correct sprite keys:

```json
{
  "name": "Apple",
  "spriteKey": "apple",  // Matches loaded sprite key
  ...
}
```

### Step 4: Update Scene Code

Replace emoji icons with sprites:

**Before** (in ShoppingMinigame.js):
```javascript
const icon = icons[foodItem.category] || '🍱';
const itemIcon = this.add.text(0, -30, icon, {
    fontSize: '48px'
}).setOrigin(0.5);
```

**After**:
```javascript
const itemIcon = this.add.image(0, -30, foodItem.spriteKey);
itemIcon.setScale(0.5); // Adjust size as needed
itemIcon.setOrigin(0.5);
```

## Current Asset Status

### Using Emoji Placeholders
Currently, the game uses emoji for:
- Food items (🍎🍌🥛🥩)
- Category icons
- UI decorations

**Pros**:
- Works immediately, no download needed
- Consistent across platforms
- Easy to prototype

**Cons**:
- Less visual appeal
- Limited customization
- May look different on different devices

### Migration Path

**Phase 1** (Current): Emoji placeholders ✅
**Phase 2**: Replace food items with sprites
**Phase 3**: Replace UI elements with custom buttons/panels
**Phase 4**: Add character sprites
**Phase 5**: Add background illustrations

## Recommended Asset List

### Must-Have (Priority 1)
1. **Food item sprites** (30+ items)
   - Common groceries from food-database.json
   - 128x128 or 256x256 px
   
2. **UI buttons** (5 styles)
   - Primary action (green)
   - Secondary action (blue)
   - Warning (red/orange)
   - Neutral (gray)
   
3. **Panel backgrounds** (3 types)
   - Stats panel
   - Inventory panel
   - Modal/popup

### Nice-to-Have (Priority 2)
4. **Character sprites** (family members)
   - Different ages (kid, teen, adult)
   - Different poses (happy, neutral, concerned)
   
5. **Environment sprites**
   - Fridge interior
   - Store shelves
   - Kitchen counter
   
6. **Icons** (various)
   - Calendar
   - Clock/timer
   - Money/budget
   - Waste bin

### Polish (Priority 3)
7. **Particle effects**
   - Stars for success
   - Smoke for spoilage
   - Sparkles for achievements
   
8. **Background illustrations**
   - Kitchen scene
   - Store interior
   - Dining room

## Audio Assets

### Music
**Sources**:
- **Incompetech**: https://incompetech.com/music/ (CC-BY, free)
- **OpenGameArt Music**: https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=12

**Needed**:
- Background music (upbeat, kid-friendly loop)
- Menu music (lighter, calmer)

**Format**: MP3 or OGG (Phaser supports both)

### Sound Effects
**Sources**:
- **Freesound.org**: https://freesound.org/ (various licenses)
- **Kenney Audio**: https://kenney.nl/assets/category:Audio

**Needed**:
- Button click/select
- Item pickup/place
- Success chime
- Warning/error beep
- Cash register (checkout)
- Cooking sounds (sizzle, boil)
- Fridge open/close

## Example Integration

Here's a complete example of integrating Kenney assets:

### 1. Download Assets
```bash
# Download Food Pack from kenney.nl
# Extract to assets/sprites/kenney-food/
```

### 2. Update BootScene.js
```javascript
preload() {
    // Load Kenney food sprites
    this.load.atlas('food-items', 
        'assets/sprites/kenney-food/foodPack_spritesheet.png',
        'assets/sprites/kenney-food/foodPack_spritesheet.json'
    );
    
    // Load UI elements
    this.load.atlas('ui-elements',
        'assets/sprites/kenney-ui/uiPack_spritesheet.png',
        'assets/sprites/kenney-ui/uiPack_spritesheet.json'
    );
}
```

### 3. Update Food Items
In any scene using food items:
```javascript
// Old: emoji
const icon = this.add.text(x, y, '🍎', { fontSize: '48px' });

// New: sprite
const sprite = this.add.sprite(x, y, 'food-items', 'apple.png');
sprite.setScale(2); // Adjust as needed
```

### 4. Update Buttons
```javascript
// Create button from sprite (9-slice scaling)
const button = this.add.nineslice(x, y, 'ui-elements', 'button_green.png', 
    200, 60, // target width/height
    10, 10, 10, 10 // edge margins
);
```

## Asset Specifications

### Sprites
- **Format**: PNG with transparency
- **Size**: 128x128 or 256x256 for items, 512x512 for characters
- **Style**: Cartoon/playful, bright colors, clear silhouettes
- **Color Palette**: Vibrant, kid-friendly (high saturation)

### Audio
- **Format**: MP3 (best compatibility) or OGG
- **Music**: 1-2 minute loops, 128-192 kbps
- **SFX**: Short (0.1-1 second), mono, 44.1kHz

### Fonts
Already using Google Fonts (Fredoka) - perfect for kids!

**Alternative Kid-Friendly Fonts**:
- Baloo 2
- Poppins
- Quicksand
- Nunito

## Performance Considerations

### Sprite Sheets vs Individual Files
- **Individual files**: Easier to manage, but more HTTP requests
- **Sprite sheets**: Better performance, requires atlas tool
- **Recommendation**: Start with individual files, optimize later

### Image Optimization
Before deploying, optimize images:
```bash
# Install ImageOptim (Mac) or TinyPNG CLI
# Reduces file sizes by 50-70% with no quality loss
```

### Loading Strategy
- Load all critical assets in BootScene
- Lazy load minigame-specific assets when needed
- Show progress bar during loading

## Quick Start Without Assets

**Option 1**: Keep using emojis (works fine for MVP)
**Option 2**: Use CSS-styled divs instead of sprites
**Option 3**: Download just Kenney Food Pack (5 minutes to integrate)

## Deployment Checklist

Before deploying, ensure:
- [ ] All image files are optimized (<100KB each)
- [ ] Audio files are compressed
- [ ] Asset licenses are documented (see CREDITS.md)
- [ ] Attribution is shown in-game if required
- [ ] Total asset bundle is <10MB for fast loading

## Credits Template

Create `CREDITS.md`:
```markdown
# Asset Credits

## Graphics
- Food sprites: Kenney.nl (CC0 - Public Domain)
- UI elements: Kenney.nl (CC0 - Public Domain)

## Audio
- Background music: "Upbeat Game Music" by [Artist] (CC-BY 3.0)
- Sound effects: Freesound.org contributors

## Fonts
- Fredoka: Google Fonts (Open Font License)

## Code
- Framework: Phaser.js (MIT License)
```

## Next Steps

1. **Test Current Version**: Game works with emojis - playtest first!
2. **Identify Needs**: Which emojis look worst? Replace those first
3. **Download Kenney Food Pack**: Quick win for better visuals
4. **Iterate**: Add more assets as time permits

The game is fully playable without custom assets - use this guide when you're ready to polish!
