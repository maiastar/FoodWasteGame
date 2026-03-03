/**
 * Help System
 * Provides in-game help, tips, and educational content
 * Accessible via '?' key or help button
 */

class HelpSystem {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
    }
    
    /**
     * Toggle help overlay
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Show help overlay
     */
    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Overlay (semi-transparent)
        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.5);
        overlay.setOrigin(0, 0);
        overlay.setInteractive();
        overlay.setDepth(9000);
        overlay.setData('help', true);
        
        // Help panel (smaller, bottom-left position)
        const panelWidth = 520;
        const panelHeight = 420;
        const panelX = 30;
        const panelY = height - panelHeight - 30;
        
        const panel = this.scene.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0xffffff);
        panel.setStrokeStyle(4, 0x2196F3);
        panel.setOrigin(0, 0);
        panel.setDepth(9001);
        panel.setData('help', true);
        
        // Title
        this.scene.add.text(panelX + 20, panelY + 15, '❓ Help & Tips', {
            fontSize: '28px',
            fontFamily: 'Fredoka, Arial',
            color: '#2196F3',
            fontStyle: 'bold'
        }).setOrigin(0, 0).setDepth(9002).setData('help', true);
        
        // Content sections
        const contentY = panelY + 55;
        const lineHeight = 24;
        let currentY = contentY;
        
        const helpContent = [
            {
                title: '🎮 How to Play',
                items: [
                    '1. Set up your household with family size, income, and preferences',
                    '2. Manage your food inventory on the dashboard',
                    '3. Play minigames: Shopping, Cooking, Organizing, Planning',
                    '4. Make smart choices to reduce waste and save money!',
                    '5. Advance days to see your progress over time'
                ]
            },
            {
                title: '🛒 Shopping Tips',
                items: [
                    '• Check expiration dates before buying',
                    '• Stick to your shopping list',
                    '• Buy what you need, not impulse items'
                ]
            },
            {
                title: '🍳 Cooking Tips',
                items: [
                    '• Use ingredients expiring soon first (FIFO)',
                    '• Cook the right portion size for your family',
                    '• Leftovers can be frozen or reused'
                ]
            },
            {
                title: '📦 Storage Tips',
                items: [
                    '• Produce: Crisper drawer',
                    '• Dairy/Eggs: Middle shelves',
                    '• Raw meat: Bottom shelf',
                    '• Ready-to-eat: Top shelf'
                ]
            },
            {
                title: '⌨️ Controls',
                items: [
                    '• Mouse/Touch: Click buttons and drag items',
                    '• ? key: Toggle this help menu',
                    '• S key: Quick save (development)',
                    '• ESC key: Close menus'
                ]
            }
        ];
        
        helpContent.forEach(section => {
            // Section title
            this.scene.add.text(panelX + 20, currentY, section.title, {
                fontSize: '16px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                fontStyle: 'bold'
            }).setOrigin(0, 0).setDepth(9002).setData('help', true);
            
            currentY += 22;
            
            // Section items
            section.items.forEach(item => {
                this.scene.add.text(panelX + 30, currentY, item, {
                    fontSize: '13px',
                    fontFamily: 'Fredoka, Arial',
                    color: '#666666',
                    wordWrap: { width: 460 }
                }).setOrigin(0, 0).setDepth(9002).setData('help', true);
                
                currentY += lineHeight;
            });
            
            currentY += 10; // Extra space between sections
        });
        
        // Close button
        const closeBtn = this.scene.add.container(panelX + panelWidth / 2, panelY + panelHeight - 35).setDepth(9002);
        closeBtn.setData('help', true);
        
        const closeBg = this.scene.add.rectangle(0, 0, 150, 45, 0x2196F3).setDepth(9002);
        closeBg.setInteractive({ useHandCursor: true });
        closeBg.setData('help', true);
        
        const closeText = this.scene.add.text(0, 0, 'Close', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(9002);
        closeText.setData('help', true);
        
        closeBtn.add([closeBg, closeText]);
        
        // Hover effects
        closeBg.on('pointerover', () => {
            closeBg.setFillStyle(0x1976D2);
            closeBtn.setScale(1.05);
        });
        
        closeBg.on('pointerout', () => {
            closeBg.setFillStyle(0x2196F3);
            closeBtn.setScale(1);
        });
        
        closeBg.on('pointerdown', () => {
            this.hide();
        });
        
        // Click overlay to close
        overlay.on('pointerdown', () => {
            this.hide();
        });
    }
    
    /**
     * Hide help overlay
     */
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        
        // Remove all help elements
        this.scene.children.list.forEach(child => {
            if (child.getData && child.getData('help')) {
                child.destroy();
            }
        });
    }
}
