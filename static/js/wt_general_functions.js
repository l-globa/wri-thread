// File contains global variables, and function declarations for the general HTML elements data handling

// TODO: set up separate file for all canvas-specific functions
// TODO: move all window.onload scripts into a separate file (element variables, event listeners)

// ==============================================================================================================================================================
// Global variables
// ==============================================================================================================================================================

//window.globals = {
//    SCENES: new Array(),
//    PLOTS: new Array(),
//    sceneCount: 0,
//    plotCount: 0,
//    additions: 0,
//    activePlot: null,
//    activeScene: null
//};

var additions;

var projectData = {
    scene: {
        all: new Array(),
        count: 0,
        active: null
    },
    plot: {
        all: new Array(),
        count: 0,
        active: null
    }
};

const itemDefault = {
    scene: {
        parentTag: 'article', 
        childTag: {title: 'summary', contents: 'details'}, 
        newItem: {title: "Test Scene", contents: "", item_id: 'temp', type: "normal", part_of: [], pick_main: null, neighbour: null, follow: 'after'}
    },
    plot: {
        parentTag: 'p', 
        childTag: {colour: 'div'},
        newItem: {title: "Test Plot", item_id: 'temp', colour: '', neighbour: null, follow: 'after'}
    }
};

// ==============================================================================================================================================================
// Function declarations
// ==============================================================================================================================================================

        // LOADING DATA AND HTML ELEMENTS

// Shorthand to get element by id
function byId(id) {
    return document.getElementById(id);
};

// Converts python-specific syntax to js equivalent
function check_value(value) {
    switch (value) {
        case 'None':
            return null;
        case 'True':
            return true;
        case 'False':
            return false;
        default:
            return value;
    };
};

// Retrieves json from dataset attribute and populates the global array variables
function load_data(container) {
    let scenes = JSON.parse(container.dataset.scenes);
    for (var i = 0; i < scenes.length; i++) {
      projectData.scene.all.push(scenes[i]);
      projectData.scene.count++;
    };
  
    let plots = JSON.parse(container.dataset.plots);
    for (var i = 0; i < plots.length; i++) {
        projectData.plot.all.push(plots[i]);
        projectData.plot.count++;
    };
    scenes, plots = null;
    container.dataset.scenes = null;
    container.dataset.plots = null;
};

// Creates a generic item element with all the values
function create_element(item, dflt) {

    // Create new parent element
    let element = document.createElement(dflt.parentTag);
  
    // Attach selection event listener
    // TODO: create separate variables to keep track of active scenes and plots
    // maybe even just toggle the active state on and off and querySelector for scene/plot + focused
    
  
    // Create and populate the child nodes from keys-values of item
    var addon = null;
    for (const [key, value] of Object.entries(item)) {
      let tag = dflt.childTag[key] ?? 'p';
      addon = element.appendChild(document.createElement(tag));
      addon.classList.add(key);
      addon.innerHTML = value;
      addon.hidden = true;
    };
  
    addon = null;

    element = tweak_element(element, dflt.parentTag);
    return element;
};

// Tweaks the fields of a given element depending on it's tag
function tweak_element(element, parentTag) {
    switch (parentTag) {
        case 'article':     // Scene element
            var type = 'scene'

            // Assign appropriate classes
            element.classList.add('scene', 'selectable');

            // Make title and contents visible
            element.querySelector('.title').hidden = false;
            element.querySelector('.contents').hidden = false;
            
            break;
        case 'p':           // Plot element
            var type = 'plot'
            // Assign appropriate classes
            element.classList.add('plot', 'selectable');
        
            // Make visible
            element.querySelector('.title').hidden = false;
        
            // Render colour
            let colour = element.querySelector('.colour');
            colour.style.backgroundColor = colour.innerHTML;
            colour.innerHTML = '&emsp;';
            colour.hidden = false;

            break;
    };
    selection_sensor(element, type);
    return element;
};

// Add active state selection sensor event listener
function selection_sensor(element, itemType) {
  element.addEventListener('contextmenu', function(e) {
    // Removes default right-click browser action
    e.preventDefault();

    if (projectData[itemType].active == this) {   // Triggers when rclk an already active element
      // Removes focused property and reference to element from active
      this.classList.toggle('focused');
      projectData[itemType].active = null;
    }
    else if (!projectData[itemType].active) {   // Selecting an element with no currently active one
      // Sets active to this element, renders focused property
      this.classList.toggle('focused');
      projectData[itemType].active = this;
    }
    else {    // Selecting an element when another is currently active
      // Sets active to the new element, toggles focused state of both
      projectData[itemType].active.classList.toggle('focused');
      this.classList.toggle('focused');
      projectData[itemType].active = this;
    };
  });
};

        // EDITING DATA VIA FORMS

