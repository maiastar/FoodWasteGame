/**
 * After a full page load, browsers often block BGM until a user gesture.
 * Call after sound.play() so the first tap/click retries play if needed.
 */
window.wireBgmAfterAutoplayPolicy = function (scene, getBgm) {
    if (!scene || typeof getBgm !== 'function') return;
    scene.time.delayedCall(300, () => {
        const bgm = getBgm();
        if (!bgm || bgm.isPlaying) return;
        const replay = () => {
            const b = getBgm();
            if (!b) return;
            if (scene.sound && scene.sound.context && scene.sound.context.state === 'suspended') {
                scene.sound.context.resume().catch(() => {});
            }
            if (!b.isPlaying) b.play();
        };
        scene.input.once('pointerdown', replay);
    });
};
