let source = token;

// Create a new sequence effect for the laser beam
new Sequence()
    .effect()
    .atLocation(source)
    .attachTo(source)
    .rotate(90)
    .spriteOffset({ x: -1.40 }, { gridUnits: true })
    .file("modules/vjpmacros/assets/gfx/lasers/laser_pointer.webp")
    .scale({x: 0.4, y: 0.3})
    .persist(true)
    .belowTokens()
    .play();