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

var additions = 0;

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
        parentTag: 'details', 
        childTag: {title: 'summary', contents: 'textarea'}, 
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
      let tag = dflt.childTag[key] ?? 'div';
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
        case 'details':     // Scene element
            var type = 'scene'

            // Assign appropriate classes
            element.classList.add('scene', 'selectable');

            // Make title and contents visible
            element.querySelector('.title').hidden = false;
            let contents = element.querySelector('.contents');
            contents.hidden = false;
            contents.disabled = true;
            contents.cols = 100;
            contents.rows = 3;
            
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
            let options = menuElement.querySelector('.main_plot').querySelectorAll('input');
            for (let i = 0; i < options.length; i++) {
                if (options[i].value == item.pick_main) {
                    options[i].checked = true;
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
        // Second option for the dynamic list
        input.value = (obj[i][value])? obj[i][value] : obj[i].dataset.value;
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
      data.item_id = - additions;
    };
    
    // Scene-specific steps
    if (formData.has('part_of')) {

        // Convert the plot_id array into correct form
        let all = formData.getAll('part_of');
        for (let i = 0; i < all.length; i++) {
          all[i] = Number(all[i]);
        };
        data.part_of = all;
        formData.delete('part_of');

        data.pick_main = Number(formData.get('main_plot'));
        formData.delete('main_plot');
    };

    // Retrieve neighbour info
    let neighbour = {};
    neighbour.id = formData.get('neighbour');
    neighbour.follow = formData.get('follow');
    formData.delete('follow');
    formData.delete('neighbour');
  
    // Copy fields that require no change
    for (const info of Array.from(formData).reverse()) {
      data[info[0]] = info[1];
    };

    data.item_id = Number(data.item_id);

    return {data, neighbour, action};
};

