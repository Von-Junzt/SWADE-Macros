import {sfxData} from "./lib/sfxData.js";
import {animationData} from "./lib/animationData.js";
import {repeatingWeapon, playWeaponReloadSfx} from "./macros/animations/repeatingWeapon.js";
import {backlashCheck} from "./macros/setting_rules/backlash.js";
import {toggleDuckingEffect} from "./macros/effects/toggleDuckingEffect.js";
import {WeaponEnhancementDialog} from "./macros/weapon_enhancements/weaponEnhancementDialog.js";

/**
 * Initialize the module
 */
Hooks.once('init', function() {
    console.warn('VON JUNZT SWADE MACROS LOADED');
});

/**
 * Setup objects to be available directly in Foundry
 */
Hooks.once('ready', async () => {
    // Add the animationData and sfxData to the game object
    game.vjpmacros = {
        animationData,
        sfxData
    };
});

/**
 * Adds a visual effect when a token is ducked
 */
Hooks.on("updateToken", toggleDuckingEffect);

// Hook: Inject a "Manage Enhancements" button into weapon item sheets
Hooks.on('getItemSheetHeaderButtons', function (sheet, buttons) {
    // Only modify sheets for items of type "weapon"
    if (sheet.document.type !== 'weapon') return;

    buttons.unshift({
        class: 'manage-enhancements',
        label: 'Enhancements',
        icon: 'fas fa-tools', // You can choose an appropriate icon
        onclick: () => new WeaponEnhancementDialog(sheet.document).render({force: true})
    });
});

/**
 * initiate weapon animation and check for backlash
 */
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
    if(item.type === 'power') {
        console.log(br_message);
        await backlashCheck(br_message.trait_roll?.current_roll?.dice, br_message.actor, br_message.trait_roll?.current_roll?.is_fumble);
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