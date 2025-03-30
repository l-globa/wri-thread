// Complementary JavaScript to the canvas Paperscript file
// Bridges the gap between local paper environment and global js environment that communicates with the server

// Global variables
window.globals = {};
var DATA = new Array();
var PLOTS = new Array();
var sceneCount = 0;
var plotCount = 0;
var additions = 0;
var active = null;

// Scene id is assigned later
const scene_default = {
  title: "Test Scene", contents: "", scene_id: 'temp', type: "normal", part_of: [], pick_main: null, neighbour: null, follow: 'after'
};

const plot_default = {
  plot_title: "New Plot", plot_id: 'temp', colour: '', neighbour: null, follow: 'after'
};

// Specific HTML tags for each class of a scene and plot, 'p' if not specified here
const sceneElement_default = {
  title: 'summary', contents: 'details'
};
const plotElement_default = {
  colour: 'div'
};


// ==============================================================================================================================================================
// Function declarations
// ==============================================================================================================================================================

function read_item_info(item) {
  info = {};
  for (var i = 0; i < item.children.length; i++) {
      var key = item.children[i].className;
      var value = item.children[i].innerHTML;
      info[key] = check_value(value);
  };
  return info;
};

function check_value(value) {
  if (value == "None") {
    return null;
  }
  else if (value == "True") {
    return true;
  }
  else if (value == "False") {
    return false;
  }
  else {
    return value;
  };
};

function load_data(container) {
  let scenes = JSON.parse(container.dataset.scenes);
  for (var i = 0; i < scenes.length; i++) {
    DATA.push(scenes[i]);
    sceneCount++;
  };

  let plots = JSON.parse(container.dataset.plots);
  for (var i = 0; i < plots.length; i++) {
    PLOTS.push(plots[i]);
    plotCount++;
  };
  scenes, plots = null;
  container.dataset.scenes = null;
  container.dataset.plots = null;
};

// Creates a generic element with all the values
function create_element(dict, parentTag, childTag) {

  // Create new parent element
  let element = document.createElement(parentTag);

  // Attach selection event listener
  selection_sensor(element);

  // Create and populate the child nodes from dict
  var addon = null;
  for (const [key, value] of Object.entries(dict)) {
    let tag = childTag[key] ?? 'p';
    addon = element.appendChild(document.createElement(tag));
    addon.classList.add(key);
    addon.innerHTML = value;
    addon.hidden = true;
  };

  addon = null;
  return element;
};

function create_scene_element(data) {
  // Obtain the new parent element
  let element = create_element(data, 'article', sceneElement_default);

  // Assign appropriate classes
  element.classList.add('scene', 'selectable');

  // Make title and contents visible
  element.querySelector('.title').hidden = false;
  element.querySelector('.contents').hidden = false;

  // Return the parent node
  return element;
};

function create_plot_element(data) {
  // Obtain the new parent element
  let element = create_element(data, 'p', plotElement_default);

  // Assign appropriate classes
  element.classList.add('plot', 'selectable');

  // Make visible
  element.querySelector('.plot_title').hidden = false;

  // Render colour
  let colour = element.querySelector('.colour');
  colour.style.backgroundColor = colour.innerHTML;
  colour.innerHTML = '&emsp;';
  colour.hidden = false;

  // Return the parent node
  return element;
};

// Add active state selection sensor event listener
function selection_sensor(element) {
  element.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    this.classList.toggle('focused');
    if (this.classList.contains('focused')) {
      active.classList.remove('focused')
      active = this;
    }
    else {
      active = document.getElementById('shuttle');
    };
  });
};

