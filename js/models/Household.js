/**
 * Household Model
 * Represents a player's household with fixed parameters and dynamic state
 * Manages family configuration, budget, inventory, and waste tracking
 */

class Household {
    /**
     * Create a new household
     * @param {Object} config - Configuration object with household parameters
     */
    constructor(config = {}) {
        // Fixed parameters (set at game start, don't change)
        this.income = config.income || 'medium'; // 'low', 'medium', 'high'
        this.familySize = config.familySize || 2; // 1-6 people
        this.storeDistance = config.storeDistance || 'medium'; // 'close', 'medium', 'far'
        this.ageRange = config.ageRange || '9-12';
        this.weeklyRecipePlanning = !!config.weeklyRecipePlanning;
        this.presetRecipeIds = config.presetRecipeIds || [];
        
        // Dynamic parameters (change during gameplay)
        this.wasteAwareness = config.startingAwareness || 40; // 0-100 scale
        this.budget = this.calculateInitialBudget();
        this.day = 1;
        this.week = 1;
        
        // State tracking
        this.totalWaste = 0; // pounds
        this.totalWasteValue = 0; // dollars
        this.totalSpent = 0; // dollars
        this.mealsCompleted = 0;
        this.shoppingTrips = 0;
        this.happiness = 100; // 0-100, starts fully happy
        this.lastShoppingDay = config.lastShoppingDay || 0;
        this.lastFridgeDay   = config.lastFridgeDay   || 0;
        this.inedibleWasteWeight = 0;
        this.inedibleWasteValue = 0;
        
        // Storage quality (affected by fridge organization minigame)
        this.storageQuality = 0.7; // 0-1 scale (0.7 = default, 1.0 = perfect organization)
        
        // Meal planning
        this.mealPlan = []; // Array of {day, mealType, recipeId}

        // Day-one Hydra ideal-flow intro (shown once per save)
        this.day1FlowIntroShown = !!config.day1FlowIntroShown;
        
        // Achievements & Streaks
        this.lowWasteStreak = 0; // Consecutive days with waste < 2 lbs
        this.bestStreak = 0; // Best streak ever achieved
        this.achievements = []; // Array of earned achievement IDs
        
        // History for analytics
        this.dailyHistory = [];
        
        // Hidden decision scoring (not shown during gameplay)
        this.hiddenScore = config.hiddenScore || 0;
        this.decisionHistory = config.decisionHistory || [];
        this.sessionDayLimit = config.sessionDayLimit || 7;
        this.sessionCompleted = !!config.sessionCompleted;
        this.insightCounters = config.insightCounters || {
            plannedShoppingTrips: 0,
            unplannedShoppingTrips: 0,
            goodLeftoverStorage: 0,
            poorLeftoverStorage: 0,
            inedibleWasteEvents: 0,
            avoidedImpulseTrips: 0
        };
        
        // Bloom's Taxonomy learning objective progress (persisted across sessions)
        this.planningObjectives = config.planningObjectives || {
            sessionsCheckedExpiring: 0,   // L1 Remember: sessions where player checked expiring items
            sessionsWithLowWaste: 0,       // L2 Understand: sessions finishing with projected waste < 3 lbs
            totalExpiringItemsSaved: 0,    // L3 Apply: cumulative expiring-ingredient meals planned
            balancedPlansCreated: 0,       // L4 Analyze: sessions with all 3 meal types + 4+ recipes
            lastExpiringCheckDay: 0        // tracks which game day the player last used Check Expiring Items
        };
        
        // Mass balance tracking: Fp (purchased) and Fc (consumed) in kg
        // Conservation of mass: Fp - Fc - Fw = dFs/dt
        this.totalFoodPurchasedKg = config.totalFoodPurchasedKg || 0;
        this.totalFoodConsumedKg  = config.totalFoodConsumedKg  || 0;
        
        // Weekly counters reset each week for the mass balance display
        this.weeklyFoodPurchasedKg = config.weeklyFoodPurchasedKg || 0;
        this.weeklyFoodConsumedKg  = config.weeklyFoodConsumedKg  || 0;
        this.weeklyFoodWastedKg    = config.weeklyFoodWastedKg    || 0;
        // Snapshot of last week's mass balance for the end-of-week display
        this.lastWeekMassBalance   = config.lastWeekMassBalance   || null;
        
        console.log(`🏠 Household created: ${this.familySize} people, ${this.income} income, ${this.storeDistance} from store`);
    }
    
