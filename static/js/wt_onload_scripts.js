// File requires a loaded wt_general_functions.js

window.onload = function() {
    // ==============================================================================================================================================================
    // Assigning DOM elements to variables

    console.log("loaded");
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
    projectData.plot.active = shuttle;
    projectData.scene.active = shuttle;
    console.log(projectData.scene.active);

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

        load_options(labels, mainPlot, 'value', 'innerHTML', null);
    });

    // Delete selected scene
    deleteScene.addEventListener('click', function() {
        // CAN BE OPTIMISED - same code as for edit scene
        let id = projectData.scene.active.querySelector('.item_id').innerHTML;
        let item = projectData.scene.all.find(item => item.item_id == id);
        update_global_array('scene', item, null, 'delete');
        update_item_list('scene', sceneList, item, null, 'delete');
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
        console.log(this.querySelector('.modalClose'));
        this.querySelector('.modalClose').dispatchEvent(new Event('click'));

        // Process the data
        var p = process_submitted_item(formData);

        // Update global array and DOM elements
        update_global_array(type, p.data, p.neighbour, p.action);
        update_item_list(type, sceneList, p.data, p.neighbour, p.action);

        // TODO record step in history (send record to relevant function)
        // TODO update the canvas
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