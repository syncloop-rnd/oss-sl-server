//Initialize bootstrap tooltips
var SERVICE_TYPE = "FLOW";
if (typeof parent.closeDebuggingPanels === 'function') {
    parent.closeDebuggingPanels();
}

if (localStorage.getItem("simulation_snapshot")) {
    $("#stop_simulation_btn").show();
}

var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, {
        trigger: 'hover'
    });
});

if (localStorage.getItem("simulation_snapshot")) {
    $("#stop_simulation_btn").show();
}

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

copyButton.addEventListener("click", (e) => copyText(e));
copyButton.addEventListener("mouseover", (e) => resetTooltip(e));
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
        $('#flowDesignerJsTree').jstree(true).search(v, false, true);
    }, 250);
});


loadFile = getUrlParam("loadFile");
flowDesignerJsTreeRef = createFlowJstree('#flowDesignerJsTree');

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
    refreshFlowNodeData();
});

$("#flowDesignerJsTree").on('paste_node.jstree', function(e, data) {
    refreshFlowNodeData();
});

$("#flowDesignerJsTree").on('open_node.jstree', function(e, data) {
    refreshFlowNodeData(data.node);
});

function refreshFlowNodeData(node) {
    if (!node)
        node = flowDesignerJsTreeRef.get_node("#");
    if (node.children_d.length > 0) {
        for (var i = 0; i < node.children_d.length; i++) {
            replaceAndAdd(node.children_d[i]);
            setFlowElemProperty(node.children_d[i], "comment");
            setFlowElemProperty(node.children_d[i], "switch");
            setFlowElemProperty(node.children_d[i], "case");
            setFlowElemProperty(node.children_d[i], "ifcondition");
            setFlowElemProperty(node.children_d[i], "status");
            setFlowElemProperty(node.children_d[i], "snap");
            setFlowElemProperty(node.children_d[i], "snapCondition");
            setFlowElemProperty(node.children_d[i], "requestMethod");
            setFlowElemProperty(node.children_d[i], "inArray");
            setFlowElemProperty(node.children_d[i], "outArray");
        }
    }
}

