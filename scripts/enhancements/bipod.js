import {playSoundForAllUsers} from "../utils/generalUtils.js";

// Script to toggle bipod deployment state
export async function toggleBipod(actor, item) {
    // Check if the item has a bipod
    if (!item || item.type !== "weapon" || item.flags.vjpmacros?.bipod !== 1) {
        ui.notifications.warn("This weapon doesn't have a bipod attachment.");
        return;
    }

    // Check if the weapon is readied
    if (!item.isReadied) {
        ui.notifications.warn("You need to ready this weapon before deploying its bipod.");
        return;
    }

    // Get current bipod state
    const isBipodActive = item.flags.vjpmacros?.bipodActive === 1;

    if (isBipodActive) {
        // FOLDING BIPOD
        // Restore original minimum strength requirement
        const originalMinStr = item.getFlag("vjpmacros", "cachedData.originalMinStr");
        if (originalMinStr) {
            await item.update({
                "system.minStr": originalMinStr,
                "flags.vjpmacros.cachedData.originalMinStr-=": null
            });
        }

        // Set bipod as inactive
        await item.setFlag("vjpmacros", "bipodActive", 0);

        // toggle effect
        game.succ.toggleCondition('XCjZq0EzDeCUUvu8', actor.token);

        // Play folding sound
        await playSoundForAllUsers("modules/vjpmacros/assets/sfx/weapons_general/bipod_unfold.ogg");

        ui.notifications.info(`Folded bipod on ${item.name}.`);
    } else {
        // DEPLOYING BIPOD
        // Store original minimum strength and remove the requirement
        const originalMinStr = item.system.minStr;
        if (originalMinStr) {
            await item.update({
                "system.minStr": "",
                "flags.vjpmacros.cachedData.originalMinStr": originalMinStr
            });
        }

        // Set bipod as active
        await item.setFlag("vjpmacros", "bipodActive", 1);

        // toggle effect
        game.succ.toggleCondition('XCjZq0EzDeCUUvu8', actor.token);

        // Play folding sound
        await playSoundForAllUsers("modules/vjpmacros/assets/sfx/weapons_general/bipod_unfold.ogg");

        ui.notifications.info(`Deployed bipod on ${item.name}.`);
    }
}