// noinspection JSAnnotator

const sourceToken = args[1].sourceToken; // the token that rolled the item
const lastTemplate = canvas.templates.placeables[canvas.templates.placeables.length - 1]; // the last template created
const activeUserIds = game.users.filter(user => user.active).map(user => user.id);

await Sequencer.Preloader.preloadForClients("modules/vjpmacros/assets/sfx/equipment/grenade_use.wav");

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

if (!game.modules.get('succ')?.active) {
    ui.notifications.error("You cannot execute the rest of this macro unless the SUCC module is active.");
    return;
}

// Iterate through the targets Set
for (const token of lastTemplate.targets) {
    game.succ.addCondition('stunned', [token]);
}