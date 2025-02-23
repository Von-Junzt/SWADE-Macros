import {animationData} from "../../lib/animationData.js";
import {sfxData} from "../../lib/sfxData.js";

/**
 * Play the repeating weapon animation
 * @param br_message
 * @param weaponType
 * @returns {Promise<boolean>}
 */
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
    if (targets.length === 0) {
        console.error("No targets selected.");
        return false;
    }

    // early exit, if the weapon has not enough shots to fire.
    if (originalShots < usedShots) {
        console.error("Not enough shots left in the magazine.");
        return false;
    }

    // Create hit array from dice rolls
    let hitArray = diceRolls.filter(die => die.result_text !== "")
        .map(die => die.result_text !== "Failure");

    // early exit if we have more targets than dice rolls. If so we return
    if (targets.length > diceRolls.length) {
        ui.notifications.error("You have more targets selected than trait dice rolls.");
        console.error("You have more targets selected than trait dice rolls.");
        return false;
    }

    // if we have fewer dice than shots (e.g. Burst Fire), use the first result for all shots
    if (hitArray.length < usedShots) {
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

    // sfx config
    // Check if weapon is silenced through either method
    const isSilenced = item.system?.notes?.toLowerCase().includes("silenced") ||
        (sfxConfig?.isSilenced ?? false)
    // Default fallback sound
    const defaultFireSound = "modules/vjpmacros/assets/sfx/weapons/firearm/ak105_fire_01.wav";
    // Get appropriate sound based on silenced status
    const sfxToPlay = isSilenced
        ? (sfxConfig?.silencedFireSFX || sfxConfig?.fireSFX || defaultFireSound)
        : (sfxConfig?.fireSFX || defaultFireSound);
    const casingDropSfx = sfxConfig.casingDropSFX; // the sound effect for the casing drop
    const casingDropSfxDelay = 400;

    // if we are set now, we can set the animation data
    // let's get the correct rate of fire for the weapon to make it feel faster/slower and calculate the delay
    // to simulate mechanics like pump action, assault cannons that take significantly more time between shots, etc.
    const fireRateDelay = sfxConfig.fireRateDelay; // the delay between shots
    const animationToPlay = animationData[weaponType].animation; // the animation file to play
    const projectileSize = animationData[weaponType].projectileSize; // the size of the projectile. bigger gun, bigger projectile
    const casingAnimationDelay = animationData[weaponType].casingAnimationDelay; // the delay before the casing is ejected, e.g. pump action
    const casingImage = animationData[weaponType].casingImage; // the image of the casing
    const casingSize = animationData[weaponType].casingSize; // the size of the casing

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

            // get all the active user ids
            const activeUserIds = game.users.filter(user => user.active).map(user => user.id);

            // Create sequence for each shot at this target
            for (const isHit of targetHits) {
                    // shot sfx and animation
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
                        .play()

                    // casing animation
                    if(casingImage) {
                        new Sequence()
                           .effect()
                           .delay(casingAnimationDelay)
                           .file(casingImage)
                           .atLocation(tokenCenter)
                           .scale(casingSize)
                           .scaleOut(0.01, 500, {ease: "easeOutCubic"})
                           .duration(200)
                           .moveTowards(ejectPoint)
                           .rotateIn(45, 200)
                           .play()
                   }

                   if (casingDropSfx) {
                       new Sequence()
                           .sound()
                           .file(casingDropSfx)
                           .forUsers(activeUserIds)
                           .delay(casingDropSfxDelay)
                           .play()
                   }
                await new Promise(resolve => setTimeout(resolve, fireRateDelay));
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    // Execute the function
    playAutoWeaponAnimation();

    // print debug info
    if(true) {
        const debugObject = {
            // Message and Roll Data
            usedShots,
            diceRolls,
            hitArray,
            originalShots,
            currentShots,

            // Token and Target Info
            sourceToken: {
                id: sourceToken?.id,
                name: sourceToken?.name,
                position: sourceToken?.position
            },
            targetCount: targets.length,
            targetInfo: targets.map(t => ({
                id: t.id,
                name: t.name,
                position: t.position
            })),

            // Weapon Configuration
            weaponType,
            itemName: item.name,
            isSilenced,

            // Animation Settings
            fireRateDelay,
            projectileSize,
            casingAnimationDelay,
            casingSize,

            // SFX Configuration
            sfxConfig,
            sfxToPlay,
            casingDropSfx,
            casingDropSfxDelay,

            // Distribution Info
            shotsPerTarget,
            extraShots,
            targetHitArrays
        };
        console.table(debugObject);
    }
    return true;
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
export async function playWeaponReloadSfx(item) {
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
    await playSoundForAllUsers(sfxToPlay);
}

async function playSoundForAllUsers(file) {
    // get all the active user ids
    const activeUserIds = game.users.filter(user => user.active).map(user => user.id);
    await new Sequence()
        .sound()
        .file(file)
        .forUsers(activeUserIds)
        .play();
}