$(document).ready(function() {

    // Error handler
    const handleError = {
        getAllError: 'Unable to retrieve personnel list from the database',
        searchAllPersonnelError: 'Unable to search for personnel in the database',
        getAllDepartmentsError: 'Unable to retrieve department list from the database',
        getAllLocationsError: 'Unable to retrieve location list from the database',
        getPersonnelByIDError: 'Unable to retrieve personnel record from the database',
        getDepartmentByIDError: 'Unable to retrieve department from the database',
        getLocationByIDError: 'Unable to retrieve location from the database',
        getFKRecordsError: 'Unable to retrieve list of attached records from the database',
        insertUpdatePersonnelError: 'Unable to save personnel data to the database',
        insertUpdateDepartmentError: 'Unable to save department to the database',
        insertUpdateLocationError: 'Unable to save location to the database',
        deletePersonnelByIDError: 'Unable to delete personnel record from the database',
        deleteDepartmentByIDError: 'Unable to delete department from the database',
        deleteLocationByIDError: 'Unable to delete location from the database',
        undefinedError: 'An error occurred',
        raiseError: function(error) {
            $('#error-description').text('').addClass('hide');

            if (error instanceof Error) {
                $('#error-description').html(error.message).removeClass('hide');
            } else if (error.status.description) {
                $('#error-description').html(error.status.description).removeClass('hide');
            }

            // Close any open modals
            $('.modal').modal('hide');

            // Show the error modal
            $('#errorModal').modal('show');

            // Remove the preloader/'busy' spinner in case the app is still initialising
            hideSpinner();
        }
    };

    // Perform a CRUD operation on the database
    const connectDB = ( {action, errorType = 'undefinedError', data = {}} ) => {

        return new Promise((resolve, reject) => {
            $.ajax({
                type: 'POST',
                url: `resources/php/${action}.php`,
                data: data,
                dataType: 'json',
                success: function(response) {

                    if (response.status.name == "OK") {

                        // Additional actions for specific action types
                        switch(action) {

                            case 'getAll':
                            case 'searchAllPersonnel':

                                // Build the personnel table
                                buildPersonnelTable(response);

                                // Close any open modals
                                $('.modal').modal('hide');

                                // Display the table
                                displayTable($('#personnel-table-wrapper'));

                                // Show/hide the fixed icons depending on table scroll position
                                manageFixedIcons();

                                // Set the active navbar menu link to 'Personnel'
                                $('#maintenance-nav').find('.active').removeClass('active');
                                $('#personnel-nav-link').addClass('active');

                                break;

                            case 'insertUpdatePersonnel':
                            case 'deletePersonnelByID':

                                // Show 'success' toast
                                displayToast(response.status.description);

                                // Maintain personnel search results, if search term entered
                                if ($('#personnel-search-input').val()) {
                                    $('#search-personnel-form').submit();
                                } else {

                                    // Get full list of personnel
                                    connectDB( {action: 'getAll', errorType: 'getAllError'} )
                                        .catch((error) => {
                                            handleError.raiseError(error);
                                        });
                                }

                                break;

                            case 'insertUpdateDepartment':
                            case 'deleteDepartmentByID':
                            case 'insertUpdateLocation':
                            case 'deleteLocationByID':

                                if (!('checkFK' in data)) {

                                    // Show 'success' toast
                                    displayToast(response.status.description);

                                    // Refresh the list of records
                                    if (action.indexOf('Department') >= 0) {
                                        $('#departments-nav-link').trigger('click');
                                    } else {
                                        $('#locations-nav-link').trigger('click');
                                    }
                                }

                                break;
                        }

                        resolve(response);

                    } else {
                        reject(response);
                    }
                },
                error: function(error) {
                    reject(new Error(handleError[errorType]));
                }
            });
        })
    };

    // Build the personnel list table
    const buildPersonnelTable = personnel => {

        // Clear the table of any existing rows
        $('#personnel-table tbody').find('tr').remove();

        // Build the table
        $.each(personnel.data.personnel, function (key, person) {
            $('#personnel-table tbody').append(
                `<tr data-id=${person.id}>
                    <th scope="row" class="person-id d-none d-lg-table-cell">${person.id}</th>
                    <td class="person-name"><strong>${person.lastName}</strong>, ${person.firstName}</td>
                    <td class="person-email d-none d-lg-table-cell">${person.email}</td>
                    <td class="person-department d-none d-lg-table-cell">${person.department}</td>
                    <td class="person-location d-none d-lg-table-cell">${person.location}</td>
                    <td class="person-job-title d-none d-lg-table-cell">${person.jobTitle}</td>
                    <td class="td-icon text-end"><i class="personnel fas fa-minus-circle" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-offset="0,10" data-bs-custom-class="tt-delete" title="Delete ${person.lastName}, ${person.firstName}"></td>
                </tr>`
            );
        });

        // Complete post-build actions
        postBuildTable(personnel.data.personnel.length, personnel.data.count, personnel.data.personnel.length < 1);
    };

    // Build the departments list table
    const buildDepartmentsTable = departments => {

        // Clear the table of any existing rows
        $('#departments-table tbody').find('tr').remove();

        // Build the table
        $.each(departments.data.departments, function (key, department) {
            $('#departments-table tbody').append(
                `<tr data-id=${department.id}>
                    <td class="department-name">${department.name}</td>
                    <td class="department-location d-none d-lg-table-cell">${department.location}</td>
                    <td class="td-icon text-end"><i class="departments fas fa-minus-circle" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-offset="0,10" data-bs-custom-class="tt-delete" title="Delete ${department.name}"></td>
                </tr>`
            );
        });

        // Complete post-build actions
        postBuildTable(departments.data.departments.length, departments.data.count, departments.data.departments.length < 1);
    };

    // Build the locations list table
    const buildLocationsTable = locations => {

        // Clear the table of any existing rows
        $('#locations-table tbody').find('tr').remove();

        // Build the table
        $.each(locations.data.locations, function (key, location) {
            $('#locations-table tbody').append(
                `<tr data-id=${location.id}>
                    <td class="location-name">${location.name}</td>
                    <td class="td-icon text-end"><i class="locations fas fa-minus-circle" data-bs-toggle="tooltip" data-bs-placement="left" data-bs-offset="0,10" data-bs-custom-class="tt-delete" title="Delete ${location.name}"></td>
                </tr>`
            );
        });

        // Complete post-build actions
        postBuildTable(locations.data.locations.length, locations.data.count, locations.data.locations.length < 1);
    };

    // Actions to complete after any table is built
    const postBuildTable = (count, total, noResults) => {

        // Update the footer row count
        $('#personnel-row-count').text(`Displaying ${count} of ${total} records`);

        // If no results found, show an info modal
        if (noResults) $('#searchNoMatchModal').modal('show');
    };

    // Display a table and hide all other tables
    const displayTable = table => {

        $('.table-wrapper').addClass('hide');
        $(table).removeClass('hide');
    
        // Set the tooltip text for the 'Add Record' fixed icon
        switch($(table).attr('id')) {

            case 'personnel-table-wrapper':
                $('#add-record-icon-fixed').attr('title', 'Add Personnel');
                break;
            case 'departments-table-wrapper':
                $('#add-record-icon-fixed').attr('title', 'Add Department');
                break;
            case 'locations-table-wrapper':
                $('#add-record-icon-fixed').attr('title', 'Add Location');
                break;
            default:
                handleError.raiseError(new Error(handleError['undefinedError']));
        }

        // Initialise tooltips for dynamically created/modified elements
        initialiseTooltips();
    };

    // Display a toast
    const displayToast = text => {

        $('#success-toast-text').text(text);
        $('#successToast').toast('show');
    };

    // Set the 'Confirm' modal's target element so it knows where to return after closing
    const setConfirmReturn = element => {
        $('#confirm-no').add('#confirm-close').attr('data-bs-toggle', 'modal').attr('data-bs-target', `#${element}`);
    };

    // Show the fixed icons when scrolling down a table, hide them at the top
    const manageFixedIcons = () => {

        if ($('.table-wrapper').not('.hide').scrollTop() > 50 && !$('.icon-fixed').hasClass('.icon-fixed-grow')) {
            $('.icon-fixed').addClass('icon-fixed-grow');
        } else if ($('.table-wrapper').not('.hide').scrollTop() <= 50) {
            $('.icon-fixed').removeClass('icon-fixed-grow');
        }    
    };

    // Build a link to fetch foreign key related records
    const buildFKLink = (id, table, text, count) => {

        return $(document.createElement('a'))
            .attr({
                tabindex: '0',
                class: 'fkPopover',
                title: 'Still attached...',
                'data-table': table,
                'data-id': id,
                'data-bs-toggle': 'popover',
                'data-bs-placement': 'top',
                'data-bs-trigger': 'focus',
                'data-bs-content': ''
            })
            .text(count + ' ' + text);
    };

    // Check if app is running on a touch-screen device
    const isTouchDevice = () => {
        return ('ontouchstart' in window);
    };

    // Initialise Bootstrap tooltips for non-touch-screen devices
    const initialiseTooltips = () => {
        if (!isTouchDevice()) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    };

    // Hide the preloader/'busy' spinner
    const hideSpinner = () => {
        $('#preloader').fadeOut('fast', function() {

            // Give preloader transparent background after app has loaded for subsequent appearances as a 'busy' spinner
            $('#preloader').removeClass('preloader-init');
        });
    };

    /* ============================================= */
    /* SET UP EVENT LISTENERS */
    /* ============================================= */

    /* ============== */
    /* GENERAL EVENTS */
    /* ============== */

    // Show the 'busy' spinner during an AJAX call
    $(document).on('ajaxStart', function() {
        $('#preloader').show();
    }).on('ajaxComplete', function() {
        hideSpinner();
    });

    // Click 'Scroll To Top' fixed icon
    $('#backtop-icon-fixed').on('click', function() {

        // Close any open tooltips
        $('.tooltip').tooltip('hide');

        $('.table-wrapper').not('.hide').animate({ scrollTop: 0 }, 'fast');
    });

    /* ============ */
    /* TABLE EVENTS */
    /* ============ */

    // Scroll a table
    $('.table-wrapper').on('scroll', function() {

        // Show the fixed icons when scrolling down, hide them at the top
        manageFixedIcons();
    });

    // Click a column sort button
    $('.sort').on('click', function() {

        const table = $(this).closest('table').attr('id');
        let sortAttributes = {};

        // Determine the column name to order by
        let orderBy = $(this).attr('id').substr($(this).attr('id').lastIndexOf('-') + 1, $(this).attr('id').length);

        // Set the ordering and direction
        switch(table) {

            case 'personnel-table':

                orderBy = orderBy === 'lastName' ? `${orderBy} ${$(this).attr('data-sort')}, department, location` : `${orderBy} ${$(this).attr('data-sort')}, lastName`;
                sortAttributes = {
                    action: 'getAll',
                    errorType: 'gettAllError'
                };
                break;

            case 'departments-table':

                orderBy = orderBy === 'location' ? `${orderBy} ${$(this).attr('data-sort')}, name` : `${orderBy} ${$(this).attr('data-sort')}, location`;
                sortAttributes = {
                    action: 'getAllDepartments',
                    errorType: 'getAllDepartmentsError'
                };
                break;

            case 'locations-table':

                orderBy = `${orderBy} ${$(this).attr('data-sort')}`;
                sortAttributes = {
                    action: 'getAllLocations',
                    errorType: 'getAllLocationsError'
                };
                break;

            default:
                handleError.raiseError(new Error(handleError['undefinedError']));
        }

        // Rebuild the table with ordering

        if (table === 'personnel-table' && $('#personnel-search-input').val()) {

            // Maintain search results when sorting personnel table

            connectDB({
                action: 'searchAllPersonnel',
                errorType: 'searchAllPersonnelError',
                data: {
                    search: $('#personnel-search-input').val(),
                    orderBy: orderBy
                }
            })
                .catch((error) => {
                    handleError.raiseError(error);
                });

        } else {

            connectDB({
                action: sortAttributes.action,
                errorType: sortAttributes.errorType,
                data: {
                    orderBy: orderBy
                }
            })
                .then((response) => {

                    if (table === 'departments-table' || table === 'locations-table') {

                        // Build the table
                        if (table === 'departments-table') {
                            buildDepartmentsTable(response);
                        } else if (table === 'locations-table') {
                            buildLocationsTable(response);
                        }

                        // Display the table
                        displayTable($(this).closest('.table-wrapper'));
                    }
                })
                .catch((error) => {
                    handleError.raiseError(error);
                });
        }

        // Toggle the sort direction for the clicked column
        const sortDirection = $(this).attr('data-sort') === 'ASC' ? 'DESC' : 'ASC';
        $(this).attr('data-sort', sortDirection);

        // Close any open tooltips
        $('.tooltip').tooltip('hide');
    });

    // Click a table row (update or delete a record)
    // Delegate click event to the table row
    $('.table-wrapper').on('click', 'tr', function(e) {

        const clickedTable = $(this).closest('.table-wrapper').attr('id').substr(0, $(this).closest('.table-wrapper').attr('id').indexOf('-'));
        let updateAttributes = {};

        if ($.inArray('fas', e.target.classList) < 0 && e.currentTarget.parentElement.nodeName.toLowerCase() !== 'thead') {

            // A row was clicked (excluding clicks on table header row and 'Delete Record' icon)
            // *** UPDATE RECORD BY ID ***

            switch(clickedTable) {

                case 'personnel':
                    updateAttributes = {
                        form: $('#personnel-form')[0],
                        dropdown: $('#personnel-department').children(),
                        modal: $('#personnelModal'),
                        action: 'getPersonnelByID',
                        errorType: 'getPersonnelByIDError'
                    };
                    break;

                case 'departments':
                    updateAttributes = {
                        form: $('#department-form')[0],
                        dropdown: $('#department-location').children(),
                        modal: $('#departmentModal'),
                        action: 'getDepartmentByID',
                        errorType: 'getDepartmentByIDError'
                    };
                    break;

                case 'locations':
                    updateAttributes = {
                        form: $('#location-form')[0],
                        modal: $('#locationModal'),
                        action: 'getLocationByID',
                        errorType: 'getLocationByIDError'
                    };
                    break;

                default:
                    handleError.raiseError(new Error(handleError['undefinedError']));
            }

            // Clear the form
            updateAttributes.form.reset();
            if ('dropdown' in updateAttributes) updateAttributes.dropdown.remove();

            // Get record by ID
            connectDB({
                action: updateAttributes.action,
                errorType: updateAttributes.errorType,
                data: {
                    id: $(this).attr('data-id')
                }
            })
                .then((response) => {

                    switch(clickedTable) {

                        // Build the 'Update Personnel' modal content
                        case 'personnel':

                            // Build the dropdown list for department selection
                            $.each(response.data.department, function (key, department) {
                                $('#personnel-department').append($('<option></option>').attr({
                                    value: department.id,
                                    'data-location': department.location
                                }).text($.parseHTML(department.name)[0]["textContent"]));
                            });

                            // Populate the form to view/edit the personnel record
                            $('#update-personnel-id').val(response.data.personnel[0]["id"]);
                            if (response.data.personnel[0]["firstName"] && response.data.personnel[0]["lastName"]) {
                                $('#update-personnel-name').val(`${$.parseHTML(response.data.personnel[0]["lastName"])[0]["textContent"]}, ${$.parseHTML(response.data.personnel[0]["firstName"])[0]["textContent"]}`);
                                updateAttributes.modalTitleText = $('#update-personnel-name').val();
                            }
                            if (response.data.personnel[0]["firstName"]) $('#personnel-first-name').val($.parseHTML(response.data.personnel[0]["firstName"])[0]["textContent"]);
                            if (response.data.personnel[0]["lastName"]) $('#personnel-last-name').val($.parseHTML(response.data.personnel[0]["lastName"])[0]["textContent"]);
                            if (response.data.personnel[0]["email"]) $('#personnel-email').val($.parseHTML(response.data.personnel[0]["email"])[0]["textContent"]);
                            $('#personnel-department').val(response.data.personnel[0]["departmentID"]);
                            $('#personnel-location').val($.parseHTML($('#personnel-department option:selected').attr('data-location'))[0]["textContent"]);
                            if (response.data.personnel[0]["jobTitle"]) $('#personnel-job-title').val($.parseHTML(response.data.personnel[0]["jobTitle"])[0]["textContent"]);

                            break;

                        // Build the 'Update Department' modal content
                        case 'departments':

                            // Build the dropdown list for location selection
                            $.each(response.data.locations, function (key, location) {
                                $('#department-location').append($('<option></option>').attr({
                                    value: location.id
                                }).text($.parseHTML(location.name)[0]["textContent"]));
                            });

                            // Populate the form to view/edit the department record
                            $('#update-department-id').val(response.data.department[0]["id"]);
                            if (response.data.department[0]["name"]) {
                                $('#update-department-name').val($.parseHTML(response.data.department[0]["name"])[0]["textContent"]);
                                updateAttributes.modalTitleText = $('#update-department-name').val();
                            }
                            if (response.data.department[0]["name"]) $('#department-name').val($.parseHTML(response.data.department[0]["name"])[0]["textContent"]);
                            $('#department-location').val(response.data.department[0]["locationID"]);

                            break;

                        // Build the 'Update Location' modal content
                        case 'locations':

                            // Populate the form to view/edit the location record
                            $('#update-location-id').val(response.data.location[0]["id"]);
                            if (response.data.location[0]["name"]) {
                                $('#update-location-name').val($.parseHTML(response.data.location[0]["name"])[0]["textContent"]);
                                updateAttributes.modalTitleText = $('#update-location-name').val();
                            }
                            if (response.data.location[0]["name"]) $('#location-name').val($.parseHTML(response.data.location[0]["name"])[0]["textContent"]);

                            break;

                        default:
                            handleError.raiseError(new Error(handleError['undefinedError']));
                    }

                    // Set the modal title and buttons
                    $('.modal-title-add-record').addClass('hide');
                    $('.modal-title-update-record').text(`Edit ${updateAttributes.modalTitleText}`).removeClass('hide');
                    $('.btn-save').text('Update');

                    // Open the modal
                    updateAttributes.modal.modal('show');
                })
                .catch((error) => {
                    handleError.raiseError(error);
                });

        } else if ($.inArray('fas', e.target.classList) > 0 && e.currentTarget.parentElement.nodeName.toLowerCase() !== 'thead') {

            // A 'Delete Record' icon was clicked
            // *** DELETE RECORD BY ID ***

            let dataAction, titleText;

            if (clickedTable === 'personnel') {
                dataAction = 'deletePersonnelByID';
                titleText = $(this).find('.person-name').text();
            } else if (clickedTable === 'departments') {
                dataAction = 'deleteDepartmentByID';
                titleText = $(this).find('.department-name').text();
            } else if (clickedTable === 'locations') {
                dataAction = 'deleteLocationByID';
                titleText = $(this).find('.location-name').text();
            }

            // Set the attributes for the 'Confirm delete' modal
            $('#confirm-yes').attr({ 'data-action': dataAction, 'data-id': $(this).attr('data-id') });
            $('#confirm-modal-title').text(`Delete ${titleText}`);

            // If deleting department or location, check for related records before showing 'Confirm delete' modal
            if (dataAction === 'deleteDepartmentByID' || dataAction === 'deleteLocationByID') {

                connectDB({
                    action: dataAction,
                    errorType: `${dataAction}Error`,
                    data: {
                        id: $(this).attr('data-id'),
                        checkFK: true
                    }
                })
                    .then(() => {
                        $('#confirmModal').modal('show');
                    })
                    .catch((error) => {

                        if (error.data) {

                            // Build error text containing the link to the foreign key records and raise an error
                            const fkLink = buildFKLink(error.data.id, error.data.table, error.data.text, error.data.count);
                            const errorText = error.status.description.replace(error.data.table, fkLink[0].outerHTML);
                            handleError.raiseError(new Error(errorText));
                        } else {
                            handleError.raiseError(error);
                        }
                    });
            } else {
                $('#confirmModal').modal('show');
            }
        }
    });

    // Click 'Add Record' column icon (table list view) or fixed 'Add Record' icon
    $('.td-icon').add('#add-record-icon-fixed').on('click', function() {

        // Set the modal title and buttons
        $('.modal-title-update-record').addClass('hide');
        $('.modal-title-add-record').removeClass('hide');
        $('.btn-save').text('Save');

        if (!$('#personnel-table-wrapper').hasClass('hide')) {

            // 'Add Personnel'

            // Clear the modal's form
            $('#personnel-form')[0].reset();
            $('#personnel-department').children().remove();

            // Get all available departments
            connectDB( {action: 'getAllDepartments', errorType: 'getAllDepartmentsError'} )
            .then((departments) => {

                // Build the dropdown list for department selection
                $.each(departments.data.departments, function (key, department) {
                    $('#personnel-department').append($('<option></option>').attr({
                        value: department.id,
                        'data-location': department.location
                    }).text($.parseHTML(department.name)[0]["textContent"]));
                });

                // Populate the read-only location of the defaulted department
                $('#personnel-location').val($.parseHTML($('#personnel-department option:selected').attr('data-location'))[0]["textContent"]);

                // Open the modal
                $('#personnelModal').modal('show');
            })
            .catch((error) => {
                handleError.raiseError(error);
            });

        } else if (!$('#departments-table-wrapper').hasClass('hide')) {

            // 'Add Department'

            // Clear the modal's form
            $('#department-form')[0].reset();
            $('#department-location').children().remove();

            // Get all available locations
            connectDB( {action: 'getAllLocations', errorType: 'getAllLocationsError'} )
            .then((locations) => {

                // Build the dropdown list for location selection
                $.each(locations.data.locations, function (key, location) {
                    $('#department-location').append($('<option></option>').attr({
                        value: location.id
                    }).text($.parseHTML(location.name)[0]["textContent"]));
                });

                // Open the modal
                $('#departmentModal').modal('show');
            })
            .catch((error) => {
                handleError.raiseError(error);
            });

        } else if (!$('#locations-table-wrapper').hasClass('hide')) {

            // 'Add Location'

            // Clear the modal's form
            $('#location-form')[0].reset();

            // Open the modal
            $('#locationModal').modal('show');
        }
    });

    /* ============ */
    /* MODAL EVENTS */
    /* ============ */

    // Open any modal
    $('.modal').on('shown.bs.modal', function() {

        // Close any open tooltips
        $('.tooltip').tooltip('hide');

        // Hide the fixed icons
        $('.icon-fixed').removeClass('icon-fixed-grow');

        // Set initial focus to the first element of a form
        $('form :input:enabled:visible:first', this).focus();
    });

    // Close any modal
    $('.modal').on('hidden.bs.modal', function() {

        // Show the fixed icons if the scroll position of the active table is not at the top
        if ($('.table-wrapper').not('.hide').scrollTop() > 50) {
            $('.icon-fixed').addClass('icon-fixed-grow');
        }
    });

    // Click 'Add/Edit' modal's 'Save/Update' button
    $('#personnel-form').add('#department-form').add('#location-form').on('submit', function(e) {

        e.preventDefault();
        let confirmAttributes = {};

        // Set the 'Confirm' modal's target element so it knows where to return after closing
        setConfirmReturn($(this).closest('.modal').attr('id'));

        switch($(this).attr('id').substr(0, $(this).attr('id').indexOf('-'))) {

            case 'personnel':
                confirmAttributes = {
                    action: 'insertUpdatePersonnel',
                    addTitle: `${$('#personnel-last-name').val()}, ${$('#personnel-first-name').val()}`,
                    updateTitle: $('#update-personnel-name').val()
                };
                break;

            case 'department':
                confirmAttributes = {
                    action: 'insertUpdateDepartment',
                    addTitle: $('#department-name').val(),
                    updateTitle: $('#update-department-name').val()
                };
                break;

            case 'location':
                confirmAttributes = {
                    action: 'insertUpdateLocation',
                    addTitle: $('#location-name').val(),
                    updateTitle: $('#update-location-name').val()
                };
                break;

            default:
                handleError.raiseError(new Error(handleError['undefinedError']));
        }

        // Set the title for the 'Confirm' modal
        if ($(this).closest('.modal-content').children('.modal-footer').children('.btn-save').text() === 'Save') {
            $('#confirm-modal-title').text(`Add ${confirmAttributes.addTitle}`);
        } else if ($(this).closest('.modal-content').children('.modal-footer').children('.btn-save').text() === 'Update') {
            $('#confirm-modal-title').text(`Update ${confirmAttributes.updateTitle}`);
        }

        $('#confirm-yes').attr('data-action', confirmAttributes.action);

        $($(this).closest('.modal')).modal('hide');
        $('#confirmModal').modal('show');
    });

    // Click the 'attached records list' link on the error modal
    $('#errorModal').on('click', '.fkPopover', function() {

        // Get the list of records still attached
        $.ajax({
            type: 'POST',
            url: 'resources/php/getFKRecords.php',
            data: {
                id: $(this).attr('data-id'),
                table: $(this).attr('data-table')
            },
            dataType: 'json',
            success: function(response) {

                if (response.status.name == "OK") {

                    // Set the content for the 'Still attached' popover, initialise it and display it
                    $('.fkPopover').attr('data-bs-content', response.data.attached.join('<br>'));
                    $('.fkPopover').popover({ html: true });
                    $('.fkPopover').popover('show');

                } else {
                    handleError.raiseError(response);
                }
            },
            error: function(error) {
                handleError.raiseError(new Error(handleError['getFKRecordsError']));
            }
        });        
    });

    /* ================ */
    /* NAVBAR EVENTS */
    /* ================ */

    // Show 'close' menu icon on mobile when navbar is expanded
    // Show 'hamburger' menu icon on mobile when navbar is collapsed
    $('#maintenance-nav').on('shown.bs.collapse', function() {
        $('.navbar-toggler-icon').addClass('navbar-expanded');
    }).on('hidden.bs.collapse', function() {
        $('.navbar-toggler-icon').removeClass('navbar-expanded');
    });

    // Navbar menu starts to expand or collapse on mobile - animate the icon
    $('#maintenance-nav').on('show.bs.collapse', function() {
        $('.navbar-toggler-icon').addClass('rotate');
    }).on('hide.bs.collapse', function() {
        $('.navbar-toggler-icon').removeClass('rotate');
    });

    // Click any navbar menu link
    $('.nav-link').on('click', function(e) {

        let attributes = {};
        e.preventDefault();

        // Determine which menu link was clicked
        switch($(this).attr('id')) {

            case 'personnel-nav-link':

                attributes = {
                    action: 'getAll',
                    errorType: 'getAllError',
                    table: $('#personnel-table-wrapper')
                };
                break;

            case 'departments-nav-link':

                attributes = {
                    action: 'getAllDepartments',
                    errorType: 'getAllDepartmentsError',
                    table: $('#departments-table-wrapper')
                };
                break;

            case 'locations-nav-link':

                attributes = {
                    action: 'getAllLocations',
                    errorType: 'getAllLocationsError',
                    table: $('#locations-table-wrapper')
                };
                break;

            default:
                handleError.raiseError(new Error(handleError['undefinedError']));
        }

        // Retrieve data and display relevant table
        connectDB( {action: attributes.action, errorType: attributes.errorType} )
            .then((response) => {

                if (attributes.action === 'getAllDepartments') {
                    buildDepartmentsTable(response);
                } else if (attributes.action === 'getAllLocations') {
                    buildLocationsTable(response);
                }

                // Close any open modals
                $('.modal').modal('hide');

                // Reset the search form
                $('#search-personnel-form')[0].reset();

                // Set the active menu link
                $('#maintenance-nav').find('.active').removeClass('active');
                $(this).addClass('active');

                // Display the table
                displayTable(attributes.table);

                // Show/hide the fixed icons depending on table scroll position
                manageFixedIcons();

                // Collapse the navbar in mobile view
                $('.navbar-collapse').collapse('hide');
            })
            .catch((error) => {
                handleError.raiseError(error);
            });
    });

    /* ================ */
    /* PERSONNEL EVENTS */
    /* ================ */

    // Change 'Add/Edit Personnel' modal 'Department' dropdown
    $('#personnel-department').on('change', function() {

        // Populate the read-only location for this department
        $('#personnel-location').val($.parseHTML($('option:selected', this).attr('data-location'))[0]["textContent"]);
    });

    // Submit a personnel search query
    $('#search-personnel-form').on('submit', function(e) {

        e.preventDefault();
        connectDB({
            action: 'searchAllPersonnel',
            errorType: 'searchAllPersonnelError',
            data: {
                search: $('#personnel-search-input').val()
            }
        })
            .catch((error) => {
                handleError.raiseError(error);
            });
    });

    // Click 'Refresh Personnel' button
    $('#personnel-refresh-button').on('click', function() {

        // Get all personnel and refresh the list
        connectDB( {action: 'getAll', errorType: 'getAllError'} )
            .then(() => {

                // Close any open tooltips and clear the search form
                $('.tooltip').tooltip('hide');
                $('#search-personnel-form')[0].reset();
            })
            .catch((error) => {
                handleError.raiseError(error);
            });
    });

    /* ===================== */
    /* CONFIRM ACTION EVENTS */
    /* ===================== */

    // Open 'Confirm' modal
    $('#confirmModal').on('show.bs.modal', function() {

        // Enable the 'Yes' button
        $('#confirm-yes').removeClass('disabled');
    });

    // Close 'Confirm' modal
    $('#confirmModal').on('hidden.bs.modal', function() {

        // Remove modal toggle/target attributes
        // Only needed here when explicitly set by other modals that require control returned to them
        $('#confirm-no').add('#confirm-close').removeAttr('data-bs-toggle').removeAttr('data-bs-target');

        // Remove any other attributes from the last action 
        $('#confirm-yes').removeAttr('data-action').removeAttr('data-id');
        $('#confirm-modal-title').text('Confirm');
    });

    // Click 'Confirm' modal 'Yes' button
    $('#confirm-yes').on('click', function() {

        // Disable the 'Yes' button to prevent multiple clicks
        $('#confirm-yes').addClass('disabled');

        // Take action based on the ID and/or action type set by the calling element
        switch($('#confirm-yes').attr('data-action')) {

            case 'insertUpdatePersonnel':
                connectDB({
                    action: 'insertUpdatePersonnel',
                    errorType: 'insertUpdatePersonnelError',
                    data: {
                        id: $('#update-personnel-id').val(),
                        firstName: $('#personnel-first-name').val(),
                        lastName: $('#personnel-last-name').val(),
                        jobTitle: $('#personnel-job-title').val(),
                        email: $('#personnel-email').val(),
                        departmentID: $('#personnel-department').val()
                    }
                })
                    .catch((error) => {
                        handleError.raiseError(error);
                    });
                break;

            case 'insertUpdateDepartment':
                connectDB({
                    action: 'insertUpdateDepartment',
                    errorType: 'insertUpdateDepartmentError',
                    data: {
                        id: $('#update-department-id').val(),
                        name: $('#department-name').val(),
                        locationID: $('#department-location').val()
                    }
                })
                    .catch((error) => {
                        handleError.raiseError(error);
                    });
                break;

            case 'insertUpdateLocation':
                connectDB({
                    action: 'insertUpdateLocation',
                    errorType: 'insertUpdateLocationError',
                    data: {
                        id: $('#update-location-id').val(),
                        name: $('#location-name').val()
                    }
                })
                    .catch((error) => {
                        handleError.raiseError(error);
                    });
                break;

            case 'deletePersonnelByID':
            case 'deleteDepartmentByID':
            case 'deleteLocationByID':
                connectDB({
                    action: $('#confirm-yes').attr('data-action'),
                    errorType: `${$('#confirm-yes').attr('data-action')}Error`,
                    data: {
                        id: $('#confirm-yes').attr('data-id')
                    }
                })
                    .catch((error) => {

                        // Check if error is due to department/location foreign key relationships
                        if (($('#confirm-yes').attr('data-action') === 'deleteDepartmentByID' || $('#confirm-yes').attr('data-action') === 'deleteLocationByID') && error.data) {

                            // Build error text containing the link to the foreign key records and raise an error
                            const fkLink = buildFKLink(error.data.id, error.data.table, error.data.text, error.data.count);
                            const errorText = error.status.description.replace(error.data.table, fkLink[0].outerHTML);
                            handleError.raiseError(new Error(errorText));

                        } else {
                            handleError.raiseError(error);
                        }
                    });
                break;
        
            default:
                handleError.raiseError(new Error(handleError['undefinedError']));
        }
    });

    /* ============================================= */
    /* START THE APP */
    /* ============================================= */

    // Build the company personnel table for initial app view
    connectDB( {action: 'getAll', errorType: 'getAllError'} )
        .catch((error) => {
            handleError.raiseError(error);
        });

});