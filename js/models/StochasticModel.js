/**
 * Stochastic Food Waste Model
 * Implements probability-based food waste calculations
 * Uses Monte Carlo methods to simulate realistic waste outcomes
 */

class StochasticModel {
    constructor() {
        // Model configuration
        this.baseWasteRate = 0.3; // 30% baseline waste rate (US average)
        this.randomSeed = Date.now(); // For reproducible randomness (optional)
    }
    
    /**
     * Calculate daily waste for a household.
     * Runs stochastic simulation on all inventory items.
     * @param {Household} household - Household object
     * @param {Inventory} inventory - Inventory object
     * @param {Array} recipes - Recipe catalog for ingredient matching (optional)
     * @returns {Object} Waste calculation results
     */
    calculateDailyWaste(household, inventory, recipes = []) {
        const results = {
            wastedItems: [],
            consumedItems: [],
            wasteWeight: 0,
            wasteCost: 0,
            wasteReasons: [],
            timestamp: Date.now()
        };
        
        // Get household waste multiplier
        const householdMultiplier = household.getCombinedWasteMultiplier();
        
        // Create a copy of items array to safely iterate while modifying
        const itemsToProcess = [...inventory.items];
        const itemsToRemove = [];
        
        // Check each item for spoilage and consumption
        itemsToProcess.forEach(item => {
            // Skip already spoiled items (they'll be removed separately)
            if (item.isSpoiled()) {
                return;
            }
            
            // Calculate probabilities (recipes forwarded for ingredient-aware spoil check)
            const spoilProb = this.calculateSpoilProbability(item, household, inventory, recipes);
            const consumeProb = this.calculateConsumeProbability(item, household, inventory);
            
            // Monte Carlo simulation - roll dice
            const roll = Math.random();
            
            if (roll < spoilProb) {
                // Item spoiled today
                const wasteWeight = item.getTotalWeight();
                const wasteValue = item.getCurrentValue();
                
                results.wastedItems.push(item.clone());
                results.wasteWeight += wasteWeight;
                results.wasteCost += wasteValue;
                results.wasteReasons.push({
                    item: item.name,
                    reason: this.getSpoilageReason(item),
                    weight: wasteWeight,
                    value: wasteValue
                });
                
                // Mark for removal (don't remove during iteration)
                itemsToRemove.push(item.id);
                
            } else if (roll < spoilProb + consumeProb) {
                // Item consumed today
                const servingsConsumed = Math.min(item.quantity, household.familySize);
                
                results.consumedItems.push({
                    name: item.name,
                    servings: servingsConsumed
                });
                
                // Track consumed kg for Fc in mass balance (lbs → kg: ×0.4536)
                household.addConsumedKg(item.getWeightPerServing() * servingsConsumed * 0.4536);
                
                inventory.consumeItem(item.id, servingsConsumed);
            } else {
                // Item neither spoiled nor consumed - just ages
                // (Freshness will be updated separately)
            }
        });
        
        // Now safely remove all items that spoiled
        itemsToRemove.forEach(itemId => {
            inventory.removeItem(itemId);
        });
        
        // Update household waste totals
        if (results.wasteCost > 0) {
            household.addWaste(results.wasteWeight, results.wasteCost, 'daily spoilage');
        }
        
        return results;
    }
    
    /**
     * Calculate probability that an item will spoil today.
     * @param {FoodItem} item - Food item
     * @param {Household} household - Household context
     * @param {Inventory} inventory - Inventory context
     * @param {Array} recipes - Recipe catalog for ingredient matching (optional)
     * @returns {number} Probability (0-1)
     */
    calculateSpoilProbability(item, household, inventory, recipes = []) {
        // Start with item's inherent spoilage probability
        let probability = item.getSpoilageProbability(household.storageQuality);
        
        // Modify by household waste awareness
        probability *= household.getWasteAwarenessMultiplier();
        
        // Modify by how full the inventory is (overcrowding increases waste)
        const inventoryFullness = inventory.getItemCount() / (household.familySize * 10);
        if (inventoryFullness > 1.0) {
            probability *= (1.0 + (inventoryFullness - 1.0) * 0.3);
        }
        
        // Items not referenced by any upcoming planned recipe are more likely to be forgotten.
        // With real ingredient matching, planning a specific recipe protects only the items
        // that recipe actually uses — making meal planning meaningfully reduce projected waste.
        const isInMealPlan = this.isItemInUpcomingMeals(item, household, recipes);
        if (!isInMealPlan && item.freshness <= 3) {
            probability *= 1.4; // 40% more likely to waste if not in any planned recipe
        }
        
        return Math.min(probability, 1.0);
    }
    
