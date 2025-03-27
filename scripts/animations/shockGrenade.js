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


// Save the last template in a global property so it persists
game.vjpmacros.lastTemplate = lastTemplate;

// Schedule deletion after 3 seconds, while allowing the macro to finish
setTimeout(async () => {
    if (game.vjpmacros.lastTemplate) {
        game.vjpmacros.lastTemplate.document.delete();
        // Optionally clear the reference afterwards
        await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [game.vjpmacros.lastTemplate.id]);
        console.log('VJP Macros: Template deleted');
    }
}, 1000);