/**
 * This script is called by main.js everytime a token is updated. It checks for the levelsautocover.ducking
 * flag and applied a predefined effect accordingly. I should maybe add a check for CPR sidebar effects so
 * you can define your own ducking effect keys.
 */

export async function toggleDuckingEffect(tokenDocument) {
    if (!game.user.isGM) return;
    const token = canvas.tokens.get(tokenDocument.id);

    if (!game.modules.get('succ')?.active) {
        ui.notifications.error("You cannot execute this macro unless the SUCC module is active.");
        return;
    }
    game.succ.toggleCondition('SKDpVPMxzY2vCeEJ', token);
}