Hooks.once('init', function() {
    console.warn('VON JUNZT SWADE MACROS LOADED');
});

Hooks.on('BRSW-RollItem', async (br_message, html) => {
    const item = br_message.item;
    if (item.type === 'weapon') {
        await item.setFlag('vjp-macros', 'originalShots', item.system.currentShots);
    }
});

Hooks.on('swadeReloadWeapon', async (item, reloaded) => {
    ui.notifications.info(item?.parent?.name + 'reloaded his weapon: ' + item.name);
    console.log(item);
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