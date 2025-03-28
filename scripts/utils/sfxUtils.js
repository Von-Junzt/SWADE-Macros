import {SFX_DATA} from "../../lib/sfx_data.js";
import {playSoundForAllUsers} from "./generalUtils.js";
import {createChatMessage} from "./generalUtils.js";


// Get the weapon sfx config for the given item
export async function getWeaponSfxConfig(item) {
    // Get the weapon name in lowercase and find a matching key in sfxData if it exists, otherwise use the full weapon name
    const weaponName = item.name.toLowerCase();
    const matchingKey = Object.keys(SFX_DATA).find(key => weaponName.includes(key));
    const weaponSfxID = matchingKey || weaponName;

    // get the sfx data for the weapon
    return SFX_DATA[weaponSfxID];
}


// Play the reload animation for the given item
export async function playWeaponReloadSfx(item) {
    const msgText = `<strong>${item.parent.name}</strong> reloaded his weapon; <strong>${item.name}</strong>.`
    await createChatMessage(msgText);

    const sfxConfig = await getWeaponSfxConfig(item) || item.getFlag('swim', 'config');
    const sfxToPlay = sfxConfig.reloadSFX || "";
    if (sfxToPlay === "") {
        ui.notifications.warn('No reload sound set for this weapon.');
    }
    // Play the sound
    await playSoundForAllUsers(sfxToPlay);
}


// Get a random shell drop sound based on a base sound path
export function getRandomShellDropSound(baseSoundPath) {
    // Extract the base path by removing the _01.wav (or similar) ending
    const basePath = baseSoundPath.replace(/_0\d\.\w+$/, '');
    // Generate random number between 1-3
    const randomSuffix = Math.floor(Math.random() * 3) + 1;
    // Construct the new path with random suffix
    const fileExtension = baseSoundPath.split('.').pop();
    return `${basePath}_0${randomSuffix}.${fileExtension}`;
}


// Gets a random firing sound from either a single sound or array of sounds
export function getRandomFireSound(fireSounds) {
    if (Array.isArray(fireSounds)) {
        const randomIndex = Math.floor(Math.random() * fireSounds.length);
        return fireSounds[randomIndex];
    }
    return fireSounds;
}

// Gets a random ricochet sound
export function getRandomRicochetSound() {
    // Generate random number between 1-10
    const randomNumber = Math.floor(Math.random() * 10) + 1;
    // Format the number with leading zero if needed
    const formattedNumber = randomNumber < 10 ? `0${randomNumber}` : randomNumber;
    // Return the complete path
    return `modules/vjpmacros/assets/sfx/ricochets/ricochet_${formattedNumber}.ogg`;
}
