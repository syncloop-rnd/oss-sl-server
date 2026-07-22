
class syncloop{

static LOADED_SERVICE_IO = {};

constructor(){
let mySyncloop = this;
}

getUrlParam(name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)')
        .exec(window.location.search);

    return (results !== null) ? results[1] || 0 : false;
}

syncRestRequest(url, method, payload, contentType, dataType) {
    var response = {};
    var status = 200;
    if (contentType == null)
        contentType = "application/json";
    if (dataType == null)
        dataType = "application/json";
    $.ajax({
        url: url, // url where to submit the request
        type: method, // type of action POST || GET
        contentType: contentType,
        dataType: dataType, // data type
        data: payload, // post data || get data
        async: false,
        success: function (result) {

            // you can see the result from the console
            // tab of the developer tools
            response = result;
            //alert(result);
            console.log(result);
        },
        error: function (errormessage) {
            status = errormessage.status;
            if (errormessage.status == 200)
                response = errormessage.responseText;
            else {
                if (typeof swal === "function" && errormessage.status == 401) {
                    swal({
                            title: "Session Expired",
                            text: "Your session has been expired. Please login again.",
                            type: "error",
                            showCancelButton: true,
                            confirmButtonColor: "#f2533e",
                            cancelButtonText: "No, Stay here !!",
                            confirmButtonText: "Login",
                            showLoaderOnConfirm : true,
                            closeOnConfirm: true,
                            closeOnCancel: true
                        },
                        function(isConfirm){
                            if (isConfirm) {
                                mySyncloop.doLogout();
                            }
                            else {
                                swal({
                                    title: "Stay here !!",
                                    text: "",
                                    type: "warning",
                                    confirmButtonColor: "#f2533e" // Optional: orange/yellow shade
                                    });

                            }
                        });

                }
                console.log(errormessage.status);
                response = errormessage.responseText;
                //alert(errormessage.responseText);
            }
        }
    })
    return {
        "status": status,
        "payload": response
    };
}

removeIcons(jsonObject) {
    jQuery.each(jsonObject, function (i, val) {
        if (val.icon) {
            val.icon = null;
        }
        if (val.children) {
            mySyncloop.removeIcons(val.children);
        }
    });
}

asyncRestRequest(url, payload, method, callBack, errorCallback) {
    $.ajax({
        url: url, // url where to submit the request
        type: method, // type of action POST || GET
        contentType: 'application/json',
        dataType: 'json', // data type
        data: payload, // post data || get data
        success: function (result) {
            callBack(result);
        },
        error: function (errormessage) {
            if (typeof errorCallback === 'function') {
                errorCallback(errormessage);
            }
            //alert(errormessage.responseText);
            //swal("Error", errormessage.responseText, "error")
        }
    })
}

deleteAllCookies() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

iterateObject(obj, parentObj, parentKey) {
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            mySyncloop.iterateObject(obj[key], obj, key); // Recursive call for nested objects
        } else {
            //console.log(key, obj[key]);
            if (key == "$ref") {
              if (obj[key].startsWith("https://")) {
                  let response = mySyncloop.syncRestRequest("/packages.middleware.pub.client.http.requestAPI.main", "POST", JSON.stringify({
                      url: obj[key],
                      method: "GET"
                  }), "application/json");
                  if (null != parentObj) {
                      parentObj[parentKey] = JSON.parse(JSON.parse(response.payload).respPayload).properties;
                  }
              } else {
                  var arrays = obj[key].replace("#/", "").split("/");
                  var finalObj = "JSONSchemaData";
                  for (var i = 0 ; i < arrays.length ; i++ ) {
                      finalObj += "['" + arrays[i] + "']";
                  }
                  //console.log(finalObj);
                  if (null != parentObj) {
                      parentObj[parentKey] = eval(finalObj);
                  }
              }
            }
        }
    }
}

iterateObjectOptz(obj, parentObj, parentKey) {
    for (var key in obj) {
        if (key.includes(":")) {
            var nKey = key.slice(key.indexOf(":") + 1);
            obj[nKey] = obj[key];
            delete obj[key];
            key = nKey;
        }

        if (typeof obj[key] === 'object' && obj[key] !== null) {
            mySyncloop.iterateObjectOptz(obj[key], obj, key); // Recursive call for nested objects
        } else {

        }
    }
}

var JSONSchemaData = null;
getJstreeFromSchema(jsonSchema) {
    try {
        var MainJson = JSON.parse(jsonSchema);
        JSONSchemaData = MainJson;
        mySyncloop.iterateObject(MainJson);
        //mySyncloop.iterateObjectOptz(MainJson);
        var datapipeline = MainJson.properties;
        if (null == datapipeline["*payload"]) {
            var obj = {
                "*payload": {
                    "type": (null == MainJson.type) ? "object" : MainJson.type,
                    "properties": datapipeline,
                    "required": MainJson.required
                }
            }
            datapipeline = obj;
        }
        var data = mySyncloop.toJson(datapipeline, null, null);
        var jsonJstreeObj = data[0];
        var jsonObj = data[1];
        return jsonJstreeObj;
    } catch (err) {
       swal({
            title: "Error",
            text: err.message || "An unexpected error occurred",
            type: "error",
            confirmButtonColor: "#f2533e" // Optional: orange/yellow shade
            });

        throw err;
    }
}

toJson(jsonSchemaObj, isArray, requiredList) {
    var jsonJstreeObj = [];
    var jsonObj = {};
    if (isArray == true) {
        jsonJstreeObj = [];

    }
    var mapperThis = this;
    //console.log("Schema ******************************");
    //console.log(jsonSchemaObj);
    $.each(jsonSchemaObj, function (propName, propVal) {
        var jjtOBJ = {};
        var jobj = {};
        jjtOBJ.text = propName;
        jjtOBJ.data = {};

        if (null != requiredList && requiredList.includes(propName)) {
            jjtOBJ.data = {
                isRequiredField: true
            }
        }

        if (null != propVal.description) {
            jjtOBJ.data = {
                fieldDescription: btoa(propVal.description)
            }
        }
        jjtOBJ.children = {};
        if (propVal.type == "object") {
            jjtOBJ.type = "document";
            let jsonOA = mySyncloop.toJson(propVal.properties, null, propVal.required);
            jjtOBJ.children = (jsonOA[0]);
            jsonObj[propName] = jsonOA[1];
        } else if (propVal.type == "array") {
            if (null != propVal.items && (propVal.items.type == "object" || propVal.items.type == "array")) {
                jjtOBJ.type = "documentList";
                let jsonOA = mapperThis.toJson(propVal.items.properties, null, propVal.required);
                jjtOBJ.children = (jsonOA[0]);
                jsonObj[propName] = jsonOA[1];
            } else if (null != propVal.items && propVal.items.type == "string" ) {
                jjtOBJ.type = "stringList";
            } else if (null != propVal.items && propVal.items.type == "number" ) {
                jjtOBJ.type = "numberList";
            } else if (null != propVal.items && propVal.items.type == "boolean" ) {
                jjtOBJ.type = "booleanList";
            } else {
                jjtOBJ.type = "documentList";
            }
        } else { // pending to add condition when its value array
            jjtOBJ.type = propVal.type;
            if (propVal.type == "array") {
                jsonObj[propName] = [];
                if (!propVal.items.type)
                    propVal.items.type = "string"
                jjtOBJ.type = propVal.items.type + "List";
                switch (propVal.items.type) {
                    case "string":
                        jsonObj[propName].push("");
                        break;
                    case "integer":
                        jsonObj[propName].push(0);
                        break;
                    case "number":
                        jsonObj[propName].push(0.0);
                        break;
                    default:
                        jsonObj[propName].push("");
                }
            } else {
                if (null != propVal.maximum) {
                    jjtOBJ["data"]["maximumNumber"] = propVal.maximum;
                }
                if (null != propVal.minimum) {
                    jjtOBJ["data"]["minimumNumber"] = propVal.minimum;
                }

                switch (propVal.type) {
                    case "string":
                        jsonObj[propName] = "";
                        break;
                    case "integer":
                        jsonObj[propName] = 0;
                        break;
                    case "number":
                        jsonObj[propName] = 0.0;
                        break;
                }
            }
        }
        jsonJstreeObj.push(jjtOBJ);
    });
    return [jsonJstreeObj, jsonObj];
}

copyToClipboard(textToCopy) {
    // navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
        // navigator clipboard api method'
        return navigator.clipboard.writeText(textToCopy);
    } else {
        // text area method
        let textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        // make the textarea out of viewport
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise((res, rej) => {
            // here the magic happens
            document.execCommand('copy') ? res() : rej();
            textArea.remove();
        });
    }
}

renameVariable(tree, node){
    tree.edit(node, null, function (node_val, status) {
        var res = mySyncloop.validateVariableName(node_val.text, node);
        if (res != 0 || !status){
            if (!status){
                res = "Item with this name is already created. Please try some different name";
                node.text = " ";
            }
            swal({
                title: "Error",
                text: res,
                type: "error",
                confirmButtonColor: "#f2533e" // Optional: red shade for error
                });

            mySyncloop.renameVariable(tree, node);
        }
        if (tree.element[0].id == "output_schema_editor_jsTree"){
            JsTree_id = loadFile + "_outputJsTree";
            var data = outputJstreeRef.get_json('#', {
                flat: false
            });
            localStorage.setItem(JsTree_id, JSON.stringify(data));
        }
        else if(tree.element[0].id == "input_schema_editor_jsTree"){
            JsTree_id = loadFile + "_inputJsTree";
            var data = inputJstreeRef.get_json('#', {
                flat: false
            });
            localStorage.setItem(JsTree_id, JSON.stringify(data));
        }

    });
}

IOSchemaMenu(node, id) {

    var tree = $(id).jstree(true);
    var items = {
        renameItem: {
            label: "Rename",
            action: function (e) {
                mySyncloop.renameVariable(tree, node);
            }
        },
        deleteItem: {
            label: "Delete",
            action: function (e) {
                if (!(typeof mapperObj === 'undefined')) {
                    let element = mapperObj.getValue(landing_arrow_jsTree_ref);
                    if (null != element && null != element.value && id != "#input_schema_editor_jsTree" && id != "#output_schema_editor_jsTree") {
                       swal({
                                title: "Please first unset this element.",
                                type: "error",
                                confirmButtonColor: "#f2533e" // Optional: red color for errors
                            });

                        return;
                    }
                }
                tree.delete_node(node);
                if (!(typeof mapperObj === 'undefined')) {
                    mapperObj.reMap();
                }
            },
            "separator_after": true
        },
        copyItem: {
            label: "Copy",
            action: function (e) {
                $(node).addClass("copy");
                tree.copy(node)
            }
        },
        cutItem: {
            label: "Cut",
            action: function (e) {
                $(node).addClass("cut");
                tree.cut(node);
            }
        },
        pasteItem: {
            label: "Paste",
            action: function (e) {
                $(node).addClass("paste");
                tree.paste(node);
            }
        },
        copyXPath: {
            label: "copyXPath",
            action: function (e) {
                var nodePath = tree.get_path(node, '/');
                mySyncloop.copyToClipboard(nodePath);
            }
        },
        properties: {
            "seperator_before": false,
            "seperator_after": false,
            "label": "Properties",
            action: function (node) {
                mySyncloop.openForm(id, node);
                $("#user-nav-tabs").children().first().trigger('click');
            }
        }
    };

    if (node.type === 'document' || node.type === 'documentList') {
        items.createItem = {
            label: "New",
            action: false,
            "submenu": {
                "Document": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Document",
                    action: function (node) {
                        var sel=mySyncloop.createSchema("document", tree);
                        mySyncloop.renameVariable(tree, sel);
                    }
                },
                "String": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "String",
                    action: function (node) {
                        var sel=mySyncloop.createSchema("string", tree);
                        //var sel=nod.get_selected();
                        mySyncloop.renameVariable(tree, sel);
                    }
                },
                "Integer": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Integer",
                    action: function (node) {
                        var sel=mySyncloop.createSchema("integer", tree);
                        mySyncloop.renameVariable(tree, sel);
                    }
                },
                "Number": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Number",
                    action: function (node) {
                        var sel=mySyncloop.createSchema("number", tree);
                        mySyncloop.renameVariable(tree, sel);
                    }
                },
                "Date": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Date",
                    action: function (node) {
                       var sel= mySyncloop.createSchema("date", tree);
                       mySyncloop.renameVariable(tree, sel);
                    }
                },
                "Boolean": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Boolean",
                    action: function (node) {
                        var sel=mySyncloop.createSchema("boolean", tree);
                        mySyncloop.renameVariable(tree, sel);
                    }
                },
                "Byte": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Byte",
                    action: function (node) {
                        var sel= mySyncloop.createSchema("byte", tree);
                        mySyncloop.renameVariable(tree, sel);
                    }
                },
                "Object": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Object",
                    action: function (node) {
                        var sel=mySyncloop.createSchema("javaObject", tree);
                        mySyncloop.renameVariable(tree, sel);
                    }
                }
            }
            //function (node) { return { createItem: this.create(node) }; }
        };
    }
    return items;
}

createSchemaJstree(id) {
    var to = false;
    $('search_q').keyup(function () {
        if (to) {
            clearTimeout(to);
        }
        to = setTimeout(function () {
            var v = $('search_q').val();
            $(id).jstree(true).search(v, false, true);
        }, 250);
    });

    var ref = $(id)
        .jstree({
            "core": {
                "animation": 0,
				"check_callback" : function (operation, node, node_parent, node_position, more) {
					// Only run custom logic for paste operations
					if (hasCopiedNode && (operation === "copy_node" || operation === "move_node")) {
						// Iterate over the children of the target node
						hasCopiedNode=false;
						for (let i = 0; i < node_parent.children.length; i++) {
							let child = this.get_node(node_parent.children[i]);
							// Check if any child has the same name as the node being pasted
							if (child.text === node.text) {
								// Node with the same name exists, so prevent the paste operation
								//alert('A node with the same name already exists!');
								swal({
									title: "Duplicate Element Found!",
									text: "Same name element already exists.",
									type: "warning",
									showCancelButton: false,
									confirmButtonColor: "#f2533e",
									confirmButtonText: "Ok",
									showLoaderOnConfirm : true,
									closeOnConfirm: true,
									closeOnCancel: true
								});

								return false; // Returning false prevents the operation
							}
						}
					}
					// Default behavior for other operations
					return true;
				},
                'force_text': true,
                "themes": {
                    "stripes": true,
                    "responsive": false,
                    "dots": true
                },

                'data': []
            },
            "types": {
                "default": {
                    "icon": getSystemResourcePath() + "/icons/doc.svg",
                    "valid_children": [
                        "default", "document", "string", "documentList", "stringList", "javaObjectList", "javaObject", "integer", "integerList", "number", "numberList", "date", "dateList", "boolean", "booleanList", "byte", "byteList"
                    ]
                },
                "document": {
                    "icon": getSystemResourcePath() + "/icons/doc.svg",
                    "valid_children": [
                        "default", "document", "string", "documentList", "stringList", "javaObjectList", "javaObject", "integer", "integerList", "number", "numberList", "date", "dateList", "boolean", "booleanList", "byte", "byteList"
                    ]
                },
                "documentList": {
                    "icon": getSystemResourcePath() + "/icons/docList.svg",
                    "valid_children": [
                        "default", "document", "string", "documentList", "stringList", "javaObjectList", "javaObject", "integer", "integerList", "number", "numberList", "date", "dateList", "boolean", "booleanList", "byte", "byteList"
                    ]
                },
                "string": {
                    "icon": getSystemResourcePath() + "/icons/text.svg",
                    "valid_children": []
                },
                "stringList": {
                    "icon": getSystemResourcePath() + "/icons/textArr.svg",
                    "valid_children": []
                },
                "javaObject": {
                    "icon": getSystemResourcePath() + "/icons/javaObject.svg",
                    "valid_children": []
                },
                "javaObjectList": {
                    "icon": getSystemResourcePath() + "/icons/javaObjectArr.svg",
                    "valid_children": []
                },
                "integer": {
                    "icon": getSystemResourcePath() + "/icons/integer.svg",
                    "valid_children": []
                },
                "integerList": {
                    "icon": getSystemResourcePath() + "/icons/integerArr.svg",
                    "valid_children": []
                },
                "number": {
                    "icon": getSystemResourcePath() + "/icons/number.svg",
                    "valid_children": []
                },
                "numberList": {
                    "icon": getSystemResourcePath() + "/icons/numberArr.svg",
                    "valid_children": []
                },
                "date": {
                    "icon": getSystemResourcePath() + "/icons/date.svg",
                    "valid_children": []
                },
                "dateList": {
                    "icon": getSystemResourcePath() + "/icons/dateArr.svg",
                    "valid_children": []
                },
                "boolean": {
                    "icon": getSystemResourcePath() + "/icons/boolean.svg",
                    "valid_children": []
                },
                "booleanList": {
                    "icon": getSystemResourcePath() + "/icons/booleanArr.svg",
                    "valid_children": []
                },
                "byte": {
                    "icon": getSystemResourcePath() + "/icons/byte.svg",
                    "valid_children": []
                },
                "byteList": {
                    "icon": getSystemResourcePath() + "/icons/byteArr.svg",
                    "valid_children": []
                }
            },
            "contextmenu": {
                "items": function (node) {
                    return mySyncloop.IOSchemaMenu(node, id);
                }
            },
			"dnd":{
				'copy_modifier': 'alt' // Change from default 'ctrl' to 'alt'
			},
            "plugins": ["unique",
                "contextmenu", "dnd",
                "search", "state", "types", "wholerow"
            ]
        }).on('open_node.jstree',
            function (e, data) {
                //console.log(data.node.id);
            }).on('close_node.jstree',
            function (e, data) {

            }).on('click',
            function (data) {
                // console.log(id+'
                // <-----singleclick');
                hideMenu();
                currentSelectedSchemaJStreeID = id;

            }).on("dblclick", function (data) {
            // console.log(id+'<-----dbl click');
            mySyncloop.openForm(id, data);
            $("#user-nav-tabs").children().first().trigger('click');
        });
    //   $(id).edit(e);
    return $(id).jstree(true);
}

// $('#input_schema_editor_jsTree_container').on('click', function(){
//     alert('okk1');
// })

removeMenuCompletely(){
    input_menu = window.frames['middlewareCodeEditor'].contentDocument.getElementById("input_schema_editor_jsTree_contextMenu");
    output_menu = window.frames['middlewareCodeEditor'].contentDocument.getElementById("output_schema_editor_jsTree_contextMenu");
    flow_menu = window.frames['middlewareCodeEditor'].contentDocument.getElementById("flowDesignerJsTree_contextMenu");

    if (null == input_menu) {
        return ;
    }
    else{
        input_menu.classList.remove('show-menu');
        input_menu.style.display="none";
    }

    if (null == output_menu) {
        return ;
    }
    else{
        output_menu.classList.remove('show-menu');
        output_menu.style.display="none";
    }

    if (null == flow_menu) {
        return ;
    }
    else{
        flow_menu.classList.remove('show-menu');
        flow_menu.style.display="none";
    }
}

