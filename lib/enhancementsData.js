export const enhancementsData = {
    // Extended Magazine: increases ammo capacity by the specified number
    extendedMag: {
        name: "Extended Magazine",
        description: "Increases ammunition capacity by the specified number of rounds.",
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
            return /extended mag\s*\(\+\d+\)/i.test(item.name.toLowerCase());
        }
    },
    suppressor: {
        name: "Suppressor",
        description: "Makes it harder for enemies to spot the firing sound.",
        apply: (item) => {
            const notes = item.system?.notes;
            const updatedData = (notes === "") ? {"system.notes": "Silenced"} : {"system.notes": notes + ", Silenced"};

            return updatedData;
        },
        remove: (item) => {
            const notes = item.system?.notes || "";
            let updatedData = {};

            if (notes.includes(", Silenced")) {
                updatedData = {"system.notes": notes.replace(", Silenced", "")};
            } else if (notes === "Silenced") {
                updatedData = {"system.notes": ""};
            } else if (notes.includes("Silenced, ")) {
                updatedData = {"system.notes": notes.replace("Silenced, ", "")};
            }

            return updatedData;
        },
        // Used to identify if an item is this type of enhancement
        matcher: (item) => item.name.toLowerCase().includes("suppressor")
    },
}

// Helper function to find the enhancement type from an item
export function getEnhancementType(item) {
    for (const [type, config] of Object.entries(enhancementsData)) {
        if (config.matcher(item)) return type;
    }
    return null;
}