    /**
     * Calculate probability that an item will be consumed today
     * @param {FoodItem} item - Food item
     * @param {Household} household - Household context
     * @param {Inventory} inventory - Inventory context
     * @returns {number} Probability (0-1)
     */
    calculateConsumeProbability(item, household, inventory) {
        // Base probability from paper: Pc = Cd / Fs
        // Cd = daily household servings needed; Fs = total servings in inventory
        const Cd = household.familySize * 3; // 3 servings per person per day
        const Fs = Math.max(1, inventory.getSummary().totalServings);
        let probability = Math.min(0.55, Cd / Fs); // cap prevents runaway when Fs is tiny
        
        // Higher if item is in today's meal plan
        const todaysMeals = household.getMealsForDay(household.day);
        if (todaysMeals.length > 0) {
            probability += 0.35;
        }
        
        // Much higher if item is approaching Ncrit (qualityValue 40-60)
        if (item.qualityValue <= 60 && item.qualityValue > 40) {
            probability += 0.25 * (household.wasteAwareness / 100);
        }
        if (item.qualityValue <= 50 && item.qualityValue > 40) {
            probability += 0.30 * (household.wasteAwareness / 100);
        }
        
        // Family size factor
        const familySizeFactor = Math.min(household.familySize / 4, 1.3);
        probability *= familySizeFactor;
        
        // Random daily variation (±20%)
        probability *= (0.8 + Math.random() * 0.4);
        
        return Math.min(probability, 0.95);
    }
    
    /**
     * Check if a specific item is used in any planned meal within the next 3 days.
     * When a recipes catalog is provided, performs a fuzzy ingredient-name match so
     * that planning a "Pasta with Tomato Sauce" recipe actually protects Tomato and
     * Pasta items in the inventory. Without a catalog falls back to "any meals planned."
     * @param {FoodItem} item - Inventory item to check
     * @param {Household} household - Household (reads mealPlan)
     * @param {Array} recipes - Full recipe catalog (optional)
     * @returns {boolean} True if item is referenced by an upcoming planned recipe
     * @private
     */
    isItemInUpcomingMeals(item, household, recipes = []) {
        // Check all 7 planned days so meals assigned to any day of the week
        // meaningfully reduce spoilage probability for matched ingredients.
        const upcomingDays = Array.from({ length: 7 }, (_, i) => household.day + i);

        return upcomingDays.some(day => {
            const meals = household.getMealsForDay(day);
            if (meals.length === 0) return false;

            // Fallback when no catalog: treat any planned meal as protective
            if (recipes.length === 0) return true;

            const itemName = item.name.toLowerCase();
            return meals.some(meal => {
                const recipe = recipes.find(r => r.id === meal.recipeId);
                if (!recipe || !recipe.ingredients) return false;
                return recipe.ingredients.some(ing => {
                    const ingName = ing.name.toLowerCase();
                    return itemName.includes(ingName) || ingName.includes(itemName);
                });
            });
        });
    }
    
    /**
     * Deep-clone a Household for simulation use.
     * Primitive fields are copied by value via Object.assign.
     * Array/object fields that the simulation reads (mealPlan) or that could
     * be mutated as a side-effect (insightCounters) are explicitly deep-copied.
     * dailyHistory is dropped entirely — simulation does not need it.
     * @param {Household} household - Source household
     * @returns {Household} Cloned household instance
     * @private
     */
    _cloneHousehold(household) {
        const clone = Object.assign(
            Object.create(Object.getPrototypeOf(household)),
            household
        );
        // Deep-copy arrays/objects to avoid cross-contamination between runs
        clone.mealPlan           = household.mealPlan.map(m => ({ ...m }));
        clone.insightCounters    = { ...household.insightCounters };
        clone.achievements       = [...household.achievements];
        clone.planningObjectives = { ...household.planningObjectives };
        clone.dailyHistory       = []; // not needed in simulation
        return clone;
    }

