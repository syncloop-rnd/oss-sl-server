let apiList = {};
let othersJsTree = null;
var SERVICE_TYPE = "API";
var embedded_services_label = "embedded";
var embedded_services_context = "contexts";
var embedded_services_function = "functions";
if (typeof parent.closeDebuggingPanels === 'function') {
    parent.closeDebuggingPanels();
}

if (localStorage.getItem("simulation_snapshot")) {
    $("#stop_simulation_btn").show();
}

//Initialize bootstrap tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, {
        trigger: 'hover'
    });
});
const textElement = document.getElementById("currentServiceNameNative");
const copyButton = document.getElementById("copy");

const copyText = (e) => {
    window.getSelection().selectAllChildren(textElement);
    document.execCommand("copy");
    e.target.setAttribute("tooltip", "Copied! ✅");
};

const resetTooltip = (e) => {
    e.target.setAttribute("tooltip", "Copy to Full Qualified Name");
};

if (null != copyButton) {
    copyButton.addEventListener("click", (e) => copyText(e));
    copyButton.addEventListener("mouseover", (e) => resetTooltip(e));
}

let copyText2 = document.querySelector(".copy-text2");
document.querySelector("#path-copy").onclick = function() {
    document.querySelector("#full_path").select();
    document.execCommand("copy");
    copyText2.classList.add("active");
    window.getSelection().removeAllRanges();
    setTimeout(function() {
        copyText2.classList.remove("active");
    }, 2500);
};

var to_input = false;
$('#input_search_panel').keyup(function() {
    if (to_input) {
        clearTimeout(to_input);
    }
    to_input = setTimeout(function() {
        var v = $('#input_search_panel').val();
        $('#input_schema_editor_jsTree').jstree(true).search(v, false, true);
    }, 250);
});

var output_input = false;
$('#output_search_panel').keyup(function() {
    if (output_input) {
        clearTimeout(output_input);
    }
    output_input = setTimeout(function() {
        var v = $('#output_search_panel').val();
        $('#output_schema_editor_jsTree').jstree(true).search(v, false, true);
    }, 250);
});

var flow_input = false;
$('#flow_search_panel').keyup(function() {
    if (flow_input) {
        clearTimeout(flow_input);
    }
    flow_input = setTimeout(function() {
        var v = $('#flow_search_panel').val();
        flowDesignerJsTreeRef.search(v, false, true);
    }, 250);
});


loadFile = getUrlParam("loadFile");
flowDesignerJsTreeRef = createFlowJstree('#flowDesignerJsTreeAPI');

$("#flowDesignerJsTree").on('load_node.jstree', function(e, data) {
    refreshFlowNodeData(data.node);
});

$("#flowDesignerJsTree").on('create_node.jstree', function(e, data) {
    refreshFlowNodeData();
});

$("#flowDesignerJsTree").on('delete_node.jstree', function(e, data) {
    refreshFlowNodeData();
});

$("#flowDesignerJsTree").on('move_node.jstree', function(e, data) {
    enforceNodeRestrictions(e,data,false);
});

$("#flowDesignerJsTree").on('copy_node.jstree', function(e, data) {
    enforceNodeRestrictions(e,data, true);
});

$("#flowDesignerJsTree").on('paste_node.jstree', function(e, data) {
    enforceNodeRestrictions(e,data,false);
});

$("#flowDesignerJsTree").on('open_node.jstree', function(e, data) {
    refreshFlowNodeData(data.node);
});

function enforceNodeRestrictions(e, data, copy) {
    var node = data.node;
    var newParent = flowDesignerJsTreeRef.get_node(data.parent);
    if (node.text === "CONDITION" && newParent.text !== "Ifelse") {
        if (copy) {
            flowDesignerJsTreeRef.delete_node(node);
            refreshFlowNodeData();
        }else{
            flowDesignerJsTreeRef.move_node(node, data.old_parent, data.old_position);
            refreshFlowNodeData();
        }
       swal({
            title: "Invalid Operation.",
            text: "CONDITION node must only reside within an Ifelse block.",
            type: "error",
            confirmButtonColor: "#f2533e"
            });

    }
    else if ((node.text === "TRY" || node.text === "CATCH" || node.text === "FINALLY") && newParent.text !== "TCF-Block") {
        if (copy) {
            flowDesignerJsTreeRef.delete_node(node);
            refreshFlowNodeData();
        }else{
            flowDesignerJsTreeRef.move_node(node, data.old_parent, data.old_position);
            refreshFlowNodeData();
        }
        swal({
            title: "Invalid Operation.",
            text: `${node.text} node must only reside within a TCF-Block.`,
            type: "error",
            confirmButtonColor: "#f2533e"
            });

    }
    /*else if ((node.text === "TRY" || node.text === "CATCH" || node.text === "FINALLY") && newParent.text === "TCF-Block") {
        var tcfCount = flowDesignerJsTreeRef.get_node(data.parent).children.length;
        if (tcfCount > 3) {
            if (copy) {
                flowDesignerJsTreeRef.delete_node(node);
                refreshFlowNodeData();
            }else {
                flowDesignerJsTreeRef.move_node(node, data.old_parent, data.old_position);
                refreshFlowNodeData();
            }
            swal('Invalid Operation.', `${node.text} node cannot be added because the TCF-Block already contains three control nodes.`, 'error');
        }
    }*/
    else if (node.text === "TCF-Block" && newParent.text === "Switch") {
        if (copy) {
            flowDesignerJsTreeRef.delete_node(node);
            refreshFlowNodeData();
        }else{
            flowDesignerJsTreeRef.move_node(node, data.old_parent, data.old_position);
            refreshFlowNodeData();
        }
        swal({
            title: "Invalid Operation.",
            text: "TCF-Block node cannot be moved within a Switch block.",
            type: "error",
            confirmButtonColor: "#f2533e"
            });

    }
    else if (node.text === "CASE" && newParent.text !== "Switch") {
        if (copy) {
            flowDesignerJsTreeRef.delete_node(node);
            refreshFlowNodeData();
        }else{
            flowDesignerJsTreeRef.move_node(node, data.old_parent, data.old_position);
            refreshFlowNodeData();
        }
        swal({
            title: "Invalid Operation.",
            text: "CASE node must only reside within a Switch block.",
            type: "error",
            confirmButtonColor: "#f2533e"
         });

    }
    else {
        refreshFlowNodeData();
    }

}

function refreshFlowNodeData(node) {
    if (!node)
        node = flowDesignerJsTreeRef.get_node("#");
    if (node.children_d.length > 0) {
        for (var i = 0; i < node.children_d.length; i++) {

            //addButtons(node.children_d[i]);
            replaceAndAdd(node.children_d[i]);

            setFlowElemProperty(node.children_d[i], "comment");
            setFlowElemProperty(node.children_d[i], "switch");
            setFlowElemProperty(node.children_d[i], "case");
            setFlowElemProperty(node.children_d[i], "ifcondition");
            setFlowElemProperty(node.children_d[i], "condition");
            setFlowElemProperty(node.children_d[i], "status");
            setFlowElemProperty(node.children_d[i], "snap");
            setFlowElemProperty(node.children_d[i], "snapCondition");
            setFlowElemProperty(node.children_d[i], "requestMethod");
            setFlowElemProperty(node.children_d[i], "inArray");
            setFlowElemProperty(node.children_d[i], "outArray");
        }
    }
}

function addButtons(nodeId) {
    var nodeAnchor = $("#" + nodeId + "_anchor");
    if (null == nodeAnchor[0]) {
        return;
    }

    if (nodeAnchor[0].innerText == "REDO" || nodeAnchor[0].innerText == "FOREACH" || nodeAnchor[0].innerText == "TRY" ||
        nodeAnchor[0].innerText == "CATCH" || nodeAnchor[0].innerText == "FINALLY" || nodeAnchor[0].innerText == "CASE" || nodeAnchor[0].innerText == "CONDITION") {

        nodeAnchor.after('<div class="group_buttons"><a href="javascript:void(0)"><span>+</span> Add Group</a><a href="javascript:void(0)"><span>+</span> Add Inner Group</a></div>');

    }
}

function setFlowElemProperty(nodeId, attribute, text, cls, pos, onlyUI) {
    if (!pos)
        pos = "postFix";
    if (!onlyUI)
        onlyUI = false;
    if (!cls)
        cls = "";
    var node = flowDesignerJsTreeRef.get_node(nodeId);
    var nodeAnchor = $("#" + nodeId + "_anchor");
    if (!node.data)
        node.data = {};
    if (!onlyUI) {
        if (text == null)
            text = node.data[attribute];
        else {
            //alert(text);
            node.data[attribute] = text;
            //alert(node.data[attribute]);
        }
    }
    var attributeId = nodeId + "_" + attribute;
    if (document.getElementById(attributeId) != null)
        $("#" + attributeId).remove();
    if (text != null) {
        if (attribute == "comment")
            if (text.trim() !== '') {
                text = "(" + text + ")";
            } else {
                text = null;
            }
        else if (attribute == "case" || attribute == "switch" || attribute == "ifcondition" || attribute == "condition")
            text = ": " + text;
        else if (attribute == "inArray" || attribute == "outArray") {
            if (attribute == "inArray") {
                text = " " + node.data[attribute];
            } else if (attribute == "outArray") {
                text = " --> " + node.data[attribute];
            }
            if (!text.includes("Index:")) {
                //text += " Index: " + node.data["indexVar"];
            }
        }
        else if (attribute == "status") {
            if (text == "disabled") {
                text = " (DISABLED)";
                if (nodeAnchor.length > 0) {
                    nodeAnchor[0].className += " disabled-invoke-link ";
                }
                cls += " disabled-invoke-text ";
            } else text = null;
        } else if (attribute == "snap") {
            if (text == "enabled" || text == "conditional")
                text = " <i class='wr_snp'><img src='" + getSystemResourcePath() + "/icons/camera-map.svg'></i> Snap ";
            else text = null;
        } else if (attribute == "requestMethod") {
            if (text == "async") {
                text = "<i class='wr_asy'><img src='" + getSystemResourcePath() + "/icons/async_icon.svg'></i>";
                cls = "glyphicon glyphicon-transfer-";
                pos = "preFix";
            } else if (text == "asyncQueue") {
                text = "<i class='wr_asy'><img src='" + getSystemResourcePath() + "/icons/async_icon_clock.svg'></i>";
                cls = "glyphicon glyphicon-transfer-";
                pos = "preFix";
            } else text = null;
        } else text = null;
        if (text != null)
            if (pos == "postFix")
                nodeAnchor.append("<span id='" + attributeId + "' class='jstree-non-anchor " + cls + "'>" + text + "</span>");
            else
                nodeAnchor.append("<span id='" + attributeId + "' class='jstree-non-anchor " + cls + "'>" + text + "</span>");
    } else if (cls != "") {
        if (pos == "postFix")
            nodeAnchor.append("<span id='" + attributeId + "' class='jstree-non-anchor " + cls + "'>" + text + "</span>");
        else
            nodeAnchor.append("<span id='" + attributeId + "' class='jstree-non-anchor " + cls + "'>" + text + "</span>");
    }
}

$("#elementConditionInput").keyup(function () {
    if ($(this).val().trim() != "") {
        $("#elementRepeatTimesInput").val("-1");
        $("#elementRepeatTimesInput").attr("readonly", "readonly");
        setFlowElemAttribOnSelected('redo', "-1");
    } else {
        $("#elementRepeatTimesInput").removeAttr("readonly");
    }
});

function setFlowElemAttribOnSelected(attrib, text, cls, pos, onlyUI) {
    var sel = flowDesignerJsTreeRef.get_selected()[0];
    if (attrib == "snap") {
        if (text == 'conditional')
            $('#elementSnapCondition').css('display', 'block');
        else
            $('#elementSnapCondition').css('display', 'none');
    }
    if (sel)
        setFlowElemProperty(sel, attrib, text, cls, pos, onlyUI);
    else
        alert("No element selected");

    if (attrib == "requestMethod" && (text == "async" || text == "asyncQueue")) {
        $("#invokeRequestMethodAsyncProp").show();
    } else {
        $("#invokeRequestMethodAsyncProp").hide();
    }

}

function dropElement() {
    mapperObj.drop();
}

$("#flowDesignerJsTree").on('changed.jstree', function(e, data) {
    // alert("Change");
    flowJsTree_id = loadFile + "_flowJsTree";
    var data = flowDesignerJsTreeRef.get_json('#', {
        flat: true
    });
    localStorage.setItem(flowJsTree_id, JSON.stringify(data));
    setUnsavedChanges(loadFile);
    apiDesignWatermarkAppearance();
    // alert("saved to local");
});

var asyncInDoc = {
    "id": "asyncIn_j2_1",
    "text": "asyncInputDoc",
    "li_attr": {
        "id": "asyncIn_j2_1_attr"
    },
    "a_attr": {
        "href": "#",
        "id": "asyncIn_j2_1_anchor"
    },
    "state": {
        "loaded": true,
        "opened": true,
        "selected": false,
        "disabled": false
    },
    "data": {},
    "children": [{
        "id": "asyncIn_j2_2",
        "text": "*metaData",
        "li_attr": {
            "id": "asyncIn_j2_2_attr"
        },
        "a_attr": {
            "href": "#",
            "id": "asyncIn_j2_2_anchor"
        },
        "state": {
            "loaded": true,
            "opened": false,
            "selected": false,
            "disabled": false
        },
        "data": {},
        "children": [],
        "type": "document"
    }],
    "type": "document"
};

var asyncOutDoc = {
    "id": "asyncOut_j3_1",
    "text": "asyncOutputDoc",
    "li_attr": {
        "id": "asyncOut_j3_1_attr"
    },
    "a_attr": {
        "href": "#",
        "id": "asyncOut_j3_1_anchor"
    },
    "state": {
        "loaded": true,
        "opened": true,
        "selected": false,
        "disabled": false
    },
    "data": {},
    "children": [{
        "id": "asyncOut_j3_2",
        "text": "*metaData",
        "li_attr": {
            "id": "asyncOut_j3_2_attr"
        },
        "a_attr": {
            "href": "#",
            "id": "asyncOut_j3_2_anchor"
        },
        "state": {
            "loaded": true,
            "opened": true,
            "selected": true,
            "disabled": false
        },
        "data": {},
        "children": [{
            "id": "asyncOut_j3_3",
            "text": "batchId",
            "li_attr": {
                "id": "asyncOut_j3_3_attr"
            },
            "a_attr": {
                "href": "#",
                "id": "asyncOut_j3_3_anchor"
            },
            "state": {
                "loaded": true,
                "opened": false,
                "selected": false,
                "disabled": false
            },
            "data": {},
            "children": [],
            "type": "string"
        }, {
            "id": "asyncOut_j3_4",
            "text": "status",
            "li_attr": {
                "id": "asyncOut_j3_4_attr"
            },
            "a_attr": {
                "href": "#",
                "id": "asyncOut_j3_4_anchor"
            },
            "state": {
                "loaded": true,
                "opened": false,
                "selected": false,
                "disabled": false
            },
            "data": {},
            "children": [],
            "type": "string"
        }],
        "type": "document"
    }],
    "type": "document"
};

function hideMappingArea() {
    $("#mappingArea").hide();
}

