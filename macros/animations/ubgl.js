const sourceToken = args[1].sourceToken; // the token that rolled the item
const lastTemplate = canvas.templates.placeables[canvas.templates.placeables.length - 1]; // the last template created
const sfxToPlay = game.vjpmacros.sfxData["ubgl"].fireSFX;
const animationToPlay = "modules/jb2a_patreon/Library/Generic/Weapon_Attacks/Ranged/LaunchGrenade01_01_Regular_Green_Thumb.webp";

await new Sequence()
    .sound()
    .file(sfxToPlay)
    .effect()
    .file(animationToPlay)
    .atLocation(sourceToken)
    .moveTowards(lastTemplate)
    .scale({x: 0.3, y: 0.3})
    .rotate(-45)
    .playbackRate(2)
    .waitUntilFinished(-200)
    .effect()
    .file('jb2a.explosion.shrapnel.grenade.02.black')
    .atLocation(lastTemplate)
    .playbackRate(1.5)
    .zIndex(2)
    .waitUntilFinished(-400)
    .play()