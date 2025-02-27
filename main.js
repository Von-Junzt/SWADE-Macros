import {sfxData} from "./lib/sfxData.js";
import {animationData} from "./lib/animationData.js";
import {repeatingWeapon, playWeaponReloadSfx} from "./macros/animations/repeatingWeapon.js";
import {backlashCheck} from "./macros/setting_rules/backlash.js";

/**
 * Initialize the module
 */
Hooks.once('init', function() {
    console.warn('VON JUNZT SWADE MACROS LOADED');
});

/**
 * Setup objects to be available directly in Foundry
 */
Hooks.once('ready', () => {
    game.vjpmacros = {
        animationData,
        sfxData
    };
});


Hooks.on('BRSW-RollItem', async (br_message, html) => {
    const item = br_message.item;
    // check if item is a weapon and if it's included in the animationData
    if (item.type === 'weapon') {
        // set the original shots count
        await item.setFlag('vjpmacros', 'originalShots', item.system.currentShots);
        // determine weapon type by name
        const weaponName = item.system?.category.toLowerCase();
        const weaponType = Object.keys(animationData)
            .sort((a, b) => b.length - a.length)  // Sort by length descending
            .find(type => weaponName.includes(type)) || undefined;
        // if we have a valid weapon type, we can play the animation
        if (weaponType) {
            await repeatingWeapon(br_message, weaponType);
        } else {
            console.warn("Weapon not found in animationData", weaponType);
        }
    }
    // check if the player has rolled a natural 1, when using a power (sprawlrunners specific rule)
    if((item.type === 'power')) {
        await backlashCheck(br_message.trait_roll?.rolls[br_message.trait_roll.rolls.length - 1]?.dice, br_message.actor);
    }
});

/**
 * Play the reload animation for the given item
 */
Hooks.on('swadeReloadWeapon', async (item, reloaded) => {
    if(reloaded) {
        await playWeaponReloadSfx(item);
    }
});