// Fills the fields of a menu element with given item's data
function populate_menu(menuElement, item, action) {
    // Refresh the form
    refresh_menu(menuElement);

    // Retrieve item type (scene or plot) from form name
    let itemType = menuElement.name;

    // Assign correct action
    menuElement.querySelector('.menuAction').value = action;

    // Load title and id
    menuElement.querySelector('.title').value = item.title;
    menuElement.querySelector('.item_id').value = item.item_id;

    // Get the neighbour selection element
    let neighbourList = menuElement.querySelector('.neighbourList');

    // Check if a neighbour exists
    if (check_neighbour_exists(projectData[itemType].count, action)) {
        // Find and note the neighbouring item
        let neighbour = find_neighbour(item.item_id, itemType);

        // Load the list of scenes
        load_options(projectData[itemType].all, neighbourList, 'item_id', 'title', projectData[itemType].all[neighbour.index].item_id);
        menuElement.querySelector('.' + neighbour.follow).checked = true;
        //querySelector('.' + neighbour.follow)
    }
    else {
        // Remove the ability to select
        neighbourList.disabled = true;
        menuElement.querySelector('.before').disabled = true;
        menuElement.querySelector('.after').disabled = true;
    };

    
    if (item.type) {     // Scene-specific fields
        // Selects the scene type
        document.getElementById(item.type).checked = true;

        // Load scene description
        menuElement.querySelector('.contents').value = item.contents;

        // TODO: block the script if there is 1 or no plots
        // Load the list of plots
        partOf = menuElement.querySelector('.part_of')
        load_options(projectData.plot.all, partOf, 'item_id', 'title', item.part_of);

        // Load the selected main plot
        partOf.dispatchEvent(new Event('change'));
        if (item.pick_main) {
            let options = menuElement.querySelector('.main_plot').children;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value == item.pick_main) {
                    options[i].selected = true;
                };
            };
        };
    }
    else {  // Plot-specific fields

        // Load colour picker tool
        menuElement.querySelector('.colour').value = item.colour;
    };

    // Opens the dialog parent tag
    menuElement.parentElement.showModal();
};

function refresh_menu(menuElements) {
    for (let i = 0; i < menuElements.length; i++) {
        menuElements[i].disabled = false;
        menuElements[i].checked = false;
    };
};

// Returns true if there is more than one scene / plot in the project
function check_neighbour_exists(count, action) {
    let cutoff = (action == 'edit') ? 1 : 0;
    return (count > cutoff);
};

// Returns parameters for the neighbour to given item_id
function find_neighbour(item_id, itemType) {
    var index = null, follow = null;
    switch (position = projectData[itemType].all.findIndex(item => item.item_id == item_id)) {
        case 0:
            // The very first item, return the following as a neighbour
            index = 1,
            follow = 'before';
            break;
        case -1:
            // A new item to be added, return the last existing item as a neighbour
            index = projectData[itemType].count - 1,
            follow = 'after';
            break;
        default:
            // Returns the item before as a neighbour
            index = position - 1,
            follow = 'after';
    };
    return { index, follow };
};

// Dynamically generates a checklist/radio list for a given parent element
function load_options(obj, parent, value, text, selected) {
    // Parent is a fieldset
    // Empty list to refresh
    parent.innerHTML = null;

    // Set the work up for multi/single select
    // Default setup is multiple pre-selected items
    let type = 'checkbox';
    if (!selected) {
        // Set to an empty array to avoid null TypeError below
        selected = [];
        type = 'radio';
    }
    // If there is only one selected option
    else if (!Array.isArray(selected)) {
      selected = Array.of(selected);
      type = 'radio';
    };

    // Create options for every object's data entry
    for (let i = 0; i < obj.length; i++) {
        // Get a unique id
        let id = generate_id();
        // Create a label element
        let label = document.createElement('label');
        label.htmlFor = id;
        label.innerHTML = obj[i][text];
        label.dataset.value = obj[i][value];
        parent.appendChild(label);

        // Create the input element
        let input = document.createElement('input');
        input.id = id;
        input.name = parent.name;
        input.value = obj[i][value];
        input.type = type;
        
        // Select if needed
        if (selected.includes(obj[i][value])) {
          input.checked = true;
        };
        parent.appendChild(input);

        // Add a breakpoint for visual clarity
        parent.appendChild(document.createElement('br'));
    };
};

