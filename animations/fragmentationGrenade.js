const sourceToken = args[1].sourceToken;
const lastTemplate = canvas.templates.placeables[canvas.templates.placeables.length - 1];

await new Sequence()
    .effect()
    .file('jb2a.throwable.throw.grenade.02.blackyellow')
    .atLocation(sourceToken)
    .stretchTo(lastTemplate)
    .playbackRate(1.5)
    .waitUntilFinished(-200)
    .effect()
    .file('jb2a.explosion.shrapnel.grenade.02.black')
    .atLocation(lastTemplate)
    .playbackRate(1.5)
    .zIndex(2)
    .waitUntilFinished(-400)
    .play()

await lastTemplate.delete()