$("#flowDesignerJsTree").on('select_node.jstree', function(e, data) {

    var evt =  window.event || event;
    var button = evt.which || evt.button;
    if( button != 1 && ( typeof button != "undefined")) return false;

    if (localStorage.getItem("simulation_snapshot") && !warningPopupCalled) {
        IS_LOOP_STEP = (data.node.type == "foreach" || data.node.type == "loop" || data.node.type == "redo" || data.node.type == "repeat");
        LOOP_RECURSION = false;
        loadDebuggingData(data.node.data.guid);
    }
    mapperObj.clean();
    $("#mappingArea").css("display", "none");
    var flowDesignerJsTree = $("#flowDesignerJsTree");
    //flowDesignerJsTree.css("height","95%");
    $("#centerServiceName").html("");
    launching_arrow_jsTree_ref.settings.core.data = [];
    launching_arrow_jsTree_ref.refresh();
    landing_arrow_jsTree_ref.settings.core.data = [];
    landing_arrow_jsTree_ref.refresh();

    if (data.node.type == 'invoke' || data.node.type == 'function' || data.node.type == 'object') {
        flowDesignerJsTree.css("height", "55%");
        $("#plainMapping").css("display", "none");
        $("#serviceMapping").css("display", "block");
        $("#mappingArea").css("display", "block");
        //alert("");

        //console.log(data.node.data.serviceType);
        if (!data.node.data)
            data.node.data = {};

        if (data.node.data.serviceType) {
            //var response=syncRestRequest("/files/"+data.node.text+"."+data.node.data.serviceType, "GET", "");
            let node = data.node;
            let nodeService = data.node.text;
            if (null != node.data && null != node.data.fqn && (data.node.type == 'invoke' || data.node.type == 'object')) {
                nodeService = node.data.fqn;
            } else if (data.node.type == 'function') {
                nodeService = node.data.acn + "." + node.data.function + "_" + data.node.data.identifier;
            }
            if (SDK_EMBEDDED) {
                asyncRestRequest(SERVICE_ENDPOINT + "/tenant/default/public/getServiceAsResponse?location=/" + nodeService + "." + data.node.data.serviceType, "", "GET",
                    function(res1) {
                      updateService(res1);
                    },
                    function(errormessage) {
                        console.error("Error fetching service data");
                    }
                );
            } else {
                asyncRestRequest("/files/" + nodeService + "." + data.node.data.serviceType, "", "GET",
                    function(res2) {
                        updateService(res2);
                    },
                    function(errormessage) {
                        console.error("Error fetching service data");
                    }
                );
            }

            function updateService(response){
                LOADED_SERVICE_IO[node.data.fqn + "." + node.data.serviceType + "_OUTPUT"] = null;
                //console.log(response);
                setTimeout(function() {
                        if (data.node.data.serviceType == "flow" || data.node.data.serviceType == "api")
                            response = response.latest;
                        removeIcons(response.input);
                        removeIcons(response.output);
                        var inData = response.input;
                        var outData = response.output;
                        var randomId = Math.floor(Math.random() * 10000);
                        /**
                         * Not Required after Await.
                         if(data.node.data.requestMethod=="async"){
                         var asyncTempInDoc=JSON.parse(JSON.stringify(asyncInDoc));
                         var asyncTempOutDoc=JSON.parse(JSON.stringify(asyncOutDoc));

                         //modifyJsTreeIds(asyncTempInDoc,randomId+"_async_funcInput");
                         //modifyJsTreeIds(asyncTempOutDoc,randomId+"_async_funcOutput");
                         //inData.push(asyncTempInDoc[0].children[0]);
                         $.merge(asyncTempInDoc.children,inData);
                         //asyncTempInDoc[0].children.concat(inData);

                         //outData.push(asyncTempOutDoc[0].children[0]);
                         $.merge(asyncTempOutDoc.children,outData);
                         //asyncTempOutDoc[0].children.concat(outData);

                         inData=[asyncTempInDoc];
                         outData=[asyncTempOutDoc];

                         }*/
                        modifyJsTreeIds(inData, randomId + "_funcInput");
                        modifyJsTreeIds(outData, randomId + "_funcOutput");

                        launching_arrow_jsTree_function_ref.settings.core.data = outData;
                        launching_arrow_jsTree_function_ref.refresh();
                        landing_arrow_jsTree_function_ref.settings.core.data = inData;
                        landing_arrow_jsTree_function_ref.refresh();
                        getAllVisibleInputs(data.node);
                        setTimeout(function() {
                            mapperObj.init(data.node);
                            setTimeout(function() {
                                mapperObj.reMap();
                                //mapperObj.enableMappingOnJstree("#landing_arrow_jsTree_function");
                            }, 200);
                        }, 200);

                        //$("#centerServiceName").html(data.node.text.replace("files/", "").replaceAll("/", " > ") + "."+data.node.data.serviceType);
                        let node = data.node;
                        let nodeService = data.node.text;
                        if (null != node.data && null != node.data.fqn) {
                            nodeService = node.data.fqn;
                        } else if (data.node.type == 'function') {
                            nodeService = "@" + node.data.acn + "." + node.data.function;
                        }

                        $("#centerServiceName").html(nodeService.replace("files/", "").replaceAll("/", " > ") + "." + data.node.data.serviceType);
                }, 200);
            }

        } else {
            mapperObj.init(data.node);
            setTimeout(function() {
                getAllVisibleInputs(data.node);
            }, 200);
        }
    } else if (data.node.type == 'map' || data.node.type == 'transformer') {
        flowDesignerJsTree.css("height", "55%");
        $("#serviceMapping").css("display", "none");
        $("#plainMapping").css("display", "block");
        $("#mappingArea").css("display", "block");

        setTimeout(function() {
            getAllVisibleInputs(data.node);
            setTimeout(function() {
                mapperObj.init(data.node);
                setTimeout(function() {
                    mapperObj.reMap();
                    mapperObj.enableMappingOnJstree("#landing_arrow_jsTree_function");
                }, 200);
            }, 200);
        }, 200);
    } else {
        flowDesignerJsTree.css("height", "95%");
    }
    setTimeout(function() {
        flowStepIOHeightAdjuster();
    }, 1000);
});

inputJstreeRef = createSchemaJstree('#input_schema_editor_jsTree');

$("#input_schema_editor_jsTree").on('changed.jstree', function(e, data) {
    inputJsTree_id = loadFile + "_inputJsTree";
    var data = inputJstreeRef.get_json('#', {
        flat: true
    });
    localStorage.setItem(inputJsTree_id, JSON.stringify(data));
    setUnsavedChanges(loadFile);
    inputWatermarkAppearance();
});

outputJstreeRef = createSchemaJstree('#output_schema_editor_jsTree');


$("#output_schema_editor_jsTree").on('changed.jstree', function(e, data) {
    outputJsTree_id = loadFile + "_outputJsTree";
    var data = outputJstreeRef.get_json('#', {
        flat: false
    });
    localStorage.setItem(outputJsTree_id, JSON.stringify(data));
    setUnsavedChanges(loadFile);
    outputWatermarkAppearance();
});

launching_arrow_jsTree_ref = createSchemaJstree('#launching_arrow_jsTree');
landing_arrow_jsTree_ref = createSchemaJstree('#landing_arrow_jsTree');

launching_arrow_jsTree_function_ref = createSchemaJstree('#launching_arrow_jsTree_function');
landing_arrow_jsTree_function_ref = createSchemaJstree('#landing_arrow_jsTree_function');
var mapperObj = new mapper("#launching_arrow_jsTree", "#landing_arrow_jsTree", "#landing_arrow_jsTree_function", "#launching_arrow_jsTree_function");

function modifyJsTreeIds(jsonObject, postFix) {
    jQuery.each(jsonObject, function(i, val) {
        if (val.id && val.id != '#') {
            val.id = val.id + "_" + postFix + "_";
            //console.log(val);
            val.a_attr.id = val.id + "_anchor";
            val.li_attr.id = val.id;
            if (val.parent && val.parent != '#')
                val.parent = val.parent + "_" + postFix + "_";
            if (val.children)
                modifyJsTreeIds(val.children, postFix);
        }
    });
}

function loadRemoteFile(overwrite) {
    if (overwrite == null && localStorage.getItem(loadFile) != "overwrite")
        overwrite = false;
    else {
        overwrite = true;
    }
    inputJsTree_id = loadFile + "_inputJsTree";
    outputJsTree_id = loadFile + "_outputJsTree";
    flowJsTree_id = loadFile + "_flowJsTree";
    if (loadFile != false) {
        if (SDK_EMBEDDED){
            let response = SERVICE_JSON_RESPONSE.payload;
            response = JSON.parse(response);
            processRemoteResponse(response);
            loadFromlocalstorage(overwrite);
        }else{
            asyncRestRequest("/" + loadFile, null,"GET",
                function (res){
                    processRemoteResponse(res);
                    loadFromlocalstorage(overwrite);
                },
                function (e){
                console.error("Unable to extract response from remoteLoadFile");
                })

        }
    }

    function processRemoteResponse(response) {
        updateUUID(response.latest.api);

        if (null != response.created_on && '' == response.created_on) {
            $("#created_on_service").val(response.created_on);
        }


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

        if (response.enableServiceDocumentValidation)
            $("#enableServiceDocumentValidation").prop("checked", response.enableServiceDocumentValidation); //val()

        response = response.latest;
        //   console.log(window.atob(response.imports));
        removeIcons(response.input);
        removeIcons(response.output);
        removeIcons(response.api);

        if (null != response.api_info) {
            $("#api_info_title").val(response.api_info.title);
            $("#api_info_description").val(response.api_info.description);
        }

        for (let i = 0 ; i < response.input.length ; i++) {
            if (null == response.input[i].state) {
                continue;
            }
            response.input[i].state.hidden = false;
        }

        for (let i = 0 ; i < response.output.length ; i++) {
            if (null == response.output[i].state) {
                continue;
            }
            response.output[i].state.hidden = false;
        }

        for (let i = 0 ; i < response.api.length ; i++) {
            if (null == response.api[i].state) {
                continue;
            }
            response.api[i].state.hidden = false;
        }

        var inputJsTree_data = localStorage.getItem(inputJsTree_id);
        if (inputJsTree_data == null || inputJsTree_data.trim().length == 0 || overwrite) {
            var data = response.input;
            if (data != null) {
                var dataJson = JSON.stringify(data);
                localStorage.setItem(inputJsTree_id, dataJson);
            }
        }

        var outputJsTree_data = localStorage.getItem(outputJsTree_id);
        if (outputJsTree_data == null || outputJsTree_data.trim().length == 0 || overwrite) {
            var data = response.output;
            if (data != null)
                localStorage.setItem(outputJsTree_id, JSON.stringify(data));
        }

        var flowJsTree_data = localStorage.getItem(flowJsTree_id);
        if (flowJsTree_data == null || flowJsTree_data.trim().length == 0 || overwrite) {
            var data = response.api;
            if (data != null)
                localStorage.setItem(flowJsTree_id, JSON.stringify(data));
        }
        refreshAlias();
    }
}


function refreshAlias() {
    var urlLoadFile = loadFile.trim() + "$";
    var packageName = ("/" + urlLoadFile).replace("/files/", "alias?fqn=").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main");
    packageName = packageName.split("/").join(".");
    var urlPath = "/" + packageName;

    asyncRestRequest(
        urlPath,
        "",
        "GET",
        function(response) {
            var fullAlias = response.alias;
            var alias = null;
            var method = "GET";
            if (fullAlias) {
                method = fullAlias.split("/")[0];
                alias = ("#" + fullAlias).replace("#" + method, "");
            }
            if (alias == null || alias.trim().length == 0) {
                alias = "/" + packageName.replace("alias?fqn=", "");
                method = "GET";
            }

            $("#serviceAliasValue").val(alias);
            $("#serviceHTTPMethodValue").val(method);

            // var cookies = document.cookie.split(";");
            // for (var i = 0; i < cookies.length; i++) {
            //     var coo = cookies[i].split("=");
            //     if (coo[0].trim() == "tenant") {
            //         $(".service_full_path").val(location.origin + "/tenant/" + coo[1].replaceAll('"', "").split(" ")[0] + alias);
            //     }
            // }

            $(".service_full_path").val(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + alias);

            var propertyPath = loadFile.trim() + "$";
            propertyPath = propertyPath.replace(".service$", ".properties").replace(".api$", ".properties").replace(".flow$", ".properties").replace(".sql$", ".properties");
            var propFileName = (propertyPath.split("/").join(".")).replace("files.", "");
            var propURLPath = ("/files/packages/" + propertyPath.split("/")[2] + "/dependency/config/" + propFileName);

            asyncRestRequest(
                propURLPath,
                "",
                "GET",
                function(responseProps) {
                    $("#servicePropertiesFile").val(responseProps.payload);
                    enableCheckboxesForConfig(responseProps.payload);
                },
                function(errormessage) {
                    if(errormessage.responseText.startsWith("#")){
                        $("#servicePropertiesFile").val(errormessage.responseText);
                        enableCheckboxesForConfig(errormessage.responseText);
                    }/*else
                        swal('Error', errormessage.responseJSON ? errormessage.responseJSON.msg.toUpperCase() : 'An unexpected error occurred', 'error');*/
                }
            );
        },
        function(errormessage) {
            swal({
                title: 'Error',
                text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                type: "error",
                confirmButtonColor: "#f2533e"
                });

        }
    );
}


function loadFromlocalstorage(overwrite) {
    //alert("loaded");
    localStorage.setItem("enableServiceSelectionMode", false);
    inputJsTree_id = loadFile + "_inputJsTree";
    outputJsTree_id = loadFile + "_outputJsTree";
    flowJsTree_id = loadFile + "_flowJsTree";
    var inputRef = inputJstreeRef;
    var data = localStorage.getItem(inputJsTree_id);
    if (data != null && data.trim().length > 0) {
        setUnsavedChanges(loadFile);
        inputRef.settings.core.data = JSON.parse(data);
        inputRef.refresh();
    }

    var outputRef = outputJstreeRef;
    var data = localStorage.getItem(outputJsTree_id);
    if (data != null && data.trim().length > 0) {
        setUnsavedChanges(loadFile);

        outputRef.settings.core.data = JSON.parse(data);
        outputRef.refresh();
    }

    var flowRef = flowDesignerJsTreeRef;
    var data = localStorage.getItem(flowJsTree_id);
    if (data != null && data.trim().length > 0) {
        setUnsavedChanges(loadFile);

        data = JSON.parse(data);

        for (var i = 0; i < data.length; i++) {
            if (data[i].a_attr !== undefined && data[i].a_attr.href !== undefined) {
                data[i].a_attr.href = "javascript:void(0)";
            }
        }

        flowRef.settings.core.data = data;
        flowRef.refresh();
    }

    let pathItems = SDK_EMBEDDED ? "" : loadFile.replace("files/", "").split("/");

    let HTML = pathItems[0];
    let filePath = "";
    for (let i = 1; i < pathItems.length; i++) {
        filePath += "/" + pathItems[i - 1];

        HTML += " > " + "<a href='javascript:focusOnElement(\"files" + filePath + "/" + pathItems[i] + "\")'>" + pathItems[i] + "</a>";
    }

    $("#currentServiceName").html(HTML);
    $("#currentServiceNameNative").html(loadFile);
    if (overwrite != false)
        setUnsavedChanges(loadFile, false);
}

function unLockArtifact() {
    var $testButton = $("#unLockSpinner");
    $testButton.hide();
    $testButton.before('<div id="testSpinner" class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>');

    collecta('UNLOCK', '', 'Unlock', 'Unlocking API');
    asyncRestRequest(
        ("/flow/" + loadFile).replace("/flow/files/", "/artifact/unlock/"),
        null,
        "POST",
        function(response) {
            if (response.status === "200") {
                localStorage.setItem(loadFile, "");
                swal({
                    title: 'Accepted.',
                    text: "You've successfully unlocked this service.",
                    type: 'success',
                    confirmButtonColor: "#2C61F5"
                });

                swal({
                    title: 'Accepted.',
                    text: "You've successfully unlocked this service.",
                    type: 'success',
                    confirmButtonColor: "#2C61F5",
                    showCancelButton: false,
                    confirmButtonText: 'OK',
                    closeOnConfirm: true
                }, function (isConfirm) {
                    if (isConfirm) {
                        // Remove the class after confirmation click
                        document.querySelector('.confirm')?.classList.remove('confirm_bluebtn');
                    }
                });

                // Add class after SweetAlert is rendered
                setTimeout(function () {
                    const confirmBtn = document.querySelector('.confirm');
                    if (confirmBtn) {
                        confirmBtn.classList.add('confirm_bluebtn');
                    }
                }, 0);

            }
            $("#testSpinner").remove();
            $testButton.show();
        },
        function(errormessage) {
            $("#testSpinner").remove();
            $testButton.show();
            swal({
                title: 'Access denied.',
                text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                type: "error",
                confirmButtonColor: '#f2533e'
            });

        }
    );
}
function lockArtifact() {
    var $testButton = $("#lockSpinner");
    $testButton.hide();
    $testButton.before('<div id="testSpinner" class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>');

    collecta('LOCK', '', 'Lock', 'Locking API');
    asyncRestRequest(
        ("/flow/" + loadFile).replace("/flow/files/", "/artifact/lock/"),
        null,
        "POST",
        function(response) {
            if (response.status === "200") {
                localStorage.setItem(loadFile, "");
                const message = "You've successfully locked this service.";
               swal({
                title: 'Success!',
                text: message,
                type: 'success', // use 'icon' instead of 'type' for compatibility
                confirmButtonColor: '#2C61F5' // custom blue color
                });

                swal({
                        title: 'Success!',
                        text: message,
                        type: 'success',
                        showCancelButton: false,
                        confirmButtonColor: '#f2533e',
                        confirmButtonText: 'OK',
                        closeOnConfirm: true
                    }, function(isConfirm) {
                        if (isConfirm) {
                            // ✅ Remove class on confirm click
                            const confirmBtn = document.querySelector('.confirm');
                            if (confirmBtn) {
                                confirmBtn.classList.remove('confirm_bluebtn');
                            }
                        }
                    });

                    // ✅ Add class after button is rendered
                    setTimeout(function () {
                        const confirmBtn = document.querySelector('.confirm');
                        if (confirmBtn) {
                            confirmBtn.classList.add('confirm_bluebtn');
                        }
                    }, 0);
            }
            $("#testSpinner").remove();
            $testButton.show();
        },
        function(errormessage) {
            $("#testSpinner").remove();
            $testButton.show();
           swal({
  title: 'Access denied.',
  text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
 type: "error",
  confirmButtonColor: '#f2533e'
});

        }
    );
}


