// If this is a weapon and it has a deployed bipod, temporarily remove the minStr requirement.
const bipodWeapons = actor.items.filter(i => i.flags.vjpmacros?.bipod === 1 && i.isReadied);
const bipodActive = actor.items.some(i => i.flags.vjpmacros?.bipodActive === 1);

bipodWeapons.forEach(async (item) => {
    if (item.type === "weapon") {
        const bipodActive = await game.vjpmacros.helpers.checkBipodStatus(item);
        if (bipodActive) {
            const originalMinStr = item.system.minStr;
            if (originalMinStr) {
                await item.update({
                    "system.minStr": "",
                    "flags.vjpmacros.cachedData.originalMinStr": originalMinStr
                });
            }
        } else {
            const originalMinStr = item.getFlag("vjpmacros", "cachedData.originalMinStr");
            if (originalMinStr) {
                await item.update({
                    "system.minStr": originalMinStr,
                    "flags.vjpmacros.cachedData.originalMinStr-=": null
                });
            }
        }
        item.setFlag("vjpmacros", "bipodActive", bipodActive ? 1 : 0);
    }
});


await new Sequence()
    .sound()
    .file("modules/vjpmacros/assets/sfx/weapons_general/bipod_unfold.ogg")
    .volume(.5)
    .play()