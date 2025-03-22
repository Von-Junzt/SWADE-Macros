import {animationData} from "./animationData.js";
import {getWeaponSfxConfig} from "../macros/animations/repeatingWeapon.js";

/**
 * Important Info:
 * We are dependent on Better Rolls for SWADE, but this mod reduces the notes field to < 50 characters. So we need to edit
 * the chat card template in the mod folder, specifically "betterrolls-swade2/scripts/item_card.js" on line 139 so the item
 * notes are not hidden on the chat card. "item.system.notes && item.system.notes.length < 300" is a good value.
 * */

// Object containing the data for weapon enhancements.
export const weaponEnhancementsData = {
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
                "system.notes": addToNotes(item.system?.notes || "", "AP Ammo"),
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
                "system.notes": removeFromNotes(item.system?.notes || "", "AP Ammo"),
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
            // Get current values
            const minStr = item.system.minStr || "";

            // Create update data
            const updatedData = {
                "system.notes": addToNotes(item.system?.notes || "", "Bipod")
            };

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

            // Properly merge flags
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                    cachedData: {
                        originalMinStr: minStr,
                        bipodActionIds: bipodActionIds
                    },
                    bipod: 1 // Flag to indicate bipod is attached
                }
            });
            updatedData.flags = updatedFlags;

            // Remove minimum strength requirement
            if (minStr) {
                updatedData["system.minStr"] = "";
            }

            return updatedData;
        },
        remove: (item) => {
            // Create update data
            const updatedData = {
                "system.notes": removeFromNotes(item.system?.notes || "", "Bipod"),
                "flags.vjpmacros.-=bipod": null
            };

            // Restore original minimum strength
            const originalMinStr = item.flags?.vjpmacros?.cachedData?.originalMinStr;
            if (originalMinStr !== undefined) {
                updatedData["system.minStr"] = originalMinStr;
            }

            // Remove the bipod-specific actions we added
            const bipodActionIds = item.flags?.vjpmacros?.cachedData?.bipodActionIds || [];
            for (const actionId of bipodActionIds) {
                updatedData[`system.actions.additional.-=${actionId}`] = null;
            }

            // Clean up cached data
            updatedData["flags.vjpmacros.cachedData.-=originalMinStr"] = null;
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
            // we just want to add burst fire action and a damage action and remove it when we remove the enhancement
            const actionID = foundry.utils.randomID(8);
            const damageID = foundry.utils.randomID(8);
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

            const updatedData = {
                "system.notes": addToNotes(item.system?.notes || "", weaponEnhancementsData.burstFireMode.name),
                "system.actions.additional": {
                    [actionID]: burstFireActionData,
                    [damageID]: burstFireDamageData
                }
            }

            // Store the action IDs in the item's flags for later removal
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                    cachedData: {
                        burstFireActionIds: [actionID, damageID]
                    }
                }
            });
            updatedData.flags = updatedFlags;

            return updatedData;
        },
        remove: (item) => {
            // clean up the notes
            const updatedData = {
                "system.notes": removeFromNotes(item.system?.notes || "", weaponEnhancementsData.burstFireMode.name),
                "flags.vjpmacros.cachedData.-=burstFireActionIds": null
            }

            console.warn(removeFromNotes(item.system?.notes || "", weaponEnhancementsData.burstFireMode.name));

            // Get the stored action IDs from flags
            const actionIds = item.flags?.vjpmacros?.cachedData?.burstFireActionIds || [];

            // Remove the actions we added
            for (const id of actionIds) {
                updatedData[`system.actions.additional.-=${id}`] = null;
            }

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("burst fire mode")
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
            const maxShots = item.system.shots || 0;
            const reducedShots = Math.floor(maxShots * 0.75);

            const updatedData = {
                "system.notes": addToNotes(item.system?.notes || "", "Compact Frame"),
                "system.shots": reducedShots,
                "system.currentShots": reducedShots
            };

            // store maxShots in cachedData to be used in remove function
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                    cachedData: {
                        originalMaxShots: maxShots
                    }
                }
            });
            updatedData.flags = updatedFlags;

            return updatedData;
        },
        remove: (item) => {
            const cachedShots = item.flags?.vjpmacros?.cachedData?.originalMaxShots || 0;

            const updatedData = {
                "system.notes": removeFromNotes(item.system?.notes || "", "Compact Frame"),
                "system.shots": cachedShots,
                "system.currentShots": cachedShots,
                "flags.vjpmacros.-=cachedData": null
            };
            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("compact frame")
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

            // Add to notes
            updatedData["system.notes"] = addToNotes(item.system?.notes || "", `Drum Mag (${match ? match[1] : 50})`);

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
                "system.notes": addToNotes(item.system?.notes || "", "EX Ammo"),
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
                "system.notes": removeFromNotes(item.system?.notes || "", "EX Ammo"),
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

            // Add to notes
            updatedData["system.notes"] = addToNotes(item.system?.notes || "", `Ext. Mag (+${extraShots})`);

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

            // Remove from notes
            updatedData["system.notes"] = removeFromNotes(item.system?.notes || "", `Ext. Mag (+${extraShots})`);

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
            const updatedData = {
                "system.notes": addToNotes(item.system?.notes || "", "Foldable Stock"),
            };

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
                "system.notes": removeFromNotes(item.system?.notes || "", "Foldable Stock"),
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
                "system.notes": addToNotes(item.system?.notes || "", weaponEnhancementsData.burstFireMode.name),
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
                "system.notes": removeFromNotes(item.system?.notes || "", weaponEnhancementsData.burstFireMode.name),
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

            // Add the "Gas Vent" note regardless of changes.
            updatedData["system.notes"] = addToNotes(item.system?.notes || "", "Gas Vent");

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

            // Remove the "Gas Vent" note.
            updatedData["system.notes"] = removeFromNotes(item.system?.notes || "", "Gas Vent");

            return updatedData;
        },
        // Matcher used to identify a gas vent enhancement.
        matcher: (item) => item.name.toLowerCase().includes("gas vent system")
    },
    longbarrel: {
        name: "Long Barrel",
        description: "Increases the range of the weapon by 25%",
        compatibleWeapons: ["all"],
        noticeRollMod: +2,
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

            // Add to notes (consistent with other enhancements)
            updatedData["system.notes"] = addToNotes(item.system?.notes || "", "Long Barrel");

            return updatedData;
        },
        remove: (item) => {
            // Restore the original range from cached data
            const originalRange = item.flags?.vjpmacros?.cachedData?.originalRange || "";

            const updatedData = {
                "system.range": originalRange,
                "flags.vjpmacros.cachedData.-=originalRange": null
            };

            // Remove from notes (consistent with other enhancements)
            updatedData["system.notes"] = removeFromNotes(item.system?.notes || "", "Long Barrel");

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
                "system.actions.traitMod": updatedTraitmod,
                "system.notes": addToNotes(item.system?.notes || "", "Precision Barrel")
            };

            return updatedData;
        },
        remove: (item) => {
            // Get current values from the item.
            const currentTraitMod = item.system.actions?.traitMod || "0";
            const updatedTraitmod = String(Number(currentTraitMod) - 1);

            const updatedData = {
                "system.actions.traitMod": updatedTraitmod,
                "system.notes": removeFromNotes(item.system?.notes || "", "Precision Barrel")
            };

            return updatedData;
        },
        // Used to identify if an item is this type of enhancement
        matcher: (item) => item.name.toLowerCase().includes("precision barrel")
    },
    sawedOffBarrel: {
        name: "Sawed-Off Barrel",
        description: "Halfes the range of the weapon. Add a -2 modifier to Notice rolls to spot the weapon.",
        compatibleWeapons: ["shotgun", "sporting shotgun", "lever-action shotgun"],
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

            // Add to notes
            updatedData["system.notes"] = addToNotes(item.system?.notes || "", "Sawed-Off Barrel");

            return updatedData;
        },
        remove: (item) => {
            // Restore the original range from cached data
            const originalRange = item.flags?.vjpmacros?.cachedData?.originalRange || "";

            const updatedData = {
                "system.range": originalRange,
                "flags.vjpmacros.cachedData.-=originalRange": null
            };

            // Remove from notes
            updatedData["system.notes"] = removeFromNotes(item.system?.notes || "", "Sawed-Off Barrel");

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("sawed-off barrel")
    },
    sawedOffStock: {
        name: "Sawed-Off Stock",
        description: "Makes it harder to spot the weapon but reduces the trait modifier by 1.",
        compatibleWeapons: ["shotgun", "sporting shotgun", "lever-action shotgun"],
        noticeRollMod: -2,
        apply: (item) => {
            // Get current trait mod
            const getTraitMod = item.system.actions?.traitMod || "0";
            const updatedTraitmod = String(Number(getTraitMod) - 1);

            const updatedData = {
                "system.actions.traitMod": updatedTraitmod,
                "system.notes": addToNotes(item.system?.notes || "", "Sawed-Off Stock")
            };

            return updatedData;
        },
        remove: (item) => {
            // Get current trait mod
            const getTraitMod = item.system.actions?.traitMod || "0";
            const updatedTraitmod = String(Number(getTraitMod) + 1);

            const updatedData = {
                "system.actions.traitMod": updatedTraitmod,
                "system.notes": removeFromNotes(item.system?.notes || "", "Sawed-Off Stock")
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("sawed-off stock")
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

            // Add to notes
            updatedData["system.notes"] = addToNotes(item.system?.notes || "", "Short Barrel");

            return updatedData;
        },
        remove: (item) => {
            // Restore the original range from cached data
            const originalRange = item.flags?.vjpmacros?.cachedData?.originalRange || "";

            const updatedData = {
                "system.range": originalRange,
                "flags.vjpmacros.cachedData.-=originalRange": null
            };

            // Remove from notes
            updatedData["system.notes"] = removeFromNotes(item.system?.notes || "", "Short Barrel");

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
                "system.notes": addToNotes(item.system?.notes || "", "Slugs"),
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
                "system.notes": removeFromNotes(item.system?.notes || "", "Slugs"),
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
            const updatedData = {
                "system.notes": addToNotes(item.system?.notes || "", "Smartgun")
            };

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
                "system.notes": removeFromNotes(item.system?.notes || "", "Smartgun"),
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
        apply: (item) => {
            // Add to notes
            const updatedData = {
                "system.notes": addToNotes(item.system?.notes || "", "Suppressor")
            };

            return updatedData;
        },
        remove: (item) => {
            // Remove from notes
            const updatedData = {
                "system.notes": removeFromNotes(item.system?.notes || "", "Suppressor")
            };

            return updatedData;
        },
        // Used to identify if an item is this type of enhancement
        matcher: (item) => item.name.toLowerCase().includes("suppressor")
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

            // update the weapon's notes
            const updatedData = {
                "system.notes": addToNotes(item.system?.notes || "", "UBGL")
            };

            return updatedData;
        },
        remove: async (item) => {
            // check if player already has a ubgl in their inventory
            const actor = item.parent;
            const ubgl = actor.items.find(item => item.name.toLowerCase().includes("ubgl"));
            if(ubgl) {
                ubgl.delete();
            }

            const updatedData = {
                "system.notes": removeFromNotes(item.system?.notes || "", "UBGL")
            };
            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("ubgl")
    }
}

// Helper function to add text to notes
export function addToNotes(currentNotes, textToAdd) {
    if (!currentNotes || currentNotes === "") {
        return textToAdd;
    }

    // Avoid duplication
    if (currentNotes.includes(textToAdd)) {
        return currentNotes;
    }

    return `${currentNotes}, ${textToAdd}`;
}

// Helper function to remove text from notes
export function removeFromNotes(currentNotes, textToRemove) {
    if (!currentNotes) return "";

    const trimmedNotes = currentNotes.trim();
    const trimmedText = textToRemove.trim();

    // If the entire note matches the text to remove, return an empty string.
    if (trimmedNotes === trimmedText) {
        return "";
    }

    // Remove the note if it appears with a preceding comma and space.
    if (trimmedNotes.includes(`, ${trimmedText}`)) {
        return trimmedNotes.replace(`, ${trimmedText}`, "").trim();
    }

    // Remove the note if it appears with a trailing comma and space.
    if (trimmedNotes.includes(`${trimmedText}, `)) {
        return trimmedNotes.replace(`${trimmedText}, `, "").trim();
    }

    return trimmedNotes;
}

// Checks if an item is a valid enhancement and returns its type key if so.
// Returns undefined if the item doesn't match any enhancement.
export function isEnhancementCompatible(enhancmentItem, item) {
    // Determine the enhancement type using the matcher function for each enhancement type.
    const enhancementType = Object.keys(weaponEnhancementsData).find(key => {
        const enhancementData = weaponEnhancementsData[key];
        return typeof enhancementData.matcher === "function" && enhancementData.matcher(enhancmentItem);
    });

    // If no matching enhancement type is found, consider the enhancement incompatible.
    if (!enhancementType) {
        return false;
    }

    // Retrieve the list of compatible weapon types for this enhancement.
    const compatList = weaponEnhancementsData[enhancementType].compatibleWeapons || [];

    // Get the weapon's category (which is now decoupled from this compatibility logic).
    const weaponName = item.system?.category?.toLowerCase() || "";
    const weaponType = Object.keys(animationData)
        .sort((a, b) => b.length - a.length)
        .find(type => weaponName.includes(type)) || undefined;

    // The enhancement is compatible if "all" is in the list or if the weapon type matches one of the allowed types.
    return compatList.includes("all") || (weaponType && compatList.includes(weaponType));
}

// calculates the adjusted notice roll mod based on the given mod value and whether it's a removal
export function calculateNoticeRollModAdjustment(item, mod, isRemoval = false) {
    // If mod is 0, no adjustment is needed
    if (mod === 0) {
        return item.system.additionalStats.noticeRollMod.value || 0;  // Return the existing value
    }

    // Calculate the adjustment value (negative if removing)
    const adjustmentValue = isRemoval ? (mod * -1) : mod;

    // Return the new total value
    return (item.system.additionalStats.noticeRollMod.value || 0) + adjustmentValue;
}