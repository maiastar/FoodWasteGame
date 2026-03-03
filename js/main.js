/**
 * Main Game Entry Point
 * Initializes Phaser game instance and starts the game loop
 */

// Wait for DOM to be ready
window.addEventListener('load', () => {
    console.log('🎮 Food Waste Simulator starting...');
    
    // Create Phaser game instance
    const game = new Phaser.Game(gameConfig);
    
    // Make game instance globally accessible for debugging
    window.game = game;
    window.gameState = gameState;
    
    console.log('✅ Game initialized successfully');
    console.log('📊 Game dimensions:', gameConfig.width, 'x', gameConfig.height);
    
    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        // Press '?' to show help
        if ((e.key === '?' || e.key === 'h') && !e.repeat) {
            const currentScene = game.scene.getScenes(true)[0];
            if (currentScene && currentScene.helpSystem) {
                currentScene.helpSystem.toggle();
            }
        }
        
        // Press ESC to close overlays
        if (e.key === 'Escape' && !e.repeat) {
            const currentScene = game.scene.getScenes(true)[0];
            if (currentScene && currentScene.helpSystem && currentScene.helpSystem.isVisible) {
                currentScene.helpSystem.hide();
            }
        }
    });
    
    // Add keyboard shortcuts for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.addEventListener('keydown', (e) => {
            // Press 'S' to save game
            if (e.key === 's' && !e.repeat) {
                gameState.save();
                console.log('💾 Manual save triggered');
            }
            
            // Press 'R' to reload
            if (e.key === 'r' && !e.repeat) {
                window.location.reload();
            }
            
            // Press 'C' to clear save data
            if (e.key === 'c' && e.shiftKey && !e.repeat) {
                if (confirm('Clear all save data?')) {
                    gameState.clearSave();
                    Tutorial.resetTutorial();
                    window.location.reload();
                }
            }
            
            // Press 'T' to reset tutorial
            if (e.key === 't' && e.shiftKey && !e.repeat) {
                Tutorial.resetTutorial();
                console.log('🔄 Tutorial reset - reload to see it again');
            }
        });
        
        console.log('🛠️ Development shortcuts enabled:');
        console.log('  - Press ? or H for help');
        console.log('  - Press S to save');
        console.log('  - Press R to reload');
        console.log('  - Press Shift+C to clear save data');
        console.log('  - Press Shift+T to reset tutorial');
    } else {
        console.log('💡 Press ? or H for help anytime!');
    }
});

// Prevent context menu on right-click (for better game feel)
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Log errors for debugging
window.addEventListener('error', (e) => {
    console.error('Game error:', e.error);
});

// Visibility change handling (pause when tab not visible)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('⏸️ Game paused (tab hidden)');
        if (window.game) {
            window.game.sound.pauseAll();
        }
    } else {
        console.log('▶️ Game resumed');
        if (window.game) {
            window.game.sound.resumeAll();
        }
    }
});
