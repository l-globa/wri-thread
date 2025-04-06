// File requires a loaded wt_general_functions.js

window.onload = function() {
    // ==============================================================================================================================================================
    // Assigning DOM elements to variables

    // Data
    const shuttle = byId('shuttle');
    const sceneList = byId('sceneList');
    const plotList = byId('plotList');

    // Forms
    const sceneMenu = byId('sceneMenu');
    const sceneDialog = byId('sceneDialog');
    const plotMenu = byId('plotMenu');
    const plotDialog = byId('plotDialog');
    const partOfList = byId('part_of');
    const mainPlot = byId('main_plot');

    const closeModalBtn = document.querySelectorAll('.modalClose');

    // Controls
    const newScene = byId('newScene');
    const editScene = byId('editScene');
    const deleteScene = byId('deleteScene');
    const newPlot = byId('newPlot');
    const editPlot = byId('editPlot');
    const deletePlot = byId('deletePlot');

    const saveProject = byId('saveProject');

    // ==============================================================================================================================================================
    // Loading data

    // Populate the global projectData object
    load_data(shuttle);

    // Create visible scene elements
    for (let i = 0; i < projectData.scene.count; i++) {
        let element = create_element(projectData.scene.all[i], itemDefault.scene);
        sceneList.appendChild(element)
    };

    // Create visible plot elements
    for (let i = 0; i < projectData.plot.count; i++) {
        let element = create_element(projectData.plot.all[i], itemDefault.plot);
        plotList.appendChild(element)
    };

    //sceneMenu.parentElement.close();
    //plotMenu.parentElement.close();

    // ==============================================================================================================================================================
    // Adding event listeners

    // Closing dialog windows
    for (let i = 0; i < closeModalBtn.length; i++) {
        closeModalBtn[i].addEventListener('click', function() {
            document.getElementById(closeModalBtn[i].name).close();
        });
    };
    
            // SCENES

    // Calling a form for new scene
    newScene.addEventListener('click', function() {
        // TODO: add an option to modify the default when called from other target
        populate_menu(sceneMenu, itemDefault.scene.newItem, 'add');
    });

    // Calling a form to edit scene     // TODO when no active scene selected, disable the edit button
    editScene.addEventListener('click', function() {
        let id = projectData.scene.active.querySelector('.item_id').innerHTML;
        let item = projectData.scene.all.find(item => item.item_id == id);
        populate_menu(sceneMenu, item, 'edit');
    });

    // Fill the partOfList according to selected plots in the sceneMenu
    partOfList.addEventListener('change', function() {
        // Remove previous options
        mainPlot.innerHTML = null;

        // Create a new selection and load the options
        let list = Array.from(partOfList.querySelectorAll('input')).filter(item => item.checked == true);
        
        // This fixes the rendering bug but might need to be reworked for performance
        let labels = new Array();
        for (let i = 0; i < list.length; i++) {
            let label = Array.from(partOfList.querySelectorAll('label')).find(item => item.htmlFor == list[i].id);
            labels.push(label);
        };

        load_options(labels, mainPlot, null, 'innerHTML', null);
    });

    // Delete selected scene
    deleteScene.addEventListener('click', function() {
        // CAN BE OPTIMISED - same code as for edit scene
        let id = projectData.scene.active.querySelector('.item_id').innerHTML;
        let item = projectData.scene.all.find(item => item.item_id == id);
        let record = update_global_array('scene', item, null, 'delete');
        update_item_list('scene', sceneList, item, null, 'delete');

        // Delete canvas objects
        
        shift_graph('delete', record.index, Number(id));
        // TODO: add function to reassign the connections
        delete_canvas_scene(Number(id));
        update_plotlines(record.action, Number(id), record.oldItem.part_of, record.index);
    });

            // PLOTS

    // Calling a form for new plot
    newPlot.addEventListener('click', function() {
        // TODO: add an option to modify the default when called from other target
        populate_menu(plotMenu, itemDefault.plot.newItem, 'add');
    });

    // Calling a form to edit plot     // TODO when no active plot selected, disable the edit button
    editPlot.addEventListener('click', function() {
        let id = projectData.plot.active.querySelector('.item_id').innerHTML;
        let item = projectData.plot.all.find(item => item.item_id == id);
        populate_menu(plotMenu, item, 'edit');
    });

    // Delete selected plot
    deletePlot.addEventListener('click', function() {
        // CAN BE OPTIMISED - same code as for edit scene
        let id = projectData.plot.active.querySelector('.item_id').innerHTML;
        let item = projectData.plot.all.find(item => item.item_id == id);
        update_global_array('plot', item, null, 'delete');
        update_item_list('plot', plotList, item, null, 'delete');
    });

    // Retrieving edited/created scene data
    sceneMenu.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Retrieve the submitted data
        let type = this.name;
        let formData = new FormData(this);
        
        // Close the dialog window
        this.querySelector('.modalClose').dispatchEvent(new Event('click'));

        // Process the data
        var p = process_submitted_item(formData);
        console.log(p);

        // Update global array and DOM elements
        let record = update_global_array(type, p.data, p.neighbour, p.action);
        console.log(record);
        update_item_list(type, sceneList, p.data, p.neighbour, p.action);

        // TODO record step in history (send record to relevant function)
        // TODO update the canvas
        shift_graph(record.action, record.index, record.newItem.item_id);
        console.log()
        summon_scene(record.newItem.item_id, record.index, record.newItem.type, record.newItem.pick_main, record.newItem.title);
        // TODO: update to include wider function that adds title and hides duplicates
        // TODO: summon connections for the new scene
        update_plotlines(record.action, record.newItem.item_id, record.newItem.part_of, record.index);
        
    });

    // TODO: simplify by combining with function above
    plotMenu.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Retrieve the submitted data
        let type = this.name;
        let formData = new FormData(this);

        // Close the dialog window
        this.querySelector('.modalClose').dispatchEvent(new Event('click'));

        // Process the data
        var p = process_submitted_item(formData);

        // Update global array and DOM elements
        update_global_array(type, p.data, p.neighbour, p.action);
        update_item_list(type, plotList, p.data, p.neighbour, p.action);

        // TODO record step in history (send record to relevant function)
        // TODO update the canvas
    });

    // ==============================================================================================================================================================
    // Handling paper.js scripts

    //Get a reference for the canvas object
    const canvas = document.getElementById('myCanvas');

    // Create an empty project and a view for the canvas:
    paper.setup(canvas);

    // Needs a separate event listener as paper js doesn't have wheel tool
    byId('myCanvas').addEventListener('wheel', function(event) {
        var newZoom = paper.view.zoom; 
        var oldZoom = paper.view.zoom;
        
        if (event.deltaY < 0) {			
            newZoom = paper.view.zoom * 1.05;
        } else {
            newZoom = paper.view.zoom * 0.95;
        }
        
        var beta = oldZoom / newZoom;
        
        var mousePosition = new paper.Point(event.offsetX, event.offsetY);
        
        //viewToProject: gives the coordinates in the Project space from the Screen Coordinates
        var viewPosition = paper.view.viewToProject(mousePosition);
        
        var mpos = viewPosition;
        var ctr = paper.view.center;
        
        var pc = mpos.subtract(ctr);
        var offset = mpos.subtract(pc.multiply(beta)).subtract(ctr);	
        
        paper.view.zoom = newZoom;
        paper.view.center = paper.view.center.add(offset);
        
        event.preventDefault();
        paper.view.draw();
        // TODO: retrieve zoom factor to display to the user
        // TODO: add support to zoom in/out via sliders/keyboard/buttons
    });

    with (paper) {
        var tool = new Tool();
        tool.onMouseDrag = function(event) {
            var pan_offset = event.point.subtract(event.downPoint);
            paper.view.center = paper.view.center.subtract(pan_offset);
        };
    };

    // Normal scene symbol
    var normalPath = new paper.Path.Circle(new paper.Point(-10, -10), 10);
    symbols.normal = new paper.Symbol(style_symbol(normalPath));

    // Flashback scene symbol
    var flashbackPath = new paper.CompoundPath({
        children: [
            new paper.Path.Circle(new paper.Point(-10, 10), 10),
            new paper.Path.RegularPolygon(new paper.Point(-10, 10), 3, 8).rotate(-90, new paper.Point(-10, 10))
        ]
    });
    symbols.flashback = new paper.Symbol(style_symbol(flashbackPath));

    // Dream scene symbol
    var dreamPath = new paper.CompoundPath({
        children: [
            new paper.Path.Circle(new paper.Point(-10, 10), 10),
            new paper.Path.RegularPolygon(new paper.Point(-10, 10), 5, 3)
        ]
    });
    symbols.dream = new paper.Symbol(style_symbol(dreamPath));

    // Initialise item groups
    allScenes = new paper.Group();
    allConnections = new paper.Group();

    // Set correct rendering hierarchy
    allScenes.insertAbove(allConnections);

    // Load plotline-specific data
    load_plotlines();

    // Loads all the scenes
    projectData.scene.all.forEach(function(value, index) {
        // Create and title the scene
        var scene = summon_scene(value.item_id, index, value.type, value.pick_main, value.title);

        // Add item_id to all plotlines
        for (let i = 0; i < value.part_of.length; i++) {
            plotlines[value.part_of[i]].ids.push(value.item_id);
        };

        // Add object to group
        allScenes.addChild(scene);
    });

    // Load connections
    for (let i = 1; i < projectData.plot.count + 1; i++) {
        if (plotlines[i].ids != 0) {
            for (let j = 0; j < plotlines[i].ids.length + 1; j++) {
                // Selects two visible scenes on plotline and creates a connection
                let coords = find_connection_vertices(j, i);
                let connection = draw_connection(coords.startPoint, coords.finishPoint, i);

                // Adds connection to the group for correct rendering
                allConnections.addChild(connection);

                if (coords.startPoint) {
                    // Make note of the connection to the right of point
                    coords.startPoint.data.right.push(connection.id);
                };
                if (coords.finishPoint) {
                    // Make note of the connection to the left of point
                    coords.finishPoint.data.left.push(connection.id);
                };
            };
        }
    };

    //shift_graph('delete', 3, 3);

    paper.view.draw();

    // ==============================================================================================================================================================
    // Communicating with the server

    saveProject.addEventListener('click', function() {
        fetch("/",
            {
                method: "POST",
                body: JSON
                .stringify
                (projectData),
                headers: {
                  "Content-type": "application/json",
                },
              })
                .then((response) => response.json())
                .then((json) => console.log(json));
    });
};