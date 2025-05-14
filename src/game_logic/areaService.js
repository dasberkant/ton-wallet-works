// src/game_logic/areaService.js

// This will hold the state of moon areas, potentially fetched from a DB or JSON.
let moonAreasData = [];

/**
 * Loads area data. For now, it imports directly from the JSON file.
 * In the future, this could fetch from a backend API.
 */
export async function loadAreas() {
    try {
        // Dynamically import the JSON data
        const areasModule = await import('../data/moonAreas.json');
        moonAreasData = areasModule.default; // JSON modules are often imported under `default`
        console.log('Moon areas loaded:', moonAreasData);
        return moonAreasData;
    } catch (error) {
        console.error('Error loading moon areas:', error);
        moonAreasData = []; // Fallback to empty array on error
        return [];
    }
}

/**
 * Gets all loaded moon areas.
 */
export function getAllAreas() {
    return moonAreasData;
}

/**
 * Gets a specific area by its ID.
 * @param {string} areaId The ID of the area.
 * @returns {object | undefined} The area object or undefined if not found.
 */
export function getAreaById(areaId) {
    return moonAreasData.find(area => area.id === areaId);
}

/**
 * Updates the owner of an area.
 * This is a local update for now. Backend integration would be needed for persistence.
 * @param {string} areaId The ID of the area to update.
 * @param {string} ownerAddress The new owner's address.
 */
export function updateAreaOwner(areaId, ownerAddress) {
    const area = getAreaById(areaId);
    if (area) {
        area.ownerAddress = ownerAddress;
        console.log(`Area ${areaId} owner updated to ${ownerAddress}`);
        // Here you might also trigger an update to a backend database.
        return true;
    } 
    console.warn(`Area ${areaId} not found for ownership update.`);
    return false;
}

// Initialize by loading areas when the service is imported/used.
// loadAreas(); // Or call this from App.js to control timing 