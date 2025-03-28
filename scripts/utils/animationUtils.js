// Calculates the offset point for a given ray angle and distance from a token.
export function calculateOffsetPoint(token, rayAngle, offsetDistance) {
    return {
        x: token.center.x + Math.cos(rayAngle) * offsetDistance,
        y: token.center.y + Math.sin(rayAngle) * offsetDistance,
    };
}


// Validate targets and shots for weapon animations
export function validateTargetsAndShots(targets, filteredDice, usedShots, originalShots, sourceToken) {
    if (targets.some(target => target === sourceToken)) {
        ui.notifications.error("You can't target yourself.");
        console.error("You can't target yourself.");
        return false;
    }
    if (targets.length === 0) {
        ui.notifications.error("No targets selected.");
        console.error("No targets selected.");
        return false;
    }

    if (originalShots < usedShots) {
        console.error("Not enough shots left in the magazine.");
        return false;
    }

    if (targets.length > filteredDice.length) {
        ui.notifications.error("You have more targets selected than trait dice rolls.");
        console.error("You have more targets selected than trait dice rolls.");
        return false;
    }

    return true;
}