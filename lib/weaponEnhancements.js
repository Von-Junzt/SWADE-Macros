export const weaponEnhancements = {
    // Extended Magazine: increases ammo capacity by 5
    extendedMag: {
        name: "Extended Magazine (+5)",
        description: "Increases ammunition capacity by 5 rounds.",
        apply: (item) => {
            const maxAmmo = item.system.shots || 0;
            const updatedData = {
                "system.shots": maxAmmo + 5
            };

            return updatedData;
        },
        remove: (item) => {
            const maxAmmo = item.system.shots || 0;
            const currentAmmo = item.system.currentShots || 0;

            const newMaxAmmo = Math.max(0, maxAmmo - 5);
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
        matcher: (item) => item.name.toLowerCase().includes("extended mag (+5)")
    },
}