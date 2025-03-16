import {sfxData} from "./lib/sfxData.js";
import {animationData} from "./lib/animationData.js";
import {repeatingWeapon, playWeaponReloadSfx} from "./macros/animations/repeatingWeapon.js";
import {backlashCheck} from "./macros/setting_rules/backlash.js";
import {toggleDuckingEffect} from "./macros/effects/toggleDuckingEffect.js";
import {EnhancementsDialog} from "./macros/enhancements/enhancementsDialog.js";

// Track open enhancement dialogs
const openEnhancementDialogs = new Map();

// initialize the macros
Hooks.once('init', function() {
    console.warn('VON JUNZT SWADE MACROS LOADED');
});

// Setup objects to be available directly in Foundry
Hooks.once('ready', async () => {
    // Add the animationData and sfxData to the game object
    game.vjpmacros = {
        animationData,
        sfxData
    };
});

// add a visual effect for the ducking effect
Hooks.on("updateToken", toggleDuckingEffect);

// Register a hook that fires when item sheets are rendered
Hooks.on("renderItemSheet", (app, html, data) => {
    const item = app.object;
    // open only when the item is a weapon and the weapon type is defined in the animationData
    const weaponType = getWeaponType(item);
    if (item.type === "weapon" && weaponType) {
        // Auto-open the enhancements dialog if not already open
        if (!openEnhancementDialogs.has(item.id)) {
            setTimeout(() => {
                const dialog = new EnhancementsDialog(item);
                dialog.render(true);
                openEnhancementDialogs.set(item.id, dialog);
                dialog.options.window.close = () => {
                    openEnhancementDialogs.delete(item.id);
                    return true;
                };
            }, 100);
        }
    }
});

// Also hook into sheet close to clean up our tracking
Hooks.on("closeItemSheet", (app) => {
    const item = app.object;
    if (openEnhancementDialogs.has(item.id)) {
        const dialog = openEnhancementDialogs.get(item.id);
        dialog.close();
        openEnhancementDialogs.delete(item.id);
    }
});

// Fallback Button via Header Buttons Hook
Hooks.on('getItemSheetHeaderButtons', (sheet, buttons) => {
    const item = sheet.item;
    const weaponType = getWeaponType(item);
    if (item.type === "weapon" && weaponType) {
        buttons.unshift({
            class: 'open-enhancements-dialog',
            label: 'Weapon Enhancements',
            icon: 'fas fa-wrench',
            onclick: () => {
                // Check if a dialog is already open for this item.
                if (openEnhancementDialogs.has(item.id)) {
                    const dialog = openEnhancementDialogs.get(item.id);
                    // If the dialog is rendered, bring it to front.
                    if (dialog && dialog.rendered) {
                        dialog.bringToFront();
                        return;
                    } else {
                        // Otherwise, remove the stale reference.
                        openEnhancementDialogs.delete(item.id);
                    }
                }
                // Open a new enhancements dialog.
                const dialog = new EnhancementsDialog(item);
                dialog.render(true);
                openEnhancementDialogs.set(item.id, dialog);
                // Override the dialog's close method to clean up when it closes.
                const originalClose = dialog.close.bind(dialog);
                dialog.close = async function(...args) {
                    openEnhancementDialogs.delete(item.id);
                    await originalClose(...args);
                };
            }
        });
    }
});

// initiate weapon animation and check for backlash
Hooks.on('BRSW-RollItem', async (br_message, html) => {
    const item = br_message.item;
    // check if item is a weapon and if it's included in the animationData
    if (item.type === 'weapon') {
        // set the original shots count
        await item.setFlag('vjpmacros', 'originalShots', item.system.currentShots);
        // determine weapon type by name
        const weaponType = getWeaponType(item);
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

// Play the reload animation for the given item
Hooks.on('swadeReloadWeapon', async (item, reloaded) => {
    if(reloaded) {
        await playWeaponReloadSfx(item);
    }
});

function getWeaponType(item) {
    const weaponCategory = item.system?.category?.toLowerCase() || "";
    const weaponType = Object.keys(animationData)
        .sort((a, b) => b.length - a.length)
        .find(type => weaponCategory.includes(type)) || undefined;
    return weaponType;
}