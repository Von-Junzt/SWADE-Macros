import {playSoundForAllUsers} from "../utils/generalUtils.js";

// Script to toggle foldable stock state
export async function toggleFoldableStock(actor, item) {
    // Check if the item has a foldable stock
    if (!item || item.type !== "weapon" || item.flags.vjpmacros?.foldableStock !== 1) {
        ui.notifications.warn("This weapon doesn't have a foldable stock.");
        return;
    }

    // Check if the weapon is readied
    if (!item.isReadied) {
        ui.notifications.warn("You need to ready this weapon before adjusting its stock.");
        return;
    }

    // Get current stock state
    const isStockFolded = item.flags.vjpmacros?.stockFolded === 1;

    if (isStockFolded) {
        // Set stock as extended
        await item.setFlag("vjpmacros", "stockFolded", 0);

        // toggle effect
        game.succ.toggleCondition('jq9vC1IPe2usYnYL', canvas.tokens.controlled);

        // Play extending sound
        await playSoundForAllUsers("modules/vjpmacros/assets/sfx/weapons_general/foldable_stock.ogg");

        ui.notifications.info(`Extended stock on ${item.name}.`);
    } else {
        // Set stock as folded
        await item.setFlag("vjpmacros", "stockFolded", 1);

        // toggle effect
        game.succ.toggleCondition('jq9vC1IPe2usYnYL', canvas.tokens.controlled);

        // Play folding sound
        await playSoundForAllUsers("modules/vjpmacros/assets/sfx/weapons_general/foldable_stock.ogg");

        ui.notifications.info(`Folded stock on ${item.name}. Handling reduced by 1.`);
    }
}