function openCloneConfigurationForm() {
    localStorage.setItem("cloneServiceProcess", "true");
    var modal = document.getElementById("cloneModelDialog");
    var span = document.getElementById("closeCloneModelDialog");
    var cloneItButton = document.getElementById("cloneIt");
    modal.style.display = "block";
    span.onclick = function() {
        modal.style.display = "none";
        //$(".elementProperty").css("display","none");
    }

    var defaultCloneInputValue = ("#" + loadFile).replace("#files/packages/", "").replace(".api", "");
    $("#CloneInput").val(defaultCloneInputValue);

    cloneItButton.onclick = function() {
        var $cloneButton = $("#cloneIt");
        $cloneButton.text('');
        $cloneButton.append('<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>');

        let newLocation = $("#CloneInput").val();

        if (newLocation === defaultCloneInputValue) {
           swal({
                title: "No Change Detected",
                text: "Please change the location before proceeding.",
                type: "error",
                confirmButtonColor: "#f2533e" // Red button
                });

            $cloneButton.find(".spinner-border").remove();
            $cloneButton.text('Clone');
            return;
        }

        if (newLocation.trim() == "") {
            swal({
                title: "Invalid Name",
                text: "Invalid new API service name.",
                type: "error",
                confirmButtonColor: "#f2533e" // optional: red button
                });

            return ;
        }
        let newLocationArray = newLocation.split("/");
        if (newLocationArray.length < 2) {
            swal({
                title: "Invalid Path",
                text: "Please provide package name/folder name.",
                type: "error",
                confirmButtonColor: "#f2533e" // Optional: custom red confirm button
                });

            return ;
        }
        for (let i = 0 ; i < newLocationArray.length ; i++) {
            let message = validateVariableName(newLocationArray[i]);
            if ("" !=message) {
                swal({
                    title: "Invalid Path/Name",
                    text: message,
                    type: "error",
                    confirmButtonColor: "#f2533e" // Optional: Customize confirm button color
                    });

                return ;
            }
        }
        save("files/packages/" + newLocation + ".api");
        cloneProperties("files/packages/" + newLocation);
        collecta('Save', '', 'Clone', 'Cloning API : ' + newLocation);
        modal.style.display = "none";
        if (isInIframe()) {
            parent.loadPackages();
        } else {
            refreshServices();
        }
        $cloneButton.find(".spinner-border").remove();
        $cloneButton.text('Clone');
    }

}

function cloneThisService() {

    let newLocation = prompt("It will overwrite any existing file and It can create entire path including new package.\nSave As", ("#" + loadFile).replace("#files/packages/", ""));
    if (newLocation != null && newLocation.trim().length > 0 && newLocation != loadFile) {
        save("files/packages/" + newLocation);
        cloneProperties("files/packages/" + newLocation);
    }
}

let SILENT_SAVE_ONCE = false;

function validateSwitchAndIfElseCases(data) {
    function validateSwitch(switchNode) {
        if (!switchNode.children || switchNode.children.length === 0) {
            swal({
                title: 'Validation Error',
                text: 'There must be at least one Switch Case present!',
                type: 'error',
                confirmButtonColor: '#f2533e' // optional styling
                });

            return false;
        }

        const cases = switchNode.children.map(child => child.data.case);
        const nullCases = cases.filter(c => c === "#null");
        const defaultCases = cases.filter(c => c === "#default");

        if (nullCases.length > 1) {
            swal({
                title: 'Validation Error',
                text: 'Switch: Only one #null case is allowed.',
                type: 'error',
                confirmButtonColor: '#f2533e' // optional
                });

            return false;
        }
        if (defaultCases.length > 1) {
            swal({
                title: 'Validation Error',
                text: 'Switch: Only one #default case is allowed.',
                type: 'error',
                confirmButtonColor: '#f2533e' // optional, for custom button color
                });

            return false;
        }

        const nullIndex = cases.indexOf("#null");
        const defaultIndex = cases.indexOf("#default");

        if (defaultIndex !== -1) {
            if (defaultIndex !== cases.length - 1) {
                swal({
  title: 'Validation Error',
  text: 'Switch: #default case must be the last case.',
  type: 'error',
  confirmButtonColor: '#f2533e' // optional: custom color
});

                return false;
            }
        }
        if (nullIndex !== -1) {
            if (defaultIndex === -1) {
                if (nullIndex !== cases.length - 1) {
                    swal({
  title: 'Validation Error',
  text: 'Switch: #null case must be the last case if #default is not present.',
  type: 'error',
  confirmButtonColor: '#f2533e'
});

                    return false;
                }
            } else {
                if (nullIndex !== cases.length - 2) {
                    swal({
  title: 'Validation Error',
  text: 'Switch: #null case must be second last when #default is present.',
  type: 'error',
  confirmButtonColor: '#f2533e'
});

                    return false;
                }
                if (defaultIndex !== nullIndex + 1) {
                    swal({
  title: 'Validation Error',
  text: 'Switch: #null and #default cases must be consecutive.',
  type: 'error',
  confirmButtonColor: '#f2533e'
});

                    return false;
                }
            }
        }

        return true;
    }

    function validateIfElse(ifElseNode) {
        let hasElse = false;

        if (!ifElseNode.children || ifElseNode.children.length === 0) {
            swal({
                title: 'Validation Error',
                text: 'There must be at least one IfElse Case present!',
                type: 'error',
                confirmButtonColor: '#f2533e'
                });

            return false;
        }

        for (let i = 0; i < ifElseNode.children.length; i++) {
            const child = ifElseNode.children[i];
            const isElse = child.data.ifcondition === "#else";

            if (isElse) {
                if (hasElse || (isElse && i + 1 < ifElseNode.children.length && ifElseNode.children[i+1].data.ifcondition === "#else")) {
                    swal({
                        title: 'Validation Error',
                        text: 'IfElse: More than one #else found.',
                        type: 'error',
                        confirmButtonColor: '#f2533e'
                        });

                    return false;
                }

                if (i !== ifElseNode.children.length - 1) {
                    swal({
                            title: 'Validation Error',
                            text: 'IfElse: #else must be the last condition.',
                            type: 'error',
                            confirmButtonColor: '#f2533e'
                            });

                    return false;
                }

                hasElse = true;
            }
        }

        if (ifElseNode.children.length === 1 && hasElse) {
            swal({
                    title: 'Validation Error',
                    text: 'IfElse: Only #else cannot exist without a preceding condition.',
                    type: 'error',
                    confirmButtonColor: '#f2533e'
                    });

            return false;
        }

        for (const child of ifElseNode.children) {
            if (!traverseNode(child)) {
                return false;
            }
        }

        return true;
    }

    function traverseNode(node) {
        if (node.type === "switch") {
            if (!validateSwitch(node)) {
                return false;
            }
        } else if (node.type === "ifelse") {
            if (!validateIfElse(node)) {
                return false;
            }
        }

        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                if (!traverseNode(child)) {
                    return false;
                }
            }
        }

        return true;
    }

    const apiNodes = data.latest.api;
    if (!apiNodes || apiNodes.length === 0) {
        return false;
    }

    for (const apiNode of apiNodes) {
        if (!traverseNode(apiNode)) {
            return false;
        }
    }

    return true;
}

function save(servicePath, SDK_EMBEDDED = false) {
    var $saveButton = $("#saveButton");
    $saveButton.hide();
    $saveButton.before('<div id="saveSpinner" class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>');
    if (!servicePath)
        servicePath = loadFile;
    var dataJson = {
        "latest": {
            "createdTS": "",
            "input": [],
            "output": [],
            "api": [],
            "api_info": {
                "title": "",
                "description": ""
            }
        }
    };
    var version = "latest";
    dataJson[version].input = inputJstreeRef.get_json('#', {
        flat: false
    });
    dataJson[version].output = outputJstreeRef.get_json('#', {
        flat: false
    });
    dataJson[version].api = flowDesignerJsTreeRef.get_json('#', {
        flat: false
    });
    dataJson[version].api_info.title = $("#api_info_title").val();
    dataJson[version].api_info.description = $("#api_info_description").val();
    removeIcons(dataJson[version].input);
    removeIcons(dataJson[version].output);
    removeIcons(dataJson[version].api);
    //console.log(dataJson[version].flow);
    //   console.log(JSON.stringify(flowDesignerJsTreeRef.get_json('#', {flat:false})[10]));
    //flowDesignerJsTreeRef.get_json('#', {flat:true});
    dataJson.consumers = $("#serviceConsumers").val().toString();
    dataJson.developers = $("#serviceDevelopers").val().toString();
    dataJson.enableServiceDocumentValidation = $("#enableServiceDocumentValidation").prop("checked");

    if (null == $("#created_on_service").val() || '' == $("#created_on_service").val()) {
        dataJson.created_on = new Date().getTime() + "";
    } else {
        dataJson.created_on = $("#created_on_service").val() + "";
    }

    dataJson.modified_on = new Date().getTime();

    var data = JSON.stringify(dataJson);

    if (!validateSwitchAndIfElseCases(dataJson) && dataJson.latest.api.length > 0) {
        $("#saveSpinner").remove();
        $saveButton.show();
        return;
    }

    collecta('Save', '', 'API_Service', 'Service : ' + servicePath)

    if (SDK_EMBEDDED) {
        $("#saveSpinner").remove();
        $saveButton.show();
        return data;

    } else if (data != null && data.trim().length > 0) {

        asyncRestRequest(
            ("/api/" + servicePath).replace("/api/files/", "/api/"),
            data,
            "POST",
            function (response) {
                if (response.status === "200") {
                    localStorage.setItem(loadFile, "");
                    let cloneServiceProcess = !(localStorage.getItem("cloneServiceProcess") === "true");
                    //if (!SILENT_SAVE_ONCE) {
                    swal({
                            title: "API is Ready",
                            text: "Your changes are saved successfully!",
                            type: "success",
                            showCancelButton: cloneServiceProcess,
                            confirmButtonColor: "#2C61F5",
                            cancelButtonText: "API Configuration",
                            confirmButtonText: "Okay",
                            showLoaderOnConfirm: true,
                            closeOnConfirm: true,
                            closeOnCancel: true
                        },
                        function(isConfirm) {
                                 const confirmBtn = document.querySelector('.confirm');
                                    if (confirmBtn) {
                                        confirmBtn.classList.remove('confirm_bluebtn');
                                        confirmBtn.style.display = 'none'; // OR use remove() to fully delete
                                    }


                            if (isConfirm) {
                                //location.href = location.href.replaceAll("silentSave", "").replaceAll("developers", "").replaceAll("consumers", "");
                                if (!SILENT_SAVE_ONCE) {
                                    //reload();
                                    //localStorage.setItem(loadFile, "overwrite");
                                } else {
                                    SILENT_SAVE_ONCE = false;
                                }

                            } else {
                                openConfigurationPropertiesAsync(false);
                            }
                        });
                        setTimeout(function () {
                                const confirmBtn = document.querySelector('.confirm');
                                if (confirmBtn) {
                                    confirmBtn.classList.add('confirm_bluebtn');
                                }
                            }, 0);
                    /*} else {
                        SILENT_SAVE_ONCE = false;

                    }*/

                    $("#saveSpinner").remove();
                    $saveButton.show();

                    if (isInIframe()) {
                        parent.loadPackages();
                    }
                }
            },
       function (errormessage) {
                swal({
                    title: 'Access Denied.',
                    text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                    type: 'error',
                    confirmButtonColor: '#f2533e'
                });

                $("#saveSpinner").remove();
                $saveButton.show();
            }

        );


    } else{
        //alert("No changes to save");
        swal({
            title: "Warning !!",
            text: "No changes to save",
            type: "warning",
            confirmButtonColor: "#f2533e" // optional: yellow shade
            });


        $("#saveSpinner").remove();
        $saveButton.show();
    }
    localStorage.removeItem("cloneServiceProcess");

    saveConfigurationData();
}

function reload() {
    var $testButton = $("#reloadButton");
    $testButton.hide();
    $testButton.before('<div id="testSpinner" class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>');

    localStorage.setItem(loadFile, "overwrite");
    loadRemoteFile(true);
    setUnsavedChanges(loadFile, false);
    $("#testSpinner").remove();
    $testButton.show();
    location.reload(true);
    //window.location = window.location.href+'?eraseCache=true';
}

function openDocumentation() {
    location.href = getSystemResourcePath() + "/workspace/web/flowMaker/TinyMCE.html?loadFile=" + loadFile;
}

loadRemoteFile(false);

menu = null; //document.getElementById('input_schema_editor_jsTree_contextMenu');

function showMenu(x, y) {
    console.log(x,y);
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = "block";
    menu.classList.add('show-menu');
}

function hideMenu() {
    removePackageContextMenu();
    if (null == menu) {
        return;
    }
    console.log('menu.classList' + menu.classList);
    menu.classList.remove('show-menu');
    menu.style.display = "none";
}
var currentJstreeRef = null;

function onContextMenu(e) {
    //alert('ok');
    if (menu != null)
        hideMenu();

    removePackageContextMenu();

    menu = null;
    if (e.target.id == "input_schema_editor_jsTree" || e.target.parentNode.id == "input_schema_editor_jsTree"
        || e.target.parentNode.id == "input_watermark" || e.target.className == "input_pschema") {
        currentJstreeRef = inputJstreeRef;
        var ele = document.getElementById('in_paste_item_node');
        menu = document.getElementById('input_schema_editor_jsTree_contextMenu');
        if (currentJstreeRef.can_paste()) {
            ele.style.display = 'block';
        } else {
            ele.style.display = 'none';
        }
        $("#input_schema_editor_jsTree").jstree().deselect_all(true);
    } else if (e.target.id == "output_schema_editor_jsTree" || e.target.parentNode.id == "output_schema_editor_jsTree"
        || e.target.parentNode.id == "output_watermark" || e.target.className == "output_pschema") {
        currentJstreeRef = outputJstreeRef;
        var ele = document.getElementById('out_paste_item_node');
        menu = document.getElementById('output_schema_editor_jsTree_contextMenu');
        if (currentJstreeRef.can_paste()) {
            ele.style.display = 'block';
        } else {
            ele.style.display = 'none';
        }

        $("#output_schema_editor_jsTree").jstree().deselect_all(true);
    } else if (e.target.id == "launching_arrow_jsTree" || e.target.parentNode.id == "launching_arrow_jsTree") {
        currentJstreeRef = launching_arrow_jsTree_ref;
        menu = document.getElementById('input_schema_editor_jsTree_contextMenu');
        $("#launching_arrow_jsTree").jstree().deselect_all(true);
    } else if (e.target.id == "landing_arrow_jsTree" || e.target.parentNode.id == "landing_arrow_jsTree") {
        currentJstreeRef = landing_arrow_jsTree_ref;
        menu = document.getElementById('output_schema_editor_jsTree_contextMenu');
        $("#landing_arrow_jsTree").jstree().deselect_all(true);
    } else if (e.target.id == "flowDesignerJsTree" || e.target.id == 'api_designer_watermark'
        || e.target.parentNode.parentNode.id == 'api_designer_watermark' || e.target.className == "api_pschema")
        menu = document.getElementById('flowDesignerJsTree_contextMenu');

    if (menu != null) {
        // alert('menu-nh'+document.getElementById('menuwrap').innerHeight);
        e.preventDefault();
        //  alert('iner-h'+window.innerHeight+'inner-w'+window.innerWidth);
        $("#flowDesignerJsTree").jstree().deselect_all(true);
        var yAxis = e.pageY;
        var xAxis = e.pageX;
        // alert('yAxis'+yAxis);
        /* if ((yAxis + 70) > window.innerHeight) {

             yAxis = window.innerHeight - 70;
         } else*/
        if ((yAxis + 350) > window.innerHeight) {
            // alert('350');
            yAxis = window.innerHeight - 350;
        }

        if ((yAxis + 300) > window.innerHeight) {
            //  alert('300');
            $(".secondMenuInput").addClass("secondMenuXAdjustment");
            $(".secondMenuInput2").addClass("secondMenuXAdjustment2");
            // $(".thirdMenuInput").addClass("thirdMenuXAdjustment");
        } else {
            $(".secondMenuInput").removeClass("secondMenuXAdjustment");
            // $(".thirdMenuInput").removeClass("thirdMenuXAdjustment");
        }
        if (window.innerWidth < e.pageX + 400) {
            showMenu(e.pageX - 150, yAxis);
            $(".secondMenuInput").addClass("secondMenuYAdjustment");
            $(".secondMenuInput2").addClass("secondMenuYAdjustment2");
        } else {
            $(".secondMenuInput").removeClass("secondMenuYAdjustment");
            $(".secondMenuInput2").removeClass("secondMenuYAdjustment2");
            showMenu(e.pageX, yAxis);
        }

        setTimeout(function () {
            document.addEventListener('click', onClick, false);
        }, 500);
    }
}



