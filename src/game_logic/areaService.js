// src/game_logic/areaService.js
import moonAreasDataFromFile from '../data/moonAreas.json'; // Static import

// This will hold the state of moon areas.
let moonAreasData = [];

/**
 * Loads area data. Now uses a static import for reliability.
 * The function remains async to maintain a consistent API, though it behaves synchronously.
 */
export async function loadAreas() {
    try {
        moonAreasData = moonAreasDataFromFile;
        // Ensure that the imported data is an array
        if (!Array.isArray(moonAreasData)) {
            console.warn(
                'Statically imported moonAreas.json data is not an array. Defaulting to empty array. Data received:',
                moonAreasDataFromFile
            );
            moonAreasData = [];
        }
        console.log('Moon areas loaded via static import:', moonAreasData);
        return moonAreasData;
    } catch (error) {
        // This catch is less likely to be hit with static imports handled by Parcel,
        // as build would likely fail if JSON is malformed.
        console.error('Unexpected error processing statically imported moon areas:', error);
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

// We call loadAreas() from App.js to control initialization timing. 