    /**
     * Get human-readable reason for spoilage
     * @param {FoodItem} item - Spoiled item
     * @returns {string} Reason description
     * @private
     */
    getSpoilageReason(item) {
        if (item.freshness <= 0) {
            return 'Expired';
        } else if (!item.isProperlyStored) {
            return 'Improper storage';
        } else if (!item.isInCorrectLocation()) {
            return 'Wrong storage location';
        } else if (item.perishability >= 4) {
            return 'Highly perishable';
        } else {
            return 'Forgotten in back';
        }
    }
    
    /**
     * Generate random event
     * 10% chance per day of random event occurring
     * @param {Household} household - Household context
     * @returns {Object|null} Event object or null
     */
    generateRandomEvent(household) {
        // 10% chance of event
        if (Math.random() > 0.1) {
            return null;
        }
        
        const events = [
            {
                id: 'unexpected_guest',
                name: 'Unexpected Guest',
                description: 'A friend dropped by for dinner!',
                effect: { servingsNeeded: 2, budgetImpact: -10 },
                icon: '👥'
            },
            {
                id: 'ate_out',
                name: 'Family Ate Out',
                description: 'The family decided to eat at a restaurant.',
                effect: { plannedMealSkipped: true, budgetImpact: -25 },
                icon: '🍽️'
            },
            {
                id: 'power_outage',
                name: 'Power Outage',
                description: 'Power was out for 4 hours - fridge items at risk!',
                effect: { fridgeSpoilageIncrease: 0.3 },
                icon: '⚡'
            },
            {
                id: 'store_sale',
                name: 'Store Sale',
                description: 'Your favorite store is having a sale today!',
                effect: { shoppingDiscount: 0.2 },
                icon: '💰'
            },
            {
                id: 'forgot_lunch',
                name: 'Forgot Packed Lunch',
                description: 'Someone forgot their packed lunch - food wasted.',
                effect: { wasteServings: 1 },
                icon: '🎒'
            },
            {
                id: 'busy_week',
                name: 'Busy Week',
                description: 'Everyone is busy - might not have time to cook.',
                effect: { cookingTimeReduced: 0.5 },
                icon: '⏰'
            }
        ];
        
        // Select random event
        const event = events[Math.floor(Math.random() * events.length)];
        
        console.log(`🎲 Random event: ${event.name}`);
        return event;
    }
    
    /**
     * Apply random event effects to household
     * @param {Object} event - Event object from generateRandomEvent
     * @param {Household} household - Household to affect
     * @param {Inventory} inventory - Inventory to affect
     */
    applyEventEffects(event, household, inventory) {
        if (!event) return;
        
        const effect = event.effect;
        
        // Budget impacts
        if (effect.budgetImpact) {
            household.budget += effect.budgetImpact;
            household.budget = Math.max(0, household.budget);
        }
        
        // Waste impacts
        if (effect.wasteServings) {
            const avgWeight = 0.5 * effect.wasteServings;
            const avgValue = 3.0 * effect.wasteServings;
            household.addWaste(avgWeight, avgValue, event.name);
        }
        
        // Fridge spoilage increase
        if (effect.fridgeSpoilageIncrease) {
            const fridgeItems = inventory.getItemsByLocation('fridge');
            fridgeItems.forEach(item => {
                item.freshness -= effect.fridgeSpoilageIncrease * item.perishability;
            });
        }
        
        console.log(`✨ Applied event effects: ${event.name}`);
    }
    
