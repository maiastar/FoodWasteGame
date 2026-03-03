# Testing Guide

## Local Testing Setup

### Start the Server
```bash
cd food-waste-simulator
python3 -m http.server 8001
```

### Open in Browser
Navigate to: `http://localhost:8001`

## Testing Checklist

### Core Functionality Tests

#### ✅ Game Initialization
- [ ] Game loads without errors
- [ ] Loading screen appears and disappears
- [ ] BootScene loads assets successfully
- [ ] Food database and recipes load correctly

#### ✅ Setup Scene
- [ ] All household parameter selectors work
- [ ] Family size buttons (1-6) are clickable
- [ ] Income selector (low/medium/high) works
- [ ] Store distance selector works
- [ ] Diet type selector works
- [ ] Start button transitions to ManagementScene
- [ ] Selected parameters are saved to gameState

#### ✅ Management Dashboard
- [ ] Dashboard loads with correct household stats
- [ ] Inventory panel shows item count
- [ ] Calendar panel shows current day/week
- [ ] Action buttons are visible and clickable
- [ ] "End Day" advances time correctly
- [ ] Daily results modal appears
- [ ] Stats update after day progression

#### ✅ Shopping Minigame
- [ ] Store displays available items
- [ ] Shopping list is generated correctly
- [ ] Budget display shows correct amount
- [ ] Items can be added to cart
- [ ] Cart total updates correctly
- [ ] Items can be removed from cart
- [ ] Checkout validates budget
- [ ] Purchased items added to inventory
- [ ] Shopping score calculated
- [ ] Results modal shows feedback
- [ ] Returns to Management Dashboard

#### ✅ Cooking Minigame
- [ ] Recipe selection screen shows 3 recipes
- [ ] Only shows recipes with available ingredients
- [ ] Recipe details display correctly
- [ ] Portion selector works (small/normal/large)
- [ ] Inventory panel shows available ingredients
- [ ] Cook button validates ingredients
- [ ] Ingredients consumed from inventory
- [ ] Leftovers created if oversized portions
- [ ] Cooking score calculated
- [ ] Results modal shows feedback
- [ ] Returns to Management Dashboard

#### ✅ Fridge Organization Minigame
- [ ] Fridge zones display correctly
- [ ] Items to organize are shown
- [ ] Items are draggable
- [ ] Drop zones accept items
- [ ] Correct/incorrect placement feedback
- [ ] Timer counts down
- [ ] Done button ends minigame
- [ ] Organization score calculated
- [ ] Storage quality updates in household
- [ ] Returns to Management Dashboard

#### ✅ Meal Planning Minigame
- [ ] Calendar grid displays (7 days × 3 meals)
- [ ] Recipe library shows available recipes
- [ ] Clicking calendar cell opens recipe selector
- [ ] Recipes can be assigned to meal slots
- [ ] Meal slots update with recipe icon
- [ ] Waste projection updates as meals are added
- [ ] Planning score calculated
- [ ] Meal plan saved to household
- [ ] Returns to Management Dashboard

### Stochastic Model Tests

#### ✅ Daily Waste Calculation
- [ ] Items update freshness each day
- [ ] Spoilage probability calculated correctly
- [ ] Consumption probability calculated correctly
- [ ] Items removed when spoiled
- [ ] Items reduced when consumed
- [ ] Waste totals update in household
- [ ] Random events trigger (~10% chance)

#### ✅ Household Parameters Impact
Test different configurations:

**Test 1: Low Income**
- [ ] Lower starting budget
- [ ] 0.7× waste multiplier
- [ ] More careful purchasing behavior expected

**Test 2: Large Family (6 people)**
- [ ] Higher servings needed
- [ ] 1.75× waste multiplier
- [ ] More coordination difficulty

**Test 3: Far from Store**
- [ ] Shop every 14 days
- [ ] 1.25× waste multiplier
- [ ] More bulk buying needed

**Test 4: High Waste Awareness (80+)**
- [ ] <0.7× waste multiplier
- [ ] Better consumption probabilities
- [ ] Less spoilage overall

