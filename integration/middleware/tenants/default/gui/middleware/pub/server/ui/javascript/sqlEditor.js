function isinIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
}

window.onload = function() {
    if (!isinIframe()) {
        var button = document.getElementById('flowFullScreen');
        button.style.display = 'none';
    }
};

//Initialize bootstrap tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, {
        trigger: 'hover'
    });
});
// loadGroupsDP();
loadFile = getUrlParam("loadFile");
/*loadFile=getUrlParam("loadFile");
    var response=syncRestRequest("/"+loadFile, "GET", "");
    if(response.status==200){
    response=response.payload;
    $("#code").val(response);
}else{
    alert(response.payload);
}


    function save(){
    data=editor.getValue();
    var response=syncRestRequest("/"+loadFile, "POST", data,"application/text","application/text");
    if(response.status==200){
//localStorage.setItem(loadFile, "");
    alert("Saved");
}else
    alert(JSON.parse(response.payload).error);
}*/
document.querySelector("#path-copy").onclick = function() {
    document.querySelector("#full_path").select();
    document.execCommand("copy");
};


var to_input = false;
$('#input_search_panel_sql').keyup(function() {
    if (to_input) {
        clearTimeout(to_input);
    }
    to_input = setTimeout(function() {
        var v = $('#input_search_panel_sql').val();
        $('#input_schema_editor_jsTree').jstree(true).search(v, false, true);
    }, 250);
});

var output_input = false;
$('#output_search_panel_sql').keyup(function() {
    if (output_input) {
        clearTimeout(output_input);
    }
    output_input = setTimeout(function() {
        var v = $('#output_search_panel_sql').val();
        $('#output_schema_editor_jsTree').jstree(true).search(v, false, true);
    }, 250);
});

inputJstreeRef = createSchemaJstree("#input_schema_editor_jsTree");

outputJstreeRef = createSchemaJstree("#output_schema_editor_jsTree");

loadFile = getUrlParam("loadFile");
sqlMainCode_id = loadFile + "sql-mainCode";

var defaultSQLServiceSignature = {
    input: [{
        id: "j1_2",
        text: "inputDocList",
        li_attr: {
            id: "j1_2",
        },
        a_attr: {
            href: "#",
            id: "j1_2_anchor",
        },
        state: {
            loaded: true,
            opened: true,
            selected: false,
            disabled: false,
        },
        data: {},
        parent: "#",
        type: "documentList",
    },
        {
            id: "j1_3",
            text: "txConn",
            li_attr: {
                id: "j1_3",
            },
            a_attr: {
                href: "#",
                id: "j1_3_anchor",
            },
            state: {
                loaded: true,
                opened: false,
                selected: false,
                disabled: false,
            },
            data: {},
            parent: "#",
            type: "javaObject",
        },
        {
            id: "j1_4",
            text: "isTxn",
            li_attr: {
                id: "j1_4",
            },
            a_attr: {
                href: "#",
                id: "j1_4_anchor",
            },
            state: {
                loaded: true,
                opened: false,
                selected: false,
                disabled: false,
            },
            data: {},
            parent: "#",
            type: "boolean",
        },
    ],
    output: [{
        id: "j2_1",
        text: "outputDocList",
        li_attr: {
            id: "j2_1",
        },
        a_attr: {
            href: "#",
            id: "j2_1_anchor",
        },
        state: {
            loaded: true,
            opened: false,
            selected: false,
            disabled: false,
        },
        data: {},
        parent: "#",
        type: "documentList",
    },
        {
            id: "j2_2",
            text: "rows",
            li_attr: {
                id: "j2_2",
            },
            a_attr: {
                href: "#",
                id: "j2_2_anchor",
            },
            state: {
                loaded: true,
                opened: false,
                selected: false,
                disabled: false,
            },
            data: {},
            parent: "#",
            type: "integer",
        },
        {
            id: "j2_3",
            text: "success",
            li_attr: {
                id: "j2_3",
            },
            a_attr: {
                href: "#",
                id: "j2_3_anchor",
            },
            state: {
                loaded: true,
                opened: false,
                selected: false,
                disabled: false,
            },
            data: {},
            parent: "#",
            type: "boolean",
        },
        {
            id: "j2_4",
            text: "error",
            li_attr: {
                id: "j2_4",
            },
            a_attr: {
                href: "#",
                id: "j2_4_anchor",
            },
            state: {
                loaded: true,
                opened: false,
                selected: true,
                disabled: false,
            },
            data: {},
            parent: "#",
            type: "string",
        },
    ],
};