    /**
     * Calculate initial budget based on income and family size
     * @returns {number} Weekly budget in dollars
     */
    calculateInitialBudget() {
        const baseBudgets = {
            'low': 50,      // $50 per person per week
            'medium': 75,   // $75 per person per week
            'high': 120     // $120 per person per week
        };
        
        const perPersonBudget = baseBudgets[this.income] || baseBudgets['medium'];
        return perPersonBudget * this.familySize;
    }
    
    /**
     * Get income multiplier for waste calculations
     * Higher income = more purchasing power = potentially more waste
     * @returns {number} Multiplier (0.7 - 1.3)
     */
    getIncomeMultiplier() {
        const multipliers = {
            'low': 0.7,     // More careful with food, less impulse buying
            'medium': 1.0,  // Baseline
            'high': 1.3     // More purchasing flexibility, more waste risk
        };
        return multipliers[this.income] || 1.0;
    }
    
    /**
     * Get family size multiplier for waste calculations
     * Larger families = more coordination complexity = more waste risk
     * @returns {number} Multiplier (1.0 - 1.75)
     */
    getFamilySizeMultiplier() {
        // Formula: 1 + (size - 1) * 0.15
        // Single person: 1.0x
        // Family of 4: 1.45x
        // Family of 6: 1.75x
        return 1.0 + (this.familySize - 1) * 0.15;
    }
    
    /**
     * Get store distance multiplier for waste calculations
     * Farther stores = bulk buying = higher spoilage risk
     * @returns {number} Multiplier (0.8 - 1.25)
     */
    getStoreDistanceMultiplier() {
        const multipliers = {
            'close': 0.8,   // Shop frequently, fresher food
            'medium': 1.0,  // Baseline
            'far': 1.25     // Bulk buying, higher spoilage risk
        };
        return multipliers[this.storeDistance] || 1.0;
    }
    
    /**
     * Get waste awareness multiplier
     * Higher awareness = better waste prevention
     * @returns {number} Multiplier (0.5 - 1.5)
     */
    getWasteAwarenessMultiplier() {
        // Formula: 1.5 - (awareness / 100)
        // 0% awareness: 1.5x waste
        // 50% awareness: 1.0x waste
        // 100% awareness: 0.5x waste
        return Math.max(0.5, 1.5 - (this.wasteAwareness / 100));
    }
    
    /**
     * Get combined waste multiplier from all household parameters
     * @returns {number} Overall waste multiplier
     */
    getCombinedWasteMultiplier() {
        return this.getIncomeMultiplier() *
               this.getFamilySizeMultiplier() *
               this.getStoreDistanceMultiplier() *
               this.getWasteAwarenessMultiplier() *
               (2.0 - this.storageQuality); // Storage quality reduces waste
    }
    
    /**
     * Apply daily happiness change based on how well the household was fed today.
     * Requires 2 servings per family member. Call before incrementing the day.
     */
    applyDailyHappiness() {
        const today = this.dailyHistory[this.day - 1];
        const mealsCooked = today ? today.mealsCooked : [];
        const totalServings = mealsCooked.reduce((sum, m) => sum + (m.servings || 0), 0);
        const requiredServings = this.familySize * 2;

        if (totalServings >= requiredServings) {
            this.happiness = Math.min(100, this.happiness + 2);
        } else {
            const shortfall = 1 - (totalServings / requiredServings);
            const penalty = Math.round(shortfall * 15);
            this.happiness = Math.max(0, this.happiness - penalty);
        }
    }