#### ✅ Storage Quality Impact
- [ ] Poor organization (0.5) = faster spoilage
- [ ] Good organization (1.0) = slower spoilage
- [ ] Visible difference in waste rates

### Save/Load Tests

#### ✅ Save Functionality
- [ ] Game saves after each minigame
- [ ] Manual save works (press S)
- [ ] All data persists in localStorage
- [ ] Household parameters saved
- [ ] Inventory saved with item details
- [ ] Meal plans saved

#### ✅ Load Functionality
- [ ] BootScene detects saved game
- [ ] Loads directly to Management if save exists
- [ ] All household data restored correctly
- [ ] Inventory restored with correct freshness
- [ ] Game can continue from saved point

#### ✅ Clear Save
- [ ] Shift+C clears all save data
- [ ] Tutorial resets
- [ ] Next load goes to Setup Scene

### UI/UX Tests

#### ✅ Responsive Design
- [ ] Game scales correctly on different screen sizes
- [ ] Buttons remain clickable at all sizes
- [ ] Text remains readable
- [ ] Layout doesn't break

#### ✅ Mobile Testing (if applicable)
- [ ] Touch controls work (tap instead of click)
- [ ] Buttons are large enough (44×44px minimum)
- [ ] Drag and drop works on mobile
- [ ] No scrolling issues
- [ ] Performance is smooth (30+ FPS)

#### ✅ Browser Compatibility
Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### ✅ Accessibility
- [ ] Color contrast sufficient (WCAG AA minimum)
- [ ] Text is readable
- [ ] Buttons have clear labels
- [ ] Keyboard shortcuts work
- [ ] Help system is accessible (? key)

### Age-Appropriate Testing

#### Ages 4-8
- [ ] Can understand instructions (with adult help)
- [ ] Can click buttons successfully
- [ ] Visual cues are clear
- [ ] Game is not too complex
- [ ] Feedback is encouraging

#### Ages 9-12
- [ ] Can play independently
- [ ] Understands stats and consequences
- [ ] Finds educational content interesting
- [ ] Appropriate challenge level
- [ ] Learns waste reduction concepts

#### Ages 13-15
- [ ] Finds game engaging (not too simple)
- [ ] Understands stochastic model concepts
- [ ] Can strategize effectively
- [ ] Educational content is informative
- [ ] Challenge mode provides depth

## Performance Testing

### Load Time
- **Target**: <3 seconds on broadband
- **Measure**: Chrome DevTools → Network tab
- [ ] Initial load
- [ ] Asset loading
- [ ] Scene transitions

### Frame Rate
- **Target**: 60 FPS consistently
- **Measure**: Chrome DevTools → Performance tab
- [ ] Management scene
- [ ] Shopping minigame
- [ ] Cooking minigame
- [ ] Fridge minigame (with dragging)
- [ ] Planning minigame

### Memory Usage
- **Target**: <200MB RAM
- **Measure**: Chrome DevTools → Memory tab
- [ ] No memory leaks after 30 minutes
- [ ] Scene transitions don't accumulate memory
- [ ] Save/load doesn't cause issues

## Bug Testing

### Common Issues to Check

#### Inventory Management
- [ ] Items can't be purchased with insufficient budget
- [ ] Items with 0 quantity are removed
- [ ] Spoiled items can't be used in cooking
- [ ] Negative quantities impossible
- [ ] Item freshness never goes negative

#### Stats Management
- [ ] Awareness capped at 0-100
- [ ] Budget can't go negative
- [ ] Waste totals always increase (never negative)
- [ ] Storage quality capped at 0-1

#### Scene Transitions
- [ ] No scenes fail to load
- [ ] Data persists across scene changes
- [ ] No duplicate game objects after transitions
- [ ] Camera fades work smoothly

#### Edge Cases
- [ ] What if budget = $0?
- [ ] What if inventory is empty?
- [ ] What if all items spoiled?
- [ ] What if no recipes match inventory?
- [ ] What if player doesn't place any items in fridge game?