let SERVICE_JSON_RESPONSE = {};
let STATIC_LOAD = false;
function loadSQLService(json) {
    SERVICE_JSON_RESPONSE = {
        "status": 200,
        "payload": isJsonString(json) ? json : JSON.stringify(json)
    };
    STATIC_LOAD = true;
    loadRemoteFile(true);
    STATIC_LOAD = false;
}

function loadRemoteFile(overwrite) {
    if (overwrite == null && localStorage.getItem(loadFile) != "overwrite")
        overwrite = false;
    else {
        overwrite = true;
    }

    if (loadFile != false) {
        var response = STATIC_LOAD ? SERVICE_JSON_RESPONSE : syncRestRequest("/" + loadFile, "GET", "");
        //console.log(response);
        //alert(response.status);
        var inputRef = inputJstreeRef;
        var outputRef = outputJstreeRef;
        if (response.status == 200) {
            response = response.payload;
            response = JSON.parse(response);


            if (response.consumers) {
                const consumers = Array.isArray(response.consumers)
                    ? [...new Set(response.consumers)] // Remove duplicates for arrays
                    : [...new Set(response.consumers.split(","))]; // Remove duplicates for strings

                if (Array.isArray(response.consumers)) {
                    response.consumers.forEach(consumer => {
                        $("#serviceConsumers").append("<option selected='selected'>" + consumer + "</option>");
                    });

                    $("#serviceConsumers").trigger('change');
                } else {
                    for (let i = 0; i < consumers.length; i++) {
                        $("#serviceConsumers").append("<option selected='selected'>" + consumers[i] + "</option>");
                    }
                }
            }

            if (response.developers) {
                const developers = Array.isArray(response.developers)
                    ? [...new Set(response.developers)] // Remove duplicates for arrays
                    : [...new Set(response.developers.split(","))]; // Remove duplicates for strings

                if (Array.isArray(response.developers)) {
                    response.developers.forEach(developer => {
                        $("#serviceDevelopers").append("<option selected='selected'>" + developer + "</option>");
                    });

                    $("#serviceDevelopers").trigger('change');
                } else {
                    for (let i = 0; i < developers.length; i++) {
                        $("#serviceDevelopers").append("<option selected='selected'>" + developers[i] + "</option>");
                    }
                }
            }


            var sqlMainCode_data = localStorage.getItem(sqlMainCode_id);
            if (sqlMainCode_data == null || sqlMainCode_data.trim().length == 0 || overwrite) {
                if (response.sql == null || response.sql.trim().length == 0) localStorage.setItem(sqlMainCode_id, "");
                else {
                    var decoded = window.atob(response.sql);
                    localStorage.setItem(sqlMainCode_id, decoded);
                }
            }

            removeIcons(response.input);
            removeIcons(response.output);

            var inputSchema = response.input;
            var outputSchema = response.output;
            //      if(!inputSchema)
            //        inputSchema=defaultSQLServiceSignature.input;

            for (let i = 0; i < inputSchema.length; i++) {
                if (null == inputSchema[i].state) {
                    continue;
                }
                inputSchema[i].state.hidden = false;
            }

            for (let i = 0; i < outputSchema.length; i++) {
                if (null == outputSchema[i].state) {
                    continue;
                }
                outputSchema[i].state.hidden = false;
            }

            inputRef.settings.core.data = inputSchema;
            inputRef.refresh();

            //	  if(!outputSchema)
            //        outputSchema=defaultSQLServiceSignature.output;

            outputRef.settings.core.data = outputSchema;
            outputRef.refresh();
        } else {
            inputRef.settings.core.data = defaultSQLServiceSignature.input;
            inputRef.refresh();

            outputRef.settings.core.data = defaultSQLServiceSignature.output;
            outputRef.refresh();
        }
    }

    var tokenize = loadFile.split("/");
    var sqlFileName = tokenize[tokenize.length - 1];
    //classDef=classDef.replace(".sql","");
    loadFromlocalstorage(overwrite);
}