    /**
     * Advance to the next day
     */
    advanceDay() {
        this.applyDailyHappiness();
        this.day++;
        
        // Check if we've started a new week
        if (this.day % 7 === 1 && this.day > 1) {
            this.week++;
            this.onNewWeek();
        }
        
        console.log(`📅 Advanced to Day ${this.day} (Week ${this.week})`);
    }
    
    /**
     * Handle new week transition
     */
    onNewWeek() {
        // Snapshot weekly mass balance before resetting
        const storedKg = this.weeklyFoodPurchasedKg - this.weeklyFoodConsumedKg - this.weeklyFoodWastedKg;
        this.lastWeekMassBalance = {
            purchased: this.weeklyFoodPurchasedKg,
            consumed:  this.weeklyFoodConsumedKg,
            wasted:    this.weeklyFoodWastedKg,
            stored:    storedKg  // dFs/dt: positive means inventory growing
        };
        // Reset weekly counters
        this.weeklyFoodPurchasedKg = 0;
        this.weeklyFoodConsumedKg  = 0;
        this.weeklyFoodWastedKg    = 0;
        // Replenish weekly budget
        this.budget = this.calculateInitialBudget();
        console.log(`💰 New week! Budget replenished: $${this.budget.toFixed(2)}`);
    }
    
    /**
     * Record food purchased (kg) — called by ShoppingMinigame at checkout.
     * Contributes to Fp in the mass balance equation Fp - Fc - Fw = dFs/dt.
     * @param {number} kg - Weight in kg
     */
    addPurchasedKg(kg) {
        this.totalFoodPurchasedKg  += kg;
        this.weeklyFoodPurchasedKg += kg;
    }
    
    /**
     * Record food consumed (kg) — called by StochasticModel and CookingMinigame.
     * Contributes to Fc in the mass balance equation.
     * @param {number} kg - Weight in kg
     */
    addConsumedKg(kg) {
        this.totalFoodConsumedKg  += kg;
        this.weeklyFoodConsumedKg += kg;
    }
    
    /**
     * Household efficiency ratio E = Fc / Fp (paper formula).
     * 1.0 = 100% of purchased food consumed; closer to 0 = more waste.
     * @returns {number} Ratio 0-1
     */
    getEfficiencyRatio() {
        if (this.totalFoodPurchasedKg <= 0) return 0;
        return Math.min(1, this.totalFoodConsumedKg / this.totalFoodPurchasedKg);
    }
    
    /**
     * Spend money (from shopping)
     * @param {number} amount - Amount to spend
     * @returns {boolean} True if successful, false if insufficient budget
     */
    spendMoney(amount) {
        if (amount > this.budget) {
            console.warn(`⚠️ Insufficient budget! Need $${amount.toFixed(2)}, have $${this.budget.toFixed(2)}`);
            return false;
        }
        
        this.budget -= amount;
        this.totalSpent += amount;
        console.log(`💸 Spent $${amount.toFixed(2)}, remaining: $${this.budget.toFixed(2)}`);
        return true;
    }
    
    /**
     * Add waste to household totals
     * @param {number} weight - Weight in pounds
     * @param {number} value - Dollar value of wasted food
     * @param {string} reason - Reason for waste (for tracking)
     */
    addWaste(weight, value, reason = 'unknown') {
        this.totalWaste += weight;
        this.totalWasteValue += value;
        // Track weekly wasted kg (weight is in lbs, convert: 1 lb ≈ 0.4536 kg)
        if (reason !== 'inedible_parts') {
            this.weeklyFoodWastedKg += weight * 0.4536;
        }
        
        if (reason === 'inedible_parts') {
            this.inedibleWasteWeight += weight;
            this.inedibleWasteValue += value;
            this.insightCounters.inedibleWasteEvents += 1;
        }
        
        // Record in daily history
        const today = this.dailyHistory[this.day - 1] || this.initializeDailyRecord();
        today.wasteEvents.push({
            weight: weight,
            value: value,
            reason: reason,
            timestamp: Date.now()
        });
        
        console.log(`🗑️ Waste added: ${weight.toFixed(2)} lbs ($${value.toFixed(2)}) - ${reason}`);
    }
    
