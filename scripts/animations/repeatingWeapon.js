import {ANIMATION_DATA} from "../../lib/animation_data.js";
import {playSoundForAllUsers} from "../utils/generalUtils.js";
import {getWeaponSfxConfig, getRandomShellDropSound, getRandomFireSound, getRandomRicochetSound} from "../utils/sfxUtils.js";
import {calculateOffsetPoint, validateTargetsAndShots} from "../utils/animationUtils.js";


// Play firing sound and animation for the given weapon
export async function repeatingWeapon(br_message, weaponType) {
    // item and roll setup
    const usedShots = br_message.render_data?.used_shots; // the used shots for the roll
    const diceRolls = br_message.trait_roll?.current_roll?.dice // allways use the most recent roll
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

    // Build hitArray from diceRolls preserving the existing order
    const filteredDice = diceRolls.filter(die => die.result_text !== "");
    let hitArray = filteredDice.map(die => die.result_text !== "Failure");

    // Validate targets and shots - early exit if validation fails
    if (!validateTargetsAndShots(targets, filteredDice, usedShots, originalShots, sourceToken)) {
        return false;
    }

    // if we have fewer dice than shots (e.g. Burst Fire), use the first result for all shots
    if (hitArray.length < usedShots) {
        const lastResult = hitArray[hitArray.length - 1] ?? false;
        while (hitArray.length < usedShots) {
            hitArray.push(lastResult);
        }
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
    // Check if weapon is sound suppressed through either method
    const isSuppressed = item.flags?.vjpmacros?.enhancements?.some(enhancement => enhancement?.enhancementType === "suppressor") || item.system?.notes?.toLowerCase().includes("suppressor");
    // Default fallback sound
    const defaultFireSound = "modules/vjpmacros/assets/sfx/weapons/firearm/ak105_fire_01.wav";
    // Get appropriate sound based on suppressed status
    const sfxToPlay = isSuppressed
        ? (sfxConfig?.suppressedFireSFX || sfxConfig?.fireSFX || defaultFireSound)
        : (sfxConfig?.fireSFX || defaultFireSound);
    const casingDropSfx = sfxConfig.casingDropSFX; // the sound effect for the casing drop
    const casingDropSfxDelay = sfxConfig.casingDropSfxDelay || 400; // e.g. lever-action guns need this delay
    const ammoCycleSfx = sfxConfig.ammoCycleSfx;
    const ammoCycleSfxDelay = sfxConfig.ammoCycleSfxDelay;

    // We need to preload the fireSFX because if not the shot delay is not correct between the first two shots
    const preloadSFXArray = [
        ...(Array.isArray(sfxToPlay) ? sfxToPlay : [sfxToPlay]),
        casingDropSfx,
        sfxConfig.emptySFX,
        sfxConfig.lastShotSFX,
        ammoCycleSfx
    ].filter(sound => sound !== undefined && sound !== null && sound !== "");
    await Sequencer.Preloader.preloadForClients(preloadSFXArray);

    // Check if there are any misses in the hitArray
    if (hitArray.includes(false)) {
        // If there are misses, preload all ricochet sounds
        const ricochetSounds = Array.from({length: 10}, (_, i) => {
            const num = i + 1;
            const formattedNum = num < 10 ? `0${num}` : `${num}`;
            return `modules/vjpmacros/assets/sfx/ricochets/ricochet_${formattedNum}.ogg`;
        });

        preloadSFXArray.push(...ricochetSounds);
    }

    await Sequencer.Preloader.preloadForClients(preloadSFXArray);

    // if we are set now, we can set the animation data
    // let's get the correct rate of fire for the weapon to make it feel faster/slower and calculate the delay
    // to simulate mechanics like pump action, assault cannons that take significantly more time between shots, etc.
    const fireRateDelay = sfxConfig.fireRateDelay; // the delay between shots
    const shotAnimation = ANIMATION_DATA[weaponType].animation; // the animation file to play
    const baseProjectileVelocity = ANIMATION_DATA[weaponType].projectileVelocity;
    const projectileVelocity = baseProjectileVelocity * (canvas.grid.size / 64); // Scale projectile velocity based on grid size (optimized for 64px grid)
    const projectileSize = ANIMATION_DATA[weaponType].projectileSize; // the size of the projectile. bigger gun, bigger projectile
    const casingAnimationDelay = ANIMATION_DATA[weaponType].casingAnimationDelay; // the delay before the casing is ejected, e.g. pump action
    const casingImage = ANIMATION_DATA[weaponType].casingImage; // the image of the casing
    const casingSize = ANIMATION_DATA[weaponType].casingSize; // the size of the casing

    // If there are as many usedShots as the hitArray length, play the animation for each target and update the source
    // token rotation, if there are less dice, repeat it for usedShots
    async function playAutoWeaponAnimation() {
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const targetHits = targetHitArrays[i];
            // Update source token rotation
            const ray = new Ray(sourceToken.center, target.center)
            const rotation = (ray.angle * 180 / Math.PI) - 90;
            await sourceToken.document.update({rotation: rotation}, {animate: false});

            // Define how far from the token center the source of the muzzle flash, and the ejection point for casings
            // should be placed
            const muzzleFlashOffsetDistance = canvas.grid.size * 0.4;  // Adjust as needed
            const casingEjectPointOffsetDistance = canvas.grid.size * 0.25;  // Adjust as needed
            const casingOffsetDistance = canvas.grid.size * 2;    // offset distance for shell casing ejection

            // Use ray.angle directly because token art faces right
            const muzzleFlashPoint = calculateOffsetPoint(sourceToken, ray.angle, muzzleFlashOffsetDistance);

            // We want to eject the casings perpendicular to the tokens pointing direction. For this we need to
            // calculate a perpendicular array angle (ray.angle + π/2)
            const perpRayAngle = ray.angle + Math.PI / 2;

            // Compute the casings ejection point based on the token's center
            const casingEjectPoint = calculateOffsetPoint(sourceToken, ray.angle, casingEjectPointOffsetDistance);

            // Compute the casings target point based on the token's center
            const casingTargetPoint = calculateOffsetPoint(sourceToken, perpRayAngle, casingOffsetDistance);

            // get all the active user ids
            const activeUserIds = game.users.filter(user => user.active).map(user => user.id);

            // keep track of the shots fired
            let shotsFired = 0;

            // Create sequence for each shot at this target
            for (const isHit of targetHits) {
                // shot sfx
                playSoundForAllUsers(getRandomFireSound(sfxToPlay));

                // add shotFired
                shotsFired++;

                // play the shot animation
                if(shotAnimation) {
                    let seq = new Sequence();

                    // if the weapon is sound suppressed, don't play the muzzle flash
                    if (!isSuppressed) {
                        seq.effect()
                            .file("modules/vjpmacros/assets/gfx/projectiles/muzzle_flash_2.webp")
                            .atLocation(muzzleFlashPoint)
                            .scale(.5)
                            .rotateTowards(target)
                            .spriteRotation(ray.angle)
                            .playbackRate(30);
                    }

                    // animate projectile
                    seq.effect()
                    .file("modules/vjpmacros/assets/gfx/projectiles/bullet_effect_200.webp")
                    .atLocation(muzzleFlashPoint)
                    .moveTowards(target)
                    .moveSpeed(projectileVelocity)
                    .scale(projectileSize)
                    .missed(!isHit);

                    // play sequence
                    seq.play();
                }

                // if no hit, play random ricochet sfx with a 25% chance
                if(!isHit) {
                    // Generate random number between 0 and 1, if less than 0.25 (25% chance), play ricochet sound
                    if(Math.random() < 0.25) {
                        playSoundForAllUsers(getRandomRicochetSound());
                    }
                }

                // if this is the last shot in the magazine, we test if there is an extra sfx specified for the last shot (e.g. M1 Garand)
                if(originalShots - shotsFired === 0 && sfxConfig.lastShotSFX) {
                    // Wait a small delay to make the last shot sound more natural after the regular shot sound
                    playSoundForAllUsers(sfxConfig.lastShotSFX, 5);
                }

                // if we have a special ammo cycling mechanism, play ammoCycleSfx now
                if(ammoCycleSfx) {
                    playSoundForAllUsers(ammoCycleSfx, ammoCycleSfxDelay);
                }

                // casing animation
                if(casingImage) {
                    new Sequence()
                       .effect()
                       .delay(casingAnimationDelay)
                       .file(casingImage)
                       .atLocation(casingEjectPoint)
                       .scale(casingSize)
                       .scaleOut(0.01, 500, {ease: "easeOutCubic"})
                       .duration(200)
                       .moveTowards(casingTargetPoint)
                       .rotateIn(45, 200)
                       .play()
                }

                // casing Sfx
                if(casingDropSfx) {
                    playSoundForAllUsers(getRandomShellDropSound(casingDropSfx), casingDropSfxDelay);
                }

                // delay between shots
                await new Sequence().wait(fireRateDelay).play();
            }
            // delay between targets
            await new Sequence().wait(500).play();
        }
    }
    // Execute the function
    await playAutoWeaponAnimation();
}