// Updates the global array with the given data object
// Returns info that can be stored in actions history
function update_global_array(itemType, data, neighbour, action) {
    // CAN BE SIMPLIFIED
    let index = 0,
        oldItem = {},
        newItem = data;
  
    if (action == 'add') {
      // Inserts the item at position specified by the index
      index = calculate_position(itemType, neighbour.id, neighbour.follow);
      oldItem = projectData[itemType].all.splice(index, 0, newItem)[0];
      projectData[itemType].count++;
    }
    else {
      // Removes the item from specified index
      index = calculate_position(itemType, data.item_id, 'this');
      oldItem = projectData[itemType].all.splice(index, 1)[0];
      projectData[itemType].count--;
      
      if (action == 'edit') {
        // Recursive call to add item back in at new position
        update_global_array(itemType, data, neighbour, 'add');
      }
      else {
        newItem = {};
      };
    };
    
    // Returns the values to be saved in history
    return {oldItem, newItem, index, action};
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

// ==============================================================================================================================================================
// Paper js

// Global variables
const canvas = {
  origin: {x: 100, y: 100},
  step: {x: 100, y: 50},
  buffer: {text: -20, plot: 70}
};

// Updates when window loads and canvas tag is initialised
const symbols = {
  normal: null,
  flashback: null,
  dream: null,
};

var plotlines = {};

var allScenes = null;
var allConnections = null;
// TODO: add a way to select scenes and note the selected scene - must communicate with the html list

// Function declarations

// Applies consistent styling to scene symbols
function style_symbol(path) {
  path.fillColor = 'white';
  path.strokeColor = 'black';
  path.strokeWidth = 2;
  return path;
};

// Populates the plot priority array for easy access later
function load_plotlines() {
  projectData.plot.all.forEach(function(value, index) {
    // Initialise a new plotline
    plotlines[value.item_id] = {};
    let line = plotlines[value.item_id];

    // Note priority
    line.priority = index;

    // Holds connection ids
    line.ids = new Array();

    // Plotline flanking symbols, filled when creating connections
    line.beginning = null;
    line.end = null;
  });
  // TODO: consider moving the colour parameter here?
  console.log(plotlines);
};

// Assigns a y value to a plot id, returns y coords of starting point
function place_plot(itemId) {
  position = projectData.plot.all.findIndex(item => item.item_id == itemId);
  let y = canvas.origin.y * priority;
  return y;
};

// Places a scene object on the canvas
function summon_scene(item_id, position, type, plotId, title) {

  let scene = new paper.Path();

  scene.moveTo(canvas.origin.x + (position * canvas.step.x), canvas.origin.y + (plotlines[plotId].priority * canvas.step.y));
  scene.data.icon = symbols[type].place(scene.bounds.center);

  // Record data
  scene.data.item_id = item_id;
  scene.data.plotId = plotId;
  scene.data.title = title_scene(scene, title);

  // Set up connection storage
  scene.data.left = new Array();
  scene.data.right = new Array();

  return scene;
};

function title_scene(scene, title) {
  let iconTitle = new paper.PointText({
      content: title,
      point: scene.bounds.center.add(0, canvas.buffer.text),
      justification: 'left'
  });
  iconTitle.rotate(-30, scene.bounds.center);
  return iconTitle;
};

// Draws a conncetion between two scenes
function draw_connection(start, finish, plotId) {

  let connection = null;

  // TODO: consider taking the colour calculation out into the outer function
  // Also applies to buffer calc
  let colour = projectData.plot.all[plotlines[plotId].priority].colour;

  // Add start and end buffer lines
  if (!start) {
    start = (plotlines[plotId].beginning)? plotlines[plotId].beginning : create_line_flanks(colour, plotId, finish, 'beginning');
  }
  else if (!finish) {
    finish = (plotlines[plotId].end)? plotlines[plotId].end : create_line_flanks(colour, plotId, start, 'end');
  };
  
  connection = new paper.Path.Line(start.bounds.center, finish.bounds.center);
  
  // TODO: set up a styling function as this repeats?
  connection.strokeColor = colour;
  connection.strokeWidth = 4;
  connection.fillColor = colour;

  // Add the plotId to the connection data for retrieval
  connection.data.plotId = plotId;
  return connection;
};

// Creates the plotline flanking object
function create_line_flanks(colour, plotId, refPoint, type) {
  let flank = null;
  switch (type) {
    case 'beginning':
      flank = new paper.Path.Circle(refPoint.bounds.center.subtract(canvas.buffer.plot, 0), 4);
      plotlines[plotId].beginning = flank;
      break;
    case 'end':
      flank = new paper.Path.Circle(refPoint.bounds.center.add(canvas.buffer.plot, 0), 4);
      plotlines[plotId].end = flank;
      break;
  };

  flank.strokeColor = colour;
  flank.strokeWidth = 4;
  flank.fillColor = colour;

  flank.data.left = [];
  flank.data.right = [];

  return flank;
};

// Returns a visible scene object with the given Id
function get_scene_object(item_id) {
  return allScenes.getItem({
    data: {
      item_id: item_id,
    }
  });
};

function find_connection_vertices(finishIndex, plotId) {
  let startPoint = null;
  let finishPoint = null;

  let list = plotlines[plotId].ids;

  if (finishIndex == 0) {
    // Case for first plot point, only find finish
    finishPoint = get_scene_object(list[finishIndex]);
  }
  else if (finishIndex == plotlines[plotId].ids.length) {
    // Case for the last plot point, only find start
    startPoint = get_scene_object(list[finishIndex - 1])
  }
  else {
    // Must find start and finish
    finishPoint = get_scene_object(list[finishIndex]);
    startPoint = get_scene_object(list[finishIndex - 1]);
  }

  return {startPoint, finishPoint};
};

// Changes connection attachment points
function reassign_connection(connection, start, finish) {

  if (start) {
    connection.firstSegment.point = start.bounds.center;
    start.data.right.push(connection.id);
  };
  if (finish) {
    connection.lastSegment.point = finish.bounds.center;
    finish.data.left.push(connection.id);
  };
};

function delete_canvas_scene(item_id) {

  // Retrieve the canvas object
  let scene = get_scene_object(item_id);

  // Delete title and symbol icon
  scene.data.title.remove();
  scene.data.icon.remove();

  // Reroute all connections

  scene.data.left.forEach(function(value) {
    let line = fetch_connection(value);
    let n = line.data.plotId;
    let i = plotlines[n].ids.indexOf(item_id);
    let finish = get_scene_object(plotlines[n].ids[i + 1]) ?? plotlines[n].end;

    reassign_connection(line, null, finish);
  });

  scene.data.right.forEach(function(value) {
    let line = fetch_connection(value);
    let n = line.data.plotId;
    let i = plotlines[n].ids.indexOf(item_id);
    let start = get_scene_object(plotlines[n].ids[i - 1]) ?? plotlines[n].beginning;
    reassign_connection(line, start, null);
  });

  // TODO: either edit existing or redraw edited connections
  
  // Delete the scene itself
  scene.remove();

};

function update_plotlines(action, item_id, plots, searchIndex) {
  console.log(plots);
  if (action == 'add') {
    //let searchIndex = projectData.scene.all.findIndex(item => item.item_id =)
    // TODO: find a way to get the correct position - neighbour mechanic?
    let array = projectData.scene.all.slice(searchIndex + 1);
    console.log(array);
    if (array.length == 0) {
      // last item case
      // TODO: exception for new scene being last in the project
      console.log('last scene case')
      plots.forEach(function(n) {
        plotlines[n].ids.push(item_id);
      });
    }
    else {
      plots.forEach(function(n) {
        console.log('search')
        // Search all scenes, starting from index, to find next scene with same main plot
        // Get its item id and go to plotlines to find its index there
        // Insert the new scene at given index
        // If no such item exists the new scene is pushed onto plotline as the last
        let neighbour = array.find(item => item.pick_main == n);
        if (neighbour) {
          console.log(neighbour.item_id);
          let index = plotlines[n].ids.indexOf(neighbour.item_id);
          console.log(index)
          console.log(plotlines[n].ids);
          plotlines[n].ids.splice(index, 0, item_id);
          console.log(plotlines[n].ids);
        }
        else {
          console.log('last of plotline only')
          plotlines[n].ids.push(item_id);
        };
      });
    }; 
  }
  else if (action == 'delete') {
    plots.forEach(function(n) {
      let index = plotlines[n].ids.indexOf(item_id);
      plotlines[n].ids.splice(index, 1);
    })
  };
};

function fetch_connection(id) {
  return allConnections.getItem({
    id: id,
  });
};

// Shifts the whole graph in response to adding or deleting a scene
function shift_graph(action, scenePosition, sceneId) {

  if (action == 'edit') {
    // Fetch the scene
    let object = get_scene_object(sceneId);

    // Check if scene order changed:
    let oldPosition = (object.bounds.center.x - canvas.origin.x) / canvas.step.x;
    
    if (oldPosition == scenePosition) {
      // No need to shift, quit early and return 'false'
      return false;
    };
  };

  // Calculate x-coordinate cutoff point for move:
  let cutoff = (scenePosition * canvas.step.x - canvas.step.x / 4) + canvas.origin.x;
  console.log(cutoff);
  console.log(scenePosition);

  // Get all items that must be moved fully
  // Have to exclude CompoundPath otherwise connections are added twice
  let items = paper.project.getItems({
    bounds: function(value) {
      return value.x > cutoff;
    },
    className: function(value) {
      return value != 'Group' && value != 'CompoundPath'
    }
  });
  console.log(items);

  // Get all connections that intersect the cutoff
  let atCutoff = paper.project.getItems({
    className: 'Path',
    bounds: function(value) {
      return value.topLeft.x < cutoff && value.topRight.x > cutoff
    }
  });

  // Move the items according to action
  let factor = (action == 'add')? 1 : -1;
  items.forEach(function(value) {
    value.position = value.position.add(canvas.step.x * factor, 0);
  });

  // Move the final segment of connections to the new position
  atCutoff.forEach(function(value) {
    value.lastSegment.point = value.lastSegment.point.add(canvas.step.x * factor, 0);
  });

  // TODO: fix the view jumping by setting the viewbox back to origin

  // Return 'true' to confirm the move
  return true;
};

// Update plotline flank height
function level_flank() {

};