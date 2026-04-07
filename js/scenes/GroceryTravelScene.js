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
        const uiDepth = 100;
        const cloudLayerDepth = 50;
        const carDepth = 80;

        if (this.textures.exists('travelRoad')) {
            const bg = this.add.image(width / 2, height / 2, 'travelRoad');
            const coverScale = Math.max(width / bg.width, height / bg.height);
            bg.setScale(coverScale);
            bg.setDepth(0);
        } else {
            this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0, 0);
            this.add.rectangle(0, height - 210, width, 210, 0x6D4C41).setOrigin(0, 0);
            this.add.rectangle(0, height - 150, width, 80, 0x424242).setOrigin(0, 0);
            this.add.rectangle(0, height - 112, width, 6, 0xFDD835).setOrigin(0, 0);
        }
        
        const title = this.direction === 'store' ? '🚗 Heading to the Grocery Store' : '🚗 Heading Home';
        this.add.text(width / 2, 60, title, {
            fontSize: '42px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#1b1b1b',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(uiDepth);
        
        const educational = this.cache.json.get('educationalContent') || {};
        const generalFacts = educational.tips && educational.tips.general ? educational.tips.general : [];
        const ageFacts = educational.wasteFactsByAge && household ? (educational.wasteFactsByAge[household.ageRange] || []) : [];
        const facts = [...ageFacts, ...generalFacts].slice(0, 5);

        const margin = 48;
        facts.forEach((fact, index) => {
            const cloudX = facts.length > 0
                ? margin + ((width - 2 * margin) * (index + 1)) / (facts.length + 1)
                : width / 2;
            const cloudY = 170 + (index % 2) * 130;

            const c = this.add.container(cloudX, cloudY);
            c.setDepth(cloudLayerDepth);

            if (this.textures.exists('travelCloud')) {
                const cloudImg = this.add.image(0, 0, 'travelCloud');
                cloudImg.setOrigin(0.5);
                const maxCloudW = 450;
                const maxCloudH = 248;
                const sc = Math.min(maxCloudW / cloudImg.width, maxCloudH / cloudImg.height);
                cloudImg.setScale(sc);
                const wrapW = Math.max(72, Math.floor(cloudImg.displayWidth * 0.52));
                c.add(cloudImg);
                const text = this.add.text(0, 15, fact, {
                    fontSize: '16px',
                    fontFamily: 'Fredoka, Arial',
                    color: '#333333',
                    align: 'center',
                    wordWrap: { width: wrapW }
                }).setOrigin(0.5);
                c.add(text);
            } else {
                const cloud = this.add.ellipse(0, 0, 480, 180, 0xffffff, 0.88);
                const text = this.add.text(0, 15, fact, {
                    fontSize: '16px',
                    fontFamily: 'Fredoka, Arial',
                    color: '#333333',
                    align: 'center',
                    wordWrap: { width: 280 }
                }).setOrigin(0.5);
                c.add([cloud, text]);
            }

            this.tweens.add({
                targets: c,
                x: cloudX + 40,
                duration: 2400 + index * 180,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
        
        const goingToStore = this.direction === 'store';
        const carY = height - 88;
        let car;
        if (this.textures.exists('travelCar')) {
            car = this.add.image(
                goingToStore ? -120 : width + 120,
                carY,
                'travelCar'
            );
            car.setOrigin(0.5);
            const maxCarW = 286;
            const maxCarH = 130;
            const carSc = Math.min(maxCarW / car.width, maxCarH / car.height);
            car.setScale(carSc);
            car.setFlipX(goingToStore);
        } else {
            car = this.add.text(
                goingToStore ? -120 : width + 120,
                height - 95, '🚗', { fontSize: '117px' }
            ).setOrigin(0.5);
            if (!goingToStore) car.setScale(-1, 1);
        }
        car.setDepth(carDepth);
        this.tweens.add({
            targets: car,
            x: goingToStore ? width + 120 : -120,
            duration: 10000,
            ease: 'Sine.easeInOut'
        });
        
        const loadingText = this.add.text(width / 2, height - 30, 'Loading next stop...', {
            fontSize: '24px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(uiDepth);
        
        this.tweens.add({
            targets: loadingText,
            alpha: 0.35,
            duration: 450,
            yoyo: true,
            repeat: -1
        });
        
        this.time.delayedCall(10000, () => {
            this.scene.start(this.nextScene);
        });
    }
}