// From https://stackoverflow.com/a/19842865/29984206
// Generates a (sufficiently) unique id for automatic html label assignment
function generate_id() {
    return "id" + Math.random().toString(16).slice(2);
};

// Converts the menu form data into an object used to update global arrays and html elements
function process_submitted_item(formData) {
    let data = {};
    let action = formData.get('action');
    formData.delete('action');
  
    // Give a negative temp id (server db gives permanent)
    if (formData.get('item_id') == "temp") {
      formData.delete('item_id');
      additions++;
      data.item_id = String(- additions);
    };
    
    // Scene-specific steps
    if (formData.has('part_of')) {

        // Convert the plot_id array into correct form
        data.part_of = formData.getAll('part_of');
        formData.delete('part_of');
    };

    // Retrieve neighbour info
    let neighbour = {};
    neighbour.id = formData.get('neighbour');
    neighbour.follow = formData.get('follow');
    formData.delete('follow');
    formData.delete('neighbour');
  
    // Copy fields that require no change
    for (const info of formData.entries()) {
      data[info[0]] = info[1];
    };
  
    return {data, neighbour, action};
};

// Updates the global array with the given data object
// Returns info that can be stored in actions history
function update_global_array(itemType, data, neighbour, action) {
    // CAN BE SIMPLIFIED
    let index = 0,
        oldItem = [],
        newItem = data;
  
    if (action == 'add') {
      // Inserts the item at position specified by the index
      index = calculate_position(itemType, neighbour.id, neighbour.follow);
      oldItem = projectData[itemType].all.splice(index, 0, newItem);
      projectData[itemType].count++;
    }
    else {
      // Removes the item from specified index
      index = calculate_position(itemType, data.item_id, 'this');
      oldItem = projectData[itemType].all.splice(index, 1);
      projectData[itemType].count--;
      
      if (action == 'edit') {
        // Recursive call to add item back in at new position
        update_global_array(itemType, data, neighbour, 'add');
      }
      else {
        newItem = [];
      };
    };
    
    // Returns the values to be saved in history
    return [oldItem, newItem, index, action];
};

// Takes an item_id and follow (previous/next/this) parameter and returns a global array index
function calculate_position(itemType, item_id, follow) {
    // Special case for adding the first item to the project
    if (projectData[itemType].count == 0) {
      return 0;
    };
  
    let index = projectData[itemType].all.findIndex(item => item.item_id == item_id);
    if (follow == 'previous') {
      return index + 1;
    }
    else if (follow == 'next' || 'this') {
      return index;
    }
    // TODO: return correct error
    return 0;
};

// Updates the visible html elements list with given data object
function update_item_list(itemType, listElement, data, neighbour, action) {
    // Refresh the list of item nodes
    let itemIds = listElement.querySelectorAll(".item_id");
    let element = {};
  
    if (action == 'add') {
      // Create the HTML node for the scene
      element = create_element(data, itemDefault[itemType]);
  
      // Simply append when there are no neighbours
      if (projectData[itemType].count == 1) {
        listElement.appendChild(element);
        return;
      };
  
      // Retrieve the neighbour node
      for (let i = 0; i < itemIds.length; i++) {
        if (itemIds[i].innerHTML == neighbour.id) {
          var neighbourElement = itemIds[i].parentElement;
          break;
        };
      };
  
      // Append the new node
      if (neighbour.follow == 'previous') {
        neighbourElement.insertAdjacentElement('afterend', element);
      }
      else if (neighbour.follow == 'next') {
        neighbourElement.insertAdjacentElement('beforebegin', element);
      };
    }
    else {
      // For 'edit' and 'delete'
      // Retrieve the existing item node
      for (let i = 0; i < itemIds.length; i++) {
        if (itemIds[i].innerHTML == data.item_id) {
          element = itemIds[i].parentElement;
          break;
        };
      };

      // properly delete the existing item element
      delete_element(element);
      
      if (action == 'edit') {
        // Call recursively to add the updated node back in
        update_item_list(itemType, listElement, data, neighbour, 'add');
      };
    };
};

// Deletes an element, and all associated event listeners and children
function delete_element(element) {
    while (element.firstChild) {
        element.removeChild(element.lastChild);
    }
    element.remove();
};
