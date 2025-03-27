import {EnhancementsDialog} from "./scripts/enhancements/enhancementsDialog.js";
import {sfxData} from "./lib/sfxData.js";
import {animationData} from "./lib/animationData.js";
import {globalActions} from "./lib/gobalActionsData.js";
import {enhancementActions} from "./lib/enhancementActionsData.js";
import {repeatingWeapon, playWeaponReloadSfx} from "./scripts/animations/repeatingWeapon.js";
import {backlashCheck} from "./scripts/setting_rules/backlash.js";
import {toggleDuckingEffect} from "./scripts/effects/toggleDuckingEffect.js";
import {setRangeCategory} from "./scripts/utils/rangeCalculation.js"
import {checkForActiveSmartLink} from "./scripts/utils/enhancementUtils.js";


// Track open enhancement dialogs
const openEnhancementDialogs = new Map();

// initialize the macros
Hooks.once('init', function() {
    console.warn('VJP Macros: Initializing');
});

// Setup objects to be available directly in Foundry
Hooks.once('ready', async () => {
    // Add the animationData and sfxData to the game object
    game.vjpmacros = {
        animationData,
        sfxData
    };

    // add global actions
    game.brsw.add_actions(globalActions);
    game.brsw.add_actions(enhancementActions);
    console.warn('VJP Macros: Global actions added');
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
        await backlashCheck(br_message.trait_roll?.current_roll?.dice, br_message.actor, br_message.trait_roll?.current_roll?.is_fumble);
    }
});

// Play the reload animation for the given item
Hooks.on('swadeReloadWeapon', async (item, reloaded) => {
    if(reloaded) {
        await playWeaponReloadSfx(item);
    }
});

// check and return the weapon type of the given item
function getWeaponType(item) {
    const weaponCategory = item.system?.category?.toLowerCase() || "";
    const weaponType = Object.keys(animationData)
        .sort((a, b) => b.length - a.length)
        .find(type => weaponCategory.includes(type)) || undefined;
    return weaponType;
}

// Run libWrapper's register function to wrap brsw's createItemCard function
Hooks.once("ready", () => {
    if (game.brsw && typeof game.brsw.create_item_card === "function") {
        // in here we want to wrap the create_item_card function to calculate a rangeCategory, in order to make weapon
        // enhancements modify the trait roll, depending on the range category (short = 1, medium = 2, long = 3, extreme = 4)
        libWrapper.register("vjpmacros", "game.brsw.create_item_card", async function (wrapped, ...args) {
            // Log the arguments to understand their structure
            console.log("create_item_card args:", args);

            // Determine which arg is the actor and which is the item
            let actor, item;

            if (args[0]?.constructor?.name === "SwadeActor") {
                actor = args[0];
                // Get the item based on what's passed
                if (args[1] && typeof args[1] === "string") {
                    item = actor.items.get(args[1]);
                } else if (args[1]?.type === "weapon") {
                    item = args[1];
                }
            }

            // Calculate and set range category if applicable
            await setRangeCategory(actor, item);
            await checkForActiveSmartLink(actor, item);

            // Now that our calculations are complete, call the original function
            // Check if the original is async (returns a Promise)
            const result = wrapped(...args);
            if (result instanceof Promise) {
                return await result;
            }
            return result;
        }, "WRAPPER");
    } else {
        console.error("game.brsw.create_item_card not found; cannot register wrapper.");
    }
});
