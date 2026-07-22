let totalItems = localStorage.getItem("totalItems") || 0;
let itemsPerPage = 20;
let pages ;

/*const urlParams = new URLSearchParams(window.location.search);
let currentPage = parseInt(urlParams.get('page')) || 1;*/

/*function getTenant() {
    var cookies = document.cookie.split(";");
    for  (var i = 0 ; i < cookies.length ; i++) {
        var coo = cookies[i].split("=");
        if (coo[0].trim() == "tenant") {
            return coo[1].replaceAll('"', "").split(" ")[0];
        }
    }
}*/

function getTenant(){
    const tenant = localStorage.getItem("tenant");
    if (tenant && typeof tenant === "string" && tenant.trim() !== "" &&
        tenant !== "null" && tenant !== "undefined") {
        return tenant.trim();
    }
    return "default";
}

$(document).ready(function () {
    var interval = null;
    $(".auto_refresh_dropdown").change(function () {

        clearInterval(interval);
        if (parseInt($(this).val()) > 1000) {
            interval = setInterval(function () {
                showLogs();
            }, parseInt($(this).val()));
        }
    });
});

function showLogs() {
    let serviceName = getTenant();
    if ("#" != getQueryVariable("serviceName")) {
        serviceName = getQueryVariable("serviceName");
    }
    $("#logFile").html("Log file: " + serviceName + ".log");

    asyncRestRequest(
        "/packages.middleware.pub.server.browse.serviceLogs.main?numberOfLines=" + $("#number_of_lines").val() + "&serviceName=" + serviceName,
        "",
        "GET",
        function(payload) {
            var serverLogs = "";
            for (var i = 0 ; i < payload.logs.length ; i++) {
                serverLogs += payload.logs[i] + "\n";
            }
            $("#logs").val("");
            $("#logs").val(serverLogs);
        },
        function(errormessage) {
           swal({
                title: 'Error',
                text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                type: 'error', // or icon: 'error' if you're using SweetAlert2
                confirmButtonColor: '#f2533e' // Red shade
          });

            $("#logs").val("Error fetching logs.");
        }
    );
}

jQuery(document).ready(function() {
    $('#mkp-wrapper').addClass("grid-view");
    $('#gridViewButton').addClass("active");

    $('#gridViewButton').on('click', function() {
        localStorage.setItem("market-place-view-type", "Grid view");
        $('#mkp-wrapper').removeClass("list-view");
        $('#mkp-wrapper').addClass("grid-view");

        $('#gridViewButton').addClass("active");
        $('#listViewButton').removeClass("active");
    });

    $('#listViewButton').on('click', function() {
        localStorage.setItem("market-place-view-type", "List view");
        $('#mkp-wrapper').removeClass("grid-view");
        $('#mkp-wrapper').addClass("list-view");

        $('#listViewButton').addClass("active");
        $('#gridViewButton').removeClass("active");
    });
});








function openPluginWorkspace(packageName) {
    if (packageName) {
        location.href = "middleware/pub/server/ui/workspace/web/workspace.html?sfocus=files/" + packageName;
    } else {
        console.error('Package name not available for Open button.');
    }
}

/*$("#search-on-market").keyup(function () {
    let apiData = JSON.parse(localStorage.getItem("apiData"));

    let searchableData = [];

    for (let i = 0 ; i < apiData.marketplace.plugins.length ; i++) {
        if (apiData.marketplace.plugins[i].name.toUpperCase().includes($(this).val().toUpperCase())) {
            searchableData.push(apiData.marketplace.plugins[i]);
        }
    }

    updatePageWithApiData({
        marketplace: {
            plugins: searchableData
        }
    })
});*/

let REQUIRED_SEARCH_V_CHANGE = false;

