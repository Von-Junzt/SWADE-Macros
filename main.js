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

Hooks.on('getItemSheetHeaderButtons', function (sheet, buttons) {
    // Only modify sheets for items of type "weapon"
    if (sheet.document.type !== 'weapon') return;

    buttons.unshift({
        class: 'manage-enhancements',
        label: 'Enhancements',
        icon: 'fas fa-tools',
        onclick: () => {
            // Check if a dialog is already open for this item
            if (openEnhancementDialogs.has(sheet.document.id)) {
                const dialog = openEnhancementDialogs.get(sheet.document.id);
                // Check if the dialog's element exists before calling bringToFront()
                if (dialog.element) {
                    dialog.bringToFront();
                } else {
                    // If the dialog is closed or its element is missing, re-render it
                    dialog.render({ force: true });
                }
            } else {
                // Create a new dialog and track it
                const dialog = new EnhancementsDialog(sheet.document);
                dialog.render({ force: true });
                openEnhancementDialogs.set(sheet.document.id, dialog);

                // Store the original close function.
                const originalClose = dialog.close.bind(dialog);
                // Override the close method to ensure proper cleanup.
                dialog.options.window.close = async () => {
                    openEnhancementDialogs.delete(sheet.document.id);
                    return await originalClose();
                };
            }
        }
    });
});

// Register a hook that fires when item sheets are rendered
Hooks.on("renderItemSheet", (app, html, data) => {
    // Check if this is a weapon
    const item = app.object;
    if (item.type === "weapon") {
        // Check if we already have a dialog open for this item
        if (!openEnhancementDialogs.has(item.id)) {
            // Small delay to ensure the sheet is fully rendered and positioned
            setTimeout(() => {
                // Open the enhancement dialog and store the reference
                const dialog = new EnhancementsDialog(item);
                dialog.render(true);
                openEnhancementDialogs.set(item.id, dialog);

                // Remove from tracking when closed
                dialog.options.window.close = () => {
                    openEnhancementDialogs.delete(item.id);
                    return true; // Allow the window to close
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

// initiate weapon animation and check for backlash
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

// Play the reload animation for the given item
Hooks.on('swadeReloadWeapon', async (item, reloaded) => {
    if(reloaded) {
        await playWeaponReloadSfx(item);
    }
});