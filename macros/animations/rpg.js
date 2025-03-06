const sourceToken = args[1].sourceToken; // the token that rolled the item
const lastTemplate = canvas.templates.placeables[canvas.templates.placeables.length - 1]; // the last template created
const activeUserIds = game.users.filter(user => user.active).map(user => user.id);
const sfxToPlay = ["modules/vjpmacros/assets/sfx/explosions/izlid_missile_flyby_01.wav", "modules/vjpmacros/assets/sfx/explosions/izlid_missile_flyby_02.wav"];
const randomSFX = sfxToPlay[Math.floor(Math.random() * sfxToPlay.length)];
const ray = new Ray(sourceToken.center, lastTemplate)
const rotation = (ray.angle * 180 / Math.PI) - 90;
await sourceToken.document.update({rotation: rotation}, {animate: false});

await Sequencer.Preloader.preloadForClients([randomSFX, "modules/vjpmacros/assets/sfx/weapons/firearm/rpg7_fire_01.wav"]);

await new Sequence()
    .sound()
    .file("modules/vjpmacros/assets/sfx/weapons/firearm/rpg7_fire_01.wav")
    .forUsers(activeUserIds)
    .sound()
    .file(randomSFX)
    .forUsers(activeUserIds)
    .effect()
    .file('jb2a.throwable.launch.missile.04.pinkpurple')
    .scale(0.3)
    .playbackRate(4)
    .atLocation(sourceToken)
    .stretchTo(lastTemplate)
    .tint("#ff8a00")
    .playbackRate(7)
    .scale({x: .5, y: 0.4})
    .waitUntilFinished()
    .effect()
    .file('jb2a.explosion.shrapnel.grenade.02.black')
    .atLocation(lastTemplate)
    .playbackRate(5)
    .scale(0.6)
    .zIndex(2)
    .waitUntilFinished(-400)
    .play()