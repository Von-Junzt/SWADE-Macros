export const animationData = {
    "combatshotgun": {
        animation: "jb2a.bullet.02.orange",
        projectileSize: 0.4,
        casingAnimationDelay: 300,
        casingImage: "modules/vjpmacros/assets/gfx/casings/shotgun_shell.webp",
        casingSize: 0.1,
        fireRateDelay: () => 300
    },
    "pistol": {
        animation: "jb2a.bullet.02.orange",
        projectileSize: 0.2,
        casingAnimationDelay: 0,
        casingImage: "modules/vjpmacros/assets/gfx/casings/rifle_casing.webp",
        casingSize: 0.1,
        fireRateDelay: (rof) => rof > 3 ? Math.max(50, 300 - (rof * 25)) : 100
    },
    "rifle": {
        animation: "jb2a.bullet.02.orange",
        projectileSize: 0.2,
        casingAnimationDelay: 0,
        casingImage: "modules/vjpmacros/assets/gfx/casings/rifle_casing.webp",
        casingSize: 0.1,
        fireRateDelay: (rof) => rof > 3 ? Math.max(50, 300 - (rof * 25)) : 100
    },
    "shotgun": {
        animation: "jb2a.bullet.02.orange",
        projectileSize: 0.4,
        casingAnimationDelay: 300,
        casingImage: "modules/vjpmacros/assets/gfx/casings/shotgun_shell.webp",
        casingSize: 0.1,
        fireRateDelay: () => 800
    }
}