function submenu_click(data) {
    document.removeEventListener('click', onClick);

}

function onClick(e) {
    if (e.target.className == "watermark_btn" || e.target.className == "input_pschema" || e.target.className == "output_pschema") {
        return ;
    }
    hideMenu();
    document.removeEventListener('click', onClick);
}

document.addEventListener('contextmenu', onContextMenu, false);
document.getElementById('flowDesignerJsTree').addEventListener("click", removePackageContextMenu);
document.getElementById('plainMapping').addEventListener("click", removePackageContextMenu);
var navBarNode = getElementByXpath("//*[@id='demo']/div/div/div");
navBarNode.addEventListener("click", removePackageContextMenu);

function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function openSelectServiceModalDialog(jsTreeId, sel) {
    var modal = document.getElementById("selectServiceModalDialog");
    var ref = $(jsTreeId).jstree(true);
    var sel = ref.get_selected();

    if (!sel.length) {
        //alert("Select an element first");
        swal({
            title: "Warning !!",
            text: "Select an element first",
            type: "warning",
            confirmButtonColor: "#f2533e" // orange/yellowish confirm button
            });

        return;
    } else if (sel.length > 1) {
        //alert("Select only one element");
        swal({
            title: "Warning !!",
            text: "Select only one element",
            type: "warning",
            confirmButtonColor: "#f2533e"
            });

        return;
    }
    modal.style.display = "block";
    var span = document.getElementById("closeSelectServiceModalDialog");
    span.onclick = function() {
        modal.style.display = "none";
    }
    var updateSelectedService = document.getElementById("updateSelectedServiceId");
    updateSelectedService.onclick = function() {
        var node = ref.get_node(sel);
        // var nodeText=localStorage.getItem("currentSelectedService");
        let splitter = localStorage.getItem("currentSelectedService").split("/");
        var nodeText = splitter[splitter.length - 1];
        if (node.text != nodeText) {
            mapperObj.clean();
            node.data.lines = null;
            node.data.transformers = null;
            node.data.fqn = localStorage.getItem("currentSelectedService");
            launching_arrow_jsTree_function_ref.settings.core.data = [];
            launching_arrow_jsTree_function_ref.refresh();
            landing_arrow_jsTree_function_ref.settings.core.data = [];
            landing_arrow_jsTree_function_ref.refresh();
            //ref.rename_node(node,nodeText);
            node.data.serviceType = localStorage.getItem("currentSelectedService_type");
            ref.select_node(node.id);
            replaceAndAdd(sel);
            setFlowElemProperty(sel, "comment");
            setFlowElemProperty(sel, "switch");
            setFlowElemProperty(sel, "case");
            setFlowElemProperty(sel, "status");
            setFlowElemProperty(sel, "snap");
            setFlowElemProperty(sel, "snapCondition");
            setFlowElemProperty(sel, "requestMethod");
        }
        // node.text=
        localStorage.setItem("enableServiceSelectionMode", false);
        //alert(localStorage.getItem("currentSelectedService"));
        //ref.refresh();
        modal.style.display = "none";
    }
    localStorage.setItem("enableServiceSelectionMode", true);
}

//CHANGE1: Open ServiceDialog on create
function openSelectServiceModalDialogOnCreateService(ref, sel) {

    //var sel = ref.get_selected();

    var modal = document.getElementById("selectServiceModalDialog");
    if (!sel.length) {
        //alert("Select an element first");
        swal({
            title: "Warning !!",
            text: "Select an element first",
            type: "warning",
            confirmButtonColor: "#f2533e" // Orange color
            });

        return;
    } else if (sel.length > 1) {
        //alert("Select only one element");
       swal({
            title: "Warning !!",
            text: "Select only one element",
            type: "warning",
            confirmButtonColor: "#f2533e" // Orange color
            });

        return;
    }
    modal.style.display = "block";
    var span = document.getElementById("closeSelectServiceModalDialog");
    span.onclick = function() {
        modal.style.display = "none";
    }
    var updateSelectedService = document.getElementById("updateSelectedServiceId");
    updateSelectedService.onclick = function() {
        var node = ref.get_node(sel);
        // var nodeText=localStorage.getItem("currentSelectedService");
        let splitter = localStorage.getItem("currentSelectedService").split("/");
        var nodeText = splitter[splitter.length - 1];
        if (node.text != nodeText) {
            mapperObj.clean();
            node.data.lines = null;
            node.data.transformers = null;
            node.data.fqn = localStorage.getItem("currentSelectedService");
            launching_arrow_jsTree_function_ref.settings.core.data = [];
            launching_arrow_jsTree_function_ref.refresh();
            landing_arrow_jsTree_function_ref.settings.core.data = [];
            landing_arrow_jsTree_function_ref.refresh();
            //ref.rename_node(node,nodeText);
            node.data.serviceType = localStorage.getItem("currentSelectedService_type");
            ref.select_node(node.id);
            replaceAndAdd(sel);
            setFlowElemProperty(sel, "comment");
            setFlowElemProperty(sel, "switch");
            setFlowElemProperty(sel, "case");
            setFlowElemProperty(sel, "status");
            setFlowElemProperty(sel, "snap");
            setFlowElemProperty(sel, "snapCondition");
            setFlowElemProperty(sel, "requestMethod");
        }
        // node.text=
        localStorage.setItem("enableServiceSelectionMode", false);
        //alert(localStorage.getItem("currentSelectedService"));
        //ref.refresh();
        modal.style.display = "none";
    }
    localStorage.setItem("enableServiceSelectionMode", true);
}

var initialvalue = null;
var initialVariableType = null;

function openSetValueModelDialog() {
    var modal = document.getElementById("configureSetValueModelDialog");
    var span = document.getElementById("closeSetValueModelDialog");
    modal.style.display = "block";

    $('#popMaxMin').addClass('popup_minimize').removeClass('popup_maximum');
    $('#elementSetValueInput').show();
    $('#elementSetValueInputTextarea').hide();
    $('.ico_expand').show();
    $('.ico_collapse').hide();

    let createItem = mapperObj.getValue(landing_arrow_jsTree_ref);
    if (createItem) {
        //alert(createItem.value);
        $("#element_NoneVariable").prop("checked", true);
        $("#elementSetValueInput").val(createItem.value);
        $('#elementSetValueInputTextarea').text(createItem.value);
        if (createItem.evaluate == "EEV")
            $("#element_ExpressionVariable").prop("checked", true);
        if (createItem.evaluate == "EEV2")
            $("#element_ExpressionSubstitution").prop("checked", true);
        if (createItem.evaluate == "ELV")
            $("#element_LocalVariable").prop("checked", true);
        if (createItem.evaluate == "EGV")
            $("#element_GlobalVariable").prop("checked", true);
        if (createItem.evaluate == "EPV")
            $("#element_PackageVariable").prop("checked", true);
        initialvalue = createItem.value;
        initialVariableType = createItem.evaluate;

    }

    var sel_node = landing_arrow_jsTree_ref.get_selected();
    var nodePath = landing_arrow_jsTree_ref.get_path(sel_node, '/');
    $("#set-item").html("Set '" + nodePath + "'");
    var foundFlag = false;

    $(mapperObj.dropList).each(function(e, data) {
        if (data.path == nodePath) {
            foundFlag = true;
        }
    });

    $(mapperObj.lines).each(function(e, data) {
        if (data.inputPath == nodePath || data.outputPath == nodePath) {
            foundFlag = true;
        }
    });

    if (foundFlag) {
        document.getElementById("elementSetValueInput").disabled = true;
        document.getElementById("element_NoneVariable").disabled = true;
        document.getElementById("element_ExpressionVariable").disabled = true;
        document.getElementById("element_ExpressionSubstitution").disabled = true;
        document.getElementById("element_LocalVariable").disabled = true;
        document.getElementById("element_PackageVariable").disabled = true;
        document.getElementById("element_GlobalVariable").disabled = true;
        document.getElementById("elementSetValueInputTextarea").disabled = true;
    } else {
        document.getElementById("elementSetValueInput").disabled = false;
        document.getElementById("element_NoneVariable").disabled = false;
        document.getElementById("element_ExpressionVariable").disabled = false;
        document.getElementById("element_ExpressionSubstitution").disabled = false;
        document.getElementById("element_LocalVariable").disabled = false;
        document.getElementById("element_PackageVariable").disabled = false;
        document.getElementById("element_GlobalVariable").disabled = false;
        document.getElementById("elementSetValueInputTextarea").disabled = false;
    }

    span.onclick = function() {
        if ($("#elementSetValueInput").css("display") == "none") {
            var value = $('#elementSetValueInputTextarea').val();
        } else {
            var value = $("#elementSetValueInput").val();
        }
        var evaluate = null;
        var eev = $("#element_ExpressionVariable").prop("checked");
        if (eev == true)
            evaluate = "EEV";
        var eev = $("#element_ExpressionSubstitution").prop("checked");
        if (eev == true)
            evaluate = "EEV2";
        var elv = $("#element_LocalVariable").prop("checked");
        if (elv == true)
            evaluate = "ELV";
        var epv = $("#element_PackageVariable").prop("checked");
        if (epv == true)
            evaluate = "EPV";
        var egv = $("#element_GlobalVariable").prop("checked");
        if (egv == true)
            evaluate = "EGV";
        modal.style.display = "none";
        if (!foundFlag) {
            mapperObj.setValue(landing_arrow_jsTree_ref, value, evaluate);
            unloadElementSetValueInput();
        }
    };
}

function unloadElementSetValueInput() {
    $("#element_NoneVariable").prop("checked", true);
    $("#elementSetValueInput").val("");
}

//Close with confirmation if values are changed
function okCloseWithConfirmation() {

    if ($("#elementSetValueInput").css("display") == "none") {
        var value = $('#elementSetValueInputTextarea').val();
    } else {
        var value = $("#elementSetValueInput").val();
    }
    var evaluate = null;
    var eev = $("#element_ExpressionVariable").prop("checked");
    if (eev == true)
        evaluate = "EEV";
    var eev = $("#element_ExpressionSubstitution").prop("checked");
    if (eev == true)
        evaluate = "EEV2";
    var elv = $("#element_LocalVariable").prop("checked");
    if (elv == true)
        evaluate = "ELV";
    var epv = $("#element_PackageVariable").prop("checked");
    if (epv == true)
        evaluate = "EPV";
    var egv = $("#element_GlobalVariable").prop("checked");
    if (egv == true)
        evaluate = "EGV";
    //modal.style.display = "none";
    if (value != initialvalue || evaluate != initialVariableType) {
        swal({
                title: "Some values have been changed! Do you want to save the updated values.",
                text: "Updated values will be saved",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#f2533e",
                cancelButtonText: "No, Cancel it !!",
                confirmButtonText: "Yes, Save it !!",
                showLoaderOnConfirm: true,
                closeOnConfirm: true,
                closeOnCancel: true
            },
            function(isConfirm) {
                if (isConfirm) {
                    mapperObj.setValue(landing_arrow_jsTree_ref, value, evaluate);

                } else {
                    unloadElementSetValueInput();
                }
            });
    }

    $("#element_NoneVariable").prop("checked", true);
    $("#elementSetValueInput").val("");
}

function changeHttpMethodToPost(){
    var urlLoadFile = loadFile.trim() + "$";
    var packageName = ("/" + urlLoadFile).replace("/files/", "alias?fqn=").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main");
    packageName = packageName.split("/").join(".");
    var urlPath = "/" + packageName;

    asyncRestRequest(urlPath, null, "GET", function (result) {
        if (result.status == 404) {
            asyncRestRequest(urlPath + "&alias=POST/" +
                ("/" + urlLoadFile).replace("/files/", "").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main").split("/").join(".")
                , null, "POST", function (result) {

                    refreshAlias();
                });
        } else if (result.alias.split('/')[0] == "GET") {
            asyncRestRequest(urlPath + "&alias=POST/" + result.alias.split('/')[1], null, "POST", function (result) {
                refreshAlias();
            });
        }
    }, function(error){});
}

function showInputJSONSchemaTextDialog(jsTreeRef) {
    $("#jsonSchemaTitle").html("Enter your JSON Schema here:-");
    var modal = document.getElementById("configureInputJSONSchemaTextDialog");
    var span = document.getElementById("closeInputJSONSchemaTextDialog");
    modal.style.display = "block";
    $("#inputJSONSchemaText").val("");
    span.onclick = function() {
        var jsonSchema = $("#inputJSONSchemaText").val();
        //console.log(jsonSchema);
        var jsTreeData = getJstreeFromSchema(jsonSchema);
        console.log(jsTreeData);
        jsTreeRef.settings.core.data = jsTreeData;
        jsTreeRef.refresh();
        modal.style.display = "none";
    };
    hideMenu();
    document.addEventListener('click', onClick, true);
    changeHttpMethodToPost();
}

function showInputJSONSchemaTextDialogSimpleJson(jsTreeRef) {
    $("#jsonSchemaTitle").html("Enter your JSON Payload here:-");
    var modal = document.getElementById("configureInputJSONSchemaTextDialog");
    var span = document.getElementById("closeInputJSONSchemaTextDialog");
    modal.style.display = "block";
    $("#inputJSONSchemaText").val("");
    span.onclick = function() {
        var jsonSchema = $("#inputJSONSchemaText").val();
        asyncRestRequest("/packages.middleware.pub.json.toJsonSchema.main", jsonSchema, "POST",
            function (res){
                if (Object.keys(res.properties).length != 0) {
                    var jsTreeData = getJstreeFromSchema(JSON.stringify(res));
                    $("#inputJSONSchemaText").val("");
                    jsTreeRef.settings.core.data = jsTreeData;
                    jsTreeRef.refresh();
                    modal.style.display = "none";
                } else {
                    swal({
                        title: "Enter a valid JSON.",
                        text: "",
                        type: "error",
                        confirmButtonColor: "#f2533e" // Bright red
                    });

                }
            },
            function (e){
                console.error("Error occurred in showInputJSONSchemaTextDialogSimpleJson()");
            });

    };
    hideMenu();
    document.addEventListener('click', onClick, true);
    changeHttpMethodToPost();
}

