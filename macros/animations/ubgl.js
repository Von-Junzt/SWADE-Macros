const sourceToken = args[1].sourceToken; // the token that rolled the item
const lastTemplate = canvas.templates.placeables[canvas.templates.placeables.length - 1]; // the last template created
const sfxToPlay = game.vjpmacros.sfxData["ubgl"].fireSFX;
const animationToPlay = "modules/vjpmacros/assets/gfx/weapons/grenades/m203_grenade_green.webp";

await new Sequence()
    .sound()
    .file(sfxToPlay)
    .effect()
    .file(animationToPlay)
    .atLocation(sourceToken)
    .moveTowards(lastTemplate)
    .moveSpeed(1500)
    .scale({x: 0.15, y: 0.15})
    .rotate(-90)
    .waitUntilFinished(-200)
    .effect()
    .file('jb2a.explosion.shrapnel.grenade.02.black')
    .atLocation(lastTemplate)
    .playbackRate(1.5)
    .zIndex(2)
    .waitUntilFinished(-400)
    .play()