/*function replaceAndAdd(nodeId) {
    var nodeAnchor=$("#"+nodeId+"_anchor");
    if (null == nodeAnchor[0]) {
    return ;
}
    if (nodeAnchor[0].innerText.toUpperCase() == "TRANSFORMER") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.transformer.icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='transformer-tape'>TRANSFORMER</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "MAP") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.transformer.icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='transformer-tape'>MAP</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "GROUP") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.group.icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='group-tape'>GROUP</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "SEQUENCE") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.group.icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='group-tape'>SEQUENCE</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "IFELSE") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.ifelse.icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='ifelse-tape'>IFELSE</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "SWITCH") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.switch.icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='switch-tape'>SWITCH</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "TCF-Block") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types["try-catch"].icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='tcf-block-tape'>TCF-BLOCK</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "FOREACH") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.foreach.icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='foreach-tape'>FOREACH</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "LOOP") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.foreach.icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='foreach-tape'>LOOP</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "REDO") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.redo.icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='redo-tape'>REDO</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "REPEAT") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.redo.icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='redo-tape'>REPEAT</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "TRY") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types["try-catch"].icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='try-tape'>TRY</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "CATCH") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types["try-catch"].icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='catch-tape'>CATCH</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "FINALLY") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types["try-catch"].icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='finally-tape'>FINALLY</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "CASE") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.group.icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='case-tape'>CASE</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "CONDITION") {
    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.group.icon + '\'); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='case-tape'>CONDITION</span>");
} else if (nodeAnchor[0].innerText.toUpperCase() == "INVOKE" || nodeAnchor[0].innerText == "SERVICE") {
    let node = $("#flowDesignerJsTree").jstree(true).get_node(nodeId);
    let nodeService = "";
    if (null != node.data && null != node.data.fqn) {
    let splitter = node.data.fqn.split("/");
    nodeService = ": " + splitter[splitter.length - 1] + " ";
}

    nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(drag1.png); background-position: center center; background-size: auto;"></i>');
    nodeAnchor.append("<span class='case-tape'>SERVICE</span>" + nodeService);
}

}*/

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
            text = "(" + text + ")";
        else if (attribute == "case" || attribute == "switch" || attribute == "ifcondition")
            text = ": " + text;
        else if (attribute == "inArray" || attribute == "outArray") {
            if (attribute == "inArray") {
                text = " Input: " + node.data[attribute];
            } else if (attribute == "outArray") {
                text = " --> Output: " + node.data[attribute];
            }
            if (!text.includes("Index:")) {
                //text += " Index: " + node.data["indexVar"];
            }
        }
        else if (attribute == "status") {
            if (text == "disabled") {
                text = " (DISABLED)";
                if (null != nodeAnchor[0]) {
                    nodeAnchor[0].className += " disabled-invoke-link ";
                }
                cls += " disabled-invoke-text ";
            } else text = null;
        } else if (attribute == "snap") {
            if (text == "enabled" || text == "conditional")
                text = " --> Snap ";
            else text = null;
        } else if (attribute == "requestMethod") {
            if (text == "async") {
                text = "<i class='wr_asy'><img src='/middleware/pub/server/ui/icons/async_icon.svg'></i>";
                cls = "glyphicon glyphicon-transfer-";
                pos = "preFix";
            } else if (text == "asyncQueue") {
                text = "<i class='wr_asy'><img src='/middleware/pub/server/ui/icons/async_icon_clock.svg'></i>";
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

    if (data.node.type == 'invoke') {
        flowDesignerJsTree.css("height", "55%");
        $("#plainMapping").css("display", "none");
        $("#serviceMapping").css("display", "block");
        $("#mappingArea").css("display", "block");
        //alert("");

        //console.log(data.node.data.serviceType);
        if (!data.node.data)
            data.node.data = {};

        if (data.node.data.serviceType) {
            var response = syncRestRequest("/files/" + data.node.text + "." + data.node.data.serviceType, "GET", "");
            //console.log(response);
            setTimeout(function() {
                if (response.status == 200 && response.payload) {
                    response = JSON.parse(response.payload);
                    if (data.node.data.serviceType == "api" || data.node.data.serviceType == "flow")
                        response = response.latest;
                    removeIcons(response.input);
                    removeIcons(response.output);
                    var inData = response.input;
                    var outData = response.output;
                    var randomId = Math.floor(Math.random() * 10000);
                    if (data.node.data.requestMethod == "async") {
                        var asyncTempInDoc = JSON.parse(JSON.stringify(asyncInDoc));
                        var asyncTempOutDoc = JSON.parse(JSON.stringify(asyncOutDoc));

                        //modifyJsTreeIds(asyncTempInDoc,randomId+"_async_funcInput");
                        //modifyJsTreeIds(asyncTempOutDoc,randomId+"_async_funcOutput");
                        //inData.push(asyncTempInDoc[0].children[0]);
                        $.merge(asyncTempInDoc.children, inData);
                        //asyncTempInDoc[0].children.concat(inData);

                        //outData.push(asyncTempOutDoc[0].children[0]);
                        $.merge(asyncTempOutDoc.children, outData);
                        //asyncTempOutDoc[0].children.concat(outData);

                        inData = [asyncTempInDoc];
                        outData = [asyncTempOutDoc];

                    }
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

                    $("#centerServiceName").html(data.node.text.replace("files/", "").replaceAll("/", " > ") + "." + data.node.data.serviceType);
                }
            }, 200);
        } else {
            mapperObj.init(data.node);
            setTimeout(function() {
                getAllVisibleInputs(data.node);
            }, 200);
        }
    } else if (data.node.type == 'map') {
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
});

outputJstreeRef = createSchemaJstree('#output_schema_editor_jsTree');


$("#output_schema_editor_jsTree").on('changed.jstree', function(e, data) {
    outputJsTree_id = loadFile + "_outputJsTree";
    var data = outputJstreeRef.get_json('#', {
        flat: false
    });
    localStorage.setItem(outputJsTree_id, JSON.stringify(data));
    setUnsavedChanges(loadFile);
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
        var response = syncRestRequest("/" + loadFile, "GET", "");
        //console.log(response);
        //alert(response.status);
        if (response.status == 200 && response.payload) {
            response = response.payload;
            response = JSON.parse(response);
            updateUUID(response.latest.flow);

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
            removeIcons(response.flow);

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

            for (let i = 0 ; i < response.flow.length ; i++) {
                if (null == response.flow[i].state) {
                    continue;
                }
                response.flow[i].state.hidden = false;
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
                var data = response.flow;
                if (data != null)
                    localStorage.setItem(flowJsTree_id, JSON.stringify(data));
            }
        }
    }
    loadFromlocalstorage(overwrite);
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
            data[i].a_attr.href = "javascript:void(0)";
        }

        console.log(data);

        flowRef.settings.core.data = data;
        flowRef.refresh();
    }

    let pathItems = loadFile.replace("files/", "").split("/");

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
    collecta('UNLOCK', '', 'Unlock', 'Unlocking API');
    var response = syncRestRequest(("/flow/" + loadFile).replace("/flow/files/", "/artifact/unlock/"), "POST");
    if (response.status == 200) {
        localStorage.setItem(loadFile, "");
        //alert(JSON.parse(response.payload).status);
        //swal('Accepted', JSON.parse(response.payload).status, 'success');
        if (JSON.parse(response.payload).status == 'Access denied.') {
            var message = "You don't have permission to unlock this.\nPlease check with your admin and try again.";
            swal({
                title: 'Access denied.',
                text: message,
                type: 'error',
                confirmButtonColor: '#f2533e'
                });

        } else {
            var message = JSON.parse(response.payload).status;
            swal({
                title: 'Accepted.',
                text: "You've successfully unlocked this service.",
                type: 'success',
                confirmButtonColor: '#2C61F5'  // Green color
                });
        }

    } else
        //alert(JSON.parse(response.payload).error);
        swal({
            title: 'Rejected',
            text: JSON.parse(response.payload).error,
            type: 'error',
            confirmButtonColor: '#f2533e'  // Red
        });

}

