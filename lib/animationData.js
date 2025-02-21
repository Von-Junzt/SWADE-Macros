export const animationData = {
    "default": {
        animation: "jb2a.bullet.02.orange",
        projectileSize: 0.2,
        casingDelay: 0,
        casingImage: "modules/vjp-macros/assets/gfx/casings/rifle_casing.webp",
        fireRateDelay: (rof) => rof > 3 ? Math.max(50, 300 - (rof * 25)) : 100
    },
    "combatshotgun": {
        animation: "jb2a.bullet.02.orange",
        bulletSize: 0.5,
        casingDelay: 300,
        casingImage: "modules/vjp-macros/assets/gfx/casings/shotgun_shell.webp",
        fireRateDelay: () => 300
    },
    "shotgun": {
        animation: "jb2a.bullet.02.orange",
        bulletSize: 0,
        casingDelay: 300,
        casingImage: "modules/vjp-macros/assets/gfx/casings/shotgun_shell.webp",
        fireRateDelay: () => 800
    }
}