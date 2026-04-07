/**
 * Title Scene
 * Landing screen shown to new players before household setup
 */
class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
        this.titleSetupBgm = null;
    }

    create() {
        const width  = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Letterbox bars if aspect ratio differs from the PNG (switch to Math.max for cover/crop)
        this.add.rectangle(0, 0, width, height, 0xE8F5E9).setOrigin(0, 0);

        if (this.textures.exists('titleScreen')) {
            const titleBg = this.add.image(width / 2, height / 2, 'titleScreen');
            const fitScale = Math.min(width / titleBg.width, height / titleBg.height);
            titleBg.setScale(fitScale);
        }

        // Start Game button
        const btnW = 340;
        const btnH = 70;
        const btnY = 460;

        const btn = this.add.rectangle(width / 2, btnY, btnW, btnH, 0x4CAF50);
        btn.setStrokeStyle(4, 0xffffff);
        btn.setInteractive({ useHandCursor: true });

        this.add.text(width / 2, btnY, 'Start Game', {
            fontSize: '30px',
            fontFamily: 'Fredoka, Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        btn.on('pointerover',  () => btn.setFillStyle(0x66BB6A));
        btn.on('pointerout',   () => btn.setFillStyle(0x4CAF50));
        btn.on('pointerdown',  () => this.scene.start('SetupScene'));

        if (this.cache.audio.exists('titleSetupBgm')) {
            this.titleSetupBgm = this.sound.add('titleSetupBgm', { loop: true, volume: 0.35 });
            this.titleSetupBgm.play();
            if (typeof wireBgmAfterAutoplayPolicy === 'function') {
                wireBgmAfterAutoplayPolicy(this, () => this.titleSetupBgm);
            }
        }
        const shutdownEv = (typeof Phaser !== 'undefined' && Phaser.Scenes && Phaser.Scenes.Events && Phaser.Scenes.Events.SHUTDOWN)
            ? Phaser.Scenes.Events.SHUTDOWN
            : 'shutdown';
        this.events.once(shutdownEv, () => {
            if (this.titleSetupBgm) {
                this.titleSetupBgm.stop();
                this.titleSetupBgm.destroy();
                this.titleSetupBgm = null;
            }
        });
    }
}