function updatePageWithApiData(apiData) {
    const mkpWrapper = document.getElementById('mkp-wrapper');

    if (!mkpWrapper) {
        console.error('Element with ID "mkp-wrapper" not found.');
        return;
    }

    const plugins = apiData.marketplace.plugins;

    if (!plugins || plugins.length === 0) {
        //console.error('No plugins found in the API response.');
        mkpWrapper.innerHTML = '';
        $(".no_plugin").show();
        return;
    } else {
        $(".no_plugin").hide();
    }

    mkpWrapper.innerHTML = '';

    if (plugins.length <= 2 && false) {
        REQUIRED_SEARCH_V_CHANGE = $("#contentview").val() == "Grid view";
        $('#mkp-wrapper').removeClass("grid-view");
        $('#mkp-wrapper').addClass("list-view");
    } else if (REQUIRED_SEARCH_V_CHANGE) {
        $('#mkp-wrapper').removeClass("list-view");
        $('#mkp-wrapper').addClass("grid-view");
        REQUIRED_SEARCH_V_CHANGE = false;
    }

    plugins.forEach(plugin => {
        const buttonType = getButtonType(plugin);
        const lastUpdatedDate = new Date(plugin.modified_on);

        const dateOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        const formattedDate = lastUpdatedDate.toLocaleDateString('en-US', dateOptions);

        let itemHtml = '<div class="mkp-content-wrap">' + '<div class="mkp-title-wrap"><div class="mkp-image-wrap">';

        if (null == plugin.service) {
            itemHtml += (plugin.name.slice(0, 1).toUpperCase());
        } else {
            itemHtml += '<img src="https://repo.syncloop.com/logo/logo_' + plugin.service + '.svg" />';
        }

        itemHtml += '</div>' +
            '<a class="mkp-title" href="middleware/pub/server/ui/workspace/web/marketplace-detail.html?plugin=' + plugin.unique_id +'">' + plugin.name + '</a>' +
            '<span class="button-type" style="display: none;">' + buttonType + '</span>' +
            '</div>' +
            '<p class="mkp-discription">' + plugin.short_description + '</p>' +
            '<div class="tag-list">' + plugin.tags.map(tag => '<span>' + tag + '</span>').join('') + '</div>' +
            '<p class="text-gray lastUpdateDate">Last Updated on ' + formattedDate + '</p>' +
            '<button type="button" class="mkp-button mkp-btn-primary installButton" data-name="' + plugin.name + '" data-pluginid="' + plugin.unique_id + '" data-version="' + plugin.latest_version + '" style="' + (!plugin.installed ? 'display: block;' : 'display: none;') + '" id="install-' + plugin.unique_id + '">Install</button>' +
            '<button type="button" class="mkp-button mkp-btn-border" data-pluginid="' + plugin.unique_id + '" data-version="' + plugin.latest_version + '" style="' + (plugin.installed && plugin.requiredUpdate ? 'display: block;' : 'display: none;') + '" id="update-' + plugin.unique_id + '">Update</button>' +
            '<button type="button" class="mkp-button mkp-btn-gray openButton" onclick="openPluginWorkspace(\'' + plugin.installing_path + '\')" data-packagename="' + (plugin.installed ? plugin.installing_path : '') + '" style="' + (plugin.installed && !plugin.requiredUpdate ? 'display: block;' : 'display: none;') + '" id="open-' + plugin.unique_id + '">Open</button>' +
            '</div>';
        mkpWrapper.innerHTML += itemHtml;
    });


    $(".installButton").click(function () {
        const pluginId = $(this).data("pluginid");
        const version = $(this).data("version");
        const name = $(this).data("name");

        const ref = this;
        const token = crypto.randomUUID();

        const bar = document.getElementById('progressBar');
        const percentage = document.getElementById('percentage');

        let poller = null;

        function stopPolling() {
            if (poller) clearInterval(poller);
        }

        function showFinalPopup() {
            setTimeout(() => {
               swal({
                    title: "Installed",
                    text: "Plugin installed successfully",
                    type: "success", // or icon: "success" for SweetAlert2
                    confirmButtonColor: "#2C61F5" // Optional custom blue color
                 });

                $("#install-" + pluginId).hide();
                $("#open-" + pluginId).show();
                $(ref).html("Install").removeClass("disabled");
            }, 500);
        }

        function showErrorPopup(msg) {
            setTimeout(() => {
                swal({
                    title: "Error",
                    text: msg || "Error installing plugin",
                    type: "error",
                    confirmButtonColor: "#f2533e"  // red tone
                });

                $(ref).html("Install").removeClass("disabled");
            }, 800);
        }

        function startPolling(token) {
            const tenant = localStorage.getItem("tenant") || "default";
            const accessToken = localStorage.getItem("AuthToken");

            poller = setInterval(() => {
                const url =
                    window.ENV.API_BASE_URL +
                    "/tenant/" + tenant +
                    "/packages.middleware.pub.platform.checkPollingPluginStatus.main" +
                    "?token=" + encodeURIComponent(token) +
                    "&access_token=" + encodeURIComponent(accessToken);

                fetch(url)
                    .then(res => res.json())
                    .then(data => {
                        if (data.response.status === "COMPLETED_SUCCESS") {
                            stopPolling();
                            showFinalPopup();
                        } else if (data.response.status === "COMPLETED_ERROR") {
                            stopPolling();
                            showErrorPopup();
                        }
                    })
                    .catch(() => {
                        stopPolling();
                        showErrorPopup();
                    });
            }, 5000);
        }

        swal({
            title: "Do you want to install '" + name + "'?",
            text: "",
            type: "info",
            showCancelButton: true,
            confirmButtonColor: "#2C61F5",
            cancelButtonText: "No, cancel it !!",
            confirmButtonText: "Yes, install it !!",
            showLoaderOnConfirm: true,
            closeOnConfirm: false,
            closeOnCancel: true
        }, function (isConfirm) {
            if (isConfirm) {
                $(ref).html("Installing...").addClass("disabled");

                    var apiUrl = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.platform.installAPlugin.main";
                    var queryParams = `?pluginId=${encodeURIComponent(pluginId)}&version=${encodeURIComponent(version)}&token=${encodeURIComponent(token)}`;
                    $.ajax({
                        type: "POST",
                        url: apiUrl + queryParams,
                        headers: {
                            "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`,
                            'Content-Type': 'application/json',
                        },
                        success: function (response) {
                        },
                        error: function () {
                        }
                    });
                startPolling(token);
                }
            });
    });
}

