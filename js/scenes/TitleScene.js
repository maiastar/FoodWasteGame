/**
 * Title Scene
 * Landing screen shown to new players before household setup
 */
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        const width  = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(0, 0, width, height, 0xE8F5E9).setOrigin(0, 0);

        // Decorative food emoji row
        this.add.text(width / 2, 80, '🥦  🍎  🥕  🧀  🍳  🥚  🍞  🍋  🫐', {
            fontSize: '32px',
            fontFamily: 'Fredoka, Arial',
            color: '#A5D6A7',
            align: 'center'
        }).setOrigin(0.5);

        // Game title
        this.add.text(width / 2, 210, 'ForkCast', {
            fontSize: '72px',
            fontFamily: 'Fredoka, Arial',
            color: '#2E7D32',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, 300, 'Learn smarter habits. Waste less food.', {
            fontSize: '26px',
            fontFamily: 'Fredoka, Arial',
            color: '#666666'
        }).setOrigin(0.5);

        // Divider
        this.add.rectangle(width / 2, 350, 400, 3, 0xA5D6A7).setOrigin(0.5, 0);

        // Start Game button
        const btnW = 340;
        const btnH = 70;
        const btnY = 460;

        const btn = this.add.rectangle(width / 2, btnY, btnW, btnH, 0x4CAF50);
        btn.setStrokeStyle(4, 0xffffff);
        btn.setInteractive({ useHandCursor: true });

        const btnText = this.add.text(width / 2, btnY, '▶  Start Game', {
            fontSize: '30px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        btn.on('pointerover',  () => btn.setFillStyle(0x66BB6A));
        btn.on('pointerout',   () => btn.setFillStyle(0x4CAF50));
        btn.on('pointerdown',  () => this.scene.start('SetupScene'));

        // Hint text
        this.add.text(width / 2, 560, 'Set up your household and play through a full week of grocery decisions.', {
            fontSize: '18px',
            fontFamily: 'Fredoka, Arial',
            color: '#888888',
            align: 'center',
            wordWrap: { width: 700 }
        }).setOrigin(0.5);

        // Version / credit line
        this.add.text(width / 2, height - 30, 'ForkCast  •  Educational Food Waste Game', {
            fontSize: '14px',
            fontFamily: 'Fredoka, Arial',
            color: '#AAAAAA'
        }).setOrigin(0.5);
    }
}
