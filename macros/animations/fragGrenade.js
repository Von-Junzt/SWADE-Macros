const sourceToken = args[1].sourceToken; // the token that rolled the item
const lastTemplate = canvas.templates.placeables[canvas.templates.placeables.length - 1]; // the last template created
const activeUserIds = game.users.filter(user => user.active).map(user => user.id);

await new Sequence()
    .sound()
    .file('modules/vjpmacros/assets/sfx/equipment/grenade_use.wav')
    .forUsers(activeUserIds)
    .effect()
    .file('jb2a.throwable.throw.grenade.02.blackyellow')
    .atLocation(sourceToken)
    .stretchTo(lastTemplate)
    .playbackRate(1.5)
    .scale({x: .5, y: 0.5})
    .waitUntilFinished()
    .effect()
    .file('jb2a.explosion.shrapnel.grenade.02.black')
    .atLocation(lastTemplate)
    .playbackRate(2)
    .scale(0.6)
    .zIndex(2)
    .waitUntilFinished(-400)
    .play()