function showMapLinePropertiesModelDialog() {
    var modal = document.getElementById("configureMapLinePropertiesModelDialog");
    var span = document.getElementById("closeMapLinePropertiesModelDialog");
    modal.style.display = "block";
    //srcPath
    console.log(mapperObj.selectedLines);
    var lines = mapperObj.selectedLines;
    if (lines == null || lines.length != 1) {
        //alert("Please ensure that only one mapping line is red.")
        swal({
            title: "Warning !!",
            text: "Please ensure that one mapping line is selected.",
            type: "warning",
            confirmButtonColor: "#f2533e" // Orange
        });

        modal.style.display = "none";
        return;
    }
    var line = lines[0];

    var indexes = line.INPath.match(/#\d+/g);
    console.log(indexes);
    var html = "";
    var index = null;
    if (indexes != null) {
        for (var i = 0; i < indexes.length; i++) {
            index = indexes[i];
            //alert(index);
            var pPath = null;
            var slash = "/";
            if (line.INPath.endsWith("/" + index)) {
                pPath = line.INPath.split("/" + index)[0];
                slash = "";
            } else
                pPath = line.INPath.split("/" + index + "/")[0];
            html += pPath + "/#<input type='text' id='index_in_" + i + "' value='" + index.replace('#', '') + "' style='width:30px;border:0px; padding:0px; margin:0px;text-aligh:center;'>" + slash;
        }
        //if(index!=null){
        var pPath = null;
        if (line.INPath.endsWith("/" + index))
            pPath = line.INPath.split("/" + index)[1];
        else
            pPath = line.INPath.split("/" + index + "/")[1];
        html += pPath;
        $("#srcPath").html(html);
        //}
    } else
        $("#srcPath").html(line.INPath);

    indexes = line.OUTPath.match(/#\d+/g);
    html = "";
    index = null;
    if (indexes != null) {
        for (var i = 0; i < indexes.length; i++) {
            index = indexes[i];
            var pPath = null;
            var slash = "/";
            if (line.OUTPath.endsWith("/" + index)) {
                pPath = line.OUTPath.split("/" + index)[0];
                slash = "";
            } else
                pPath = line.OUTPath.split("/" + index + "/")[0];
            html += pPath + "/#<input type='text' id='index_out_" + i + "' value='" + index.replace('#', '') + "' style='width:30px;border:0px; padding:0px; margin:0px;text-aligh:center;'>" + slash;
        }
        //  if(index!=null){
        var pPath = null;
        if (line.OUTPath.endsWith("/" + index))
            pPath = line.OUTPath.split("/" + index)[1];
        else
            pPath = line.OUTPath.split("/" + index + "/")[1];
        html += pPath;
        $("#targetPath").html(html);
        // }
    } else
        $("#targetPath").html(line.OUTPath);

    $("#mappingCondition").val(line.condition);

    $("#jsFunction").val(line.applyFunction);

    try {
        if (line.jsFunction && line.jsFunction.trim().length > 0)
            $("#functionJSDef").val(atob(line.jsFunction));
    } catch (err) {
        console.log(err);
    }

    $("#jsFunctionSig").val(line.jsFunctionSig);

    span.onclick = function() {
        modal.style.display = "none";
        indexes = line.INPath.match(/#\d+/g);
        var newPath = "";
        var ending = "";
        if (indexes != null) {
            for (var i = 0; i < indexes.length; i++) {
                index = indexes[i];
                var pPath = null;
                var slash = "/";
                if (line.INPath.endsWith("/" + index)) {
                    pPath = line.INPath.split("/" + index);
                    slash = "";
                } else
                    pPath = line.INPath.split("/" + index + "/");
                newPath += pPath[0] + "/#" + $("#index_in_" + i).val() + slash;
                ending = pPath[1];
            }
            if (ending != null)
                newPath += ending;
            line.INPath = newPath
        }

        indexes = line.OUTPath.match(/#\d+/g);
        newPath = "";
        ending = "";
        if (indexes != null) {
            for (var i = 0; i < indexes.length; i++) {
                index = indexes[i];
                var pPath = null;
                var slash = "/";
                if (line.OUTPath.endsWith("/" + index)) {
                    pPath = line.OUTPath.split("/" + index);
                    slash = "";
                } else
                    pPath = line.OUTPath.split("/" + index + "/");
                newPath += pPath[0] + "/#" + $("#index_out_" + i).val() + slash;
                ending = pPath[1];
            }
            if (ending != null)
                newPath += ending;
            line.OUTPath = newPath
        }
        line.applyFunction = $("#jsFunction").val();
        line.condition = $("#mappingCondition").val();
        var jsFunc = $("#functionJSDef").val();
        try {
            if (jsFunc && jsFunc.trim().length > 0)
                line.jsFunction = btoa(jsFunc);
        } catch (err) {
            console.log(err);
        }
        line.jsFunctionSig = $("#jsFunctionSig").val();
        mapperObj.refresh();
    };
}


function openFlowElementProperties(jsTreeId, sel) {
    // Get the modal
    $("#elementSwitch").hide();
    $("#elementCase").hide();
    $("#elementIfCondition").hide();
    $("#elementAwaitTimeout").hide();
    $("#elementAwaitIndexVar").hide();
    $("#invokeRequestMethod").hide();
    $("#elementRepeatOn").hide();
    $("#elementRepeatTimes").hide();
    $("#elementRepeatInterval").hide();
    $("#elementCondition").hide();
    $("#elementSequence").hide();
    $("#elementSwitch").hide();
    $("#invokeRequestMethodAsyncProp").hide();
    $("#elementLoopInputArray").hide();
    $("#elementIndexVariable").hide();
    $("#elementLoopOutputArray").hide();

    var modal = document.getElementById("flowElementPropertyModalDialog");
    var ref = $(jsTreeId).jstree(true);
    var sel = ref.get_selected();
    if (!sel.length) {
        //alert("Select an element first");
        swal({
            title: "Warning !!",
            text: "Select an element first",
            type: "warning",
            confirmButtonColor: "#f2533e" // Optional: Orange button
        });

        return;
    } else if (sel.length > 1) {
        //alert("Select only one element");
        swal({
            title: "Warning !!",
            text: "Select only one element",
            type: "warning",
            confirmButtonColor: "#f2533e" // Orange button
        });

        return;
    }

    sel = ref.get_selected()[0];
    var node = ref.get_node(sel);
    var nodeType = node.type;
    var nodeParent = ref.get_node(node.parent);
    var nodeParentType = nodeParent.type;

    if (node.data) {

        var evaluate = node.data["evaluate"];
        if (evaluate) {
            //alert(evaluate);
            $("#elementSequenceInput").prop("checked", evaluate);
        } else
            $("#elementSequenceInput").prop("checked", false);

        var caseVal = node.data["case"];
        if (caseVal)
            $("#elementCaseInput").val(caseVal);
        else
            $("#elementCaseInput").val(null);

        var icVal = node.data["ifcondition"];
        if (icVal)
            $("#elementIfConditionInput").val(icVal);
        else
            $("#elementIfConditionInput").val(null);

        var icVal = node.data["timeout_seconds_each_thread"];
        if (icVal)
            $("#elementAwaitTimeoutInput").val(icVal);
        else
            $("#elementAwaitTimeoutInput").val(60);

        var icVal = node.data["indexVar"];
        if (icVal)
            $("#elementAwaitIndexVarInput").val(icVal);
        else
            $("#elementAwaitIndexVarInput").val("*index");

        var icVal = node.data["condition"];
        if (icVal) {
            $("#elementConditionInput").val(icVal);
            $("#elementRepeatTimesInput").attr("readonly", "readonly");
        } else {
            $("#elementConditionInput").val("");
            $("#elementRepeatTimesInput").removeAttr("readonly");
        }

        var interval = node.data["interval"];
        if (interval)
            $("#elementRepeatIntervalInput").val(interval);
        else
            $("#elementRepeatIntervalInput").val(0);

        var indexVar = node.data["indexVar"];
        if (indexVar)
            $("#RepeatIndexVariableInput").val(indexVar);
        else
            $("#RepeatIndexVariableInput").val("*indexVar");

        var repeat = node.data["redo"];
        //var repeat=node.data["redo"];
        if (repeat)
            $("#elementRepeatTimesInput").val(repeat);
        else
            $("#elementRepeatTimesInput").val(1);

        var repeatOn = node.data["repeatOn"];
        if (repeatOn)
            $("#elementRepeatOnInput").val(repeatOn);
        else
            $("#elementRepeatOnInput").val("success");

        var inArray = node.data["inArray"];
        if (inArray)
            $("#elementLoopInputArrayInput").val(inArray);
        else
            $("#elementLoopInputArrayInput").val(null);

        var indexVar = node.data["indexVar"];
        if (indexVar)
            $("#elementIndexVariableInput").val(indexVar);
        else
            $("#elementIndexVariableInput").val("*index");

        var outArray = node.data["outArray"];
        if (outArray)
            $("#elementLoopOutputArrayInput").val(outArray);
        else
            $("#elementLoopOutputArrayInput").val(null);

        var switchCase = node.data["switch"];
        if (switchCase)
            $("#elementSwitchInput").val(switchCase);
        else
            $("#elementSwitchInput").val(null);

        var status = node.data["status"];
        if (status)
            $("#elementStatusInput").val(status);
        else
            $("#elementStatusInput").val("enabled");

        var requestMethod = node.data["requestMethod"];
        if (requestMethod) {
            $("#invokeRequestMethodInput").val("async");
            $("#invokeRequestMethodAsyncProp").show();
            $("#invokeRequestMethodAsyncPropAsync").prop("checked", false);
            $("#invokeRequestMethodAsyncPropAsyncQueue").prop("checked", false);
            if (requestMethod == "async") {
                $("#invokeRequestMethodAsyncPropAsync").prop("checked", true);
            } else if (requestMethod == "asyncQueue") {
                $("#invokeRequestMethodAsyncPropAsyncQueue").prop("checked", true);
            }
        }
        else
            $("#invokeRequestMethodInput").val("sync");

        var comment = node.data["comment"];
        if (comment)
            $("#elementCommentInput").val(comment);
        else
            $("#elementCommentInput").val(null);

        var snap = node.data["snap"];
        if (snap) {
            $("#elementSnapInput").val(snap);
            if (snap == "conditional")
                $("#elementSnapCondition").css("display", "block");
            else
                $("#elementSnapCondition").css("display", "none");
        } else
            $("#elementSnapInput").val("disabled");

        var snapCondition = node.data["snapCondition"];
        if (snapCondition)
            $("#elementSnapConditionInput").val(snapCondition);
        else
            $("#elementSnapConditionInput").val(null);

        var outArrayType = node.data["outArrayType"];
        if (outArrayType)
            $("#outputArrayTypeInput").val(outArrayType);
        else
            $("#outputArrayTypeInput").val("document");
    }
    if (nodeType == "repeat" || nodeType == "redo")
        $(".elementRepeat").css("display", "block");
    if (nodeType == "loop" || nodeType == "foreach")
        $(".elementLoop").css("display", "block");
    if (nodeType == "switch")
        $(".elementSwitch").css("display", "block");

    if (nodeType == "sequence" || nodeType == "group")
        $(".elementSequence").css("display", "block");

    if ((nodeParentType == "sequence" || nodeParentType == "group" || nodeParentType == "redo") && nodeParent.data["evaluate"] == true) {
        $(".elementCondition").css("display", "block");
    }

    if (nodeType == "redo") {
        $(".elementCondition").css("display", "block");
    }

    if (nodeType == "await") {
        $(".elementAwaitTimeout").css("display", "block");
        $(".elementAwaitIndexVar").css("display", "block");
    }

    if (nodeParentType == "switch" && (nodeType == "sequence" || nodeType == "group")) {
        $(".elementCase").css("display", "block");
    }

    if (nodeParentType == "ifelse" && (nodeType == "sequence" || nodeType == "group")) {
        $(".elementIfCondition").css("display", "block");
    }

    if (nodeType == "invoke")
        $(".elementInvoke").css("display", "block");

    var elemPath = ref.get_path(sel, '/');
    var span = document.getElementById("closeflowElementProperties");
    modal.style.display = "block";
    span.onclick = function() {
        modal.style.display = "none";
        $(".elementRepeat").css("display", "none");
        $(".elementLoop").css("display", "none");
        $(".elementSwitch").css("display", "none");
        $(".elementCondition").css("display", "none");
        $(".elementSequence").css("display", "none");
        $(".elementCase").css("display", "none");
        $(".elementIfCondition").css("display", "none");
        $(".elementAwaitTimeoutInput").css("display", "none");
        $(".elementAwaitIndexVarInput").css("display", "none");
        $(".elementInvoke").css("display", "none");
    }
}

function getAllVisibleInputs(node) {
    var flowData = flowDesignerJsTreeRef.get_json('#', {
        flat: true
    });
    var createInputPaths = [];
    var createOutputPaths = [];
    var dropPaths = {};
    var loopPaths = [];
    var parents = node.parents;
    var inputFlag = true;
    //jQuery.each(flowData, function(i, nodeData)

    for (var i = 0; i < flowData.length; i++) {
        var nodeData = flowData[i];
        if (node.id == nodeData.id)
            break;
        if (node.id != nodeData.id && (nodeData.type == "invoke" || nodeData.type == "object" || nodeData.type == "function" || nodeData.type == "map" || nodeData.type == "transformer")) {
            var dropList = nodeData.data.dropList;
            jQuery.each(dropList, function(i, map) {
                var dropPath = mapperObj.hashCode(map.path);
                //dropPath.typePath=map.typePath;
                dropPaths[dropPath] = {};
                dropPaths[dropPath].path = map.path;
                dropPaths[dropPath].dropped = true;
            });
        }
        if (node.id != nodeData.id && (nodeData.type == "loop" || nodeData.type == "foreach")) {
            var inArray = nodeData.data.inArray;
            var outArray = nodeData.data.outArray;
            if (inArray != null && inArray.trim().length > 0) {
                inArray = "//" + inArray;
                inArray = inArray.replace("///", "").replace("//", "");
                let isParent = false;
                jQuery.each(parents, function(i, parent) {
                    if (parent == nodeData.id)
                        isParent = true;
                });
                if (isParent) {
                    loopPaths.push(inArray);
                    if (outArray != null && outArray.trim().length > 0)
                        loopPaths.push(outArray);
                }
            }
        }
    }
    //console.log(nodeData);
    //console.log(loopPaths);

    for (var i = 0; i < flowData.length; i++) {
        var nodeData = flowData[i];

        if (nodeData.type == "invoke" || nodeData.type == "object" || nodeData.type == "function" || nodeData.type == "map" || nodeData.type == "transformer") {
            var lines = nodeData.data.lines;
            if (lines)
                jQuery.each(lines, function(j, line) {
                    if (line.inpJsTree == "#launching_arrow_jsTree" && line.outpJsTree == "#landing_arrow_jsTree_function" && nodeData.type == "invoke") {
                        return ;
                    }

                    try {
                        if (line.inpJsTree == "#launching_arrow_jsTree_function" && line.outpJsTree == "#landing_arrow_jsTree" && nodeData.type == "invoke"
                            || nodeData.type == "object" || nodeData.type == "function") {
                            retainingJson = [];
                            let fqn = nodeData.data.fqn;
                            if (null == fqn) {
                                fqn = nodeData.text;
                            }

                            if (null == LOADED_SERVICE_IO[fqn + "." + nodeData.data.serviceType + "_OUTPUT"]) {
                                let response = null;

                                let nodeService = fqn;
                                if (nodeData.type == 'function') {
                                    nodeService = node.data.acn + "." + node.data.function + "_" + nodeData.data.identifier;
                                }

                                if (SDK_EMBEDDED) {
                                    asyncRestRequest(SERVICE_ENDPOINT + "/tenant/default/public/getServiceAsResponse?location=/"+nodeService+"."+nodeData.data.serviceType, null, "GET",
                                        function (res){
                                            parseResponseOutput(res)
                                        },
                                        function (e){
                                            console.error("Error occurred while calling getServiceAsResponse api for embedded.")
                                        });
                                } else {
                                    asyncRestRequest("/files/" + nodeService + "." + nodeData.data.serviceType, null,"GET",
                                        function (res){
                                        parseResponseOutput(res)
                                        },
                                        function (e){
                                        console.error("Error occurred while calling getServiceAsResponse api.")
                                        });


                                }
                                //var response = syncRestRequest("/files/" + fqn + "." + nodeData.data.serviceType, "GET", "");
                                function parseResponseOutput(response) {
                                    if (nodeData.data.serviceType == "flow" || nodeData.data.serviceType == "api") {
                                        LOADED_SERVICE_IO[fqn + "." + nodeData.data.serviceType + "_OUTPUT"] = response.latest.output;
                                    } else {
                                        LOADED_SERVICE_IO[fqn + "." + nodeData.data.serviceType + "_OUTPUT"] = response.output;
                                    }
                                }
                            }
                            prepareRetainJson("", "", LOADED_SERVICE_IO[fqn + "." + nodeData.data.serviceType + "_OUTPUT"]);
                            var array = retainingJson;
                            for (var i = 0 ; i < array.length ; i++) {
                                let item = {
                                    path: array[i].path.replace(line.INPath, line.outputPath),
                                    typePath: array[i].typePath.replace(line.inTypePath, line.outTypePath)
                                }
                                if (item.path.startsWith(line.outputPath)) {
                                    createOutputPaths.push(item);
                                    if (node.id != nodeData.id) {
                                        createInputPaths.push(item);
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.log(err);
                    }

                    //console.log(line);
                    var dropPath = mapperObj.hashCode(line.outputPath);
                    if (!dropPaths[dropPath]) {
                        var dropped = mapperObj.findInDropList(dropPaths, line.outputPath);
                        if (dropped == true) {
                            dropPaths[dropPath] = {};
                            dropPaths[dropPath].path = line.outputPath;
                            dropPaths[dropPath].dropped = true;
                        }
                    }
                    if (dropPaths[dropPath] == null || !dropPaths[dropPath].dropped) {
                        var createPath = {};
                        createPath.path = line.outputPath;
                        createPath.typePath = line.outTypePath;

                        jQuery.each(loopPaths, function(k, loop) {
                            if (createPath.path.startsWith(loop)) {
                                //console.log(loop);
                                //console.log(createPath.typePath);
                                var types = createPath.typePath.split("/");
                                var index = loop.split("/").length - 1;
                                if (types[index].endsWith("List")) {
                                    types[index] = types[index].replace("List", "");
                                    createPath.typePath = types.join("/");
                                }
                            }
                        });
                        if (node.id != nodeData.id) {
                            createInputPaths.push(createPath);
                            //mapperObj.createNode("#launching_arrow_jsTree",createPath.path,createPath.typePath);
                        }

                        createOutputPaths.push(createPath);
                        //mapperObj.createNode("#landing_arrow_jsTree",createPath.path,createPath.typePath);
                    }
                });
            var createList = nodeData.data.createList;
            var initiateList = nodeData.data.initiateList;
            if (initiateList) {
                createList = createList.concat(initiateList);
            }
            if (createList)
                jQuery.each(createList, function(j, map) {
                    //console.log(line);
                    var dropPath = mapperObj.hashCode(map.path);
                    if (!dropPaths[dropPath]) {
                        var dropped = mapperObj.findInDropList(dropPaths, map.path);
                        if (dropped == true) {
                            dropPaths[dropPath] = {};
                            dropPaths[dropPath].path = map.path;
                            dropPaths[dropPath].dropped = true;
                        }
                    }
                    if (dropPaths[dropPath] == null || !dropPaths[dropPath].dropped) {
                        var createPath = {};
                        createPath.path = map.path;
                        createPath.typePath = map.typePath;
                        jQuery.each(loopPaths, function(k, loop) {
                            //console.log(loop);
                            //console.log(createPath.typePath);
                            if (createPath.path.startsWith(loop)) {
                                //console.log(loop);
                                //console.log(createPath.typePath);
                                var types = createPath.typePath.split("/");
                                var index = loop.split("/").length - 1;
                                if (types[index].endsWith("List")) {
                                    types[index] = types[index].replace("List", "");
                                    createPath.typePath = types.join("/");
                                }
                            }
                        });
                        if (node.id != nodeData.id) {
                            createInputPaths.push(createPath);
                        }
                        createOutputPaths.push(createPath);
                        //mapperObj.createNode("#landing_arrow_jsTree",createPath.path,createPath.typePath);
                    }
                });
        }
        if (node.id == nodeData.id)
            break;
    }

    var dpInput = inputJstreeRef.get_json('#', {
        flat: false
    });
    var dpTemp = initDPInput(dpInput, dpTemp);
    // console.log(dpInput);
    jQuery.each(createInputPaths, function(j, createPath) {
        //mapperObj.createNode("#launching_arrow_jsTree",createPath.path,createPath.typePath);
        var pathTokens = createPath.path.split("/");
        var typeTokens = createPath.typePath.split("/");
        var dpTempElem = dpTemp;

        //console.log(createPath);
        //console.log(loopPaths[createPath]);
        for (var i = 0; i < pathTokens.length; i++) {
            var text = pathTokens[i];
            var type = typeTokens[i];
            if (dpTempElem[text] && dpTempElem[text].children)
                inputFlag = true;
            else
                inputFlag = false;
            if (inputFlag) {
                if (!dpTempElem[text]) {
                    dpTempElem[text] = {};
                    dpTempElem[text].type = type;
                    dpTempElem[text].text = text;
                    dpTempElem[text].children = {};
                    dpTempElem = dpTempElem[text].children;
                } else {
                    dpTempElem = dpTempElem[text].children;
                }
            } else {
                if (!dpTempElem[text] || dpTempElem[text] != null) {
                    dpTempElem[text] = {};
                    dpTempElem[text].type = type;
                    dpTempElem[text].text = text;
                    dpTempElem[text].children = {};
                    dpTempElem = dpTempElem[text].children;
                } else {
                    dpTempElem = dpTempElem[text].children;
                }
            }
        }
        //console.log(JSON.stringify(dpTempElem));
        // alert(JSON.stringify(createPath));
    });

    jQuery.each(dropPaths, function(j, dropPath) {
        //console.log("Drop: "+JSON.stringify(dropPath));
        var pathTokens = dropPath.path.split("/");
        var dpTempElem = dpTemp;
        var canDrop = false;
        var dropMe = null;
        var text = null;
        for (var i = 0; i < pathTokens.length; i++) {
            text = pathTokens[i];
            if (dpTempElem[text] == null) {
                break;
            } else {
                dropMe = dpTempElem;
                dpTempElem = dpTempElem[text].children;
                canDrop = true;
            }
        }
        if (canDrop)
            delete dropMe[text];
    });


    jQuery.each(loopPaths, function(j, loopPath) {
        //console.log(loopPath);
        var pathTokens = loopPath.split("/");
        var dpTempElem = dpTemp;
        var canDrop = false;
        var dropMe = null;
        var text = null;
        for (var i = 0; i < pathTokens.length; i++) {
            text = pathTokens[i];
            if (dpTempElem[text]) {
                dpTempElem[text].type = dpTempElem[text].type.replace("List", "");
                dpTempElem = dpTempElem[text].children;
            }
        }
    });

    var dpTempInput = JSON.parse(JSON.stringify(dpTemp));
    var jsTreeJsonDPIn = generateJSTreeSchema(dpTempInput);
    launching_arrow_jsTree_ref.settings.core.data = jsTreeJsonDPIn;
    launching_arrow_jsTree_ref.refresh();
    //console.log(jsTreeJsonDPIn);
    jQuery.each(createOutputPaths, function(j, createPath) {
        //mapperObj.createNode("#landing_arrow_jsTree",createPath.path,createPath.typePath);
        var pathTokens = createPath.path.split("/");
        var typeTokens = createPath.typePath.split("/");
        var dpTempElem = dpTemp;
        for (var i = 0; i < pathTokens.length; i++) {
            var text = pathTokens[i];
            var type = typeTokens[i];
            if (dpTempElem[text] && dpTempElem[text].children)
                inputFlag = true;
            else
                inputFlag = false;
            if (inputFlag) {
                if (!dpTempElem[text]) {
                    dpTempElem[text] = {};
                    dpTempElem[text].type = type;
                    dpTempElem[text].text = text;
                    dpTempElem[text].children = {};
                    dpTempElem = dpTempElem[text].children;
                } else {
                    dpTempElem = dpTempElem[text].children;
                }
            } else {
                if (!dpTempElem[text] || dpTempElem[text] != null) {
                    dpTempElem[text] = {};
                    dpTempElem[text].type = type;
                    dpTempElem[text].text = text;
                    dpTempElem[text].children = {};
                    dpTempElem = dpTempElem[text].children;
                } else {
                    dpTempElem = dpTempElem[text].children;
                }
            }
        }
        // alert(JSON.stringify(createPath));
    });

    jQuery.each(dropPaths, function(j, dropPath) {
        //console.log("Drop: "+JSON.stringify(dropPath));
        var pathTokens = dropPath.path.split("/");
        var dpTempElem = dpTemp;
        var canDrop = false;
        var dropMe = null;
        var text = null;
        for (var i = 0; i < pathTokens.length; i++) {
            text = pathTokens[i];
            if (dpTempElem[text] == null) {
                break;
            } else {
                dropMe = dpTempElem;
                dpTempElem = dpTempElem[text].children;
                canDrop = true;
            }
        }
        if (canDrop)
            delete dropMe[text];
    });

    jQuery.each(createOutputPaths, function(j, createPath) {
        jQuery.each(loopPaths, function(k, loop) {
            if (createPath.path.startsWith(loop)) {
                var types = createPath.typePath.split("/");
                var index = loop.split("/").length - 1;
                if (types[index].endsWith("List")) {
                    types[index] = types[index].replace("List", "");
                    createPath.typePath = types.join("/");
                }
            }
        });

        var pathTokens = createPath.path.split("/");
        var typeTokens = createPath.typePath.split("/");
        var dpTempElem = dpTemp;
        for (var i = 0; i < pathTokens.length; i++) {
            var text = pathTokens[i];
            var type = typeTokens[i];
            if (!dpTempElem[text]) {
                dpTempElem[text] = {};
                dpTempElem[text].type = type;
                dpTempElem[text].text = text;
                dpTempElem[text].children = {};
                dpTempElem = dpTempElem[text].children;
            } else {
                dpTempElem = dpTempElem[text].children;
            }
        }
        //mapperObj.createNode("#landing_arrow_jsTree",createPath.path,createPath.typePath);
        //mapperObj.createNode("#launching_arrow_jsTree",createPath.path,createPath.typePath);
        // alert(JSON.stringify(createPath));
    });
    var jsTreeJsonDPOut = generateJSTreeSchema(dpTemp);
    landing_arrow_jsTree_ref.settings.core.data = jsTreeJsonDPOut;
    landing_arrow_jsTree_ref.refresh();
    //console.log(jsTreeJsonDPOut);

    //console.log(dpTemp);
}

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

function initDPInput(dpInput, dpTemp) {
    if (!dpTemp)
        dpTemp = {};
    jQuery.each(dpInput, function(j, elem) {
        //console.log(elem);
        dpTemp[elem.text] = {};
        dpTemp[elem.text].text = elem.text;
        dpTemp[elem.text].type = elem.type;
        if (elem.children != null && elem.children[0] != null) {
            dpTemp[elem.text].children = {};
            initDPInput(elem.children, dpTemp[elem.text].children);
        }
    });
    return dpTemp;
}

function generateJSTreeSchema(dpJson, jsTreeJson) {
    //  console.log("+++++++++++++++++");
    //  console.log(JSON.stringify(dpJson));
    //  console.log(Object.keys(dpJson).length);
    if (!jsTreeJson)
        jsTreeJson = [];
    $.each(dpJson, function(i, v) {
        //console.log(v);
        var elem = {};
        //var newElem=v;
        // console.log(v);
        elem.text = v.text;
        elem.type = v.type;
        elem.children = [];
        jsTreeJson.push(elem);
        if (v.children != null)
            generateJSTreeSchema(v.children, elem.children);

    });
    //  console.log("+++++++++++++++++");
    return jsTreeJson;
}


function openPromotepopup() {
    var modal = document.getElementById("promoteModelDialog");
    var span = document.getElementById("closePromoteModelDialog");
    modal.style.display = "block";
    span.onclick = function() {
        modal.style.display = "none";

    }

}

function openPublishpopup() {
    var modal = document.getElementById("publishModelDialog");
    var span = document.getElementById("closepublishModelDialog");
    modal.style.display = "block";
    span.onclick = function() {
        modal.style.display = "none";

    }

}



function openSnappopup() {
    var modal = document.getElementById("snapModelDialog");
    var span = document.getElementById("closeSnapModelDialog");
    modal.style.display = "block";
    span.onclick = function() {
        modal.style.display = "none";

    }

}

/*
function openTreepopup() {
    var modal = document.getElementById("treeModelDialog");
    var span = document.getElementById("closeTreeModelDialog");
    modal.style.display = "block";
    span.onclick = function() {
        modal.style.display = "none";

    }

}
*/

function openTestpopup() {
    serviceInputToSchema();

}
window.openTestpopup = openTestpopup;

let warningPopupCalled = false;
function openWarningpopup(nodeId) {
    warningPopupCalled = true;
    {
        let hasError = false;
        let node = flowDesignerJsTreeRef.get_node(nodeId);
        if (null == node.data || null == node.data.guid) {
            return ;
        }

        var nodeAnchor=$("#"+nodeId+"_anchor");
        let innerText = nodeAnchor[0].innerText.toUpperCase();
        if (innerText.includes(":")) {
            innerText = nodeAnchor[0].innerText.toUpperCase().slice(0, nodeAnchor[0].innerText.toUpperCase().indexOf(":")).trim();
        }

        let strResponse = JSON.parse(localStorage.getItem("simulate_response"));
        if (null == strResponse) {
            return ;
        }
        let itemFound = [];
        strResponse.map(item => {
            if (item.guid == node.data.guid) {
                itemFound.push(item);
            }
        });

        let currentFile = loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main");

        if (itemFound.length > 0) {
            $("#" + nodeId + "_anchor").addClass("green_bg");
            $("#" + nodeId + "_anchor").addClass("green_bg_clicked");
            itemFound.map(item => {
                let itemKey = "";
                Object.keys(item).forEach(function(ic) {
                    if (ic.includes(currentFile)) {
                        itemKey = ic;
                    }
                });
                let filtered = item[itemKey].filter(item => Object.keys(item).length > 0);

                filtered.map(item => {
                    if (item["*hasError"]) {
                        if (innerText == "TRANSFORMER" || innerText == "MAP" || innerText == "INVOKE" || innerText == "SERVICE") {
                            $("#" + nodeId + "_anchor").removeClass("green_bg");
                            $("#" + nodeId + "_anchor").removeClass("green_bg_clicked");
                            $("#" + nodeId + "_anchor").addClass("red_bg");
                            $("#" + nodeId + "_anchor").addClass("red_bg_clicked");
                        }
                        $("#debugError").html(item["*error"]);
                    }
                });

            });
        }
    }
    var modal = document.getElementById("warningModelDialog");
    var span = document.getElementById("closeWarningModelDialog");
    modal.style.display = "block";
    span.onclick = function() {
        modal.style.display = "none";

    }
    setTimeout(function () {
        warningPopupCalled = false;
    }, 2000)
}


function openAddlinkpopup() {
    var modal = document.getElementById("addLinkModelDialog");
    var span = document.getElementById("closeaddLinkModelDialog");
    modal.style.display = "block";
    span.onclick = function() {
        modal.style.display = "none";

    }

    $("#closeproServiceModelDialog").trigger('click');

}


function promoteModal() {
    if (ENV_SIZE == 0) {
        return;
    }
    var modal = document.getElementById("proServiceModelDialog");
    var span = document.getElementById("closeproServiceModelDialog");
    modal.style.display = "block";
    span.onclick = function() {
        modal.style.display = "none";
        $(".promoting-servers:checked").prop('checked', false);
    }

    $("#closePromoteModelDialog").trigger('click');


}


function downloadBuild() {
    collecta('Export', '', 'Download', 'Downloading API');
    var content = JSON.stringify([{
        asset: loadFile.replaceAll("files/", "").replaceAll(".api", ""),
        type: "api"
    }]);

    let array = loadFile.replaceAll("files/", "").replaceAll(".api", "").split("/");

    var qp = "buildName=" + array[array.length - 1] + "_" + new Date().getTime() + "&includeDependencies=" + false + "&includeGlobalProperties=" + false +
        "&includeLocalProperties=" + false + "&includeEndpoints=" + false;
    asyncRestRequest(
        "/build?" + qp,
        content,
        "POST",
        function(response) {
                var element = document.createElement('a');
                element.setAttribute('href', window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + response.url
                + "?access_token=" + encodeURIComponent(localStorage.getItem("AuthToken")));
                element.setAttribute('target', "_blank");
                document.body.appendChild(element);
                element.click();
        },
        function(errormessage) {
            swal({
                title: 'Error',
                text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                type: 'error',
                confirmButtonColor: '#f2533e'
            });

        }
    );


}
function downloadBuild2(content) {
    collecta('Export', '', 'Download', 'Downloading API');

    var qp = "buildName=" + "customDownload_" + new Date().getTime() + "&includeDependencies=" + false + "&includeGlobalProperties=" + false +
        "&includeLocalProperties=" + false + "&includeEndpoints=" + false;
    asyncRestRequest(
        "/build?" + qp,
        content,
        "POST",
        function(response) {
            var element = document.createElement('a');
            element.setAttribute('href', window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + response.url
            + "?access_token=" + encodeURIComponent(localStorage.getItem("AuthToken")));
            element.setAttribute('target', "_blank");
            document.body.appendChild(element);
            element.click();
        },
        function(errormessage) {
            swal({
                title: 'Error',
                text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                type: 'error',
                confirmButtonColor: '#f2533e'
            });

        }
    );


}

function openTreepopup() {
    const popup = document.getElementById('treeModelDialog');
    const overlay = document.getElementById('overlay');
    const treeContainer = document.getElementById('treeContainer');

    treeContainer.innerHTML = '<p>Loading...</p>';

    popup.style.display = 'block';
    overlay.style.display = 'block';

    let endpoint = loadFile.replaceAll("files/", "").replaceAll(".api", "");

    asyncRestRequest(
        "/packages.middleware.pub.service.findExportReferences.main?serviceFqn=" + endpoint,
        null,
        "POST",
        function(response) {
            // let data = JSON.parse(response.list);
            let data = response.list;
            treeContainer.innerHTML = '';
            const tree = generateParentTree(data);
            treeContainer.appendChild(tree);
            attachCheckboxListeners();

            $(".package-members").click(function () {
                let result = $(this).is(":checked");

                if (result) {
                    $(this).next().removeClass("custom-unchecked");
                    $(this).next().addClass("custom-checked");
                } else {
                    $(this).next().removeClass("custom-checked");
                    $(this).next().addClass("custom-unchecked");
                }

                $(this)
                    .closest("li")
                    .find("ul.tree-step2 > li > input.single-member")
                    .each(function () {
                        if (!$(this).prop("disabled")) {
                            $(this).prop("checked", result);
                            let label = $(`label[for="${$(this).attr("id")}"]`);
                            if (result) {
                                label.removeClass("custom-unchecked").addClass("custom-checked");
                            } else {
                                label.removeClass("custom-checked").addClass("custom-unchecked");
                            }
                        }
                    });
            });

            $(".single-member").click(function () {
                let totalChecked = 0;
                $(".single-member").each(function () {
                    if ($(this).is(":checked")) {
                        totalChecked++;
                    }
                });
                if (totalChecked == $(".single-member").length) {
                    $(".package-members").next().removeClass("custom-unchecked");
                    $(".package-members").next().addClass("custom-checked");
                    $(".package-members").prop("checked", true);
                }

            });
        },
        function(errormessage) {
           swal({
                title: 'Error',
                text: 'An unexpected error occurred',
                type: 'error',
                confirmButtonColor: '#f2533e' // Optional: Red color
            });

        }
    );

    document.getElementById('closeTreeModelDialog').onclick = () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    };

    document.getElementById('skipButton').onclick = () => {
        popup.style.display = 'none';
        overlay.style.display = 'none';
        downloadBuild();
    };

    document.getElementById('downloadButton').onclick = () => {
        const selectedAPIs = getSelectedAPIs();
        if (selectedAPIs.length === 0) {
            alert('Please select at least one API or click Skip.');
            return;
        }
        downloadBuild2(JSON.stringify(selectedAPIs));
        popup.style.display = 'none';
        overlay.style.display = 'none';
    };
}

function generateParentTree(apis) {
    const div = document.createElement('div');
    div.className = 'vertical-tree';

    const ul = document.createElement('ul');
    ul.className = 'tree-step1';

    const parentLi = document.createElement('li');
    const parentCheckbox = document.createElement('input');
    parentCheckbox.type = 'checkbox';
    parentCheckbox.name = 'packages';
    parentCheckbox.id = 'packages';
    parentCheckbox.className = 'exporting-members package-members';

    const parentLabel = document.createElement('label');
    parentLabel.setAttribute('for', 'packages');
    parentLabel.className = 'custom-unchecked';
    parentLabel.textContent = 'packages';

    parentLi.appendChild(parentCheckbox);
    parentLi.appendChild(parentLabel);

    const childTree = generateTree(apis, 2);
    childTree.style.display = 'block';
    parentLi.appendChild(childTree);

    ul.appendChild(parentLi);
    div.appendChild(ul);

    return div;
}


function generateTree(apis, level = 1) {
    const ul = document.createElement('ul');
    ul.className = `tree-step${level}`;

    apis.forEach(api => {
        const li = document.createElement('li');

        if (api.children && api.children.length > 0) {
            const icon = document.createElement('span');
            icon.className = 'plus-minus-icon';

            icon.addEventListener('click', () => {
                const childUl = li.querySelector('ul');
                if (childUl) {
                    const isExpanded = childUl.style.display === 'block';
                    childUl.style.display = isExpanded ? 'none' : 'block';
                    icon.classList.toggle('expend-hide', !isExpanded);
                }
            });
            li.appendChild(icon);
        }



        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `api-${api.id}`;
        checkbox.name = `api-${api.id}`;
        checkbox.value = api.name;
        checkbox.className = "exporting-members single-member";
        checkbox.dataset.type = api.type;
        checkbox.checked = loadFile.replace("files/", "").replace(".api", "") == api.name;

        const label = document.createElement('label');
        label.setAttribute('for', `api-${api.id}`);

        if (checkbox.checked) {
            label.className = 'custom-checked single-member-label disabled label-export-services-list';
            checkbox.disabled = 'disabled';
        } else {
            label.className = 'custom-unchecked single-member-label label-export-services-list';
        }
        label.textContent = api.name;
        li.title = api.name;

        li.appendChild(checkbox);
        li.appendChild(label);

        if (api.children && api.children.length > 0) {
            const childTree = generateTree(api.children, level + 1);
            childTree.style.display = 'none';
            li.appendChild(childTree);
        }

        ul.appendChild(li);
    });

    return ul;
}

function getSelectedAPIs() {
    const checkboxes = document.querySelectorAll('#treeContainer input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => ({
        asset: checkbox.value,
        type: checkbox.dataset.type,
        id: checkbox.id.replace('api-', ''),
    }));
}

function attachCheckboxListeners() {
    const checkboxes = document.querySelectorAll('#treeContainer input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            let ref = $("label[for=" + event.target.id + "]");
            if (event.target.checked) {
                ref.removeClass("custom-unchecked");
                ref.addClass("custom-checked");
            } else {
                ref.removeClass("custom-checked");
                ref.addClass("custom-unchecked");
            }
        });
    });

    const firstApi = document.querySelector('#treeContainer input[type="checkbox"]:disabled');
    if (firstApi) {
        firstApi.addEventListener('change', (event) => {
            event.target.checked = true;
        });
    }
}




function promoteBuild() {

    if ($(".promoting-servers:checked").length == 0) {
        swal({
            title: "Warning",
            text: "Please select at-least one environment",
            type: "warning",
            confirmButtonColor: "#f2533e" // orange
         });

        return;
    }

    let total = $(".promoting-servers:checked").length;
    let imported = 0;
    $(".promoting-servers:checked").each(function() {
        collecta('Export', '', 'Promoting', 'Promoting to another Env');
        let blockValue = $(this).val();
        $("#env-up-" + blockValue).html("<i><span class='fa fa-spinner fa-spin '></span></i>");
        var content = JSON.stringify([{
            asset: loadFile.replaceAll("files/", "").replaceAll(".api", ""),
            type: "api"
        }]);
        var qp = "buildName=" + new Date().getTime() + "&includeDependencies=" + false + "&includeGlobalProperties=" + false +
            "&includeLocalProperties=" + false + "&includeEndpoints=" + false;

        asyncRestRequest("/packages.middleware.pub.server.build.api.promoteBuild.main?" + qp + "&environment_id=" + blockValue, content, "POST", function(response) {
            if(parseInt(response.status) >= 200 && parseInt(response.status) < 299 ) {
                imported++;
                $("#env-up-" + blockValue).html("<i><span class='fa fa-check'></span></i>");
            } else {
                $("#env-up-" + blockValue).html("<i><span class='fa fa-times'></span></i>");
            }
        });
    });
}


async function promoteBuild2() {
    if ($(".promoting-servers:checked").length == 0) {
       swal({
            title: "Warning",
            text: "Please select at-least one environment",
            type: "warning",
            confirmButtonColor: "#f2533e" // Optional: orange button
        });

        return;
    }

    let total = $(".promoting-servers:checked").length;
    let imported = 0;
    try {
        //$("#proServiceModelDialog").toggle("modal"); //Hide Modal
        const selectedAPIs = await openPromoteTreepopup();
        if (selectedAPIs.length === 0) {
            return;
        }
        //$("#proServiceModelDialog").toggle("modal"); //Show Modal
        toggleSelectServicesButton(false);
        $(".promoting-servers:checked").each(function () {
            collecta('Export', '', 'Promoting', 'Promoting to another Env');
            let blockValue = $(this).val();
            $("#env-up-" + blockValue).html("<i><span class='fa fa-spinner fa-spin '></span></i>");

            for (let i = 0 ; i < selectedAPIs.length ; i++) {
                if (null == selectedAPIs[i].type) {
                    selectedAPIs.splice(i, 1);
                }
            }

            var content = JSON.stringify(selectedAPIs);
            var qp = "buildName=" + new Date().getTime() + "&includeDependencies=" + false + "&includeGlobalProperties=" + false +
                "&includeLocalProperties=" + false + "&includeEndpoints=" + false;

            asyncRestRequest("/packages.middleware.pub.server.build.api.promoteBuild.main?" + qp + "&environment_id=" + blockValue, content, "POST", function(response) {
                if(parseInt(response.status) >= 200 && parseInt(response.status) < 299 ) {
                    imported++;
                    $("#env-up-" + blockValue).html("<i><span class='fa fa-check'></span></i>");
                } else {
                    $("#env-up-" + blockValue).html("<i><span class='fa fa-times'></span></i>");
                }
                toggleSelectServicesButton(true);
            });
        });
    } catch (error) {
        toggleSelectServicesButton(true);
       swal({
            title: "Error occurred",
            text: "Please try again!",
            type: "error",
            confirmButtonColor: "#f2533e" // Red
         });

    }

}

function toggleSelectServicesButton(enable) {
    const button = document.getElementById('selectServicesButton');
    button.disabled = !enable;
}


function openPromoteTreepopup() {
    return new Promise((resolve, reject) => {
        const popup = document.getElementById('treePromoteModelDialog');
        const overlay = document.getElementById('promoteOverlay');
        const treeContainer = document.getElementById('promoteTreeContainer');

        treeContainer.innerHTML = '<p>Loading...</p>';

        popup.style.display = 'block';
        overlay.style.display = 'block';

        let endpoint = loadFile.replaceAll("files/", "").replaceAll(".api", "");

        asyncRestRequest(
            "/packages.middleware.pub.service.findExportReferences.main?serviceFqn=" + endpoint,
            null,
            "POST",
            function (response) {
                let data = response.list;
                treeContainer.innerHTML = '';
                const tree = generateParentTree(data);
                treeContainer.appendChild(tree);
                attachPromoteDialogCheckboxListeners();

                $(".package-members").click(function () {
                    let result = $(this).is(":checked");

                    if (result) {
                        $(this).next().removeClass("custom-unchecked");
                        $(this).next().addClass("custom-checked");
                    } else {
                        $(this).next().removeClass("custom-checked");
                        $(this).next().addClass("custom-unchecked");
                    }

                    $(this)
                        .closest("li")
                        .find("ul.tree-step2 > li > input.single-member")
                        .each(function () {
                            if (!$(this).prop("disabled")) {
                                $(this).prop("checked", result);
                                let label = $(`label[for="${$(this).attr("id")}"]`);
                                if (result) {
                                    label.removeClass("custom-unchecked").addClass("custom-checked");
                                } else {
                                    label.removeClass("custom-checked").addClass("custom-unchecked");
                                }
                            }
                        });
                });

                $(".single-member").click(function () {
                    let totalChecked = 0;
                    $(".single-member").each(function () {
                        if ($(this).is(":checked")) {
                            totalChecked++;
                        }
                    });
                    if (totalChecked == $(".single-member").length) {
                        $(".package-members").next().removeClass("custom-unchecked");
                        $(".package-members").next().addClass("custom-checked");
                        $(".package-members").prop("checked", true);
                    }
                });
            },
            function (errormessage) {
                swal({
                    title: 'Error',
                    text: 'An unexpected error occurred',
                    type: 'error',
                    confirmButtonColor: '#f2533e'  // Red
                });

                reject(errormessage);
            }
        );

        document.getElementById('closePromoteTreeModelDialog').onclick = () => {
            popup.style.display = 'none';
            overlay.style.display = 'none';
            resolve([]);
        };

        document.getElementById('promoteButton').onclick = () => {
            const selectedAPIs = getPromotedSelectedAPIs();
            popup.style.display = 'none';
            overlay.style.display = 'none';
            resolve(selectedAPIs);
        };
    });
}


function getPromotedSelectedAPIs() {
    const checkboxes = document.querySelectorAll('#promoteTreeContainer input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(checkbox => ({
        asset: checkbox.value,
        type: checkbox.dataset.type,
        // id: checkbox.id.replace('api-', ''),
    }));
}

