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

// Helper function to update item flags consistently
export function updateItemFlags(item, cacheData = {}, flagData = {}) {
    // Create the vjpmacros flags structure with feature flags
    const vjpFlags = {
        vjpmacros: {
            ...flagData
        }
    };

    // Add cachedData if there's any to add
    if (Object.keys(cacheData).length > 0) {
        vjpFlags.vjpmacros.cachedData = cacheData;
    }

    // Merge with existing flags
    return foundry.utils.mergeObject(item.flags || {}, vjpFlags);
}