function lockArtifact() {
    collecta('LOCK', '', 'Lock', 'Locking API');
    var response = syncRestRequest(("/flow/" + loadFile).replace("/flow/files/", "/artifact/lock/"), "POST");
    if (response.status == 200) {
        localStorage.setItem(loadFile, "");
        //alert(JSON.parse(response.payload).status);
        //swal('Accepted', JSON.parse(response.payload).status, 'success');
        var message = "You've successfully locked this service.";
        swal({
            title: 'Success!',
            text: message,
            type: 'success',
            confirmButtonColor: '#2C61F5'  // Green
        });

    } else
        //alert(JSON.parse(response.payload).error);
        swal({
            title: 'Rejected',
            text: JSON.parse(response.payload).error,
            type: 'error',
            confirmButtonColor: '#f2533e'  // red
        });

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

    $("#CloneInput").val(("#" + loadFile).replace("#files/packages/", "").replace(".flow", ""));

    cloneItButton.onclick = function() {
        let newLocation = $("#CloneInput").val();
        if (newLocation.trim() == "") {
            swal({
                title: "Invalid Name",
                text: "Invalid new API service name.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });

            return ;
        }
        let newLocationArray = newLocation.split("/");
        if (newLocationArray.length < 2) {
           swal({
                title: "Invalid Path",
                text: "Please provide package name/folder name.",
                type: "error",
                confirmButtonColor: "#f2533e"
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
                    confirmButtonColor: "#f2533e"
                });

                return ;
            }
        }
        modal.style.display = "none";
        save("files/packages/" + newLocation + ".flow");
        cloneProperties("files/packages/" + newLocation);
        collecta('Save', '', 'Clone', 'Cloning API : ' + newLocation);
        parent.loadPackages();
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

function save(servicePath) {
    if (!servicePath)
        servicePath = loadFile;
    var dataJson = {
        "latest": {
            "createdTS": "",
            "input": [],
            "output": [],
            "flow": [],
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
    dataJson[version].flow = flowDesignerJsTreeRef.get_json('#', {
        flat: false
    });
    dataJson[version].api_info.title = $("#api_info_title").val();
    dataJson[version].api_info.description = $("#api_info_description").val();
    removeIcons(dataJson[version].input);
    removeIcons(dataJson[version].output);
    removeIcons(dataJson[version].flow);
    //console.log(dataJson[version].flow);
    //   console.log(JSON.stringify(flowDesignerJsTreeRef.get_json('#', {flat:false})[10]));
    //flowDesignerJsTreeRef.get_json('#', {flat:true});
    dataJson.consumers = $("#serviceConsumers").val().toString();
    dataJson.developers = $("#serviceDevelopers").val().toString();
    dataJson.enableServiceDocumentValidation = $("#enableServiceDocumentValidation").prop("checked");

    var data = JSON.stringify(dataJson);

    collecta('Save', '', 'API_Service', 'Service : ' + servicePath)

    if (data != null && data.trim().length > 0) {

        var response = syncRestRequest(("/flow/" + servicePath).replace("/flow/files/", "/flow/"), "POST", data);
        if (response.status == 200) {
            localStorage.setItem(loadFile, "");
            //if (!SILENT_SAVE_ONCE) {
            swal({
                    title: "API is Ready",
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
                        //location.href = location.href.replaceAll("silentSave", "").replaceAll("developers", "").replaceAll("consumers", "");
                        if (!SILENT_SAVE_ONCE) {
                            //reload();
                            localStorage.setItem(loadFile, "overwrite");
                        } else {
                            SILENT_SAVE_ONCE = false;
                        }

                    } else {

                    }
                });
            /*} else {
                SILENT_SAVE_ONCE = false;

            }*/
            parent.loadPackages();
        } else
            //alert(JSON.parse(response.payload).error);
           swal({
                title: 'Error',
                text: JSON.parse(response.payload).error,
                type: 'error',
                confirmButtonColor: '#f2533e'
            });

    } else
        //alert("No changes to save");
        swal({
            title: "Warning !!",
            text: "No changes to save",
            type: "warning",
            confirmButtonColor: "#f2533e" // Orange
        });

}

function reload() {
    localStorage.setItem(loadFile, "overwrite");
    loadRemoteFile(true);
    setUnsavedChanges(loadFile, false);
    location.reload(true);
    //window.location = window.location.href+'?eraseCache=true';
}

function openDocumentation() {
    location.href = getSystemResourcePath() + "/workspace/web/flowMaker/TinyMCE.html?loadFile=" + loadFile;
}

loadRemoteFile(false);

menu = null; //document.getElementById('input_schema_editor_jsTree_contextMenu');

function showMenu(x, y) {
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
    console.log(e.target);
    console.log(e.target.id);
    if (menu != null)
        hideMenu();

    removePackageContextMenu();

    menu = null;
    if (e.target.id == "input_schema_editor_jsTree" || e.target.parentNode.id == "input_schema_editor_jsTree") {
        currentJstreeRef = inputJstreeRef;
        var ele = document.getElementById('in_paste_item_node');
        menu = document.getElementById('input_schema_editor_jsTree_contextMenu');
        if (currentJstreeRef.can_paste()) {
            ele.style.display = 'block';
        } else {
            ele.style.display = 'none';
        }
        $("#input_schema_editor_jsTree").jstree().deselect_all(true);
    } else if (e.target.id == "output_schema_editor_jsTree" || e.target.parentNode.id == "output_schema_editor_jsTree") {
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
        $("#input_schema_editor_jsTree").jstree().deselect_all(true);
    } else if (e.target.id == "landing_arrow_jsTree" || e.target.parentNode.id == "landing_arrow_jsTree") {
        currentJstreeRef = landing_arrow_jsTree_ref;
        menu = document.getElementById('output_schema_editor_jsTree_contextMenu');
        $("#output_schema_editor_jsTree").jstree().deselect_all(true);
    } else if (e.target.id == "flowDesignerJsTree")
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

        document.addEventListener('click', onClick, false);
    }
}

function submenu_click(data) {
    document.removeEventListener('click', onClick);

}

function onClick(e) {
    hideMenu();
    document.removeEventListener('click', onClick);
}

document.addEventListener('contextmenu', onContextMenu, false);
document.getElementById('flowDesignerJsTree').addEventListener("click", removePackageContextMenu);
document.getElementById('plainMapping').addEventListener("click", removePackageContextMenu);
var navBarNode = getElementByXpath("//*[@id='demo']/div/div");
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
            confirmButtonColor: "#f2533e"
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
        var nodeText = localStorage.getItem("currentSelectedService");
        if (node.text != nodeText) {
            mapperObj.clean();
            node.data.lines = null;
            node.data.transformers = null;
            launching_arrow_jsTree_function_ref.settings.core.data = [];
            launching_arrow_jsTree_function_ref.refresh();
            landing_arrow_jsTree_function_ref.settings.core.data = [];
            landing_arrow_jsTree_function_ref.refresh();
            ref.rename_node(node, nodeText);
            node.data.serviceType = localStorage.getItem("currentSelectedService_type");
            ref.select_node(node.id);
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
            confirmButtonColor: "#f2533e"
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
        var nodeText = localStorage.getItem("currentSelectedService");
        if (node.text != nodeText) {
            mapperObj.clean();
            node.data.lines = null;
            node.data.transformers = null;
            launching_arrow_jsTree_function_ref.settings.core.data = [];
            launching_arrow_jsTree_function_ref.refresh();
            landing_arrow_jsTree_function_ref.settings.core.data = [];
            landing_arrow_jsTree_function_ref.refresh();
            ref.rename_node(node, nodeText);
            node.data.serviceType = localStorage.getItem("currentSelectedService_type");
            ref.select_node(node.id);
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
    let createItem = mapperObj.getValue(landing_arrow_jsTree_ref);
    if (createItem) {
        //alert(createItem.value);
        $("#element_NoneVariable").prop("checked", true);
        $("#elementSetValueInput").val(createItem.value);
        $('#elementSetValueInputTextarea').text(createItem.value);
        if (createItem.evaluate == "EEV")
            $("#element_ExpressionVariable").prop("checked", true);
        if (createItem.evaluate == "ELV")
            $("#element_LocalVariable").prop("checked", true);
        if (createItem.evaluate == "EGV")
            $("#element_GlobalVariable").prop("checked", true);
        if (createItem.evaluate == "EPV")
            $("#element_PackageVariable").prop("checked", true);
        initialvalue = createItem.value;
        initialVariableType = createItem.evaluate;

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
        mapperObj.setValue(landing_arrow_jsTree_ref, value, evaluate);
        unloadElementSetValueInput();
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
}

function showInputJSONSchemaTextDialogSimpleJson(jsTreeRef) {
    $("#jsonSchemaTitle").html("Enter your JSON Payload here:-");
    var modal = document.getElementById("configureInputJSONSchemaTextDialog");
    var span = document.getElementById("closeInputJSONSchemaTextDialog");
    modal.style.display = "block";
    span.onclick = function() {
        var jsonSchema = $("#inputJSONSchemaText").val();
        var response = syncRestRequest("/packages.middleware.pub.json.toJsonSchema.main", "POST", jsonSchema);
        var datapipeline = JSON.parse(response.payload).properties;
        if (Object.keys(datapipeline).length != 0) {
            var jsTreeData = getJstreeFromSchema(response.payload);
            $("#inputJSONSchemaText").val("");
            jsTreeRef.settings.core.data = jsTreeData;
            jsTreeRef.refresh();
            modal.style.display = "none";
        } else {
           swal({
                title: "Enter a valid JSON.",
                text: "",
                type: "error",
                confirmButtonColor: "#f2533e"
            });

        }
    };
    hideMenu();
    document.addEventListener('click', onClick, true);
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
            text: "Please ensure that only one mapping line is red.",
            type: "warning",
            confirmButtonColor: "#f2533e"
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
    /*$("#elementSwitch").hide();
    $("#elementCase").hide();
    $("#invokeRequestMethod").hide();
    $("#elementRepeatOn").hide();
    $("#elementRepeatTimes").hide();
    $("#elementRepeatInterval").hide();
    $("#elementCondition").hide();
    $("#elementSequence").hide();*/
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
            confirmButtonColor: "#f2533e"
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
            $("#elementRepeatOnInput").val("error");

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

    if ((nodeParentType == "sequence" || nodeParentType == "group" || nodeParentType == "repeat") && nodeParent.data["evaluate"] == true) {
        $(".elementCondition").css("display", "block");
    }

    if (nodeType == "repeat") {
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
    /*span.onclick = function() {

    }*/
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
        if (node.id != nodeData.id && (nodeData.type == "invoke" || nodeData.type == "map")) {
            var dropList = nodeData.data.dropList;
            jQuery.each(dropList, function(i, map) {
                var dropPath = mapperObj.hashCode(map.path);
                //dropPath.typePath=map.typePath;
                dropPaths[dropPath] = {};
                dropPaths[dropPath].path = map.path;
                dropPaths[dropPath].dropped = true;
            });
        }
        if (node.id != nodeData.id && nodeData.type == "loop") {
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

        if (nodeData.type == "invoke" || nodeData.type == "map") {
            var lines = nodeData.data.lines;
            if (lines)
                jQuery.each(lines, function(j, line) {
                    //console.log(line);

                    if (line.inpJsTree == "#launching_arrow_jsTree" && line.outpJsTree == "#landing_arrow_jsTree_function" && nodeData.type == "invoke") {
                        return ;
                    }

                    if (line.inpJsTree == "#launching_arrow_jsTree_function" && line.outpJsTree == "#landing_arrow_jsTree" && nodeData.type == "invoke") {
                        retainingJson = [];
                        let fqn = nodeData.data.fqn;
                        if (null == fqn) {
                            fqn = nodeData.text;
                        }

                        if (null == LOADED_SERVICE_IO[fqn + "." + nodeData.data.serviceType + "_OUTPUT"]) {
                            var response = syncRestRequest("/files/" + fqn + "." + nodeData.data.serviceType, "GET", "");
                            if (nodeData.data.serviceType == "flow" || nodeData.data.serviceType == "api") {
                                LOADED_SERVICE_IO[fqn + "." + nodeData.data.serviceType + "_OUTPUT"] = JSON.parse(response.payload).latest.output;
                            } else {
                                LOADED_SERVICE_IO[fqn + "." + nodeData.data.serviceType + "_OUTPUT"] = JSON.parse(response.payload).output;
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
                        if (node.id != nodeData.id)
                            createInputPaths.push(createPath);
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
        asset: loadFile.replaceAll("files/", "").replaceAll(".flow", ""),
        type: "flow"
    }]);

    let array = loadFile.replaceAll("files/", "").replaceAll(".flow", "").split("/");

    var qp = "buildName=" + array[array.length - 1] + "_" + new Date().getTime() + "&includeDependencies=" + false + "&includeGlobalProperties=" + false +
        "&includeLocalProperties=" + false + "&includeEndpoints=" + false;
    var response = syncRestRequest("/build?" + qp, "POST", content, "application/json", "application/json");
    var jObj = JSON.parse(response.payload);
    if (response.status == 200) {
        //alert(jObj.msg);
        var element = document.createElement('a');
        var responseUrl = JSON.parse(response.payload).url
        element.setAttribute('href', window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + responseUrl
            + "?access_token=" + encodeURIComponent(localStorage.getItem("AuthToken")));
        element.setAttribute('target', "_blank");
        document.body.appendChild(element);
        element.click();
    }else{
       swal({
            title: jObj.msg,
            text: "", // Optional – can add more details here
            type: "error",
            confirmButtonColor: "#f2533e" // You can change the color
        });

    }

}

function promoteBuild() {

    if ($(".promoting-servers:checked").length == 0) {
            swal({
                title: "Warning",
                text: "Please select at-least one environment",
                type: "warning",
                confirmButtonColor: "#f2533e" // Optional: customize to match your theme
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
            asset: loadFile.replaceAll("files/", "").replaceAll(".flow", ""),
            type: "flow"
        }]);
        var qp = "buildName=" + new Date().getTime() + "&includeDependencies=" + false + "&includeGlobalProperties=" + false +
            "&includeLocalProperties=" + false + "&includeEndpoints=" + false;

        asyncRestRequest("/packages.middleware.pub.server.build.api.promoteBuild.main?" + qp + "&environment_id=" + blockValue, content, "POST", function(response) {
            if (response.status == "Saved") {
                imported++;
                $("#env-up-" + blockValue).html("<i><span class='fa fa-check'></span></i>");
            } else {
                $("#env-up-" + blockValue).html("<i><span class='fa fa-times'></span></i>");
            }
        });

    });
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
    if (!isInIframe()) {
        $("#service-c-m-option").hide();
    }
    loadGroupsDP();
    getAllEnvironments();
    $(".ok_close").click(function() {
        $("#configureSetValueModelDialog, #elementPropertyModalDialog, #configureInputJSONSchemaTextDialog, #flowElementPropertyModalDialog, #configureMapLinePropertiesModelDialog, #configurePropertiesModelDialog").hide();
    });

    if ("#" != getQueryVariable("developers")) {
        $("#serviceDevelopers").val(getQueryVariable("developers").split(",")).trigger('change');
    }

    if ("#" != getQueryVariable("consumers")) {
        $("#serviceConsumers").val(getQueryVariable("consumers").split(",")).trigger('change');
    }
    if ("true" == getQueryVariable("silentSave")) {
        SILENT_SAVE_ONCE = true;
        //save();
    }
    setTimeout(function() {
        flowIOHeightAdjuster()
    }, 1000);
    //$("#
    // ").attr("href", "/middleware/logs/" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.flow$/,".main") + "/list");

    asyncRestRequest("/middleware/logs/" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.flow$/, ".main") + "/list", null, "GET", function(response) {
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
            $(".select-dropdown__list").html('<li><div class="srch_dlt"><div class="ui left icon input srch_itm"><i class="search_icon2"></i><input type="text" id="snap-search" name="search" placeholder="Search..."></div><div class="delete_nm" style="display: none;"><a href="javascript:void(0)"><img src=getSystemResourcePath() + "/icons/snap-delete.svg"> Delete 0 item</a></div><div class="snap-group"><input type="checkbox" id="delete_snap"><label for="delete_snap">Delete snapshots</label></div></div></li>');

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

function deleteSnaps() {
    let snaps = [];
    $(".chk_sty:checked").each(function () {
        snaps.push($(this).data('snap'));
    });

    let HTML = $(".delete_nm").html();
    $(".delete_nm").html("Deleting...");
    let response = asyncRestRequest("/DeleteSnaps", JSON.stringify({
        "fqn": loadFile.replace("files/", "").replace(".flow", "").replaceAll("/", "."),
        "snaps": snaps
    }), "POST", function (response) {
        if (response.status) {
           swal({
                title: "Deleted",
                text: "Snapshots has been deleted successfully!",
                type: "success",
                confirmButtonColor: "#2C61F5" // Green
            });

            $(".delete_nm").html('<a href="javascript:deleteSnaps()"><img src=getSystemResourcePath() + "/icons/snap-delete.svg"> Delete 0 item(s)</a>');
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
                confirmButtonColor: "#f2533e"
            });

            $(".delete_nm").html(HTML);
        }

    });
}

function simulateSnapshot() {
    localStorage.setItem("simulation_snapshot", $("#snapshotList").val());
    localStorage.setItem("simulating_service", loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.flow$/, ".main"));
    let response = syncRestRequest("/middleware/logs/" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.flow$/, ".main") + "/" + $("#snapshotList").val(), "GET");
    localStorage.setItem("simulate_response", response.payload);
    $("#closeSnapModelDialog").trigger('click');
    location.reload();
}

function downloadSnapshot() {
    location.href = "/middleware/logs/" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.flow$/, ".main") + "/" + $("#snapshotList").val();
}

function openAPIDownload() {
    collecta('Export', '', 'OpenAPI', 'Swagger Export');
    let fqn = loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.flow$/, ".main");
    let response = syncRestRequest("/packages.middleware.pub.specs.swagger.v3.ExportSwagger.main?fqn=" + fqn + "&isDownloadable=true", "GET");
    downloadContentOffline(response.payload, fqn + ".json", "application/json");
}

function fullScreen() {
    collecta('Open', '', 'New Tab', 'Full Screen');
    window.open(getSystemResourcePath() + "/workspace/web/flowMaker/flowEditor.html?loadFile=" + loadFile, "_blank");
}

function openServerLog() {
    collecta('Open', '', 'New Tab', 'Server Log');
    window.open(getSystemResourcePath() + "/workspace/web/server-logs.html?serviceName=" + loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.flow$/, ".main"), "_blank");
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
