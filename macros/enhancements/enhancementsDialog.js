import {weaponEnhancementsData, getEnhancementType, isEnhancementCompatible} from "../../lib/weaponEnhancementsData.js";
import {createChatMessage} from "../helpers/helpers.js";

export class EnhancementsDialog extends foundry.applications.api.DialogV2 {
    constructor(item) {
        // Get the item sheet if it's open
        const itemSheet = Object.values(ui.windows).find(w => w.object?.id === item.id);

        // Create base options
        const options = {
            window: { title: `Enhancements for ${item.name}` },
            content: EnhancementsDialog._getContent(item),
            buttons: [{ label: "Close", callback: () => {} }]
        };

        // Add position if we have an item sheet
        if (itemSheet) {
            // DialogV2 might expect position as a direct property
            options.position = {
                left: itemSheet.position.left + itemSheet.position.width + 10,
                top: itemSheet.position.top
            };
        }

        super(options);
        this.item = item;
    }

    // override _onRender to add drag and drop functionality
    _onRender(...args) {
        super._onRender(...args);
        const html = $(this.element);
        const self = this;

        // Set up Foundry's DragDrop for the drop zone
        new DragDrop({
            dropSelector: '#enhancement-drop-zone',
            callbacks: {
                async drop(event) {
                    event.preventDefault();
                    let data;
                    try {
                        data = JSON.parse(event.dataTransfer.getData('text/plain'));
                    } catch (err) {
                        return ui.notifications.error("Invalid drop data");
                    }
                    if (data?.type !== 'Item') return;
                    const droppedItem = await fromUuid(data.uuid);
                    if (!droppedItem) return;
                    await EnhancementsDialog.addEnhancement(self.item, droppedItem);
                    // Update the dialog's content without reassigning options.content
                    self._updateContent();
                }
            }
        }).bind(html[0]);

        // Bind click handler for "remove enhancement" buttons
        html.find('.remove-enhancement').click(async ev => {
            const li = ev.currentTarget.closest('.enhancement');
            const index = Number(li.dataset.index);
            await EnhancementsDialog.removeEnhancement(self.item, index);
            // Update the dialog's content after removal
            self._updateContent();
        });
    }


    // Update the dialog's dynamic content by replacing the content container in the DOM.

    _updateContent() {
        const newContent = EnhancementsDialog._getContent(this.item);
        // We need to wrap this.element with $() to use jQuery methods
        const container = $(this.element).find('#enhancement-dialog-container');
        if (container.length > 0) {
            container.replaceWith(newContent);
        } else {
            // Fallback: replace the entire content if the container is not found
            $(this.element).find('.dialog-content').html(newContent);
        }
        // Re-bind events after updating the DOM by calling _onRender manually
        this._onRender();
    }


    // Generate the HTML content for the dialog based on current enhancements.

    static _getContent(item) {
        const enhancements = item.getFlag('vjpmacros', 'enhancements') || [];
        const listItems = enhancements.map((e, i) => {
            // Try to get the enhancement description if available
            let description = "No description available";
            if (e.enhancementType && weaponEnhancementsData[e.enhancementType]) {
                description = weaponEnhancementsData[e.enhancementType].description;
            }

            return `
      <li class="enhancement" data-index="${i}" style="display: flex; align-items: center; margin-bottom: 5px;" title="${description}">
        <img src="${e.img}" width="24" height="24" style="margin-right: 8px;" />
        <span style="flex-grow: 1;">${e.name}</span>
        <a class="remove-enhancement" style="cursor: pointer;"><i class="fas fa-trash"></i></a>
      </li>
    `;
        }).join('');

        return `
    <div id="enhancement-dialog-container" class="vjpmacros-weapon-enhancements">
      <h3>Current Enhancements</h3>
      <ul class="enhancements-list" style="list-style: none; padding: 0;">${listItems}</ul>
      <div id="enhancement-drop-zone" style="border: 2px dashed #ccc; padding: 15px; text-align: center; margin-top: 10px; border-radius: 4px;">Drag Items Here to Add</div>
    </div>`;
    }


    // Add a new enhancement to the item, but only if it doesn't already exist.