async function checkPluginStatus(plugin) {
    var apiUrl = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.platform.checkPluginStatusAPI.main";

    try {
        const response = await $.ajax({
            type: 'POST',
            url: apiUrl,
            headers: { "Authorization": `Bearer ${localStorage.getItem("AuthToken")}` },
            contentType: 'application/json',
            data: JSON.stringify(plugin)
        });

        return response.response;
    } catch (error) {
        console.error("Error checking plugin status");
        return "error";
    }
}



/*function fetchDataFromApi() {
    fetch("/packages.marketplace.api.getAllPlugins.main?start=0&length=1000", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            data.marketplace.plugins.sort((a, b) => {
                const nameA = a.name.toUpperCase(); // Convert to uppercase to make comparison case-insensitive
                const nameB = b.name.toUpperCase(); // Convert to uppercase to make comparison case-insensitive

                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }

                // Names are equal
                return 0;
            });
            updatePageWithApiData(data);
            localStorage.setItem('apiData', JSON.stringify(data));
        })
        .catch(error => console.error('Error fetching data:', error));
}*/


function getButtonType(plugin) {
    if (!plugin.installed) {
        return 'install';
    } else if (plugin.installed && plugin.requiredUpdate) {
        return 'update';
    } else {
        return 'open';
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const placeLogItems = document.querySelectorAll('.place_log .item');

    function hideDropdownList() {
        const dropdownList = document.querySelector('.dropdownList');
        if (dropdownList) {
            dropdownList.style.display = 'none';
        }
    }

    placeLogItems.forEach(item => {
        item.addEventListener('click', function() {
            const id = this.querySelector('.nav-link').getAttribute('data-id');

            const navLink = document.querySelector(`.nav-link[data-id="${id}"]`);
            if (navLink) {
                navLink.click();
                hideDropdownList();
            }
        });
    });
});

