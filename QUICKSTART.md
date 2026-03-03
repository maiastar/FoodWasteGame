# Quick Start Guide

## Running the Game Locally

### Step 1: Open Terminal
Navigate to the project folder:
```bash
cd food-waste-simulator
```

### Step 2: Start Local Server
```bash
python3 -m http.server 8001
```

### Step 3: Open in Browser
Open your browser and go to:
```
http://localhost:8001
```

### Step 4: Play!
- Configure your household settings
- Play through the minigames
- Advance days to see the stochastic model in action

## Keyboard Shortcuts

- **? or H**: Show help menu
- **ESC**: Close menus/overlays
- **S**: Quick save (development only)
- **R**: Reload page (development only)
- **Shift+C**: Clear save data (development only)
- **Shift+T**: Reset tutorial (development only)

## Game Flow

1. **Setup Scene**: Configure household parameters
   - Family size (1-6 people)
   - Income level (low/medium/high)
   - Store distance (close/medium/far)
   - Diet type (omnivore/vegetarian/pescatarian)

2. **Management Dashboard**: Your home base
   - View stats (budget, awareness, waste)
   - Check inventory (food items and freshness)
   - See daily events
   - Launch minigames

3. **Shopping Minigame**:
   - Browse store items
   - Add to cart
   - Check expiration dates
   - Checkout (stay under budget!)

4. **Cooking Minigame**:
   - Choose recipe from 3 options
   - Select portion size
   - Use ingredients from inventory
   - Cook meal and earn points

5. **Fridge Organization Minigame**:
   - Drag items to correct shelf
   - Organize by expiration (FIFO)
   - Beat the 60-second timer
   - Improve storage quality

6. **Meal Planning Minigame**:
   - Plan 7 days of meals
   - Use calendar grid
   - See waste projection
   - Optimize your plan

7. **Advance Day**:
   - End each day from dashboard
   - Stochastic model calculates waste
   - Random events may occur
   - See daily summary

## Understanding the Stats

### Waste Awareness (0-100%)
- How knowledgeable you are about food waste
- Increases: Good decisions, completing minigames
- Decreases: Poor choices, excessive waste
- **Impact**: Higher awareness = less waste

### Budget ($)
- Weekly money for food shopping
- Refreshes each week (Monday)
- **Based on**: Income level × family size

### Storage Quality (0-100%)
- How well your fridge is organized
- **Improves**: Fridge organization minigame
- **Impact**: Better storage = slower spoilage

### Total Waste
- Cumulative food wasted (pounds and dollars)
- **Goal**: Keep as low as possible
- **Target**: <15% of food purchased

### Performance Grade (A+ to F)
- Based on waste percentage compared to national average
- **A**: <15% waste (excellent!)
- **B**: 15-25% waste (good)
- **C**: 25-35% waste (average)
- **D-F**: >35% waste (needs improvement)

## Understanding the Stochastic Model

### What Does "Stochastic" Mean?
It means the game uses **probability** instead of fixed outcomes. Your choices affect the **chances** of waste, not guaranteed results.

### How It Works

**Each day, the model checks every food item**:
1. Calculate spoilage probability based on:
   - Freshness remaining
   - Storage quality
   - Household parameters
   - Random factors

2. Calculate consumption probability based on:
   - Meal plans
   - Family size
   - Item appeal
   - Random appetites

3. Roll dice for each item:
   - Spoiled? → Add to waste
   - Consumed? → Remove from inventory
   - Neither? → Ages another day

### Example

You have milk with 2 days until expiration:
- **Base spoilage chance**: 30%
- **Your awareness (70%)**: Reduces to 21%
- **Good storage**: Reduces to 16%
- **In meal plan**: Consumption chance +50%
- **Result**: 84% chance milk gets used!

### Parameters That Affect Waste

**Fixed** (set at start):
- **Income**: 
  - Low: 0.7× waste (more careful)
  - Medium: 1.0× baseline
  - High: 1.3× waste (more purchasing)
  