function loadFromlocalstorage(overwrite) {
    var decoded = localStorage.getItem(sqlMainCode_id);
    if (STATIC_LOAD) {
        SQL_EDITOR.setValue(decoded);
    } else {
        $("#sql-mainCode").val(decoded);
    }

    let pathItems = loadFile.replace("files/", "").split("/");

    let HTML = pathItems[0];
    let filePath = "";
    for (let i = 1; i < pathItems.length; i++) {
        filePath += "/" + pathItems[i - 1];

        HTML += " > " + "<a href='javascript:focusOnElement(\"files" + filePath + "/" + pathItems[i] + "\")'>" + pathItems[i] + "</a>";
    }

    $("#currentServiceName").html(HTML);
    if (overwrite != false)
        setUnsavedChanges(loadFile, false);
}

function unLockArtifact() {
    collecta('UNLOCK', '', 'Unlock', 'Unlocking Java Service');
    asyncRestRequest(
        ("/" + loadFile.replace("files/", "artifact/unlock/")),
        null,
        "POST",
        function(response) {
            if (response.status === "200") {
                localStorage.setItem(loadFile, "");
               swal({
                    title: 'Accepted.',
                    text: "You've successfully unlocked this service.",
                    type: 'success',
                    confirmButtonColor: '#2C61F5'
                });

            }
        },
        function(errormessage) {
            swal({
                    title: 'Access denied.',
                    text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                    type: 'error',
                    confirmButtonColor: '#f2533e'
            });

        }
    );
}

function lockArtifact() {
    collecta('LOCK', '', 'Lock', 'Locking Java Service');
    asyncRestRequest(
        ("/" + loadFile.replace("files/", "artifact/lock/")),
        null,
        "POST",
        function(response) {
            if (response.status === "200") {
                localStorage.setItem(loadFile, "");
                const message = "You've successfully locked this service.";
                swal({
                    title: 'Success!',
                    text: message,
                    type: 'success',
                    confirmButtonColor: '#2C61F5' // Optional: Customize button color
                });

            }
        },
        function(errormessage) {
            swal({
                title: 'Access denied.',
                text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                type: 'error',
                confirmButtonColor: '#f2533e' // Customize as needed
            });

        }
    );
}

function save() {
    saveSQL(loadFile, loadFile);
}

function saveSQL(loadFile, newFileLocation) {
    var dataJson = {
        input: [],
        output: [],
        sql: "",
    };
    var sqlMainCode_data = localStorage.getItem(sqlMainCode_id);
    if (sqlMainCode_data == null) sqlMainCode_data = "";

    var tokenize = loadFile.split("/");
    var classDef = tokenize[tokenize.length - 1];
    classDef = classDef.replace(".sql", "");

    var packageName = loadFile.replace("files/", "").replace("/" + classDef + ".sql", "");
    packageName = packageName.split("/").join("."); //replaceALL(packageName,"/",".");
    //alert(dataJson.imports);
    dataJson.sql = window.btoa(sqlMainCode_data);
    dataJson.input = inputJstreeRef.get_json("#", {
        flat: false
    });
    dataJson.output = outputJstreeRef.get_json("#", {
        flat: false
    });
    removeIcons(dataJson.input);
    removeIcons(dataJson.output);
    dataJson.version = "v1";
    dataJson.consumers = $("#serviceConsumers").val().toString();
    dataJson.developers = $("#serviceDevelopers").val().toString();;
    var data = JSON.stringify(dataJson);
    //alert(data);
    collecta('Save', '', 'SQL_Service', 'Service : ' + loadFile.replace("files/", "sql/"));
    if (data != null && data.trim().length > 0) {
        var response = syncRestRequest("/" + newFileLocation.replace("files/", "sql/"), "POST", data);
        if (response.status == 200) {
            localStorage.setItem(loadFile, "");
            swal({
                    title: "Saved",
                    text: "Your changes are saved successfully!",
                    type: "success",
                    showCancelButton: false,
                    confirmButtonColor: "#2C61F5",
                    cancelButtonText: "",
                    confirmButtonText: "Okay",
                    showLoaderOnConfirm: true,
                    closeOnConfirm: true,
                    closeOnCancel: false
                },
                function(isConfirm) {
                    if (isConfirm) {
                        //reload();
                        localStorage.setItem(loadFile, "overwrite");
                    } else {

                    }
                });
        }
        //alert(JSON.parse(response.payload).error);
        else swal({
                title: "Error",
                text: JSON.parse(response.payload).error,
                type: "error",
                confirmButtonColor: "#f2533e" // Custom button color
            });

    }
    //alert("No changes to save");
    else swal({
            title: "Warning !!",
            text: "No changes to save",
            type: "warning",
            confirmButtonColor: "#f2533e" // Optional: customize button color (orange shade)
         });

}

