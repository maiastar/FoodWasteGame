/**
 * After a full page load, browsers often block BGM until a user gesture.
 * Call after sound.play() so the first tap/click retries play if needed.
 */
window.wireBgmAfterAutoplayPolicy = function (scene, getBgm, debugLabel) {
    if (!scene || typeof getBgm !== 'function') return;
    scene.time.delayedCall(300, () => {
        const bgm = getBgm();
        if (!bgm) return;
        const ctx = scene.sound && scene.sound.context;
        const ctxState = ctx ? ctx.state : 'no-ctx';
        const playing = !!bgm.isPlaying;
        // #region agent log
        fetch('http://127.0.0.1:7859/ingest/b036e89a-1ab9-49a4-ae6c-75c49eb5b220', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6e016e' }, body: JSON.stringify({ sessionId: '6e016e', location: 'BgmAutoplay.js:check', message: debugLabel || 'bgm-check', data: { ctxState, playing, hypothesisId: 'H1-autoplay' }, timestamp: Date.now() }) }).catch(() => {});
        // #endregion
        if (playing) return;
        const replay = () => {
            const b = getBgm();
            if (!b) return;
            if (scene.sound && scene.sound.context && scene.sound.context.state === 'suspended') {
                scene.sound.context.resume().catch(() => {});
            }
            if (!b.isPlaying) b.play();
            // #region agent log
            fetch('http://127.0.0.1:7859/ingest/b036e89a-1ab9-49a4-ae6c-75c49eb5b220', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '6e016e' }, body: JSON.stringify({ sessionId: '6e016e', location: 'BgmAutoplay.js:replay', message: debugLabel || 'bgm-replay', data: { isPlaying: !!(b && b.isPlaying), hypothesisId: 'H1-autoplay' }, timestamp: Date.now() }) }).catch(() => {});
            // #endregion
        };
        scene.input.once('pointerdown', replay);
    });
};