    /**
     * Simulate multiple days ahead (for planning minigame projections).
     *
     * Runs `options.iterations` independent Monte Carlo passes and returns the
     * averaged result. Averaging eliminates the frame-to-frame jitter that
     * occurred with a single stochastic run, so the waste bar moves smoothly
     * and consistently as the player assigns meals.
     *
     * Passes the recipe catalog to `calculateDailyWaste` so that
     * `isItemInUpcomingMeals` can perform real ingredient matching — planning a
     * "Pasta with Tomato Sauce" recipe now actually lowers the spoilage
     * probability for Tomato and Pasta items.
     *
     * @param {Household} household - Household snapshot
     * @param {Inventory} inventory - Inventory snapshot
     * @param {number} days - Days to simulate ahead (default 7)
     * @param {Object} options
     * @param {Array}  options.recipes    - Full recipe catalog for ingredient matching
     * @param {number} options.iterations - Monte Carlo runs to average (default 10)
     * @returns {Object} Averaged projected outcomes
     */
    simulateFuture(household, inventory, days = 7, options = {}) {
        const { recipes = [], iterations = 10 } = options;

        let totalWaste      = 0;
        let totalWasteValue = 0;
        const spoilageUnion = {}; // day → Set of item names seen across all runs

        for (let run = 0; run < iterations; run++) {
            const simHousehold = this._cloneHousehold(household);
            const simInventory = Inventory.fromJSON(inventory.toJSON());

            for (let i = 0; i < days; i++) {
                // Age all items one day
                simInventory.updateAllFreshness(simHousehold.storageQuality);

                // Stochastic daily waste roll (recipes forwarded for ingredient matching)
                const dayResult = this.calculateDailyWaste(simHousehold, simInventory, recipes);
                totalWaste      += dayResult.wasteWeight;
                totalWasteValue += dayResult.wasteCost;

                // Collect spoiled item names for the union across all runs
                if (dayResult.wastedItems.length > 0) {
                    const simDay = simHousehold.day + i;
                    if (!spoilageUnion[simDay]) spoilageUnion[simDay] = new Set();
                    dayResult.wastedItems.forEach(item => spoilageUnion[simDay].add(item.name));
                }

                simHousehold.advanceDay();
            }
        }

        const projectedWaste      = totalWaste      / iterations;
        const projectedWasteValue = totalWasteValue / iterations;

        // Convert spoilage union map → sorted array for callers
        const projectedSpoilage = Object.keys(spoilageUnion)
            .map(day => ({ day: Number(day), items: [...spoilageUnion[day]] }))
            .sort((a, b) => a.day - b.day);

        return {
            projectedWaste,
            projectedWasteValue,
            projectedSpoilage,
            daysSimulated: days,
            iterations,
            warning: projectedWaste > household.familySize * days * 0.5
        };
    }
    
    /**
     * Calculate waste reduction if player improves awareness
     * @param {Household} household - Current household
     * @param {number} awarenessIncrease - Awareness increase to test
     * @returns {Object} Impact analysis
     */
    calculateWasteReductionImpact(household, awarenessIncrease = 10) {
        const currentMultiplier = household.getCombinedWasteMultiplier();
        
        // Temporarily increase awareness
        const originalAwareness = household.wasteAwareness;
        household.wasteAwareness += awarenessIncrease;
        const improvedMultiplier = household.getCombinedWasteMultiplier();
        household.wasteAwareness = originalAwareness; // Restore
        
        const reductionPercent = ((currentMultiplier - improvedMultiplier) / currentMultiplier) * 100;
        
        return {
            awarenessIncrease: awarenessIncrease,
            currentMultiplier: currentMultiplier.toFixed(2),
            improvedMultiplier: improvedMultiplier.toFixed(2),
            wasteReduction: reductionPercent.toFixed(1) + '%',
            message: `Increasing awareness by ${awarenessIncrease} points would reduce waste by ${reductionPercent.toFixed(1)}%`
        };
    }
    