flowDesignerMenu(node, id) {
    var fromApi = false;
    if(id == '#flowDesignerJsTreeAPI'){
        fromApi = true;
        id = '#flowDesignerJsTree';
    }
    var tree = $(id).jstree(true);
    //alert(tree);
    var items = {};
    if (node.type === 'invoke') {
        if (mySyncloop.isInIframe()) {
            items.select = {
                label: "Select a service",
                action: function (node) {
                    openSelectServiceModalDialog(id, node);
                }
            };
        }

        if (node.text != "INVOKE") {
            items.goto = {
                label: "Go to service",
                action: function (thiNode) {
                    let fqn = node.data.fqn;
                    if (null == fqn) {
                        fqn = node.text;
                    }
                    if (!mySyncloop.isInIframe()) {
                        location.href = mySyncloop.getFileLocation("files/" + fqn + "." + node.data.serviceType);
                        return ;
                    }
                    parent.loadRPage("files/" + fqn + "." + node.data.serviceType);
                }
            };
        } else if (null != node.data.fqn) {
            items.goto = {
                label: "Go to service",
                action: function (thiNode) {
                    let fqn = node.data.fqn;
                    if (null == fqn) {
                        fqn = node.text;
                    }
                    if (!mySyncloop.isInIframe()) {
                        location.href = mySyncloop.getFileLocation("files/" + fqn + "." + node.data.serviceType);
                        return ;
                    }
                    parent.loadRPage("files/" + fqn + "." + node.data.serviceType);
                }
            };
        }
    }

    if (null == node.data.status || node.data.status == "enabled") {
        items.disableItem = {
            label: "Disable",
            action: function (e) {
                setFlowElemAttribOnSelected('status', 'disabled');
            },
            "separator_after": true
        };
    } else {
        items.enableItem = {
            label: "Enable",
            action: function (e) {
                setFlowElemAttribOnSelected('status', 'enabled');
            },
            "separator_after": true
        };
    }

    items.deleteItem = {
        label: "Delete",
        action: function (e) {
            //var nd=tree.get_node(node.id);
            tree.delete_node(node);
            refreshFlowNodeData();
        },
        "separator_after": true
    };
    items.copyItem = {
        label: "Copy",
        action: function (e) {
            $(node).addClass("copy");
            tree.copy(node)
        }
    };
    items.cutItem = {
        label: "Cut",
        action: function (e) {
            $(node).addClass("cut");
            tree.cut(node);
        }
    };
    items.pasteItem = {
        label: "Paste",
        action: function (e) {
            $(node).addClass("paste");
            tree.paste(node);
        }
    };


    if (node.type === 'switch') {
        items.createItem = {
            label: "Add",
            action: false,
            "submenu": {
                "Sequence": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "CASE",
                    action: function (node) {
                        if (fromApi) {
                            mySyncloop.createSchema("group", tree);
                        } else {
                            mySyncloop.createSchema("sequence", tree);
                        }
                    }
                }
            }
        };
    } else if (node.type === 'ifelse') {
        items.createItem = {
            label: "Add",
            action: false,
            "submenu": {
                "Sequence": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "CONDITION",
                    action: function (node) {
                        mySyncloop.createSchema("sequence", tree);
                    }
                }
            }
        };
    } else if (!(node.type === 'map' || node.type === 'transformer' || node.type === 'invoke' || node.type === 'try-catch')) {
        if(node.type == 'group' || node.type == 'redo' || node.type == 'foreach' ){

            function getSubMenu() {
                let submenuItems = null;
                if (SERVICE_TYPE == 'API') {
                    submenuItems = {
                        "Transformer": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Transformer",
                            action: function (node) {
                                mySyncloop.createSchema("transformer", tree);
                            }
                        },
                        "Group": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Group",
                            action: function (node) {
                                mySyncloop.createSchema("group", tree);
                            }
                        },
                        "IFELSE": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "If-Else",
                            action: function (node) {
                                mySyncloop.createSchema("ifelse", tree);
                            }
                        },
                        "Switch": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Switch",
                            action: function (node) {
                                mySyncloop.createSchema("switch", tree);
                            }
                        },
                        "ForEach": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "ForEach",
                            action: function (node) {
                                mySyncloop.createSchema("foreach", tree);
                            }
                        },
                        "TCF-Block": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "TCF-Block",
                            action: function (node) {
                                mySyncloop.createSchema("try-catch", tree);
                            }
                        },
                        "Redo": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Redo",
                            action: function (node) {
                                mySyncloop.createSchema("redo", tree);
                            }
                        },
                        "Await": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Await",
                            action: function (node) {
                                mySyncloop.createSchema("await", tree);
                            }
                        },
                    };
                } else {
                    submenuItems = {
                        "Map": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Map",
                            action: function (node) {
                                mySyncloop.createSchema("map", tree);
                            }
                        },
                        "Sequence": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Sequence",
                            action: function (node) {
                                mySyncloop.createSchema("sequence", tree);
                            }
                        },
                        "IFELSE": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "If-Else",
                            action: function (node) {
                                mySyncloop.createSchema("ifelse", tree);
                            }
                        },
                        "Switch": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Switch",
                            action: function (node) {
                                mySyncloop.createSchema("switch", tree);
                            }
                        },
                        "Loop": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Loop",
                            action: function (node) {
                                mySyncloop.createSchema("loop", tree);
                            }
                        },
                        "TCF-Block": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "TCF-Block",
                            action: function (node) {
                                mySyncloop.createSchema("try-catch", tree);
                            }
                        },
                        "Repeat": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Redo",
                            action: function (node) {
                                mySyncloop.createSchema("repeat", tree);
                            }
                        },
                        "Await": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Await",
                            action: function (node) {
                                mySyncloop.createSchema("await", tree);
                            }
                        },
                    };
                }

                if (mySyncloop.isInIframe()) {
                    submenuItems.Invoke = {
                        "seperator_before": false,
                        "seperator_after": false,
                        "label": "Service",
                        action: function (node) {
                            mySyncloop.createSchema("invoke", tree);
                        }
                    }
                }

                return submenuItems;
            }

            items.createItem = {
                label: "Add",
                action: false,
                "submenu": getSubMenu()
                //function (node) { return { createItem: this.create(node) }; }
            };
        }
        else{

            function getSubMenu() {
                let submenuItems = null;
                if (SERVICE_TYPE == 'API') {
                    submenuItems = {

                        "Group": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Group",
                            action: function (node) {
                                mySyncloop.createSchema("group", tree);
                            }
                        },
                        "Await": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Await",
                            action: function (node) {
                                mySyncloop.createSchema("await", tree);
                            }
                        },
                        "IFELSE": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "If-Else",
                            action: function (node) {
                                mySyncloop.createSchema("ifelse", tree);
                            }
                        },
                        "Switch": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Switch",
                            action: function (node) {
                                mySyncloop.createSchema("switch", tree);
                            }
                        },
                        "TCF-Block": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "TCF-Block",
                            action: function (node) {
                                mySyncloop.createSchema("try-catch", tree);
                            }
                        },
                        "ForEach": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "ForEach",
                            action: function (node) {
                                mySyncloop.createSchema("foreach", tree);
                            }
                        },
                        "Redo": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Redo",
                            action: function (node) {
                                mySyncloop.createSchema("redo", tree);
                            }
                        },
                        "Transformer": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Transformer",
                            action: function (node) {
                                mySyncloop.createSchema("transformer", tree);
                            }
                        }
                    };
                } else {
                    submenuItems = {

                        "Sequence": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Sequence",
                            action: function (node) {
                                mySyncloop.createSchema("sequence", tree);
                            }
                        },
                        "Await": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Await",
                            action: function (node) {
                                mySyncloop.createSchema("await", tree);
                            }
                        },
                        "IFELSE": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "If-Else",
                            action: function (node) {
                                mySyncloop.createSchema("ifelse", tree);
                            }
                        },
                        "Switch": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Switch",
                            action: function (node) {
                                mySyncloop.createSchema("switch", tree);
                            }
                        },
                        "TCF-Block": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "TCF-Block",
                            action: function (node) {
                                mySyncloop.createSchema("try-catch", tree);
                            }
                        },
                        "Loop": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Loop",
                            action: function (node) {
                                mySyncloop.createSchema("loop", tree);
                            }
                        },
                        "Repeat": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Repeat",
                            action: function (node) {
                                mySyncloop.createSchema("repeat", tree);
                            }
                        },
                        "Map": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Map",
                            action: function (node) {
                                mySyncloop.createSchema("map", tree);
                            }
                        }
                    };
                }

                if (mySyncloop.isInIframe()) {
                    submenuItems.Invoke = {
                        "seperator_before": false,
                        "seperator_after": false,
                        "label": "Service",
                        action: function (node) {
                            mySyncloop.createSchema("invoke", tree);
                        }
                    }
                }

                return submenuItems;
            }

            items.createItem = {
                label: "Add",
                action: false,
                "submenu": getSubMenu()
                //function (node) { return { createItem: this.create(node) }; }
            };
        }
    }

    items.properties = {
        "seperator_before": false,
        "seperator_after": false,
        "label": "Properties",
        action: function (node) {
            console.log(node);
            openFlowElementProperties(id, node);
        }
    };
    return items;
}

static FLOW_JS_TREE_CONFIG = {
    "core": {
        "animation": 0,
        "check_callback": function(operation, node, parent, position)
        {
            switch (operation) {
                case "move_node":
                    if (node.id.includes("j1_")){
                        return true;
                    }
                    else{
                        return false;
                    }
                    break;
                case "copy_node":
                    if (node.id.includes("j1_")){
                        return true;
                    }
                    else{
                        return false;
                    }
            }
            return true;
        },
        'force_text': true,
        "themes": {
            "stripes": true,
            "responsive": false,
            "dots": true
        },

        'data': []
    },
    "types": {
        "default": {
            "icon": getSystemResourcePath() + "/icons/sequence.svg",
            "valid_children": [
                "default", "ifelse", "sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
            ]
        },
        "sequence": {
            "icon": getSystemResourcePath() + "/icons/sequence.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
            ]
        },
        "group": {
            "icon": getSystemResourcePath() + "/icons/sequence.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
            ]
        },
        "switch": {
            "icon": getSystemResourcePath() + "/icons/switch.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
            ]
        },
        "loop": {
            "icon": getSystemResourcePath() + "/icons/loop.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
            ]
        },
        "ifelse": {
            "icon": getSystemResourcePath() + "/icons/filesystem/ifelse.svg",
            "valid_children": ["sequence"]
        },
        "foreach": {
            "icon": getSystemResourcePath() + "/icons/loop.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
            ]
        },
        "repeat": {
            "icon": getSystemResourcePath() + "/icons/repeat.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
            ]
        },
        "redo": {
            "icon": getSystemResourcePath() + "/icons/repeat.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
            ]
        },
        "try-catch": {
            "icon": getSystemResourcePath() + "/icons/try-catch.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
            ]
        },
        "map": {
            "icon": getSystemResourcePath() + "/icons/map.svg",
            "valid_children": []
        },
        "transformer": {
            "icon": getSystemResourcePath() + "/icons/map.svg",
            "valid_children": []
        },
        "invoke": {
            "icon": getSystemResourcePath() + "/icons/invoke.svg",
            "valid_children": []
        }
    },
    "plugins": [
        "contextmenu", "dnd",
        "search", "state", "types", "wholerow", "html_data"
    ],
    "contextmenu": {
        "items": (node) {
            if(fromApi){
                id = '#flowDesignerJsTreeAPI';
            }
            console.log(id);
            return mySyncloop.flowDesignerMenu(node, id);
        }
    }
};

function createFlowJstree(id) {
    var to = false;
    var fromApi = false;
    if (id == '#flowDesignerJsTreeAPI'){
        fromApi = true;
        id = '#flowDesignerJsTree';
    }
    $('search_q').keyup(function () {
        if (to) {
            clearTimeout(to);
        }
        to = setTimeout(function () {
            var v = $('search_q').val();
            $(id).jstree(true).search(v, false, true);
        }, 250);
    });

    var ref = $(id)
        .jstree({
            "core": {
                "animation": 0,
                "check_callback": function(operation, node, parent, position)
                {
                    switch (operation) {
                        case "move_node":
                            if (node.id.includes("j1_")){
                                return true;
                            }
                            else{
                                return false;
                            }
                            break;
                        case "copy_node":
                            if (node.id.includes("j1_")){
                                return true;
                            }
                            else{
                                return false;
                            }
                    }
                    return true;
                },
                'force_text': true,
                "themes": {
                    "stripes": true,
                    "responsive": false,
                    "dots": true
                },

                'data': []
            },
            "types": {
                "default": {
                    "icon": getSystemResourcePath() + "/icons/sequence.svg",
                    "valid_children": [
                        "default", "ifelse", "await", "sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
                    ]
                },
                "sequence": {
                    "icon": getSystemResourcePath() + "/icons/sequence.svg",
                    "valid_children": [
                        "default", "ifelse","await","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
                    ]
                },
                "group": {
                    "icon": getSystemResourcePath() + "/icons/sequence.svg",
                    "valid_children": [
                        "default", "ifelse","await","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
                    ]
                },
                "await": {
                    "icon": getSystemResourcePath() + "/icons/sequence.svg",
                    "valid_children": [
                        "default", "ifelse","await","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
                    ]
                },
                "switch": {
                    "icon": getSystemResourcePath() + "/icons/switch.svg",
                    "valid_children": [
                        "default", "ifelse","await","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
                    ]
                },
                "loop": {
                    "icon": getSystemResourcePath() + "/icons/loop.svg",
                    "valid_children": [
                        "default", "ifelse","await","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
                    ]
                },
                "ifelse": {
                    "icon": getSystemResourcePath() + "/icons/filesystem/ifelse.svg",
                    "valid_children": ["sequence"]
                },
                "foreach": {
                    "icon": getSystemResourcePath() + "/icons/loop.svg",
                    "valid_children": [
                        "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
                    ]
                },
                "repeat": {
                    "icon": getSystemResourcePath() + "/icons/repeat.svg",
                    "valid_children": [
                        "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
                    ]
                },
                "redo": {
                    "icon": getSystemResourcePath() + "/icons/repeat.svg",
                    "valid_children": [
                        "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
                    ]
                },
                "try-catch": {
                    "icon": getSystemResourcePath() + "/icons/try-catch.svg",
                    "valid_children": [
                        "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke"
                    ]
                },
                "map": {
                    "icon": getSystemResourcePath() + "/icons/map.svg",
                    "valid_children": []
                },
                "transformer": {
                    "icon": getSystemResourcePath() + "/icons/map.svg",
                    "valid_children": []
                },
                "invoke": {
                    "icon": getSystemResourcePath() + "/icons/invoke.svg",
                    "valid_children": []
                }
            },
            "plugins": [
                "contextmenu", "dnd",
                "search", "state", "types", "wholerow", "html_data"
            ],
            "contextmenu": {
                "items": function (node) {
                    if(fromApi){
                        id = '#flowDesignerJsTreeAPI';
                    }
                    console.log(id);
                    return mySyncloop.flowDesignerMenu(node, id);
                }
            }
        }).on('open_node.jstree',
            function (e, data) { //console.log(data.node.id);
            }).on('close_node.jstree',
            function (e, data) {}).on('click',
            function (e, data) {
                //console.log($(id).jstree(true));
                //selectMapping(id,e.target);
                //alert(id);
                currentSelectedFlowDesignerJStreeID = id;
            });
    return $(id).jstree(true);
}

deleteArtifact(filePath) {
    swal({
        title: 'Finding References...!',
        text: '',
        showCancelButton: false,
        allowOutsideClick: false,
        showConfirmButton: false
    })
    mySyncloop.asyncRestRequest("/packages.middleware.pub.service.findReferences.main?serviceFqn=" + (filePath).split(".")[0], null,  "GET",
        function(result) {
            swal.close();
            var list = result.list;
            if (list == null) {
                list = "";
            } else {
                $("#deleting_artifact_reference").html("'(" + filePath + ")'");
                openServicePopup({
                    children: list,
                    type: "root",
                    text: "packages"
                });
                $("#deleting_artifact_btn").attr("onClick", "mySyncloop.deleteArtifactConfirmed(\"" + filePath + "\")");
            }
        });


}
var lastToBeOpened = "";
deleteArtifactConfirmed(filePath) {
    filePath = "files/" + filePath;
    var response = mySyncloop.syncRestRequest("/" + filePath, "DELETE");
    if (response.status == 200) {
        localStorage.setItem(filePath, "");
        var error = JSON.parse(response.payload).error;
        if (error) {
           swal({
                    title: "Error",
                    text: error,
                    type: "error",
                    confirmButtonColor: "#f2533e" // Optional: red color for error confirmation
                });

        } else {
            $("#closeServiceModelDialog").trigger('click');
            swal({
                    title: "Deleted",
                    text: "",
                    type: "success",
                   confirmButtonColor: "#2C61F5"
                },
                    function(){
                        parent.loadPackages();
                        mySyncloop.deleteCacheForArtifact(filePath);
                        let newList = [];
                        let lastList = localStorage.getItem("workspace-recent").split(",");
                        for (let i = 0 ; i < lastList.length ; i++) {
                            if (lastList[i] != filePath) {
                                newList.push(lastList[i]);
                                lastToBeOpened = lastList[i];
                            }
                        }
                        if (newList.length == 0) {
                            localStorage.removeItem("workspace-recent");
                        } else {
                            localStorage.setItem("workspace-recent", newList.toString());
                        }
                        loadRecentlyOpened();
                        loadRPage(lastToBeOpened);
                });
        }
    } else {
        swal("Error", JSON.parse(response.payload).error, "error");
    }
}

deleteCacheForArtifact(filePath){
    var searchString = filePath.split(".")[0];
    for (let [key, value] of Object.entries(localStorage)) {
        var temp_key = `${key}`;
        if (temp_key.match(searchString) != null){
            localStorage.removeItem(temp_key);
        }
    }
    //localStorage.removeItem("workspace-recent");
}

createReferenceJsTree(element, value) {

    $(element).jstree({
            "core": {
                "animation": 0,
                "check_callback": false,
                'force_text': true,
                "themes": {
                    "stripes": true,
                    "responsive": true,
                    "dots": true
                },
                'data': [value]
            },
                "plugins": ["wholerow"]
            });
    return $(element).jstree(true);
}

