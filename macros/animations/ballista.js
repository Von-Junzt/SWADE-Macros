const sourceToken = args[1].sourceToken; // the token that rolled the item
const lastTemplate = canvas.templates.placeables[canvas.templates.placeables.length - 1]; // the last template created
const activeUserIds = game.users.filter(user => user.active).map(user => user.id);
const sfxToPlay = ["modules/vjpmacros/assets/sfx/explosions/izlid_missile_flyby_01.wav", "modules/vjpmacros/assets/sfx/explosions/izlid_missile_flyby_02.wav"];
const randomSFX = sfxToPlay[Math.floor(Math.random() * sfxToPlay.length)];

await Sequencer.Preloader.preloadForClients(sfxToPlay);

await new Sequence()
    .sound()
    .file("modules/vjpmacros/assets/sfx/weapons/firearm/rpg7_fire_01.wav")
    .forUsers(activeUserIds)
    .sound()
    .file(randomSFX)
    .forUsers(activeUserIds)
    .effect()
    .file('jb2a.pack_hound_missile.orange.01')
    .atLocation(sourceToken)
    .stretchTo(lastTemplate)
    .playbackRate(3.5)
    .scale({x: .5, y: 0.6})
    .waitUntilFinished(-500)
    .effect()
    .file('jb2a.explosion.shrapnel.grenade.02.black')
    .atLocation(lastTemplate)
    .playbackRate(5)
    .scale(0.6)
    .zIndex(2)
    .play()