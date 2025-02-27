/**
 * Play a sound for all users
 * @param file
 * @param delay
 * @returns {Promise<void>}
 */
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

/**
 * Create a chat message for all users
 * @param msgText string
 * @returns {Promise<void>}
 */
export async function createChatMessage(msgText) {
    ChatMessage.create({
        content: msgText,
        whisper: [], // An empty whisper array means the message is sent to all users
        blind: false // Ensure the message is visible to all
    });
}