    /**
     * Record hidden decision score and analytics counters
     * @param {string} category - Decision category
     * @param {number} scoreDelta - Hidden score delta
     * @param {Object} metadata - Optional details
     */
    recordDecision(category, scoreDelta = 0, metadata = {}) {
        this.hiddenScore += scoreDelta;
        this.decisionHistory.push({
            day: this.day,
            week: this.week,
            category: category,
            scoreDelta: scoreDelta,
            metadata: metadata,
            timestamp: Date.now()
        });
        
        if (category === 'shopping_planned') {
            this.insightCounters.plannedShoppingTrips += 1;
        } else if (category === 'shopping_unplanned') {
            this.insightCounters.unplannedShoppingTrips += 1;
        } else if (category === 'leftover_good_storage') {
            this.insightCounters.goodLeftoverStorage += 1;
        } else if (category === 'leftover_poor_storage') {
            this.insightCounters.poorLeftoverStorage += 1;
        } else if (category === 'shopping_low_impulse') {
            this.insightCounters.avoidedImpulseTrips += 1;
        }
    }
    
    /**
     * Check if session should end after day advance
     * @returns {boolean}
     */
    hasReachedSessionEnd() {
        return this.day > this.sessionDayLimit;
    }
    
    /**
     * Build hidden end-of-session insights payload
     * @returns {Object}
     */
    getSessionInsights() {
        // ── Weighted Score Formula (from paper): Score = w1*Pm + w2*Ps + w3*Pc + w4*E ──
        // w1=0.30 (meal planning), w2=0.25 (storage), w3=0.25 (cooking), w4=0.20 (efficiency)

        const totalTrips = Math.max(1, this.insightCounters.plannedShoppingTrips + this.insightCounters.unplannedShoppingTrips);
        const plannedRatio  = this.insightCounters.plannedShoppingTrips / totalTrips;
        const mealPlanRatio = Math.min(1, this.mealPlan.length / (this.sessionDayLimit * 3));
        const Pm = Math.round((plannedRatio * 50 + mealPlanRatio * 50));   // 0-100

        const totalLeftover = Math.max(1, this.insightCounters.goodLeftoverStorage + this.insightCounters.poorLeftoverStorage);
        const storageRatio  = this.insightCounters.goodLeftoverStorage / totalLeftover;
        const Ps = Math.round((storageRatio * 50 + this.storageQuality * 50));  // 0-100

        const targetMeals = this.sessionDayLimit * 2; // 2 cooked meals per day target
        const Pc = Math.round(Math.min(100, (this.mealsCompleted / targetMeals) * 100));  // 0-100

        const E = Math.round(this.getEfficiencyRatio() * 100);  // 0-100

        const score = Math.round(0.30 * Pm + 0.25 * Ps + 0.25 * Pc + 0.20 * E);

        let tier = 'Learning';
        if (score >= 80) tier = 'Food Saver Expert';
        else if (score >= 65) tier = 'Smart Planner';
        else if (score >= 45) tier = 'Waste Reducer';
        
        const insights = [];
        if (plannedRatio >= 0.5) {
            insights.push('You usually shopped with a plan, which reduces overbuying.');
        } else {
            insights.push('You often shopped without a plan. Try planning recipes before shopping trips.');
        }
        
        if (storageRatio >= 0.5) {
            insights.push('Your leftover storage choices helped keep food usable longer.');
        } else {
            insights.push('Leftover storage choices caused faster spoilage in several meals.');
        }
        
        if (this.insightCounters.inedibleWasteEvents > 0) {
            insights.push('Some cooking waste was inedible (peels/bones/stems), which is normal.');
        }
        
        if (this.insightCounters.avoidedImpulseTrips > 0) {
            insights.push('You controlled impulse buys on multiple shopping trips.');
        }
        
        const effPct = (this.getEfficiencyRatio() * 100).toFixed(0);
        if (this.getEfficiencyRatio() >= 0.75) {
            insights.push(`Great efficiency! ${effPct}% of food you purchased was consumed.`);
        } else {
            insights.push(`Only ${effPct}% of purchased food was consumed. Try buying less at a time.`);
        }
        
        return {
            score: score,
            tier: tier,
            scoreBreakdown: { Pm, Ps, Pc, E },
            efficiencyRatio: this.getEfficiencyRatio(),
            totalFoodPurchasedKg: this.totalFoodPurchasedKg,
            totalFoodConsumedKg:  this.totalFoodConsumedKg,
            totalWaste: this.totalWaste,
            totalWasteValue: this.totalWasteValue,
            totalSpent: this.totalSpent,
            inedibleWasteWeight: this.inedibleWasteWeight,
            inedibleWasteValue: this.inedibleWasteValue,
            insights: insights,
            decisionsTracked: this.decisionHistory.length
        };
    }
    