function reload() {
    localStorage.setItem(loadFile, "overwrite");
    loadRemoteFile(true);
    location.reload();
}

loadRemoteFile(false);

let SQL_EDITOR = null;
function enableIDE(elemId, readOnly) {
    if (readOnly != true) readOnly = false;
    var id = sqlMainCode_id;
    var mime = "text/x-mariadb";
    // get mime type
    if (window.location.href.indexOf("mime=") > -1) {
        mime = window.location.href.substr(window.location.href.indexOf("mime=") + 5);
    }
    SQL_EDITOR = CodeMirror.fromTextArea(document.getElementById(elemId), {
        mode: mime,
        indentWithTabs: true,
        smartIndent: true,
        lineNumbers: true,
        readOnly: readOnly,
        matchBrackets: true,
        autofocus: true,
        extraKeys: {
            "Ctrl-Space": "autocomplete"
        },
        hintOptions: {
            tables: {
                users: ["name", "score", "birthDate"],
                countries: ["name", "population", "size"],
            },
        },
    });

    SQL_EDITOR.on("change", function(cm, change) {
        var value = cm.getValue();
        localStorage.setItem(id, value);
    });
}
enableIDE("sql-mainCode", false);
//  var mac = CodeMirror.keyMap.default == CodeMirror.keyMap.macDefault;
//  CodeMirror.keyMap.default[(mac ? "Cmd" : "Ctrl") + "-Space"] = "autocomplete";

menu = null;

function showMenu(x, y) {
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.style.display = "block";
    menu.classList.add("show-menu");
    //alert(menu);
}

function hideMenu() {
    menu.classList.remove("show-menu");
    menu.style.display = "none";
}
var currentJstreeRef = null;

function onContextMenu(e) {
    console.log(e.target);
    console.log(e.target.id);
    if (menu != null) hideMenu();
    menu = document.getElementById("schema_editor_jsTree_contextMenu");
    //$("#input_schema_editor_jsTree").jstree().deselect_all(true);
    //$("#output_schema_editor_jsTree").jstree().deselect_all(true);
    //alert(e.target.id);
    if (e.target.id == "input_schema_editor_jsTree") {
        currentJstreeRef = inputJstreeRef;
        menu = document.getElementById("schema_editor_jsTree_contextMenu");
        $("#input_schema_editor_jsTree").jstree().deselect_all(true);
        $("#output_schema_editor_jsTree").jstree().deselect_all(true);
    } else if (e.target.id == "output_schema_editor_jsTree") {
        currentJstreeRef = outputJstreeRef;
        menu = document.getElementById("schema_editor_jsTree_contextMenu");
        $("#input_schema_editor_jsTree").jstree().deselect_all(true);
        $("#output_schema_editor_jsTree").jstree().deselect_all(true);
    } else menu = null;
    if (menu != null) {
        e.preventDefault();
        var yAxis = e.pageY;
        if ((yAxis + 70) > window.innerHeight) {
            yAxis = window.innerHeight - 70;
        }
        if ((yAxis + 223) > window.innerHeight) {
            $(".secondMenuInput").addClass("secondMenuXAdjustment");
            $(".secondMenuInput2").addClass("secondMenuXAdjustment2");
            $(".thirdMenuInput").addClass("thirdMenuXAdjustment");
        } else {
            $(".secondMenuInput").removeClass("secondMenuXAdjustment");
            $(".thirdMenuInput").removeClass("thirdMenuXAdjustment");
        }
        if (window.innerWidth < e.pageX + 250) {
            showMenu(e.pageX - 150, yAxis);
            $(".secondMenuInput").addClass("secondMenuYAdjustment");
            $(".secondMenuInput2").addClass("secondMenuYAdjustment2");
        } else {
            $(".secondMenuInput").removeClass("secondMenuYAdjustment");
            $(".secondMenuInput2").removeClass("secondMenuYAdjustment2");
            showMenu(e.pageX, yAxis);
        }
        document.addEventListener("click", onClick, false);
    }
}

function onClick(e) {
    if (menu) hideMenu();
    document.removeEventListener("click", onClick);
}

document.addEventListener("contextmenu", onContextMenu, false);

