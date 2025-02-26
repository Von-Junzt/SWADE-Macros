const sourceToken = args[1].sourceToken; // the token that rolled the item
const lastTemplate = canvas.templates.placeables[canvas.templates.placeables.length - 1]; // the last template created
const sfxToPlay = game.vjpmacros.sfxData["ubgl"].fireSFX;
const animationToPlay = "modules/vjpmacros/assets/gfx/weapons/grenades/m203_grenade_green.webp";
const activeUserIds = game.users.filter(user => user.active).map(user => user.id);

await new Sequence()
    .sound()
    .file(sfxToPlay)
    .forUsers(activeUserIds)
    .effect()
    .file(animationToPlay)
    .atLocation(sourceToken)
    .moveTowards(lastTemplate)
    .moveSpeed(1500)
    .scale({x: 0.15, y: 0.15})
    .rotate(-90)
    .waitUntilFinished()
    .effect()
    .file('jb2a.explosion.shrapnel.grenade.02.black')
    .atLocation(lastTemplate)
    .playbackRate(2)
    .scale(0.6)
    .zIndex(2)
    .waitUntilFinished(-400)
    .play()