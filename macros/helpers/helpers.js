// Play a sound for all users
export async function playSoundForAllUsers(file, delay) {
    // get all the active user ids
    const delayIntervall = delay || 0;
    const activeUserIds = game.users.filter(user => user.active).map(user => user.id);
    await new Sequence()
        .sound()
        .file(file)
        .forUsers(activeUserIds)
        .delay(delayIntervall)
        .play();
}

// Create a chat message for all users
export async function createChatMessage(msgText) {
    ChatMessage.create({
        content: msgText,
        whisper: [], // An empty whisper array means the message is sent to all users
        blind: false // Ensure the message is visible to all
    });
}

// Add this function somewhere in the file, perhaps near the helper functions
export function checkGMPermission() {
    if (!game.user.isGM) {
        console.warn("No GM permission");
        return false;
    }
    return true;
}

// Calculates the range category for a weapon roll. We need to do this in order to activate global range actions on the
// weapon roll. Unfortunately, the brsw selectors don't allow a function call and only check for a value.
export function calculateRangeCategory(shooterToken, targetToken, weaponRangeStr) {
    // Split the range string into an array of numbers.
    // For example, "12/24/48" becomes [12, 24, 48].
    const ranges = weaponRangeStr.split('/').map(n => parseInt(n.trim()));

    // Measure the distance between shooter and target in the same units as the weapon range. Foundry’s
    // canvas.grid.measureDistance returns the distance between two tokens.
    const distance = canvas.grid.measureDistance(shooterToken, targetToken);

    // Compare the distance against each threshold. This assumes that if the weapon only has three thresholds, distances
    // greater than the third threshold are considered extreme (4).
    if (distance <= ranges[0]) return 1;
    else if (distance <= ranges[1]) return 2;
    else if (distance <= ranges[2]) return 3;
    else return 4;
}