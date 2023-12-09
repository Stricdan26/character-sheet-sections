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
        <label>${game.i18n.localize(`${moduleID}.customSection`)}</label>
        <input style="text-align: left;" type="text" name="flags.${moduleID}.sectionName" value="${app.object.flags[moduleID]?.sectionName || ""}" />
    `;
    const itemProperties = html.querySelector(`div.inventory-details, div.feat-details`);
    if (itemProperties) itemProperties.appendChild(customSectionInput);

    return;
});



    /**
     *  TODO: 
        Look at the item array and get a list of the ID's for each item with a flag of "sectionNam
        that is not "". Make sure this item is also of type action. For each section name, remove 
        item from the list of actions, add a new section, and append it there.
     */
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