import {createChatMessage, playSoundForAllUsers} from "../helpers/helpers.js";

export async function backlashCheck(dice, actor) {

    // check if any dice with label === "Trait Die" have raw_total === 1
    const backlashRolls = dice.filter(d => d.label === "Trait Die" && d.raw_total === 1);
    if (backlashRolls.length > 0) {
        // add one level to the actors fatigue value
        await actor.update({
            'system.fatigue.value': actor.system.fatigue.value + 1
        });
        // create a new chat message
        const msgText = `<strong>${actor.name}</strong> has rolled a natural <strong>1</strong> on his trait die and gains <strong>1 level</strong> of <strong>backlash</strong>`;
        await createChatMessage(msgText);

        // play the backlash sound
        playSoundForAllUsers("modules/vjpmacros/assets/sfx/spells/Debuff/spell-decrescendo-7.mp3", 1000);

        // add incapacitated status
        if(actor.system.fatigue.max < actor.system.fatigue.value){
            if (!game.modules.get('succ')?.active) {
                ui.notifications.error("You cannot execute this macro unless the SUCC module is active.");
                return;
            }
            game.succ.toggleCondition('incapacitated', actor.token);
        }



    }
}