$(document).ready(function () {


    let viewType = localStorage.getItem("market-place-view-type");
    let sortBy = localStorage.getItem("market-place-sort-by");

    if (null != viewType) {
        $("#contentview").val(viewType);
        $("#contentview").trigger('change');
    }

    if (null != sortBy) {
        $("#sort_by").val(sortBy);
        $("#sort_by").trigger('change');
    }


    $("#sort_by").change(function () {
        //TODO - make start and length take values acc to page
        const start = 0;
        const length = itemsPerPage;
        const selectedCategory = $(".nav-link.active").attr('data-id');
        sortBy = $(this).val();

        localStorage.setItem("market-place-sort-by",sortBy);

        const tenant = localStorage.getItem("tenant") || "default";
        const accessToken = localStorage.getItem("AuthToken");

        const baseUrl =
            window.ENV.API_BASE_URL +
            "/tenant/" + tenant +
            "/packages.middleware.pub.platform.MarketPlace.main";

        const apiUrl =
            selectedCategory === "all"
                ? `${baseUrl}?start=${start}&length=${length}&sortBy=${encodeURIComponent(sortBy)}&access_token=${encodeURIComponent(accessToken)}`
                : `${baseUrl}?category=${encodeURIComponent(selectedCategory)}&start=${start}&length=${length}&sortBy=${encodeURIComponent(sortBy)}&access_token=${encodeURIComponent(accessToken)}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(apiData => {
                updatePageWithApiData(apiData);

                const totalItems = apiData.marketplace.total || 0;
                totalPages = Math.ceil(totalItems / itemsPerPage);

                localStorage.setItem("totalPages", totalPages);

                if (apiData.marketplace.manifest_updated === true) {
                    document.getElementById("syncContainer").style.display = "block";
                } else {
                    document.getElementById("syncContainer").style.display = "none";
                }

                createPagination(totalPages, 1);
            });
    });

    let debounceTimer;
    let currentPage = 1;
    let currentCategoryId = 'all';

    function fetchPluginById(id, start, length, pageChange,searchTerm= '') {
        /*const apiData = JSON.parse(localStorage.getItem('apiData'));
        const categoryData = JSON.parse(localStorage.getItem(`apiData_${id}`));

        if(!pageChange) {
            if (id === 'all') {
                if (apiData) {
                    const allButton = document.querySelector('.nav-link[data-id="all"]');
                    if (allButton) {
                        const otherButtons = document.querySelectorAll('.nav-link[data-id]:not([data-id="all"])');
                        otherButtons.forEach(button => {
                            button.classList.remove('active');
                        });
                        allButton.classList.add('active');
                    } else {
                        console.error(`Button with data-id "all" not found.`);
                    }
                    updatePageWithApiData(apiData);
                    return;
                }
            } else {
                if (categoryData) {
                    const allButton = document.querySelector('.nav-link[data-id="all"]');
                    if (allButton) {
                        allButton.classList.remove('active');
                    }
                    const categoryButton = document.querySelector(`.nav-link[data-id="${id}"]`);
                    if (categoryButton) {
                        const otherButtons = document.querySelectorAll('.nav-link[data-id]:not([data-id="all"])');
                        otherButtons.forEach(button => {
                            button.classList.remove('active');
                        });
                        categoryButton.classList.add('active');
                    } else {
                        console.error(`Button with data-id "${id}" not found.`);
                    }
                    updatePageWithApiData(categoryData);
                    return;
                }
            }
        }*/
        const tenant = localStorage.getItem("tenant") || "default";
        const accessToken = localStorage.getItem("AuthToken");
        let sortBy = localStorage.getItem("market-place-sort-by") || null;

        const baseUrl =
            window.ENV.API_BASE_URL +
            "/tenant/" + tenant +
            "/packages.middleware.pub.platform.MarketPlace.main";

        const apiUrl =
            id === "all"
                ? `${baseUrl}?start=${start}&length=${length}&sortBy=${encodeURIComponent(sortBy)}&name=${encodeURIComponent(searchTerm)}&access_token=${encodeURIComponent(accessToken)}`
                : `${baseUrl}?category=${encodeURIComponent(id)}&start=${start}&length=${length}&sortBy=${encodeURIComponent(sortBy)}&name=${encodeURIComponent(searchTerm)}&access_token=${encodeURIComponent(accessToken)}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {

                let totalItems = data.marketplace.total;
                totalPages = Math.ceil(totalItems / itemsPerPage);

                localStorage.setItem("totalPages", totalPages);

                if (data.marketplace.total == 0) {
                    createPagination(1, 1);
                }

                if (data.marketplace.manifest_updated === true) {
                    document.getElementById('syncContainer').style.display = 'block';
                }else{
                    document.getElementById('syncContainer').style.display = 'none';
                }

                if (data.marketplace && data.marketplace.plugins && data.marketplace.plugins.length > 0) {
                    //const firstPlugin = data.marketplace.plugins[0];
                    totalItems = data.marketplace.total;
                    pages = Math.ceil(totalItems / itemsPerPage);
                    localStorage.setItem("totalItems", totalItems);
                    localStorage.setItem("totalPages", pages);

                    createPagination(pages, currentPage);

                    if(apiUrl !== 'all'){

                    }
                }

                const allButtons = document.querySelectorAll('.nav-link');
                allButtons.forEach(button => {
                    button.classList.remove('active');
                });

                const button = document.querySelector(`.nav-link[data-id="${id}"]`);
                if (button) {
                    button.classList.add('active');
                } else {
                    console.error(`Button with data-id "${id}" not found.`);
                }

               /* if (id !== 'all') {
                    localStorage.setItem(`apiData_${id}`, JSON.stringify(data));
                }else{
                    localStorage.setItem('apiData', JSON.stringify(data));

                }*/

                /*if(id === "all"){
                    localStorage.setItem('apiData', JSON.stringify(data));
                }*/


                updatePageWithApiData(data);

                if (!pageChange) {
                    $('#search-on-market').val('');
                }
            })
            .catch(error => {
                console.error(`Error fetching plugin data for ID ${id}:`, error);
            });
    }



    function fetchSearchResults(searchTerm, categoryId, start, length,sortBy) {
        const tenant = localStorage.getItem("tenant") || "default";
        const accessToken = localStorage.getItem("AuthToken");

        const baseUrl =
            window.ENV.API_BASE_URL +
            "/tenant/" + tenant +
            "/packages.middleware.pub.platform.MarketPlace.main";

        const apiUrl =
            categoryId === "all"
                ? `${baseUrl}?start=${start}&length=${length}` +
                `&name=${encodeURIComponent(searchTerm)}` +
                `&sortBy=${encodeURIComponent(sortBy)}` +
                `&access_token=${encodeURIComponent(accessToken)}`
                : `${baseUrl}?start=${start}&length=${length}` +
                `&category=${encodeURIComponent(categoryId)}` +
                `&name=${encodeURIComponent(searchTerm)}` +
                `&sortBy=${encodeURIComponent(sortBy)}` +
                `&access_token=${encodeURIComponent(accessToken)}`;

        return fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(response => response.json())
            .then(data => {
            totalPages = Math.ceil(data.marketplace.total / length);
            localStorage.setItem("totalPages", totalPages);
            createPagination(totalPages, currentPage);

            if (data.marketplace.manifest_updated === true) {
                document.getElementById('syncContainer').style.display = 'block';
            }else{
                document.getElementById('syncContainer').style.display = 'none';
            }

            return data;
        });
    }

    function displaySearchResults(searchTerm, categoryId,sortBy) {
        fetchSearchResults(searchTerm, categoryId, 0, itemsPerPage,sortBy)
            .then(data => {
                let searchableData = [];

                for (let i = 0; i < data.marketplace.plugins.length; i++) {
                    if (data.marketplace.plugins[i].name.toUpperCase().includes(searchTerm.toUpperCase())) {
                        searchableData.push(data.marketplace.plugins[i]);
                    }
                }

                updatePageWithApiData({
                    marketplace: {
                        plugins: searchableData
                    }
                });
            })
            .catch(error => {
                console.error('Error displaying search results:', error);
            });
    }

    function handlePagination(page, searchTerm = '') {
        const categoryId = $(".nav-link.active").attr('data-id') || 'all';
        const start = (page - 1) * itemsPerPage;
        fetchPluginById(categoryId, start, itemsPerPage, true, searchTerm);
    }

    function updateURLParameter(key, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(key, value);
        const newURL = window.location.pathname + '?' + urlParams.toString();
        window.history.pushState({}, '', newURL);
    }

    $(".nav-link").click(function () {
        const clickedCategory = $(this).attr('data-id');
        if (currentCategoryId !== clickedCategory) {
            currentCategoryId = clickedCategory;
            $(".nav-link").removeClass("active");
            $(this).addClass("active");
            $('#search-on-market').val('');
            currentPage = 1;
            /*currentPage = 1; // Reset currentPage when category changes
            handlePagination(currentPage);*/
            homePageLoad();
            //displaySearchResults('', currentCategoryId);
        }
    });

    $("#search-on-market").keyup(function () {
        const searchTerm = $(this).val();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentPage = 1;
            if (searchTerm.trim() === '' || searchTerm === '"') {
                if (!($(".nav-link.active").length > 0)) {
                    currentCategoryId = 'all'; // Redirect to "All" category automatically
                } else {
                    currentCategoryId = $(".nav-link.active").attr('data-id');
                }
                displaySearchResults('', currentCategoryId,sortBy);
            } else {
                displaySearchResults(searchTerm, currentCategoryId,sortBy);
            }
        }, 300);
    });

    function homePageLoad() {
        // Initial page load
        let startCategoryId = $(".nav-link.active").attr('data-id') || 'all';
        fetchPluginById(startCategoryId, 0, itemsPerPage, false);

        updateURLParameter('page', 1);
    }

    homePageLoad();





    // selecting required element
    const element = document.querySelector(".pagination ul");
    let totalPages = localStorage.getItem("totalPages");
    if(totalPages === null || totalPages === undefined){
        totalPages = pages;
    }
    let page = 1;

    //calling function with passing parameters and adding inside element which is ul tag
    element.innerHTML = createPagination(totalPages, page);

    function createPagination(totalPages, page) {
        let liTag = '';
        let active;
        let beforePage = page - 1;
        let afterPage = page + 1;
        if (page > 1) { //show the next button if the page value is greater than 1
            liTag += `<li class="btn prev" onclick="createPagination(totalPages, ${page - 1})"><span><i class="fa fa-angle-left"></i> Prev</span></li>`;
        }

        if (page > 2) { //if page value is less than 2 then add 1 after the previous button
            if(page !== totalPages) {
                liTag += `<li class="first numb" onclick="createPagination(totalPages, 1)"><span>1</span></li>`;
            }
            if (page > 3) { //if page value is greater than 3 then add this (...) after the first li or page
                liTag += `<li class="dots"><span>...</span></li>`;
            }
        }

        // how many pages or li show before the current li
        if (page == totalPages) {
            beforePage = beforePage - 2;
        } else if (page == totalPages - 1) {
            beforePage = beforePage - 1;
        }
        // how many pages or li show after the current li
        if (page == 1) {
            afterPage = afterPage + 2;
        } else if (page == 2) {
            afterPage = afterPage + 1;
        }

        if (totalPages == 1 || totalPages == 2) {
            beforePage = 1;
        }

        for (var plength = beforePage; plength <= afterPage; plength++) {
            if (plength > totalPages) { //if plength is greater than totalPage length then continue
                continue;
            }
            if (plength == 0) { //if plength is 0 than add +1 in plength value
                plength = plength + 1;
            }
            if (page == plength) { //if page is equal to plength than assign active string in the active variable
                active = "active";
            } else { //else leave empty to the active variable
                active = "";
            }
            liTag += `<li class="numb ${active}" onclick="createPagination(totalPages, ${plength})"><span>${plength}</span></li>`;
        }

        if (page < totalPages - 1) { //if page value is less than totalPage value by -1 then show the last li or page
            if (page < totalPages - 2) { //if page value is less than totalPage value by -2 then add this (...) before the last li or page
                liTag += `<li class="dots"><span>...</span></li>`;
            }
            if (afterPage < totalPages) {
                liTag += `<li class="last numb" onclick="createPagination(totalPages, ${totalPages})"><span>${totalPages}</span></li>`;
            }
        }

        if (page < totalPages) { //show the next button if the page value is less than totalPage(20)
            liTag += `<li class="btn next" onclick="createPagination(totalPages, ${page + 1})"><span>Next <i class="fa fa-angle-right"></i></span></li>`;
        }
        element.innerHTML = liTag; //add li tag inside ul tag
        return liTag; //reurn the li tag
    }

    $(document).on("click", ".pagination .numb", function() {
        if(totalPages === null || totalPages === undefined) {
            totalPages = localStorage.getItem("totalPages");
            if (totalPages === null || totalPages === undefined) {
                totalPages = pages;
            }
        }
        let pageNum = parseInt($.trim($(this).text()), 10);

        if (isNaN(pageNum)) {
            const urlParams = new URLSearchParams(window.location.search);
            pageNum = parseInt(urlParams.get('page'), 10);

            if (isNaN(pageNum)) {
                pageNum = 1;
            }
        }
        createPagination(totalPages, pageNum);
        currentPage = pageNum;
        const searchValue = $('#search-on-market').val();
        if (searchValue !== null && searchValue !== undefined && searchValue.trim() !== '') {
            handlePagination(currentPage, searchValue);
        } else {
            handlePagination(currentPage);
        }
        updateURLParameter('page', currentPage);
    });

    $(document).on("click", ".pagination .prev", function() {
        if(totalPages === null || totalPages === undefined) {
            totalPages = localStorage.getItem("totalPages");
            if (totalPages === null || totalPages === undefined) {
                totalPages = pages;
            }
        }
        if (currentPage > 1) {
            currentPage--;
            createPagination(totalPages, currentPage);
            const searchValue = $('#search-on-market').val();
            if (searchValue !== null && searchValue !== undefined && searchValue.trim() !== '') {
                handlePagination(currentPage, searchValue);
            } else {
                handlePagination(currentPage);
            }
            updateURLParameter('page', currentPage);
        }
    });

    $(document).on("click", ".pagination .next", function() {
        if(totalPages === null || totalPages === undefined) {
            totalPages = localStorage.getItem("totalPages");
            if (totalPages === null || totalPages === undefined) {
                totalPages = pages;
            }
        }
        if (currentPage < totalPages) {
            currentPage++;
            createPagination(totalPages, currentPage);
            const searchValue = $('#search-on-market').val();
            if (searchValue !== null && searchValue !== undefined && searchValue.trim() !== '') {
                handlePagination(currentPage, searchValue);
            } else {
                handlePagination(currentPage);
            }
            updateURLParameter('page', currentPage);
        }
    });

});