packagesContextMenu(node, id) {
    if (!$("#" + node.id).hasClass("jstree-open")) {
        //$("#" + node.id).children().next().trigger('click');
    }

    var tree = $(id).jstree(true);
    var sel = tree.get_selected()[0];
    var dest = tree.get_path(sel, '/');
    var FQN = tree.get_path(sel, '.');
    var items = {};
    if (node.type != "properties" && false) {
        items.renameItem = {
            label: "Rename",
            action: function (e) {
                var sel = tree.get_selected();
                tree.edit(sel);
            }
        };

    }

    if (node.type == "root" || node.type == "package" || node.type == "folder") {
        items.new = {
            label: "New",
            action: false,
            submenu: {}
            //function (node) { return { createItem: this.create(node) }; }
        };
    }

    if (node.type == "root") {
        items.new.submenu.package = {
            label: "Package",
            action: function (e) {
                mySyncloop.createComponent('package', packageManagerJsTreeRef);
            },
            "separator_after": false
        };
    }

    if (node.type == "package" || node.type == "folder") {
        items.new.submenu.folder = {
            label: "New Folder",
            action: function (e) {
                mySyncloop.createComponent('folder', packageManagerJsTreeRef);
            },
            "separator_after": false
        };
    }

    if (node.type == "package" && false) {

        items.new.submenu.configurations = {
            label: "Configurations",
            action: false,
            submenu: {}
        };

        items.new.submenu.configurations.submenu.properties = {
            label: "Properties",
            action: function (e) {
                mySyncloop.createComponent('properties', packageManagerJsTreeRef);
            },
            "separator_after": false
        };
    }

    if (node.type == "folder") {
        items.new.submenu.services = {
            label: "Services",
            action: false,
            submenu: {}
        };

        items.new.submenu.connections = {
            label: "Connections",
            action: false,
            submenu: {}
        };

        items.new.submenu.services.submenu.flow = {
            label: "API",
            action: function (e) {
                mySyncloop.createComponent('api', packageManagerJsTreeRef);
            },
            "separator_after": false
        };

        items.new.submenu.services.submenu.service = {
            label: "Java",
            action: function (e) {
                mySyncloop.createComponent('service', packageManagerJsTreeRef);
            },
            "separator_after": false
        };

        items.new.submenu.connections.submenu.jdbc = {
            label: "JDBC",
            action: function (e) {
                mySyncloop.createComponent('jdbc', packageManagerJsTreeRef);
            },
            "separator_after": false
        };

        items.new.submenu.services.submenu.sql = {
            label: "SQL",
            action: function (e) {
                mySyncloop.createComponent('sql', packageManagerJsTreeRef);
            },
            "separator_after": false
        };


    }

    if (node.type == "root" || node.type == "package" || node.type == "folder") {
        items.refresh = {
            label: "Refresh",
            submenu: {},
            action: function (node) {
                loadPackages();
            }
        };
    }


    if (!(node.type == "root" || node.type == "package" || node.type == "folder")) {

        items.newtab = {
            label: "Open",
            submenu: {},
            action: function (n) {
                console.log(node.type);
                if (node.type == "api") {
                    window.open(getSystemResourcePath() + "/workspace/web/apiMaker/apiEditor.html?loadFile=files/" + dest + "." + node.type, "_blank");
                } else if (node.type == "flow") {
                    window.open(getSystemResourcePath() + "/workspace/web/flowMaker/flowEditor.html?loadFile=files/" + dest + "." + node.type, "_blank");
                } else if (node.type == "service") {
                    window.open(getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/clike/serviceEditor.html?loadFile=files/" + dest + "." + node.type, "_blank");
                } else if (node.type == "sql") {
                    window.open(getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/sql/sqlEditor.html?loadFile=files/" + dest + "." + node.type, "_blank");
                } else if (node.type == "jdbc") {
                    window.open(getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/properties/jdbcEditor.html?loadFile=files/" + dest + "." + node.type, "_blank");
                } else if (node.type == "jdbc" || node.type == "properties" || node.type == "graphql") {
                    window.open(getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/properties/propertiesEditor.html?loadFile=files/" + dest + "." + node.type, "_blank");
                }

            }
        };

        items.copyXPath = {
            label: "Copy Path",
            submenu: {},
            action: function (node) {
                mySyncloop.copyToClipboard(("##" + dest).replace("##packages", ""));
            }
        };

        items.fqn = {
            label: "Copy FQN",
            submenu: {},
            action: function (node) {
                mySyncloop.copyToClipboard(FQN);
            }
        };

        if(node.type=="api" || node.type=="flow"){
            items.test = {
                label: "Swagger UI",
                submenu: {},
                action: function (n) {
                    window.open(getSystemResourcePath() + "/oas/client.html?fqn=" + FQN);
                }
            };
            items.graphQL = {
                label: "GraphiQL",
                submenu: {},
                action: function (n) {
                    var aliasResp=mySyncloop.syncRestRequest("/alias?fqn="+FQN+".main", "GET");
                    if(aliasResp.status="200"){
                        var payload=JSON.parse(aliasResp.payload);
                        if(null != payload.alias && payload.alias.startsWith("POST")){
                            var endpoint=("#$"+payload.alias).replace("#$POST","");
                            window.open(getSystemResourcePath() + "/graphQL/client.html?endpoint="+endpoint);
                        }else{
                            swal("Please ensure that GraphQL is enabled for the service.", "", "error");
                        }
                    }else{
                        swal("Endpoint alias not configured. GraphQL must have endpoint alias configured with POST verb. You can enable GraphQL from service settings", "", "error");
                    }
                }
            };

        }
    }

    items.deleteItem = {
        label: "Delete",
        "_disabled": true,
        action: function (e) {
            mySyncloop.deleteArtifact(dest + "." + node.type);
        },
        "separator_after": true
    };

    if (node.type != "root") {
        items.deleteItem._disabled = false;
    }

    if (dest.startsWith("gui")) {
        if (node.type === 'gui-app') {
            items.export = {
                label: "Export",
                action: function (node) {
                    $(node).addClass("copy");
                    return {
                        copyItem: tree.copy(node)
                    };
                }
            }
            items.import = {
                "seperator_before": false,
                "seperator_after": false,
                "label": "Import",
                action: function (node) {
                    var url = '/upload/zip?dest=' + dest;
                    mySyncloop.uploadFile(url, "file", ".zip");
                }
            }
        } else
        if (node.type === 'folder') {
            items.export = {
                label: "Export",
                action: function (node) {
                    var url = '/upload/jar?dest=' + dest;
                    mySyncloop.uploadFile(url, "file", ".jar");
                }
            }
            items.import = {
                label: "Import",
                action: function (node) {
                    var url = '/upload/jar?dest=' + dest;
                    mySyncloop.uploadFile(url, "file", ".html,.js,.css,images/*");
                }
            }
        }
    } else if (node.type === 'package') {
        /*items.export= {
            label: "Export",
            action: function (node) { $(node).addClass("copy"); return { copyItem: tree.copy(node) }; }
        }*/
        items.import = {
            label: "Import",
            action: false,
            submenu: {}
            //function (node) { return { createItem: this.create(node) }; }
        };
        items.import.submenu.jar = {
            "seperator_before": false,
            "seperator_after": false,
            "label": "Jar File",
            action: function (node) {
                var url = '/upload/jar?dest=' + dest;
                mySyncloop.uploadFile(url, "file", ".jar");
            }
        };
        items.import.submenu.config = {
            "seperator_before": false,
            "seperator_after": false,
            "label": "Config File",
            action: function (node) {
                var url = '/upload/jar?dest=' + dest;
                mySyncloop.uploadFile(url, "file", ".jar");
            }
        };
        /*items.import.submenu.service={
            "seperator_before": false,
            "seperator_after": false,
            "label": "Service",
            action: function (node) {
                var url='/upload/service?dest='+dest;
                mySyncloop.uploadFile(url,"file",".service");
            }
        };*/
    } else if (node.type === 'root') {
        /*items.export= {
            label: "Export",
            action: function (node) {
                var cid=sel;
                console.log(sel);
                var elemId=document.getElementById(cid+"_checkbox");
                if(elemId==null)
                    //alert("Please select Tools>Build first");
                    swal("Warning", "Please select Tools>Build first", "warning");
                else{
                    //var includeAllDependencies=confirm("Do you want to export the build with all the dependencies?");
                    //exportBuild('includeDependencies','includeGlobalProperties','includeLocalProperties','includeEndpoint','buildNameInput')
                    var includeDependencies=$("#includeDependencies").prop("checked");//prompt("Please create your build name:", "myBuild");
                    if(includeDependencies)
                        includeDependencies=true;
                    else
                        includeDependencies=false;

                    var includeGlobalProperties=$("#includeGlobalProperties").prop("checked");
                    if(includeGlobalProperties)
                        includeGlobalProperties=true;
                    else
                        includeGlobalProperties=false;

                    var includeLocalProperties=$("#includeLocalProperties").prop("checked");
                    if(includeLocalProperties)
                        includeLocalProperties=true;
                    else
                        includeLocalProperties=false;

                    var includeEndpoint=$("#includeEndpoint").prop("checked");
                    if(includeEndpoint)
                        includeEndpoint=true;
                    else
                        includeEndpoint=false;

                    var buildName=$("#buildNameInput").val();
                    if(buildName!=null && buildName.trim().length>0){
                        var data =tree.get_json('#', {'flat': true});
                        var selected=[];
                        var counter=0;
                        for(var index in data) {
                            var map=data[index];
                            var elemNode=$("#"+map.id);
                            var elemChecked=elemNode.attr('checked');

                            //alert(JSON.stringify(map)+" : "+elemChecked);
                            if(elemChecked){
                                //alert(JSON.stringify(map));
                                var elemTreeNode=tree.get_node(map.id);
                                //alert(elemTreeNode);
                                var nodePath=tree.get_path(elemTreeNode, '/');
                                //alert(nodePath);
                                var artifact={"type":"","asset":""};
                                artifact.type=map.type;
                                artifact.asset=nodePath;
                                selected.push(artifact);
                                //selected[counter++].nodePath;
                            }
                        }
                        var content=JSON.stringify(selected);
                        // alert(content);
                        var qp="buildName="+buildName+"&includeDependencies="+includeDependencies+"&includeGlobalProperties="+includeGlobalProperties
                            +"&includeLocalProperties="+includeLocalProperties+"&includeEndpoints="+includeEndpoint;
                        var response=syncRestRequest("/build?"+qp, "POST", content,"application/json","application/json");
                        if(response.status==200){
                            var jObj=JSON.parse(response.payload);
                            if(jObj.msg=="Success"){
                                alert(jObj.msg);
                                var element = document.createElement('a');
                                element.setAttribute('href',JSON.parse(response.payload).url);
                                element.setAttribute('target', "_blank");
                                document.body.appendChild(element);
                                element.click();
                            }else
                                alert(jObj.msg);
                        }
                    }
                }
                //window.open('http://192.168.2.133:8182/middleware/pub/server/ui/workspace/web/export.html','popUpWindow','height=720,width=400,left=100,top=100,location=0,directories=0,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no, status=no');
            }
        }*/
        /*items.import={
            "label": "Import",
            action: function (node) {
                var url='/upload/packages?dest='+dest;
                mySyncloop.uploadFile(url,"file",".zip");
            }
        };*/

        /*items.build={
            "label": "Build",
            action: function (node) {
                mySyncloop.openBuildConfigurationForm();
            }
        };*/

    } else if (node.type === 'folder' && false) {
        items.export = {
            label: "Export",
            action: function (node) {
                var url = '/upload/jar?dest=' + dest;
                mySyncloop.uploadFile(url, "file", ".jar");
            }
        }
        items.import = {
            label: "Import",
            action: function (node) {
                var url = '/upload/jar?dest=' + dest;
                mySyncloop.uploadFile(url, "file", ".service,.map,.api,.flow");
            }
        }
    }

    return items;
}

uploadFile(url, key, commaSepFileExts) {
    //alert(src);
    if (key == null)
        key = "file";
    if (commaSepFileExts == null)
        commaSepFileExts = "all";
    var fileUploadElement = '<input type="file" id="middlewareFile" name="file" style="display:none" accept="' + commaSepFileExts + '"/>';
    var file = document.getElementById("middlewareFile");
    //alert(file);
    if (file == null) {
        $("body").append(fileUploadElement);
    }
    $("#middlewareFile").change(function () {
        var fd = new FormData();
        var files = $('#middlewareFile')[0].files[0];
        fd.append(key, files);

        $.ajax({
            url: url,
            type: 'post',
            data: fd,
            contentType: false,
            processData: false,
            success: function (response) {
                if (response != 0) {
                    swal({  title: "",
                            text: "Imported",
                            type: "success"},function(){
                        if (mySyncloop.isInIframe()) {
                            parent.loadPackages();
                        }
                    });
                    //swal("Imported", "", "success");
                } else {
                    swal("Error", "Please try again.", "error");
                }
                parent.loadPackages();
                $("#middlewareFile").remove();
            },
        });
    });
    document.getElementById("middlewareFile").click();
}

createPackageJstree(id) {
    var to = false;
    $(id + '_q').keyup(function () {
        if (to) {
            clearTimeout(to);
        }
        to = setTimeout(function () {
            var v = $(id + '_q').val();
            $(id).jstree(true).search(v, false, true);
        }, 250);
    });

    var ref = $(id)
        .jstree({
            "core": {
                "animation": 0,
                "check_callback": true,
                'force_text': true,
                "themes": {
                    "stripes": true,
                    "responsive": false,
                    "dots": true
                },

                'data': []
            },
            "types": {
                "#": {
                    "icon": getSystemResourcePath() + "/icons/filesystem/unknown.png",
                    "valid_children": [
                        "root", "ui-root"
                    ]
                },
                "default": {
                    "icon": getSystemResourcePath() + "/icons/filesystem/unknown.png",
                    "valid_children": [
                        "package", "gui-app"
                    ]
                },
                "root": {
                    "icon": getSystemResourcePath() + "/icons/myPackage.svg",
                    "valid_children": [
                        "package"
                    ]
                },
                "ui-root": {
                    "icon": getSystemResourcePath() + "/icons/ui.svg",
                    "valid_children": [
                        "gui-app"
                    ]
                },
                "package": {
                    "icon": getSystemResourcePath() + "/icons/myPackages.svg",
                    "valid_children": [
                        "folder"
                    ]
                },
                "gui-app": {
                    "icon": getSystemResourcePath() + "/icons/gui-app.png",
                    "valid_children": [
                        "folder"
                    ]
                },
                "folder": {
                    "icon": getSystemResourcePath() + "/icons/filesystem/folder.svg",
                    "valid_children": [
                        "folder", "service", "package", "api", "flow", "map", "transformer", "html", "js", "css", "jar", "jdbc", "sql", "properties", "csv", "txt"
                    ]
                },
                "service": {
                    "icon": getSystemResourcePath() + "/icons/filesystem/cog.svg",
                    "valid_children": []
                },
                "map": {
                    "icon": getSystemResourcePath() + "/icons/filesystem/arrow_switch.png",
                    "valid_children": []
                },
                "transformer": {
                    "icon": getSystemResourcePath() + "/icons/filesystem/arrow_switch.png",
                    "valid_children": []
                },
                "doc": {
                    "icon": getSystemResourcePath() + "/icons/doc.svg",
                    "valid_children": []
                },
                "properties": {
                    "icon": getSystemResourcePath() + "/icons/properties.svg",
                    "valid_children": []
                },
                "html": {
                    "icon": getSystemResourcePath() + "/icons/html.svg",
                    "valid_children": []
                },
                "js": {
                    "icon": getSystemResourcePath() + "/icons/js.svg",
                    "valid_children": []
                },
                "css": {
                    "icon": getSystemResourcePath() + "/icons/css.svg",
                    "valid_children": []
                },
                "api": {
                    "icon": getSystemResourcePath() + "/icons/flow.svg",
                    "valid_children": []
                },
                "flow": {
                    "icon": getSystemResourcePath() + "/icons/flow.svg",
                    "valid_children": []
                },
                "jar": {
                    "icon": getSystemResourcePath() + "/icons/jar.svg",
                    "valid_children": []
                },
                "jdbc": {
                    "icon": getSystemResourcePath() + "/icons/jdbc.svg",
                    "valid_children": []
                },
                "graphql": {
                    "icon": getSystemResourcePath() + "/icons/graphql_icon.svg",
                    "valid_children": []
                },
                "sql": {
                    "icon": getSystemResourcePath() + "/icons/sql.svg",
                    "valid_children": []
                },
                "csv": {
                    "icon": getSystemResourcePath() + "/icons/csv.svg",
                    "valid_children": []
                },
                "txt": {
                    "icon": getSystemResourcePath() + "/icons/txt.svg",
                    "valid_children": []
                }
            },
            "plugins": ["unique", "contextmenu",
                "search", "state", "types", "wholerow"
            ],
            "contextmenu": {
                "items": function (node) {
                    return mySyncloop.packagesContextMenu(node, id);
                }
            }
        });
    return $(id).jstree(true);
}

removePackageContextMenu(){
    var packageDiv= parent.document.getElementById("packageManagerJsTree");
    var context_ref = parent.document.getElementsByClassName("jstree-default-contextmenu");

    if ("none" == context_ref[0] || context_ref.length == 0 || packageDiv == null){
        return;
    }
    else{
        context_ref[0].style.display = "none";
    }
}


toggleJSTreeCheckBox(elemId, jsTreeID, checked) {
    var jstreeRef = $(jsTreeID).jstree(true);
    var id = elemId.replace("_checkbox", "");
    var node = $("#" + id);
    $("#" + elemId).remove();
    var nodeAnchor = $("#" + id + "_anchor");
    var jsTreeNode = jstreeRef.get_node(id);
    //  console.log(jsTreeNode);
    //  console.log(jsTreeNode.parent);
    var checkedBox = "<span id='" + id + "_checkbox' class='jstree-anchor'><input type='checkbox' class='select-build' data='" + id + "' checked onclick=mySyncloop.toggleJSTreeCheckBox('" + id + "_checkbox','" + jsTreeID + "') /></span>";
    var uncheckedBox = "<span id='" + id + "_checkbox' class='jstree-anchor'><input type='checkbox' class='select-build' data='" + id + "' onclick=mySyncloop.toggleJSTreeCheckBox('" + id + "_checkbox','" + jsTreeID + "') /></span>";
    var elemChecked = node.attr('checked');
    if (checked != null) {
        elemChecked = checked;
        //alert(elemChecked);
    }
    if (elemChecked) {
        for (var i = 0; i < jsTreeNode.children_d.length; i++) {
            mySyncloop.toggleJSTreeCheckBox(jsTreeNode.children_d[i] + "_checkbox", jsTreeID, true);
        }
        //for(var i=0;i<jsTreeNode.parents.length;i++)
        //  mySyncloop.toggleJSTreeCheckBox(jsTreeNode.parents+"_checkbox",jsTreeID,true);
        node.attr('checked', false);
        nodeAnchor.before(uncheckedBox);
    } else {
        for (var i = 0; i < jsTreeNode.children_d.length; i++) {
            mySyncloop.toggleJSTreeCheckBox(jsTreeNode.children_d[i] + "_checkbox", jsTreeID, false);
        }
        //for(var i=0;i<jsTreeNode.parents.length;i++)
        //  mySyncloop.toggleJSTreeCheckBox(jsTreeNode.parents+"_checkbox",jsTreeID);
        node.attr('checked', true);
        nodeAnchor.before(checkedBox);
    }

}

addCheckBoxOnJSTree(jsTreeID) {
    //$("#"+data.node.id).prop('title', data.node.text);
    //alert(e.target.id);
    $(jsTreeID).jstree("open_all");
    var jstreeRef = $(jsTreeID).jstree(true);
    var v = jstreeRef.get_json('#', {
        'flat': true
    });
    for (i = 0; i < v.length && i < v.length; i++) {
        var cid = v[i].id;
        var node = $("#" + cid);
        var nodeAnchor = $("#" + cid + "_anchor");
        var elemChecked = node.attr('checked');
        var elemId = document.getElementById(cid + "_checkbox");
        if (elemId == null)
            nodeAnchor.before("<span id='" + cid + "_checkbox' class='jstree-anchor'><input type='checkbox' class='select-build' data='" + cid + "' onclick=mySyncloop.toggleJSTreeCheckBox('" + cid + "_checkbox','" + jsTreeID + "') /></span>");
        else
            $("#" + cid + "_checkbox").remove();
    }
}

validateNewItemName(name) {
    var currentNode = $("#packageManagerJsTree").jstree("get_selected");
    var childrens = $("#packageManagerJsTree").jstree("get_children_dom", currentNode);
    for (var i = 0; i < childrens.length; i++) {
        if (childrens[i].innerText.trim() == name) {
            return false;
        }
    }
    return true;
}

createNewVariable(sel, ref, text, type, index) {
    var newText = ((index > 0) ? text + index : text);
    console.log(type);
    var node = ref.create_node(sel, {
        "text": newText,
        "type": type
    });
    if (node) {
        return node;
    } else {
        return mySyncloop.createNewVariable(sel, ref, text, type, ++index);
    }
}

var currentSelectedSchemaJStreeID = null;
let ENABLED_INPUT_SCHEMA = false;
createInputSchema(type, ref) {
    ENABLED_INPUT_SCHEMA = true;
    mySyncloop.createSchema(type, ref);
    inputJsTree_id = loadFile + "_inputJsTree";
    var sel = ref.get_selected();
    mySyncloop.renameVariable(ref, sel);
    var data = ref.get_json('#', {
        flat: true
    });
    localStorage.setItem(inputJsTree_id, JSON.stringify(data));
    mySyncloop.updateHeigtht(ref.element[0].id);
}

createOutputSchema(type, ref) {
    ENABLED_INPUT_SCHEMA = false;
    mySyncloop.createSchema(type, ref);
    // var ref_obj= $(ref);
    var sel = ref.get_selected();
    mySyncloop.renameVariable(ref, sel);
    outputJsTree_id = loadFile + "_outputJsTree";
    var data = outputJstreeRef.get_json('#', {
        flat: false
    });
    // console.log('ref_obj--'+JSON.stringify(ref));
    console.log('data---' + JSON.stringify(data));
    localStorage.setItem(outputJsTree_id, JSON.stringify(data));
    // var jtreeid="output_schema_editor_jsTree";
    //$('#jtreeid').jstree('select_node', 'j3_5');
    // $('.jstree').jstree(true).select_node('j3_5_anchor');
    // var tree = $(jtreeid).jstree(true);
    // console.log('tree--'+JSON.stringify(tree));
    // tree.edit(data);
    //data.on('cl')
    //output_schema_editor_jsTree
    mySyncloop.updateHeigtht(ref.element[0].id);

}
var hasCopiedNode = false;
pasteNode(source){
    if (source){
		hasCopiedNode=true;
        var output_tree = source;
        var length = output_tree.get_json('#').length;
        var val=output_tree.paste('#', length);
    }
}

createSchema(type, ref, selected, text) {

    //var ref = $(currentSelectedSchemaJStreeID).jstree(true),
	//alert(ref);
    var sel = ref.get_selected();
    var fromApiEditor = false;

    if (type == "try-catch-api"){
        fromApiEditor = true;
        type = "try-catch";
    }

    if (selected)
        sel[0] = selected;
    if (!text) {
        text = type[0].toUpperCase() + type.slice(1);
    }
    if (!sel.length)
        sel = "#";
    else
        /*{
            sel=ref.create_node("#", {
                "text" : text,
                "type" : type
            });
            ref.edit(sel);
            return;
        } else {*/
        sel = sel[0];
    var selNode = ref.get_node(sel);

    //console.log(selNode);
    var selNodeParent = ref.get_node(selNode.parent);
    //alert(selNode.text+", "+selNodeParent.text+", "+type);
    if (selNode.text == "config" && selNodeParent.text == "dependency" && type == "properties") {
        text = "package";
    } else
    if (type == "properties") {
        return;
    }
    if (type == "try-catch") {
        text = "TCF-Block";
    } else if ((type == "group" || type == "sequence") && selNode.type == "switch") { // && sel.parent.type=="switch"){
        //console.log();
        text = "CASE";
    } else if ((type == "group" || type == "sequence") && selNode.type == "ifelse") { // && sel.parent.type=="switch"){
        //console.log();
        text = "CONDITION";
    }

    collecta('Create', '', type, "Creating new " + text);

    // console.log(type);
    console.log(type);

    if (type == "package" || type == "folder" || type == "api" || type == "service" || type == "flow" || type == "jdbc" || type == "sql" ||
        type == "properties"
        /*||

                                       type == "document" || type == "integer" || type == "number" || type == "date" || type == "boolean" || type == "byte" ||
                                       type == "javaObject"*/

    ) {
        if (sel == "#" && (type == "package" || type == "folder" || type == "api" || type == "flow" || type == "service" || type == "jdbc" || type == "sql" ||
            type == "properties")) {
            if (type == "package") {
                swal('Select packages', "", 'error');
            } else if (type == "folder") {
                swal('Folder can be created only inside the package', "", 'error');
            } else if (type == "api" || type == "flow" || type == "service" || type == "jdbc" || type == "sql" ||
                type == "properties") {
                swal('This item can be create only inside a folder', "", 'error');
            }
            return;
        }

        text = prompt("Enter name of " + type); //mySyncloop.openNameItemPromptForm();
        if (!mySyncloop.validateNewItemName(text)) {
            alert("Item with this name is already created.");
            mySyncloop.createSchema(type, ref);
            return;
        } else if (text.trim() == "") {
            return;
        }
    }

    sel =
        /*ref.create_node(sel, {
                                  "text" : text,
                                  "type" : type
                              });*/
        mySyncloop.createNewVariable(sel, ref, text, type, 0);
    console.log('sel--++' + sel);
    console.log(text + 'Type is' + type);
    ref.get_node(sel).type = type;
    if (null != ref.get_node(sel).data) {
        ref.get_node(sel).data.guid = mySyncloop.uuidv4();
        if (ref.get_node(sel).type == "foreach" || ref.get_node(sel).type == "redo" || ref.get_node(sel).type == "repeat") {
            ref.get_node(sel).data.indexVar = "*index" + mySyncloop.predictMyLoopIdentifier(ref, sel, 0);
        }
    }
    if (sel) {
        if (type == "try-catch" && fromApiEditor) {
            mySyncloop.createSchema("group", ref, sel, "TRY");
            mySyncloop.createSchema("group", ref, sel, "CATCH");
            mySyncloop.createSchema("group", ref, sel, "FINALLY");
        }
        else if (type == "try-catch") {
            mySyncloop.createSchema("sequence", ref, sel, "TRY");
            mySyncloop.createSchema("sequence", ref, sel, "CATCH");
            mySyncloop.createSchema("sequence", ref, sel, "FINALLY");
        }  else if (type == "sequence" || type == "group") {} else if (!text) {
            ref.edit(sel);
        }
        if (type == "string" || type == "document" || type == "integer" || type == "number" || type == "date" || type == "boolean" || type == "byte" ||
            type == "javaObject") {
            console.log('click triger');
            $("#" + sel + "_anchor").trigger('click'); // this one
        } else {
            $("#" + sel + "_anchor").trigger('click');
        }

    } else {

    }
    console.log(type);
    //CHANGE 1: Opening ServiceDialog on create
    if (type == "invoke") {
        var new_sel = [];
        new_sel[0] = sel;
        openSelectServiceModalDialogOnCreateService(ref,new_sel);
    }
    // selNode
    // var id =$(currentSelectedSchemaJStreeID);
    // var tree = $(id).jstree(true);
    // tree.edit(selNode);
    return sel;
    //}
}

var keywords = ["abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "continue", "default", "do", "double", "else", "enum", "extends", "final", "finally", "float", "for", "if", "implements", "import", "instanceof", "int", "interface", "long", "native", "new", "null", "package", "private", "protected", "public", "return", "short", "static", "strictfp", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "try", "void", "volatile", "while"];

createComponent(type, ref, selected, text) {
    //alert(type);
    //console.log($(currentSelectedSchemaJStreeID));
    //var ref = $(currentSelectedSchemaJStreeID).jstree(true),

    var sel = ref.get_selected();

    if (selected)
        sel[0] = selected;
    if (!text)
        text = type.toUpperCase();
    if (!sel.length)
        sel = "#";
    else
        /*{
            sel=ref.create_node("#", {
                "text" : text,
                "type" : type
            });
            ref.edit(sel);
            return;
        } else {*/
        sel = sel[0];
    var selNode = ref.get_node(sel);
    var selNodeParent = ref.get_node(selNode.parent);
    //alert(selNode.text+", "+selNodeParent.text+", "+type);
    if (selNode.text == "config" && selNodeParent.text == "dependency" && type == "properties") {
        text = "package";
    } else
    if (type == "properties") {
        return;
    }
    if (type == "try-catch") {
        text = "TCF-Block";
    } else if (type == "sequence" && selNode.type == "switch") { // && sel.parent.type=="switch"){
        //console.log();
        text = "CASE";
    }

    if (sel == "#" && (type == "package" || type == "folder" || type == "api" || type == "flow" || type == "service" || type == "jdbc" || type == "sql" ||
        type == "properties")) {
        if (type == "package") {
            swal('Select packages', "", 'error');
        } else if (type == "folder") {
            swal('The folder can be created only in the package', "", 'error');
        } else if (type == "api" || type == "flow" || type == "service" || type == "jdbc" || type == "sql" ||
            type == "properties") {
            swal('This item can be created only in the folder', "", 'error');
        }
        return;
    }

    $("#consumer-groups").val(['']).trigger('change');
    $("#developer-groups").val(['']).trigger('change');
    $("#item-create-panel").html("Create New " + type);
    $("#item-create-heading").html(type + " name:");
    mySyncloop.openNameItemPromptForm(type);
    /*
    text = prompt("Enter name of " + type);
    */

    NEW_ITEM_REF = ref;
    NEW_ITEM_SEL = sel;
    NEW_ITEM_TYPE = type;
}

var NEW_ITEM_REF = null;
var NEW_ITEM_SEL = null;
var NEW_ITEM_TYPE = null;

createItemInSchema() {

    if (NEW_ITEM_TYPE == "package") {
        packageManagerJsTreeRef.open_node("#" + NEW_ITEM_SEL + "_anchor");
    }

    if (NEW_ITEM_TYPE == "api" || NEW_ITEM_TYPE == "service" || NEW_ITEM_TYPE == "sql") {
        if ($("#developer-groups").val().length == 0) {
            swal("Error", "Please select atleast one Developers group", "error");
            return;
        }
    }

    var text = $("#packages_item_name").val().trim();

    collecta('Create', '', NEW_ITEM_TYPE, "Creating new " + text);

    for (var i = 0; i < keywords.length; i++) {
        if (keywords[i] == text) {
            //   swal('Invalid ' + NEW_ITEM_TYPE + ' name. This is a reserved keyword.', "", 'error');
            return;
        }
    }

    if (text.charAt(0) >= 48 || text.charAt(0) <= 57) {
        //  swal('' + NEW_ITEM_TYPE + ' name shouldn\'t start from numeric.', "", 'error');
        return;
    }

    const regex = new RegExp('^[a-zA-Z]+[A-Za-z0-9\\_]*$');
    if (!regex.test(text)) {
        //  swal('Invalid ' + NEW_ITEM_TYPE + ' name. Name can contains only alphanumeric characters.', "", 'error');
        return;
    }

    if (!mySyncloop.validateNewItemName(text)) {
        //  swal('Item with this name is already created.', "", 'error');
        //mySyncloop.createComponent(type, ref);
        return;
    } else if (text.trim() == "") {
        return;
    }

    NEW_ITEM_SEL = NEW_ITEM_REF.create_node(NEW_ITEM_SEL, {
        "text": text,
        "type": NEW_ITEM_TYPE
    });
    if (NEW_ITEM_SEL) {
        if (NEW_ITEM_TYPE == "package") {

            var OLD_NEW_ITEM_SEL = NEW_ITEM_SEL;
            var PACKAGE = OLD_NEW_ITEM_SEL;
            $("#" + NEW_ITEM_SEL + "_anchor").trigger('click');
            var ref = $("#" + NEW_ITEM_SEL + "_anchor").jstree(true);
            NEW_ITEM_SEL = ref.create_node(ref.get_selected(), {
                "text": "dependency",
                "type": "folder"
            });
            packageManagerJsTreeRef.open_node("#" + OLD_NEW_ITEM_SEL + "_anchor");
            OLD_NEW_ITEM_SEL = NEW_ITEM_SEL;

            $("#" + NEW_ITEM_SEL + "_anchor").trigger('click');
            ref = $("#" + NEW_ITEM_SEL + "_anchor").jstree(true);
            NEW_ITEM_SEL = ref.create_node(ref.get_selected(), {
                "text": "config",
                "type": "folder"
            });
            packageManagerJsTreeRef.open_node("#" + OLD_NEW_ITEM_SEL + "_anchor");
            OLD_NEW_ITEM_SEL = NEW_ITEM_SEL;

            $("#" + NEW_ITEM_SEL + "_anchor").trigger('click');
            ref = $("#" + NEW_ITEM_SEL + "_anchor").jstree(true);
            NEW_ITEM_SEL = ref.create_node(ref.get_selected(), {
                "text": "package",
                "type": "properties"
            });
            $("#" + PACKAGE + "_anchor").trigger('click');
            packageManagerJsTreeRef.close_node("#" + PACKAGE + "_anchor");

            mySyncloop.syncRestRequest("/files/packages/" + text + "/dependency/config/package.properties", "POST");

        }

        if (NEW_ITEM_TYPE == "folder") {
            mySyncloop.syncRestRequest("/packages.middleware.pub.server.browse.saveEmptyFolder.main?packageName=" +
                NEW_ITEM_REF.get_path(NEW_ITEM_SEL, '/'), "GET");
        }

        if (NEW_ITEM_TYPE == "flow" || NEW_ITEM_TYPE == "api" || NEW_ITEM_TYPE == "service" || NEW_ITEM_TYPE == "sql" || NEW_ITEM_TYPE == "jdbc") {
            //$("#" + NEW_ITEM_SEL).trigger('click');
            let thisNode = packageManagerJsTreeRef.get_node(NEW_ITEM_SEL);
            let path = "files"
            let Servicepath = ""
            for (let i = thisNode.parents.length - 2; i >= 0; i--) {
                path += "/" + packageManagerJsTreeRef.get_node(thisNode.parents[i]).text
                Servicepath += "/" + packageManagerJsTreeRef.get_node(thisNode.parents[i]).text
            }
            path += "/" + thisNode.text + "." + thisNode.type + "&silentSave=true&developers=" + $("#developer-groups").val() +
                "&consumers=" + $("#consumer-groups").val();
            if (thisNode.type == "api") {
                let data = "{\"latest\":{\"createdTS\":\"\",\"input\":[],\"output\":[],\"api\":[],\"api_info\":{\"title\":\"\",\"description\":\"\"}},\"consumers\":\"\",\"developers\":\"developers\",\"enableServiceDocumentValidation\":false}";
                mySyncloop.asyncRestRequest("/api" + Servicepath + "/" + thisNode.text + "." + thisNode.type, data, "POST", function (result) {});
                $("#middlewareCodeEditor").attr('src', getSystemResourcePath() + "/workspace/web/apiMaker/apiEditor.html?loadFile=" + path);
                // window.open(getSystemResourcePath() + "/workspace/web/workspace.html?r=" + path, "_blank");
            } else if (thisNode.type == "service") {
                $("#middlewareCodeEditor").attr('src', getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/clike/serviceEditor.html?loadFile=" + path);
            } else if (thisNode.type == "sql") {
                let data = "{\"input\":[{\"id\":\"j1_2\",\"text\":\"inputDocList\",\"icon\":null,\"li_attr\":{\"id\":\"j1_2\"},\"a_attr\":{\"href\":\"#\",\"id\":\"j1_2_anchor\"},\"state\":{\"loaded\":true,\"opened\":true,\"selected\":false,\"disabled\":false},\"data\":{},\"children\":[],\"type\":\"documentList\"},{\"id\":\"j1_3\",\"text\":\"txConn\",\"icon\":null,\"li_attr\":{\"id\":\"j1_3\"},\"a_attr\":{\"href\":\"#\",\"id\":\"j1_3_anchor\"},\"state\":{\"loaded\":true,\"opened\":false,\"selected\":false,\"disabled\":false},\"data\":{},\"children\":[],\"type\":\"javaObject\"},{\"id\":\"j1_4\",\"text\":\"isTxn\",\"icon\":null,\"li_attr\":{\"id\":\"j1_4\"},\"a_attr\":{\"href\":\"#\",\"id\":\"j1_4_anchor\"},\"state\":{\"loaded\":true,\"opened\":false,\"selected\":false,\"disabled\":false},\"data\":{},\"children\":[],\"type\":\"boolean\"}],\"output\":[{\"id\":\"j2_1\",\"text\":\"outputDocList\",\"icon\":null,\"li_attr\":{\"id\":\"j2_1\"},\"a_attr\":{\"href\":\"#\",\"id\":\"j2_1_anchor\"},\"state\":{\"loaded\":true,\"opened\":false,\"selected\":false,\"disabled\":false},\"data\":{},\"children\":[],\"type\":\"documentList\"},{\"id\":\"j2_2\",\"text\":\"rows\",\"icon\":null,\"li_attr\":{\"id\":\"j2_2\"},\"a_attr\":{\"href\":\"#\",\"id\":\"j2_2_anchor\"},\"state\":{\"loaded\":true,\"opened\":false,\"selected\":false,\"disabled\":false},\"data\":{},\"children\":[],\"type\":\"integer\"},{\"id\":\"j2_3\",\"text\":\"success\",\"icon\":null,\"li_attr\":{\"id\":\"j2_3\"},\"a_attr\":{\"href\":\"#\",\"id\":\"j2_3_anchor\"},\"state\":{\"loaded\":true,\"opened\":false,\"selected\":false,\"disabled\":false},\"data\":{},\"children\":[],\"type\":\"boolean\"},{\"id\":\"j2_4\",\"text\":\"error\",\"icon\":null,\"li_attr\":{\"id\":\"j2_4\"},\"a_attr\":{\"href\":\"#\",\"id\":\"j2_4_anchor\"},\"state\":{\"loaded\":true,\"opened\":false,\"selected\":false,\"disabled\":false},\"data\":{},\"children\":[],\"type\":\"string\"}],\"sql\":\"\",\"version\":\"v1\",\"consumers\":\"\",\"developers\":\"developers\"}";
                mySyncloop.asyncRestRequest("/sql" + Servicepath + "/" + thisNode.text + "." + thisNode.type, data, "POST", function (result) {});
                $("#middlewareCodeEditor").attr('src', getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/sql/sqlEditor.html?loadFile=" + path);
            } else if (thisNode.type == "jdbc") {
                //let data = "";
                //asyncRestRequest("/files" + Servicepath + "/" + thisNode.text + "." + thisNode.type, data, "POST", function (result) {});
                $("#middlewareCodeEditor").attr('src', getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/properties/jdbcEditor.html?loadFile=" + path);
            }

            $("#developer-groups").select2({}).val([]).trigger('change');
            $("#consumer-groups").select2({}).val([]).trigger('change');
        }

        if (NEW_ITEM_TYPE == "package") {
            var mid_res = sortPackages(packageManagerJsTreeRef.get_json('#', {flat:false})[0]);
            packageManagerJsTreeRef.settings.core.data=mid_res;
            packageManagerJsTreeRef.settings.core.data=mid_res;
            packageManagerJsTreeRef.refresh();
            $("#" + NEW_ITEM_SEL + "_anchor").trigger('click');
        }
        $('#closeExportNameItemPromptModelDialog').trigger('click');
        NEW_ITEM_REF = null;
        NEW_ITEM_SEL = null;
        NEW_ITEM_TYPE = null;
    } else {
        swal('Error in creation, Please try again', "", 'error');
    }
    return NEW_ITEM_SEL;
}

createItemInSchemaValidate(e) {
    var sub_btn = document.getElementById('createItem');
    var item_filed = document.getElementById('packages_item_name');
    $('#info_message').text("");
    var text = e.value.trim();
    var message = "";
    for (var i = 0; i < keywords.length; i++) {
        if (keywords[i] == text) {
            var message = NEW_ITEM_TYPE + ' name. This is a reserved keyword.';
            $('#info_message').text(mySyncloop.capitalize(message));
            sub_btn.classList.add("btn_disabled");
            item_filed.classList.add("packages_item_name_eb");
            sub_btn.classList.remove("btn-gry");
            sub_btn.classList.remove("btn");
            sub_btn.addAttribute("disabled");
            return;
        }
    }

    if (text.length > 100) {
        var message = NEW_ITEM_TYPE + ' name\'s length must less than 100 characters.';
        $('#info_message').text(mySyncloop.capitalize(message));
        sub_btn.classList.add("btn_disabled");
        item_filed.classList.add("packages_item_name_eb");
        sub_btn.classList.remove("btn-gry");
        sub_btn.classList.remove("btn");
        sub_btn.addAttribute("disabled");
        return ;
    }

    if (text.charAt(0) >= 48 || text.charAt(0) <= 57) {
        var message = NEW_ITEM_TYPE + ' name shouldn\'t start from numeric or space.';
        $('#info_message').text(mySyncloop.capitalize(message));
        sub_btn.classList.add("btn_disabled");
        item_filed.classList.add("packages_item_name_eb");
        sub_btn.classList.remove("btn-gry");
        sub_btn.classList.remove("btn");
        sub_btn.addAttribute("disabled");
        return;
    }

    const regex = new RegExp('^[a-zA-Z]+[A-Za-z0-9\\_]*$');
    if (!regex.test(text)) {
        var message = NEW_ITEM_TYPE + ' name should contain only alphanumeric characters.';
        $('#info_message').text(mySyncloop.capitalize(message));
        sub_btn.classList.add("btn_disabled");
        item_filed.classList.add("packages_item_name_eb");
        sub_btn.classList.remove("btn-gry");
        sub_btn.classList.remove("btn");
        sub_btn.addAttribute("disabled");
        return;
    }

    if (!mySyncloop.validateNewItemName(text)) {
        var message = 'Item with this name is already created.';
        $('#info_message').text(mySyncloop.capitalize(message));
        sub_btn.classList.add("btn_disabled");
        item_filed.classList.add("packages_item_name_eb");
        sub_btn.classList.remove("btn-gry");
        sub_btn.classList.remove("btn");
        sub_btn.addAttribute("disabled");
        return;
    } else if (text.trim() == "") {
        $('#info_message').text("");
        return;
    }
    sub_btn.classList.remove("btn_disabled");
    item_filed.classList.remove("packages_item_name_eb");
    sub_btn.classList.add("btn");
    sub_btn.classList.add("btn-gry");
    sub_btn.removeAttribute("disabled");
}

importAPIInSchemaValidate(e) {
    var sub_btn = document.getElementById('button');
    var item_filed = document.getElementById('package_name');
    $('#info_message').text("");
    var text = e.value.trim();
    var message = "";
    var NEW_ITEM_TYPE = "Package";
    for (var i = 0; i < keywords.length; i++) {
        if (keywords[i] == text) {
            var message = NEW_ITEM_TYPE + ' name. This is a reserved keyword.';
            $('#info_message').text(mySyncloop.capitalize(message));
            sub_btn.classList.add("btn_disabled");
            item_filed.classList.add("packages_item_name_eb");
            sub_btn.classList.remove("btn-gry");
            sub_btn.classList.remove("btn");
            sub_btn.disabled = true;
            return;
        }
    }

    if (text.length > 100) {
        var message = NEW_ITEM_TYPE + ' name\'s length must less than 100 characters.';
        $('#info_message').text(mySyncloop.capitalize(message));
        sub_btn.classList.add("btn_disabled");
        item_filed.classList.add("packages_item_name_eb");
        sub_btn.classList.remove("btn-gry");
        sub_btn.classList.remove("btn");
        sub_btn.disabled = true;
        return ;
    }

    if (text.charAt(0) >= 48 || text.charAt(0) <= 57) {
        var message = NEW_ITEM_TYPE + ' name shouldn\'t start from numeric.';
        $('#info_message').text(mySyncloop.capitalize(message));
        sub_btn.classList.add("btn_disabled");
        item_filed.classList.add("packages_item_name_eb");
        sub_btn.classList.remove("btn-gry");
        sub_btn.classList.remove("btn");
        sub_btn.disabled = true;
        return;
    }

    const regex = new RegExp('^[a-zA-Z]+[A-Za-z0-9\\_]*$');
    if (!regex.test(text)) {
        var message = NEW_ITEM_TYPE + ' name should contain only alphanumeric characters.';
        $('#info_message').text(mySyncloop.capitalize(message));
        sub_btn.classList.add("btn_disabled");
        item_filed.classList.add("packages_item_name_eb");
        sub_btn.classList.remove("btn-gry");
        sub_btn.classList.remove("btn");
        sub_btn.disabled = true;
        return;
    }

    if (text.trim() == "") {
        $('#info_message').text("");
        return;
    }
    sub_btn.classList.remove("btn_disabled");
    item_filed.classList.remove("packages_item_name_eb");
    sub_btn.classList.add("btn");
    sub_btn.classList.add("btn-gry");
    sub_btn.disabled = false;
}

currentSelectedJSONObject = {};

validateVariableName(text, node) {
    if (text == "*payload") {
        var urlLoadFile = loadFile.trim() + "$";
        var packageName = ("/" + urlLoadFile).replace("/files/", "alias?fqn=").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main");
        //var packageName=("/"+loadFile).replace("/files/","alias?fqn=").replace(".service",".main").replace(".flow",".main");
        packageName = packageName.split("/").join(".");
        //alert(packageName);
        var urlPath = "/" + packageName;

        mySyncloop.asyncRestRequest(urlPath, null, "GET", function (result) {
            if (result.status == 404) {
                mySyncloop.asyncRestRequest(urlPath + "&alias=POST/" +
                    ("/" + urlLoadFile).replace("/files/", "").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main").split("/").join(".")
                    , null, "POST", function (result) {});
            } else if (result.alias.split('/')[0] == "GET") {
                mySyncloop.asyncRestRequest(urlPath + "&alias=POST/" + result.alias.split('/')[1], null, "POST", function (result) {});
            }
        });
    }
    var message = "";
    var NEW_ITEM_TYPE = "Variable";
    for (var i = 0; i < keywords.length; i++) {
        if (keywords[i] == text) {
            var message = NEW_ITEM_TYPE + ' name. This is a reserved keyword.';
            return message;
        }
    }

    if (text.length > 100) {
        var message = NEW_ITEM_TYPE + ' name\'s length must less than 100 characters.';
        return message;
    }

    if (text.charAt(0) >= 48 || text.charAt(0) <= 57) {
        var message = NEW_ITEM_TYPE + ' name shouldn\'t start from numeric.';
        return message;
    }

    const regex = new RegExp('[A-Za-z0-9_]+');
    if (!regex.test(text)) {
        var message = NEW_ITEM_TYPE + ' name. Name can contains only alphanumeric characters.';
        return message;
    }

    if (text.trim() == "") {
        return message;
    }

    return 0;
}

changeCurrentNodeType(value) {
    var node = currentSelectedJSONObject.node;

    if (value == true)
        currentSelectedJSONObject.ref.set_type(node, currentSelectedJSONObject.nodeType + 'List');
    else
        currentSelectedJSONObject.ref.set_type(node, currentSelectedJSONObject.nodeType);
    //currentSelectedNode.
}

openConfigurationPropertiesAsync() {
    //alert("iuiojj");
    var modal = document.getElementById("configurePropertiesModelDialog");
    var span = document.getElementById("closeConfigurePropertiesModelDialog");
    collecta('Open', '', 'API Configuration', 'Open API Configuration');
    span.onclick = function () {
        var alias = $("#serviceAliasValue").val();
        if (alias.trim().length > 1) {
            //alert("loadFile: "+loadFile);
            var urlLoadFile = loadFile.trim() + "$";
            var packageName = ("/" + urlLoadFile).replace("/files/", "alias?fqn=").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main");
            //var packageName=("/"+loadFile).replace("/files/","alias?fqn=").replace(".service",".main").replace(".flow",".main");

            packageName = packageName.split("/").join(".");
            //alert("packageName: "+packageName);
            var urlPath = "/" + packageName;
            //alert("urlPath: "+urlPath);
            urlPath = urlPath.replace("/files", "/alias");
            //alert("urlPath: "+urlPath);
            var method = $("#serviceHTTPMethodValue").val();
            //var alias=$("#serviceAliasValue").val();
            //alert("urlEncoded: "+urlPath+"&alias="+encodeURI(method+alias));
            if (alias.indexOf("/") != 0) {
                alias = "/" + alias;
            }
            if (!alias.includes(packageName)) {
                var response = mySyncloop.syncRestRequest(urlPath + "&alias=" + encodeURI(method + alias), "POST", "");
                if (response.status != 200) {
                    swal(response.payload.msg, "", "error");
                    return;
                } //else
                // alert(response.payload.msg);
            }
            collecta('Save', '', 'API Configuration', 'Saving API Configuration');
        }

        var properties = $("#servicePropertiesFile").val();
        var urlLoadFile = loadFile.trim() + "$";
        var propertyPath = urlLoadFile.replace(".service$", ".properties").replace(".api$", ".properties").replace(".sql$", ".properties").replace(".flow$", ".properties");
        //alert(propertyPath);
        //var propertyPath=loadFile.replace(".service",".properties").replace(".flow",".properties");//).replace("/files","alias?fqn=packages").replace(".service",".main");
        var propFileName = (propertyPath.split("/").join(".")).replace("files.", "");
        var propURLPath = ("/files/packages/" + propertyPath.split("/")[2] + "/dependency/config/" + propFileName);
        //alert(propURLPath);
        var responseProps = mySyncloop.syncRestRequest(propURLPath, "POST", properties, "application/text", "application/text");
        if (responseProps.status != 200) {
            alert(JSON.stringify(responseProps));
            return;
        }

        modal.style.display = "none";

    }
    modal.style.display = "block";
    var urlLoadFile = loadFile.trim() + "$";
    var packageName = ("/" + urlLoadFile).replace("/files/", "alias?fqn=").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main");
    //var packageName=("/"+loadFile).replace("/files/","alias?fqn=").replace(".service",".main").replace(".flow",".main");
    packageName = packageName.split("/").join(".");
    //alert(packageName);
    var urlPath = "/" + packageName;
    //urlPath=urlPath.replace("/files","/alias");
    var response = mySyncloop.syncRestRequest(urlPath, "GET", "");
    if (response.status == 200) {
        var fullAlias = JSON.parse(response.payload).alias;
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
        $(".service_full_path").val(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + alias);

        /*var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
            var coo = cookies[i].split("=");
            if (coo[0].trim() == "tenant") {
                $(".service_full_path").val(location.origin + "/tenant/" + coo[1].replaceAll('"', "").split(" ")[0] + alias);
            }
        }*/

        //alert(JSON.parse(response.payload).alias);
    } else
        alert(JSON.stringify(response));
    //alert(JSON.stringify(response));
    var urlLoadFile = loadFile.trim() + "$";
    var propertyPath = urlLoadFile.replace(".service$", ".properties").replace(".api$", ".properties").replace(".flow$", ".properties").replace(".sql$", ".properties");
    //var propertyPath=loadFile.replace(".service",".properties").replace(".flow",".properties");//).replace("/files","alias?fqn=packages").replace(".service",".main");
    //alert("propFilePath: "+propertyPath);
    var propFileName = (propertyPath.split("/").join(".")).replace("files.", "");
    //alert("propFileName: "+propFileName);
    var propURLPath = ("/files/packages/" + propertyPath.split("/")[2] + "/dependency/config/" + propFileName);
    //alert("propURLPath: "+propURLPath);
    var responseProps = mySyncloop.syncRestRequest(propURLPath, "GET", "");
    if (responseProps.status == 200) {
        $("#servicePropertiesFile").val(responseProps.payload);
        mySyncloop.enableCheckboxesForConfig(responseProps.payload);
    }
    else {
        //swal("Error", JSON.stringify(responseProps), "error")
    }

}

openBuildConfigurationForm() {
    var modal = document.getElementById("exportBuildModelDialog");
    var span = document.getElementById("closeExportBuildModelDialog");
    var selectArtifactsButton = document.getElementById("selectArtifactsButton");
    modal.style.display = "block";
    span.onclick = function () {
        modal.style.display = "none";
        //$(".elementProperty").css("display","none");
    }

    selectArtifactsButton.onclick = function () {
        if ($("#buildNameInput").val().trim() == "") {
            swal("Invalid build name", "", "error");
            return;
        }

        mySyncloop.addCheckBoxOnJSTree('#packageManagerJsTree');
        modal.style.display = "none";

        $("#createBuild").html('<svg xmlns="http://www.w3.org/2000/svg" width="33" height="34" viewBox="0 0 33 34">  <defs>    <style>      .cls-1 {        fill: #999;        fill-rule: evenodd;      }    </style>  </defs>  <path class="cls-1" d="M26.545,20.189C32,13.526,32,2.271,31.995,2.156a1.125,1.125,0,0,0-.336-0.819A1.11,1.11,0,0,0,30.847,1L30.757,1C27.751,1.086,17    .505,1.8,11.839,7.481a15.116,15.116,0,0,0-1.534,1.8,0.239,0.239,0,0,1-.128.064A9.323,9.323,0,0,0,3.334,12.1L1.448,13.986a1.14,1.14,0,0,0,0,1.626,1.155,1.155,0,0,0,1.62,0l1.885-1.89a7.253,7.253,0,0,1,3.531-1.932,0.151,0.151,0,0,1,.156.056,0.156,0.156,0,0,1,.016.166A25.139,25.139,0,0,0,7.186,15.68a1.133,1.133,0,0,0,.3,1.171l3.456,3.466a0.156,0.156,0,0,1,0,.22L8.485,23a1.148,1.148,0,0,0,1.62,1.626l2.456-2.463a0.155,0.155,0,0,1,.22,0l1.076,1.08,0.592,0.594a2.321,2.321,0,0,1,.647-1.974,2.347,2.347,0,0,1,.344-0.283L15.4,21.541l-1.025-1.028a0.155,0.155,0,0,1,0-.22l2.456-2.463a1.137,1.137,0,0,0,0-1.626,1.131,1.131,0,0,0-1.62,0l-2.456,2.463a0.159,0.159,0,0,1-.22,0L9.667,15.787a0.154,0.154,0,0,1-.035-0.162,20.414,20.414,0,0,1,2.081-4.309,0.878,0.878,0,0,0,.145-0.226,13.674,13.674,0,0,1,1.6-1.982C17.93,4.623,26.144,3.6,29.468,3.368a0.14,0.14,0,0,1,.12.045,0.152,0.152,0,0,1,.045.12,33.25,33.25,0,0,1-3.052,12.4C26.544,17.782,26.544,18.5,26.545,20.189ZM22.528,13.7a2.33,2.33,0,0,0,.374-0.3,2.248,2.248,0,1,0-3.182,0,2.286,2.286,0,0,0,.77.51A2.159,2.159,0,0,0,22.528,13.7ZM28.436,33H15.165a1.056,1.056,0,0,1-1.054-1.056V28.393a1.054,1.054,0,1,1,2.108,0v2.494H27.383V28.393a1.054,1.054,0,1,1,2.107,0v3.551A1.057,1.057,0,0,1,28.436,33ZM21.8,28.58c-0.033,0-.066,0-0.1,0l-0.166-.029a0.871,0.871,0,0,1-.084-0.026L21.407,28.5l-0.047-.021a0.421,0.421,0,0,1-.066-0.033l-0.045-.025-0.117-.083c-0.027-.022-0.052-0.046-0.077-0.07l-3.031-3.04a1.056,1.056,0,0,1,0-1.493,1.076,1.076,0,0,1,1.489,0l1.233,1.237V18.808a1.054,1.054,0,1,1,2.107,0v6.166l1.234-1.237a1.076,1.076,0,0,1,1.489,0,1.056,1.056,0,0,1,0,1.493l-3.031,3.04c-0.029.029-.053,0.051-0.077,0.071l-0.182.118h0l-0.388.115C21.866,28.578,21.832,28.58,21.8,28.58Z"/></svg>');
        ENABLE_DOWNLOAD_BUILD = true;
        if ($("#import_environment").is(":checked")) {
            $("#createBuild").attr('title', "Promote Build");
            $("#createBuild").attr('data-bs-original-title', "Promote Build");
        } else {
            $("#createBuild").attr('title', "Download Build");
            $("#createBuild").attr('data-bs-original-title', "Download Build");
        }

    }
}

openNameItemPromptForm(type) {
    if (type == "api" || type == "service" || type == "sql") {
        $("#group-panel").show();
    } else{
        $("#group-panel").hide();
    }
    var label_name = mySyncloop.capitalize(type);
    $("#packages_item_name").val("");
    $('#packages_item_name').removeClass('packages_item_name_eb');
    $('#info_message').text('');
    $("#new-item-heading").html("Create New " + label_name);
    $("#new-item-panel").html(label_name + " Name:");
    var modal = document.getElementById("nameItemPrompt");
    var span = document.getElementById("closeExportNameItemPromptModelDialog");
    modal.style.display = "block";
    span.onclick = function () {
        modal.style.display = "none";
        //loadPackages();
        //$(".elementProperty").css("display","none");
    }
}
// this function for write for make first letter for caps of label name Pawan by made//
capitalize(s) {
    if (s.toLowerCase() == "sql") {
        return s.toUpperCase();
    } else if (s.toLowerCase() == "api") {
        return "API";
    }
    return s && s[0].toUpperCase() + s.slice(1);
}

maximizePopup() {
    if ($('#popMaxMin.popup_minimize').length) {
        $('#popMaxMin').addClass('popup_maximum').removeClass('popup_minimize');
        $('#elementSetValueInput').hide();
        $('.ico_expand').hide();
        $('.ico_collapse').show();
        $('#elementSetValueInputTextarea').show();
    } else {
        $('#popMaxMin').addClass('popup_minimize').removeClass('popup_maximum');
        $('#elementSetValueInput').show();
        $('.ico_expand').show();
        $('.ico_collapse').hide();
        $('#elementSetValueInputTextarea').hide();
    }
}


// $(document).on('dblclick','.jstree-anchor', function(e){

//     console.log(e);

// })
openForm(jsTreeId, sel) {

    $("#stringValidation").val("");
    $("#isRequiredField").prop('checked', false);
    $("#fieldDescription").val("");
    $("#minLength").val("");
    $("#maxLength").val("");
    $("#regex").val("");
    $("#dateFormat").val("");
    $("#toDateFormat").val("");
    $("#endDate").val("");
    $("#startDate").val("");
    $("#minimumNumber").val("");
    $("#maximumNumber").val("");
    $("#decimalFormat").val("0.00");
    $("#javaObjectWrapper").val("java.lang.Object");

    // Get the modal
    var modal = document.getElementById("elementPropertyModalDialog");
    var ref = $(jsTreeId).jstree(true);
    var sel = ref.get_selected();
    var initializedFlag = false;
    if (!sel.length) {
        swal("Warning", "Select an element first", "warning");
        return;
    } else if (sel.length > 1) {
        swal("Warning", "Select only one element", "warning");
        return;
    }

    // Get the button that opens the modal
    //var btn = document.getElementById("myBtn");
    sel = ref.get_selected()[0];
    currentNodePath = ref.get_path(sel, '/');
    if (!(typeof mapperObj === 'undefined')) {
        $(mapperObj.createList).each(function(e, data){
            if(data.path == currentNodePath){
                initializedFlag = true;
            }
        });
        $(mapperObj.lines).each(function(e, data){
            if(data.inputPath == currentNodePath || data.outputPath == currentNodePath){
                initializedFlag = true;
            }
        });
    }
    if(initializedFlag){
        disableProp("elementType", true);
        disableProp("isArray", true);
        disableProp("isRequiredField", true);
        disableProp("stringValidation", true);
        disableProp("regex", true);
        disableProp("fieldDescription", true);
        disableProp("minLength", true);
        disableProp("maxLength", true);
        disableProp("dateFormat", true);
        disableProp("toDateFormat", true);
        disableProp("startDate", true);
        disableProp("endDate", true);
        disableProp("minimumNumber", true);
        disableProp("maximumNumber", true);
        disableProp("decimalFormat", true);
        disableProp("javaObjectWrapper", true);


        /*document.getElementById("elementType").disabled = true;
        document.getElementById("isArray").disabled = true;
        document.getElementById("isRequiredField").disabled = true;
        document.getElementById("stringValidation").disabled = true;
        document.getElementById("regex").disabled = true;
        document.getElementById("fieldDescription").disabled = true;
        document.getElementById("minLength").disabled = true;
        document.getElementById("maxLength").disabled = true;
        document.getElementById("dateFormat").disabled = true;
        document.getElementById("toDateFormat").disabled = true;
        document.getElementById("startDate").disabled = true;
        document.getElementById("endDate").disabled = true;
        document.getElementById("minimumNumber").disabled = true;
        document.getElementById("maximumNumber").disabled = true;
        document.getElementById("decimalFormat").disabled = true;
        document.getElementById("javaObjectWrapper").disabled = true;*/
        //$("#elementType").disabled = true;
    }
    else{
        /*document.getElementById("elementType").disabled = false;
        document.getElementById("isArray").disabled = false;
        document.getElementById("isRequiredField").disabled = false;
        document.getElementById("stringValidation").disabled = false;
        document.getElementById("regex").disabled = false;
        document.getElementById("fieldDescription").disabled = false;
        document.getElementById("minLength").disabled = false;
        document.getElementById("maxLength").disabled = false;
        document.getElementById("dateFormat").disabled = false;
        document.getElementById("toDateFormat").disabled = false;
        document.getElementById("startDate").disabled = false;
        document.getElementById("endDate").disabled = false;
        document.getElementById("minimumNumber").disabled = false;
        document.getElementById("maximumNumber").disabled = false;
        document.getElementById("decimalFormat").disabled = false;
        document.getElementById("javaObjectWrapper").disabled = false;*/

        disableProp("elementType", false);
        disableProp("isArray", false);
        disableProp("isRequiredField", false);
        disableProp("stringValidation", false);
        disableProp("regex", false);
        disableProp("fieldDescription", false);
        disableProp("minLength", false);
        disableProp("maxLength", false);
        disableProp("dateFormat", false);
        disableProp("toDateFormat", false);
        disableProp("startDate", false);
        disableProp("endDate", false);
        disableProp("minimumNumber", false);
        disableProp("maximumNumber", false);
        disableProp("decimalFormat", false);
        disableProp("javaObjectWrapper", false);
    }

    function disableProp(id, val) {
        if (null == document.getElementById(id)) {
            return ;
        }
        document.getElementById(id).disabled = val;
    }
    currentSelectedJSONObject.node = sel;
    currentSelectedJSONObject.selNode = ref.get_node(sel);
    currentSelectedJSONObject.jsTreeId = jsTreeId;
    currentSelectedJSONObject.ref = ref;
    currentSelectedJSONObject.nodeType = ref.get_type(sel);
    if (currentSelectedJSONObject.nodeType == "default")
        currentSelectedJSONObject.nodeType = "document";
    if (currentSelectedJSONObject.nodeType.endsWith("List"))
        $("#isArray").prop('checked', true);
    else
        $("#isArray").prop('checked', false);
    var prevNode = JSON.stringify(ref.get_node(sel));

    var elemType = currentSelectedJSONObject.nodeType.replace("List", "");
    $("#elementType").prop("value", elemType);
    mySyncloop.showProperties(elemType);
    //ref.set_type(sel,'docList');
    // Get the <span> element that closes the modal
    var span = document.getElementById("closeNodeProperties");
    var closeBtn = document.getElementById("closePropertyModalDialog");
    $("#currentNodePath").html(currentNodePath);
    // When the user clicks on the button, open the modal
    modal.style.display = "block";
    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        if(currentSelectedJSONObject.jsTreeId == "#landing_arrow_jsTree"){
            updateDataType(elemType, currentSelectedJSONObject.jsTreeId);
        }
        modal.style.display = "none";
        $(".elementProperty").css("display", "none");


        let assignItem = mySyncloop.getAssignList(inputJstreeRef);
        var value = $("#ServiceelementValueInput").val();
        var evaluate = null;
        var eev = $("#Serviceelement_ExpressionVariable").prop("checked");
        if (eev == true)
            evaluate = "EEV";
        var elv = $("#Serviceelement_LocalVariable").prop("checked");
        if (elv == true)
            evaluate = "ELV";
        var epv = $("#Serviceelement_PackageVariable").prop("checked");
        if (epv == true)
            evaluate = "EPV";
        var egv = $("#Serviceelement_GlobalVariable").prop("checked");
        if (egv == true)
            evaluate = "EGV";

        var sel = inputJstreeRef.get_selected()[0];
        let node = inputJstreeRef.get_node(sel);
        let nodePath = inputJstreeRef.get_path(node, '/');

        if (sel) {
            if (null == node.data) {
                node.data = {};
            }
            if (!node.data["assignList"])
                node.data["assignList"] = [];

            let isAvailable = false;
            if (assignItem != null)
                isAvailable = true;
            else
                assignItem = {};

            assignItem.path = nodePath;
            assignItem.value = value;
            assignItem.evaluate = evaluate;
            assignItem.typePath = mapperObj.getNodeTypePath("#" + inputJstreeRef.element[0].id, nodePath);

            if (!isAvailable)
                node.data["assignList"].push(assignItem);
        }
    }

    closeBtn.onclick = function () {
        mySyncloop.showProperties(elemType);
        mySyncloop.resetDataField(prevNode);
        currentSelectedJSONObject.nodeType = elemType;
        if(currentSelectedJSONObject.jsTreeId == "#landing_arrow_jsTree"){
            updateDataType(elemType, currentSelectedJSONObject.jsTreeId);
        }
    }

    mySyncloop.openServiceSetValueModelDialog(jsTreeId);

}

openServiceSetValueModelDialog(id) {
    //inputJstreeRef
    if (id != '#input_schema_editor_jsTree') {
        $(".default_value").hide();
        return ;
    }
    $(".default_value").show();
    var span = document.getElementById("ServicecloseSetValueModelDialog");

    let assignItem = mySyncloop.getAssignList(inputJstreeRef);

    if (assignItem) {
        //alert(createItem.value);
        $("#Serviceelement_NoneVariable").prop("checked", true);
        $("#ServiceelementValueInput").val(assignItem.value);
        if (assignItem.evaluate == "EEV")
            $("#Serviceelement_ExpressionVariable").prop("checked", true);
        if (assignItem.evaluate == "ELV")
            $("#Serviceelement_LocalVariable").prop("checked", true);
        if (assignItem.evaluate == "EGV")
            $("#Serviceelement_GlobalVariable").prop("checked", true);
        if (assignItem.evaluate == "EPV")
            $("#Serviceelement_PackageVariable").prop("checked", true);

    } else {
        $("#ServiceelementValueInput").val("");
        $("#Serviceelement_NoneVariable").prop("checked", true);
    }


    span.onclick = function() {
        $("#closeNodeProperties").trigger('click');
    };
}

getAssignList(inputJstreeRef) {
    var sel = inputJstreeRef.get_selected()[0];
    if (sel) {
        let node = inputJstreeRef.get_node(sel);
        let nodePath = inputJstreeRef.get_path(node, '/');
        if (null == node['data']) {
            return ;
        }
        let assignList = node.data['assignList'];
        if (null == assignList) {
            return null;
        }
        for (let i = 0; i < assignList.length; i++) {
            if (nodePath == assignList[i].path)
                return assignList[i];
        }
    }
}

showProperties(elementType) {
    var curDataNode = currentSelectedJSONObject.selNode;
    for (var key in curDataNode.data) {
        var value = curDataNode.data[key];
        if (key.endsWith('Description') || key.endsWith('regex'))
            value = atob(value);
        //alert(key+":"+value);
        if (key == "isRequiredField" && value == true) {
            //alert(key+":"+value);
            //alert($("#"+key));
            $("#" + key).prop("checked", true);
        } else
            $("#" + key).val(value);
    }
    $(".elementProperty").css("display", "none");
    $("#" + elementType + "Properties").css("display", "block");
    if (currentSelectedJSONObject.nodeType == elementType)
        return;
    currentSelectedJSONObject.nodeType = elementType;
    mySyncloop.changeCurrentNodeType($("#isArray").prop('checked'));
}

resetDataField(node){
    node = JSON.parse(node);
    if (node.type.endsWith("List"))
        $("#isArray").prop('checked', true);
    else
        $("#isArray").prop('checked', false);
    mySyncloop.changeCurrentNodeType($("#isArray").prop('checked'));
    var curDataNode = currentSelectedJSONObject.selNode;
    curDataNode.data = {};
    if (node.data == null){
        curDataNode.data = {};
    }
    else{
        for (var key in node.data){
            mySyncloop.updateDataField(key, node.data[key]);
        }
    }
}

updateDataField(field, value) {
    var curDataNode = currentSelectedJSONObject.selNode;
    if (curDataNode.data == null)
        curDataNode.data = {};
    if (field.endsWith('Description') || field.endsWith('regex'))
        value = btoa(value);
    curDataNode.data[field] = value;
}

addDblclickClickListener(id, callback) {
    $(id).dblclick(function (event) {

        callback();

    });
}

setUnsavedChanges(fileURL, markStar) {
    var tokenize = fileURL.split("/");
    var name = tokenize[tokenize.length - 1].split(".")[0];
    if (markStar != false)
        localStorage.setItem(fileURL, name + "*");
    else {
        localStorage.setItem(fileURL, name);
    }
}


/**
 Create Build
 */

var ENABLE_DOWNLOAD_BUILD = false;

$(document).ready(function () {

    $(".select-build").click(function () {
        var sel = $(this).attr('data');
        $("#" + sel + "_checkbox").find("input").trigger('click');
    });

    $("#createBuild").click(function () {

        if (ENABLE_DOWNLOAD_BUILD) {

            if ($(".select-build:checked").length == 0) {
                swal("", "Please select item(s) to export.", "error");
                return;
            }

            var tree = $('#packageManagerJsTree').jstree(true);
            var sel = "j1_1";

            {
                var cid = sel;
                console.log(sel);
                var elemId = document.getElementById(cid + "_checkbox");
                if (elemId == null)
                    //alert("Please select Tools>Build first");
                    swal("Warning", "Please select Tools>Build first", "warning");
                else {
                    //var includeAllDependencies=confirm("Do you want to export the build with all the dependencies?");
                    //exportBuild('includeDependencies','includeGlobalProperties','includeLocalProperties','includeEndpoint','buildNameInput')
                    var includeDependencies = $("#includeDependencies").prop("checked"); //prompt("Please create your build name:", "myBuild");
                    if (includeDependencies)
                        includeDependencies = true;
                    else
                        includeDependencies = false;

                    var includeGlobalProperties = $("#includeGlobalProperties").prop("checked");
                    if (includeGlobalProperties)
                        includeGlobalProperties = true;
                    else
                        includeGlobalProperties = false;

                    var includeLocalProperties = $("#includeLocalProperties").prop("checked");
                    if (includeLocalProperties)
                        includeLocalProperties = true;
                    else
                        includeLocalProperties = false;

                    var includeEndpoint = $("#includeEndpoint").prop("checked");
                    if (includeEndpoint)
                        includeEndpoint = true;
                    else
                        includeEndpoint = false;

                    var buildName = $("#buildNameInput").val();
                    if (buildName != null && buildName.trim().length > 0) {
                        var data = tree.get_json('#', {
                            'flat': true
                        });
                        var selected = [];
                        var counter = 0;
                        for (var index in data) {
                            var map = data[index];
                            var elemNode = $("#" + map.id);
                            var elemChecked = elemNode.attr('checked');

                            //alert(JSON.stringify(map)+" : "+elemChecked);
                            if (elemChecked) {
                                //alert(JSON.stringify(map));
                                var elemTreeNode = tree.get_node(map.id);
                                //alert(elemTreeNode);
                                var nodePath = tree.get_path(elemTreeNode, '/');
                                //alert(nodePath);
                                var artifact = {
                                    "type": "",
                                    "asset": ""
                                };
                                artifact.type = map.type;
                                artifact.asset = nodePath;
                                selected.push(artifact);
                                //selected[counter++].nodePath;
                            }
                        }
                        var content = JSON.stringify(selected);
                        // alert(content);
                        var qp = "buildName=" + buildName + "&includeDependencies=" + includeDependencies + "&includeGlobalProperties=" + includeGlobalProperties +
                            "&includeLocalProperties=" + includeLocalProperties + "&includeEndpoints=" + includeEndpoint;
                        var response = null;
                        if ($("#import_environment").is(":checked")) {
                            response = mySyncloop.syncRestRequest("/packages.middleware.pub.server.build.api.promoteBuild.main?" + qp + "&environment_id=" + $("#environment_id").val(), "POST", content, "application/json", "application/json");
                        } else {
                            response = mySyncloop.syncRestRequest("/build?" + qp, "POST", content, "application/json", "application/json");
                        }
                        if (response.status == 200) {
                            var jObj = JSON.parse(response.payload);

                            if ($("#import_environment").is(":checked")) {
                                console.log(jObj);
                                if (jObj.status == "Saved") {
                                    swal("Imported", "", "success");
                                } else {
                                    swal("Error", "Please try again.", "error");
                                }
                            } else {
                                if (jObj.msg == "Success") {
                                    //alert(jObj.msg);
                                    var element = document.createElement('a');
                                    element.setAttribute('href', JSON.parse(response.payload).url);
                                    element.setAttribute('target', "_blank");
                                    document.body.appendChild(element);
                                    element.click();
                                } else {
                                    swal(jObj.msg, "", "error")
                                }
                            }
                        }
                    }
                    /*ENABLE_DOWNLOAD_BUILD = false;
                    $("#createBuild").html('<svg class="expr_icon" xmlns="http://www.w3.org/2000/svg" width="24.563" height="30.563" viewBox="0 0 33 33">\t\t\t\t  <defs>\t\t\t\t\t<style>\t\t\t\t\t  .cls-1 {\t\t\t\t\t\tfill: #999;\t\t\t\t\t\tfill-rule: evenodd;\t\t\t\t\t  }\t\t\t\t\t</style>\t\t\t\t  </defs>\t\t\t\t  <path class="cls-1" d="M17.754,31.541a1.187,1.187,0,0,0,1.663,0l1.934-1.935a9.4,9.4,0,0,0,2.786-6.955,0.162,0.162,0,0,1,.065-0.133,16.3,16.3,0,0,0,1.915-1.6C32.705,14.331,32.707,1.494,32.7,1.37A1.15,1.15,0,0,0,32.357.532,1.141,1.141,0,0,0,31.525.187l-0.093,0C28.348,0.274,17.835,1,12.021,6.82a15.461,15.461,0,0,0-1.574,1.847,0.249,0.249,0,0,1-.131.066,9.579,9.579,0,0,0-7.021,2.809L1.36,13.477a1.165,1.165,0,0,0,0,1.664,1.188,1.188,0,0,0,1.663,0l1.934-1.935A7.449,7.449,0,0,1,8.58,11.228a0.155,0.155,0,0,1,.161.057,0.159,0.159,0,0,1,.017.17,25.687,25.687,0,0,0-1.51,3.754,1.158,1.158,0,0,0,.307,1.2L11.1,19.955a0.159,0.159,0,0,1,0,.225L9.58,21.7a1.176,1.176,0,1,0,1.663,1.665l1.52-1.52a0.16,0.16,0,0,1,.226,0l3.569,3.57a1.289,1.289,0,0,0,1.208.3,23.227,23.227,0,0,0,3.672-1.484,0.158,0.158,0,0,1,.17.017,0.16,0.16,0,0,1,.058.161,7.319,7.319,0,0,1-1.954,3.555L17.777,29.9a1.1,1.1,0,0,0-.362.8A1.141,1.141,0,0,0,17.754,31.541ZM17.733,23.2a0.161,0.161,0,0,1-.113-0.047l-2.993-2.994a0.159,0.159,0,0,1,0-.225l1.52-1.52a1.176,1.176,0,1,0-1.663-1.664l-1.52,1.521a0.164,0.164,0,0,1-.226,0L9.792,15.32a0.157,0.157,0,0,1-.036-0.166,20.859,20.859,0,0,1,2.135-4.41,0.9,0.9,0,0,0,.149-0.232,14,14,0,0,1,1.643-2.028C18.271,3.894,26.7,2.847,30.11,2.61a0.144,0.144,0,0,1,.123.046,0.156,0.156,0,0,1,.047.123c-0.212,3.416-1.206,11.859-5.826,16.48a17.684,17.684,0,0,1-6.668,3.93A0.151,0.151,0,0,1,17.733,23.2ZM21.765,6.564H21.754a4.631,4.631,0,0,0-3.286,1.361h0A4.668,4.668,0,1,0,21.765,6.564Zm-0.026,7a2.328,2.328,0,1,1,1.633-.687A2.3,2.3,0,0,1,21.739,13.564Zm-17.246,3.2a1.173,1.173,0,0,0-.831.351L0.509,20.272a1.162,1.162,0,0,0,0,1.664,1.186,1.186,0,0,0,1.662,0h0L5.325,18.78A1.182,1.182,0,0,0,4.494,16.766Zm2.06,3.56a1.173,1.173,0,0,0-.831.351L4.068,22.332a1.162,1.162,0,0,0,0,1.665,1.186,1.186,0,0,0,1.662,0h0l1.655-1.656A1.182,1.182,0,0,0,6.553,20.326Zm4.927,4.929a1.173,1.173,0,0,0-.831.351L8.995,27.261a1.162,1.162,0,0,0,0,1.665,1.185,1.185,0,0,0,1.662,0h0l1.655-1.656A1.183,1.183,0,0,0,11.48,25.255Zm3.467,1.968a1.173,1.173,0,0,0-.831.351l-3.154,3.155a1.174,1.174,0,0,0,.824,2.006H11.8a1.16,1.16,0,0,0,.827-0.342h0l3.155-3.156A1.183,1.183,0,0,0,14.947,27.223Z"/>\t\t\t\t</svg>');
                    $("#createBuild").attr('title', "Create Build");
                    $("#createBuild").attr('data-bs-original-title', "Create Build");*/
                }
            }

        } else {
            mySyncloop.openBuildConfigurationForm();
        }
    });
});

importBuild() {
    var tree = $("#packageManagerJsTree").jstree(true);
    var sel = "j1_1";
    var dest = tree.get_path(sel, '/');
    var url = '/upload/packages?dest=' + dest;
    mySyncloop.uploadFile(url, "file", ".zip");
}

importBuildV2() {
    var url = '/upload/packages?dest=packages';
    mySyncloop.uploadFile(url, "file", ".zip");
}

getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return "#";
}

cloneProperties(newFlowName) {
    var urlLoadFile = loadFile.trim() + "$";
    var propertyPath = urlLoadFile.replace(".service$", ".properties").replace(".api$", ".properties").replace(".sql$", ".properties").replace(".flow$", ".properties");
    //var propertyPath=loadFile.replace(".service",".properties").replace(".flow",".properties");//).replace("/files","alias?fqn=packages").replace(".service",".main");
    //alert("propFilePath: "+propertyPath);
    var propFileName = (propertyPath.split("/").join(".")).replace("files.", "");
    //alert("propFileName: "+propFileName);
    var propURLPath = ("/files/packages/" + propertyPath.split("/")[2] + "/dependency/config/" + propFileName);
    //alert("propURLPath: "+propURLPath);
    var responseProps = mySyncloop.syncRestRequest(propURLPath, "GET", "");
    var properties = null;
    if (responseProps.status == 200) {
        properties = responseProps.payload;
    }


    if (properties != null && properties.trim().length > 0) {
        urlLoadFile = newFlowName.trim() + "$";
        propertyPath = urlLoadFile.replace(".service$", ".properties").replace(".api$", ".properties").replace(".sql$", ".properties");

        propFileName = (propertyPath.split("/").join(".")).replace("files.", "");
        propURLPath = ("/files/packages/" + propertyPath.split("/")[2] + "/dependency/config/" + propFileName);
        mySyncloop.syncRestRequest(propURLPath, "POST", properties, "application/text", "application/text");
    }
}

openJWTPopup() {
    var modal = document.getElementById("jwtModelDialog");
    var span = document.getElementById("closejwtModelDialog");
    var selectArtifactsButton = document.getElementById("JWTOKButton");
    modal.style.display = "block";
    span.onclick = function () {
        modal.style.display = "none";
        //$(".elementProperty").css("display","none");
    }

    $.get("/jwt?expiration_time=" + jwt_expiration_in, function (data, status) {
        $("#jwtInput").val(data);
        jwt_expiration_in = 8;
    });

    selectArtifactsButton.onclick = function () {
        modal.style.display = "none";
    }
}

let jwt_expiration_in = 8;
openJWTPopupTime() {
    jwt_expiration_in = $("#jwt_expiration_in").val();
    if (jwt_expiration_in == "expir_custom") {
        jwt_expiration_in = parseInt($("#expir_custom_hours").val());
    }
    if (jwt_expiration_in <= 0) {
        swal("Invalid time", "Please provide a valid time", "error");
        return ;
    }
    mySyncloop.openJWTPopup();
}

focusOnElement(file, shouldOpen) {
    if (null == parent.positioning_object) {
        return 0;
    }
    let position = 0;
    for (let i = 0; i < parent.positioning_object.length; i++) {
        if (parent.positioning_object[i] == file) {
            position = i + 1;
            break;
        }
    }

    parent.$(".jstree-clicked").removeClass("jstree-wholerow-clicked");
    parent.$(".jstree-wholerow-clicked").removeClass("jstree-wholerow-clicked");

    parent.$('#packageManagerJsTree').jstree(true)._open_to("j1_" + (position)).focus();
    parent.$("#j1_" + (position) + "_anchor").addClass("jstree-clicked");
    parent.$("#j1_" + (position) + "_anchor").prev().prev().addClass("jstree-wholerow-clicked");
    parent.$("#j1_" + (position) + "_anchor").focus();
    if (shouldOpen) {
        parent.$("#j1_" + (position) + "_anchor").trigger('dblclick');
    }
}

let ENV_SIZE = 0;

getAllEnvironments() {
    mySyncloop.asyncRestRequest("/packages.middleware.pub.environments.api.getEnvironments.main?start=0&length=100", null, "GET", function (response) {
        $("#environment_id").html("");
        $("#promote_environments").html("");
        if (null == response.environments || response.environments.length == 0) {
            $(".promote_instruction").css("color", "#eee");
            return;
        }
        ENV_SIZE = response.environments.length;
        for (var i = 0; i < response.environments.length; i++) {
            $("#environment_id").append("<option value='" + response.environments[i].id + "'>" + response.environments[i].sub_domain + "/" + response.environments[i].tenant + "</option>");
            let logo = "AWS";
            if (response.environments[i].type == 'EKA_ENV') {
                logo = "syncloop";
            }
            let isDisabled = response.environments[i].isEnabled ? '' : 'disabled';
            let reason = "";
            if (null != response.environments[i].reason && response.environments[i].reason.trim() != "") {
                reason = '<div class="alert_mes"> <img src=getSystemResourcePath() + "/assets/img/promotion_alert.svg">' + response.environments[i].reason + '</div>'
            }
            $("#promote_environments").append("<div class='col-md-4'><div class='envir_in'>" + reason + "<div class='invr_name'><input " + isDisabled + " class='styled-checkbox promoting-servers' type='checkbox' name='API2' value='" + response.environments[i].id + "' id='encheck" + i + "'><label for='encheck" + i + "'><span class='red'>" + response.environments[i].name.substring(0, 2).toLocaleUpperCase() + "</span> " + response.environments[i].name + " </label> <div class='promot_notification' id='env-up-" + response.environments[i].id + "'></div> </div><div class='tenant_name'>Tenant: " + response.environments[i].tenant + " </div><div class='tenant_name'> Platform: " + logo + " </div><div class='invr_url'><a class='' href='javascript:void(0)' id=''><img src='/middleware/pub/server/ui/assets/img/copy_icon.svg'></a><a href='https://" + response.environments[i].sub_domain + "' target='_blank'>https://" + response.environments[i].sub_domain + "</a> </div></div></div>");
        }
    });
}
$(document).ready(function () {
    //mySyncloop.getAllEnvironments();
});

loadGroupsDP() {
    var response = mySyncloop.syncRestRequest("/packages.middleware.pub.security.flow.getGroups.main", "GET", "");
    if (response.status == 200 && response.payload) {

        $('#consumer-groups').html("<option>administrators</option>");
        $('#consumer-groups').append("<option>developers</option>");

        $('#developer-groups').html("<option>administrators</option>");
        $('#developer-groups').append("<option>developers</option>");

        let groups = JSON.parse(response.payload).groups;
        for (var i = 0; i < groups.length; i++) {

            $('#consumer-groups').append("<option>" + groups[i] + "</option>");
            $('#developer-groups').append("<option>" + groups[i] + "</option>");

            $('.serviceConsumersGroups').append("<option>" + groups[i] + "</option>");
            $('.serviceDevelopersGroups').append("<option>" + groups[i] + "</option>");
        }
    }
}

doLogout() {
    Cookies.remove('pac4jCsrfToken');
    Cookies.remove('tenant');
    Cookies.remove('JSESSIONID');
    localStorage.clear();
    sessionStorage.clear();
    mySyncloop.deleteAllCookies();
    location.href = "/";
}

flowStepIOHeightAdjuster() {
    $("#landing_arrow_jsTree").children().css("height", $("#landing_arrow_jsTree").children().height() + 100);
    $("#launching_arrow_jsTree").children().css("height", $("#launching_arrow_jsTree").children().height() + 100);
    $("#landing_arrow_jsTree_function").children().css("height", $("#landing_arrow_jsTree_function").children().height() + 100);
    $("#launching_arrow_jsTree_function").children().css("height", $("#launching_arrow_jsTree_function").children().height() + 100);
}

flowIOHeightAdjuster() {
    $("#input_schema_editor_jsTree").children().css("height", $("#input_schema_editor_jsTree").children().height() + 100);
    $("#output_schema_editor_jsTree").children().css("height", $("#output_schema_editor_jsTree").children().height() + 100);
}

updateHeigtht(node_id){
    $("#"+node_id).children().css("height", $("#"+node_id).children().height() + 80);
}

let USER_PROFILE = {};

getLoggedInUser() {
    var response = mySyncloop.syncRestRequest("/packages.middleware.pub.service.getCurrentUserAccount.main", "GET", "");
    if(response.status == 200 && response.payload) {
        response = JSON.parse(response.payload);
        USER_PROFILE = response.profile;
    }
}

enableGraphQL() {
    let propertiesString = $("#servicePropertiesFile").val();
    const properties = {};

    propertiesString.split('\n').forEach(line => {
        const parts = line.split('=');
        properties[parts[0]] = parts[1];
    });

    properties.GraphQL = $("#enableGraphQL").is(":checked");

    if (properties.GraphQL) {
        $("#serviceHTTPMethodValue").val('POST')
        $("#serviceHTTPMethodValue").attr('disabled', 'disabled');
        if (!Boolean(properties["GraphQL.DBC"])) {
            properties["GraphQL.DBC"] = "";
        }

        if (!Boolean(properties["GraphQL.Schema"])) {
            properties["GraphQL.Schema"] = "";
        }
    } else {
        $("#serviceHTTPMethodValue").removeAttr('disabled', 'disabled');
    }
    const keys = Object.keys(properties);

    const date = new Date();

    const dayOfWeek = date.toLocaleString("en-US", { weekday: "short" });
    const month = date.toLocaleString("en-US", { month: "short" });
    const dayOfMonth = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const timeZone = date.toLocaleString("en-US", { timeZoneName: "short" });
    const year = date.getFullYear().toString();

    const formattedDate = `# Properties saved at ${dayOfWeek} ${month} ${dayOfMonth} ${year} ${hours}:${minutes}:${seconds}`;

    propertiesString = formattedDate + "\n";
    for (let i = 0 ; i < keys.length ; i++) {
        if (null != properties[keys[i]]) {
            propertiesString += keys[i]  + "=" + properties[keys[i]] + "\n";
        }
    }

    $("#servicePropertiesFile").val(propertiesString);
}

enableCheckboxesForConfig(configurations) {
    const properties = {};

    configurations.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length > 1) {
            properties[parts[0]] = parts[1].trim();
        } else {
            properties[parts[0]] = parts[1];
        }

    });

    if (properties.GraphQL == "true") {
        $("#enableGraphQL").prop("checked", true);
        $("#serviceHTTPMethodValue").attr('disabled', 'disabled');
    } else {
        $("#serviceHTTPMethodValue").removeAttr('disabled', 'disabled');
        $("#enableGraphQL").prop("checked", false);
    }

}


downloadContentOffline(text, fileName, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName
    link.click();
    URL.revokeObjectURL(url);
}


$(document).ready(function () {

    mySyncloop.asyncRestRequest("/packages.middleware.pub.server.build.api.SysInfo.main", null,  "GET", function (response) {
        if (response.license_key) {} else {
            mySyncloop.asyncRestRequest("/packages.middleware.pub.security.flow.getUsers.main", null, "GET", function (response) {
                if (Object.keys(response.users).length > 2) {
                    $("#license_warning").show();
                }
            });
        }
    });
});


$(function() {
    mySyncloop.asyncRestRequest("/packages.middleware.pub.server.build.api.checkBuildUpdate.main", null,  "GET", function (response) {
        if (!response.status) {

        } else {
            if (Cookies.get("Update_Flash_" + response.newVersion) == "true") {
                return ;
            }
            swal({
                    title: "New Update",
                    text: "Found a new update v" + response.newVersion + ". Do you want to update?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#f2533e",
                    cancelButtonText: "Update Later",
                    confirmButtonText: "Update Now",
                    showLoaderOnConfirm : true,
                    closeOnConfirm: true,
                    closeOnCancel: true
                },
                function(isConfirm){
                    if (isConfirm) {
                        updateNow(response.newVersion);
                    }
                    else {
                        swal.close();
                        Cookies.set("Update_Flash_" + response.newVersion, "true")
                    }
                });
        }
    });

    function updateNow(version) {
        /*swal({
            title: 'Updating!',
            text: 'Please wait... your environment is getting updated.',
            showCancelButton: false,
            allowOutsideClick: false,
            showConfirmButton: false
        })*/

        mySyncloop.openEvnirUpdatepopup();

        mySyncloop.asyncRestRequest("/packages.middleware.pub.server.build.api.updateBuild.main?version=" + version, null,  "GET", function (response) {

            const bar = document.getElementById('progressBar'),
                percentage = document.getElementById('percentage');

            var interval = setInterval(function () {
                mySyncloop.mySyncloop.asyncRestRequest("/packages.middleware.pub.server.build.api.getUpdateStatus.main?uniqueId=" + response.uniqueId, null,  "GET", function (response) {
                    if (response.status == "COMPLETED_SUCCESS") {
                        percentage.textContent = '100 % completed';
                        $("#closenewUpdateModelDialog").trigger('click');
                        swal("Your environment is updated successfully.", "", "success");
                        clearInterval(interval);
                    } else if (response.status == "COMPLETED_SUCCESS_RESTART_REQUIRED") {
                        percentage.textContent = '100 % completed';
                        $("#closenewUpdateModelDialog").trigger('click');
                        clearInterval(interval);
                        swal({
                                title: "Updated Successfully",
                                text: "This update required your server restart",
                                type: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#f2533e",
                                cancelButtonText: "Restart Later",
                                confirmButtonText: "Restart",
                                showLoaderOnConfirm : true,
                                closeOnConfirm: false,
                                closeOnCancel: true
                            },
                            function(isConfirm){
                                if (isConfirm) {
                                    mySyncloop.rebooting();
                                }
                                else {
                                    swal.close();
                                }
                            });
                    } else if (response.status == "COMPLETED_ERROR") {
                        $("#closenewUpdateModelDialog").trigger('click');
                        swal("Your environment is not updated successfully. Please contact administrator", "", "error");
                        clearInterval(interval);
                    } else {
                        if (bar.value < 90) {
                            bar.value += 10;
                        }
                        percentage.textContent = bar.value + '% completed';
                    }
                });
            }, 5000);

        }, function (error) {
            swal(error.responseJSON.error, "", "error");
        });

    }
});

rebooting() {
    swal("Rebooting", "", "warning");
    mySyncloop.asyncRestRequest("/packages.middleware.pub.server.core.RebootServer.main", null, "GET", function (response) {
    });
}

uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}

updateUUID(response) {
    for (var i = 0 ; i < response.length ; i++) {
        if (null == response[i].data.guid) {
            response[i].data.guid = mySyncloop.uuidv4();
        }
        if (null != response[i].children && response[i].children.length > 0) {
            mySyncloop.updateUUID(response[i].children);
        }
    }
}

replaceAndAdd(nodeId) {
    var nodeAnchor=$("#"+nodeId+"_anchor");
    if (null == nodeAnchor[0]) {
        return ;
    }

    let hasError = mySyncloop.decorateError(nodeId);
    let simulationWarning = "";
    if (hasError) {
        simulationWarning = "<span onclick=openWarningpopup('" + nodeId + "') class='wr_icon'><img src='/middleware/pub/server/ui/icons/error.svg' alt=''>";
    }

    let innerText = nodeAnchor[0].innerText.toUpperCase();
    if (innerText.includes(":")) {
        innerText = nodeAnchor[0].innerText.toUpperCase().slice(0, nodeAnchor[0].innerText.toUpperCase().indexOf(":")).trim();
    }

    if (innerText == "TRANSFORMER") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.transformer.icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='transformer-tape'>TRANSFORMER</span> " + simulationWarning + "</span>");
    } else if (innerText == "MAP") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.transformer.icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='transformer-tape'>MAP</span>" + simulationWarning + "</span>");
    } else if (innerText == "GROUP") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.group.icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='group-tape'>GROUP</span> " + simulationWarning + "</span>");
    } else if (innerText == "SEQUENCE") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.group.icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='group-tape'>SEQUENCE</span> " + simulationWarning + "</span>");
    } else if (innerText == "IFELSE") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.ifelse.icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='ifelse-tape'>IFELSE</span> " + simulationWarning + "</span>");
    } else if (innerText == "SWITCH") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.switch.icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='switch-tape'>SWITCH</span> " + simulationWarning + "</span>");
    } else if (innerText == "TCF-BLOCK") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types["try-catch"].icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='tcf-block-tape'>TCF-BLOCK</span> " + simulationWarning + "</span>");
    } else if (innerText == "FOREACH") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.foreach.icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='foreach-tape'>FOREACH</span> " + simulationWarning + "</span>");
    } else if (innerText == "LOOP") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.foreach.icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='foreach-tape'>LOOP</span> " + simulationWarning + "</span>");
    } else if (innerText == "REDO") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.redo.icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='redo-tape'>REDO</span> " + simulationWarning + "</span>");
    } else if (innerText == "REPEAT") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.redo.icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='redo-tape'>REPEAT</span> " + simulationWarning + "</span>");
    } else if (innerText == "TRY") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types["try-catch"].icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='try-tape'>TRY</span> " + simulationWarning + "</span>");
    } else if (innerText == "CATCH") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types["try-catch"].icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='catch-tape'>CATCH</span> " + simulationWarning + "</span>");
    } else if (innerText == "AWAIT") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types["try-catch"].icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='await-tape'>AWAIT</span> " + simulationWarning + "</span>");
    } else if (innerText == "FINALLY") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types["try-catch"].icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='finally-tape'>FINALLY</span> " + simulationWarning + "</span>");
    } else if (innerText == "CASE") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.group.icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='case-tape'>CASE</span> " + simulationWarning + "</span>");
    } else if (innerText == "CONDITION") {
        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(\'' + FLOW_JS_TREE_CONFIG.types.group.icon + '\'); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='condition-tape'>CONDITION</span> " + simulationWarning + "</span>");
    } else if (innerText == "INVOKE" || innerText == "SERVICE") {
        let node = $("#flowDesignerJsTree").jstree(true).get_node(nodeId);
        let nodeService = "";
        if (null != node.data && null != node.data.fqn) {
            let splitter = node.data.fqn.split("/");
            nodeService = ": " + splitter[splitter.length - 1] + " ";
        }

        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(drag1.png); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='service-tape'>SERVICE</span> " + simulationWarning + "</span>" + nodeService);
    }

}

