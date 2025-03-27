import {WEAPON_ENHANCEMENTS} from "../../lib/weapon_enhancements.js";
import {ANIMATION_DATA} from "../../lib/animation_data.js";

// check and return the weapon type of the given item
export function getWeaponType(item) {
    const weaponCategory = item.system?.category?.toLowerCase() || "";
    const weaponType = Object.keys(ANIMATION_DATA)
        .sort((a, b) => b.length - a.length)
        .find(type => weaponCategory.includes(type)) || undefined;
    return weaponType;
}


// Validate if the enhancement can be added to the target item
export function validateEnhancement(enhancementItem, targetItem, existingEnhancements = []) {
    // Check if mounting point is set
    const mountingPoint = enhancementItem.system.category;
    if (!mountingPoint || mountingPoint === "") {
        return {
            isValid: false,
            message: "Unable to add enhancement, mounting point is not set."
        };
    }

    // Determine the enhancement type using the matcher
    const enhancementType = Object.keys(WEAPON_ENHANCEMENTS).find(key => {
        const enhancementData = WEAPON_ENHANCEMENTS[key];
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

// Checks if an item is a valid enhancement and returns its type key if so. Returns undefined if the item doesn't match any enhancement.
export function isEnhancementCompatible(enhancementItem, item) {
    // Determine the enhancement type using the matcher function for each enhancement type.
    const enhancementType = Object.keys(WEAPON_ENHANCEMENTS).find(key => {
        const enhancementData = WEAPON_ENHANCEMENTS[key];
        return typeof enhancementData.matcher === "function" && enhancementData.matcher(enhancementItem);
    });

    // If no matching enhancement type is found, consider the enhancement incompatible.
    if (!enhancementType) {
        return false;
    }

    // Retrieve the list of compatible weapon types for this enhancement.
    const compatList = WEAPON_ENHANCEMENTS[enhancementType].compatibleWeapons || [];

    // Get the weapon's category (which is now decoupled from this compatibility logic).
    const weaponName = item.system?.category?.toLowerCase() || "";
    const weaponType = Object.keys(ANIMATION_DATA)
        .sort((a, b) => b.length - a.length)
        .find(type => weaponName.includes(type)) || undefined;

    // The enhancement is compatible if "all" is in the list or if the weapon type matches one of the allowed types.
    return compatList.includes("all") || (weaponType && compatList.includes(weaponType));
}