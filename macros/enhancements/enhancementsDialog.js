import {weaponEnhancementsData, isEnhancementCompatible, calculateNoticeRollModAdjustment, addToNotes, removeFromNotes} from "../../lib/weaponEnhancementsData.js";
import {createChatMessage, checkGMPermission, playSoundForAllUsers} from "../helpers/helpers.js";

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
            buttons: [{
                label: "Close", callback: () => {
                }
            }]
        };

        // Add position if we have an item sheet
        if (itemSheet) {
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

    // Add a new enhancement to the item
    static async addEnhancement(item, enhancement) {
        // Get the existing enhancements.
        const enhancementsArray = item.getFlag('vjpmacros', 'enhancements') || [];

        const validationResult = this.validateEnhancement(enhancement, item, enhancementsArray);

        if (!validationResult.isValid) {
            ui.notifications.warn(validationResult.message);
            return;
        }

        // Create the enhancement entry, storing both the computed enhancement type and mounting point.
        const enhancementEntry = {
            name: enhancement.name,
            img: enhancement.img,
            id: enhancement.id,
            uuid: enhancement.uuid,
            enhancementType: validationResult.enhancementType,
            mountingPoint: validationResult.mountingPoint
        };

        const enhancementType = validationResult.enhancementType;
        enhancementsArray.push(enhancementEntry);

        // Apply the enhancement effect using the enhancementType.
        if (weaponEnhancementsData[enhancementType]) {
            let updatedData = weaponEnhancementsData[enhancementType].apply(item, enhancement);

            // add enhancement to notes
            if (!updatedData) updatedData = {};
            const currentNotes = item.system?.notes || "";
            updatedData["system.notes"] = addToNotes(currentNotes, weaponEnhancementsData[enhancementType].name);

            // Apply notice roll mod adjustment
            let noticeRollMod = weaponEnhancementsData[enhancementType].noticeRollMod;

            // make shure noticeRollMod programmatically enabled if not already present
            if (!item.system.additionalStats.noticeRollMod) {
                const mergedStats = foundry.utils.mergeObject(item.system.additionalStats || {}, {
                    value: 0, label: "Notice Roll Mod", dtype: "Number"
                });

                // Update the item with the merged stat object
                await item.update({"system.additionalStats.noticeRollMod": mergedStats});
                console.warn("Notice Roll Mod added to item: ", item.name);
            }

            // Calculate and apply the adjusted notice roll mod
            const adjustedNoticeRollMod = calculateNoticeRollModAdjustment(item, noticeRollMod, false);

            // Update the item with the adjusted notice roll mod
            if (adjustedNoticeRollMod !== null) {
                updatedData["system.additionalStats.noticeRollMod.value"] = adjustedNoticeRollMod;
            }

            // Update the items notes with the adjusted notice roll mod
            const originalUpdate = updatedData["system.notes"] || item.system?.notes || "";
            updatedData["system.notes"] = EnhancementsDialog.updateNoticeModNotes(
                originalUpdate,
                adjustedNoticeRollMod
            );

            if (Object.keys(updatedData).length > 0) {
                await item.update(updatedData);
            }
        }

        // Play sound effect.
        let sfxToPlay = weaponEnhancementsData[enhancementType]?.sfxToPlay || "modules/vjpmacros/assets/sfx/equipment/enhancement_change.ogg";

        // if sfxToPlay is a function, call it to get the actual sound file path
        if (typeof sfxToPlay === "function") {
            sfxToPlay = await sfxToPlay(item);
        }

        await playSoundForAllUsers(sfxToPlay);

        // Create a chat message.
        const msgText = `<strong>${enhancement.name}</strong> has been added to <strong>${item.actor.name}'s</strong> <strong>${item.name}</strong>`;
        createChatMessage(msgText);

        return item.setFlag('vjpmacros', 'enhancements', enhancementsArray);
    }

    // Remove an enhancement by its index.
    static async removeEnhancement(item, index) {
        // Get the enhancements array from the item's flags
        const enhancements = item.getFlag('vjpmacros', 'enhancements') || [];

        // Check if the index is valid
        if (index < 0 || index >= enhancements.length) return;

        // Get the enhancement being removed before we remove it
        const enhancement = enhancements[index];

        // Exit early if it's a built-in enhancement and user is not GM
        if (enhancement.name.toLowerCase().includes('built-in') && !checkGMPermission()) {
            ui.notifications.warn("You don't have permission to remove built-in enhancements.");
            return false;
        }

        // Remove the enhancement from the array
        enhancements.splice(index, 1);

        // Revert the enhancement effect if it's a recognized type
        if (enhancement.enhancementType && weaponEnhancementsData[enhancement.enhancementType]) {
            let updatedData = weaponEnhancementsData[enhancement.enhancementType].remove(item, enhancement);

            // Remove the enhancement from the item's notes
            if (!updatedData) updatedData = {};
            const currentNotes = item.system?.notes || "";
            updatedData["system.notes"] = removeFromNotes(currentNotes, weaponEnhancementsData[enhancement.enhancementType].name);

            // Apply notice roll mod adjustment
            const noticeRollMod = weaponEnhancementsData[enhancement.enhancementType].noticeRollMod;
            const adjustedNoticeRollMod = calculateNoticeRollModAdjustment(item, noticeRollMod, true);
            if (adjustedNoticeRollMod !== null) {
                updatedData["system.additionalStats.noticeRollMod.value"] = adjustedNoticeRollMod;
            }

            // Update the items notes with the adjusted notice roll mod. Use the updated notes that already have the
            // enhancement text removed
            const originalUpdate = updatedData["system.notes"] || "";
            updatedData["system.notes"] = EnhancementsDialog.updateNoticeModNotes(
                originalUpdate,
                adjustedNoticeRollMod
            );

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

        await playSoundForAllUsers(sfxToPlay);

        // Create a chat message
        const msgText = `<strong>${enhancement.name}</strong> has been removed from <strong>${item.actor.name}'s</strong> <strong>${item.name}</strong>`;
        createChatMessage(msgText);

        return await item.setFlag('vjpmacros', 'enhancements', enhancements);
    }

    // Update the notice roll mod notes in the item's system.additionalStats.notes
    static updateNoticeModNotes(currentNotes, totalMod) {
        // If there are no notes, return an empty string
        if (!currentNotes || currentNotes.trim() === "") {
            return "";
        }

        // Remove any existing notice mod entries using regex
        let updatedNotes = currentNotes.replace(/,?\s*Notice:\s*[-+]?\d+/g, '');

        // Clean up any potential double commas or starting/ending commas
        updatedNotes = updatedNotes.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '');

        // If the totalMod is 0 or null, don't add any notice mod text
        if (totalMod === 0 || totalMod === null) {
            return updatedNotes;
        }

        // Format the notice mod text
        const noticeText = `Notice: ${totalMod}`;

        // If there are no notes left, just return the new notice mod
        if (!updatedNotes || updatedNotes === "") {
            return noticeText;
        }

        // Place the notice mod at the beginning, followed by the rest of the notes
        return `${noticeText}, ${updatedNotes}`;
    }

    // Validate if the enhancement can be added to the target item
    static validateEnhancement(enhancementItem, targetItem, existingEnhancements = []) {
        // Check if mounting point is set
        const mountingPoint = enhancementItem.system.category;
        if (!mountingPoint || mountingPoint === "") {
            return {
                isValid: false,
                message: "Unable to add enhancement, mounting point is not set."
            };
        }

        // Determine the enhancement type using the matcher
        const enhancementType = Object.keys(weaponEnhancementsData).find(key => {
            const enhancementData = weaponEnhancementsData[key];
            return typeof enhancementData.matcher === "function" && enhancementData.matcher(enhancementItem);
        });

        // If no valid enhancement type is found
        if (!enhancementType) {
            return {
                isValid: false,
                message: `${enhancementItem.name} is not a recognized enhancement.`
            };
        }

        // Check if this enhancement already exists in the enhancements list
        if (existingEnhancements.some(e => e.uuid === enhancementItem.uuid)) {
            return {
                isValid: false,
                message: `${enhancementItem.name} is already attached to this weapon.`
            };
        }

        // Check if the enhancement is compatible with the weapon
        if (!isEnhancementCompatible(enhancementItem, targetItem)) {
            return {
                isValid: false,
                message: `${enhancementItem.name} is not compatible with ${targetItem.name} or no valid enhancement.`
            };
        }

        // Prevent adding another enhancement if the mounting point is already in use
        if (existingEnhancements.some(e => e.mountingPoint === mountingPoint)) {
            return {
                isValid: false,
                message: `An enhancement for mounting point "${mountingPoint}" is already attached to this weapon.`
            };
        }

        // All checks passed
        return {
            isValid: true,
            message: "Enhancement is valid",
            enhancementType,
            mountingPoint
        };
    }
}

