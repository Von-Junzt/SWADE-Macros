const sourceToken = args[1].sourceToken; // the token that rolled the item
const targets = args[1].allTargets; // the targets of the roll
const itemData = args[1].item; // the rolled item
const currentShots = itemData.system?.currentShots; // the current shots in the magazine
const rateOfFire = itemData.system?.rof; // the rate of fire for the rolled item
const calculatedRepeatsDelay = rateOfFire > 3 ? Math.max(50, 200 - (rateOfFire * 25)) : 100;
let messageData = {}; // the message data for the latest message
let diceRolls = []; // the roll data for the latest message
let originalShots = 0; // the original shots count
let usedShots = 0; // the shots used in the roll, initialized to 0

// Return if magazine is empty
if(currentShots === 0) {
    return;
}

// Get the latest message for this item
const latestMessage = game.messages
    .filter(m => m.flags["betterrolls-swade2"]?.br_data?.item_id === itemData.id)
    .sort((a, b) => b.timestamp - a.timestamp)[0] || null;
if (latestMessage) {
    messageData = await new game.brsw.BrCommonCard(latestMessage);
    usedShots = messageData.render_data?.used_shots;
    originalShots = messageData.render_data?.original_shots;
    diceRolls = messageData.trait_roll?.rolls[0]?.dice;
    console.log(messageData);
    console.log(args[1]);
} else {
    console.error('No message found for item:', itemData.id);
    return;
}

// check if the weapon has enough shots to fire
// if using swim ammo management, there is a timing problem, because swim will edit the chat card and reduce the shots
// before we can grab them. So we need to add a check for the shots in the magazine before we get the message
if (currentShots < usedShots) {
    console.error("Not enough shots left in the magazine.");
    return;
}
/// First create the hit array as before
const hitArray = diceRolls.filter(die => die.result_text !== "")
    .map(die => die.result_text !== "Failure");

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

// Then in your animation loop, use it like this:
// Wrap the entire macro in an async function
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
            new Sequence()
                .effect()
                .atLocation(sourceToken)
                .stretchTo(target)
                .file("jb2a.bullet.02.orange")
                .playbackRate(4)
                .scale({x: 1, y: 0.2})
                .missed(!isHit)
                .play();

            await new Promise(resolve => setTimeout(resolve, calculatedRepeatsDelay));
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Execute the function
playAutoWeaponAnimation();
// TODO: Check for hit and use .missed(true)
// TODO: Add bullet casings




