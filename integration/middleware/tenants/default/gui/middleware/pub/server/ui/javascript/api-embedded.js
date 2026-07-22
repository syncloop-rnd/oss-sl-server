
function addHttpClient(id) {
    SILENT_SERVICE_ADD = true;
    var ref = $(id).jstree(true);
    var sel = createSchema("invoke", ref);

    var node=ref.get_node(sel);
    var nodeText="request";
    if(node.text!=nodeText){
        mapperObj.clean();
        node.data.lines=null;
        node.data.transformers=null;
        node.data.fqn="packages/middleware/pub/client/http/request";
        launching_arrow_jsTree_function_ref.settings.core.data=[];
        launching_arrow_jsTree_function_ref.refresh();
        landing_arrow_jsTree_function_ref.settings.core.data=[];
        landing_arrow_jsTree_function_ref.refresh();
        //ref.rename_node(node,nodeText);
        node.data.serviceType="service";
        ref.select_node(node.id);

        replaceAndAdd(sel);
    }
    // node.text=
    localStorage.setItem("enableServiceSelectionMode",false);
    //alert(localStorage.getItem("currentSelectedService"));
    //ref.refresh();
    $(menu).hide();
}

function addDebugLog(id) {
    SILENT_SERVICE_ADD = true;
    var ref = $(id).jstree(true);
    var sel = createSchema("invoke", ref);

    var node=ref.get_node(sel);
    var nodeText="debugLog";
    if(node.text!=nodeText){
        mapperObj.clean();
        node.data.lines=null;
        node.data.transformers=null;
        node.data.fqn="packages/middleware/pub/service/debugLog";
        launching_arrow_jsTree_function_ref.settings.core.data=[];
        launching_arrow_jsTree_function_ref.refresh();
        landing_arrow_jsTree_function_ref.settings.core.data=[];
        landing_arrow_jsTree_function_ref.refresh();
        //ref.rename_node(node,nodeText);
        node.data.serviceType="service";
        ref.select_node(node.id);
        replaceAndAdd(sel);
    }
    // node.text=
    localStorage.setItem("enableServiceSelectionMode",false);
    //alert(localStorage.getItem("currentSelectedService"));
    //ref.refresh();
    $(menu).hide();
}

function execTestPopup() {
    let RECENT_DATA = save(null, true);
    localStorage.setItem("RECENT_DATA", RECENT_DATA);
    localStorage.setItem("SERVICE_ENDPOINT", SERVICE_ENDPOINT);
    $(".test_api").html("...");
    $.ajax({
        type: "POST",
        url: SERVICE_ENDPOINT + "/tenant/default/public/jsonToSchema",
        headers: { "Authorization": `Bearer ${localStorage.getItem("AuthToken")}` },
        data: JSON.stringify({
            "json": JSON.stringify(JSON.parse(localStorage.getItem("RECENT_DATA")).latest.input)
        }),
        contentType: "application/json", // Set content type to JSON
        success: function(response) {
            localStorage.setItem("JSON_SCHEMA", JSON.stringify(response));
            $("#target_page").attr("src", "testPopup.html");
            $("#editor-modal").show();
            $(".test_api").html("Test");
        },
        error: function(xhr, status, error) {
            console.log(error);
            $(".test_api").html("Test");
        }
    });
}

$(document).ready(function () {
    $("#closeDebugModelDialog").click(function () {
        $("#editor-modal").hide();
    })
})

function enableEmbeddedTest() {
    IS_TEST_ENABLED = true;
    if (SDK_EMBEDDED && IS_TEST_ENABLED) {
        $("#test-button").show();
    }
}

function enableEmbeddedTrace() {
    IS_TRACE_ENABLED = true;
}

function disableEmbeddedTrace() {
    IS_TRACE_ENABLED = false;
}

function simulationReady() {
    flowDesignerJsTreeRef.deselect_all();
    flowDesignerJsTreeRef.settings.core.data = flowDesignerJsTreeRef.get_json('#', {
        flat: false
    });
    flowDesignerJsTreeRef.refresh();
    if (localStorage.getItem("simulation_snapshot")) {
        $("#stop_simulation_emd_btn").show();
    }
}
