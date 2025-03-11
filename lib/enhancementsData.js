export const enhancementsData = {
    // Extended Magazine: increases ammo capacity by the specified number
    apAmmo: {
        name: "AP Ammunition",
        description: "Increases the AP of a weapon by +1.",
        category: "ammunition",
        apply: (item) => {
            const currentAP = item.system.ap || 0;
            // Create a properly structured update
            const updatedData = {
                "system.ap": currentAP + 1,
                "system.notes": addToNotes(item.system?.notes || "", "AP Ammo"),
                "system.ammo": "Bullets, AP Upgrade"
            };

            // will be called directly and after that the updatewill be applied
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                    ammunition: {
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
                "system.ammo": item.flags?.vjpmacros?.ammunition?.oldAmmo || "",
                "flags.vjpmacros.ammunition.-=oldAmmo": null
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("ap ammunition")
    },
    extendedMag: {
        name: "Extended Magazine",
        description: "Increases ammunition capacity by the specified number of rounds.",
        category: "Magazine",
        apply: (item, enhancementItem) => {
            // Extract the number from the enhancement item name
            const match = enhancementItem.name.match(/\(\+(\d+)\)/);
            const extraShots = match ? parseInt(match[1]) : 5;

            const maxAmmo = item.system.shots || 0;
            const updatedData = {
                "system.shots": maxAmmo + extraShots
            };

            // Add to notes
            updatedData["system.notes"] = addToNotes(item.system?.notes || "", `Extended Magazine (+${extraShots})`);

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
            updatedData["system.notes"] = removeFromNotes(item.system?.notes || "", `Extended Magazine (+${extraShots})`);

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
        apply: (item) => {
            const currentAP = item.system.ap || 0;
            const updatedData = {
                "system.ap": currentAP + 1,
                "system.notes": addToNotes(item.system?.notes || "", "Shotgun Slugs"),
                "system.ammo" : "Shells, Slug"
            };

            // will be called directly and after that the updatewill be applied
            const updatedFlags = foundry.utils.mergeObject(item.flags || {}, {
                vjpmacros: {
                    ammunition: {
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
                "system.notes": removeFromNotes(item.system?.notes || "", "Shotgun Slugs"),
                "system.ammo": item.flags?.vjpmacros?.ammunition?.oldAmmo || "",
                "flags.vjpmacros.ammunition.-=oldAmmo": null
            };

            return updatedData;
        },
        matcher: (item) => item.name.toLowerCase().includes("shotgun slugs")
    },
    suppressor: {
        name: "Suppressor",
        description: "Makes it harder for enemies to spot the firing sound.",
        category: "suppressor",
        apply: (item) => {
            // Add to notes
            const updatedData = {
                "system.notes": addToNotes(item.system?.notes || "", "Silenced")
            };

            return updatedData;
        },
        remove: (item) => {
            // Remove from notes
            const updatedData = {
                "system.notes": removeFromNotes(item.system?.notes || "", "Silenced")
            };

            return updatedData;
        },
        // Used to identify if an item is this type of enhancement
        matcher: (item) => item.name.toLowerCase().includes("suppressor")
    }
}

// Helper function to find the enhancement type from an item
export function getEnhancementType(item) {
    for (const [type, config] of Object.entries(enhancementsData)) {
        if (config.matcher(item)) return type;
    }
    return null;
}

// Helper function to add text to notes
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

// Helper function to remove text from notes
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