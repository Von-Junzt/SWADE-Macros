// Helper function to add text to notes
export function addToNotes(currentNotes, textToAdd) {
    if (!currentNotes || currentNotes === "") {
        return textToAdd;
    }

    // Avoid duplication
    if (currentNotes.includes(textToAdd)) {
        return currentNotes;
    }

    return `${currentNotes}, ${textToAdd}`;
}

// Helper function to remove text from notes
export function removeFromNotes(currentNotes, textToRemove) {
    if (!currentNotes) return "";

    const trimmedNotes = currentNotes.trim();
    const trimmedText = textToRemove.trim();

    // If the entire note matches the text to remove, return an empty string.
    if (trimmedNotes === trimmedText) {
        return "";
    }

    // Remove the note if it appears with a preceding comma and space.
    if (trimmedNotes.includes(`, ${trimmedText}`)) {
        return trimmedNotes.replace(`, ${trimmedText}`, "").trim();
    }

    // Remove the note if it appears with a trailing comma and space.
    if (trimmedNotes.includes(`${trimmedText}, `)) {
        return trimmedNotes.replace(`${trimmedText}, `, "").trim();
    }

    return trimmedNotes;
}

// Update the notice roll mod notes in the item's system.additionalStats.notes
export function updateNoticeModNotes(currentNotes, totalMod) {
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