// TODO: consider a separate 'refresh form' function + tidy up the edge cases
function populate_scene_menu(data, action) {
  document.getElementById('sceneSubmit').value = action;

  let sceneList = document.getElementById('sceneList');

  if (sceneCount == 0 || (sceneCount == 1 && action == 'edit')) {
    // Case of the first scene
    sceneList.disabled = true;
    document.getElementById('before').disabled = true;
    document.getElementById('after').disabled = true;
    document.getElementById('before').checked = false;
    document.getElementById('after').checked = false;
  }
  else {
    // Find previous neighbour
    let neighbour = find_neighbour(action, 'scene_id', data.scene_id, DATA);
    console.log(neighbour);

    // Load the list of scenes
    load_options(DATA, sceneList, 'scene_id', 'title', DATA[neighbour.index].scene_id);
    document.getElementById(neighbour.follow).checked = true;

    // Switch on the option to select again
    sceneList.disabled = false;
    document.getElementById('before').disabled = false;
    document.getElementById('after').disabled = false;
  };

  // Load the list of plots
  let partOf = document.getElementById('part_of');
  load_options(PLOTS, partOf, 'plot_id', 'plot_title', data.part_of);

  // Load the selected main plot
  document.getElementById('part_of').dispatchEvent(new Event('change'));
  if (data.pick_main) {
    let options = document.getElementById('main_plot').children;
    for (let i = 0; i < options.length; i++) {
      if (options[i].value == data.pick_main) {
        options[i].selected = true;
      };
    };
  };

  // This needs rework
  let element = null;
  for (const key of Object.keys(data)) {
    element = document.getElementById(key);
    if (element) {
      if(key == 'part_of' || key == 'pick_main') {
        continue;
      }
      else {
        element.value = data[key];
      };
    }
    else {
      if (key == 'type') {
        document.getElementById(data[key]).checked = true;
      };
    };
  };
  // TODO check for edge cases:
  // 1 or no scenes - done
  // 1 or no plots
  // Disable irrelevant options
};

function populate_plot_menu(data, action) {
  document.getElementById('plotSubmit').value = action;

  let element = null;
  for (const key of Object.keys(data)) {
    element = document.getElementById(key);
    if (element) {
      element.value = data[key];
    };
  };

  // Set up plot priority through neighbour mechanic
  let plotList = document.getElementById('plotList');

  if (plotCount == 0 || (plotCount == 1 && action == 'edit')) {
    // Case of the first plot
    plotList.disabled = true;
    document.getElementById('p_before').disabled = true;
    document.getElementById('p_after').disabled = true;
    document.getElementById('p_before').checked = false;
    document.getElementById('p_after').checked = false;
  }
  else {
    // Find previous neighbour
    let neighbour = find_neighbour(action, 'plot_id', data.plot_id, PLOTS);
    console.log(neighbour);

    // Load the list of scenes
    load_options(PLOTS, plotList, 'plot_id', 'plot_title', PLOTS[neighbour.index].plot_id);
    document.getElementById(neighbour.follow).checked = true;

    // Switch on the option to select again
    sceneList.disabled = false;
    document.getElementById('before').disabled = false;
    document.getElementById('after').disabled = false;
  };

  // Check off any scenes you want to add
};

function load_options(data, parent, value, innerHTML, selected) {
  // Empty list
  parent.innerHTML = "";

  // Default setup is multiple pre-selected items
  // If no pre-selected option add a placeholder
  if (!selected) {
  let empty = document.createElement('option');
  empty.value = "";
  empty.innerHTML = 'select';
  empty.selected = true;
  empty.disabled = true;
  empty.hidden = true;
  parent.appendChild(empty);

  // Set to an empty array to avoid null TypeError below
  selected = [];
  }
  // If there is only one selected option
  else if (!Array.isArray(selected)) {
    selected = Array.of(selected);
  };

  // Create options for every data entry
  for (let i = 0; i < data.length; i++) {
    let option = document.createElement('option');
    option.value = data[i][value];
    option.innerHTML = data[i][innerHTML];

    if (selected.includes(data[i][value])) {
      option.selected = true;
    };
    parent.appendChild(option);
  };
};