function attachPromoteDialogCheckboxListeners() {
    const checkboxes = document.querySelectorAll('#promoteTreeContainer input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            let ref = $("label[for=" + event.target.id + "]");
            if (event.target.checked) {
                ref.removeClass("custom-unchecked");
                ref.addClass("custom-checked");
            } else {
                ref.removeClass("custom-checked");
                ref.addClass("custom-unchecked");
            }
        });
    });

    const firstApi = document.querySelector('#promoteTreeContainer input[type="checkbox"]:disabled');
    if (firstApi) {
        firstApi.addEventListener('change', (event) => {
            event.target.checked = true;
        });
    }
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

    if (SDK_EMBEDDED) {
        $(".from-menu").hide();
    }

    $(".ok_close").click(function() {
        $("#configureSetValueModelDialog, #elementPropertyModalDialog, #configureInputJSONSchemaTextDialog, #flowElementPropertyModalDialog, #configureMapLinePropertiesModelDialog, #configurePropertiesModelDialog").hide();
    });

    $(".watermark_btn").click(function(e) {
        onContextMenu(e.originalEvent);
    });

    if (SDK_EMBEDDED) {
        return ;
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
    $("#flowFullScreen").attr("href", getSystemResourcePath() + "/workspace/web/apiMaker/apiEditor.html?loadFile=" + loadFile);
    $("#serviceLog").attr("href", getSystemResourcePath() + "/workspace/web/server-logs.html?serviceName=" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main"));
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

            let snapDeleteIcon = getSystemResourcePath() + "/icons/snap-delete.svg";
            let html = "<img src='" + snapDeleteIcon + "'>";
            $(".select-dropdown__list").html('<li><div class="srch_dlt"><div class="ui left icon input srch_itm"><i class="search_icon2"></i><input type="text" id="snap-search" name="search" placeholder="Search..."></div><div class="delete_nm" style="display: none;"><a href="javascript:void(0)"> ' +html + ' Delete 0 item</a></div><div class="snap-group"><input type="checkbox" id="delete_snap"><label for="delete_snap">Delete snapshots</label></div></div></li>');

            for (let i = 0; i < response.fileDispose.length; i++) {
                /**/

                $(".select-dropdown__list").append('<li data-value="' + (response.fileDispose[i].name) + '" data-time="' + response.fileDispose[i].time + '" class="select-dropdown__list-item"><div class="snap-group-all"> <span class="chk_sh" style="display: none;"> <input class="chk_sty" data-snap="' + response.fileDispose[i].name + '" type="checkbox" id="delete_snap' + (i + 1) + '"> <label for="delete_snap' + (i + 1) + '"></label> </span><span class="description">' + response.fileDispose[i].name.replace(".snap", "") + '</span></div><span class="time">' + response.fileDispose[i].time + '</span></li>');

                //$("#snapshotList").append("<option value='" + response.fileDispose[i].key + "'>" + response.fileDispose[i].name + "</option>");
            }

            $("#snap-search").keyup(function(){
                let keyVal = this;
                $(".chk_sty").each(function () {
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

            $("#delete_snap").click(function () {
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

            $(".chk_sty").click(function () {
                $(".delete_nm").html('<a href="javascript:deleteSnaps()"><img src=getSystemResourcePath() + "/icons/snap-delete.svg"> Delete ' + $(".chk_sty:checked").length + ' item(s)</a>');
                if ($(".chk_sty:checked").length > 0) {
                    $(".delete_nm a").css({"color": "#2C61F5"});
                    $(".delete_nm a img").css({"filter": "invert(27%) sepia(51%) saturate(2878%) hue-rotate(195deg) brightness(90%) contrast(100%)"});
                } else {
                    $(".delete_nm a").css({"color": "#7e7e7e"});
                    $(".delete_nm a img").css({"filter": "invert(25%) sepia(15%) saturate(10%) hue-rotate(279deg) brightness(5%) contrast(1%)"});
                }
            });

            $('.select-dropdown__button').on('click', function(){
                $('.select-dropdown__list').toggleClass('active');
            });
            $('.select-dropdown__list-item').on('click', function(){
                var itemValue = $(this).data('value');
                $("#snapshotList").val(itemValue);
                $(".snap_time").show();
                let iconPath = getSystemResourcePath() + '/icons/cl-time.svg';
                $(".snap_time").html('<img src="' + iconPath + '"> &nbsp; ' + $(this).data('time'));
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

function deleteSnaps() {
    let snaps = [];
    $(".chk_sty:checked").each(function () {
        snaps.push($(this).data('snap'));
    });

    let HTML = $(".delete_nm").html();
    $(".delete_nm").html("Deleting...");
    asyncRestRequest("/DeleteSnaps", JSON.stringify({
        "fqn": loadFile.replace("files/", "").replace(".api", "").replaceAll("/", "."),
        "snaps": snaps
    }), "POST",
        function (response) {
            if (response.status == 200) {
                swal({
                    title: "Deleted",
                    text: "Snapshots has been deleted successfully!",
                    type: "success",
                    confirmButtonColor: "#2C61F5"  // Green
                });

                let snapDeleteIcon = getSystemResourcePath() + "/icons/snap-delete.svg";
                $(".delete_nm").html('<a href="javascript:deleteSnaps()"><img src="\'" + snapDeleteIcon + "\'"> Delete 0 item(s)</a>');
                $(".delete_nm a").css({"color": "#7e7e7e"});
                $(".delete_nm a img").css({"filter": "invert(25%) sepia(15%) saturate(10%) hue-rotate(279deg) brightness(5%) contrast(1%)"});

                $(".chk_sty:checked").each(function () {
                    console.log($(this).parent().parent().parent().remove());
                });

            } else {
                swal({
                    title: "Delete Failed",
                    text: "Error in delete, Try again!",
                    type: "error",
                    confirmButtonColor: "#f2533e" // Optional: Custom red color for button
                    });

                $(".delete_nm").html(HTML);
            }
        },function (error) {
            swal({
                title: 'Error.',
                text: 'Unable to delete snapshot',
                type: 'error',
                confirmButtonColor: '#f2533e' // red button
            });

            $(".delete_nm").html(HTML);
        }
    );
}

function simulateSnapshot() {
    localStorage.setItem("simulation_snapshot", $("#snapshotList").val());
    localStorage.setItem("simulating_service", loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main"));
    asyncRestRequest(
        "/middleware/logs/" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main") + "/" + $("#snapshotList").val(),
        null,
        "GET",
        function(response) {
            localStorage.setItem("simulate_response", JSON.stringify(response));
            $("#closeSnapModelDialog").trigger('click');
            location.reload();
        },
        function(errormessage) {
            swal({
                title: 'Error',
                text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                type: 'error',
                confirmButtonColor: '#f2533e'
            });

        }
    );
}

function downloadSnapshot(ref) {

    $(ref).attr("disabled", "disabled");
    $(ref).html("...");

    $.ajax({
        url: window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") +
            "/middleware/logs/" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main") + "/" + $("#snapshotList").val(),   // path to your txt file
        type: "GET",
        headers: { "Authorization": `Bearer ${localStorage.getItem("AuthToken")}` },
        dataType: "text",
        success: function (data) {

            $(ref).removeAttr("disabled");
            $(ref).html("Download");

            const jsonString = JSON.stringify(data, null, 2);

            // Create blob
            const blob = new Blob([jsonString], { type: "application/json" });

            // Create URL
            const url = URL.createObjectURL(blob);

            // Create temporary anchor
            const a = document.createElement("a");
            a.href = url;
            a.download = $("#snapshotList").val();

            // Trigger download
            document.body.appendChild(a);
            a.click();

            // Cleanup
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        error: function (xhr, status, error) {
            console.error("Error loading file:", error);
            $(ref).removeAttr("disabled");
            $(ref).html("Download");
            swal("Not Downloading", "Error while downloading the snapshot. Please try later!", "error");
        }
    });

}

function openAPIDownload() {
    collecta('Export', '', 'OpenAPI', 'Swagger Export');
    let fqn = loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main");
    asyncRestRequest("/packages.middleware.pub.specs.swagger.v3.ExportSwagger.main?fqn=" + fqn + "&isDownloadable=true", null,"GET",
        function (res){
            downloadContentOffline(res, fqn + ".json", "application/json");
        },
        function (e){
            console.error("Error occurred while calling getServiceAsResponse api.")
        });
}

function fullScreen() {
    collecta('Open', '', 'New Tab', 'Full Screen');
    window.open(getSystemResourcePath() + "/workspace/web/apiMaker/apiEditor.html?loadFile=" + loadFile, "_blank");
}

function openServerLog() {
    collecta('Open', '', 'New Tab', 'Server Log');
    window.open(getSystemResourcePath() + "/workspace/web/server-logs.html?serviceName=" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main"), "_blank");
}



function openDebuggingPanels() {
    $(".popup_main").show();
    $(".popup_main2").show();
}

function closeDebuggingPanels() {
    $(".popup_main").hide();
    $(".popup_main2").hide();
}

function debugDataLoader(selector, data) {
    $(selector).html(data);
}

$(".popup_close").click(function () {
    $(".popup_main").hide();
    $('#debMaxmin').addClass('s_width_popup').removeClass('full_width_popup');
});

$(".popup_close2").click(function () {
    $(".popup_main2").hide();
    $('#debMaxmin2').addClass('s_width_popup').removeClass('full_width_popup');
});


function debugMaximizePopup() {
    if ($('#debMaxmin.s_width_popup').length) {
        $('#debMaxmin').addClass('full_width_popup').removeClass('s_width_popup');
        $('.vr_ico_expand').hide();
        $('.vr_ico_collapse').show();
        $(".popup_main2").hide();
    } else {
        $('#debMaxmin').addClass('s_width_popup').removeClass('full_width_popup');
        $('.vr_ico_expand').show();
        $('.vr_ico_collapse').hide();
        $(".popup_main2").show();
    }
}


function debugMaximizePopup2() {
    if ($('#debMaxmin2.s_width_popup').length) {
        $('#debMaxmin2').addClass('full_width_popup').removeClass('s_width_popup');
        $('.vr_ico_expand2').hide();
        $('.vr_ico_collapse2').show();
        $(".popup_main").hide();
    } else {
        $('#debMaxmin2').addClass('s_width_popup').removeClass('full_width_popup');
        $('.vr_ico_expand2').show();
        $('.vr_ico_collapse2').hide();
        $(".popup_main").show();
    }
}


$(".box_resize").resizable({
    handleSelector: ".win-size-grip"
});



function openServicePopup() {

    var modal = document.getElementById("serviceModelDialog");
    var span = document.getElementById("closeServiceModelDialog");

    modal.style.display = "block";

    if ($('#service_tree_v').jstree(true)) {
        $('#service_tree_v').jstree("destroy");
    }

    $("#service_tree_v").empty();

    getServices();

    span.onclick = function () {
        modal.style.display = "none";
    };

    if (typeof menu !== "undefined") {
        $(menu).hide();
    }
}

$(document).ready(function() {

    if (isInIframe()) {
        $("#full_screen_btn").show();
        /*$("#full_screen_btn").click(function () {
            window.open(
                location,
                '_blank'
            );
        });*/
        $("#full_screen_btn").click(function () {
            //window.parent.postMessage("toggleFullScreen", "*");
        });
    }

    getServices();

    /*$("#service_tree_v").on('click',
        function(e, data) {
            var ref = $("#service_tree_v").jstree(true);
            var src=ref.get_path(e.target, '/');

            var type=ref.get_type(e.target);

            if(type!="folder" && type!="root" && type!="package" && type!="default") {
                localStorage.setItem("currentSelectedService",src);
                localStorage.setItem("currentSelectedService_type",type);
                localStorage.setItem("currentSelectedService_json",JSON.stringify(ref.get_node(e.target).data));
            }
        }
    )*/
});

function refreshServices() {

    if (othersJsTree) {
        othersJsTree.destroy();
    }

    $("#service_tree_v").empty();

    getServices();
}

function getServices() {

    let url = (!SDK_EMBEDDED && !isinIframe())
        ? "/packages.middleware.pub.server.browse.getPackagesAsTree.main"
        : "/public/apiList2?_id=" + (getUrlParam("_id") ? getUrlParam("_id") : "");

    asyncRestRequest(url, null, "GET", function (result) {

        apiList = sortPackages(result);

        $("#service_tree_v").html("");

        let packageList = [];

        if (!SDK_EMBEDDED && !isinIframe()) {

            let inputVal = addIconPath(apiList);
            packageList = [inputVal];

        } else {

            let inputVal = addIconPath(apiList.packages[0]);
            packageList = [inputVal];

            if (apiList.embeddedServices?.length > 0) {
                packageList.push(generateEmbeddedServiceTree(apiList.embeddedServices));
            }

            if (apiList.contexts?.length > 0) {
                packageList.push(generateContextTree(apiList.contexts));
            }

            if (apiList.functions && Object.keys(apiList.functions).length > 0) {
                packageList.push(generateFunctionsTree(apiList.functions));
            }
        }

        othersJsTree = createOthersJstree("#service_tree_v", packageList);

        let innerPath = document.getElementById("service_tree_v");
        innerPath.style.overflow = "scroll";

        $('#service_tree_v')
            .off('select_node.jstree')
            .on('select_node.jstree', function (e, data) {

                let node = data.node;
                if (!node) return;

                if (node.type === "folder" ||
                    node.type === "root" ||
                    node.type === "package" ||
                    node.type === "default") {
                    return;
                }

                let fullPath = othersJsTree.get_path(node, '/');

                localStorage.setItem("currentSelectedService", fullPath);
                localStorage.setItem("currentSelectedService_type", node.type);
                localStorage.setItem("currentSelectedService_json", JSON.stringify(node.data || {}));

                console.log("Selected Service:", fullPath);
                console.log("Selected Type:", node.type);
            });

        var to = false;
        $('#others_services').off('keyup').on('keyup', function () {

            if (to) clearTimeout(to);

            to = setTimeout(function () {
                let v = $('#others_services').val();
                othersJsTree.search(v, false, true);
            }, 250);
        });

    });
}

function generateEmbeddedServiceTree(servicesList) {

    var tree = {
        text: embedded_services_label,
        type: "root",
        children: []
    };

    if (null == servicesList) {
        return tree;
    }

    for (var i = 0 ; i < servicesList.length ; i++) {
        tree.children.push({
            text: servicesList[i],
            type: "api",
        });
    }

    return tree;

}

function generateContextTree(servicesList) {

    var tree = {
        text: embedded_services_context,
        type: "root",
        children: []
    };

    if (null == servicesList) {
        return tree;
    }

    for (var i = 0 ; i < servicesList.length ; i++) {
        tree.children.push({
            text: servicesList[i],
            type: "object"
        });
    }

    return tree;

}

function generateFunctionsTree(servicesList) {

    var tree = {
        text: embedded_services_function,
        type: "root",
        children: []
    };

    if (null == servicesList) {
        return tree;
    }

    let keysIterator = Object.keys(servicesList);

    let FUNC_MAP = {};

    for (var i = 0 ; i < keysIterator.length ; i++) {
        let data = JSON.parse(servicesList[keysIterator[i]]).data;

        let className = keysIterator[i];
        let lastDotIndex = className.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            className = className.substring(0, lastDotIndex);
        }
        if (null == FUNC_MAP[className]) {
            FUNC_MAP[className] = [];
        }

        FUNC_MAP[className].push(servicesList[keysIterator[i]]);
    }

    keysIterator = Object.keys(FUNC_MAP);

    for (var i = 0 ; i < keysIterator.length ; i++) {

        let funcs = FUNC_MAP[keysIterator[i]];

        let funcsObj = [];

        for (var j = 0 ; j < funcs.length ; j++) {
            let data = JSON.parse(funcs[j]).data;
            let li_attr_class = (data.staticFunction ? "static-function" : "");
            funcsObj.push({
                text: data.function + "(" + data.argumentsWrapper + ")",
                type: "function",
                data: data,
                "li_attr": { "class": li_attr_class }
            });
        }
        tree.children.push({
            text: keysIterator[i],
            type: "package",
            children: funcsObj
        });
    }

    return tree;

}

function sortPackages(response){

    var response_val = response;

    if (response_val == null || !response_val.children){
        return response;
    }

    response_val.children = response_val.children.sort(compareForSort);
    var temp_val = response_val.children;
    var child_len = temp_val.length;

    for (var i = 0; i < child_len; i++){
        sortPackages(temp_val[i]);
    }
    return response;
}

function compareForSort( a, b ) {
    if ( a.text.toUpperCase() < b.text.toUpperCase() ){
        return -1;
    }
    if ( a.text.toUpperCase() > b.text.toUpperCase() ){
        return 1;
    }
    return 0;
}


let SERVICE_JSON_RESPONSE = {};
function loadService(json) {
    SERVICE_JSON_RESPONSE = {
        "status": 200,
        "payload": isJsonString(json) ? json : JSON.stringify(json)
    };
    if(SDK_EMBEDDED){
        loadFile = true;
    }
    loadRemoteFile(false);
}

function loadApiService(json) {
    SERVICE_JSON_RESPONSE = {
        "status": 200,
        "payload": isJsonString(json) ? json : JSON.stringify(json)
    };
    loadRemoteFile(false);
}

document.addEventListener('DOMContentLoaded', function() {
    function getCurrentTime() {
        const now = new Date();
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return now.toLocaleTimeString([], options);
    }
    function updateTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = getCurrentTime();
        }
    }
    updateTime();
});




function importService() {

    if (!(/^[\],:{}\s]*$/.test($("#info_description").val().replace(/\\["\\\/bfnrtu]/g, '@')
        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
        .replace(/(?:^|:|,)(?:\s*\[)+/g, '')))) {

        swal({
            title: "Invalid JSON",
            text: "Importing JSON structure is incorrect.",
            type: "error",
            confirmButtonColor: "#f2533e"
        });

        return ;
    }

    swal({
            title: "Warning",
            text: "Your existing service will override if you import it!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            cancelButtonText: "No, Cancelled it!",
            confirmButtonText: "Okay",
            showLoaderOnConfirm: true,
            closeOnConfirm: true,
            closeOnCancel: true
        },
        function(isConfirm) {
            if (isConfirm) {

                loadService($("#info_description").val());
                $("#importSwaggerModal").modal('toggle');
                document.getElementById('resetBtn').click();
            }
        });

}


function evaluateFile(ref) {
    validateContent(ref.files[0]);
    ref.form.fileName.value = ref.files[0].name;
}

function validateContent(file) {
    if (!file.name.endsWith(".api")) {
        swal({
            title: "Only Json file is allowed.",
            text: "",
            type: "error",
            confirmButtonColor: "#f2533e"
        });


        return ;
    }
    const reader = new FileReader();
    reader.addEventListener('load', function() {
        let Uploaded_File_Content = JSON.parse(reader.result);

        swal({
                title: "Warning",
                text: "Your existing service will override if you import it!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#f2533e",
                cancelButtonText: "No, Cancelled it!",
                confirmButtonText: "Okay",
                showLoaderOnConfirm: true,
                closeOnConfirm: true,
                closeOnCancel: true
            },
            function(isConfirm) {
                if (isConfirm) {

                    loadService(Uploaded_File_Content);
                    $("#importSwaggerModal").modal('toggle');
                } else {
                    resetFunction();
                }
            });

    });
    reader.readAsText(file);
}

function resetFunction(){
    document.getElementById("resetBtn").click();
}

function openSmartImport(){
    $("#smartI_popup_code").removeClass('active');
    $("#smartI_popup_file").addClass('active');
    $("#file").addClass('active');
    $("#link").removeClass('active');

    $("#importMessage").val('');
    $("#smartImportModal").modal('toggle');
}

