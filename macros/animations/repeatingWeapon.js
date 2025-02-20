// the arguments for the macro
const sourceToken = args[1].sourceToken; // the token that rolled the item
const targets = args[1].allTargets; // the targets of the roll
const itemData = args[1].item; // the rolled item
const currentShots = itemData.system?.currentShots; // the current shots in the magazine

// early exit, return if magazine is empty
if(currentShots === 0) {
    return false;
}

// let's get the correct rate of fire for the weapon. This creates a clear timing hierarchy:
// Combat Shotguns: 400ms delay (faster, representing semi-auto combat shotguns)
// Regular Shotguns: 800ms delay (slower, representing pump/break action)
// High ROF weapons (>3): Dynamic delay based on ROF
// Standard weapons: 100ms delay
const rateOfFire = itemData.system?.rof; // the rate of fire for the rolled item
const weaponName = itemData.name.toLowerCase();
const calculatedRepeatsDelay = weaponName.includes("shotgun")
    ? (weaponName.includes("combat") ? 300 : 800)
    : (rateOfFire > 3 ? Math.max(50, 300 - (rateOfFire * 25)) : 100)

// now we need to know, how many shots we are using. Since we are sing swim ammo management, there is a timing problem,
// because swim will edit the chat card and reduce the shots before we can grab them. So we need to add hook on the
// item roll to get for the shots in the magazine before the message is altered. It feels a bit hacky, but it works.
let messageData = {}; // the message data for the latest message
let diceRolls = []; // the roll data for the latest message
const originalShots = await itemData.getFlag('vjp-macros', 'originalShots'); // the original shots count
let usedShots = 0; // the shots used in the roll, initialized to 0

// if we are set now, we can set the animation and sfx data
const animationToPlay = "jb2a.bullet.02.orange" // TODO: add animation for other ammo types (e.g. shotgun slug)
const bulletSize = itemData.name.toLowerCase().includes("shotgun") ? 0.5 : 0.2;
const sfxData = itemData.getFlag('swim', 'config');
const sfxToPlay = sfxData?.isSilenced ? (sfxData.silencedFireSFX || sfxData.fireSFX || "assets/weapons/ak105_fire_01.wav") : (sfxData.fireSFX || "assets/weapons/ak105_fire_01.wav");
const activeUserIds = game.users.filter(user => user.active).map(user => user.id);

// Get the latest message for this item
const latestMessage = game.messages
    .filter(m => m.flags["betterrolls-swade2"]?.br_data?.item_id === itemData.id)
    .sort((a, b) => b.timestamp - a.timestamp)[0] || null;
if (latestMessage) {
    messageData = await new game.brsw.BrCommonCard(latestMessage);
    usedShots = messageData.render_data?.used_shots;
    diceRolls = messageData.trait_roll?.rolls[0]?.dice;
    console.log(messageData);
    console.log(args[1]);
} else {
    console.error('No message found for item:', itemData.id);
    return false;
}

// check if the weapon has enough shots to fire.
if (originalShots < usedShots) {
    console.error("Not enough shots left in the magazine.");
    return false;
}

// check if we have more targets than shots. If so we return
if (targets.length > usedShots) {
    ui.notifications.error("Not enough shots left to hit all targets.");
    console.error("Not enough shots left to hit all targets.");
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
    for(let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const targetHits = targetHitArrays[i];

        // Update source token rotation
        const ray = new Ray(sourceToken.position, target.position);
        const rotation = (ray.angle * 180 / Math.PI) - 90;
        await sourceToken.document.update({rotation: rotation}, {animate: false});

        // Create sequence for each shot at this target
        for (const isHit of targetHits) {
            const sequence = new Sequence();

            new Sequence()
                .sound()
                .file(sfxToPlay)
                .forUsers(activeUserIds)
                .effect()
                .atLocation(sourceToken)
                .stretchTo(target)
                .file(animationToPlay)
                .playbackRate(4)
                .scale({x: 1, y: bulletSize})
                .missed(!isHit)
                .play();

            await new Promise(resolve => setTimeout(resolve, calculatedRepeatsDelay));
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Execute the function
playAutoWeaponAnimation();