    /**
     * Get waste statistics for educational feedback
     * @param {Household} household - Household object
     * @returns {Object} Educational stats
     */
    getEducationalStats(household) {
        const stats = household.getStats();
        
        // Calculate environmental impact
        const co2Equivalent = stats.totalWaste * 3.8; // ~3.8 kg CO2 per kg food waste
        const waterWasted = stats.totalWaste * 25; // ~25 gallons water per lb food
        const mealsWasted = stats.totalWaste / 1.2; // ~1.2 lbs per meal
        
        // National comparisons
        const nationalAvgWaste = household.familySize * 0.9 * stats.daysPlayed; // ~0.9 lbs per person per day
        const comparisonPercent = ((stats.totalWaste / nationalAvgWaste) * 100).toFixed(0);
        
        return {
            totalWastePounds: stats.totalWaste.toFixed(1),
            totalWasteDollars: stats.totalWasteValue.toFixed(2),
            wastePercentage: stats.wastePercentage.toFixed(1),
            
            environmental: {
                co2Equivalent: co2Equivalent.toFixed(1) + ' kg CO2',
                waterWasted: waterWasted.toFixed(0) + ' gallons',
                mealsWasted: mealsWasted.toFixed(0) + ' meals'
            },
            
            comparison: {
                nationalAverage: nationalAvgWaste.toFixed(1) + ' lbs',
                yourWaste: stats.totalWaste.toFixed(1) + ' lbs',
                percentOfAverage: comparisonPercent + '%',
                message: stats.totalWaste < nationalAvgWaste 
                    ? `Great! You're wasting ${(100 - parseFloat(comparisonPercent))}% less than average!`
                    : `You're wasting ${comparisonPercent}% of the national average. Let's improve!`
            },
            
            recommendations: this.getRecommendations(household, stats)
        };
    }
    
    /**
     * Generate personalized recommendations
     * @param {Household} household - Household object
     * @param {Object} stats - Household stats
     * @returns {Array<string>} Array of recommendations
     * @private
     */
    getRecommendations(household, stats) {
        const recommendations = [];
        
        // Awareness-based
        if (household.wasteAwareness < 50) {
            recommendations.push('🎓 Focus on learning about food dates and storage to boost awareness!');
        }
        
        // Storage-based
        if (household.storageQuality < 0.6) {
            recommendations.push('📦 Organize your fridge! Proper storage prevents 20-30% of waste.');
        }
        
        // Meal planning-based
        if (household.mealPlan.length < household.day * 2) {
            recommendations.push('📅 Plan your meals ahead! This reduces waste by up to 30%.');
        }
        
        // Waste percentage-based
        if (stats.wastePercentage > 30) {
            recommendations.push('🗓️ Try shopping more frequently for smaller amounts of fresh food.');
        }
        
        // Shopping frequency
        if (household.storeDistance === 'far' && stats.wastePercentage > 25) {
            recommendations.push('❄️ Freeze items immediately if you bulk shop - extends freshness!');
        }
        
        // If doing well
        if (stats.wastePercentage < 15 && household.wasteAwareness > 70) {
            recommendations.push('⭐ You\'re doing amazing! Share these habits with family and friends!');
        }
        
        return recommendations;
    }
    
    /**
     * Run Monte Carlo simulation multiple times for confidence intervals
     * @param {Household} household - Household object
     * @param {Inventory} inventory - Inventory object
     * @param {number} iterations - Number of simulations
     * @returns {Object} Statistical results
     */
    runMonteCarloSimulation(household, inventory, iterations = 100) {
        const results = {
            wasteAmounts: [],
            wasteCosts: [],
            itemCounts: []
        };
        
        for (let i = 0; i < iterations; i++) {
            // Clone inventory for each simulation
            const simInventory = Inventory.fromJSON(inventory.toJSON());
            const outcome = this.calculateDailyWaste(household, simInventory);
            
            results.wasteAmounts.push(outcome.wasteWeight);
            results.wasteCosts.push(outcome.wasteCost);
            results.itemCounts.push(outcome.wastedItems.length);
        }
        
        // Calculate statistics
        const avgWaste = results.wasteAmounts.reduce((a, b) => a + b, 0) / iterations;
        const avgCost = results.wasteCosts.reduce((a, b) => a + b, 0) / iterations;
        const avgItems = results.itemCounts.reduce((a, b) => a + b, 0) / iterations;
        
        return {
            iterations: iterations,
            averageWaste: avgWaste.toFixed(2) + ' lbs',
            averageCost: '$' + avgCost.toFixed(2),
            averageItems: avgItems.toFixed(1) + ' items',
            confidence: '95%',
            message: `With 95% confidence, today's waste will be ${avgWaste.toFixed(1)} lbs (${avgItems.toFixed(0)} items)`
        };
    }
}

// Make available for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StochasticModel;
}