isInIframe() {
    return window.location !== window.parent.location;
}

getFileLocation(r) {
    let fileLocation = "";
    if (r.indexOf(".api") > 0) {
        fileLocation = getSystemResourcePath() + "/workspace/web/apiMaker/apiEditor.html?loadFile=" + r;

    } else if (r.indexOf(".flow") > 0) {
        fileLocation = getSystemResourcePath() + "/workspace/web/flowMaker/flowEditor.html?loadFile=" + r;
    } else if (r.indexOf(".service") > 0) {
        fileLocation = getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/clike/serviceEditor.html?loadFile=" + r;
    } else if (r.indexOf(".sql") > 0) {
        fileLocation = getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/sql/sqlEditor.html?loadFile=" + r;
    } else if (r.indexOf(".jdbc") > 0 || r.indexOf(".graphql") > 0) {
        fileLocation = getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/properties/jdbcEditor.html?loadFile=" + r;
    } else if (r.indexOf(".properties") > 0) {
        fileLocation = getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/properties/propertiesEditor.html?loadFile=" + r;
    } else if (r.indexOf(".map") > 0) {
        fileLocation = getSystemResourcePath() + "/workspace/web/transformer.html?loadFile=" + r;
    }
    return fileLocation;
}

let retainingJson = [];
prepareRetainJson(parentText, parentType, obj) {
    for (var i = 0 ; i < obj.length ; i++) {

        if (null != obj[i].children && obj[i].children.length > 0) {
            mySyncloop.prepareRetainJson(parentText + obj[i].text + "/", parentType + obj[i].type + "/", obj[i].children);
        } else {
            retainingJson.push({"path": parentText + obj[i].text, "typePath": parentType + obj[i].type})
        }
    }
}