- **Family Size**: 
  - More people = more coordination difficulty
  - Formula: 1 + (size-1) × 0.15
  
- **Store Distance**:
  - Close: 0.8× (shop often, fresh food)
  - Medium: 1.0×
  - Far: 1.25× (bulk buying risk)
  
- **Diet Type**:
  - Omnivore: 1.0×
  - Vegetarian: 0.9×
  - Pescatarian: 1.1× (fish spoils fast)

**Dynamic** (changes during play):
- **Waste Awareness**: Higher = less waste
- **Storage Quality**: Better organization = slower spoilage
- **Meal Planning**: Planned meals = higher consumption probability
- **Random Events**: Surprise factors (guests, eating out, etc.)

## Tips for Success

### General Strategy
1. **Shop smart**: Check dates, buy what you need
2. **Plan ahead**: Use meal planning minigame weekly
3. **Organize often**: Keep fridge organized (every 3-4 days)
4. **Cook wisely**: Use expiring items first, right portions
5. **Monitor stats**: Keep awareness high, storage quality up

### For Younger Players (4-8)
- Focus on visual matching (colors, shapes)
- Don't worry about perfect scores
- Learn by exploring and having fun
- Ask adults for help reading tips

### For Older Players (9-15)
- Try to beat your previous scores
- Experiment with different household parameters
- Read all educational facts
- Challenge friends to compare stats

### Advanced Strategies
- **Freeze before spoiling**: Move items to freezer in fridge minigame
- **Bulk shop wisely**: Far from store? Plan for 2 weeks
- **Cross-utilize ingredients**: Choose recipes that share ingredients
- **Track patterns**: Which items spoil most? Buy less next time

## Troubleshooting

### Game won't start
- **Check**: Is local server running?
- **Check**: Browser console for errors (F12)
- **Fix**: Clear browser cache and reload

### Can't hear audio
- **Check**: Browser audio permissions
- **Check**: Volume settings
- **Note**: Some browsers block autoplay audio

### Save game not working
- **Check**: localStorage enabled in browser
- **Check**: Not in private/incognito mode
- **Fix**: Use regular browser window

### Minigame buttons don't work
- **Check**: Console for errors
- **Fix**: Reload page
- **Fix**: Clear save data (Shift+C)

### Performance issues (lag/stuttering)
- **Close**: Other browser tabs
- **Check**: Computer resources (Activity Monitor/Task Manager)
- **Reduce**: Browser extensions
- **Try**: Different browser (Chrome usually fastest)

## Educational Use

### For Teachers
- **Lesson Plan**: Use as 30-minute activity
- **Discussion**: Ask students about their strategies
- **Extension**: Have students track real family food waste
- **Assessment**: Compare before/after knowledge

### For Parents
- **Play Together**: Co-op learning experience
- **Real Application**: Use tips in actual grocery shopping
- **Goal Setting**: Challenge kids to reduce family waste
- **Allowance Tie-in**: Show how waste = money lost

### Learning Objectives
By playing this game, kids will:
1. Understand food expiration and freshness
2. Learn proper food storage techniques
3. Practice meal planning and budgeting
4. Recognize the environmental impact of waste
5. Develop decision-making skills

## Next Steps After Playing

### In Real Life
- Make a real shopping list before trips
- Check your home fridge organization
- Plan meals for the week
- Track what your family throws away
- Suggest improvements based on game lessons

### In the Game
- Try different household configurations
- Aim for A+ grade
- Complete all achievements
- Challenge friends to beat your score
- Experiment with extreme parameters (1 person vs 6 people)

## Getting Help

### In-Game Help
- Press **?** anytime for help menu
- Read tooltips (hover over items)
- Check educational tips in results screens

### Technical Issues
- Check browser console (F12)
- Read error messages
- Try different browser
- Clear cache and reload

### Feedback & Suggestions
If you have ideas for improving the game:
- Note what's confusing
- Suggest new features
- Report bugs
- Share your experience

---

**Have fun learning about food waste reduction!** 🎮🍎♻️
