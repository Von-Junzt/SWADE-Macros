import {getWeaponSfxConfig} from "../scripts/utils/sfxUtils.js";
import {updateItemFlags} from "../scripts/utils/generalUtils.js";

/**
 * Important Info:
 * We are dependent on Better Rolls for SWADE, but this mod reduces the notes field to < 50 characters. So we need to edit
 * the chat card template in the mod folder, specifically "betterrolls-swade2/scripts/item_card.js" on line 139 so the item
 * notes are not hidden on the chat card. "item.system.notes && item.system.notes.length < 300" is a good value.
 * */

// Object containing the data for weapon enhancements.
export const WEAPON_ENHANCEMENTS = {
    // Extended Magazine: increases ammo capacity by the specified number
    apAmmo: {
        name: "AP Ammunition",
        description: "Increases the AP of a weapon by +1.",
        compatibleWeapons:[
            "assault cannon",
            "assault rifle",
            "bolt action rifle",
            "lever-action rifle",
            "machine gun",
            "pistol",
            "pocket pistol",
            "revolver",
            "sniper rifle",
            "sporting rifle",
            "submachine gun"
        ],
        sfxToPlay: "modules/vjpmacros/assets/sfx/weapons_general/bullet_insert.ogg",
        noticeRollMod: 0,
        apply: (item) => {
            const currentAP = item.system.ap || 0;

            // Create a properly structured update
            const updatedData = {
                "system.ap": currentAP + 1,
                "system.ammo": "Bullets, AP Upgrade"
            };

            // will be called directly and after that the update will be applied
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                    cachedData: {
                        originalAmmo: item.system.ammo
                    }
                }
            });
            updatedData.flags = updatedFlags;

            return updatedData;
        },
        remove: (item) => {
            const currentAP = item.system.ap || 0;
            const updatedData = {
                "system.ap": (currentAP - 1),
                "system.ammo": item.flags?.vjpmacros?.cachedData?.originalAmmo || "",
                "flags.vjpmacros.cacheValues.-=originalAmmo": null
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("ap ammunition")
    },
    bipod: {
        name: "Bipod",
        description: "Negates Recoil and Minimum Strength penalties.",
        compatibleWeapons: [
            "assault cannon",
            "assault rifle",
            "bolt action rifle",
            "machine gun",
            "sniper rifle",
            "sporting rifle"
        ],
        noticeRollMod: +1,
        apply: (item) => {
            // Create update data
            const updatedData = {};

            // Process Full Auto actions and gather bipod action IDs
            const bipodActionIds = [];
            if (item.system.actions?.additional) {
                const additionalActions = item.system.actions.additional;

                // Loop through current actions
                for (const key in additionalActions) {
                    const action = additionalActions[key];
                    // Check if action includes "Full Auto"
                    if (action.name.toLowerCase().includes("full auto")) {
                        // Create a copy of the action with a modified name and no modifier
                        const bipodAction = foundry.utils.duplicate(action);
                        bipodAction.name = `${action.name} (Bipod)`;
                        bipodAction.modifier = "0"; // Remove the trait modifier

                        // Generate a new unique key for this action
                        const newKey = `bipod_${key}`;
                        updatedData[`system.actions.additional.${newKey}`] = bipodAction;
                        bipodActionIds.push(newKey);
                    }
                }
            }

            // Use the updateItemFlags function to set flags
            updatedData.flags = updateItemFlags(item,
                {
                    bipodActionIds: bipodActionIds
                },
                { bipod: 1 }
            );

            return updatedData;
        },
        remove: (item) => {
            // Create update data
            const updatedData = {
                "flags.vjpmacros.-=bipod": null
            };

            // Remove the bipod-specific actions we added
            const bipodActionIds = item.flags?.vjpmacros?.cachedData?.bipodActionIds || [];
            for (const actionId of bipodActionIds) {
                updatedData[`system.actions.additional.-=${actionId}`] = null;
            }

            // Clean up cached data
            updatedData["flags.vjpmacros.cachedData.-=bipodActionIds"] = null;

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("bipod")
    },
    burstFireMode: {
        name: "Burst Fire",
        description: "Allows the weapon to fire in bursts of 3 shots with a +1 modifier on the trait and damage roll.",
        compatibleWeapons: [
            "pistol",
            "pocket pistol"
        ],
        noticeRollMod: 0,
        apply: (item) => {
            // Generate unique IDs for the new actions
            const actionID = foundry.utils.randomID(8);
            const damageID = foundry.utils.randomID(8);

            // Define the burst fire action data
            const burstFireActionData = {
                name: "Burst Fire",
                type: "trait",
                dice: 1,
                resourcesUsed: 3,
                modifier: "+1",
                override: "",
                uuid: null,
                macroActor: "default",
                isHeavyWeapon: false
            }

            // Define the burst damage action data
            const burstFireDamageData = {
                name: "Burst Damage",
                type: "damage",
                dice: null,
                resourcesUsed: null,
                modifier: "+1",
                override: "",
                ap: null,
                uuid: null,
                macroActor: "default",
                isHeavyWeapon: false
            }

            // Create the update data with the new actions
            const updatedData = {
                "system.actions.additional": {
                    [actionID]: burstFireActionData,
                    [damageID]: burstFireDamageData
                }
            }

            // Store the action IDs in the item's flags for later removal
            updatedData.flags = updateItemFlags(item,
                { burstFireActionIds: [actionID, damageID] }, // Cache the action IDs
                { burstFireMode: 1 }                          // Set feature flag
            );

            return updatedData;
        },
        remove: (item) => {
            // Create the base update data
            const updatedData = {
                // Remove the feature flag
                "flags.vjpmacros.-=burstFireMode": null,
                // Clean up cached data (will be done at the end)
            }

            // Get the stored action IDs from flags
            const actionIds = item.flags?.vjpmacros?.cachedData?.burstFireActionIds || [];

            // Remove the actions we added
            for (const id of actionIds) {
                updatedData[`system.actions.additional.-=${id}`] = null;
            }

            // Clean up the cached data
            updatedData["flags.vjpmacros.cachedData.-=burstFireActionIds"] = null;

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("burst fire mode")
    },
    builtInSuppressor: {
        name: "Built-In Suppressor",
        description: "Makes it harder for enemies to spot the firing sound.",
        compatibleWeapons: ["all"],
        noticeRollMod: 0,
        sfxToPlay: "modules/vjpmacros/assets/sfx/weapons_general/screw_on_suppressor.ogg",
        apply: (item) => {},
        remove: (item) => {},
        // Used to identify if an item is this type of enhancement
        matcher: (item) => item.name.toLowerCase().includes("built-in suppressor")
    },
    compactFrame: {
        name: "Compact Frame",
        description: "Makes the weapon harder to spot but reduces the number of shots by 25%",
        compatibleWeapons: [
            "pistol",
            "pocket pistol"
        ],
        noticeRollMod: -2,
        apply: (item) => {
            // Get current values
            const currentMaxShots = item.system.shots || 0;
            const reducedShots = Math.floor(currentMaxShots * 0.75);

            const updatedData = {
                "system.shots": reducedShots,
                "system.currentShots": reducedShots
            };

            // Store the original max shots in flags
            updatedData.flags = updateItemFlags(item,
                { originalMaxShots: currentMaxShots }, // Cache the original value
                { compactFrame: 1 }                    // Set feature flag
            );

            return updatedData;
        },
        remove: (item) => {
            // Retrieve the original max shots from flags
            const originalMaxShots = item.flags?.vjpmacros?.cachedData?.originalMaxShots || 0;

            const updatedData = {
                "system.shots": originalMaxShots,
                "system.currentShots": originalMaxShots,
                // Remove the feature flag
                "flags.vjpmacros.-=compactFrame": null,
                // Clean up cached data
                "flags.vjpmacros.cachedData.-=originalMaxShots": null
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("compact frame")
    },
    cqbOptic: {
        name: "CQB Optic",
        description: "Improves the weapon's accuracy at close and mid range and negates 1 point of roll penalties.",
        compatibleWeapons: [
            "assault rifle",
            "combat shotgun",
            "flechette pistol",
            "lever-action rifle",
            "lever-action shotgun",
            "pistol",
            "pocket pistol",
            "revolver",
            "shotgun",
            "sporting shotgun",
            "submachine gun"
        ],
        noticeRollMod: +1,
        apply: (item) => {
            const updatedData = {};

            // Set the cqbOptic flag to 1
            updatedData.flags = updateItemFlags(item,
                {}, // No cache data needed for this enhancement
                { cqbOptic: 1 } // Set the cqbOptic flag to 1
            );

            return updatedData;
        },
        remove: (item) => {
            // Remove from notes
            const updatedData = {
                "flags.vjpmacros.-=cqbOptic": null
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("cqb optic")
    },
    drumMag: {
        name: "Drum Magazine",
        description: "Increases the number of shots.",
        compatibleWeapons: [
            "assault rifle",
            "machine gun",
            "machine pistol"
        ],
        sfxToPlay: async (item) => {
            const sfxConfig = await getWeaponSfxConfig(item);
            return sfxConfig.reloadSFX;
        },
        noticeRollMod: +2,
        apply: (item, enhancementItem) => {
            // Extract the number from the enhancement item name - modified regex
            const match = enhancementItem.name.match(/\((\d+)\)/);
            const newMaxShots = match ? parseInt(match[1]) : 50;

            // set new max shots
            const updatedData = {
                "system.shots": newMaxShots
            };

            // store old shots in cache
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                    cachedData: {
                        originalMaxAmmo: item.system.shots || 0
                    }
                }
            });
            updatedData.flags = updatedFlags;

            return updatedData;
        },

        remove: (item, enhancementItem) => {
            // Extract number from the enhancement item name - modified regex
            const match = enhancementItem.name.match(/\((\d+)\)/);
            const capacity = match ? match[1] : "5";

            // Get old max Ammo from cache
            const cachedMaxAmmo = item.flags?.vjpmacros?.cachedData?.originalMaxAmmo || 0;

            // update
            const updatedData = {
                "system.shots": cachedMaxAmmo
            };

            // Clean up cached data
            updatedData["flags.vjpmacros.cachedData.-=originalMaxAmmo"] = null;

            // Remove from notes
            updatedData["system.notes"] = removeFromNotes(item.system?.notes || "", `Drum Mag (${capacity})`);

            return updatedData;
        },

        matcher: (item) => {
            // Modified to match "Drum Magazine" followed by any number in parentheses
            return /drum magazine\s*\((\d+)\)/i.test(item.name.toLowerCase());
        }
    },
    exAmmo: {
        name: "EX Ammunition",
        description: "Increases the damage of a weapon by +1.",
        compatibleWeapons:[
            "assault cannon",
            "assault rifle",
            "bolt action rifle",
            "lever-action rifle",
            "machine gun",
            "pistol",
            "pocket pistol",
            "revolver",
            "sniper rifle",
            "sporting rifle",
            "submachine gun"
        ],
        sfxToPlay: "modules/vjpmacros/assets/sfx/weapons_general/bullet_insert.ogg",
        noticeRollMod: 0,
        apply: (item) => {
            const currentDmgMod = item.system.actions.dmgMod || 0;
            // Create a properly structured update
            const updatedData = {
                "system.actions.dmgMod": String(Number(currentDmgMod) + 1),
                "system.ammo": "Bullets, EX Upgrade"
            };

            // will be called directly and after that the update will be applied
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                    cachedData: {
                        originalAmmo: item.system.ammo
                    }
                }
            });
            updatedData.flags = updatedFlags;

            return updatedData;
        },
        remove: (item) => {
            const currentDmgMod = item.system.actions.dmgMod || 0;
            const updatedData = {
                "system.actions.dmgMod": String(Number(currentDmgMod) - 1),
                "system.ammo": item.flags?.vjpmacros?.cachedData?.originalAmmo || "",
                "flags.vjpmacros.cacheValues.-=originalAmmo": null
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("ex ammunition")
    },
    extendedMag: {
        name: "Extended Magazine",
        description: "Increases ammunition capacity by the specified number of rounds.",
        compatibleWeapons:["all"],
        noticeRollMod: +1,
        sfxToPlay: async (item) => {
            const sfxConfig = await getWeaponSfxConfig(item);
            return sfxConfig.reloadSFX;
        },
        apply: (item, enhancementItem) => {
            // Extract the number from the enhancement item name
            const match = enhancementItem.name.match(/\(\+(\d+)\)/);
            const extraShots = match ? parseInt(match[1]) : 5;

            const maxAmmo = item.system.shots || 0;
            const updatedData = {
                "system.shots": maxAmmo + extraShots
            };

            return updatedData;
        },
        remove: (item, enhancementItem) => {
            // Extract the number from the item name, default to 5 if not found
            const match = enhancementItem.name.match(/\(\+(\d+)\)/);
            const extraShots = match ? parseInt(match[1]) : 5;

            const maxAmmo = item.system.shots || 0;
            const currentAmmo = item.system.currentShots || 0;

            const newMaxAmmo = Math.max(0, maxAmmo - extraShots);
            const updatedData = {
                "system.shots": newMaxAmmo
            };

            // Adjust current shots if needed
            if (currentAmmo > newMaxAmmo) {
                updatedData["system.currentShots"] = newMaxAmmo;
            }

            return updatedData;
        },
        // Used to identify if an item is this type of enhancement
        matcher: (item) => {
            // Match any item with "extended mag" and a number in parentheses
            return /extended magazine\s*\(\+\d+\)/i.test(item.name.toLowerCase());
        }
    },
    foldableStock: {
        name: "Foldable Stock",
        description: "-1 penalty to spot the gun, -1 penalty to shoot",
        compatibleWeapons: ["all"],
        noticeRollMod: -1,
        apply: (item) => {
            // Create update data
            const updatedData = {};

            // Properly merge flags
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                    foldableStock: 1 // Flag to indicate bipod is attached
                }
            });
            updatedData.flags = updatedFlags;

            return updatedData;
        },
        remove: (item) => {

            // remove flags and clean up notes
            const updatedData = {
                "flags.vjpmacros.-=foldableStock": null,
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("foldable stock")
    },
    fullAutoMode: {
        name: "Full Auto",
        description: "Allows the weapon to fire full auto mode.",
        compatibleWeapons: [
            "pistol",
            "pocket pistol"
        ],
        noticeRollMod: 0,
        apply: (item) => {
            // we just want to add burst fire action and a damage action and remove it when we remove the enhancement
            const actionID = foundry.utils.randomID(8);
            const fullAutoActionData = {
                name: "Full Auto",
                type: "trait",
                dice: 3,
                resourcesUsed: 10,
                modifier: "-2",
                override: "",
                uuid: null,
                macroActor: "default",
                isHeavyWeapon: false
            }

            const updatedData = {
                "system.actions.additional": {
                    [actionID]: fullAutoActionData,
                }
            }

            // Store the action IDs in the item's flags for later removal
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                    cachedData: {
                        fullAutoActionId: actionID
                    }
                }
            });
            updatedData.flags = updatedFlags;

            return updatedData;
        },
        remove: (item) => {
            // clean up the notes
            const updatedData = {
                "flags.vjpmacros.cachedData.-=fullAutoActionId": null
            }

            // Get the stored action IDs from flags
            const actionId = item.flags?.vjpmacros?.cachedData?.fullAutoActionId || [];
            updatedData[`system.actions.additional.-=${actionId}`] = null;

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("full auto mode")
    },
    gasvent: {
        name: "Gas Vent System",
        description: "Reduces the Autofire penalty to -1.",
        compatibleWeapons: ["all"],
        noticeRollMod: +1,
        sfxToPlay: "modules/vjpmacros/assets/sfx/weapons_general/screw_on_suppressor.ogg",
        apply: (item) => {
            // Ensure additional actions exist.
            if (!item.system.actions.additional) return {};

            const additionalActions = item.system.actions.additional;
            let updatedData = {};
            let foundAny = false;

            // Loop over every action in the additional actions object.
            for (const key in additionalActions) {
                const action = additionalActions[key];
                // Check if the action's name includes "full auto" (case-insensitive).
                if (action.name.toLowerCase().includes("full auto") && !action.name.toLowerCase().includes("bipod")) {
                    foundAny = true;
                    // Convert the modifier to a number.
                    const currentMod = parseInt(action.modifier, 10);
                    // Check if the modifier is worse than -1.
                    if (currentMod < -1) {
                        // Build an update object that sets the modifier to "-1".
                        const updatePath = `system.actions.additional.${key}.modifier`;
                        updatedData[updatePath] = "-1";
                    }
                }
            }

            // If no "Full Auto" actions were found, notify the user.
            if (!foundAny) {
                ui.notifications.warn("No 'Full Auto' action found on this item!");
            }

            return updatedData;
        },
        remove: (item) => {
            // Ensure additional actions exist.
            if (!item.system.actions.additional) return {};

            const additionalActions = item.system.actions.additional;
            let updatedData = {};

            // Loop over all keys in the additional actions object.
            for (const key in additionalActions) {
                const action = additionalActions[key];
                if (action.name.toLowerCase().includes("full auto") && !action.name.toLowerCase().includes("bipod")) {
                    // Convert the current modifier to a number.
                    const currentMod = parseInt(action.modifier, 10);
                    // Since the gas vent added +1 (by effectively setting it to "-1"),
                    // subtract 1 to revert the change.
                    const newMod = currentMod - 1;
                    // Build an update path for the modifier.
                    const updatePath = `system.actions.additional.${key}.modifier`;
                    updatedData[updatePath] = newMod.toString();
                }
            }

            return updatedData;
        },
        // Matcher used to identify a gas vent enhancement.
        matcher: (item) => item.name.toLowerCase().includes("gas vent system")
    },
    longbarrel: {
        name: "Long Barrel",
        description: "Increases the range of the weapon by 25%",
        compatibleWeapons: ["all"],
        noticeRollMod: +1,
        apply: (item) => {
            // Get current values from the item
            const currentRange = item.system.range || "";
            let updatedData = {};

            // If range exists and has the expected format (e.g., "12/24/48")
            if (currentRange && currentRange.includes("/")) {
                const ranges = currentRange.split("/");
                // Increase each range value by 25% and round down for consistency
                const updatedRanges = ranges.map(range =>
                    Math.floor(parseInt(range) * 1.25)
                );
                updatedData["system.range"] = updatedRanges.join("/");

                // Store original range for later restoration
                const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                    vjpmacros: {
                        cachedData: {
                            originalRange: currentRange
                        }
                    }
                });
                updatedData.flags = updatedFlags;
            }

            return updatedData;
        },
        remove: (item) => {
            // Restore the original range from cached data
            const originalRange = item.flags?.vjpmacros?.cachedData?.originalRange || "";

            const updatedData = {
                "system.range": originalRange,
                "flags.vjpmacros.cachedData.-=originalRange": null
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("long barrel")
    },
    precisionBarrel: {
        name: "Precision Barrel",
        description: "Adds +1 to the trait modifier of the weapon.",
        compatibleWeapons: ["all"],
        noticeRollMod: 0,
        apply: (item) => {
            // Get current values from the item.
            const currentTraitMod = item.system.actions?.traitMod || "0";
            const updatedTraitmod = String(Number(currentTraitMod) + 1);

            const updatedData = {
                "system.actions.traitMod": updatedTraitmod
            };

            return updatedData;
        },
        remove: (item) => {
            // Get current values from the item.
            const currentTraitMod = item.system.actions?.traitMod || "0";
            const updatedTraitmod = String(Number(currentTraitMod) - 1);

            const updatedData = {
                "system.actions.traitMod": updatedTraitmod
            };

            return updatedData;
        },
        // Used to identify if an item is this type of enhancement
        matcher: (item) => item.name.toLowerCase().includes("precision barrel")
    },
    sawedOffBarrel: {
        name: "Sawed-Off Barrel",
        description: "Halfes the range of the weapon. Add a -2 modifier to Notice rolls to spot the weapon.",
        compatibleWeapons: ["shotgun", "sporting shotgun", "lever-action shotgun", "bolt action rifle", "sporting rifle"],
        noticeRollMod: -2,
        apply: (item) => {
            // Get current values from the item
            const currentRange = item.system.range || "";
            let updatedData = {};

            // If range exists and has the expected format (e.g., "12/24/48")
            if (currentRange && currentRange.includes("/")) {
                const ranges = currentRange.split("/");
                // Reduce each range value by 25% and round down
                const updatedRanges = ranges.map(range =>
                    Math.floor(parseInt(range) * 0.5)
                );
                updatedData["system.range"] = updatedRanges.join("/");


                // Store original range for later restoration
                const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                    vjpmacros: {
                        cachedData: {
                            originalRange: currentRange
                        }
                    }
                });
                updatedData.flags = updatedFlags;
            }

            return updatedData;
        },
        remove: (item) => {
            // Restore the original range from cached data
            const originalRange = item.flags?.vjpmacros?.cachedData?.originalRange || "";

            const updatedData = {
                "system.range": originalRange,
                "flags.vjpmacros.cachedData.-=originalRange": null
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("sawed-off barrel")
    },
    sawedOffStock: {
        name: "Sawed-Off Stock",
        description: "Makes it harder to spot the weapon but reduces the trait modifier by 1.",
        compatibleWeapons: ["shotgun", "sporting shotgun", "lever-action shotgun", "bolt action rifle", "sporting rifle"],
        noticeRollMod: -2,
        apply: (item) => {
            // Get current trait mod
            const getTraitMod = item.system.actions?.traitMod || "0";
            const updatedTraitmod = String(Number(getTraitMod) - 1);

            const updatedData = {
                "system.actions.traitMod": updatedTraitmod
            };

            return updatedData;
        },
        remove: (item) => {
            // Get current trait mod
            const getTraitMod = item.system.actions?.traitMod || "0";
            const updatedTraitmod = String(Number(getTraitMod) + 1);

            const updatedData = {
                "system.actions.traitMod": updatedTraitmod
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("sawed-off stock")
    },
    scope: {
        name: "Scope",
        description: "Adds +2 to the aiming modifier. Allows shooting beyond long range.",
        compatibleWeapons: ["all"],
        noticeRollMod: 1,
        apply: (item) => {
            // add to notes
            const updatedData = {};

            // add flags
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                    scope: 1
                }
            });
            updatedData.flags = updatedFlags;

            return updatedData;
        },
        remove: (item) => {
            // remove from notes
            const updatedData = {
                "flags.vjpmacros.-=scope": null
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("scope")
    },
    shortbarrel: {
        name: "Short Barrel",
        description: "Reduces the range of the weapon by 25%",
        compatibleWeapons: ["all"],
        noticeRollMod: -1,
        apply: (item) => {
            // Get current values from the item
            const currentRange = item.system.range || "";
            let updatedData = {};

            // If range exists and has the expected format (e.g., "12/24/48")
            if (currentRange && currentRange.includes("/")) {
                const ranges = currentRange.split("/");
                // Reduce each range value by 25% and round down
                const updatedRanges = ranges.map(range =>
                    Math.floor(parseInt(range) * 0.75)
                );
                updatedData["system.range"] = updatedRanges.join("/");

                // Store original range for later restoration
                const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                    vjpmacros: {
                        cachedData: {
                            originalRange: currentRange
                        }
                    }
                });
                updatedData.flags = updatedFlags;
            }

            return updatedData;
        },
        remove: (item) => {
            // Restore the original range from cached data
            const originalRange = item.flags?.vjpmacros?.cachedData?.originalRange || "";

            const updatedData = {
                "system.range": originalRange,
                "flags.vjpmacros.cachedData.-=originalRange": null
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("short barrel")
    },
    slugs: {
        name: "Shotgun Slugs",
        description: "Increases the AP of a weapon by +1.",
        compatibleWeapons: ["shotgun", "combat shotgun", "sporting shotgun", "lever-action shotgun"],
        noticeRollMod: 0,
        sfxToPlay: "modules/vjpmacros/assets/sfx/weapons_general/870br_reld.wav",
        apply: (item) => {
            // Get current values from the item.
            const currentAP = item.system.ap || 0;
            // For the trait modifier, we assume it might be stored on the actions object.
            // Adjust the key as necessary depending on your SWADE implementation.
            const currentTraitMod = item.system.actions?.traitMod || "0";
            const currentAmmo = item.system.ammo || "";

            // Adjust the trait modifier if the ammo is "Shells, Buckshot"
            let modifiedTraitMod = (currentAmmo === "Shells, Buckshot")
                ? String(Number(currentTraitMod) - 2)
                : String(currentTraitMod);

            // Build the update data for the weapon.
            const updatedData = {
                "system.ap": currentAP + 1,
                "system.damage": "2d10",
                "system.actions.traitMod": modifiedTraitMod,
                "system.ammo": "Shells, Slug"
            };

            // Use removal operators to delete each standard range action from the "additional" object.
            if (item.system.actions?.additional) {
                for (let key in item.system.actions.additional) {
                    const actionName = item.system.actions.additional[key].name;
                    if (["Short Range", "Medium Range", "Long Range"].includes(actionName)) {
                        // This tells Foundry to remove the key entirely.
                        updatedData[`system.actions.additional.-=${key}`] = null;
                    }
                }
            }

            // Cache the current values for later restoration.
            // If no actions exist, cache an empty object.
            const cachedActions = foundry.utils.duplicate(item.system.actions || {});
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                    cachedData: {
                        originalAmmo: item.system.ammo,
                        originalTraitMod: currentTraitMod,
                        originalActions: cachedActions
                    }
                }
            });
            updatedData.flags = updatedFlags;

            return updatedData;
        },
        remove: (item) => {
            // Retrieve cached values stored during the apply phase.
            const cached = item.flags?.vjpmacros?.cachedData || {};
            const originalAmmo = cached.originalAmmo || "";
            const originalTraitMod = cached.originalTraitMod || "0";
            const originalActions = cached.originalActions || {};

            // Current AP after the enhancement was applied.
            const currentAP = item.system.ap || 0;

            // Build the update object to revert the changes
            const updatedData = {
                "system.ap": currentAP - 1,
                "system.damage": "",
                "system.actions.traitMod": originalTraitMod,
                "system.ammo": originalAmmo,
                "system.actions": originalActions
            };

            // Remove the cached values from the flags.
            updatedData["flags.vjpmacros.cachedData"] = null;

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("shotgun slugs")
    },
    smartgun: {
        name: "Smartgun",
        description: "Required for the use of the Smartlink cyberware.",
        compatibleWeapons: ["all"],
        noticeRollMod: 0,
        apply: (item) => {
            const updatedData = {};

            // Properly merge the new flag with existing flags
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                        smartgun: 1
                }
            });
            updatedData.flags = updatedFlags;

            return updatedData;
        },

        remove: (item) => {
            const updatedData = {
                "flags.vjpmacros.-=smartgun": null
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("smartgun")
    },
    suppressor: {
        name: "Suppressor",
        description: "Makes it harder for enemies to spot the firing sound.",
        compatibleWeapons: ["all"],
        noticeRollMod: +1,
        sfxToPlay: "modules/vjpmacros/assets/sfx/weapons_general/screw_on_suppressor.ogg",
        apply: (item) => {},
        remove: (item) => {},
        // Used to identify if an item is this type of enhancement
        // For the regular suppressor
        matcher: (item) => {
            const name = item.name.toLowerCase();
            return name.includes("suppressor") && !name.includes("built-in");
        }
    },
    ubgl: {
        name: "Underbarrel Grenade Launcher",
        description: "Adds an underbarrel grenade launcher to the weapon.",
        compatibleWeapons: ["assault rifle"],
        noticeRollMod: +1,
        apply: async (item) => {
            // check if player already has a ubgl in their inventory
            const actor = item.parent;
            const ubgl = actor.items.find(item => item.name.toLowerCase().includes("ubgl"));
            if(!ubgl) {
                // add a ubgl to the player's inventory
                const ubglItem = await fromUuid('Compendium.vjpmacros.von-junzt-premade-weapons.Item.G1d3F3bjnOmwO5pg');
                await actor.createEmbeddedDocuments("Item", [ubglItem]);
            }

            return updatedData;
        },
        remove: async (item) => {
            // check if player already has a ubgl in their inventory
            const actor = item.parent;
            const ubgl = actor.items.find(item => item.name.toLowerCase().includes("ubgl"));
            if(ubgl) {
                ubgl.delete();
            }

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("ubgl")
    }
}