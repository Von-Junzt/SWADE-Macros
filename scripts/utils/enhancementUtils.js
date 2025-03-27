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

// check for active smartlink on actor and weapon
export async function checkForActiveSmartLink(actor, item) {
    // check if actor has a smartlink
    const actorHasSmartlink = _token.actor.items.some(i => i.name.toLowerCase().includes('smartlink'));

    // check if weapon has a smartgun
    // Check if weapon has smartgun enhancement
    // This depends on how enhancements are stored in your system
    const weaponEnhancements = item.getFlag("vjpmacros", "enhancements") || [];
    const weaponHasSmartGun = weaponEnhancements.some(e =>
        e.name.toLowerCase().includes('smartgun'));

    // If both conditions are met, set a flag on the actor
    if (actorHasSmartlink && weaponHasSmartGun) {
        await item.setFlag("vjpmacros", "smartlinkActive", 1);
        return true;
    } else {
        await item.unsetFlag("vjpmacros", "smartlinkActive");
        return false;
    }
}