decorateError(nodeId) {
    let hasError = false;
    let node = flowDesignerJsTreeRef.get_node(nodeId);
    if (null == node.data || null == node.data.guid) {
        return hasError;
    }

    var nodeAnchor=$("#"+nodeId+"_anchor");
    let innerText = nodeAnchor[0].innerText.toUpperCase();
    if (innerText.includes(":")) {
        innerText = nodeAnchor[0].innerText.toUpperCase().slice(0, nodeAnchor[0].innerText.toUpperCase().indexOf(":")).trim();
    }

    let strResponse = JSON.parse(localStorage.getItem("simulate_response"));
    if (null == strResponse) {
        return hasError;
    }
    let itemFound = [];
    strResponse.map(item => {
        if (item.guid == node.data.guid) {
            itemFound.push(item);
        }
    });

    let currentFile = loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main").replace(/.flow$/, ".main");

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

            if (null != item[itemKey]) {
                let filtered = item[itemKey].filter(item => Object.keys(item).length > 0);

                filtered.map(item => {
                    if (item["*hasError"]) {
                        if (innerText == "TRANSFORMER" || innerText == "MAP" || innerText == "INVOKE" || innerText == "SERVICE") {
                            $("#" + nodeId + "_anchor").removeClass("green_bg");
                            $("#" + nodeId + "_anchor").removeClass("green_bg_clicked");
                            $("#" + nodeId + "_anchor").addClass("red_bg");
                            $("#" + nodeId + "_anchor").addClass("red_bg_clicked");
                        }
                        hasError = true;
                    }
                });
            }
        });
    }
    return hasError;
}

onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

let INDEX_VAR_IN_SNAP = [];
loadDebuggingData(guid) {
    if (null == guid) {
        return ;
    }

    $(mySyncloop.getWorkspaceRef()).find(".step-guid").html(guid);
    $(mySyncloop.getWorkspaceRef()).find(".step-i-guid").val(guid);

    if (!LOOP_RECURSION) {
        $(mySyncloop.getWorkspaceRef()).find(".loop-index").hide();
        //$(parent.document).find("#loop-index-pre").html("");
        //$(parent.document).find("#loop-index-post").html("");
        //$(parent.document).find("#loop-index-pre").attr("data-val", guid);
        //$(parent.document).find("#loop-index-post").attr("data-val", guid);
        $(mySyncloop.getWorkspaceRef()).find("#pre-indexes").html('');
        $(mySyncloop.getWorkspaceRef()).find("#post-indexes").html('');
    }

    let strResponse = JSON.parse(localStorage.getItem("simulate_response"));
    let itemFound = [];
    strResponse.map(item => {
        if (!LOOP_RECURSION) {
            if (null != item["*indexVar"]) {
                INDEX_VAR_IN_SNAP.push(item["*indexVar"]);
            }
        }
        if (item.guid == guid) {
            itemFound.push(item);
        }
    });

    if (!LOOP_RECURSION) {
        INDEX_VAR_IN_SNAP = INDEX_VAR_IN_SNAP.filter(mySyncloop.onlyUnique);
        for (var j = 0 ; j < INDEX_VAR_IN_SNAP.length ; j++) {
            $(mySyncloop.getWorkspaceRef()).find("#pre-indexes").append('<div class="ac_item loop-index" style="display: none;"><div class="plt_loop"><label>Loop Last ' + INDEX_VAR_IN_SNAP[j] + ':</label><select data-var="' + INDEX_VAR_IN_SNAP[j] + '" data-val="' + guid + '" class="form-control loop-index-pre" id="loop-index-pre-' + INDEX_VAR_IN_SNAP[j].replace("*", "") + '"></select></div></div>');
            $(mySyncloop.getWorkspaceRef()).find("#post-indexes").append('<div class="ac_item loop-index" style="display: none;"><div class="plt_loop"><label>Loop Last ' + INDEX_VAR_IN_SNAP[j] + ':</label><select data-var="' + INDEX_VAR_IN_SNAP[j] + '" data-val="' + guid + '" class="form-control loop-index-post" id="loop-index-post-' + INDEX_VAR_IN_SNAP[j].replace("*", "") + '"></select></div></div>');
        }

        $(mySyncloop.getWorkspaceRef()).find(".loop-index-post, .loop-index-pre").change(function(){
            LOOP_RECURSION = true;
            mySyncloop.loadDebuggingData($(this).attr("data-val"));
        });
    }

    let currentFile = loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main").replace(/.flow$/, ".main");

    if (itemFound.length > 0) {
        let HTML = "";
        let HTML_POST = "";
        itemFound.map(item => {
            let itemKey = "";
            Object.keys(item).forEach(function(ic) {
               if (ic.includes(currentFile)) {
                   itemKey = ic;
               }
            });
            if (null != item[itemKey]) {
                let filteredItem = mySyncloop.processInternalObj(itemKey, item[itemKey]);
                if (null != item["meta"]) {
                    filteredItem["meta"] = item["meta"];
                }
                if (item.before_execution) {
                    let foundLoop = mySyncloop.enableIndexDebuggingLoop(filteredItem, itemKey, true);
                    let displayingIndex = {};
                    $(mySyncloop.getWorkspaceRef()).find(".loop-index-pre").each(function () {
                        displayingIndex[$(this).attr('data-var')] = $(this).val();
                    });
                    HTML += mySyncloop.jsonToTable(filteredItem, itemKey, !$(mySyncloop.getWorkspaceRef()).find("#internal-v-pre").is(":checked"), foundLoop, displayingIndex, "debug-data-pre");
                } else {
                    let foundLoop = mySyncloop.enableIndexDebuggingLoop(filteredItem, itemKey, false);
                    let displayingIndex = {};
                    $(mySyncloop.getWorkspaceRef()).find(".loop-index-post").each(function () {
                        displayingIndex[$(this).attr('data-var')] = $(this).val();
                    });
                    HTML_POST += mySyncloop.jsonToTable(filteredItem, itemKey, !$(mySyncloop.getWorkspaceRef()).find("#internal-v-post").is(":checked"), foundLoop, displayingIndex, "debug-data-post");
                }
                if (!LOOP_RECURSION) {
                    mySyncloop.filterSelectLoopIndexes();
                }
            }
        });
        if (mySyncloop.isInIframe()) {
            // parent.debugDataLoader("#debug-data-pre", HTML);
            // parent.debugDataLoader("#debug-data-post", HTML_POST);
            parent.openDebuggingPanels();
        } else {
            // debugDataLoader("#debug-data-pre", HTML);
            // debugDataLoader("#debug-data-post", HTML_POST);
            openDebuggingPanels();
        }
    } else {
        if (mySyncloop.isInIframe()) {
            parent.closeDebuggingPanels();
        } else {
            closeDebuggingPanels();
        }
    }
}