    /**
     * Update streak counter based on daily waste
     * @param {number} dailyWaste - Waste for the day in pounds
     */
    updateStreak(dailyWaste) {
        const LOW_WASTE_THRESHOLD = 2.0; // pounds per day
        
        if (dailyWaste < LOW_WASTE_THRESHOLD) {
            this.lowWasteStreak++;
            if (this.lowWasteStreak > this.bestStreak) {
                this.bestStreak = this.lowWasteStreak;
            }
            console.log(`🔥 Low waste streak: ${this.lowWasteStreak} days!`);
        } else {
            if (this.lowWasteStreak > 0) {
                console.log(`💔 Streak ended at ${this.lowWasteStreak} days`);
            }
            this.lowWasteStreak = 0;
        }
    }
    
    /**
     * Check and award achievements
     */
    checkAchievements() {
        const newAchievements = [];
        
        // Waste Warrior - 5 day streak
        if (this.lowWasteStreak >= 5 && !this.achievements.includes('waste_warrior')) {
            this.achievements.push('waste_warrior');
            newAchievements.push({id: 'waste_warrior', name: 'Waste Warrior', icon: '⚔️'});
        }
        
        // Budget Boss - Have 50% budget remaining at end of week
        if (this.day % 7 === 0 && this.budget > this.calculateInitialBudget() * 0.5 && !this.achievements.includes('budget_boss')) {
            this.achievements.push('budget_boss');
            newAchievements.push({id: 'budget_boss', name: 'Budget Boss', icon: '💰'});
        }
        
        // Fresh Food Champion - 0 spoiled items for a week
        if (this.day >= 7 && !this.achievements.includes('fresh_champion')) {
            this.achievements.push('fresh_champion');
            newAchievements.push({id: 'fresh_champion', name: 'Fresh Food Champion', icon: '🌟'});
        }
        
        return newAchievements;
    }
    
    /**
     * Increase waste awareness (from good decisions, learning)
     * @param {number} amount - Amount to increase (can be negative for decrease)
     */
    modifyWasteAwareness(amount) {
        const oldAwareness = this.wasteAwareness;
        this.wasteAwareness = Math.max(0, Math.min(100, this.wasteAwareness + amount));
        
        if (amount > 0) {
            console.log(`📚 Waste awareness increased: ${oldAwareness.toFixed(0)} → ${this.wasteAwareness.toFixed(0)}`);
        } else if (amount < 0) {
            console.log(`📉 Waste awareness decreased: ${oldAwareness.toFixed(0)} → ${this.wasteAwareness.toFixed(0)}`);
        }
    }
    
    /**
     * Update storage quality (from fridge organization minigame)
     * @param {number} quality - New quality value (0-1)
     */
    updateStorageQuality(quality) {
        this.storageQuality = Math.max(0, Math.min(1, quality));
        this.lastFridgeDay = this.day;
        console.log(`📦 Storage quality updated: ${(this.storageQuality * 100).toFixed(0)}%`);
    }
    
