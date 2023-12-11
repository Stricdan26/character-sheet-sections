const moduleID = "character-sheet-sections";


Hooks.once('init', () => {
    game.settings.register(moduleID, 'hideEmpty', {
        name: 'Hide Empty Sections',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
    });
});

Hooks.once("ready", () => {
    libWrapper.register(moduleID, "CONFIG.Actor.sheetClasses.character['pf2e.CharacterSheetPF2e'].cls.prototype.getData", customSectionGetData, "WRAPPER");
});

// Custom section input
Hooks.on("renderItemSheet", (app, [html], appData) => {
    const customSectionInput = document.createElement('div');
    customSectionInput.classList.add('form-group');
    customSectionInput.style.cssText = `
        border: 1px solid var(--faint-color);
        border-radius: 5px;
        flex-direction: column;
    `;
    customSectionInput.innerHTML = `
        <label>Custom Section</label>
        <input style="text-align: left;" type="text" name="flags.${moduleID}.sectionName" value="${app.object.flags[moduleID]?.sectionName || ""}" />
    `;
    const itemProperties = html.querySelector(`div.inventory-details, div.feat-details`);
    if (itemProperties) itemProperties.appendChild(customSectionInput);

    return;
});


Hooks.on("renderActorSheetPF2e", (app, html, appData) => {
    // Get the list of items with custom sections
    const itemsWithCustomSections = app.object.items.filter(i => i.flags[moduleID]?.sectionName);

    // Get the unique names of custom sections
    const customSections = [...new Set(itemsWithCustomSections.map(i => i.flags[moduleID].sectionName))];

    // Loop through each custom section
    for (const sectionName of customSections) {
        // Find the corresponding HTML element for the custom section
        const sectionElement = html.find(`h3.header:contains("${sectionName}")`);

        // Check if the section element exists
        if (sectionElement.length > 0) {
            // Remove the div.controls element from the custom section
            sectionElement.find("div.controls").remove();
        }
    }
});



async function customSectionGetData(wrapped) {
    // Call wrapped function to get appData
    const data = await wrapped();
    const items = data["items"];
    
    // Get list of items with custom sections
    const customSectionItems = items.filter(i => i.flags[moduleID]?.sectionName);
    const customSectionItemsId = customSectionItems.map((i) => i._id);

    // Get list of custom sections
    const customSections = [];
    for (const item of customSectionItems) {
        if (!customSections.includes(item.flags[moduleID].sectionName)) {
            customSections.push(item.flags[moduleID].sectionName);
        }
    }

    // Add new sections
    for (const newSection of customSections){ 
        data["actions"]["encounter"][newSection] = {
            label: newSection,
            actions: []
        }
    }
    
    var customActions = []

    // For items flagged with a custom section, remove them from their original section
    for (const sectionKey in data["actions"]["encounter"]) {
        const sectionValue = data["actions"]["encounter"][sectionKey];

        sectionValue["actions"] = sectionValue["actions"].filter(action => {
            if (customSectionItemsId.includes(action.id)) {
            // If the item's id is in customSectionItemsId, save it to the filteredOutArray
            customActions.push(action);
            return false; // Exclude from the filtered array
            }
            return true; // Include in the filtered array
        });
    }

    // Add items to custom section
    for (const item of customSectionItems) {
        const customSection = item.flags[moduleID].sectionName

        // Grab action based on id
        data["actions"]["encounter"][customSection].actions.push(customActions.find(action => action.id === item._id)); // TODO: Map to action instead of item with the ID
    }

    // Return updated data for sheet rendering
    return data;
}