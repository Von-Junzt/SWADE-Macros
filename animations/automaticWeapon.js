const itemData = args[1].item; // the rolled item
const sourceToken = args[1].sourceToken; // the token that rolled the item
const targets = args[1].allTargets; // the targets of the roll
const currentShots = itemData.system?.currentShots; // the current shots in the magazine
const rateOfFire = itemData.system?.rof; // the rate of fire for the rolled item
const calculatedRepeatsDelay = rateOfFire > 3 ? Math.max(50, 200 - (rateOfFire * 25)) : 100;
let messageData = {}; // the message data for the latest message
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
    console.log(messageData);
} else {
    console.error('No message found for item:', itemData.id);
    return;
}


// check if the weapon has enough shots to fire
if (currentShots < usedShots) {
    console.error("Not enough shots left in the magazine.");
    return;
}

for (const target of targets) {
    // Update source token rotation
    const ray = new Ray(sourceToken.position, target.position);
    const rotation = (ray.angle * 180 / Math.PI) - 90;
    await sourceToken.document.update({ rotation: rotation }, { animate: false });

    new Sequence()
        .effect()
        .atLocation(sourceToken)
        .stretchTo(target)
        .file("jb2a.bullet.02.orange")
        .playbackRate(4)
        .scale({ x: 1, y: 0.2 })
        .repeats(usedShots, calculatedRepeatsDelay, calculatedRepeatsDelay)
        .play();

    // wait betweeen targets
    await new Promise(resolve => setTimeout(resolve, 500)); // Waits 500ms after all effects
}

// TODO: Check for hit and use .missed(true)
// TODO: Add bullet casings