filterSelectLoopIndexes() {
    $(mySyncloop.getWorkspaceRef()).find(".loop-index-pre, .loop-index-post").each(function () {
        var uniqueValues = [];
        for (var i = 0; i < $(this)[0].options.length; i++) {
            var optionValue = $(this)[0].options[i].value;
            if (uniqueValues.indexOf(optionValue) === -1) {
                uniqueValues.push(optionValue);
            }
        }

        $(this)[0].innerHTML = '';

        for (var i = 0; i < uniqueValues.length; i++) {
            var option = document.createElement('option');
            option.value = uniqueValues[i];
            option.text = uniqueValues[i];
            $(this)[0].appendChild(option);
        }
    });
}

let LOOP_RECURSION = false;
let IS_LOOP_STEP = false;
enableIndexDebuggingLoop(filteredItem, itemKey, before_execution) {
    if (LOOP_RECURSION) {
        return true;
    }

    if (!IS_LOOP_STEP) {
        //return false;
    }
    let foundLoop = false;
    let masterIndexes = {};
    for (var i = 0 ; i < filteredItem.length ; i++) {
        for (var j = 0 ; j < INDEX_VAR_IN_SNAP.length ; j++) {
            if (null != filteredItem[i][itemKey] && null != filteredItem[i][itemKey][INDEX_VAR_IN_SNAP[j]]) {
                foundLoop = true;
                //indexes = filteredItem[i][itemKey]["*index"];
                masterIndexes[INDEX_VAR_IN_SNAP[j]] = filteredItem[i][itemKey][INDEX_VAR_IN_SNAP[j]];
            }
        }
    }
    if (foundLoop) {
        if (before_execution) {
            for (var j = 0 ; j < INDEX_VAR_IN_SNAP.length ; j++) {
                if (null == masterIndexes[INDEX_VAR_IN_SNAP[j]]) {
                    continue;
                }
                $(mySyncloop.getWorkspaceRef()).find("#loop-index-pre-" + INDEX_VAR_IN_SNAP[j].replace("*", "")).append("<option>" + masterIndexes[INDEX_VAR_IN_SNAP[j]] + "</option>");
            }
        } else {
            for (var j = 0 ; j < INDEX_VAR_IN_SNAP.length ; j++) {
                if (null == masterIndexes[INDEX_VAR_IN_SNAP[j]]) {
                    continue;
                }
                $(mySyncloop.getWorkspaceRef()).find("#loop-index-post-" + INDEX_VAR_IN_SNAP[j].replace("*", "")).append("<option>" + masterIndexes[INDEX_VAR_IN_SNAP[j]] + "</option>");
            }
        }

        $(mySyncloop.getWorkspaceRef()).find(".loop-index").show();
    }
    return foundLoop;
}

