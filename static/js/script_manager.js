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

// Specific HTML tags for each class of a scene and plot, 'p' if not specified here
const sceneElement_default = {
  title: 'summary', contents: 'details'
};
const plotElement_default = {};


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
  let element = create_element(data, 'li', plotElement_default);

  // Assign appropriate classes
  element.classList.add('plot', 'selectable');

  // Make visible
  element.querySelector('.title').hidden = false;
  element.querySelector('.colour').hidden = false;

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

function populate_scene_menu(data, action) {
  document.getElementById('sceneSubmit').value = action;

  // Find previous neighbour
  let neighbour = find_neighbour(data.position);

  // Load the list of scenes
  let sceneList = document.getElementById('sceneList');
  load_options(DATA, sceneList, 'scene_id', 'title', DATA[neighbour.index].scene_id);
  document.getElementById(neighbour.follow).checked = true;

  // Load the list of plots
  let partOf = document.getElementById('part_of');
  load_options(PLOTS, partOf, 'id', 'title', data.plot_id);

  // TODO: load the selected main plot
  document.getElementById('part_of').dispatchEvent(new Event('change'));
  if (data.pick_main) {
    document.getElementById('main_plot').children[Number(data.pick_main)].selected = true;
  };

  let element = null;
  for (const key of Object.keys(data)) {
    element = document.getElementById(key);
    if (element) {
      element.value = data[key];
    }
    else {
      if (key == 'type') {
        document.getElementById(data[key]).checked = true;
      };
    };
  };
  // TODO check for edge cases:
  // 1 or no scenes
  // 1 or no plots
  // Disable irrelevant options
};

function load_options(data, parent, value, innerHTML, selected) {
  // Empty list
  parent.innerHTML = "";
  
  // Create options for every data entry
  for (var i = 0; i < data.length; i++) {
    let option = document.createElement('option');
    option.value = data[i][value];
    option.innerHTML = data[i][innerHTML];
    // TODO: add support for multiple selected?
    if (selected == data[i][value]) {
      option.selected = true;
    };
    parent.appendChild(option);
  };

  // If no pre-selected option add a placeholder
  if (!selected) {
    let empty = document.createElement('option');
    empty.value = "";
    empty.innerHTML = 'select';
    empty.selected = true;
    empty.disabled = true;
    parent.appendChild(empty);
  };
};

function find_neighbour(position) {
  if (position) {
    // For existing scene
    if (position == '0') {
      var index = 1, 
          follow = 'before';
    }
    else {
      var index = (Number(position) - 1), 
          follow = 'after';
    };
  }
  else {
    // For a new scene
    var index = (Number(sceneCount) - 1);
        follow = 'after';
  };
  return { index, follow };
};

function calculate_position(neighbourId, follow) {
  let index = DATA.findIndex(item => item.scene_id == neighbourId);
  if (follow == 'previous') {
    return index + 1;
  }
  else if (follow == 'next' || 'this') {
    return index;
  }
  else {
    // Case for the very first scene
    return 0;
  };
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
  else if (action == 'edit') {
    // Returns previous version of the edited scene
    index = calculate_position(data.scene_id, 'this');
    oldItem = DATA.splice(index, 1);
    index = calculate_position(neighbour.id, neighbour.follow);
    DATA.splice(index, 0, newItem);
  }
  else if (action == 'delete') {
    // Delete the item from the array
    // Returns the deleted item
    index = calculate_position(data.scene_id, 'this');
    oldItem = DATA.splice(index, 1);
    newItem = [];
    sceneCount--;
  };
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
    element = create_scene_element(data, neighbour, action);

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
    console.log(processed.position);

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

};

// .parse() method to convert json to js object
// reverse method to jsonify an object is .stringify()
// {key : value} equivalent to object.key == value equivalent to object["key"] == value
// {} can hold multiple pairs
// multiple {} can be put into an array
// TODO check how db data is stored in a json
// toggle is an event for opening/closing the details tab
// The selectedIndex property sets or returns the index of the selected option in a drop-down list. Starts at 0, setting to -1 means all deselected