import {sfxData} from "./lib/sfxData.js";
import {animationData} from "./lib/animationData.js";
import {repeatingWeapon, reloadWeapon} from "./macros/animations/repeatingWeapon.js";

Hooks.once('init', function() {
    console.warn('VON JUNZT SWADE MACROS LOADED');
});

Hooks.once('ready', () => {
    game.vjpmacros = {
        animationData,
        sfxData
    };
});

Hooks.on('BRSW-RollItem', async (br_message, html) => {
    const item = br_message.item;
    if (item.type === 'weapon') {
        // set the original shots count
        await item.setFlag('vjpmacros', 'originalShots', item.system.currentShots);
        // determine weapon type by name
        const weaponName = item.name.toLowerCase();
        const weaponType = Object.keys(animationData)
            .sort((a, b) => b.length - a.length)  // Sort by length descending
            .find(type => weaponName.includes(type)) || "notfound";
        // if we have a valid weapon type, we can play the animation
        if (weaponType !== "notfound") {
            await repeatingWeapon(br_message, weaponType);
        } else {
            console.warn("Weapon not found in animationData", weaponType);
        }
    }
});

Hooks.on('swadeReloadWeapon', async (item, reloaded) => {
    if(reloaded) {
        await reloadWeapon(item);
    }
});