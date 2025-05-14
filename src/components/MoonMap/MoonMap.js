import './MoonMap.css';

// Placeholder for areas data - will be loaded via areaService
let currentAreas = []; 
let onAreaClickCallback = null;

// Function to render a single area on the map
function renderArea(area, container) {
    const areaEl = document.createElement('div');
    areaEl.className = 'moon-area';
    areaEl.textContent = area.name;
    areaEl.title = `${area.description}\nRarity: ${area.rarity}\nCost: ${area.cost} TONKEY`;
    areaEl.style.backgroundImage = `url('../../../${area.image}')`; // Relative path from JS to image

    if (area.ownerAddress) {
        areaEl.classList.add('owned');
        areaEl.title += `\nOwned by: ${area.ownerAddress.slice(0,6)}...${area.ownerAddress.slice(-4)}`;
    }

    areaEl.addEventListener('click', () => {
        if (onAreaClickCallback) {
            onAreaClickCallback(area);
        }
    });
    container.appendChild(areaEl);
}

// Main function to initialize and render the moon map
export function initializeMoonMap(containerElement, areasData, areaClickCallback) {
    if (!containerElement) {
        console.error('Moon map container not found!');
        return;
    }
    containerElement.innerHTML = ''; // Clear placeholder or previous content
    currentAreas = areasData;
    onAreaClickCallback = areaClickCallback;

    if (!currentAreas || currentAreas.length === 0) {
        containerElement.innerHTML = '<p>No moon areas available to display.</p>';
        return;
    }

    const mapGrid = document.createElement('div');
    mapGrid.className = 'moon-map-grid';
    currentAreas.forEach(area => renderArea(area, mapGrid));
    containerElement.appendChild(mapGrid);

    console.log('Moon Map initialized with', currentAreas.length, 'areas.');
}

// Function to update the display of a single area (e.g., after purchase)
export function updateAreaDisplay(areaId, newOwnerAddress) {
    const area = currentAreas.find(a => a.id === areaId);
    if (area) {
        area.ownerAddress = newOwnerAddress;
        // Re-render the map or specific area for simplicity for now
        // This is inefficient for large maps; ideally, update only the changed area element.
        const mapContainer = document.getElementById('moon-map-container'); // Assuming this ID is stable
        if (mapContainer) {
             const mapGrid = mapContainer.querySelector('.moon-map-grid');
             if (mapGrid) {
                const areaEl = Array.from(mapGrid.children).find(child => child.textContent === area.name); // simple find
                if (areaEl) {
                    areaEl.classList.add('owned');
                    areaEl.title += `\nOwned by: ${newOwnerAddress.slice(0,6)}...${newOwnerAddress.slice(-4)}`;
                }
             }
        }
    }
} 