    static async addEnhancement(item, enhancementItem) {
        const enhancements = item.getFlag('vjpmacros', 'enhancements') || [];

        // Determine the enhancement type
        const enhancementType = getEnhancementType(enhancementItem);

        // Check if this is a valid enhancement type
        if (!enhancementType || !weaponEnhancementsData[enhancementType]) {
            ui.notifications.warn(`${enhancementItem.name} is not a valid enhancement.`);
            return;
        }

        // Check if this enhancement already exists in the list by comparing UUIDs
        const exists = enhancements.some(e => e.uuid === enhancementItem.uuid);

        if (exists) {
            // If enhancement already exists, show a notification and don't add it
            ui.notifications.warn(`${enhancementItem.name} is already attached to this weapon.`);
            return;
        }

        // Check if an enhancement of the same category already exists
        const sameCategory = await Promise.all(enhancements.map(async e => {
            // Fetch the existing enhancement item
            const existingItem = await fromUuid(e.uuid);
            console.log(existingItem);
            console.log(enhancementItem.system.category);
            return existingItem?.system?.category === enhancementItem.system?.category;
        }));



        // Check if the enhancement is compatible with this weapon
        if (enhancementType && !isEnhancementCompatible(enhancementType, item)) {
            ui.notifications.warn(`${enhancementItem.name} is not compatible with ${item.name}.`);
            return;
        }

        if (sameCategory.some(Boolean)) {
            ui.notifications.warn(`An enhancement of category "${enhancementItem.system.category}" is already attached to this weapon.`);
            return;
        }


        // Create the enhancement entry
        const enhancement = {
            name: enhancementItem.name,
            img: enhancementItem.img,
            id: enhancementItem.id,
            uuid: enhancementItem.uuid,
            enhancementType: enhancementType  // Store the enhancement type
        };

        // Add the enhancement to the list
        enhancements.push(enhancement);

        // Apply the enhancement effect if it's a recognized type
        if (enhancementType && weaponEnhancementsData[enhancementType]) {
            const updatedData = weaponEnhancementsData[enhancementType].apply(item, enhancementItem);
            if (Object.keys(updatedData).length > 0) {
                await item.update(updatedData);
            }
        }

        // Play sound effect
        let sfxToPlay = weaponEnhancementsData[enhancementType]?.sfxToPlay || "modules/vjpmacros/assets/sfx/equipment/enhancement_change.ogg";

        // If sfxToPlay is a function, call it with the appropriate parameter:
        if (typeof sfxToPlay === "function") {
            sfxToPlay = await sfxToPlay(item);
        }

        console.log(sfxToPlay);
        new Sequence()
            .sound()
            .file(sfxToPlay)
            .volume(0.8)
            .play();

        // Create a chat message
        const msgText = `<strong>${enhancementItem.name}</strong> has been added to <strong>${item.actor.name}'s</strong> <strong>${item.name}</strong>`;
        createChatMessage(msgText);

        return item.setFlag('vjpmacros', 'enhancements', enhancements);
    }


    // Remove an enhancement by its index.

    static async removeEnhancement(item, index) {
        const enhancements = item.getFlag('vjpmacros', 'enhancements') || [];

        if (index < 0 || index >= enhancements.length) return;

        // Get the enhancement being removed before we remove it
        const enhancement = enhancements[index];

        // Remove the enhancement from the array
        enhancements.splice(index, 1);

        // Revert the enhancement effect if it's a recognized type
        if (enhancement.enhancementType && weaponEnhancementsData[enhancement.enhancementType]) {
            const updatedData = weaponEnhancementsData[enhancement.enhancementType].remove(item, enhancement);
            if (Object.keys(updatedData).length > 0) {
                await item.update(updatedData);
            }
        }

        // play a sound
        let sfxToPlay = weaponEnhancementsData[enhancement.enhancementType]?.sfxToPlay || "modules/vjpmacros/assets/sfx/equipment/enhancement_change.ogg";

        // If sfxToPlay is a function, call it with the stored enhancement data.
        if (typeof sfxToPlay === "function") {
            sfxToPlay = await sfxToPlay(item);
        }

        console.log(sfxToPlay);
        new Sequence()
            .sound()
            .file(sfxToPlay)
            .volume(0.8)
            .play();

        // Create a chat message
        const msgText = `<strong>${enhancement.name}</strong> has been removed from <strong>${item.actor.name}'s</strong> <strong>${item.name}</strong>`;
        createChatMessage(msgText);

        return item.setFlag('vjpmacros', 'enhancements', enhancements);
    }
}