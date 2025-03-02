/**
 * This script is called by main.js everytime a token is updated. It checks for the levelsautocover.ducking
 * flag and applied a predefined effect accordingly. I should maybe add a check for CPR sidebar effects so
 * you can define your own ducking effect keys.
 */

export async function toggleDuckingEffect(tokenDocument) {
    if (!game.user.isGM) return;

    const token = canvas.tokens.get(tokenDocument.id);
    const existingDuckingEffect = token.actor.effects.find(e => e.name === "Ducking");
    const existingProneEffect = token.actor.effects.find(e => e.name === "Prone");

    if (token.document.flags?.levelsautocover?.ducking) {
        if (existingProneEffect) {
            ui.notifications.warn("You cannot apply both Ducking and Prone effects at the same time.");
            return;
        }
        if (!existingDuckingEffect) {
            // Batch the updates into a single operation
            if (!game.modules.get('succ')?.active) {
                ui.notifications.error("You cannot execute this macro unless the SUCC module is active.");
                return;
            }
            game.succ.addCondition('SKDpVPMxzY2vCeEJ', token);
        }
    } else {
        if (!game.modules.get('succ')?.active) {
            ui.notifications.error("You cannot execute this macro unless the SUCC module is active.");
            return;
        }
        game.succ.removeCondition('SKDpVPMxzY2vCeEJ', token);
    }
}