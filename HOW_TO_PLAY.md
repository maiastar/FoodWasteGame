# How to Play - Food Waste Simulator

## Welcome!

This game teaches you how to reduce food waste while managing a household. Make smart choices about shopping, cooking, storing food, and planning meals!

## Getting Started

### 1. Set Up Your Household
When you first start, you'll configure your family:

**👨‍👩‍👧‍👦 Family Size**: Choose 1-6 people
- More people = more food needed but harder to coordinate

**💰 Income Level**: Choose Low, Medium, or High
- Affects your weekly budget
- Different income levels have different waste patterns

**🏪 Store Distance**: Choose Close, Medium, or Far
- Close: Shop often (every 3 days) for fresh food
- Medium: Weekly shopping trips
- Far: Bulk shopping every 2 weeks

**🍽️ Diet Type**: Choose Omnivore, Vegetarian, or Pescatarian
- Affects which recipes and foods are available
- Different foods have different spoilage rates

### 2. Your Dashboard (Home Base)

This is where you'll spend most time between activities:

**📊 Stats Panel** (top-left):
- Budget: Money remaining this week
- Waste Awareness: Your knowledge level (0-100%)
- Total Waste: Food thrown away (pounds & dollars)
- Grade: Performance rating (A+ to F)

**🧊 Inventory Panel** (top-right):
- See all your food items
- Color-coded freshness (🟢🟡🟠🔴)
- Track what's expiring soon

**📅 Events Panel** (bottom-left):
- Today's events and reminders
- Shopping days
- Expiration warnings

**🎮 Actions Panel** (bottom-right):
- Launch minigames
- Advance to next day

## The Minigames

### 🛒 Shopping Minigame

**Objective**: Buy food for your family while staying under budget

**How to Play**:
1. Review your shopping list (items you need)
2. Browse the store - click items to see details
3. Click items to add to cart
4. Watch your budget meter
5. Remove items with ❌ if needed
6. Click "Checkout" when ready

**Tips for Success**:
- ✅ Check expiration dates (longer = better)
- ✅ Stick to your shopping list
- ✅ Compare prices between similar items
- ✅ Balance fresh and shelf-stable foods
- ❌ Avoid impulse purchases

**Scoring**:
- List completion: Did you get what you needed?
- Budget efficiency: Did you overspend?
- Smart choices: Avoided too many perishables?

### 🍳 Cooking Minigame

**Objective**: Cook meals using ingredients from your fridge