    /**
     * Add a meal to the meal plan
     * @param {number} day - Day number
     * @param {string} mealType - 'breakfast', 'lunch', 'dinner'
     * @param {string} recipeId - Recipe identifier
     */
    addMealToPlan(day, mealType, recipeId) {
        // Remove any existing entry for this slot before adding to prevent duplicates
        this.mealPlan = this.mealPlan.filter(
            meal => !(meal.day === day && meal.mealType === mealType)
        );
        this.mealPlan.push({ day, mealType, recipeId });
        console.log(`📝 Meal planned: ${recipeId} for ${mealType} on day ${day}`);
    }
    
    /**
     * Check if a meal is planned for a specific day
     * @param {number} day - Day to check
     * @param {string} mealType - Optional meal type filter
     * @returns {boolean} True if meal is planned
     */
    hasMealPlanned(day, mealType = null) {
        return this.mealPlan.some(meal => 
            meal.day === day && (mealType === null || meal.mealType === mealType)
        );
    }
    
    /**
     * Get meals planned for a specific day
     * @param {number} day - Day number
     * @returns {Array} Array of meal objects
     */
    getMealsForDay(day) {
        return this.mealPlan.filter(meal => meal.day === day);
    }
    
    /**
     * Clear meal plan (for replanning)
     */
    clearMealPlan() {
        this.mealPlan = [];
        console.log('🗑️ Meal plan cleared');
    }
    
    /**
     * Initialize a daily record for history tracking
     * @returns {Object} Daily record object
     */
    initializeDailyRecord() {
        const record = {
            day: this.day,
            wasteEvents: [],
            purchases: [],
            mealsCooked: [],
            budgetSpent: 0,
            awarenessLevel: this.wasteAwareness
        };
        
        this.dailyHistory[this.day - 1] = record;
        return record;
    }
    
    /**
     * Get statistics for display
     * @returns {Object} Stats object
     */
    getStats() {
        return {
            // Current state
            day: this.day,
            week: this.week,
            budget: this.budget,
            happiness: this.happiness,
            wasteAwareness: this.wasteAwareness,
            storageQuality: this.storageQuality,
            
            // Totals
            totalWaste: this.totalWaste,
            totalWasteValue: this.totalWasteValue,
            totalSpent: this.totalSpent,
            mealsCompleted: this.mealsCompleted,
            shoppingTrips: this.shoppingTrips,
            
            // Calculated
            avgWastePerDay: this.totalWaste / this.day,
            wastePercentage: this.totalSpent > 0 ? (this.totalWasteValue / this.totalSpent) * 100 : 0,
            daysPlayed: this.day,
            
            // Parameters
            familySize: this.familySize,
            income: this.income,
            storeDistance: this.storeDistance
        };
    }
    
    /**
     * Get a performance grade (A-F) based on waste metrics
     * @returns {string} Letter grade
     */
    getPerformanceGrade() {
        const wastePercentage = this.totalSpent > 0 ? (this.totalWasteValue / this.totalSpent) * 100 : 0;
        
        // US average food waste is ~30-40% of food purchased
        if (wastePercentage <= 10) return 'A+';
        if (wastePercentage <= 15) return 'A';
        if (wastePercentage <= 20) return 'B+';
        if (wastePercentage <= 25) return 'B';
        if (wastePercentage <= 30) return 'C+';
        if (wastePercentage <= 35) return 'C';
        if (wastePercentage <= 40) return 'D';
        return 'F';
    }
    
    /**
     * Get feedback message based on performance
     * @returns {string} Encouraging feedback
     */
    getFeedbackMessage() {
        const grade = this.getPerformanceGrade();
        const wastePercentage = this.totalSpent > 0 ? (this.totalWasteValue / this.totalSpent) * 100 : 0;
        
        if (grade.startsWith('A')) {
            return `Amazing! You're wasting only ${wastePercentage.toFixed(1)}% of your food. That's way better than the national average of 30-40%!`;
        } else if (grade.startsWith('B')) {
            return `Great work! You're wasting ${wastePercentage.toFixed(1)}% of food. Keep up the good planning!`;
        } else if (grade.startsWith('C')) {
            return `You're at ${wastePercentage.toFixed(1)}% waste, close to the national average. Try better meal planning and storage!`;
        } else {
            return `You're wasting ${wastePercentage.toFixed(1)}% of food. Focus on checking dates, planning meals, and organizing your fridge!`;
        }
    }
    