## Automated Testing (Future Enhancement)

### Unit Tests Example
```javascript
// test-household.js
function testHouseholdMultipliers() {
    const household = new Household({
        income: 'low',
        familySize: 4,
        storeDistance: 'far',
        dietType: 'omnivore',
        startingAwareness: 50
    });
    
    assert(household.getIncomeMultiplier() === 0.7, 'Income multiplier');
    assert(household.getFamilySizeMultiplier() === 1.45, 'Family size multiplier');
    assert(household.getStoreDistanceMultiplier() === 1.25, 'Store distance multiplier');
    
    console.log('✅ All multiplier tests passed');
}
```

### Integration Tests
Test full game flow:
1. Create household
2. Shop for items
3. Cook meal
4. Organize fridge
5. Plan meals
6. Advance days
7. Verify waste calculations

## User Acceptance Testing

### Test with Real Users

#### Preparation
1. Deploy to web (GitHub Pages or itch.io)
2. Create feedback form (Google Forms)
3. Recruit test users (ages 4-15)

#### Feedback Questions
- Was the game fun? (1-5 stars)
- Did you learn something about food waste? (Yes/No)
- What was confusing?
- What was your favorite minigame?
- What would make it better?
- Would you play again? (Yes/No)

#### Observation Checklist
- Do kids understand objectives without excessive help?
- Do they get frustrated at any point?
- Which minigames hold attention longest?
- Do they read and remember educational tips?
- Do they want to play multiple sessions?

## Balance Testing

### Difficulty Tuning

#### Too Easy Indicators
- Players always get A+ grades
- No food ever spoils
- Budget is never tight
- No challenge or strategy needed

**Fixes**:
- Reduce starting budgets by 20%
- Increase base spoilage rates
- Add more complex recipes

#### Too Hard Indicators
- Players always get F grades
- Constant food spoilage
- Budget runs out immediately
- Frustration without learning

**Fixes**:
- Increase starting awareness
- Improve storage quality baseline
- Give more generous timers
- Add more hints

### Parameter Tuning

Test multipliers are balanced:
- [ ] Income differences feel meaningful
- [ ] Family size scales appropriately
- [ ] Store distance impacts gameplay
- [ ] Diet types have noticeable effects
- [ ] Awareness progression feels rewarding

## Known Limitations (MVP)

Current version limitations to note during testing:

1. **Graphics**: Using emoji placeholders (not game-breaking)
2. **Audio**: No sound effects or music yet
3. **Advanced Features**: No achievements system yet
4. **Recipe Variety**: Only 8 recipes currently
5. **Food Items**: 24 items in database (could expand)
6. **Animations**: Minimal (functional but basic)
7. **Mobile**: Works but not optimized
8. **Multiplayer**: Not implemented

These don't prevent gameplay but should be noted for future versions.

## Bug Report Template

If you find issues:

```markdown
### Bug Report

**Description**: [What happened]

**Expected**: [What should happen]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Environment**:
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Screen size: [1920x1080]

**Console Errors**: [Any error messages from F12 console]

**Screenshot**: [If applicable]
```

## Success Criteria

Game passes testing if:

✅ **Playability**: Complete full week without crashes
✅ **Learning**: Players can explain 3+ waste reduction strategies
✅ **Engagement**: Average session >15 minutes
✅ **Accuracy**: Stochastic model produces realistic outcomes
✅ **Accessibility**: Works on common browsers and devices
✅ **Education**: Tips and facts are scientifically accurate

## Post-Testing Tasks

After successful testing:

1. **Fix Critical Bugs**: Any game-breaking issues
2. **Balance Adjustments**: Based on difficulty feedback
3. **Content Updates**: Add suggested features
4. **Documentation**: Update README with test results
5. **Deployment**: Push to public hosting
6. **Promotion**: Share with target audience

---

**Testing Status**: Ready for local testing. Server running on port 8001.
**Next**: Open http://localhost:8001 and play through all minigames!