$(document).ready(function() {
    $(".ok_close").click(function() {
        $("#elementPropertyModalDialog, #configurePropertiesModelDialog").hide();
    });


    $("#flowFullScreen").attr("href", "middleware/pub/server/ui/workspace/web/CodeMirror-master/mode/sql/sqlEditor.html?loadFile=" + loadFile);
    focusOnElement(loadFile);

});

function updateDataType(newType, jsTree) {
    console.log(jsTree);
    var treeRef = null;
    if (jsTree == "#landing_arrow_jsTree") {
        treeRef = landing_arrow_jsTree_ref;
        var nodeVal = mapperObj.getValue(treeRef);
        try {
            mapperObj.setValue(treeRef, nodeVal.value, nodeVal.evaluate);
        } catch (err) {}
    }
}

function fullScreen() {
    collecta('Open', '', 'New Tab', 'Full Screen');
    window.open("middleware/pub/server/ui/workspace/web/CodeMirror-master/mode/sql/sqlEditor.html?loadFile=" + loadFile, "_blank");
}

function UpdateConfigURL() {
    var inputelem = document.getElementById("serviceAliasValue");
    var s = inputelem.value;

    var labelelem = document.getElementById("full_path");
    var tempval = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant");

    /* var cookies = document.cookie.split(";");
     for (var i = 0; i < cookies.length; i++) {
       var coo = cookies[i].split("=");
       if (coo[0].trim() == "tenant") {
         tempval = (location.origin + "/tenant/" + coo[1].replaceAll('"', "").split(" ")[0]);
       }
     }*/
    labelelem.value = tempval + s;
}

// Initial update.
UpdateConfigURL();

// Register event handlers.
var inputelem = document.getElementById("serviceAliasValue");
inputelem.addEventListener('keypress', UpdateConfigURL);
inputelem.addEventListener('keyup', UpdateConfigURL);
inputelem.addEventListener('input', UpdateConfigURL);
inputelem.addEventListener('change', UpdateConfigURL);

