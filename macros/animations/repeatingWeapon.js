import {animationData} from "../../lib/animationData.js";
import {sfxData} from "../../lib/sfxData.js";

export async function repeatingWeapon(br_message, weaponType) {

    // item and roll setup
    const usedShots = br_message.render_data?.used_shots; // the used shots for the roll
    const diceRolls = br_message.trait_roll?.rolls[0]?.dice; // how many dice rolls we have
    const sourceToken = br_message.token; // the token that rolled the item
    const targets = Array.from(game.user.targets); // the targets of the roll
    const item = br_message.item; // the rolled item
    const currentShots = item.system?.currentShots; // the current shots in the magazine
    // now we need to know, how many shots are left in the magazine. Since we are sing swim ammo management, there is a
    // timing problem, because swim will edit the chat card and reduce the shots before we can grab them. So we added a
    // hook on the  item roll to save the original shots in the magazine as item flag, before the message is altered.
    // It feels a bit hacky, but it works. Maybe I should not use the swim ammo management anymore. We will see.
    const originalShots = await item.getFlag('vjpmacros', 'originalShots'); // the original shots count

    // first get the sfx config for the weapon.
    const sfxConfig = await getWeaponSfxConfig(item) || item.getFlag('swim', 'config');

    // early exit, return if magazine is empty, play sound
    if (currentShots === 0) {
        await playSoundForAllUsers(sfxConfig.emptySFX);
        return false;
    }

    // early exit, if no targets, return
    if (targets === 0) {
        return false;
    }

    // check if the weapon has enough shots to fire.
    if (originalShots < usedShots) {
        console.error("Not enough shots left in the magazine.");
        return false;
    }

    // check if we have more targets than shots. If so we return
    if (targets.length > usedShots) {
        ui.notifications.error("You have more targets selected than shot dice to roll.");
        console.error("You have more targets selected than shot dice to roll.");
        return false;
    }

    // if we are set now, we can set the animation and sfx data
    // let's get the correct rate of fire for the weapon to make it feel faster/slower and calculate the delay
    // to simulate mechanics like pump action, assault cannons that take significantly more time between shots, etc.
    const rateOfFire = item.system?.rof;
    const fireRateDelay = animationData[weaponType].fireRateDelay(rateOfFire);
    const animationToPlay = animationData[weaponType].animation; // the animation file to play
    const projectileSize = animationData[weaponType].projectileSize; // the size of the projectile. bigger gun, bigger projectile
    const casingDelay = animationData[weaponType].casingDelay; // the delay before the casing is ejected, e.g. pump action
    const casingImage = animationData[weaponType].casingImage; // the image of the casing
    const casingSize = animationData[weaponType].casingSize; // the size of the casing

    // Check if weapon is silenced through either method
    const isSilenced = item.system.notes.toLowerCase().includes("silenced") ||
        sfxConfig.isSilenced;
    // Default fallback sound
    const defaultFireSound = "modules/vjpmacros/assets/sfx/weapons/ak105_fire_01.wav";
    // Get appropriate sound based on silenced status
    const sfxToPlay = isSilenced
        ? (sfxConfig.silencedFireSFX || sfxConfig.fireSFX || defaultFireSound)
        : (sfxConfig.fireSFX || defaultFireSound);

    // Create hit array from dice rolls
    let hitArray = diceRolls.filter(die => die.result_text !== "")
        .map(die => die.result_text !== "Failure");

    // If we have fewer dice than shots (e.g. Burst Fire), use the first result for all shots
    if (diceRolls.length < usedShots) {
        const singleResult = hitArray[0];
        hitArray = new Array(usedShots).fill(singleResult);
    }

    // Calculate shots per target
    const shotsPerTarget = Math.floor(usedShots / targets.length);
    const extraShots = usedShots % targets.length;

    // Create arrays of hit results for each target
    const targetHitArrays = targets.map((_, index) => {
        const start = index * shotsPerTarget;
        const extra = index < extraShots ? 1 : 0;
        const end = start + shotsPerTarget + extra;
        return hitArray.slice(start, end);
    });

    // If there are as many usedShots as the hitArray length, play the animation for each target and update the source
    // token rotation, if there are less dice, repeat it for usedShots
    async function playAutoWeaponAnimation() {
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const targetHits = targetHitArrays[i];

            // Update source token rotation
            const ray = new Ray(sourceToken.position, target.position);
            const rotation = (ray.angle * 180 / Math.PI) - 90;
            await sourceToken.document.update({rotation: rotation}, {animate: false});

            // Shell casing effect
            // Calculate token center coordinates (adjust if your token dimensions are different)
            const tokenCenter = {
                x: sourceToken.x + sourceToken.width / 2,
                y: sourceToken.y + sourceToken.height / 2,
            };

            // Adjust this value to change the distance of the eject point from the token's center
            const offsetDistance = canvas.grid.size * 2;

            // Calculate the perpendicular angle (ray.angle + π/2)
            const perpRay = ray.angle + Math.PI / 2;

            // Compute the eject point based on the token's center
            const ejectPoint = {
                x: tokenCenter.x + Math.cos(perpRay) * offsetDistance,
                y: tokenCenter.y + Math.sin(perpRay) * offsetDistance,
            };

            // Create sequence for each shot at this target
            for (const isHit of targetHits) {
                   // shot animation
                   new Sequence()
                        .sound()
                        .file(sfxToPlay)
                        .forUsers(activeUserIds)
                        .effect()
                        .atLocation(sourceToken)
                        .stretchTo(target)
                        .file(animationToPlay)
                        .playbackRate(4)
                        .scale({x: 1, y: projectileSize})
                        .missed(!isHit)
                        .play(),

                    // casing animation
                   casingImage ? new Sequence()
                        .effect()
                        .delay(casingDelay)
                        .file(casingImage)
                        .atLocation(tokenCenter)
                        .scale(casingSize)
                        .scaleOut(0.01, 500, {ease: "easeOutCubic"})
                        .duration(200)
                        .moveTowards(ejectPoint)
                        .rotateIn(90, 200)
                        .play() : Promise.resolve()

                await new Promise(resolve => setTimeout(resolve, fireRateDelay));
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    // Execute the function
    playAutoWeaponAnimation();
}

/**
 * Get the weapon sfx config for the given item
 * @param item
 * @returns {Promise<*>}
 */
async function getWeaponSfxConfig(item) {
    // Get the weapon name in lowercase and find a matching key in sfxData if it exists, otherwise use the full weapon name
    const weaponName = item.name.toLowerCase();
    const matchingKey = Object.keys(sfxData).find(key => weaponName.includes(key));
    const weaponSfxID = matchingKey || weaponName;

    // get the sfx data for the weapon
    return sfxData[weaponSfxID];
}

/**
 * Play the reload animation for the given item
 * @param item
 * @returns {Promise<void>}
 */
export async function reloadWeapon(item) {
    ChatMessage.create({
        content: `<strong>${item.parent.name}</strong> reloaded his weapon; <strong>${item.name}</strong>.`,
        whisper: [], // An empty whisper array means the message is sent to all users
        blind: false // Ensure the message is visible to all
    });

    const sfxConfig = await getWeaponSfxConfig(item)|| item.getFlag('swim', 'config');
    const sfxToPlay = sfxConfig.reloadSFX || "";
    if (sfxToPlay === "") {
        ui.notifications.warn('No reload sound set for this weapon.');
    }
    // Play the sound
    const activeUserIds = game.users.filter(user => user.active).map(user => user.id);
    await new Sequence()
        .sound()
        .file(sfxToPlay)
        .forUsers(activeUserIds)
        .play();
}

async function playSoundForAllUsers(file) {
    const activeUserIds = game.users.filter(user => user.active).map(user => user.id);
    await new Sequence()
        .sound()
        .file(file)
        .forUsers(activeUserIds)
        .play();
}