function loadCategories() {
    const tenant = localStorage.getItem("tenant") || "default";
    const accessToken = localStorage.getItem("AuthToken");

    const apiUrl =
        window.ENV.API_BASE_URL +
        "/tenant/" + tenant +
        "/packages.marketplace.api.getAllCategories.main" +
        "?access_token=" + encodeURIComponent(accessToken);

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {

            for (let i = 0 ; i < data.categories.length ; i++) {
                $("#all-header-nav").append('<li class="nav-item"><a href="javascript:void(0)" class="nav-link" data-id="' + data.categories[i].id + '">' + data.categories[i].category_name + '</a></li>');

                $(".place_log").append('<div class="item">\n' +
                    '                    <div class="logo_pnl"><img src="middleware/pub/server/ui/assets/img/workspace-icon/' + data.categories[i].category_name + '.svg"></div>\n' +
                    '                    <p><a href="javascript:void(0)" class="nav-link" data-id="' + data.categories[i].category_name + '" >' + data.categories[i].category_name + '</a></p>\n' +
                    '                  </div>');
            }

        })
        .catch(error => {
            console.error(`Error fetching plugin data for ID ${id}:`, error);
        });
}


//loadCategories();


function syncNow(ref) {
    const tenant = localStorage.getItem("tenant") || "default";
    const accessToken = localStorage.getItem("AuthToken");

    const apiUrl =
        window.ENV.API_BASE_URL +
        "/tenant/" + tenant +
        "/packages.middleware.pub.platform.syncPluginData.main" +
        "?access_token=" + encodeURIComponent(accessToken);

    $(ref).html('Sync Now ...');

    fetch(apiUrl, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: null
    })
        .then(response => response.json())
        .then(data => {
            if (data.response.status) {
                document.getElementById('syncContainer').style.display = 'none';
               swal({
                    title: "Success",
                    text: "Sync completed successfully!",
                    type: "success", // Use "icon" instead of "type" for SweetAlert2
                    confirmButtonColor: "#2C61F5" // Optional: Custom blue color
                });

            } else {
                throw new Error('Sync failed');
            }
        })
        .catch(error => {
            swal({
                title: "Error",
                text: "An error occurred during sync!",
                type: "error", // Use 'icon' instead of 'type' for better compatibility (SweetAlert2)
                confirmButtonColor: "#f2533e" // Optional: red shade
            });

            document.getElementById('syncContainer').style.display = 'block';
        });
}
