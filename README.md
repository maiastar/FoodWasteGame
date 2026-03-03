# Food Waste Simulator

An educational browser-based game for kids ages 4-15 that teaches food waste reduction through interactive gameplay and real-time stochastic modeling.

## Overview

This game combines household management simulation with fun minigames, allowing players to:
- Configure household parameters (income, family size, location, diet)
- Manage food inventory and budget over time
- Play minigames: Shopping, Cooking, Fridge Organization, Meal Planning
- Learn waste reduction strategies through gameplay

## Project Structure

```
food-waste-simulator/
├── index.html              # Main entry point
├── css/
│   └── styles.css         # Global styles
├── js/
│   ├── main.js            # Game initialization
│   ├── config.js          # Phaser configuration
│   ├── scenes/            # Game scenes
│   │   ├── BootScene.js
│   │   ├── SetupScene.js
│   │   ├── ManagementScene.js
│   │   ├── ShoppingMinigame.js
│   │   ├── CookingMinigame.js
│   │   ├── FridgeMinigame.js
│   │   └── PlanningMinigame.js
│   ├── models/            # Data models
│   │   ├── Household.js   ✅ COMPLETED
│   │   ├── FoodItem.js
│   │   ├── Inventory.js
│   │   └── StochasticModel.js
│   └── ui/                # UI components
│       ├── HUD.js
│       └── StatsPanel.js
└── assets/                # Game assets
    ├── sprites/           # Graphics
    ├── audio/             # Sounds & music
    ├── fonts/             # Web fonts
    └── data/              # JSON data (recipes, food items)
```

## Technology Stack

- **Framework**: Phaser.js 3.x (browser-based game framework)
- **Language**: JavaScript (ES6+)
- **Styling**: CSS3
- **Deployment**: GitHub Pages / itch.io

## Stochastic Model Parameters

### Fixed Parameters (Set at Game Start)
- **Household Income**: low / medium / high (affects budget and waste multiplier)
- **Family Size**: 1-6 people (affects quantities and coordination complexity)
- **Store Distance**: close / medium / far (affects shopping frequency)
- **Diet Type**: omnivore / vegetarian / pescatarian (affects food types and waste)

### Dynamic Parameters (Change During Gameplay)
- **Waste Awareness**: 0-100 (increases with good decisions)
- **Storage Quality**: 0-1 (improved by fridge organization)
- **Budget**: Replenished weekly
- **Inventory State**: Food items with freshness tracking

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari)
- Text editor (VS Code recommended)
- Local web server (for development)

### Installation
1. Clone or download this repository
2. No build step required - it's pure HTML/JS!

### Running Locally
```bash
# Using Python 3
python3 -m http.server 8000

# OR using Node.js
npx http-server -p 8000

# Then open: http://localhost:8000
```

### Development
Open `index.html` in your browser after starting the local server. Changes to JS files will require a browser refresh.

## Game Flow

1. **Setup**: Configure household parameters
2. **Management Dashboard**: View household status, inventory, and calendar
3. **Daily Events**: Triggered events lead to minigames
4. **Minigames**: Interactive gameplay (shopping, cooking, organizing, planning)
5. **Stochastic Simulation**: Model calculates waste based on decisions
6. **Progression**: Advance through days and weeks, track performance

## Educational Goals

- Teach kids about food waste impact
- Demonstrate relationship between planning and waste reduction
- Build awareness of expiration dates and proper storage
- Show how household parameters affect waste outcomes
- Encourage real-world behavior change

## Target Audience

- **Ages 4-8**: Simple visuals, forgiving difficulty, icon-based gameplay
- **Ages 9-15**: More depth, statistics, challenge modes, educational facts

## Contributing

This is an educational project. Feel free to:
- Add new recipes or food items
- Create additional minigames
- Improve the stochastic model
- Add localization
- Enhance accessibility

## License

Educational use. Assets from free sources (Kenney.nl, OpenGameArt) retain their original licenses.

## Credits

- Game Design: Food Waste Education Initiative
- Framework: Phaser.js
- Assets: Kenney.nl, OpenGameArt (when integrated)

---

## Current Status

✅ **COMPLETE** - All core features implemented!

### Completed Features
- ✅ Core data models (Household, FoodItem, Inventory, StochasticModel)
- ✅ Setup scene with household configuration
- ✅ Management dashboard with stats and inventory
- ✅ Shopping minigame (buy items, manage budget)
- ✅ Cooking minigame (select recipes, use ingredients)
- ✅ Fridge organization minigame (drag-drop, storage zones)
- ✅ Meal planning minigame (weekly calendar, waste projection)
- ✅ Educational content (tips, facts, tutorials)
- ✅ Help system (press ? anytime)
- ✅ Save/load system (localStorage)
- ✅ Daily progression with stochastic simulation
- ✅ Random events system

### Ready to Play!

**Test Now**:
```bash
cd food-waste-simulator
python3 -m http.server 8001
# Open: http://localhost:8001
```

### Next Steps
1. **Playtest**: Test all minigames and flow
2. **Polish**: Add sprite assets (see ASSETS_GUIDE.md)
3. **Deploy**: Push to GitHub Pages or itch.io (see DEPLOYMENT_GUIDE.md)
4. **Share**: Distribute to target audience (kids ages 4-15)

## Documentation

- **[HOW_TO_PLAY.md](HOW_TO_PLAY.md)**: Player guide with strategies and tips
- **[QUICKSTART.md](QUICKSTART.md)**: Quick reference for running the game
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)**: Testing checklist and procedures
- **[ASSETS_GUIDE.md](ASSETS_GUIDE.md)**: How to add custom sprites and audio
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**: How to deploy online
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)**: Technical overview and accomplishments

## Project Statistics

- **Total Code Files**: 15
- **Lines of Code**: ~3,500
- **Scenes**: 7 (Boot, Setup, Management, 4 minigames)
- **Data Models**: 4 (Household, FoodItem, Inventory, StochasticModel)
- **Recipes**: 8
- **Food Items**: 24
- **Educational Tips**: 25+
- **Target Age Range**: 4-15 years old