$(document).ready(function() {

    $(".ok_close").click(function() {
        $("#configureSetValueModelDialog, #elementPropertyModalDialog, #configureInputJSONSchemaTextDialog, #flowElementPropertyModalDialog, #configureMapLinePropertiesModelDialog, #configurePropertiesModelDialog").hide();
    });

    if (SDK_EMBEDDED) {
        return;
    }
    if (!isInIframe()) {
        $("#service-c-m-option").hide();
    }
    loadGroupsDP();
    getAllEnvironments();

    if (null != localStorage.getItem("pre-dev-groups")) {

        const preDevGroups = JSON.parse(localStorage.getItem("pre-dev-groups"));

        $("#serviceDevelopers").val(preDevGroups.developers).trigger('change');
        $("#serviceConsumers").val(preDevGroups.consumers).trigger('change');
        SILENT_SAVE_ONCE = true;
        localStorage.removeItem("pre-dev-groups");
    }

    setTimeout(function() {
        flowIOHeightAdjuster()
    }, 1000);
    $("#flowFullScreen").attr("href", "../../../workspace/web/apiMaker/apiEditor.html?loadFile=" + loadFile);
    $("#serviceLog").attr("href", "../../../workspace/web/server-logs.html?serviceName=" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main"));
    //$("#
    // ").attr("href", "/middleware/logs/" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/,".main") + "/list");

    asyncRestRequest("/middleware/logs/" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main") + "/list", null, "GET", function(response) {
        $("#snapshotList").html("");
        if (null == response.fileDispose) {
            for (let i = 0; i < response.files.length; i++) {
                $("#downloadSnapshotBtn").removeAttr("disabled");
                $("#downloadSnapshotBtn").removeClass("btn_disabled");
                $("#downloadSnapshotBtn").addClass("btn");
                $("#downloadSnapshotBtn").addClass("btn-gry");

                $("#simulateSnapshotBtn").removeAttr("disabled");
                $("#simulateSnapshotBtn").removeClass("btn_disabled");
                $("#simulateSnapshotBtn").addClass("btn");
                $("#simulateSnapshotBtn").addClass("btn-gry");

                $("#snapshotList").append("<option>" + response.files[i] + "</option>");
            }
        } else {

            $(".select-dropdown__list").html('<li><div class="srch_dlt"><div class="ui left icon input srch_itm"><i class="search_icon2"></i><input type="text" id="snap-search" name="search" placeholder="Search..."></div><div class="delete_nm" style="display: none;"><a href="javascript:void(0)"><img src="../../../icons/snap-delete.svg"> Delete 0 item</a></div><div class="snap-group"><input type="checkbox" id="delete_snap"><label for="delete_snap">Delete snapshots</label></div></div></li>');

            for (let i = 0; i < response.fileDispose.length; i++) {
                /**/

                $(".select-dropdown__list").append('<li data-value="' + (response.fileDispose[i].name) + '" data-time="' + response.fileDispose[i].time + '" class="select-dropdown__list-item"><div class="snap-group-all"> <span class="chk_sh" style="display: none;"> <input class="chk_sty" data-snap="' + response.fileDispose[i].name + '" type="checkbox" id="delete_snap' + (i + 1) + '"> <label for="delete_snap' + (i + 1) + '"></label> </span><span class="description">' + response.fileDispose[i].name.replace(".snap", "") + '</span></div><span class="time">' + response.fileDispose[i].time + '</span></li>');

                //$("#snapshotList").append("<option value='" + response.fileDispose[i].key + "'>" + response.fileDispose[i].name + "</option>");
            }

            $("#snap-search").keyup(function() {
                let keyVal = this;
                $(".chk_sty").each(function() {
                    if ($(keyVal).val().length <= 0) {
                        $(this).parent().parent().parent().show();
                    } else {
                        if ($(this).parent().parent().parent().attr("data-value").includes($(keyVal).val())) {
                            $(this).parent().parent().parent().show();
                        } else {
                            $(this).parent().parent().parent().hide();
                        }
                    }
                });
            });

            $("#delete_snap").click(function() {
                if ($(this).is(":checked")) {
                    $(".chk_sh").show();
                    $("#AddPassport").hide();
                    $(".delete_nm").show();
                    $(".srch_itm").hide();
                } else {
                    $(".chk_sh").hide();
                    $("#AddPassport").show();
                    $(".delete_nm").hide();
                    $(".srch_itm").show();
                }
            });

            $(".chk_sty").click(function() {
                $(".delete_nm").html('<a href="javascript:deleteSnaps()"><img src="../../../icons/snap-delete.svg"> Delete ' + $(".chk_sty:checked").length + ' item(s)</a>');
                if ($(".chk_sty:checked").length > 0) {
                    $(".delete_nm a").css({
                        "color": "#2C61F5"
                    });
                    $(".delete_nm a img").css({
                        "filter": "invert(27%) sepia(51%) saturate(2878%) hue-rotate(195deg) brightness(90%) contrast(100%)"
                    });
                } else {
                    $(".delete_nm a").css({
                        "color": "#7e7e7e"
                    });
                    $(".delete_nm a img").css({
                        "filter": "invert(25%) sepia(15%) saturate(10%) hue-rotate(279deg) brightness(5%) contrast(1%)"
                    });
                }
            });

            $('.select-dropdown__button').on('click', function() {
                $('.select-dropdown__list').toggleClass('active');
            });
            $('.select-dropdown__list-item').on('click', function() {
                var itemValue = $(this).data('value');
                $("#snapshotList").val(itemValue);
                $(".snap_time").show();
                $(".snap_time").html('<img src="../../../icons/cl-time.svg"> &nbsp; ' + $(this).data('time'));
                $('.select-dropdown__button span').text($(this).text()).parent().attr('data-value', itemValue);
                $('.select-dropdown__list').toggleClass('active');

                $("#downloadSnapshotBtn").removeAttr("disabled");
                $("#downloadSnapshotBtn").removeClass("btn_disabled");
                $("#downloadSnapshotBtn").addClass("btn");
                $("#downloadSnapshotBtn").addClass("btn-gry");

                $("#simulateSnapshotBtn").removeAttr("disabled");
                $("#simulateSnapshotBtn").removeClass("btn_disabled");
                $("#simulateSnapshotBtn").addClass("btn");
                $("#simulateSnapshotBtn").addClass("btn-gry");

            });
        }
    });

    focusOnElement(loadFile);
});

$(document).on('click', '#closeSnapModelDialog', function() {
    $('.select-dropdown__list').toggleClass('active');
    $('#delete_snap').prop('checked', false);
    $('.chk_sty').prop('checked', false);
    $(".delete_nm").hide();
    $(".srch_itm").show();
});