function find_neighbour(action, idName, id, array) {
  // Neighbour parameters
  var index = null;
      follow = null;

  if (action == 'edit') {
    // For an existing scene
    let position = array.findIndex(item => item[idName] == id);
    if (position == 0) {
      index = 1, 
      follow = 'before';
    }
    else {
      index = position - 1, 
      follow = 'after';
    };
  }
  else {
    // For a new scene
    index = array.length - 1;
    follow = 'after';
  };

  return { index, follow };
};

function calculate_position(neighbourId, follow) {
  // Special case for the first scene
  if (sceneCount == 0) {
    return 0;
  };

  let index = DATA.findIndex(item => item.scene_id == neighbourId);
  if (follow == 'previous') {
    return index + 1;
  }
  else if (follow == 'next' || 'this') {
    return index;
  }
  // TODO: return correct error
  return 0;
};

function process_scene(formData) {
  let data = {};
  let action = formData.get('action');
  formData.delete('action');

  // Give a negative temp id (server db gives permanent)
  if (formData.get('scene_id') == "temp") {
    formData.delete('scene_id');
    additions++;
    data['scene_id'] = String(- additions);
  };

  // Convert the plot_id array into correct form
  data['part_of'] = formData.getAll('part_of');
  formData.delete('part_of');

  // Find where to place the scene in the narrative
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

// TODO simplify by combining with the similar scene related functions
function process_plot(formData) {
  let data = {};
  let action = formData.get('action');
  formData.delete('action');

  // Give a negative temp id (server db gives permanent)
  if (formData.get('plot_id') == "temp") {
    formData.delete('plot_id');
    additions++;
    data['plot_id'] = String(- additions);
  };

  // Find the new plot priority
  // TODO include relevant fields in the form
  let neighbour = {};
  neighbour.id = formData.get('neighbour') ?? 1;
  neighbour.follow = formData.get('follow') ?? 'previous';
  formData.delete('follow');
  formData.delete('neighbour');

  // Copy fields that require no change
  for (const info of formData.entries()) {
    data[info[0]] = info[1];
  };

  return {data, neighbour, action};
};

// Updates the DATA array
// Maybe adapt for plots too
function update_scenes(data, neighbour, action) {
  // CAN BE SIMPLIFIED
  let index = 0,
      oldItem = [],
      newItem = data;
  // TODO: first save the original item in history

  if (action == 'add') {
    // Inserts the item at position specified by the index
    index = calculate_position(neighbour.id, neighbour.follow);
    oldItem = DATA.splice(index, 0, newItem);
    sceneCount++;
  }
  else {
    // Removes the item from specified index
    index = calculate_position(data.scene_id, 'this');
    oldItem = DATA.splice(index, 1);
    sceneCount--;
    
    if (action == 'edit') {
      // Recursive call to add item back in at new position
      update_scenes(data, neighbour, 'add');
    }
    else {
      newItem = [];
    };
  };
  
  // Return the values to be saved in history
  return [oldItem, newItem, index, action];
};

// Updates the visible list
// TODO: add first scene edge case handling
function update_scene_list(data, neighbour, action) {
  // Refresh the list of scene nodes
  let sceneIds = document.querySelectorAll(".scene_id");
  let element = {};

  if (action == 'add') {
    // Create the HTML node for the scene
    element = create_scene_element(data);

    // Check for the first scene
    if (sceneCount == 1) {
      document.querySelector('.scene-list').appendChild(element);
      return;
    }

    // Retrieve the neighbour node
    for (let i = 0; i < sceneIds.length; i++) {
      if (sceneIds[i].innerHTML == neighbour.id) {
        var neighbourElement = sceneIds[i].parentElement;
        break;
      }
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
    // Retrieve the current scene node
    for (let i = 0; i < sceneIds.length; i++) {
      if (sceneIds[i].innerHTML == data.scene_id) {
        element = sceneIds[i].parentElement;
        break;
      }
    };

    // Remove all children and the scene node itself
    while (element.firstChild) {
      element.removeChild(element.lastChild);
    }
    element.remove();
    //document.querySelector('.scene-list').remove(element);
    
    if (action == 'edit') {
      // Call recursively to add the updated node back in
      update_scene_list(data, neighbour, 'add');
    };
  };
};

// Updates the PLOTS array
// TODO: look to simplify by combining with scene function
function update_plots(data, neighbour, action) {
  let index = 0,
      oldItem = [],
      newItem = data;
  // TODO: first save the original item in history

  if (action == 'add') {
    // Inserts the item at position specified by the index
    index = calculate_position(neighbour.id, neighbour.follow);
    oldItem = PLOTS.splice(index, 0, newItem);
    plotCount++;
  }
  else {
    // Removes the item from specified index
    index = calculate_position(data.plot_id, 'this');
    oldItem = PLOTS.splice(index, 1);
    plotCount--;
    
    if (action == 'edit') {
      // Recursive call to add item back in at new position
      update_plots(data, neighbour, 'add');
    }
    else {
      newItem = [];
    };
  };
  
  // Return the values to be saved in history
  return [oldItem, newItem, index, action];
};

// Updates the visible list
function update_plot_list(data, neighbour, action) {
  // Refresh the list of plot nodes
  let plotIds = document.querySelectorAll(".plot_id");
  let element = {};

  if (action == 'add') {
    // Create the HTML node for the scene
    element = create_plot_element(data);

    // Check for the first plot
    if (plotCount == 1) {
      document.querySelector('.plot-list').appendChild(element);
      return;
    }

    // Retrieve the neighbour node
    for (let i = 0; i < plotIds.length; i++) {
      if (plotIds[i].innerHTML == neighbour.id) {
        var neighbourElement = plotIds[i].parentElement;
        break;
      }
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
    // Retrieve the current plot node
    for (let i = 0; i < plotIds.length; i++) {
      if (plotIds[i].innerHTML == data.plot_id) {
        element = plotIds[i].parentElement;
        break;
      }
    };

    // Remove all children and the scene node itself
    while (element.firstChild) {
      element.removeChild(element.lastChild);
    }
    element.remove();
    
    if (action == 'edit') {
      // Call recursively to add the updated node back in
      update_plot_list(data, neighbour, 'add');
    };
  };
};

// ===================================================================================================================================================================
// WINDOW ONLOAD EVENTS
// ===================================================================================================================================================================

window.onload = function() {
  console.log("loaded");

  active = document.getElementById('shuttle');
  // populate the js db variables
  load_data(active);

  var sceneList = document.querySelector('.scene-list');

  // Create the visible scene elements
  for (let i = 0; i < sceneCount; i++) {
    let element = create_scene_element(DATA[i]);
    sceneList.appendChild(element);
  };

  var plotList = document.querySelector('.plot-list');

  // Create the visible plot elements
  for (let i = 0; i < plotCount; i++) {
    let element = create_plot_element(PLOTS[i]);
    plotList.appendChild(element);
  };
  
  //let scenes = Array.from(document.querySelectorAll(".scene"));
  //for (var i = 0; i < scenes.length; i++) {
  //    DATA.push(read_item_info(scenes[i]));
    
      // TODO: reintegrate canvas
      // scene_id, position, plot_id, title
      //window.globals.scenesToCanvas(DATA[i]);
      //allScenes.addChild(scene);
  //};

  //let plots = document.querySelectorAll(".plot");

  //for (var i = 0; i < plots.length; i++) {
  //  PLOTS.push(read_item_info(plots[i]));
  //};
  //console.log(PLOTS);

  // Calling a form for new scene
  document.getElementById('newScene').addEventListener("click", function() {
    for (var key of Object.keys(scene_default)) {
    };
    populate_scene_menu(scene_default, 'add');
  });

  // Calling a form to edit scene
  document.getElementById('editScene').addEventListener("click", function() {
    // TODO when no active scene selected, disable the edit button
    // Can retrieve index in scenes and look up DATA this way
    let id = active.querySelector('.scene_id').innerHTML;
    let scene = DATA.find(item => item.scene_id == id);
    populate_scene_menu(scene, 'edit');
  });

  // Retrieving edited/created scene data
  let sceneMenu = document.getElementById('sceneMenu');
  sceneMenu.addEventListener("submit", function(e) {
    e.preventDefault();
    var formData = new FormData(sceneMenu);
    console.log(formData);
    // Process form data into scene format
    var processed = process_scene(formData);
    console.log(processed.data);
    console.log(processed.neighbour);

    // Add the scene into DATA storage
    let record = update_scenes(processed.data, processed.neighbour, processed.action);
    console.log(DATA);
    // Add the scene into the list
    update_scene_list(processed.data, processed.neighbour, processed.action);
    // TODO record step in history (send record to relevant function)
    // TODO update the canvas
  });

  // Delete selected scene
  document.getElementById('deleteScene').addEventListener("click", function() {
    // CAN BE OPTIMISED - same code as for edit scene
    let id = active.querySelector('.scene_id').innerHTML;
    let scene = DATA.find(item => item.scene_id == id);
    update_scenes(scene, null, 'delete');
    update_scene_list(scene, null, 'delete');
  });

  // Plot list
  let selectPlot = document.getElementById('part_of');

  // Fill the list according to selected plots
  selectPlot.addEventListener("change", function() {
    let pickMain = document.getElementById('main_plot');

    // Remove previous options
    pickMain.innerHTML = null;

    // Create a new selection and load the options
    let list = Array.from(selectPlot.children).filter(item => item.selected == true);
    load_options(list, pickMain, 'value', 'innerHTML', null);
  });

  // Calling a form for new plot
  document.getElementById('newPlot').addEventListener("click", function() {
    populate_plot_menu(plot_default, 'add');
  });

  // Calling a form to edit existing plot
  document.getElementById('editPlot').addEventListener("click", function() {
    // TODO when no active plot selected, disable the edit button
    let id = active.querySelector('.plot_id').innerHTML;
    let plot = PLOTS.find(item => item.plot_id == id);
    populate_plot_menu(plot, 'edit');
  });

  // Retrieving edited/created plot data
  let plotMenu = document.getElementById('plotMenu');
  plotMenu.addEventListener("submit", function(e) {
    e.preventDefault();
    var formData = new FormData(plotMenu);
    console.log(formData);
    // Process form data into plot format
    var processed = process_plot(formData);
    console.log(processed.data);
    console.log(processed.neighbour);
    console.log(processed.action);

    // Add the scene into PLOTS storage
    let record = update_plots(processed.data, processed.neighbour, processed.action);
    //console.log(DATA);
    // Add the plot into the list
    update_plot_list(processed.data, processed.neighbour, processed.action);
    // TODO record step in history (send record to relevant function)
    // TODO update the canvas
  });

  // Delete selected plot
  document.getElementById('deletePlot').addEventListener("click", function() {
    // CAN BE OPTIMISED - same code as for edit scene
    let id = active.querySelector('.plot_id').innerHTML;
    let plot = PLOTS.find(item => item.plot_id == id);
    update_plots(plot, null, 'delete');
    update_plot_list(plot, null, 'delete');
  });
};

// .parse() method to convert json to js object
// reverse method to jsonify an object is .stringify()
// {key : value} equivalent to object.key == value equivalent to object["key"] == value
// {} can hold multiple pairs
// multiple {} can be put into an array
// TODO check how db data is stored in a json
// toggle is an event for opening/closing the details tab
// The selectedIndex property sets or returns the index of the selected option in a drop-down list. Starts at 0, setting to -1 means all deselected