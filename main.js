Hooks.once('init', function() {
    console.warn('VON JUNZT SWADE MACROS LOADED');
});

Hooks.on('BRSW-RollItem', async (br_message, html) => {
    const item = br_message.item;
    if (item.type === 'weapon') {
        await item.setFlag('vjp-macros', 'originalShots', item.system.currentShots);
    }
});