    /**
     * Get daily needs (servings required per day)
     * @returns {number} Number of servings needed
     */
    getDailyServingsNeeded() {
        // 3 meals per person per day
        return this.familySize * 3;
    }
    
    /**
     * Get shopping frequency based on store distance
     * @returns {number} Days between shopping trips
     */
    getShoppingFrequency() {
        const frequencies = {
            'close': 3,   // Shop every 3 days
            'medium': 7,  // Weekly shopping
            'far': 14     // Bi-weekly bulk shopping
        };
        return frequencies[this.storeDistance] || 7;
    }
    
    /**
     * Check if it's a shopping day
     * @returns {boolean} True if player should shop today
     */
    isShoppingDay() {
        const frequency = this.getShoppingFrequency();
        return this.day % frequency === 1 || this.day === 1;
    }
    
    /**
     * Record a completed shopping trip
     * @param {number} amountSpent - Total amount spent
     * @param {Array} itemsPurchased - Array of food items
     */
    recordShopping(amountSpent, itemsPurchased) {
        this.shoppingTrips++;
        this.lastShoppingDay = this.day;
        
        const today = this.dailyHistory[this.day - 1] || this.initializeDailyRecord();
        today.purchases = itemsPurchased;
        today.budgetSpent = amountSpent;
        
        console.log(`🛒 Shopping trip #${this.shoppingTrips} completed: $${amountSpent.toFixed(2)}, ${itemsPurchased.length} items`);
    }
    
    /**
     * Record a completed meal
     * @param {string} recipeId - Recipe identifier
     * @param {number} servings - Number of servings made
     */
    recordMeal(recipeId, servings) {
        this.mealsCompleted++;
        
        const today = this.dailyHistory[this.day - 1] || this.initializeDailyRecord();
        today.mealsCooked.push({
            recipeId: recipeId,
            servings: servings,
            timestamp: Date.now()
        });
        
        console.log(`🍳 Meal completed: ${recipeId} (${servings} servings)`);
    }
    
    /**
     * Save household state to localStorage
     */
    save() {
        const saveData = {
            // Fixed parameters
            income: this.income,
            familySize: this.familySize,
            storeDistance: this.storeDistance,
            ageRange: this.ageRange,
            weeklyRecipePlanning: this.weeklyRecipePlanning,
            presetRecipeIds: this.presetRecipeIds,
            
            // Dynamic state
            wasteAwareness: this.wasteAwareness,
            budget: this.budget,
            day: this.day,
            week: this.week,
            
            // Tracking
            totalWaste: this.totalWaste,
            totalWasteValue: this.totalWasteValue,
            totalSpent: this.totalSpent,
            mealsCompleted: this.mealsCompleted,
            shoppingTrips: this.shoppingTrips,
            happiness: this.happiness,
            lastShoppingDay: this.lastShoppingDay,
            lastFridgeDay:   this.lastFridgeDay,
            inedibleWasteWeight: this.inedibleWasteWeight,
            inedibleWasteValue: this.inedibleWasteValue,
            storageQuality: this.storageQuality,
            
            // Plans and history
            mealPlan: this.mealPlan,
            dailyHistory: this.dailyHistory,
            hiddenScore: this.hiddenScore,
            decisionHistory: this.decisionHistory,
            sessionDayLimit: this.sessionDayLimit,
            sessionCompleted: this.sessionCompleted,
            insightCounters: this.insightCounters,
            day1FlowIntroShown: this.day1FlowIntroShown,
            
            // Mass balance (Fp, Fc)
            totalFoodPurchasedKg:  this.totalFoodPurchasedKg,
            totalFoodConsumedKg:   this.totalFoodConsumedKg,
            weeklyFoodPurchasedKg: this.weeklyFoodPurchasedKg,
            weeklyFoodConsumedKg:  this.weeklyFoodConsumedKg,
            weeklyFoodWastedKg:    this.weeklyFoodWastedKg,
            lastWeekMassBalance:   this.lastWeekMassBalance,
            
            // Bloom's Taxonomy learning objective progress
            planningObjectives: this.planningObjectives
        };
        
        localStorage.setItem('foodWasteSimulator_household', JSON.stringify(saveData));
        console.log('💾 Household saved');
    }
    