$(document).ready(function () {
    $(mySyncloop.getWorkspaceRef()).find("#internal-v-pre, #internal-v-post").click(function(){
        mySyncloop.loadDebuggingData($(this).val());
    });
});

determineLoop(filteredItem, displayIndex) {
    let json = {};
    function find(obj) {
        for (let key in obj) {
            if (typeof obj[key] === 'object') {
                find(obj[key]);
            } else {
                json[key] = obj[key];
            }
        }
    }
    find(filteredItem);
    let count = 0;

    for (var j = 0 ; j < INDEX_VAR_IN_SNAP.length ; j++) {
        if (json[INDEX_VAR_IN_SNAP[j]] == displayIndex[INDEX_VAR_IN_SNAP[j]]) {
            count++;
        }
    }

    return Object.keys(displayIndex).length == count;
}

jsonToTable(json, itemKey, hideInternal, foundLoop, displayIndex, renderingPanel) {
    if (foundLoop) {
        let requiredToDisplay = mySyncloop.determineLoop(json, displayIndex);
        if (!requiredToDisplay) {
            return "";
        }
    }
    let table = '<table>';

    function parseObject(obj, itemKey, prefix) {
        let rows = '';
        for (let key in obj) {
            if (obj.hasOwnProperty(key) && !(key.includes("*") && hideInternal)) {
                let row = '<tr>';
                if (isNaN(key)) {
                    row += `<td class='spce_1'>${prefix}${key}</td>`;
                }

                if (typeof obj[key] === 'object') {
                    row += '<td>' + parseObject(obj[key], itemKey, "" + prefix) + '</td>';
                } else {
                    //if (isNaN(key)) {
                        row += `<td class='spce_2'>&nbsp;&nbsp;${obj[key]}</td>`;
                    //}
                }

                row += '</tr>';
                rows += row;
            }
        }
        return rows;
    }

    table += parseObject(json, itemKey, "");
    table += '</table>';
    let finalJson = {};
    for (var i = 0 ; i < json.length ; i++) {
        Object.keys(json[i]).map(k => {
            finalJson[k] = json[i][k];
        });
    }
    if (null != json["meta"]) {
        finalJson["meta"] = json["meta"];
    }
    if (mySyncloop.isInIframe()) {
        parent.document.getElementById(renderingPanel).innerHTML = "";
        mySyncloop.displayJSON(parent.document.getElementById(renderingPanel), finalJson, hideInternal, null);
    } else {
        document.getElementById(renderingPanel).innerHTML = "";
        mySyncloop.displayJSON(document.getElementById(renderingPanel), finalJson, hideInternal, null);
    }

    return "";//table + "<br /><br /><br />";
}

displayJSON(element, data, hideInternal, parentKey) {
    for (let key in data) {
        if ((key.includes("*") && hideInternal)) {
            continue;
        }
        const item = document.createElement('div');
        if (typeof data[key] === 'object' && data[key] !== null) {
            let theKey = key;
            if (!isNaN(key)) {
                theKey = parentKey + `[${key}]`;
            } else if (theKey.indexOf("packages.") == 0) {
                theKey = "Variables";
            }
            item.innerHTML = `<span class="json-toggle">- </span> <span class="json-key">${theKey}:</span>`;
            const childContainer = document.createElement('div');
            childContainer.style.display = "";
            item.appendChild(childContainer);
            item.querySelector('.json-toggle').addEventListener('click', function() {
                if (childContainer.style.display === "none") {
                    childContainer.style.display = "";
                    this.textContent = "- ";
                } else {
                    childContainer.style.display = "none";
                    this.textContent = "+ ";
                }
            });

            if (Array.isArray(data[key])) {
                childContainer.classList.add('json-array');
                mySyncloop.displayJSON(childContainer, data[key], hideInternal, key);
            } else {
                childContainer.classList.add('json-object');
                mySyncloop.displayJSON(childContainer, data[key], hideInternal, null);
            }
        } else {
            item.innerHTML = `<span class="json-key">${key}:</span> ${data[key]}`;
        }
        element.appendChild(item);
    }
}

processInternalObj (key, obj) {
    let newObj = obj.filter(item => Object.keys(item).length > 0);
    return newObj;
}

stopSimulation() {
    localStorage.removeItem("simulation_snapshot");
    localStorage.removeItem("simulating_service");
    localStorage.removeItem("simulate_response");
    location.reload();
}

predictMyLoopIdentifier(ref, id, LOOP_IDENTIFIER_COUNT) {
    let pId = ref.get_parent(id);
    if ("#" != pId) {
        //if (ref.get_node(id).type == "foreach" || ref.get_node(id).type == "redo" || ref.get_node(id).type == "repeat") {
            LOOP_IDENTIFIER_COUNT++;
        //}
        return mySyncloop.predictMyLoopIdentifier(ref, pId, LOOP_IDENTIFIER_COUNT);
    }
    return LOOP_IDENTIFIER_COUNT;
}

getWorkspaceRef() {
    if (mySyncloop.isInIframe()) {
        return parent.document;
    }
    return document;
}


serviceInputToSchema() {
    let payload = [];
    let requestHeaders = {};
    let queryParameters = [];
    let pathParameters = {};
    let inputJson = inputJstreeRef.get_json('#', {flat:false});
    for (let i = 0 ; i < inputJson.length ; i++) {
        if (inputJson[i].text == "*payload" || inputJson[i].text == "payload") {
            payload.push(inputJson[i]);
        } else if (inputJson[i].text == "*requestHeaders" || inputJson[i].text == "requestHeaders") {
            requestHeaders = inputJson[i];
        } else if (inputJson[i].text == "*pathParameters" || inputJson[i].text == "pathParameters") {
            pathParameters = inputJson[i];
        } else if (inputJson[i].text == "queryParameters" || inputJson[i].type == "integer" || inputJson[i].type == "string"
            || inputJson[i].type == "number" || inputJson[i].type == "date" || inputJson[i].type == "boolean"
            || inputJson[i].type == "integerList" || inputJson[i].type == "stringList"
            || inputJson[i].type == "numberList" || inputJson[i].type == "dateList" || inputJson[i].type == "booleanList") {
            queryParameters.push(inputJson[i]);
        } else {
            payload.push(inputJson[i]);
        }
    }

    var urlLoadFile = loadFile.trim() + "$";
    var packageName = ("/" + urlLoadFile).replace("/files/", "alias?fqn=").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main");
    //var packageName=("/"+loadFile).replace("/files/","alias?fqn=").replace(".service",".main").replace(".flow",".main");
    packageName = packageName.split("/").join(".");
    //alert(packageName);
    var urlPath = "/" + packageName;
    var response = mySyncloop.syncRestRequest(urlPath, "GET", "");

    let alias = "";

    response = JSON.parse(response.payload);

    if (response.status == 404) {
        alias = "GET/" + ("/" + urlLoadFile).replace("/files/", "").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main").split("/").join(".");
    } else {
        alias = response.alias;
    }

    localStorage.setItem("json_recent_params", JSON.stringify({
        "requestHeaders": (null != requestHeaders.children) ? requestHeaders.children : {},
        "queryParameters": (null == queryParameters) ? [] : queryParameters,
        "pathParameters": (null == pathParameters.children) ? {} : pathParameters.children,
        "alias": alias,
        "serviceName": (loadFile.split("/")[loadFile.split("/").length - 1]).replace(".api", "").replace(".flow", ""),
        "fqn": ("/" + urlLoadFile).replace("/files/", "").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main").split("/").join(".")
    }));

    mySyncloop.asyncRestRequest("/packages.middleware.pub.util.SyncloopIOtoSchema.main", JSON.stringify({
        "json": JSON.stringify(payload)
    }) , "POST", function (resp) {

        localStorage.setItem("json_recent_schema", JSON.stringify(resp.schema));
       localStorage.setItem("json_recent_schema_json", "{}");
       localStorage.setItem("is_payload_missing", payload.length == 0);

        $("#test_popup_id").attr("src", getSystemResourcePath() + "/workspace/web/api-service-ui-client.html");

        var modal = document.getElementById("testModelDialog");
        var p = document.getElementById("closeTestModelDialog");
        modal.style.display = "block";
        p.onclick = function() {
            modal.style.display = "none";
        }

    });
}


openEvnirUpdatepopup() {
    var modal = document.getElementById("newUpdateModelDialog");
    var span = document.getElementById("closenewUpdateModelDialog");
    modal.style.display = "block";
    span.onclick = function() {
        modal.style.display = "none";

    }
}

}
