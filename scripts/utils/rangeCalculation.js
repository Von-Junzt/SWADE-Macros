// calculate the range category based on the shooter token, target token, and weapon range
export async function setRangeCategory(actor, item) {
    if (actor && item?.type === "weapon") {
        const weaponRangeStr = item.system.range;
        const shooterToken = canvas.tokens.placeables.find(t => t.actor === actor);
        const targetToken = game.user.targets.first();

        if (shooterToken && targetToken && weaponRangeStr) {
            const rangeCategory = calculateRangeCategory(shooterToken, targetToken, weaponRangeStr);
            // Await the flag setting to ensure it completes before continuing
            await actor.setFlag("vjpmacros", "rangeCategory", rangeCategory);
            console.log(`Range Category set to: ${rangeCategory}`);
        }
    }
}

// Calculates the range category for a weapon roll. We need to do this in order to activate global range actions on the
// weapon roll. Unfortunately, the brsw selectors don't allow a function call and only check for a value.
export function calculateRangeCategory(shooterToken, targetToken, weaponRangeStr) {
    // Split the range string into an array of numbers.
    // For example, "12/24/48" becomes [12, 24, 48].
    const ranges = weaponRangeStr.split('/').map(n => parseInt(n.trim()));

    // Measure the distance between shooter and target in the same units as the weapon range. Foundry’s
    // canvas.grid.measureDistance returns the distance between two tokens.
    const distance = canvas.grid.measureDistance(shooterToken, targetToken); // TODO: measureDistance is deprecated

    // Compare the distance against each threshold. This assumes that if the weapon only has three thresholds, distances
    // greater than the third threshold are considered extreme (4).
    if (distance <= ranges[0]) return 1;
    else if (distance <= ranges[1]) return 2;
    else if (distance <= ranges[2]) return 3;
    else return 4;
}