    /**
     * Load household state from localStorage
     * @returns {boolean} True if load successful
     */
    static load() {
        const savedData = localStorage.getItem('foodWasteSimulator_household');
        
        if (!savedData) {
            console.log('No saved household found');
            return null;
        }
        
        try {
            const data = JSON.parse(savedData);
            const household = new Household(data);
            
            // Restore dynamic state
            household.wasteAwareness = data.wasteAwareness;
            household.budget = data.budget;
            household.day = data.day;
            household.week = data.week;
            household.totalWaste = data.totalWaste;
            household.totalWasteValue = data.totalWasteValue;
            household.totalSpent = data.totalSpent;
            household.mealsCompleted = data.mealsCompleted;
            household.shoppingTrips = data.shoppingTrips;
            household.happiness = data.happiness ?? 100;
            household.lastShoppingDay = data.lastShoppingDay || 0;
            household.lastFridgeDay   = data.lastFridgeDay   || 0;
            household.inedibleWasteWeight = data.inedibleWasteWeight || 0;
            household.inedibleWasteValue = data.inedibleWasteValue || 0;
            household.storageQuality = data.storageQuality;
            household.mealPlan = data.mealPlan || [];
            household.dailyHistory = data.dailyHistory || [];
            household.hiddenScore = data.hiddenScore || 0;
            household.decisionHistory = data.decisionHistory || [];
            household.sessionDayLimit = data.sessionDayLimit || 7;
            household.sessionCompleted = !!data.sessionCompleted;
            household.insightCounters = data.insightCounters || household.insightCounters;
            household.day1FlowIntroShown = !!data.day1FlowIntroShown;
            household.totalFoodPurchasedKg  = data.totalFoodPurchasedKg  || 0;
            household.totalFoodConsumedKg   = data.totalFoodConsumedKg   || 0;
            household.weeklyFoodPurchasedKg = data.weeklyFoodPurchasedKg || 0;
            household.weeklyFoodConsumedKg  = data.weeklyFoodConsumedKg  || 0;
            household.weeklyFoodWastedKg    = data.weeklyFoodWastedKg    || 0;
            household.lastWeekMassBalance   = data.lastWeekMassBalance   || null;
            
            console.log('💾 Household loaded successfully');
            return household;
        } catch (error) {
            console.error('Failed to load household:', error);
            return null;
        }
    }
    
    /**
     * Clear saved data
     */
    static clearSave() {
        localStorage.removeItem('foodWasteSimulator_household');
        console.log('🗑️ Save data cleared');
    }
    
    /**
     * Get household description for display
     * @returns {string} Human-readable description
     */
    getDescription() {
        const people = this.familySize === 1 ? 'person' : 'people';
        return `${this.familySize} ${people}, ${this.income} income, ${this.storeDistance} from store`;
    }
    
    /**
     * Export household data for analytics/debugging
     * @returns {Object} Complete household data
     */
    export() {
        return {
            config: {
                income: this.income,
                familySize: this.familySize,
                storeDistance: this.storeDistance,
                ageRange: this.ageRange,
                weeklyRecipePlanning: this.weeklyRecipePlanning
            },
            state: this.getStats(),
            multipliers: {
                income: this.getIncomeMultiplier(),
                familySize: this.getFamilySizeMultiplier(),
                storeDistance: this.getStoreDistanceMultiplier(),
                wasteAwareness: this.getWasteAwarenessMultiplier(),
                combined: this.getCombinedWasteMultiplier()
            },
            history: this.dailyHistory
        };
    }
}

// Make available for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Household;
}
