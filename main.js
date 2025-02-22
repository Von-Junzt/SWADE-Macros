import {animationData} from "./lib/animationData.js";
import {repeatingWeapon} from "./macros/animations/repeatingWeapon.js";

Hooks.once('init', function() {
    console.warn('VON JUNZT SWADE MACROS LOADED');
});

Hooks.once('ready', () => {
    game.vjpmacros = {
        animationData,
    };
});

Hooks.on('BRSW-RollItem', async (br_message, html) => {
    const item = br_message.item;
    if (item.type === 'weapon') {
        // set the original shots count
        await item.setFlag('vjpmacros', 'originalShots', item.system.currentShots);
        // determine weapon type by name
        const weaponName = item.name.toLowerCase();
        const weaponType = Object.keys(animationData)
            .sort((a, b) => b.length - a.length)  // Sort by length descending
            .find(type => weaponName.includes(type)) || "notfound";
        // if we have a valid weapon type, we can play the animation
        if (weaponType !== "notfound") {
            console.warn("Weapon not found in animationData", weaponType);
            await repeatingWeapon(br_message, weaponType);
        }
    }
});

Hooks.on('swadeReloadWeapon', async (item, reloaded) => {
    ChatMessage.create({
        content: `<strong>${item.parent.name}</strong> reloaded his weapon: <strong>${item.name}</strong>`,
        whisper: [], // An empty whisper array means the message is sent to all users
        blind: false // Ensure the message is visible to all
    });
    // Create audio object
    const sfxData = item.getFlag('swim', 'config');
    const sfxToPlay = sfxData.reloadSFX || "";
    if (sfxToPlay === "") {
        ui.notifications.warn('No reload sound set for this weapon.');
    }
    // Play the sound
    const activeUserIds = game.users.filter(user => user.active).map(user => user.id);
    new Sequence()
        .sound()
        .file(sfxToPlay)
        .forUsers(activeUserIds)
        .play();
});