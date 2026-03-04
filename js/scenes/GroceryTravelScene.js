/**
 * Grocery Travel Scene
 * Transition/loading scene with animated car and floating facts
 */
class GroceryTravelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GroceryTravelScene' });
        this.nextScene = 'ManagementScene';
        this.direction = 'store';
    }
    
    init(data) {
        this.nextScene = data && data.nextScene ? data.nextScene : 'ManagementScene';
        this.direction = data && data.direction ? data.direction : 'store';
    }
    
    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const household = gameState.household;
        
        this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0, 0);
        this.add.rectangle(0, height - 210, width, 210, 0x6D4C41).setOrigin(0, 0);
        this.add.rectangle(0, height - 150, width, 80, 0x424242).setOrigin(0, 0);
        this.add.rectangle(0, height - 112, width, 6, 0xFDD835).setOrigin(0, 0);
        
        const title = this.direction === 'store' ? '🚗 Heading to the Grocery Store' : '🚗 Heading Home';
        this.add.text(width / 2, 60, title, {
            fontSize: '42px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#1b1b1b',
            strokeThickness: 5
        }).setOrigin(0.5);
        
        const educational = this.cache.json.get('educationalContent') || {};
        const generalFacts = educational.tips && educational.tips.general ? educational.tips.general : [];
        const ageFacts = educational.wasteFactsByAge && household ? (educational.wasteFactsByAge[household.ageRange] || []) : [];
        const facts = [...ageFacts, ...generalFacts].slice(0, 5);
        
        facts.forEach((fact, index) => {
            const cloudX = 170 + index * 230;
            const cloudY = 170 + (index % 2) * 90;
            const cloud = this.add.ellipse(cloudX, cloudY, 250, 95, 0xffffff, 0.88);
            const text = this.add.text(cloudX, cloudY, fact, {
                fontSize: '15px',
                fontFamily: 'Fredoka, Arial',
                color: '#333333',
                align: 'center',
                wordWrap: { width: 220 }
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: [cloud, text],
                x: cloudX + 40,
                duration: 2400 + index * 180,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
        
        const goingToStore = this.direction === 'store';
        const car = this.add.text(
            goingToStore ? -120 : width + 120,
            height - 168, '🚗', { fontSize: '90px' }
        ).setOrigin(0.5);
        if (!goingToStore) car.setScale(-1, 1);
        this.tweens.add({
            targets: car,
            x: goingToStore ? width + 120 : -120,
            duration: 3000,
            ease: 'Sine.easeInOut'
        });
        
        const loadingText = this.add.text(width / 2, height - 30, 'Loading next stop...', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: loadingText,
            alpha: 0.35,
            duration: 450,
            yoyo: true,
            repeat: -1
        });
        
        this.time.delayedCall(3200, () => {
            this.scene.start(this.nextScene);
        });
    }
}
