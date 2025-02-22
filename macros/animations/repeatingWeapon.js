import {animationData} from "../../lib/animationData.js";
import {sfxData} from "../../lib/sfxData.js";

export async function repeatingWeapon(br_message, weaponType) {

    // the setup constants for the macro
    const usedShots = br_message.render_data?.used_shots;
    const diceRolls = br_message.trait_roll?.rolls[0]?.dice;
    const sourceToken = br_message.token; // the token that rolled the item
    const targets = Array.from(game.user.targets); // the targets of the roll
    const item = br_message.item; // the rolled item
    const currentShots = item.system?.currentShots; // the current shots in the magazine

    // early exit, return if magazine is empty
    if (currentShots === 0) {
        return false;
    }

    // early exit, if no targets, return
    if (targets === 0) {
        return false;
    }

    // let's get the correct rate of fire for the weapon. This creates a clear timing hierarchy:
    // Combat Shotguns: 400ms delay (faster, representing semi-auto combat shotguns)
    // Regular Shotguns: 800ms delay (slower, representing pump/break action)
    // High ROF weapons (>3): Dynamic delay based on ROF
    // Standard weapons: 100ms delay
    const rateOfFire = item.system?.rof; // the rate of fire for the rolled item
    const fireRateDelay = animationData[weaponType].fireRateDelay(rateOfFire);

    // now we need to know, how many shots we are using. Since we are sing swim ammo management, there is a timing problem,
    // because swim will edit the chat card and reduce the shots before we can grab them. So we need to add hook on the
    // item roll to get for the shots in the magazine before the message is altered. It feels a bit hacky, but it works.
    const originalShots = await item.getFlag('vjpmacros', 'originalShots'); // the original shots count

    // if we are set now, we can set the animation and sfx data
    const animationToPlay = animationData[weaponType].animation;
    const projectileSize = animationData[weaponType].projectileSize;
    const casingDelay = animationData[weaponType].casingDelay;
    const casingImage = animationData[weaponType].casingImage;
    const casingSize = animationData[weaponType].casingSize;

    const sfxConfig = await getWeaponSfxConfig(item) || item.getFlag('swim', 'config');

    // Check if weapon is silenced through either method
    const isSilenced = item.system.notes.toLowerCase().includes("silenced") ||
        sfxConfig.isSilenced;
    // Default fallback sound
    const defaultFireSound = "modules/vjpmacros/assets/sfx/weapons/ak105_fire_01.wav";
    // Get appropriate sound based on silenced status
    const sfxToPlay = isSilenced
        ? (sfxConfig.silencedFireSFX || sfxConfig.fireSFX || defaultFireSound)
        : (sfxConfig.fireSFX || defaultFireSound);
    const activeUserIds = game.users.filter(user => user.active).map(user => user.id);

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
                await Promise.all([
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
                   ]);
                await new Promise(resolve => setTimeout(resolve, fireRateDelay));
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    // Execute the function
    playAutoWeaponAnimation();
}

export async function getWeaponSfxConfig(item) {
    // Get the weapon name in lowercase and find a matching key in sfxData if it exists, otherwise use the full weapon name
    const weaponName = item.name.toLowerCase();
    const matchingKey = Object.keys(sfxData).find(key => weaponName.includes(key));
    const weaponSfxID = matchingKey || weaponName;

    // get the sfx data for the weapon
    return sfxData[weaponSfxID];
}