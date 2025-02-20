console.warn('VON JUNZT SWADE MACROS LOADED');

// Create a hook that runs before SWIM
Hooks.on('swadeAction', (item, options) => {
    if (item.type === 'weapon') {
        // Store original shots count directly on the item
        item.setFlag('vjp-macros', 'originalShots', item.system.currentShots);
    }
});