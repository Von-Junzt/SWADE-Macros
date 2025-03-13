import {animationData} from "./animationData.js";
import {getWeaponSfxConfig} from "../macros/animations/repeatingWeapon.js";

/**
 * Object containing the data for weapon enhancements.
 */
export const enhancementsData = {
    // Extended Magazine: increases ammo capacity by the specified number
    apAmmo: {
        name: "AP Ammunition",
        description: "Increases the AP of a weapon by +1.",
        category: "ammunition",
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
                        oldAmmo: item.system.ammo
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
                "system.ammo": item.flags?.vjpmacros?.cachedData?.oldAmmo || "",
                "flags.vjpmacros.cacheValues.-=oldAmmo": null
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("ap ammunition")
    },
    extendedMag: {
        name: "Extended Magazine",
        description: "Increases ammunition capacity by the specified number of rounds.",
        category: "Magazine",
        compatibleWeapons:["all"],
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
    slugs: {
        name: "Shotgun Slugs",
        description: "Increases the AP of a weapon by +1.",
        category: "ammunition",
        compatibleWeapons: ["shotgun", "combat shotgun"],
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
                        oldAmmo: item.system.ammo,
                        oldTraitMod: currentTraitMod,
                        oldActions: cachedActions
                    }
                }
            });
            updatedData.flags = updatedFlags;

            return updatedData;
        },
        remove: (item) => {
            // Retrieve cached values stored during the apply phase.
            const cached = item.flags?.vjpmacros?.cachedData || {};
            const oldAmmo = cached.oldAmmo || "";
            const oldTraitMod = cached.oldTraitMod || "0";
            const oldActions = cached.oldActions || {};

            // Current AP after the enhancement was applied.
            const currentAP = item.system.ap || 0;

            // Build the update object to revert the changes:
            //  - Subtract the enhancement's AP bonus.
            //  - Remove the item damage.
            //  - Restore the original trait modifier.
            //  - Remove the "Shotgun Slugs" note.
            //  - Restore the original ammo.
            //  - Restore the original actions.
            const updatedData = {
                "system.ap": currentAP - 1,
                "system.damage": "",
                "system.actions.traitMod": oldTraitMod,
                "system.notes": removeFromNotes(item.system?.notes || "", "Slugs"),
                "system.ammo": oldAmmo,
                "system.actions": oldActions
            };

            // Remove the cached values from the flags.
            updatedData["flags.vjpmacros.cachedData"] = null;

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("shotgun slugs")
    },
    suppressor: {
        name: "Suppressor",
        description: "Makes it harder for enemies to spot the firing sound.",
        category: "suppressor",
        compatibleWeapons: ["all"],
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
    }
}

/**
 * Get the enhancement type for a given item.
 * @param item
 * @returns {null|string}
 */
export function getEnhancementType(item) {
    for (const [type, config] of Object.entries(enhancementsData)) {
        if (config.matcher(item)) return type;
    }
    return null;
}

/**
 * Helper function to add text to notes
 * @param currentNotes
 * @param textToAdd
 * @returns {*|string}
 */
function addToNotes(currentNotes, textToAdd) {
    if (!currentNotes || currentNotes === "") {
        return textToAdd;
    }

    // Avoid duplication
    if (currentNotes.includes(textToAdd)) {
        return currentNotes;
    }

    return `${currentNotes}, ${textToAdd}`;
}

/**
 * Helper function to remove text from notes
 */
function removeFromNotes(currentNotes, textToRemove) {
    if (!currentNotes) return "";

    if (currentNotes === textToRemove) {
        return "";
    }

    if (currentNotes.includes(`, ${textToRemove}`)) {
        return currentNotes.replace(`, ${textToRemove}`, "");
    }

    if (currentNotes.includes(`${textToRemove}, `)) {
        return currentNotes.replace(`${textToRemove}, `, "");
    }

    return currentNotes;
}

/**
 * Checks if an enhancement is compatible with a weapon.
 * @param enhancementType
 * @param item
 * @returns {boolean}
 */
export function isEnhancementCompatible(enhancementType, item) {
    // Get the weapon type using the same logic as in main.js
    const weaponName = item.system?.category.toLowerCase();
    const weaponType = Object.keys(animationData)
        .sort((a, b) => b.length - a.length)
        .find(type => weaponName.includes(type)) || undefined;

    // Check compatibility
    const compatList = enhancementsData[enhancementType]?.compatibleWeapons || [];
    return compatList.includes("all") || compatList.includes(weaponType);
}