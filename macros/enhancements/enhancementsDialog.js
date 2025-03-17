import {weaponEnhancementsData, isEnhancementCompatible, calculateNoticeRollModAdjustment} from "../../lib/weaponEnhancementsData.js";
import {createChatMessage} from "../helpers/helpers.js";

export class EnhancementsDialog extends foundry.applications.api.DialogV2 {
    constructor(item) {
        // Get the item sheet if it's open
        const itemSheet = Object.values(ui.windows).find(w => w.object?.id === item.id);

        // Create base options
        const options = {
            width: 1000,
            classes: ["vjpmacros-enhancements-dialog"],
            window: {
                title: `Enhancements for ${item.name}`
            },
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
        <span style="flex-grow: 1;">
          ${e.name} <em style="font-size: 0.8em; color: #888;">(${e.mountingPoint})</em>
        </span>
        <a class="remove-enhancement" style="margin-left: 15px; cursor: pointer;"><i class="fas fa-trash"></i></a>
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
        // Determine the mounting point from the enhancement item.
        const mountingPoint = enhancementItem.system.category;
        if(!mountingPoint || mountingPoint === "") {
            console.error("Unable to add enhancement, mounting point is not set.");
            return;
        }

        // Determine the enhancement type using the matcher.
        const enhancementType = Object.keys(weaponEnhancementsData).find(key => {
            const enhancementData = weaponEnhancementsData[key];
            return typeof enhancementData.matcher === "function" && enhancementData.matcher(enhancementItem);
        });

        // Check if this enhancement already exists (by UUID).
        if (enhancements.some(e => e.uuid === enhancementItem.uuid)) return;

        // If no valid enhancement type is found, warn and exit.
        if (!enhancementType) {
            ui.notifications.warn(`${enhancementItem.name} is not a recognized enhancement.`);
            return;
        }

        // Check if the enhancement is compatible with the weapon.
        if (!isEnhancementCompatible(enhancementItem, item)) {
            ui.notifications.warn(`${enhancementItem.name} is not compatible with ${item.name} or no valid enhancement.`);
            return;
        }

        // Prevent adding another enhancement if the mounting point is already in use.
        if (enhancements.some(e => e.mountingPoint === mountingPoint)) {
            ui.notifications.warn(`An enhancement for mounting point "${mountingPoint}" is already attached to this weapon.`);
            return;
        }

        // Create the enhancement entry, storing both the computed enhancement type and mounting point.
        const enhancement = {
            name: enhancementItem.name,
            img: enhancementItem.img,
            id: enhancementItem.id,
            uuid: enhancementItem.uuid,
            enhancementType: enhancementType,
            mountingPoint: mountingPoint
        };

        enhancements.push(enhancement);

        // Apply the enhancement effect using the enhancementType.
        if (weaponEnhancementsData[enhancementType]) {
            const updatedData = weaponEnhancementsData[enhancementType].apply(item, enhancementItem);

            // Apply notice roll mod adjustment
            const noticeRollMod = weaponEnhancementsData[enhancementType].noticeRollMod;
            const adjustedNoticeRollMod = calculateNoticeRollModAdjustment(item, noticeRollMod, false);
            console.warn("noticerollmod: ", noticeRollMod);
            if (adjustedNoticeRollMod !== null) {
                updatedData["system.additionalStats.noticeRollMod.value"] = adjustedNoticeRollMod;
            }

            if (Object.keys(updatedData).length > 0) {
                await item.update(updatedData);
            }
        }

        // Play sound effect.
        let sfxToPlay = weaponEnhancementsData[enhancementType]?.sfxToPlay || "modules/vjpmacros/assets/sfx/equipment/enhancement_change.ogg";
        if (typeof sfxToPlay === "function") {
            sfxToPlay = await sfxToPlay(item);
        }
        console.log(sfxToPlay);
        new Sequence()
            .sound()
            .file(sfxToPlay)
            .volume(0.8)
            .play();

        // Create a chat message.
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

            // Apply notice roll mod adjustment
            const noticeRollMod = weaponEnhancementsData[enhancement.enhancementType].noticeRollMod;
            const adjustedNoticeRollMod = calculateNoticeRollModAdjustment(item, noticeRollMod, true);
            if (adjustedNoticeRollMod !== null) {
                updatedData["system.additionalStats.noticeRollMod.value"] = adjustedNoticeRollMod;
            }

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