**How to Play**:
1. Choose from 3 recipe options
2. Review required ingredients (✅ = have it, ❌ = don't)
3. Select portion size (small/normal/large)
4. Click "Cook Meal!"
5. Ingredients are used automatically

**Tips for Success**:
- ✅ Use ingredients expiring soon (FIFO - First In, First Out)
- ✅ Cook the right amount for your family
- ✅ Plan to use leftovers next day
- ❌ Don't make huge portions that will spoil

**Scoring**:
- Used expiring items first?
- Right portion size?
- Efficient ingredient use?

**Special**: If you make too much, leftovers are added to your fridge (3-day freshness).

### 📦 Fridge Organization Minigame

**Objective**: Organize your fridge properly to keep food fresh longer

**How to Play**:
1. See your fridge with 4 storage zones
2. Drag items from the right panel
3. Drop them in the correct zone:
   - **Top Shelf**: Leftovers, ready-to-eat items
   - **Middle Shelf**: Dairy products, eggs
   - **Bottom Shelf**: Raw meat and fish (prevent drips!)
   - **Crisper Drawer**: Fruits and vegetables
4. Try to finish before 60-second timer!
5. Click "Done Organizing" when finished

**Tips for Success**:
- ✅ Put items in correct zones
- ✅ Organize by expiration (oldest in front)
- ✅ Work quickly for time bonus
- ❌ Don't leave items unorganized

**Scoring**:
- Items placed correctly?
- All items organized?
- Time bonus for speed?

**Impact**: Better organization = items stay fresh 3-5 days longer!

### 📅 Meal Planning Minigame

**Objective**: Plan meals for the week to use food efficiently

**How to Play**:
1. See 7-day calendar (Mon-Sun) with 3 meals each day
2. Click any meal slot (+ sign)
3. Choose a recipe from the list
4. Recipe icon appears in calendar
5. Watch the waste projection update
6. Plan as many meals as you want
7. Click "Finish Planning" when done

**Tips for Success**:
- ✅ Plan meals using ingredients you already have
- ✅ Schedule expiring items first
- ✅ Fill at least 50% of the week
- ✅ Watch the waste projection - try to lower it!

**Scoring**:
- Completeness: How many meals planned?
- Efficiency: Using current inventory?
- Variety: Different recipes?

**Impact**: Good planning reduces waste by 25-30%!

## Understanding the Model (How the Game Works)

### What is "Stochastic"?
Instead of fixed rules ("milk always spoils on day 7"), the game uses **probabilities**.

**Example**: Milk with 2 days left has a **25% chance** to spoil today.

Your choices change those probabilities:
- Good storage → 25% becomes 15%
- Low awareness → 25% becomes 35%
- In meal plan → Higher chance it gets used instead!

### Daily Simulation

Every time you click "End Day":

**Step 1**: Update freshness
- All food ages by 1 day (or less if frozen)

**Step 2**: Check each item
- Roll dice for spoilage probability
- Roll dice for consumption probability
- Item either: spoils, gets eaten, or just ages

**Step 3**: Random events
- 10% chance something unexpected happens:
  - Unexpected guest (need more food)
  - Family ate out (planned meal wasted)
  - Power outage (fridge items at risk)
  - Store sale (shopping opportunity)

**Step 4**: Update stats
- Add waste to totals
- Update awareness based on outcomes
- Save game automatically

### Why This Is Cool

**Realistic**: Just like real life, you can't predict everything
**Replayable**: Same setup = different outcomes each time
**Educational**: Shows how decisions affect **chances**, not guarantees
**Fair**: Good choices = better probabilities (not luck-based)

## Winning Strategies

### For All Ages

1. **Shop Smart**
   - Make a list before shopping
   - Check dates (more days = better)
   - Don't buy more than you need

2. **Cook Wisely**
   - Use oldest items first
   - Make right portions for your family
   - Plan to reuse leftovers

3. **Stay Organized**
   - Keep fridge organized every few days
   - Put items in correct zones
   - Know what you have

4. **Plan Ahead**
   - Plan meals weekly
   - Match recipes to inventory
   - Reduce "forgotten food" waste

### Advanced Tips

**🎯 Optimize Parameters**:
- Close to store? Shop often for fresh food
- Far from store? Freeze more items
- Large family? Plan meals carefully
- High income? Watch for impulse buys

**📊 Track Patterns**:
- Which items spoil most? Buy less
- Running out of budget? Cheaper items
- Low awareness? Read all tips!

**🎮 Game Tactics**:
- Do fridge organization before shopping (make space)
- Do meal planning after shopping (use what you bought)
- Cook meals when items are expiring
- Freeze items in fridge game (extends freshness 30 days!)

## Reading Your Stats

### Waste Awareness
- **0-30%**: Beginner - learning basics
- **30-60%**: Intermediate - making progress
- **60-80%**: Advanced - strong knowledge
- **80-100%**: Expert - teaching others!

### Performance Grade
- **A (90%+)**: <15% waste - Excellent!
- **B (80-89%)**: 15-25% waste - Great job!
- **C (70-79%)**: 25-35% waste - Keep improving
- **D/F (<70%)**: >35% waste - Try new strategies

### Waste Percentage
- **Your Goal**: <15% of food purchased
- **National Average**: 30-40% waste
- **Best Possible**: <5% waste (nearly zero!)

## Age-Specific Guides

### For Ages 4-8 (With Adult Help)

**Focus On**:
- Matching colors and shapes
- Counting items
- Recognizing food types
- Simple cause and effect

**It's OK To**:
- Take your time
- Ask for help reading
- Try things multiple times
- Learn by exploring

**Don't Worry About**:
- Perfect scores
- Complex stats
- Fast timers
- Hard words

### For Ages 9-12 (Mostly Independent)

**Focus On**:
- Following strategies
- Understanding stats
- Reading educational tips
- Planning ahead

**Challenge Yourself**:
- Try to get A or B grade
- Beat previous scores
- Complete full week successfully
- Read all waste facts

### For Ages 13-15 (Advanced)

**Focus On**:
- Optimizing parameters
- Understanding probability
- Strategic planning
- Real-world application

**Challenge Yourself**:
- A+ grade consistently
- Different household configurations
- Compare with friends
- Apply to real life

## Educational Content

### What You'll Learn

**Food Science**:
- How food spoils
- Proper storage temperatures
- Expiration date meanings
- Freshness indicators

**Math Concepts**:
- Probability and chance
- Percentages and ratios
- Budgeting and money
- Time management

**Environmental Science**:
- Waste impact on planet
- Greenhouse gas emissions
- Resource conservation
- Sustainability

**Life Skills**:
- Meal planning
- Grocery shopping
- Food organization
- Decision making

### Real-World Connection

After playing, you can:
- Help organize your family's fridge
- Make shopping lists with parents
- Suggest meals that use expiring food
- Explain why food waste matters
- Track your family's waste

## Frequently Asked Questions

**Q: How long is one game session?**
A: 15-30 minutes typically. You can save and come back anytime!

**Q: Can I pause the game?**
A: Not within minigames, but you can always leave and come back. Game auto-saves after each activity.

**Q: What if I want to start over?**
A: Press Shift+C to clear save data (on localhost only), or clear your browser data.

**Q: Why did my food spoil even though I organized?**
A: The model uses probability! Good organization **reduces** chance of spoilage but doesn't eliminate it. Just like real life!

**Q: Can I play with friends?**
A: Not multiplayer yet, but you can compare stats and challenge each other!

**Q: Is this game scientifically accurate?**
A: Yes! Based on real food waste research and USDA storage guidelines.

**Q: Why can't I win every time?**
A: The stochastic model means some randomness (like real life). Your goal is to improve your **chances**, not guarantee perfect results.

**Q: What's the best household configuration?**
A: There's no "best"! Each configuration teaches different lessons. Try them all!

## Help & Support

### In-Game Help
- **Press ? or H**: Open help menu anytime
- **Hover over items**: See tooltips and tips
- **Read results screens**: Learn from feedback

### Technical Help
- **F12**: Open browser console (see errors)
- **Reload page**: Fix most glitches
- **Clear cache**: If things seem broken

### Learning Resources
- Read tips during gameplay
- Check educational facts after minigames
- Review your stats to find patterns
- Experiment with different strategies

## Challenge Ideas

### Solo Challenges
- 🎯 Get A+ grade for full week
- 🎯 Zero waste for one day
- 🎯 Reach 80% awareness
- 🎯 Stay under budget for 3 weeks
- 🎯 Complete all minigames in one session

### Group Challenges (With Friends)
- 👥 Who can get highest awareness?
- 👥 Lowest waste percentage?
- 👥 Best grade after 2 weeks?
- 👥 Most creative meal plan?

### Family Challenges
- 🏡 Play game, then apply strategies at home
- 🏡 Track real family waste for comparison
- 🏡 Kids teach parents what they learned
- 🏡 Reduce actual household waste by 25%

## Have Fun!

Remember: This is a **learning game**, not just a test. Experiment, make mistakes, try different strategies, and most importantly - **have fun while learning to save food and money!** 🎮🍎♻️

---

**Ready to play?** Go to http://localhost:8001 and start your food waste reduction journey!
