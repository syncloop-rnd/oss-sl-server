if (window.location.pathname.indexOf("/middleware/pub/server/ui/workspace/") !== -1 &&
    localStorage.getItem("AuthToken") && !localStorage.getItem("tenant")) {
    location.replace("/middleware/pub/server/ui/tenant/selectTenant.html?r=" + encodeURIComponent(window.location.href));
}

function resolveUrl(url) {
    if (!url) return url;
    return window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + url;
}

let showFailureAlert = true;

function packagesHealthHit() {
    asyncRestRequest(
        "/packages.middleware.pub.server.build.api.SysInfo.main",
        null,
        "GET",
        function (response) {
            showFailureAlert = true;
        },
        function (errormessage) {
            if (errormessage.status >= 500 && errormessage.status < 600) {
                if (showFailureAlert) {
                    alert("System service is down (5xx error). Please check server health.");
                    showFailureAlert = false;
                }
            }

        },
        30000 // ⏱ 30 seconds timeout
    );
}

//packagesHealthHit();
//setInterval(packagesHealthHit, 5000);

function clearCacheExceptAuth() {
    const authToken = localStorage.getItem("AuthToken");
    const tenant = localStorage.getItem("tenant");

    localStorage.clear();
    sessionStorage.clear();
    deleteAllCookies();

    if (authToken) {
        localStorage.setItem("AuthToken", authToken);
    }
    if (tenant) {
        localStorage.setItem("tenant", tenant);
    }

    asyncRestRequest("/packages.Awareness.dashboard.services.api.initialize.main", null,  "GET", function (response) {
    }, function(errormessage) {
    });

    asyncRestRequest("/packages.middleware.pub.service.reloadJars.main", null,  "GET", function (response) {
    }, function(errormessage) {
    });

    location.reload(true);
}


function toggleAuthFields() {
        const authType = document.getElementById('credential_type').value;
        const basicAuthFields = document.getElementById('basic_auth_fields');
        const bearerAuthFields = document.getElementById('bearer_auth_fields');
        const awsAuthFields = document.getElementById('aws_auth_fields');
        const apiKeyAuthFields = document.getElementById('apikey_auth_fields');

        if (basicAuthFields) {
            basicAuthFields.style.display = 'none';
        }
        if (bearerAuthFields) {
            bearerAuthFields.style.display = 'none';
        }
        if (awsAuthFields) {
            awsAuthFields.style.display = 'none';
        }
        if (apiKeyAuthFields) {
            apiKeyAuthFields.style.display = 'none';
        }

        if (authType === 'BASIC' && basicAuthFields) {
            basicAuthFields.style.display = 'block';
        } else if (authType === 'Bearer' && bearerAuthFields) {
            bearerAuthFields.style.display = 'block';
        } else if (authType === 'AWS' && awsAuthFields) {
            awsAuthFields.style.display = 'block';
        } else if (authType === 'API_KEY' && apiKeyAuthFields) {
            apiKeyAuthFields.style.display = 'block';
        }
    }

function resetCredentialForm() {
    $("#credential_name").val("");
    $("#credential_type").val("");

    $("#credential_username").val("");
    $("#credential_password").val("");
    $("#credential_bearer_token").val("");

    $("#aws_access_key").val("");
    $("#aws_secret_key").val("");
    $("#aws_region").val("");
    $("#aws_service_name").val("");

    $("#apikey_key").val("");
    $("#apikey_value").val("");
    $("#apikey_add_to").val("Header");

    $("#credential_password").attr("type", "password");
    $("#credentialsModal .password-toggle-btn i")
        .removeClass("fa-eye-slash")
        .addClass("fa-eye");

    $("#credentialsModal .modal-footer .btn-primary")
        .removeAttr("disabled")
        .html("Save");

    toggleAuthFields();
}
// UPDATE CRED MODAL
function toggleUpdateCredentialAuthFields() {
    const authType = document.getElementById('update_credential_type').value;
    const updateBasicAuthFields = document.getElementById('update_basic_auth_fields');
    const updateBearerAuthFields = document.getElementById('update_bearer_auth_fields');
    const updateAwsAuthFields = document.getElementById('update_aws_auth_fields');
    const updateApiKeyAuthFields = document.getElementById('update_apikey_auth_fields');

    if (updateBasicAuthFields) {
        updateBasicAuthFields.style.display = 'none';
    }
    if (updateBearerAuthFields) {
        updateBearerAuthFields.style.display = 'none';
    }
    if (updateAwsAuthFields) {
        updateAwsAuthFields.style.display = 'none';
    }
    if (updateApiKeyAuthFields) {
        updateApiKeyAuthFields.style.display = 'none';
    }

    if (authType === 'BASIC' && updateBasicAuthFields) {
        updateBasicAuthFields.style.display = 'block';
    } else if (authType === 'Bearer' && updateBearerAuthFields) {
        updateBearerAuthFields.style.display = 'block';
    } else if (authType === 'AWS' && updateAwsAuthFields) {
        updateAwsAuthFields.style.display = 'block';
    } else if (authType === 'API_KEY' && updateApiKeyAuthFields) {
        updateApiKeyAuthFields.style.display = 'block';
    }
}

function getCredentialsCollection(response) {
    if (response && Array.isArray(response.credentials)) {
        return response.credentials;
    }

    if (response && Array.isArray(response.credentialsList)) {
        return response.credentialsList;
    }

    return [];
}

function getCredentialMetaMap(credential) {
    let metaMap = {};

    function storeMetaValue(key, value) {
        if (key) {
            metaMap[key] = value || "";
            metaMap[String(key).toLowerCase()] = value || "";
            metaMap[String(key).toLowerCase().replace(/[_\s-]/g, "")] = value || "";
        }
    }

    const metadata = credential ? (credential.meta || credential.metadata || []) : [];

    if (Array.isArray(metadata)) {
        metadata.forEach(function (metaItem) {
            const key = metaItem.key || metaItem.ob_key;
            const value = metaItem.value || metaItem.ob_val;
            storeMetaValue(key, value);
        });
    } else if (metadata && typeof metadata === "object") {
        Object.keys(metadata).forEach(function (key) {
            storeMetaValue(key, metadata[key]);
        });
    }

    return metaMap;
}

function normalizeCredentialType(type) {
    const normalizedType = String(type || "").trim().toUpperCase().replace(/\s+/g, "_");

    if (normalizedType === "BASIC") {
        return "BASIC";
    }

    if (normalizedType === "AWS" || normalizedType === "AWS_SIGNATURE") {
        return "AWS";
    }

    if (normalizedType === "API_KEY" || normalizedType === "APIKEY" || normalizedType === "API-KEY") {
        return "API_KEY";
    }

    if (normalizedType === "BEARER" || normalizedType === "BEARER_TOKEN") {
        return "Bearer";
    }

    return "BASIC";
}

function getMetaValue(metaMap, aliases, fallbackValue) {
    for (let i = 0; i < aliases.length; i++) {
        const alias = aliases[i];
        const normalizedAlias = String(alias).toLowerCase();
        const compactAlias = normalizedAlias.replace(/[_\s-]/g, "");

        if (metaMap[alias] !== undefined && metaMap[alias] !== null && metaMap[alias] !== "") {
            return metaMap[alias];
        }

        if (metaMap[normalizedAlias] !== undefined && metaMap[normalizedAlias] !== null && metaMap[normalizedAlias] !== "") {
            return metaMap[normalizedAlias];
        }

        if (metaMap[compactAlias] !== undefined && metaMap[compactAlias] !== null && metaMap[compactAlias] !== "") {
            return metaMap[compactAlias];
        }
    }

    return fallbackValue || "";
}

let CURRENT_UPDATE_CREDENTIAL = null;

function resetUpdateCredentialForm() {
    $("#update_credential_id").val("");
    $("#update_credential_name").val("");
    $("#update_credential_type").val("BASIC");
    $("#update_credential_username").val("");
    $("#update_credential_password").val("");
    $("#update_credential_bearer_token").val("");
    $("#update_aws_access_key").val("");
    $("#update_aws_secret_key").val("");
    $("#update_aws_region").val("");
    $("#update_aws_service_name").val("");
    $("#update_apikey_key").val("");
    $("#update_apikey_value").val("");
    $("#update_apikey_add_to").val("Header");
    CURRENT_UPDATE_CREDENTIAL = null;
    toggleUpdateCredentialAuthFields();
}

function populateUpdateCredentialForm(credential) {
    resetUpdateCredentialForm();
    CURRENT_UPDATE_CREDENTIAL = credential;

    const type = normalizeCredentialType(credential.type);
    const metaMap = getCredentialMetaMap(credential);

    $("#update_credential_id").val(credential.id || "");
    $("#update_credential_name").val(credential.name || "");
    $("#update_credential_type").val(type);

    if (type === "BASIC") {
        $("#update_credential_username").val(credential.username || credential.api_username || getMetaValue(metaMap, ["username", "api_username"]));
        $("#update_credential_password").val(credential.password || credential.api_password || getMetaValue(metaMap, ["password", "api_password"]));
    } else if (type === "Bearer") {
        $("#update_credential_bearer_token").val(getMetaValue(metaMap, ["token", "bearerToken", "bearer_token", "bearer"]));
    } else if (type === "AWS") {
        $("#update_aws_access_key").val(getMetaValue(metaMap, ["accessKey", "access_key", "accesskey", "awsAccessKey"]));
        $("#update_aws_secret_key").val(getMetaValue(metaMap, ["secretKey", "secret_key", "secretkey", "awsSecretKey"]));
        $("#update_aws_region").val(getMetaValue(metaMap, ["region", "awsRegion", "aws_region"]));
        $("#update_aws_service_name").val(getMetaValue(metaMap, ["serviceName", "SERVICE", "service_name", "service"]));
    } else if (type === "API_KEY") {
        $("#update_apikey_key").val(getMetaValue(metaMap, ["key", "apiKey", "api_key"]));
        $("#update_apikey_value").val(getMetaValue(metaMap, ["value", "apiValue", "api_value"]));
        $("#update_apikey_add_to").val(getMetaValue(metaMap, ["addTo", "add_to", "location"], "Header"));
    }

    toggleUpdateCredentialAuthFields();
}

function openCredentialEditModal(id) {
    asyncRestRequest(
        "/packages.middleware.pub.environments.api.listAllCredentials.main",
        null,
        "GET",
        function (response) {
            const credentials = getCredentialsCollection(response);
            const credential = credentials.find(function (item) {
                return String(item.id) === String(id);
            });

            if (!credential) {
                swal({
                    title: "Credential not found.",
                    text: "",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                return;
            }

            populateUpdateCredentialForm(credential);
            $("#updateCredentialsModal").modal("show");
        },
        function () {
            swal({
                title: "Unable to load credential details.",
                text: "",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
        }
    );
}

function buildUpdateCredentialMetadata(type) {
    let metadata = [];

    if (type === "Bearer") {
        metadata.push({ ob_key: "token", ob_val: $("#update_credential_bearer_token").val().trim() });
    } else if (type === "API_KEY") {
        metadata.push({ ob_key: "key", ob_val: $("#update_apikey_key").val().trim() });
        metadata.push({ ob_key: "value", ob_val: $("#update_apikey_value").val().trim() });
        metadata.push({ ob_key: "addTo", ob_val: $("#update_apikey_add_to").val() });
    } else if (type === "AWS") {
        metadata.push({ ob_key: "accessKey", ob_val: $("#update_aws_access_key").val().trim() });
        metadata.push({ ob_key: "secretKey", ob_val: $("#update_aws_secret_key").val().trim() });
        metadata.push({ ob_key: "region", ob_val: $("#update_aws_region").val().trim() });
        metadata.push({ ob_key: "serviceName", ob_val: $("#update_aws_service_name").val().trim() });
    }

    return metadata;
}

function buildUpdateCredentialValidationPayload(type) {
    let validationPayload = {
        type: type,
        name: $("#update_credential_name").val().trim(),
        api_username: "",
        api_password: "",
        meta: []
    };

    if (type === "BASIC") {
        validationPayload.api_username = $("#update_credential_username").val().trim();
        validationPayload.api_password = $("#update_credential_password").val().trim();
    } else if (type === "Bearer") {
        validationPayload.meta.push({ key: "token", value: $("#update_credential_bearer_token").val().trim() });
    } else if (type === "API_KEY") {
        validationPayload.meta.push({ key: "key", value: $("#update_apikey_key").val().trim() });
        validationPayload.meta.push({ key: "value", value: $("#update_apikey_value").val().trim() });
        validationPayload.meta.push({ key: "addTo", value: $("#update_apikey_add_to").val() });
    } else if (type === "AWS") {
        validationPayload.meta.push({ key: "accessKey", value: $("#update_aws_access_key").val().trim() });
        validationPayload.meta.push({ key: "secretKey", value: $("#update_aws_secret_key").val().trim() });
        validationPayload.meta.push({ key: "region", value: $("#update_aws_region").val().trim() });
        validationPayload.meta.push({ key: "serviceName", value: $("#update_aws_service_name").val().trim() });
    }

    return validationPayload;
}

function buildUpdateCredentialPayload() {
    let type = $("#update_credential_type").val() || "BASIC";
    const currentUsername = CURRENT_UPDATE_CREDENTIAL ? (CURRENT_UPDATE_CREDENTIAL.username || CURRENT_UPDATE_CREDENTIAL.api_username || "") : "";
    const currentPassword = CURRENT_UPDATE_CREDENTIAL ? (CURRENT_UPDATE_CREDENTIAL.password || CURRENT_UPDATE_CREDENTIAL.api_password || "") : "";
    let payload = {
        credentialId: $("#update_credential_id").val().trim(),
        type: type,
        name: $("#update_credential_name").val().trim(),
        username: currentUsername,
        password: currentPassword,
        metadata: []
    };

    if (type === "BASIC") {
        payload.username = $("#update_credential_username").val().trim();
        payload.password = $("#update_credential_password").val().trim();
    }

    payload.metadata = buildUpdateCredentialMetadata(type);

    return payload;
}


function submitUpdateCredential(ref) {
    let type = $("#update_credential_type").val() || "BASIC";
    let validationPayload = buildUpdateCredentialValidationPayload(type);
    let payload = buildUpdateCredentialPayload();

    if (!credentialValidator(validationPayload)) {
        return;
    }

    $(ref).attr('disabled', 'disabled').html('...');

    asyncRestRequest(
        "/packages.middleware.pub.environments.api.updateCredential.main",
        JSON.stringify(payload),
        "POST",
        function (response) {
            $(ref).removeAttr('disabled').html('Update');

            if (response.status === true || response.success === true) {
                swal({
                    title: "Updated successfully.",
                    text: "",
                    type: "success",
                    confirmButtonColor: "#2C61F5",
                    customClass: "credential-update-success"
                });

                $("#updateCredentialsModal").modal('hide');
                resetUpdateCredentialForm();

                if (typeof credentialsTable !== "undefined") {
                    credentialsTable.ajax.reload(null, false);
                }
            } else {
                swal({
                    title: "Error Occurred. Please try again.",
                    text: response.error || "",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
            }
        },
        function (error) {
            $(ref).removeAttr('disabled').html('Update');
            swal({
                title: "Error Occurred. Please try again.",
                text: error && error.responseJSON && error.responseJSON.error ? error.responseJSON.error : "",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
        }
    );
}

$(document).ready(function () {
    $("#credentialsModal").on("show.bs.modal", function () {
        resetCredentialForm();
    });

    $("#credentialsModal").on("hidden.bs.modal", function () {
        resetCredentialForm();
    });

    $("#updateCredentialsModal").on("hidden.bs.modal", function () {
        resetUpdateCredentialForm();
    });
});

let SILENT_SERVICE_ADD = false;

function disableF2Key(event) { // Disable F2 Rename
    if (event.key === 'F2' || event.keyCode === 113) {
        // event.preventDefault();
        // event.stopPropagation();
        // return false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('keydown', disableF2Key, true);

    document.addEventListener('click', function(event) {
        const target = event.target;

        if (target.tagName === 'A') {
            const href = target.getAttribute('href');
            if (href && href.startsWith('http')) {
                event.preventDefault();
                window.open(href, '_blank');
            }
        }
    });
});

const LOADED_SERVICE_IO = {};

function getSystemResourcePath() {
    if (SDK_EMBEDDED) {
        return "../../..";
    } else {
        return "middleware/pub/server/ui";
    }
}

function getUrlParam(name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)')
        .exec(window.location.search);

    var uniqueResult = new RegExp('[\?&]_id=([^&#]*)')
        .exec(window.location.search);
    if ((uniqueResult !== null) && false) {
        return uniqueResult[1] || 0;
    }

    return (results !== null) ? results[1] || 0 : false;
}

function handleSessionExpired(errormessage) {
    if (typeof swal === "function" && errormessage.status === 401) {
        swal(
            {
                title: "Session Expired",
                text: "Your session has been expired. Please login again.",
                type: "error",
                showCancelButton: true,
                confirmButtonColor: "#f2533e",
                cancelButtonText: "No, Stay here !!",
                confirmButtonText: "Login",
                showLoaderOnConfirm: true,
                closeOnConfirm: true,
                closeOnCancel: true
            },
            function (isConfirm) {
                if (isConfirm) {
                    doSessionExpiredLogout();
                } else {
                    swal({
                        title: "Stay here !!",
                        text: "",
                        type: "warning",
                        confirmButtonColor: "#f2533e"
                    });
                }
            }
        );
        return true; // handled
    }
    return false; // not handled
}


function syncRestRequest(url, method, payload, contentType, dataType) {
    var response = {};
    var status = 200;
    if (contentType == null)
        contentType = "application/json";
    if (dataType == null)
        dataType = "application/json";
    $.ajax({
        url: resolveUrl(url), // url where to submit the request
        type: method, // type of action POST || GET
        contentType: contentType,
        dataType: dataType, // data type
        data: payload, // post data || get data
        async: false,
        headers: { "Authorization": `Bearer ${localStorage.getItem("AuthToken")}` },
        success: function (result) {

            // you can see the result from the console
            // tab of the developer tools
            response = result;
            //alert(result);
            console.log(result);
        },
        error: function (errormessage) {
            status = errormessage.status;

            if (errormessage.status == 200) {
                response = errormessage.responseText;
            } else {

                if (handleSessionExpired(errormessage)) {
                    return;
                }

                console.log(errormessage.status);
                response = errormessage.responseText;
            }
        }
    })
    return {
        "status": status,
        "payload": response
    };
}

function removeIcons(jsonObject) {
    jQuery.each(jsonObject, function (i, val) {
        if (val.icon) {
            val.icon = null;
        }
        if (val.children) {
            removeIcons(val.children);
        }
    });
}

function asyncRestRequest(url, payload, method, callBack, errorCallback) {
    $.ajax({
        url: resolveUrl(url), // url where to submit the request
        type: method, // type of action POST || GET
        contentType: 'application/json',
        dataType: 'json', // data type
        data: payload, // post data || get data
        headers: { "Authorization": `Bearer ${localStorage.getItem("AuthToken")}` },
        success: function (result) {
            callBack(result);
        },
        error: function (errormessage) {

            if (handleSessionExpired(errormessage)) {
                return;
            }

            if (typeof errorCallback === 'function') {
                errorCallback(errormessage);
            } else {
                console.log(errormessage.status, errormessage.responseText);
            }
            //alert(errormessage.responseText);
            //swal("Error", errormessage.responseText, "error")
        }
    })
}

function asyncRestRequestV2(url, payload, method, callBack, errorCallback) {
    var contentTypeValue = 'application/json';

    if (payload instanceof FormData) {
        contentTypeValue = false;
    }

    $.ajax({
        url: resolveUrl(url),
        type: method,
        contentType: contentTypeValue,
        processData: contentTypeValue ? true : false,
        dataType: 'json',
        data: payload,
        headers: { "Authorization": `Bearer ${localStorage.getItem("AuthToken")}` },
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
    });
}

function deleteAllCookies() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

function iterateObject(obj, parentObj, parentKey) {
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            iterateObject(obj[key], obj, key); // Recursive call for nested objects
        } else {
            //console.log(key, obj[key]);
            if (key == "$ref") {
              if (obj[key].startsWith("https://")) {
              asyncRestRequest("/packages.middleware.pub.client.http.requestAPI.main",  JSON.stringify({
                      url: obj[key],
                      method: "GET"
                  }), "POST",
                  function (response) {
                      if (null != parentObj) {
                          parentObj[parentKey] = (response.respPayload).properties;
                      }
                  },
                  function (error) {
                      console.log("Error in method iterateObject()");
                  });
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

function iterateObjectOptz(obj, parentObj, parentKey) {
    for (var key in obj) {
        if (key.includes(":")) {
            var nKey = key.slice(key.indexOf(":") + 1);
            obj[nKey] = obj[key];
            delete obj[key];
            key = nKey;
        }

        if (typeof obj[key] === 'object' && obj[key] !== null) {
            iterateObjectOptz(obj[key], obj, key); // Recursive call for nested objects
        } else {

        }
    }
}

var JSONSchemaData = null;
function getJstreeFromSchema(jsonSchema) {
    try {
        var MainJson = JSON.parse(jsonSchema);
        JSONSchemaData = MainJson;
        iterateObject(MainJson);
        //iterateObjectOptz(MainJson);
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
        var data = toJson(datapipeline, null, null);
        var jsonJstreeObj = data[0];
        var jsonObj = data[1];
        return jsonJstreeObj;
    } catch (err) {
        swal({
            title: "Error",
            text: err.message,
            type: "error",
            confirmButtonColor: "#f2533e"
            });

        throw err;
    }
}

function toJson(jsonSchemaObj, isArray, requiredList) {
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
            let jsonOA = toJson(propVal.properties, null, propVal.required);
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

function copyToClipboard(textToCopy) {
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

function renameVariable(tree, node){
    let oldPath = null;
    if (typeof landing_arrow_jsTree_ref !== 'undefined') {
        oldPath = landing_arrow_jsTree_ref.get_path(node, '/');
    }
    tree.edit(node, null, function (node_val, status) {
        var newtree = $('#input_schema_editor_jsTree').jstree(true);
        var originalPath = newtree.get_path(node, '/');
        var res = validateVariableName(node_val.text, node);
        if (res != 0 || !status){
            if (!status){
                res = "Item with this name is already created. Please try some different name";
                node.text = " ";
            }
            swal({
                title: 'Error',
                text: res,
                type: 'error',
                confirmButtonColor: '#f2533e'
                });

            renameVariable(tree, node);
        }

        const newPath = newtree.get_path(node, '/'); // New path after renaming

        if (node_val.data && Array.isArray(node_val.data.assignList)) {
            node_val.data.assignList = node_val.data.assignList.map(item => {
                item.path = newPath;
                return item;
            });
        }

        // Recursive function to update children
        function updateChildrenPaths(currentNode) {
            if (currentNode.children && currentNode.children.length > 0) {
                currentNode.children.forEach(childId => {
                    var childNode = newtree.get_node(childId);
                    if (childNode.data && Array.isArray(childNode.data.assignList)) {
                        childNode.data.assignList = childNode.data.assignList.map(item => {
                            item.path = originalPath + "/" + childNode.text;
                            return item;
                        });
                    }
                    updateChildrenPaths(childNode);
                });
            }
        }

        if (node_val.children && node_val.children.length > 0) {
            updateChildrenPaths(node_val);
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
        } else if (tree.element[0].id === "landing_arrow_jsTree" ){
            mapperObj.renameInitiatedData(oldPath,
                landing_arrow_jsTree_ref.get_path(node_val, '/'));
        }

    });
}

function IOSchemaMenu(node, id) {

    if (SDK_EMBEDDED) {
        loadFile = false;
    }
    var variableParent = node.parents;
    var payloadFlag = false;

    variableParent.forEach(function (parentId) {
        if (parentId !== "#") {
            var parentNode = inputJstreeRef.get_node(parentId);
            if (parentNode && parentNode.text === '*payload') {
                payloadFlag = true;
            }
        }
    });

    let shouldCutDisabled = (loadFile ? loadFile.includes(".service") || loadFile.includes(".sql"): false);

    var tree = $(id).jstree(true);
    var items = {
        renameItem: {
            label: "Rename",
            action: function (e) {
                renameVariable(tree, node);
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
                            text: "",
                            type: "error",
                            confirmButtonColor: "#e74c3c" // Optional: red shade
                            });

                        return;
                    }
                    mapperObj.deleteInitiateData(landing_arrow_jsTree_ref);
                }
                if (node.text === "*pathParameters"  && id != "#output_schema_editor_jsTree") {
                    let pathNodeChildren = node.children;
                    if(pathNodeChildren.length >= 1){
                       swal({
                            title: "Unable to Delete",
                            text: "This path parameter has child elements. Please delete the child elements first before proceeding.",
                            type: "error",
                            confirmButtonColor: "#e74c3c" // Optional: red shade
                            });

                        return;
                    }
                }
                tree.delete_node(node);
                if (!(typeof mapperObj === 'undefined')) {
                    mapperObj.reMap();
                }
                //deleteChildAlias(node, loadFile);
                updatePathParamInAlias(node);
            },
            "separator_after": true
        },
        copyItem: {
            label: "Copy",
            "_disabled": shouldCutDisabled,
            action: function (e) {
                $(node).addClass("copy");
                tree.copy(node)
            }
        },
        cutItem: {
            label: "Cut",
            "_disabled": shouldCutDisabled,
            action: function (e) {
                $(node).addClass("cut");
                tree.cut(node);
            }
        },
        pasteItem: {
            label: "Paste",
            "_disabled": shouldCutDisabled,
            action: function (e) {
                $(node).addClass("paste");
                tree.paste(node);
            }
        },
        copyXPath: {
            label: "copyXPath",
            "_disabled": shouldCutDisabled,
            action: function (e) {
                var nodePath = tree.get_path(node, '/');
                copyToClipboard(nodePath);
            }
        },
        properties: {
            "seperator_before": false,
            "seperator_after": false,
            "label": "Properties",
            action: function (node) {
                openForm(id, node);
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
                    "_disabled": (node.text === "*pathParameters" || node.text === "*requestHeaders"),
                    action: function (node) {
                        var sel=createSchema("document", tree);
                        if (!(typeof mapperObj === 'undefined')) {
                            mapperObj.initiateData(landing_arrow_jsTree_ref, sel);
                        }
                        renameVariable(tree, sel);
                    }
                },
                "String": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "String",
                    action: function (node) {
                        var sel=createSchema("string", tree);
                        if (!(typeof mapperObj === 'undefined')) {
                            mapperObj.initiateData(landing_arrow_jsTree_ref, sel);
                        }
                        //var sel=nod.get_selected();
                        renameVariable(tree, sel);
                    }
                },
                "Integer": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Integer",
                    action: function (node) {
                        var sel=createSchema("integer", tree);
                        if (!(typeof mapperObj === 'undefined')) {
                            mapperObj.initiateData(landing_arrow_jsTree_ref, sel);
                        }
                        renameVariable(tree, sel);
                    }
                },
                "Number": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Number",
                    action: function (node) {
                        var sel=createSchema("number", tree);
                        if (!(typeof mapperObj === 'undefined')) {
                            mapperObj.initiateData(landing_arrow_jsTree_ref, sel);
                        }
                        renameVariable(tree, sel);
                    }
                },
                "Date": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Date",
                    action: function (node) {
                       var sel= createSchema("date", tree);
                       if (!(typeof mapperObj === 'undefined')) {
                           mapperObj.initiateData(landing_arrow_jsTree_ref, sel);
                       }
                       renameVariable(tree, sel);
                    }
                },
                "Boolean": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Boolean",
                    action: function (node) {
                        var sel=createSchema("boolean", tree);
                        if (!(typeof mapperObj === 'undefined')) {
                            mapperObj.initiateData(landing_arrow_jsTree_ref, sel);
                        }
                        renameVariable(tree, sel);
                    }
                },
                "Byte": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Byte",
                    "_disabled": (node.text === "*pathParameters" || node.text === "*requestHeaders" || node.text === "*payload" || payloadFlag),
                    action: function (node) {
                        var sel= createSchema("byte", tree);
                        if (!(typeof mapperObj === 'undefined')) {
                            mapperObj.initiateData(landing_arrow_jsTree_ref, sel);
                        }
                        renameVariable(tree, sel);
                    }
                },
                "Object": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Object",
                    "_disabled": (node.text === "*pathParameters" || node.text === "*requestHeaders"),
                    action: function (node) {
                        var sel=createSchema("javaObject", tree);
                        if (!(typeof mapperObj === 'undefined')) {
                            mapperObj.initiateData(landing_arrow_jsTree_ref, sel);
                        }
                        renameVariable(tree, sel);
                    }
                }
            }
            //function (node) { return { createItem: this.create(node) }; }
        };
    }
    return items;
}

function createSchemaJstree(id) {
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
                    return IOSchemaMenu(node, id);
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
            openForm(id, data);
            $("#user-nav-tabs").children().first().trigger('click');
        }).on('copy_node.jstree move_node.jstree delete_node.jstree rename_node.jstree', function (e, data) {

            if ($(e.target).attr('id').includes("output_schema_editor_jsTree")) {
                outputWatermarkAppearance();
            } else if ($(e.target).attr('id').includes("input_schema_editor_jsTree")) {
                inputWatermarkAppearance();
            }
            if (!(typeof mapperObj === 'undefined')) {
                mapperObj.reMap();
            }

        });
    //   $(id).edit(e);
    return $(id).jstree(true);
}

// $('#input_schema_editor_jsTree_container').on('click', function(){
//     alert('okk1');
// })

function removeMenuCompletely(){
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

function flowDesignerMenu(node, id) {
    var fromApi = false;
    if(id == '#flowDesignerJsTreeAPI'){
        fromApi = true;
        id = '#flowDesignerJsTree';
    }
    var tree = $(id).jstree(true);
    //alert(tree);
    var items = {};
    if (node.type === 'invoke') {
        items.select = {
            label: "Select a service",
            action: function (node) {
                if (SDK_EMBEDDED || !isInIframe()) {
                    openServicePopup();
                } else {
                    openSelectServiceModalDialog(id, node);
                }
            }
        };

        if (node.text != "INVOKE" && !SDK_EMBEDDED) {
            items.goto = {
                label: "Go to service",
                action: function (thiNode) {
                    let fqn = node.data.fqn;
                    if (null == fqn) {
                        fqn = node.text;
                    }
                    if (!isInIframe()) {
                        location.href = getFileLocation("files/" + fqn + "." + node.data.serviceType);
                        return ;
                    }
                    parent.loadRPage("files/" + fqn + "." + node.data.serviceType);
                }
            };
        } else if (null != node.data.fqn && !SDK_EMBEDDED) {
            items.goto = {
                label: "Go to service",
                action: function (thiNode) {
                    let fqn = node.data.fqn;
                    if (null == fqn) {
                        fqn = node.text;
                    }
                    if (!isInIframe()) {
                        location.href = getFileLocation("files/" + fqn + "." + node.data.serviceType);
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
                $("#"+node.id).find("a").removeClass("disabled-invoke-link");
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
        "_disabled": true,
        action: function (e) {
            $(node).addClass("copy");
            tree.copy(node)
        }
    };
    items.cutItem = {
        label: "Cut",
        "_disabled": true,
        action: function (e) {
            $(node).addClass("cut");
            tree.cut(node);
        }
    };
    items.pasteItem = {
        label: "Paste",
        "_disabled": true,
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
                            createSchema("group", tree);
                        } else {
                            createSchema("sequence", tree);
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
                        createSchema("sequence", tree);
                    }
                }
            }
        };
    } else if (!(node.type === 'map' || node.type === 'transformer' || node.type === 'invoke' || node.type === 'try-catch'
        || node.type === 'object' || node.type === 'function')) {
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
                                createSchema("transformer", tree);
                            }
                        },
                        "Group": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Group",
                            action: function (node) {
                                createSchema("group", tree);
                            }
                        },
                        "IFELSE": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "If-Else",
                            action: function (node) {
                                createSchema("ifelse", tree);
                            }
                        },
                        "Switch": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Switch",
                            action: function (node) {
                                createSchema("switch", tree);
                            }
                        },
                        "ForEach": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "ForEach",
                            action: function (node) {
                                createSchema("foreach", tree);
                            }
                        },
                        "TCF-Block": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "TCF-Block",
                            action: function (node) {
                                createSchema("try-catch", tree);
                            }
                        },
                        "Redo": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Redo",
                            action: function (node) {
                                createSchema("redo", tree);
                            }
                        },
                        "Await": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Await",
                            action: function (node) {
                                createSchema("await", tree);
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
                                createSchema("map", tree);
                            }
                        },
                        "Sequence": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Sequence",
                            action: function (node) {
                                createSchema("sequence", tree);
                            }
                        },
                        "IFELSE": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "If-Else",
                            action: function (node) {
                                createSchema("ifelse", tree);
                            }
                        },
                        "Switch": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Switch",
                            action: function (node) {
                                createSchema("switch", tree);
                            }
                        },
                        "Loop": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Loop",
                            action: function (node) {
                                createSchema("loop", tree);
                            }
                        },
                        "TCF-Block": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "TCF-Block",
                            action: function (node) {
                                createSchema("try-catch", tree);
                            }
                        },
                        "Repeat": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Redo",
                            action: function (node) {
                                createSchema("repeat", tree);
                            }
                        },
                        "Await": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Await",
                            action: function (node) {
                                createSchema("await", tree);
                            }
                        },
                    };
                }

                submenuItems.Invoke = getServiceSubmenu(tree);

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
                                createSchema("group", tree);
                            }
                        },
                        "Await": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Await",
                            action: function (node) {
                                createSchema("await", tree);
                            }
                        },
                        "IFELSE": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "If-Else",
                            action: function (node) {
                                createSchema("ifelse", tree);
                            }
                        },
                        "Switch": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Switch",
                            action: function (node) {
                                createSchema("switch", tree);
                            }
                        },
                        "TCF-Block": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "TCF-Block",
                            action: function (node) {
                                createSchema("try-catch", tree);
                            }
                        },
                        "ForEach": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "ForEach",
                            action: function (node) {
                                createSchema("foreach", tree);
                            }
                        },
                        "Redo": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Redo",
                            action: function (node) {
                                createSchema("redo", tree);
                            }
                        },
                        "Transformer": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Transformer",
                            action: function (node) {
                                createSchema("transformer", tree);
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
                                createSchema("sequence", tree);
                            }
                        },
                        "Await": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Await",
                            action: function (node) {
                                createSchema("await", tree);
                            }
                        },
                        "IFELSE": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "If-Else",
                            action: function (node) {
                                createSchema("ifelse", tree);
                            }
                        },
                        "Switch": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Switch",
                            action: function (node) {
                                createSchema("switch", tree);
                            }
                        },
                        "TCF-Block": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "TCF-Block",
                            action: function (node) {
                                createSchema("try-catch", tree);
                            }
                        },
                        "Loop": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Loop",
                            action: function (node) {
                                createSchema("loop", tree);
                            }
                        },
                        "Repeat": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Repeat",
                            action: function (node) {
                                createSchema("repeat", tree);
                            }
                        },
                        "Map": {
                            "seperator_before": false,
                            "seperator_after": false,
                            "label": "Map",
                            action: function (node) {
                                createSchema("map", tree);
                            }
                        }
                    };
                }

                submenuItems.Invoke = getServiceSubmenu(tree);

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
            openFlowElementProperties(id, node);
        }
    };
    return items;
}

function getServiceSubmenu(tree) {
    let Invoke = null;

    if (!SDK_EMBEDDED) {
        Invoke = {
            "seperator_before": false,
            "seperator_after": false,
            "label": "Service",
            action: function (node) {
                createSchema("invoke", tree);
            }
        }
    } else {
        Invoke = {
            action: false,
            "label": "Service",
            "submenu": {
                "HTTPClient": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "HTTP Client",
                    action: function (node) {
                        addHttpClient('#flowDesignerJsTree');
                    }
                },
                "DebugLog": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Debug Log",
                    action: function (node) {
                        addDebugLog('#flowDesignerJsTree');
                    }
                },
                "Others": {
                    "seperator_before": false,
                    "seperator_after": false,
                    "label": "Others",
                    action: function (node) {
                        openServicePopup();
                    }
                }
            }
        }
    }

    return Invoke;
}

const FLOW_JS_TREE_CONFIG = {
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
                "default", "ifelse", "sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
            ]
        },
        "sequence": {
            "icon": getSystemResourcePath() + "/icons/sequence.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
            ]
        },
        "group": {
            "icon": getSystemResourcePath() + "/icons/sequence.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
            ]
        },
        "switch": {
            "icon": getSystemResourcePath() + "/icons/switch.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
            ]
        },
        "loop": {
            "icon": getSystemResourcePath() + "/icons/loop.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
            ]
        },
        "ifelse": {
            "icon": getSystemResourcePath() + "/icons/filesystem/ifelse.svg",
            "valid_children": ["sequence"]
        },
        "foreach": {
            "icon": getSystemResourcePath() + "/icons/loop.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
            ]
        },
        "repeat": {
            "icon": getSystemResourcePath() + "/icons/repeat.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
            ]
        },
        "redo": {
            "icon": getSystemResourcePath() + "/icons/repeat.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
            ]
        },
        "try-catch": {
            "icon": getSystemResourcePath() + "/icons/try-catch.svg",
            "valid_children": [
                "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
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
        },
        "function": {
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
            return flowDesignerMenu(node, id);
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
                        "default", "ifelse", "await", "sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
                    ]
                },
                "sequence": {
                    "icon": getSystemResourcePath() + "/icons/sequence.svg",
                    "valid_children": [
                        "default", "ifelse","await","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
                    ]
                },
                "group": {
                    "icon": getSystemResourcePath() + "/icons/sequence.svg",
                    "valid_children": [
                        "default", "ifelse","await","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
                    ]
                },
                "await": {
                    "icon": getSystemResourcePath() + "/icons/sequence.svg",
                    "valid_children": [
                        "default", "ifelse","await","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
                    ]
                },
                "switch": {
                    "icon": getSystemResourcePath() + "/icons/switch.svg",
                    "valid_children": [
                        "default", "ifelse","await","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
                    ]
                },
                "loop": {
                    "icon": getSystemResourcePath() + "/icons/loop.svg",
                    "valid_children": [
                        "default", "ifelse","await","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
                    ]
                },
                "ifelse": {
                    "icon": getSystemResourcePath() + "/icons/filesystem/ifelse.svg",
                    "valid_children": ["sequence"]
                },
                "foreach": {
                    "icon": getSystemResourcePath() + "/icons/loop.svg",
                    "valid_children": [
                        "default", "ifelse","sequence","await", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
                    ]
                },
                "repeat": {
                    "icon": getSystemResourcePath() + "/icons/repeat.svg",
                    "valid_children": [
                        "default", "ifelse","sequence", "await","group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
                    ]
                },
                "redo": {
                    "icon": getSystemResourcePath() + "/icons/repeat.svg",
                    "valid_children": [
                        "default", "ifelse","sequence","await", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
                    ]
                },
                "try-catch": {
                    "icon": getSystemResourcePath() + "/icons/try-catch.svg",
                    "valid_children": [
                        "default", "ifelse","sequence", "group", "foreach", "redo", "service", "switch", "loop", "repeat", "try-catch", "map", "transformer", "invoke", "function"
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
                },
                "function": {
                    "icon": getSystemResourcePath() + "/icons/invoke.svg",
                    "valid_children": []
                },
                "object": {
                    "icon": getSystemResourcePath() + "/icons/java_icon.svg",
                    "valid_children": []
                },
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
                    return flowDesignerMenu(node, id);
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

function deleteArtifact(filePath) {
    swal({
        title: 'Finding References...!',
        text: '',
        showCancelButton: false,
        allowOutsideClick: false,
        showConfirmButton: false
    })
    asyncRestRequest("/packages.middleware.pub.service.findReferences.main?serviceFqn=" + (filePath).split(".")[0], null,  "GET",
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
                $("#deleting_artifact_btn").attr("onClick", "deleteArtifactConfirmed(\"" + filePath + "\")");
            }
        });


}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function flattenReferenceList(nodes, parentPath, rows) {
    rows = rows || [];

    if (!Array.isArray(nodes)) {
        return rows;
    }

    nodes.forEach(function (node) {
        if (!node) {
            return;
        }

        var nodeText = node.text || "";
        var nodeType = node.type || "";

        if (node.children && node.children.length > 0) {
            var nextPath = parentPath ? parentPath + "/" + nodeText : nodeText;
            flattenReferenceList(node.children, nextPath, rows);
            return;
        }

        if (nodeType === "folder") {
            return;
        }

        var serviceName = nodeText;
        var occurrenceCount = "";

        var match = nodeText.match(/^(.*)\s:\s(\d+)\s+times$/);
        if (match) {
            serviceName = match[1];
            occurrenceCount = match[2];
        }

        rows.push({
            name: serviceName,
            count: occurrenceCount,
            type: nodeType,
            path: parentPath ? parentPath + "/" + serviceName : serviceName
        });
    });

    return rows;
}

function buildReferenceTable(referenceList) {
    var rows = flattenReferenceList(referenceList, "packages", []);

    if (rows.length === 0) {
        return '<p class="mb-0">No references found.</p>';
    }

    var html = '';

    html += '<div style="max-height:320px; overflow:auto; width:100%; margin-bottom:75px;">';
    html += '<table class="table table-bordered table-sm" style="font-size:13px; margin-bottom:0; width:max-content; min-width:100%; white-space:nowrap;">';

    html += '<thead>';
    html += '<tr>';
    html += '<th style="min-width:280px;">Service / File Name</th>';
    html += '<th style="min-width:70px;">Times</th>';
    html += '<th style="min-width:70px;">Type</th>';
    html += '<th style="min-width:650px;">Path</th>';
    html += '</tr>';
    html += '</thead>';

    html += '<tbody>';

    rows.forEach(function (row) {
        html += '<tr>';
        html += '<td title="' + escapeHtml(row.name) + '">' + escapeHtml(row.name) + '</td>';
        html += '<td>' + escapeHtml(row.count) + '</td>';
        html += '<td>' + escapeHtml(row.type) + '</td>';
        html += '<td title="' + escapeHtml(row.path) + '">' + escapeHtml(row.path) + '</td>';
        html += '</tr>';
    });

    html += '</tbody>';
    html += '</table>';
    html += '</div>';

    return html;
}

function findReferenceModal(fqn) {
    var modal = document.getElementById("findReferenceModelDialog");
    var title = document.getElementById("find_reference_selected_fqn");
    var content = document.getElementById("find_reference_results");
    var closeButton = document.getElementById("closeFindReferenceModelDialog");

    if (!modal) {
        return;
    }

    modal.style.display = "none";

    if (title) {
        title.innerHTML = escapeHtml(fqn || "");
    }

    if (content) {
        content.innerHTML = "";
    }

    if (closeButton) {
        closeButton.onclick = function () {
            modal.style.display = "none";
        };
    }

    swal({
        title: "Finding References.!",
        text: "",
        showCancelButton: false,
        showConfirmButton: false,
        allowOutsideClick: false
    });

    asyncRestRequest(
        "/packages.middleware.pub.service.findReferences.main?serviceFqn=" + encodeURIComponent(fqn),
        null,
        "GET",
        function (result) {
            swal.close();

            var list = [];

            if (result && Array.isArray(result.list)) {
                list = result.list;
            }

            if (content) {
                content.innerHTML = "";

                if (list.length === 0) {
                    content.innerHTML = '<p class="mb-0">No references found.</p>';
                } else {
                    var treeData = {
                        text: "packages",
                        type: "root",
                        children: list
                    };

                    if (typeof addIconPath === "function") {
                        treeData = addIconPath(treeData);
                    }

                    var element = document.createElement("div");

                    content.style.overflow = "auto";
                    content.style.maxHeight = "360px";
                    content.appendChild(element);

                    createReferenceJsTree(element, treeData);
                }
            }

            modal.style.display = "block";
        },
        function (error) {
            swal.close();

            var errorMessage = "Unable to fetch references.";

            if (error && error.responseText) {
                errorMessage = error.responseText;
            }

            if (content) {
                content.innerHTML =
                    '<p class="mb-0" style="color:#f2533e;">' +
                    escapeHtml(errorMessage) +
                    '</p>';
            }

            modal.style.display = "block";
        }
    );
}

var lastToBeOpened = "";
function deleteArtifactConfirmed(filePath) {
    filePath = "files/" + filePath;
    asyncRestRequest("/" + filePath, null,"DELETE",
        function (response) {
            if (response && response.status == 200) {
                localStorage.setItem(filePath, "");
                var error = response.error;
                if (error) {
                    swal({
                        title: "Error",
                        text: error,
                        type: "error",
                        confirmButtonColor: "#f2533e"
                        });

                } else {
                    $("#closeServiceModelDialog").trigger('click');
                    swal({
                            title: "Deleted",
                            text: "",
                            type: "success",
                        confirmButtonColor: "#2C61F5"},
                        function(){
                            parent.loadPackages();
                            deleteCacheForArtifact(filePath);
                            let newList = [];
                            let lastList = [];
                            if (null != localStorage.getItem("workspace-recent") ) {
                                lastList = localStorage.getItem("workspace-recent").split(",");
                            }

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
               swal({
                    title: "Error",
                    text: response?.error || "An unexpected error occurred",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                    });

            }
        },
        function (error) {
            console.log("Error in deleteArtifactConfirmed()");
           swal({
                title: "Error.",
                text: error.responseJSON ? error.responseJSON.error : "An unexpected error occurred",
                type: "error",
                confirmButtonColor: "#f2533e" // or any custom color
                });

        });

}

function deleteCacheForArtifact(filePath){
    var searchString = filePath.split(".")[0];
    for (let [key, value] of Object.entries(localStorage)) {
        var temp_key = `${key}`;
        if (temp_key.match(searchString) != null){
            localStorage.removeItem(temp_key);
        }
    }
    //localStorage.removeItem("workspace-recent");
}

function createReferenceJsTree(element, value) {

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

function packagesContextMenu(node, id) {
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

    if (node.type == "package" && null != node.original.ui) {
        items.ui_console = {
            label: "Open UI",
            action: function (n) {
                window.open(node.original.ui, '_blank');
            }
        };
    }

    if (node.type == "root") {
        items.new.submenu.package = {
            label: "Package",
            action: function (e) {
                createComponent('package', packageManagerJsTreeRef);
            },
            "separator_after": false
        };
    }

    if (node.type == "package" || node.type == "folder") {
        items.new.submenu.folder = {
            label: "New Folder",
            action: function (e) {
                createComponent('folder', packageManagerJsTreeRef);
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
                createComponent('properties', packageManagerJsTreeRef);
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
                //createThreadForGPT();
                createComponent('api', packageManagerJsTreeRef);
            },
            "separator_after": false
        };

        items.new.submenu.services.submenu.service = {
            label: "Java",
            action: function (e) {
                createComponent('service', packageManagerJsTreeRef);
            },
            "separator_after": false
        };

        items.new.submenu.connections.submenu.jdbc = {
            label: "JDBC",
            action: function (e) {
                createComponent('jdbc', packageManagerJsTreeRef);
            },
            "separator_after": false
        };

        items.new.submenu.services.submenu.sql = {
            label: "SQL",
            action: function (e) {
                createComponent('sql', packageManagerJsTreeRef);
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
                copyToClipboard(("##" + dest).replace("##packages", ""));
            }
        };

        items.fqn = {
            label: "Copy FQN",
            submenu: {},
            action: function (node) {
                copyToClipboard(FQN);
            }
        };

        if (node.type == "api") {
            items.findReferences = {
                label: "Find References",
                submenu: {},
                action: function () {
                    findReferenceModal(FQN);
                }
            };
        }

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
                    asyncRestRequest("/alias?fqn="+FQN+".main", null,"GET",
                    function (payload) {
                        if(null != payload.alias && payload.alias.startsWith("POST")){
                            var endpoint=("#$"+payload.alias).replace("#$POST","");
                            window.open(getSystemResourcePath() + "/graphQL/client.html?endpoint="+endpoint);
                        }else{
                            swal({
                                title: "Please ensure that GraphQL is enabled for the service.",
                                text: "", // optional body text
                                type: "error",
                                confirmButtonColor: "#f2533e"
                                });

                        }

                    },
                    function (error) {
                        console.log("Error in graphQl request");
                       swal({
                            title: "Endpoint Alias Not Configured",
                            text: "GraphQL must have endpoint alias configured with POST verb. You can enable GraphQL from service settings.",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                            });

                    });

                }
            };

        }
    }

    items.deleteItem = {
        label: "Delete",
        "_disabled": true,
        action: function (e) {
            deleteArtifact(dest + "." + node.type);
        },
        "separator_after": true
    };

    if (node.type != "root") {
        items.deleteItem._disabled = false;
    }

    if ((dest.startsWith("packages/middleware") ||
        dest.startsWith("packages/wrapper") ||
        dest.startsWith("packages/global") ||
        dest.startsWith("packages/scheduler") ||
        dest.startsWith("packages/snowflake") ||
        dest.startsWith("packages/ekaScheduler") ||
        dest.startsWith("packages/Global") ||
        dest.startsWith("packages/onboarding") ||
        dest.startsWith("packages/licensing") ||
        dest.startsWith("packages/Wrapper") ||
        dest.startsWith("packages/Awareness") ||
        dest.startsWith("packages/syncloopai"))) {
        items.deleteItem._disabled = true;
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
                    uploadFile(url, "file", ".zip");
                }
            }
        } else
        if (node.type === 'folder') {
            items.export = {
                label: "Export",
                action: function (node) {
                    var url = '/upload/jar?dest=' + dest;
                    uploadFile(url, "file", ".jar");
                }
            }
            items.import = {
                label: "Import",
                action: function (node) {
                    var url = '/upload/jar?dest=' + dest;
                    uploadFile(url, "file", ".html,.js,.css,images/*");
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
                uploadFile(url, "file", ".jar");
            }
        };
        items.import.submenu.config = {
            "seperator_before": false,
            "seperator_after": false,
            "label": "Config File",
            action: function (node) {
                var url = '/upload/jar?dest=' + dest;
                uploadFile(url, "file", ".jar");
            }
        };
        /*items.import.submenu.service={
            "seperator_before": false,
            "seperator_after": false,
            "label": "Service",
            action: function (node) {
                var url='/upload/service?dest='+dest;
                uploadFile(url,"file",".service");
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
                uploadFile(url,"file",".zip");
            }
        };*/

        /*items.build={
            "label": "Build",
            action: function (node) {
                openBuildConfigurationForm();
            }
        };*/

    } else if (node.type === 'folder' && false) {
        items.export = {
            label: "Export",
            action: function (node) {
                var url = '/upload/jar?dest=' + dest;
                uploadFile(url, "file", ".jar");
            }
        }
        items.import = {
            label: "Import",
            action: function (node) {
                var url = '/upload/jar?dest=' + dest;
                uploadFile(url, "file", ".service,.map,.api,.flow");
            }
        }
    }

    return items;
}

function uploadFile(url, key, commaSepFileExts) {
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
        const fd = new FormData();
        const file = $('#middlewareFile')[0].files[0];
        fd.append(key, file);

        const bar = document.getElementById('progressBar');
        const percentage = document.getElementById('percentage');

        let pollingToken = null;
        let poller = null;
        const token = crypto.randomUUID();

        function resetProgressBar() {
            bar.value = 0;
            percentage.textContent = '';
        }

        function stopPolling() {
            if (poller) clearInterval(poller);
        }

        function showFinalPopup(importedData) {
            setTimeout(() => {
                $("#closenewUpdateModelDialog").trigger('click');
                openServicePopupForImport(importedData);
                parent.loadPackages();
                $("#middlewareFile").remove();
                resetProgressBar();
            }, 500);
        }

        function showErrorPopup(msg) {
            setTimeout(() => {
                swal({
                    title: "Error",
                    text: msg || "Something went wrong",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                    });

                $("#closenewUpdateModelDialog").trigger('click');
                parent.loadPackages();
                $("#middlewareFile").remove();
                resetProgressBar();
            }, 800);
        }

        function startPolling(token) {
            poller = setInterval(() => {
                const tenant = localStorage.getItem("tenant") || "default";
                const accessToken = localStorage.getItem("AuthToken");

                const url =
                    window.ENV.API_BASE_URL +
                    "/tenant/" + tenant +
                    "/packages.middleware.pub.server.build.api.checkPollingImportStatus.main" +
                    "?token=" + encodeURIComponent(token) +
                    "&access_token=" + encodeURIComponent(accessToken);

                fetch(url)
                    .then(res => res.json())
                    .then(data => {
                        if (data.response.status === "COMPLETED_SUCCESS") {
                            bar.value = 100;
                            percentage.textContent = "100% completed";
                            stopPolling();
                            showFinalPopup(data.response.importedData);
                        } else if (data.response.status === "COMPLETED_ERROR") {
                            stopPolling();
                            showErrorPopup(data.response.message);
                        } else {
                            bar.value = data.response.percent || bar.value;
                            percentage.textContent = bar.value + "%";
                        }
                    })
                    .catch(() => {
                        stopPolling();
                        showErrorPopup("Failed to check status.");
                    });
            }, 5000);
        }

        resetProgressBar();
        openEvnirUpdatepopup();

        asyncRestRequestV2(url + "&token=" + token, fd, "POST", function (response) {
        }, function () {
        });
        startPolling(token);


        $("#update_popup_title").html("Importing");
        $("#updating_popup_description").html("Please wait... your files are getting imported.");
    });

    document.getElementById("middlewareFile").click();
}

function addIconPath(response_val){

    if (response_val == null){
        return response_val;
    }

    var icon_link = {"default": getSystemResourcePath() + "/icons/filesystem/unknown.png", "root": getSystemResourcePath() + "/icons/myPackage.svg", "ui-root": getSystemResourcePath() + "/icons/ui.svg", "package": getSystemResourcePath() + "/icons/myPackages.svg", "gui-app": getSystemResourcePath() + "/icons/gui-app.png", "folder": getSystemResourcePath() + "/icons/filesystem/folder.svg", "service": getSystemResourcePath() + "/icons/filesystem/cog.svg", "map": getSystemResourcePath() + "/icons/filesystem/arrow_switch.png", "doc": getSystemResourcePath() + "/icons/doc.svg", "properties": getSystemResourcePath() + "/icons/properties.svg", "html": getSystemResourcePath() + "/icons/html.svg", "js": getSystemResourcePath() + "/icons/js.svg", "css": getSystemResourcePath() + "/icons/css.svg", "api": getSystemResourcePath() + "/icons/flow.svg", "jar": getSystemResourcePath() + "/icons/jar.svg", "jdbc": getSystemResourcePath() + "/icons/jdbc.svg", "graphql": getSystemResourcePath() + "/icons/graphql_icon.svg", "sql": getSystemResourcePath() + "/icons/sql.svg"};

    if (icon_link[response_val.type]){
        response_val.icon = icon_link[response_val.type];
    }
    else{
        response_val.icon = icon_link["default"];
    }

    var temp_val = response_val.children;
    if (response_val.children){
        var child_len = temp_val.length;

        for (var i = 0; i < child_len; i++){
            addIconPath(temp_val[i]);
        }
    }
    return response_val;
}

function openServicePopupForImport(value) {
    $("#service_tree_v").html(""); // Clear existing content

    var element = document.createElement("div");
    var staticData = [];

    var validList = (value && Array.isArray(value.list)) ? value.list : [];
    var invalidList = (value && Array.isArray(value.invalidList)) ? value.invalidList : [];
    var hasInvalidFiles = !!value && !!value.hasInvalidFiles;


    if(value.list.length > 0){
        staticData = [
            {
                text: "Import Successful: All Files Processed!",
                type: "package",
                icon: getIconForFileType("success"),
                children: buildTree(value.list || []),
                li_attr: { class: "successfullFilesWithIcon" }
            }
        ];
    }else if(value.list.length == 0 && value.invalidList.length == 0){
        staticData.push({
            text: "Attention Required: No Files Detected",
            type: "package",
            icon: getIconForFileType("error"),
            li_attr: { class: "invalidFilesWithIcon" }
        });
    }

    if (invalidList.length > 0 || hasInvalidFiles) {
        staticData.push({
            text: "Attention Required: Invalid Files Detected",
            type: "package",
            icon: getIconForFileType("error"),
            children: buildTree(value.list || []),
            li_attr: { class: "invalidFilesWithIcon" }
        });
    }

    // Build the tree UI
    createReferenceImportJsTree(element, staticData);

    var modal = document.getElementById("serviceImportedModelDialog");
    var span = document.getElementById("closeServiceImportedModelDialog");
    var innerPath = document.getElementById("service_tree_v_Imported");

    innerPath.innerHTML = ""; // Clear content before appending new data
    innerPath.style.overflow = "scroll";
    innerPath.appendChild(element);

    modal.style.display = "block";
    span.onclick = function () {
        modal.style.display = "none";
    };
}

function buildTree(files) {
    return files.map(file => {
        const node = {
            text: file.text,
            type: file.type,
            icon: getIconForFileType(file.type),
        };

        if (file.children && file.children.length > 0) {
            node.children = buildTree(file.children);
        }

        return node;
    });
}

function getIconForFileType(fileType) {
    var iconLink = {
        "default": getSystemResourcePath() + "/icons/filesystem/unknown.png",
        "root": getSystemResourcePath() + "/icons/myPackage.svg",
        "ui-root": getSystemResourcePath() + "/icons/ui.svg",
        "package": getSystemResourcePath() + "/icons/myPackages.svg",
        "gui-app": getSystemResourcePath() + "/icons/gui-app.png",
        "folder": getSystemResourcePath() + "/icons/filesystem/folder.svg",
        "service": getSystemResourcePath() + "/icons/filesystem/cog.svg",
        "map": getSystemResourcePath() + "/icons/filesystem/arrow_switch.png",
        "doc": getSystemResourcePath() + "/icons/doc.svg",
        "properties": getSystemResourcePath() + "/icons/properties.svg",
        "html": getSystemResourcePath() + "/icons/html.svg",
        "js": getSystemResourcePath() + "/icons/js.svg",
        "css": getSystemResourcePath() + "/icons/css.svg",
        "api": getSystemResourcePath() + "/icons/flow.svg",
        "jar": getSystemResourcePath() + "/icons/jar.svg",
        "jdbc": getSystemResourcePath() + "/icons/jdbc.svg",
        "graphql": getSystemResourcePath() + "/icons/graphql_icon.svg",
        "sql": getSystemResourcePath() + "/icons/sql.svg",
        "error": getSystemResourcePath() + "/icons/test-failed.svg",
        "success": getSystemResourcePath() + "/icons/test-pass.svg",
    };

    return iconLink[fileType] || iconLink["default"];
}

function createReferenceImportJsTree(element, value) {
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
            'data': value
        },
        "plugins": ["wholerow"]
    });

    return $(element).jstree(true);
}

function createPackageJstree(id) {
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
                    return packagesContextMenu(node, id);
                }
            }
        });
    return $(id).jstree(true);
}

function removePackageContextMenu(){
    var packageDiv= parent.document.getElementById("packageManagerJsTree");
    var context_ref = parent.document.getElementsByClassName("jstree-default-contextmenu");

    if ("none" == context_ref[0] || context_ref.length == 0 || packageDiv == null){
        return;
    }
    else{
        context_ref[0].style.display = "none";
    }
}


function toggleJSTreeCheckBox(elemId, jsTreeID, checked) {
    var jstreeRef = $(jsTreeID).jstree(true);
    var id = elemId.replace("_checkbox", "");
    var node = $("#" + id);
    $("#" + elemId).remove();
    var nodeAnchor = $("#" + id + "_anchor");
    var jsTreeNode = jstreeRef.get_node(id);
    //  console.log(jsTreeNode);
    //  console.log(jsTreeNode.parent);
    var checkedBox = "<span id='" + id + "_checkbox' class='jstree-anchor'><input type='checkbox' class='select-build' data='" + id + "' checked onclick=toggleJSTreeCheckBox('" + id + "_checkbox','" + jsTreeID + "') /></span>";
    var uncheckedBox = "<span id='" + id + "_checkbox' class='jstree-anchor'><input type='checkbox' class='select-build' data='" + id + "' onclick=toggleJSTreeCheckBox('" + id + "_checkbox','" + jsTreeID + "') /></span>";
    var elemChecked = node.attr('checked');
    if (checked != null) {
        elemChecked = checked;
        //alert(elemChecked);
    }
    if (elemChecked) {
        for (var i = 0; i < jsTreeNode.children_d.length; i++) {
            toggleJSTreeCheckBox(jsTreeNode.children_d[i] + "_checkbox", jsTreeID, true);
        }
        //for(var i=0;i<jsTreeNode.parents.length;i++)
        //  toggleJSTreeCheckBox(jsTreeNode.parents+"_checkbox",jsTreeID,true);
        node.attr('checked', false);
        nodeAnchor.before(uncheckedBox);
    } else {
        for (var i = 0; i < jsTreeNode.children_d.length; i++) {
            toggleJSTreeCheckBox(jsTreeNode.children_d[i] + "_checkbox", jsTreeID, false);
        }
        //for(var i=0;i<jsTreeNode.parents.length;i++)
        //  toggleJSTreeCheckBox(jsTreeNode.parents+"_checkbox",jsTreeID);
        node.attr('checked', true);
        nodeAnchor.before(checkedBox);
    }

}

function addCheckBoxOnJSTree(jsTreeID) {
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
            nodeAnchor.before("<span id='" + cid + "_checkbox' class='jstree-anchor'><input type='checkbox' class='select-build' data='" + cid + "' onclick=toggleJSTreeCheckBox('" + cid + "_checkbox','" + jsTreeID + "') /></span>");
        else
            $("#" + cid + "_checkbox").remove();
    }
}

function validateNewItemName(name) {
    var currentNode = $("#packageManagerJsTree").jstree("get_selected");
    var childrens = $("#packageManagerJsTree").jstree("get_children_dom", currentNode);
    for (var i = 0; i < childrens.length; i++) {
        if (childrens[i].innerText.trim() == name) {
            return false;
        }
    }
    return true;
}

function createNewVariable(sel, ref, text, type, index) {
    var newText = ((index > 0) ? text + index : text);
    console.log(type);
    var node = ref.create_node(sel, {
        "text": newText,
        "type": type
    });
    if (node) {
        return node;
    } else {
        return createNewVariable(sel, ref, text, type, ++index);
    }
}

var currentSelectedSchemaJStreeID = null;
let ENABLED_INPUT_SCHEMA = false;
function createInputSchema(type, ref) {
    ENABLED_INPUT_SCHEMA = true;
    createSchema(type, ref);
    inputJsTree_id = loadFile + "_inputJsTree";
    var sel = ref.get_selected();
    renameVariable(ref, sel);
    var data = ref.get_json('#', {
        flat: true
    });
    localStorage.setItem(inputJsTree_id, JSON.stringify(data));
    updateHeigtht(ref.element[0].id);
    inputWatermarkAppearance();
}

function createOutputSchema(type, ref) {
    ENABLED_INPUT_SCHEMA = false;
    createSchema(type, ref);
    // var ref_obj= $(ref);
    var sel = ref.get_selected();
    renameVariable(ref, sel);
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
    updateHeigtht(ref.element[0].id);
    mapperObj.initiateData(landing_arrow_jsTree_ref, landing_arrow_jsTree_ref.get_selected()[0]);

    outputWatermarkAppearance();

}
var hasCopiedNode = false;
function pasteNode(source){
    if (source){
		hasCopiedNode=true;
        var output_tree = source;
        var length = output_tree.get_json('#').length;
        var val=output_tree.paste('#', length);
    }
}

function initialStepCreateSchema(type, ref, selected, text) {
    createSchema(type, ref, selected, text);
    apiDesignWatermarkAppearance();

    if (flowDesignerJsTreeRef._model.data["#"].children.length == 1) {
        /*$("#content").css("display", "none");
        setTimeout(function () {
            $("#content").css("display", "block");
        }, 100);*/
    }
}

let RECENT_ADDED_NODE = null;
function createSchema(type, ref, selected, text) {

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
        sel = sel[0];
    var selNode = ref.get_node(sel);

    var selNodeParent = ref.get_node(selNode.parent);
    if (selNode.text == "config" && selNodeParent.text == "dependency" && type == "properties") {
        text = "package";
    } else
    if (type == "properties") {
        return;
    }
    if (type == "try-catch") {
        text = "TCF-Block";
    } else if ((type == "group" || type == "sequence") && selNode.type == "switch") {
        text = "CASE";
    } else if ((type == "group" || type == "sequence") && selNode.type == "ifelse") {
        text = "CONDITION";
    }

    collecta('Create', '', type, "Creating new " + text);

    if (type == "package" || type == "folder" || type == "api" || type == "service" || type == "flow" || type == "jdbc" || type == "sql" ||
        type == "properties") {
        if (sel == "#" && (type == "package" || type == "folder" || type == "api" || type == "flow" || type == "service" || type == "jdbc" || type == "sql" ||
            type == "properties")) {
            if (type == "package") {
               swal({
                    title: "Select packages",
                    text: "", // Optional: you can omit this
                    type: "error",
                    confirmButtonColor: "#f2533e" // optional custom button color
                    });

            } else if (type == "folder") {
                swal({
                    title: "Folder can be created only inside the package",
                    text: "", // Optional — can omit if not needed
                    type: "error",
                    confirmButtonColor: "#f2533e" // Custom button color
                    });
            } else if (type == "api" || type == "flow" || type == "service" || type == "jdbc" || type == "sql" ||
                type == "properties") {
                swal({
                    title: "This item can only be created inside a folder",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                    });

            }
            return;
        }

        text = prompt("Enter name of " + type);
        if (!validateNewItemName(text)) {
            alert("Item with this name is already created.");
            createSchema(type, ref);
            return;
        } else if (text.trim() == "") {
            return;
        }
    }

    sel = createNewVariable(sel, ref, text, type, 0);

    ref.get_node(sel).type = type;

    if (null == ref.get_node(sel).data) {
        ref.get_node(sel).data = {};
    }

    if (null != ref.get_node(sel).data) {
        ref.get_node(sel).data.guid = uuidv4();
        if (ref.get_node(sel).type == "foreach" || ref.get_node(sel).type == "redo" || ref.get_node(sel).type == "repeat") {
            ref.get_node(sel).data.indexVar = "*index" + predictMyLoopIdentifier(ref, sel, 0);
        }

        ref.get_node(sel).data.columnType = "-1";
    }
    if (sel) {
        if (type == "try-catch" && fromApiEditor) {
            createSchema("group", ref, sel, "TRY");
            createSchema("group", ref, sel, "CATCH");
            createSchema("group", ref, sel, "FINALLY");
        }
        else if (type == "try-catch") {
            createSchema("sequence", ref, sel, "TRY");
            createSchema("sequence", ref, sel, "CATCH");
            createSchema("sequence", ref, sel, "FINALLY");
        }  else if (type == "sequence" || type == "group") {} else if (!text) {
            ref.edit(sel);
        }
        if (type == "string" || type == "document" || type == "integer" || type == "number" || type == "date" || type == "boolean" || type == "byte" ||
            type == "javaObject") {
            $("#" + sel + "_anchor").trigger('click');
        } else {
            $("#" + sel + "_anchor").trigger('click');
        }

    } else {

    }

    if (type == "invoke") {
        var new_sel = [];
        new_sel[0] = sel;
        if (!SILENT_SERVICE_ADD) {
            if (isInIframe()) {
                openSelectServiceModalDialogOnCreateService(ref,new_sel);
            } else {
                RECENT_ADDED_NODE = sel;
                openServicePopup();
            }
        }
    }

    // updatePathParamInAlias(ref.get_node(sel));

    return sel;

}

var keywords = ["abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "continue", "default", "do", "double", "else", "enum", "extends", "final", "finally", "float", "for", "if", "implements", "import", "instanceof", "int", "interface", "long", "native", "new", "null", "package", "private", "protected", "public", "return", "short", "static", "strictfp", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "try", "void", "volatile", "while"];

function createComponent(type, ref, selected, text) {
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
            swal({
                title: "Select packages",
                type: "error",
                confirmButtonColor: "#f2533e"
             });

        } else if (type == "folder") {
            swal({
                title: "The folder can be created only in the package",
                type: "error",
                confirmButtonColor: "#f2533e"
            });

        } else if (type == "api" || type == "flow" || type == "service" || type == "jdbc" || type == "sql" ||
            type == "properties") {
            swal({
                title: "This item can be created only in the folder",
                type: "error",
                confirmButtonColor: "#f2533e"
            });

        }
        return;
    }

    $("#consumer-groups").val(['']).trigger('change');
    $("#developer-groups").val(['']).trigger('change');
    $("#item-create-panel").html("Create New " + type);
    $("#item-create-heading").html(type + " name:");
    openNameItemPromptForm(type);
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

function createItemInSchema() {
    var progressbarDialog = document.getElementById("progressbarDialogForDescriptionBasedApiGeneration");
    var innerBar = document.getElementById("innerBarForDescriptionBasedApiGeneration");
    var percentage = document.getElementById("percentageForDescriptionBasedApiGeneration");

    if (NEW_ITEM_TYPE == "package") {
        packageManagerJsTreeRef.open_node("#" + NEW_ITEM_SEL + "_anchor");
    }

    if (NEW_ITEM_TYPE == "api" || NEW_ITEM_TYPE == "service" || NEW_ITEM_TYPE == "sql") {
        if ($("#developer-groups").val().length == 0) {
           swal({
                title: "Error",
                text: "Please select at least one Developers group",
                type: "error",
                confirmButtonColor: "#f2533e"
             });

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

    if (!validateNewItemName(text)) {
        //  swal('Item with this name is already created.', "", 'error');
        //createComponent(type, ref);
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

            asyncRestRequest("/files/packages/" + text + "/dependency/config/package.properties", null,
                "POST",
                function (response) {
                },
                function (error) {
                    console.error("Error in package.properties api call");
                });

        }

        if (NEW_ITEM_TYPE == "folder") {
            asyncRestRequest("/packages.middleware.pub.server.browse.saveEmptyFolder.main?packageName=" +
                NEW_ITEM_REF.get_path(NEW_ITEM_SEL, '/'), null,"GET",
                function (response) {
                },
                function (error) {
                    console.error("Error in saveEmptyFolder api call");
                });
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

            localStorage.setItem("pre-dev-groups", JSON.stringify({"developers": $("#developer-groups").val(), "consumers": $("#consumer-groups").val()}));

            path += "/" + thisNode.text + "." + thisNode.type + "&silentSave=true&developers_=" + $("#developer-groups").val() +
                "&consumers_=" + $("#consumer-groups").val();
            if (thisNode.type == "api") {
                let jsonData = {
                    "latest": {
                        "createdTS": "",
                        "input": [],
                        "output": [],
                        "api": [],
                        "api_info": {
                            "title": "",
                            "description": ""
                        }
                    },
                    "consumers": ($("#consumer-groups").val() || []).join(","),
                    "developers": ($("#developer-groups").val() || []).join(","),
                    "enableServiceDocumentValidation": false
                };

                let data = JSON.stringify(jsonData); // Convert object to JSON string if needed
                let checkBox = document.getElementById("auto_gr");
                if (checkBox.checked) {
                    let newData = createDescribedApi(thisNode,path,Servicepath);
                    if(newData && newData !== ""){
                        data = newData;
                    }
                }else {
                    const textCode = document.getElementById('description').value;
                    if (textCode && textCode.trim() !== "") {
                        let dataObject = JSON.parse(data);
                        dataObject.latest.api_info.description = textCode;
                        data = JSON.stringify(dataObject);
                    }
                    asyncRestRequest("/api" + Servicepath + "/" + thisNode.text + "." + thisNode.type, data, "POST", function (result) {
                        $("#middlewareCodeEditor").attr('src', getSystemResourcePath() + "/workspace/web/apiMaker/apiEditor.html?loadFile=" + path);
                    });
                }
                // window.open(getSystemResourcePath() + "/workspace/web/workspace.html?r=" + path, "_blank");
            } else if (thisNode.type == "service") {
                localStorage.setItem("service_silentSave", true);
                $("#middlewareCodeEditor").attr('src', getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/clike/serviceEditor.html?loadFile=" + path);
            } else if (thisNode.type == "sql") {
                let data = JSON.stringify({
                    "input": [
                        { "id": "j1_2", "text": "inputDocList", "icon": null, "li_attr": { "id": "j1_2" }, "a_attr": { "href": "#", "id": "j1_2_anchor" }, "state": { "loaded": true, "opened": true, "selected": false, "disabled": false }, "data": {}, "children": [], "type": "documentList" },
                        { "id": "j1_3", "text": "txConn", "icon": null, "li_attr": { "id": "j1_3" }, "a_attr": { "href": "#", "id": "j1_3_anchor" }, "state": { "loaded": true, "opened": false, "selected": false, "disabled": false }, "data": {}, "children": [], "type": "javaObject" },
                        { "id": "j1_4", "text": "isTxn", "icon": null, "li_attr": { "id": "j1_4" }, "a_attr": { "href": "#", "id": "j1_4_anchor" }, "state": { "loaded": true, "opened": false, "selected": false, "disabled": false }, "data": {}, "children": [], "type": "boolean" }
                    ],
                    "output": [
                        { "id": "j2_1", "text": "outputDocList", "icon": null, "li_attr": { "id": "j2_1" }, "a_attr": { "href": "#", "id": "j2_1_anchor" }, "state": { "loaded": true, "opened": false, "selected": false, "disabled": false }, "data": {}, "children": [], "type": "documentList" },
                        { "id": "j2_2", "text": "rows", "icon": null, "li_attr": { "id": "j2_2" }, "a_attr": { "href": "#", "id": "j2_2_anchor" }, "state": { "loaded": true, "opened": false, "selected": false, "disabled": false }, "data": {}, "children": [], "type": "integer" },
                        { "id": "j2_3", "text": "success", "icon": null, "li_attr": { "id": "j2_3" }, "a_attr": { "href": "#", "id": "j2_3_anchor" }, "state": { "loaded": true, "opened": false, "selected": false, "disabled": false }, "data": {}, "children": [], "type": "boolean" },
                        { "id": "j2_4", "text": "error", "icon": null, "li_attr": { "id": "j2_4" }, "a_attr": { "href": "#", "id": "j2_4_anchor" }, "state": { "loaded": true, "opened": false, "selected": false, "disabled": false }, "data": {}, "children": [], "type": "string" }
                    ],
                    "sql": "",
                    "version": "v1",
                    "consumers": ($("#consumer-groups").val() || []).join(","),
                    "developers": ($("#developer-groups").val() || []).join(",")
                });
                asyncRestRequest("/sql" + Servicepath + "/" + thisNode.text + "." + thisNode.type, data, "POST", function (result) {
                    $("#middlewareCodeEditor").attr('src', getSystemResourcePath() + "/workspace/web/CodeMirror-master/mode/sql/sqlEditor.html?loadFile=" + path);
                });
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
        swal({
            title: "Error in creation, Please try again",
            type: "error",
            confirmButtonColor: "#f2533e"
         });

    }


    function openAgentChat(agentID, prompt, chatID, enableInternetGrounding, chatTitle, listenTranscripts, listenResult, onClose, onError) {
    console.log("Opening agent chat with ID:", agentID);
    var wsUrl = window.ENV.WS_BASE_URL + '/ws/tenant/' + localStorage.getItem("tenant") + '/packages.Awareness.assistant.api.chat.main'
        + "?access_token=" + encodeURIComponent(localStorage.getItem("AuthToken"));
    var socket = new WebSocket(wsUrl);

    const payload = {
        "*payload": {
            "agentID": agentID,
            "prompt": prompt,
            "chatID": chatID,
            "enableInternetGrounding": enableInternetGrounding,
            "chatTitle": chatTitle
        }
    };

    let count = 0;
    let lastMessage = "";
    let conversationID = "";
    let messageId = "";

    socket.onopen = () => {
        socket.send(JSON.stringify(payload));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data || '{}');

        if (Object.keys(data).length == 1) {
            conversationID = data.conversationChatID;
            return;
        }

        if (data.tID) {
            messageId = data.tID;
        }

        lastMessage = event.data;
        if (count > 0) {
            listenTranscripts(lastMessage);
        }
        count++;
    };

    socket.onclose = () => {
        listenResult(lastMessage, conversationID, messageId);
        onClose();
    };

    socket.onerror = (error) => {
        console.log(error);
        onError(error);
    };
}

function isJSON(str) {
    try {
        JSON.parse(removeJSONComments(str));
        return true;
    } catch (e) {
        return false;
    }
}

function normalizeCoderAgentArrayResponse(response) {
    if (response === null || typeof response === "undefined") {
        return "error";
    }

    if (response && typeof response === "object" && !Array.isArray(response) && Object.prototype.hasOwnProperty.call(response, "error")) {
        return "error";
    }

    const responsePayload = response && Object.prototype.hasOwnProperty.call(response, "resp") ? response.resp : response;
    const parsedResponse = parseJsonValue(responsePayload);

    if (parsedResponse === null || typeof parsedResponse === "undefined") {
        return "error";
    }

    if (typeof parsedResponse === "string") {
        const normalizedResponse = parsedResponse.trim().toLowerCase();
        if (normalizedResponse === "" || normalizedResponse === "error") {
            return "error";
        }
    }

    if (parsedResponse && typeof parsedResponse === "object" && !Array.isArray(parsedResponse) && Object.prototype.hasOwnProperty.call(parsedResponse, "error")) {
        return "error";
    }

    if (Array.isArray(parsedResponse)) {
        return parsedResponse.map(function (item, index) {
            const parsedItem = parseJsonValue(item);

            if (typeof parsedItem !== "object" || parsedItem === null || Array.isArray(parsedItem)) {
                throw new Error("Array item at index " + index + " is not a valid JSON object.");
            }

            return parsedItem;
        });
    }

    if (typeof parsedResponse === "object" && parsedResponse !== null) {
        return parsedResponse;
    }

    return "error";
}

function parseJsonValue(value) {
    let parsedValue = value;
    let parseAttempts = 0;

    while (typeof parsedValue === "string" && parseAttempts < 3) {
        let cleanedValue = removeJSONComments(parsedValue).trim();
        const extractedValue = extractJsonFromResponse(cleanedValue);

        if (extractedValue) {
            cleanedValue = extractedValue;
        }

        if (!isJSON(cleanedValue)) {
            break;
        }

        parsedValue = JSON.parse(cleanedValue);
        parseAttempts++;
    }

    return parsedValue;
}



    var progressInterval;
    var width = 0;
    var isProgressBarRunning = false;

    function cleanupCreateDescribedApiAgentPopup() {
        var $select = $("#createDescribedApiAgentSelect");
        if ($select.length && $.fn.select2 && $select.hasClass("select2-hidden-accessible")) {
            try {
                $select.select2("destroy");
            } catch (e) {

            }
        }

        $("#createDescribedApiAgentPicker").remove();
    }

    function startProgressBarForSmartApiGeneration(duration) {
        if (isProgressBarRunning) {
            // console.warn("Progress bar is already running.");
            return;
        }

        isProgressBarRunning = true;
        clearInterval(progressInterval);
        progressInterval = setInterval(function() {
            if (!isProgressBarRunning) {
                clearInterval(progressInterval);
                // console.log("Progress bar interval stopped because the flag changed.");
                return;
            }

            if (width < 100) {
                width++;
                innerBar.style.width = width + "%";
                percentage.innerHTML = width + "%";
                // console.log("Progress bar width increased:", width + "%");
            } else {
                clearInterval(progressInterval);
                // console.log("Progress bar reached 100%");
            }
        }, duration / 100);
    }

    function createDescribedApi(thisNode,path,Servicepath) {
        const textCode = document.getElementById('description').value;
        let finalResponse;

                //document.getElementById("smartModelDialog").style.display = "block";
                if(textCode.trim() !== ""){
                    var apiCallCompleted = false;

                    var message = "Convert this text to Syncloop service: " + "\n" + textCode;

                    //const assistantID = "asst_Cx2244ZvFubBppoqP7wpg23v";
                    function handleFailure(errorMsg, errorObj) {
                        cleanupCreateDescribedApiAgentPopup();
                        progressbarDialog.style.display = "none";
                        width = 0;
                        innerBar.style.width = width + "%";
                        percentage.innerHTML = width + "%";
                        swal({
                            title: "Error Occurred",
                            text: errorMsg,
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });

                        if (errorObj) {
                            console.error("Error fetching response:", errorObj);
                        }
                    }

                    function startApiGeneration(agentID) {
                        $("#smartImportModal").modal('toggle');
                        progressbarDialog.style.display = "block";
                        width = 0;
                        innerBar.style.width = width + "%";
                        percentage.innerHTML = width + "%";
                        console.log("Starting progress bar with 0% width");
                        startProgressBarForSmartApiGeneration(120000); // 120 seconds

                        $("#percentage_b5").html("Importing your customized API... [Preparing]");
                        console.log("Message sent to API thread for processing:", message);

                        openAgentChat(
                            agentID,
                            message,
                            null,
                            false,
                            "Auto generate API",
                            function () {
                            },
                            function (response) {
                                $("#percentage_b5").html("Importing your customized API... [Initializing]");
                                let extractedJson = null;
                                const parsedResponse = parseJsonValue(response);
                                console.log("Test Casesresponse -->", parsedResponse);

                                try {
                                    extractedJson = normalizeCoderAgentArrayResponse(parsedResponse);
                                    if(extractedJson === "error") {
                                        handleFailure("Unable to parse the response. Please try again.");
                                        return;
                                    }
                                } catch (error) {
                                    handleFailure("Error in communication.", error);
                                    return;
                                }

                                if (extractedJson !== null) {
                                    //updateServiceWithComments(true, extractedJson, data);
                                    //updateServiceUsingGPT(true, JSON.stringify(extractedJson));

                                    try {
                                        let jsonWithoutComments = removeJSONComments(extractedJson);
                                        console.log("JSON without comments:", jsonWithoutComments);
                                        if (isStrJSON(jsonWithoutComments)) {
                                            finalResponse = JSON.parse(jsonWithoutComments);
                                            // missingPartBuilder(parsedJSON.latest.api);
                                            // loadApiService(parsedJSON);

                                            if (null != localStorage.getItem("pre-dev-groups")) {
                                                const preDevGroups = JSON.parse(localStorage.getItem("pre-dev-groups"));
                                                finalResponse.consumers = preDevGroups.consumers.toString();
                                                finalResponse.developers = preDevGroups.developers.toString();
                                                localStorage.removeItem("pre-dev-groups");
                                            }

                                             asyncRestRequest("/api" + Servicepath + "/" + thisNode.text + "." + thisNode.type, JSON.stringify(finalResponse), "POST", function (result) {
                                             $("#middlewareCodeEditor").attr('src', getSystemResourcePath() + "/workspace/web/apiMaker/apiEditor.html?loadFile=" + path);
                                            });
                                        } else {
                                            console.log(extractedJson);
                                            cleanupCreateDescribedApiAgentPopup();
                                            swal({
                                                title: "Error Occurred",
                                                text: "Please try again!",
                                                type: "error",
                                                confirmButtonColor: "#f2533e" // Change this to your theme color
                                            });

                                            resetProgressBar();
                                            return;
                                        }
                                    } catch (e) {
                                        console.error("Error during JSON parsing:", e);
                                    }




                                    completeProgressBarSmartApiGeneration();
                                    $("#description").val('');
                                    $("#auto_gr").prop('checked', false);
                                }
                            },
                            function () {
                            },
                            function (error) {
                                const errorMsg = (error && (error.responseText || error.statusText || error.message)) || "Error in communication.";
                                handleFailure(errorMsg, error);
                            }
                        );
                    }

                    function openAgentSelectionPopup(agents) {
                        var optionsHtml = "<option value=''>Select Agent</option>";

                        agents.forEach(function (agent) {
                            optionsHtml += "<option value='" + String(agent.identifier || "").replace(/'/g, "&#39;") + "'>" + String(agent.name || agent.identifier || "").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</option>";
                        });

                        swal({
                            title: "Select Agent",
                            text: "Choose an agent to continue.",
                            showCancelButton: true,
                            confirmButtonColor: "#2C61F5",
                            cancelButtonText: "Cancel",
                            confirmButtonText: "Continue",
                            closeOnConfirm: false
                        }, function (isConfirm) {
                            if (!isConfirm) {
                                cleanupCreateDescribedApiAgentPopup();
                                resetProgressBar();
                                return;
                            }

                            const agentID = $("#createDescribedApiAgentSelect").val() || null;
                            if(agentID === undefined || agentID === null || agentID === "") {
                                $("#createDescribedApiAgentError").show();
                                return false;
                            }

                            window.CurrentSelectAgent = agentID;
                            cleanupCreateDescribedApiAgentPopup();
                            swal.close();
                            startApiGeneration(agentID);
                        });

                        setTimeout(function () {
                            var $popup = $(".sweet-alert:visible:last");
                            if (!$popup.length || $popup.find("#createDescribedApiAgentSelect").length > 0) {
                                return;
                            }

                            $popup.find("p").after(
                                '<div id="createDescribedApiAgentPicker" style="margin-top:14px;text-align:left;">'
                                + '<select id="createDescribedApiAgentSelect" style="width:100%;">' + optionsHtml + '</select>'
                                + '<div id="createDescribedApiAgentError" style="display:none;color:#f2533e;font-size:12px;margin-top:8px;">Please select an agent to continue.</div>'
                                + '</div>'
                            );

                            var $select = $("#createDescribedApiAgentSelect");
                            if ($.fn.select2) {
                                $select.select2({
                                    width: "100%",
                                    dropdownParent: $popup,
                                    placeholder: "Select Agent",
                                    minimumResultsForSearch: agents.length > 6 ? 0 : Infinity
                                });

                                $popup.find(".select2-container").css("margin-top", "12px");
                                $popup.find(".select2-selection").css({
                                    height: "36px",
                                    border: "1px solid #d9d9d9",
                                    borderRadius: "4px"
                                });
                                $popup.find(".select2-selection__rendered").css({
                                    lineHeight: "34px",
                                    paddingLeft: "12px",
                                    textAlign: "left"
                                });
                                $popup.find(".select2-selection__arrow").css("height", "34px");
                            } else {
                                $select.css({
                                    marginTop: "12px",
                                    height: "36px",
                                    border: "1px solid #d9d9d9",
                                    borderRadius: "4px",
                                    padding: "6px 10px"
                                });
                            }

                            $select.on("change", function () {
                                $("#createDescribedApiAgentError").hide();
                            });
                        }, 0);
                    }

                    const currentAgentID = ((window.CurrentSelectAgent || "") + "").trim() || null;
                    if(currentAgentID !== undefined && currentAgentID !== null && currentAgentID !== "") {
                        startApiGeneration(currentAgentID);
                        return;
                    }

                    asyncRestRequest(`/packages.Awareness.dashboard.services.api.exportAll.main`, null, 'GET', function (data) {
                        var agents = ((data && data.spec && data.spec.Agents) || []).filter(function (agent) {
                            return agent && agent.props && agent.props.api_coder === true;
                        });

                        if (!agents.length) {
                            handleFailure("No API coder agent is available. Please configure an agent and try again.");
                            return;
                        }

                        openAgentSelectionPopup(agents);
                    }, function (response) {
                        const errorMsg = (response && (response.responseText || response.statusText || response.message)) || "Unable to load agents.";
                        handleFailure(errorMsg, response);
                    });
                }





                //     sendMessageToThreadForDescriptionAPI(message, assistantID, true).then(response => {
                //         console.log("Response received from thread:", response);
                //         apiCallCompleted = true;

                //         if ("null" == response.thread_id) {
                //             console.error("Thread ID is null. Aborting.");
                //             swal({
                //                 title: "Error Occurred",
                //                 text: "Error in communication.",
                //                 type: "error",
                //                 confirmButtonColor: "#f2533e" // Example red/orange color
                //             });

                //             apiCallCompleted = true;
                //             resetProgressBar();
                //             return;
                //         }

                //         $("#percentage_b5").html("Importing your customized API... [Initializing]");
                //         eventStream("/v1/" + response.thread_id + "/run_stream?serviceType=" + "API" + "&assistant_id=" + "-",
                //             function() {
                //             },
                //             function (errorMsg) {
                //                 resetProgressBar();
                //                swal({
                //                     title: "Error Occurred",
                //                     text: errorMsg,
                //                     type: "error",
                //                     confirmButtonColor: "#f2533e"
                //                 });


                //             },
                //             function (response) {
                //                 $("#percentage_b5").html("Importing your customized API... [Completed]");
                //                 let extractedJson = null;

                //                 for (let i = 0 ; i < response.length ; i++) {
                //                     let json = response.length > 1 ? null : extractJsonFromResponse(response[i]);
                //                     if (json === null) {
                //                         json = response[i];
                //                         if (i > 0) {
                //                             json = response[i].replace(/```json/g, '');
                //                         }
                //                         if (i == (response.length - 1)) {
                //                             //json = json.replace(/```/g, '');
                //                         }
                //                     }
                //                     if (extractedJson == null) {
                //                         extractedJson = json.trim();
                //                     } else {
                //                         extractedJson += json.trim();
                //                     }
                //                 }
                //                 extractedJson = extractedJson.replace(/\n/g, '');
                //                 if (response.length > 1) {
                //                     extractedJson = extractJsonFromResponse(extractedJson);
                //                 }

                //                 if (extractedJson !== null) {
                //                     //updateServiceWithComments(true, extractedJson, data);
                //                     //updateServiceUsingGPT(true, JSON.stringify(extractedJson));
                //                     let requiredReset = !SDK_EMBEDDED;
                //                     SDK_EMBEDDED = true;
                //                     try {
                //                         let jsonWithoutComments = removeJSONComments(extractedJson);
                //                         console.log("JSON without comments:", jsonWithoutComments);
                //                         if (isStrJSON(jsonWithoutComments)) {
                //                             finalResponse = JSON.parse(jsonWithoutComments);
                //                             /*missingPartBuilder(parsedJSON.latest.api);
                //                             loadApiService(parsedJSON);*/
                //                         } else {
                //                             console.log(extractedJson);
                //                             swal({
                //                                 title: "Error Occurred",
                //                                 text: "Please try again!",
                //                                 type: "error",
                //                                 confirmButtonColor: "#f2533e" // Change this to your theme color
                //                             });

                //                             resetProgressBar();
                //                             return;
                //                         }
                //                     } catch (e) {
                //                         console.error("Error during JSON parsing:", e);
                //                     }
                //                     if (requiredReset) {
                //                         SDK_EMBEDDED = false;
                //                     }

                //                     if (null != localStorage.getItem("pre-dev-groups")) {
                //                         const preDevGroups = JSON.parse(localStorage.getItem("pre-dev-groups"));
                //                         finalResponse.consumers = preDevGroups.consumers.toString();
                //                         finalResponse.developers = preDevGroups.developers.toString();
                //                         localStorage.removeItem("pre-dev-groups");
                //                     }

                //                     asyncRestRequest("/api" + Servicepath + "/" + thisNode.text + "." + thisNode.type, JSON.stringify(finalResponse), "POST", function (result) {
                //                         $("#middlewareCodeEditor").attr('src', getSystemResourcePath() + "/workspace/web/apiMaker/apiEditor.html?loadFile=" + path);
                //                     });

                //                     completeProgressBarSmartApiGeneration();
                //                     $("#description").val('');
                //                     $("#auto_gr").prop('checked', false);


                //                 }

                //             }, function (bytes) {
                //                 $("#percentage_b5").html("Generating your file... " + formatSize(bytes));
                //             }, response.thread_id);


                //     }).catch(error => {
                //         console.error("Error fetching response:", error);
                //         apiCallCompleted = true;
                //         swal({
                //             title: "Error Occurred",
                //             text: "Please check your network connection",
                //             type: "error",
                //             confirmButtonColor: "#f2533e" // Customize as needed
                //         });

                //         resetProgressBar();
                //     });

                // }

    }



    function completeProgressBarSmartApiGeneration() {
        if (!isProgressBarRunning) {
            // console.warn("Progress bar is not running.");
            return;
        }

        clearInterval(progressInterval);
        // console.log("Progress bar interval cleared by completeProgressBarSmartApiGeneration");

        isProgressBarRunning = false;

        var targetWidth = 100;
        var interval = setInterval(function() {
            if (width < targetWidth) {
                width++;
                innerBar.style.width = width + "%";
                percentage.innerHTML = width + "%";
            } else {
                clearInterval(interval);
                setTimeout(function() {
                    resetProgressBar();
                    cleanupCreateDescribedApiAgentPopup();
                   swal({
                    title: "All Done!",
                    text: "Your file has been imported successfully.",
                    type: "success",
                    confirmButtonColor: "#2C61F5" // Example: blue button
                    });

                }, 500); // Pause for 0.5 seconds
            }
        }, 10); // Fast completion to 100%
    }

    function resetProgressBar() {
        isProgressBarRunning = false;
        cleanupCreateDescribedApiAgentPopup();
        progressbarDialog.style.display = "none";
        width = 0;
        innerBar.style.width = width + "%";
        percentage.innerHTML = width + "%";
        progressbarDialog.style.display = "none";
    }


    function isStrJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    return NEW_ITEM_SEL;
}

function createItemInSchemaValidate(e) {
    var sub_btn = document.getElementById('createItem');
    var item_filed = document.getElementById('packages_item_name');
    $('#info_message').text("");
    var text = e.value.trim();
    var message = "";
    for (var i = 0; i < keywords.length; i++) {
        if (keywords[i] == text) {
            var message = NEW_ITEM_TYPE + ' name. This is a reserved keyword.';
            $('#info_message').text(capitalize(message));
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
        $('#info_message').text(capitalize(message));
        sub_btn.classList.add("btn_disabled");
        item_filed.classList.add("packages_item_name_eb");
        sub_btn.classList.remove("btn-gry");
        sub_btn.classList.remove("btn");
        sub_btn.addAttribute("disabled");
        return ;
    }

    if (text.charAt(0) >= 48 || text.charAt(0) <= 57) {
        var message = NEW_ITEM_TYPE + ' name shouldn\'t start from numeric or space.';
        $('#info_message').text(capitalize(message));
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
        $('#info_message').text(capitalize(message));
        sub_btn.classList.add("btn_disabled");
        item_filed.classList.add("packages_item_name_eb");
        sub_btn.classList.remove("btn-gry");
        sub_btn.classList.remove("btn");
        sub_btn.addAttribute("disabled");
        return;
    }

    if (!validateNewItemName(text)) {
        var message = 'Item with this name is already created.';
        $('#info_message').text(capitalize(message));
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

function createNewTenant(ref) {

    const tenantNameInput = document.getElementById('tenantName');
    const text = tenantNameInput.value.trim();
    //const sub_btn = document.querySelector('button'); // Assuming there's only one button

    var keywords = ["abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "continue", "default", "do", "double", "else", "enum", "extends", "final", "finally", "float", "for", "if", "implements", "import", "instanceof", "int", "interface", "long", "native", "new", "null", "package", "private", "protected", "public", "return", "short", "static", "strictfp", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "try", "void", "volatile", "while"];
    var message;

    $(ref).attr("disabled", "disabled");

    var NEW_ITEM_TYPE = "Tenant";
    for (var i = 0; i < keywords.length; i++) {
        if (keywords[i] == text) {
            message = keywords[i] + ' is a reserved keyword and cannot be used as a tenant name.';
           swal({
                title: "Validation",
                text: capitalize(message),
                type: "error",
                confirmButtonColor: "#f2533e"
            });

            $(ref).removeAttr("disabled");
            return;
        }
    }


    if (text.length > 100) {
        message = NEW_ITEM_TYPE + ' name\'s length must less than 100 characters.';
       swal({
            title: "Validation",
            text: capitalize(message),
            type: "error",
            confirmButtonColor: "#f2533e"
        });

        $(ref).removeAttr("disabled");
        return ;
    }

    if (text.trim() == "") {
        $('#info_message').text("");
        message = NEW_ITEM_TYPE + ' name cannot be empty.';
        swal({
            title: "Validation",
            text: capitalize(message),
            type: "error",
            confirmButtonColor: "#f2533e"
        });

        $(ref).removeAttr("disabled");
        return;
    }

    if (text.charAt(0) >= 48 || text.charAt(0) <= 57) {
        message = NEW_ITEM_TYPE + ' name shouldn\'t start from numeric.';
       swal({
            title: "Validation",
            text: capitalize(message),
            type: "error",
            confirmButtonColor: "#f2533e"
        });

        $(ref).removeAttr("disabled");
        return;
    }

    const regex = new RegExp('^[a-zA-Z]+[A-Za-z0-9\\_]*$');
    if (!regex.test(text)) {
        message = NEW_ITEM_TYPE + ' name should contain only alphanumeric characters.';
        //$('#info_message').text(capitalize(message));
       swal({
            title: "Validation",
            text: capitalize(message),
            type: "error",
            confirmButtonColor: "#f2533e"
        });

        $(ref).removeAttr("disabled");
        return;
    }

    //sub_btn.classList.remove("btn_disabled");
   // item_filed.classList.remove("packages_item_name_eb");
    //sub_btn.classList.add("btn");
    //sub_btn.classList.add("btn-gry");
    // sub_btn.disabled = false;

    var url = "/public/packages.middleware.pub.service.utils.checkIfTenantExists.main?tenantName=" + text;
    asyncRestRequest(
        url,
        null,
        "POST",
        function(response) {
            let url = "/public/createNewTenant?tenantName=" + text;
            /*
            let request = {
                "tenantName": text,
                "redirect": "middleware/pub/server/ui/workspace/web/workspace.html"
            };
            if (null == localStorage.getItem("licenseCredits")) {

            } else {
                let licenseCredits = localStorage.getItem("licenseCredits");
                request['licenseCredits'] = licenseCredits;
                localStorage.removeItem("licenseCredits");
            }

            swal({
                title: "Account creation in progress...",
                text: "Please wait while we setup your account.",
                confirmButtonColor: "#f2533e",
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            let receivedStatus = false;

            const socket = new WebSocket("/ws" + url);

            socket.addEventListener('open', function (event) {
                console.log("Connected to WebSocket");
                socket.send(JSON.stringify(request));
            });

            socket.addEventListener('message', function (event) {
                console.log('Message from server:', event.data);
                let data = {};
                try {
                    data = JSON.parse(event.data);
                } catch (e) {

                }

                if (data['creationStatus'] == "SUCCESS") {
                    receivedStatus = true;
                    warnOnExit = false;
                    location.href = "middleware/pub/server/ui/workspace/web/dashboard.html";
                    socket.close();
                }

                if (data['message'] == "[DONE]") {
                    receivedStatus = true;
                    if (data['status']) {
                        warnOnExit = false;
                        location.href = "middleware/pub/server/ui/workspace/web/dashboard.html";
                    } else {
                        $(ref).removeAttr("disabled");
                        swal({
                            title: 'Error.',
                            text: 'Tenant is not created successfully. Please try again',
                            type: 'error',
                            confirmButtonColor: '#f2533e' // You can change this color
                        });
                    }
                    socket.close();
                } else if (null != data['error']) {
                    $(ref).removeAttr("disabled");
                    swal({
                        title: 'Error.',
                        text: 'Tenant is not created successfully. Please try again',
                        type: 'error',
                        confirmButtonColor: '#f2533e' // You can change this color
                    });
                    socket.close();
                }
            });

            // Handle errors
            socket.addEventListener('error', function (event) {
                console.error('WebSocket error:', event);
                $(ref).removeAttr("disabled");
                swal({
                    title: 'Error.',
                    text: 'Tenant is not created successfully. Please try again',
                    type: 'error',
                    confirmButtonColor: '#f2533e' // You can change this color
                });
            });

            // Handle connection close
            socket.addEventListener('close', function (event) {
                if (!receivedStatus) {
                    $(ref).removeAttr("disabled");
                    swal({
                        title: 'Error.',
                        text: 'Tenant is not created successfully. Please try again',
                        type: 'error',
                        confirmButtonColor: '#f2533e' // You can change this color
                    });
                }
                console.log('WebSocket closed:', event);
            });

            setInterval(function () {
                asyncRestRequest("middleware/pub/server/ui/workspace/web/dashboard.html?_ts=" + new Date().getTime(), null, "GET", function(response) {
                    warnOnExit = false;
                }, function (errorMsg) {
                    if ( errorMsg.statusText === "parsererror") {
                        warnOnExit = false;
                        location.href = "/";
                    }

                });
            }, 1000);*/

            asyncRestRequest(
                url,
                null,
                "GET",
                function(response) {
                    if (response.status === true) {
                        warnOnExit = false;
                        location.href = "middleware/pub/server/ui/workspace/web/dashboard.html";
                    } else {
                        $(ref).removeAttr("disabled");
                        swal({
                            title: 'Error.',
                            text: 'Tenant is not created successfully. Please try again',
                            type: 'error',
                            confirmButtonColor: '#f2533e' // You can change this color
                        });
                    }
                }, function(errormessage) {
                    $(ref).removeAttr("disabled");
                    swal({
                        title: 'Error.',
                        text: 'Tenant is not created successfully. Please try again',
                        type: 'error',
                        confirmButtonColor: '#f2533e' // You can change this color
                    });
                });



        },
        function(errormessage) {
            if(errormessage.status == 404) {
                swal({
                    title: 'Tenant already exists.',
                    text: 'Please choose a different name to proceed.',
                    type: 'error',
                    confirmButtonColor: '#f2533e' // You can change this color
                });

            }else
            swal({
                title: 'Error',
                text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                type: 'error',
                confirmButtonColor: '#f2533e'
                });

            $(ref).removeAttr("disabled");
        }
    );
}

function createAutoTenant() {
    let url = "/public/createNewTenant";

    asyncRestRequest(
        url,
        null,
        "GET",
        function(response) {
            if (response.status === true) {
                // location.href = "middleware/pub/server/ui/workspace/web/dashboard.html";
                location.href = "/files/gui/middleware/oidc.html";
            } else {

                swal({
                    title: 'Error.',
                    text: 'Tenant is not created successfully. Please try again',
                    type: 'error',
                    confirmButtonColor: '#f2533e' // You can change this color
                });
            }
        }, function(errormessage) {

        });
}

function importAPIInSchemaValidate(e) {
    var sub_btn = document.getElementById('button');
    var item_filed = document.getElementById('package_name');
    $('#info_message').text("");
    var text = e.value.trim();
    var message = "";
    var NEW_ITEM_TYPE = "Package";
    for (var i = 0; i < keywords.length; i++) {
        if (keywords[i] == text) {
            var message = NEW_ITEM_TYPE + ' name. This is a reserved keyword.';
            $('#info_message').text(capitalize(message));
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
        $('#info_message').text(capitalize(message));
        sub_btn.classList.add("btn_disabled");
        item_filed.classList.add("packages_item_name_eb");
        sub_btn.classList.remove("btn-gry");
        sub_btn.classList.remove("btn");
        sub_btn.disabled = true;
        return ;
    }

    if (text.charAt(0) >= 48 || text.charAt(0) <= 57) {
        var message = NEW_ITEM_TYPE + ' name shouldn\'t start from numeric.';
        $('#info_message').text(capitalize(message));
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
        $('#info_message').text(capitalize(message));
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

function validateVariableName(text, node) {
    if (null != node) {
        updatePathParamInAlias(node);
    }
    if(text == "*payload" || text == "*formData"){
        var children = inputJstreeRef.get_node("#").children;

        for (var i = 0; i < children.length; i++) {
            var childNode = inputJstreeRef.get_node(children[i]);
            var childName = childNode.text;

            switch (text) {
                case "*payload":
                    if (childName == "*formData") {
                        return "*payload cannot be added because *formData already exists.";
                    }
                    break;
                case "*formData":
                    if (childName == "*payload") {
                        return "*formData cannot be added because *payload already exists.";
                    }
                    break;
            }
        }

    }


    console.log(node)
    if (text == "*payload" || text == "*formData") {
        var urlLoadFile = loadFile.trim() + "$";
        var packageName = ("/" + urlLoadFile).replace("/files/", "alias?fqn=").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main");
        //var packageName=("/"+loadFile).replace("/files/","alias?fqn=").replace(".service",".main").replace(".flow",".main");
        packageName = packageName.split("/").join(".");
        //alert(packageName);
        var urlPath = "/" + packageName;

        $("#serviceHTTPMethodValue").val("POST");

        /*asyncRestRequest(urlPath, null, "GET", function (result) {
            if (result.status == 404) {
                let existingAlias = ($("#serviceAliasValue").val() || "").trim();

                let aliasToUse = existingAlias.length > 0
                    ? existingAlias.replace(/^\/+/, '')
                    : ("/" + urlLoadFile)
                        .replace("/files/", "")
                        .replace(".service$", ".main")
                        .replace(".api$", ".main")
                        .replace(".flow$", ".main")
                        .replace(".sql$", ".main")
                        .split("/")
                        .join(".");

                let encodedAlias = encodeURIComponent("POST/" + aliasToUse);

                asyncRestRequest(urlPath + "&alias=" + encodedAlias, null, "POST", function (result) {
                    refreshAlias();
                });

            } else if (result.alias.split('/')[0] == "GET") {
                asyncRestRequest(urlPath + "&alias=POST/" + result.alias.split('/')[1], null, "POST", function (result) {
                    refreshAlias();
                });
           }
        }, function(error){});*/
    }


    var message = "";
    var NEW_ITEM_TYPE = "Variable";
    for (var i = 0; i < keywords.length; i++) {
        if (keywords[i] == text) {
            var message = NEW_ITEM_TYPE + ' name. This is a reserved keyword.';
            return message;
        }
    }

    if (text.trim().length === 0) {
        var message = NEW_ITEM_TYPE + ' name cannot be empty.';
        return message;
    }

    if (text.startsWith(" ")) {
        var message = NEW_ITEM_TYPE + ' name cannot start with a space.';
        return message;
    }

    if (text.endsWith(" ")) {
        var message = NEW_ITEM_TYPE + ' name cannot end with a space.';
        return message;
    }


    if (text.length > 100) {
        var message = NEW_ITEM_TYPE + ' name\'s length must less than 100 characters.';
        return message;
    }

    if (text.charAt(0) >= 48 || text.charAt(0) <= 57) {
        var message = NEW_ITEM_TYPE + ' name shouldn\'t start from numeric.';
        return message;
    }

    // const regex = new RegExp('[A-Za-z0-9_]+');
    const regex = new RegExp('^[a-zA-Z]+[A-Za-z0-9\\_\\-]*$');
        if (!regex.test(text) && !text.startsWith("*")) {
            var message = NEW_ITEM_TYPE + ' Type. Name can only contain alphanumeric characters.';
            return message;
        }

    if (text.trim() == "") {
        return message;
    }


    return 0;
}

function updatePathParamInAlias(node) {
    let parentNode = null;
    if (node.text === "*pathParameters") {
        parentNode = node;
    } else {
        let theNode = inputJstreeRef.get_node(node.parent);
        if(theNode == null || theNode == false){
            let childNode = inputJstreeRef.get_node(node);
            theNode = inputJstreeRef.get_node(childNode.parent);
        }
        let text = theNode.text;
        if (text === "*pathParameters") {
            parentNode = theNode;
        }
    }

    let existingAlias = $("#serviceAliasValue").val();

    // Delete Case
    let isParamDeleted = inputJstreeRef.get_node(node.id);
    if(!isParamDeleted){
        const paramRegex = new RegExp(`/{${node.text}}`, "g");
        existingAlias = existingAlias.replace(paramRegex, "");
    }

    if (null != parentNode) {
        let pathNodeData = parentNode;

        if (pathNodeData.children.length >= 0) {

            if (!existingAlias || existingAlias.trim() === "") {
                let urlLoadFile = loadFile.trim() + "$";
                let packageName = ("/" + urlLoadFile)
                    .replace("/files/", "alias?fqn=")
                    .replace(".service$", ".main")
                    .replace(".api$", ".main")
                    .replace(".flow$", ".main")
                    .replace(".sql$", ".main");
                packageName = packageName.split("/").join(".");
                existingAlias = "/" + packageName;
            }
            pathNodeData.children.forEach(childId => {
                let childNode = inputJstreeRef.get_node(childId);
                if (childNode.text && !childNode.text.startsWith("*")) {
                    const paramRegex = new RegExp(`\\{${childNode.original.text || childNode.text}\\}`, 'g');

                    // Rename if the parameter exists in the alias
                    if (paramRegex.test(existingAlias)) {
                        existingAlias = existingAlias.replace(paramRegex, `{${childNode.text}}`);
                    } else {
                        // Add new parameter if it doesn't exist
                        if (!existingAlias.endsWith('/')) {
                            existingAlias += '/';
                        }
                        existingAlias += `{${childNode.text}}`;
                    }

                    // Store the original name for next updates
                    childNode.original.text = childNode.text;
                }
            });

            // Clean up extra slashes
            existingAlias = existingAlias.replace(/\/\/+/g, "/").replace(/\/$/, "");
            $("#serviceAliasValue").val(existingAlias);
        }

        UpdateConfigURL();
    }
}


function changeCurrentNodeType(value) {
    var node = currentSelectedJSONObject.node;

    if (value == true)
        currentSelectedJSONObject.ref.set_type(node, currentSelectedJSONObject.nodeType + 'List');
    else
        currentSelectedJSONObject.ref.set_type(node, currentSelectedJSONObject.nodeType);

    if (currentSelectedJSONObject.jsTreeId === "#landing_arrow_jsTree") {
        mapperObj.renameInitiatedDataType(landing_arrow_jsTree_ref.get_node(currentSelectedJSONObject.node),
            currentSelectedJSONObject.nodeType + 'List');
    }
    //currentSelectedNode.
}

function updateColumnType(value) {
    currentSelectedJSONObject.selNode.data.columnType = value;
}


function openConfigurationProprties() {
    //alert("iuiojj");
    var modal = document.getElementById("configurePropertiesModelDialog");
    var span = document.getElementById("closeConfigurePropertiesModelDialog");
    collecta('Open', '', 'API Configuration', 'Open API Configuration');
    span.onclick = function () {
        var alias = $("#serviceAliasValue").val();
        alias = alias.replace(/\/{2,}/g, '/');
        var trimmedAlias = alias.trim();
        if (trimmedAlias.length === 0) {
           swal({
                title: "Failed to save. The provided alias is empty",
                type: "error",
                confirmButtonColor: "#f2533e"
            });

            return;
        }

        if (trimmedAlias.length === 1 && trimmedAlias === "/") {
           swal({
                title: "Failed to save. The alias is not valid.",
                type: "error",
                confirmButtonColor: "#f2533e" // You can customize this color
            });

            return;
        }

        /*if (/^\/+$/.test(trimmedAlias)) {
            swal("Failed to save. The alias cannot contain only slashes", "", "error");
            return;
        }*/

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
               asyncRestRequest(urlPath + "&alias=" + encodeURI(method + alias), null,"POST",
                    function (response) {
                    },
                    function (error) {
                        swal({
                            title: error.msg,
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });

                    });
                /*if (response.status != 200) {
                    swal(response.payload.msg, "", "error");
                    return;
                }*/ //else
                // alert(response.payload.msg);
                if (errorMessage.startsWith("Failed to save")) {
                    swal({
                        title: errorMessage,
                        type: "error",
                        confirmButtonColor: "#f2533e"
                        });

                    return;
                } else if (errorMessage.startsWith("Invalid alias")) {
                    swal({
                        title: errorMessage,
                        text: "",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                     });

                    return;
                }
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
        var responseProps = syncRestRequest(propURLPath, "POST", properties, "application/text", "application/text");
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
    asyncRestRequest(urlPath, null,"GET",
        function (response) {
            // if (response.status == 200) {
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

               /* var cookies = document.cookie.split(";");
                for (var i = 0; i < cookies.length; i++) {
                    var coo = cookies[i].split("=");
                    if (coo[0].trim() == "tenant") {
                        $(".service_full_path").val(location.origin + "/tenant/" + coo[1].replaceAll('"', "").split(" ")[0] + alias);
                    }
                }*/

                //alert(JSON.parse(response.payload).alias);
            /*} else
                alert(JSON.stringify(response));*/
        },
        function (error) {
            alert(error);
        });

    //alert(JSON.stringify(response));
    var urlLoadFile = loadFile.trim() + "$";
    var propertyPath = urlLoadFile.replace(".service$", ".properties").replace(".api$", ".properties").replace(".flow$", ".properties").replace(".sql$", ".properties");
    //var propertyPath=loadFile.replace(".service",".properties").replace(".flow",".properties");//).replace("/files","alias?fqn=packages").replace(".service",".main");
    //alert("propFilePath: "+propertyPath);
    var propFileName = (propertyPath.split("/").join(".")).replace("files.", "");
    //alert("propFileName: "+propFileName);
    var propURLPath = ("/files/packages/" + propertyPath.split("/")[2] + "/dependency/config/" + propFileName);
    //alert("propURLPath: "+propURLPath);
    asyncRestRequest(propURLPath, null,"GET",
        function (response) {
            $("#servicePropertiesFile").val(responseProps.payload);
            enableCheckboxesForConfig(responseProps.payload);
        },
        function (error) {
            console.error("Error in serviceProp api call");

        });

}
function openConfigurationPropertiesAsync(cond = true) {
    var $testButton = $("#configButton");
    $testButton.hide();
    $testButton.before('<div id="testSpinner" class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>');

    var modal = document.getElementById("configurePropertiesModelDialog");
    var span = document.getElementById("closeConfigurePropertiesModelDialog");
    collecta('Open', '', 'API Configuration', 'Open API Configuration');
    span.onclick = function () {
        var developers = $("#serviceDevelopers").val().toString().trim();
        if(!developers){
            swal({
                title: "Validation Error",
                text: "Developers cannot be empty or null",
                type: "error",
                confirmButtonColor: "#f2533e"
          });

            $("#testSpinner").remove();
            $testButton.show();
            return;
        }
        if (cond) {
            var $okButton = $("#closeConfigurePropertiesModelDialog");
            $okButton.text('');
            $okButton.append('<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>');

            var alias = $("#serviceAliasValue").val();
            if (alias.trim().length > 1) {
                var urlLoadFile = loadFile.trim() + "$";
                var packageName = ("/" + urlLoadFile).replace("/files/", "alias?fqn=").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main");
                packageName = packageName.split("/").join(".");
                var urlPath = "/" + packageName;
                urlPath = urlPath.replace("/files", "/alias");
                var method = $("#serviceHTTPMethodValue").val();
                if (alias.indexOf("/") != 0) {
                    alias = "/" + alias;
                }
                if (!alias.includes(packageName)) {
                    asyncRestRequest(
                        urlPath + "&alias=" + encodeURI(method + alias),
                        "",
                        "POST",
                        function (response) {
                            if (response.status != 200) {
                                swal({
                                    title: response.msg,
                                    text: "",
                                    type: "error",
                                    confirmButtonColor: "#f2533e"
                                });

                                return;
                            }
                            collecta('Save', '', 'API Configuration', 'Saving API Configuration');
                        },
                        function (errormessage) {
                           swal({
                                    title: 'Error',
                                    text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                                    type: 'error',
                                    confirmButtonColor: '#f2533e'
                                    });

                        }
                    );
                }

            }

            $okButton.find(".spinner-border").remove();
            $okButton.text('OK');

            var properties = $("#servicePropertiesFile").val();
            var urlLoadFile = loadFile.trim() + "$";
            var propertyPath = urlLoadFile.replace(".service$", ".properties").replace(".api$", ".properties").replace(".sql$", ".properties").replace(".flow$", ".properties");
            var propFileName = (propertyPath.split("/").join(".")).replace("files.", "");
            var propURLPath = ("/files/packages/" + propertyPath.split("/")[2] + "/dependency/config/" + propFileName);

            asyncRestRequest(
                propURLPath,
                properties,
                "POST",
                function (responseProps) {
                    if (responseProps.status != "Saved") {
                        // alert(JSON.stringify(responseProps));
                        return;
                    }
                    modal.style.display = "none";
                },
                function (errormessage) {
                    swal({
                        title: 'Error',
                        text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                        type: 'error',
                        confirmButtonColor: '#f2533e' // any hex code
                    });

                }
            );

        }
        else{
            modal.style.display = "none";
        }
    }
    modal.style.display = "block";

    var urlLoadFile = loadFile.trim() + "$";
    var packageName = ("/" + urlLoadFile).replace("/files/", "alias?fqn=").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main");
    packageName = packageName.split("/").join(".");
    var urlPath = "/" + packageName;

    if (!$("#serviceAliasValue").val() || $("#serviceAliasValue").val().trim() === "") {

        asyncRestRequest(
            urlPath,
            "",
            "GET",
            function (response) {
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

                if (!$("#servicePropertiesFile").val() || $("#servicePropertiesFile").val().trim() === "") {
                    asyncRestRequest(
                        propURLPath,
                        "",
                        "GET",
                        function (responseProps) {
                            $("#servicePropertiesFile").val(responseProps.payload);
                            enableCheckboxesForConfig(responseProps.payload);
                        },
                        function (errormessage) {
                            if (errormessage.responseText.startsWith("#")) {
                                $("#servicePropertiesFile").val(errormessage.responseText);
                                enableCheckboxesForConfig(errormessage.responseText);
                            }/*else
                        swal('Error', errormessage.responseJSON ? errormessage.responseJSON.msg.toUpperCase() : 'An unexpected error occurred', 'error');*/
                        }
                    );
                }
            },
            function (errormessage) {
               swal({
                    title: 'Error',
                    text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                    type: 'error',
                    confirmButtonColor: '#f2533e' // custom color
                });

            }
        );
    }
    else {
        $(".service_full_path").val(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + $("#serviceAliasValue").val().trim());
    }

    $("#testSpinner").remove();
    $testButton.show();
}

function saveConfigurationData(){
    var $okButton = $("#closeConfigurePropertiesModelDialog");
    $okButton.text('');
    $okButton.append('<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>');
    var alias = $("#serviceAliasValue").val();
    if (alias.trim().length > 1) {
        var urlLoadFile = loadFile.trim() + "$";
        var packageName = ("/" + urlLoadFile).replace("/files/", "alias?fqn=").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main");
        packageName = packageName.split("/").join(".");
        var urlPath = "/" + packageName;
        urlPath = urlPath.replace("/files", "/alias");
        var method = $("#serviceHTTPMethodValue").val();
        if (alias.indexOf("/") != 0) {
            alias = "/" + alias;
        }
        if (!alias.includes(packageName)) {
            asyncRestRequest(
                urlPath + "&alias=" + encodeURI(method + alias),
                "",
                "POST",
                function(response) {
                    if (response.status != 200) {
                        swal({
                            title: response.msg,
                            text: "",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });

                        return;
                    }else{
                        $("#serviceAliasValue").val(alias);
                        $("#serviceHTTPMethodValue").val(method);
                    }

                    collecta('Save', '', 'API Configuration', 'Saving API Configuration');
                },
                function(errormessage) {
                    swal({
                        title: "Error",
                        text: errormessage.responseJSON ? errormessage.responseJSON.error : "An unexpected error occurred",
                        type: "error",
                        confirmButtonColor: "#f2533e" // custom red button
                    });

                }
            );
        }

    }

    var properties = $("#servicePropertiesFile").val();
    var urlLoadFile = loadFile.trim() + "$";
    var propertyPath = urlLoadFile.replace(".service$", ".properties").replace(".api$", ".properties").replace(".sql$", ".properties").replace(".flow$", ".properties");
    var propFileName = (propertyPath.split("/").join(".")).replace("files.", "");
    var propURLPath = ("/files/packages/" + propertyPath.split("/")[2] + "/dependency/config/" + propFileName);

    asyncRestRequest(
        propURLPath,
        properties,
        "POST",
        function(responseProps) {
            if (responseProps.status != "Saved") {
                // alert(JSON.stringify(responseProps));
                return;
            }
        },
        function(errormessage) {
            swal({
                title: 'Error',
                text: errormessage.responseJSON ? errormessage.responseJSON.error : 'An unexpected error occurred',
                type: 'error',
                confirmButtonColor: '#f2533e' // Optional: change color to match your theme
            });

        }
    );

    $okButton.find(".spinner-border").remove();
    $okButton.text('OK');


}

function openBuildConfigurationForm() {
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
           swal({
                title: "Invalid build name",
                text: "",
                type: "error",
                confirmButtonColor: "#f2533e" // Customize as needed
            });

            return;
        }

        addCheckBoxOnJSTree('#packageManagerJsTree');
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

function openNameItemPromptForm(type) {
    if (type == "api" || type == "service" || type == "sql") {
        $("#group-panel").show();
    } else{
        $("#group-panel").hide();
    }
    var label_name = capitalize(type);
    $("#packages_item_name").val("");
    $('#packages_item_name').removeClass('packages_item_name_eb');
    $('#info_message').text('');
    $("#new-item-heading").html("Create New " + label_name);
    $("#new-item-panel").html(label_name + " Name:");
    if (type === "api") {
        $(".description-and-auto-generate").show();
    } else {
        $(".description-and-auto-generate").hide();
    }
    var modal = document.getElementById("nameItemPrompt");
    var span = document.getElementById("closeExportNameItemPromptModelDialog");
    modal.style.display = "block";
    span.onclick = function () {
        modal.style.display = "none";
        $("#description").val('');
        $("#auto_gr").prop('checked', false);
        //loadPackages();
        //$(".elementProperty").css("display","none");
    }
}
// this function for write for make first letter for caps of label name Pawan by made//
function capitalize(s) {
    if (s.toLowerCase() == "sql") {
        return s.toUpperCase();
    } else if (s.toLowerCase() == "api") {
        return "API";
    }
    return s && s[0].toUpperCase() + s.slice(1);
}

function maximizePopup() {
    if ($('#popMaxMin.popup_minimize').length) {
        var inputValue = $("#elementSetValueInput").val();
        $('#elementSetValueInputTextarea').val(inputValue);
        $('#popMaxMin').addClass('popup_maximum').removeClass('popup_minimize');
        $('#elementSetValueInput').hide();
        $('.ico_expand').hide();
        $('.ico_collapse').show();
        $('#elementSetValueInputTextarea').show();
    } else {
        var textareaValue = $('#elementSetValueInputTextarea').val();
        $("#elementSetValueInput").val(textareaValue);
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
function openForm(jsTreeId, sel) {

    // Reset fields
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
    // var checkValidationStatus = $("#enableServiceDocumentValidation").prop("checked");

    if (!sel.length) {
       swal({
            title: "Warning",
            text: "Select an element first",
            type: "warning",
            confirmButtonColor: "#f2533e"  // or any hex you prefer
        });

        return;
    } else if (sel.length > 1) {
       swal({
                title: "Warning",
                text: "Select only one element",
                type: "warning",
                confirmButtonColor: "#f2533e"
        });

        return;
    }
    var pathParametersText = "*pathParameters";
    var reqHeadersText = "*requestHeaders";
    var payloadText = "*payload";
    var disableFields = false;
    var disableSelectDropdown = false;
    var hideDefaultValue = false;
    if (jsTreeId === '#landing_arrow_jsTree' || jsTreeId === '#launching_arrow_jsTree' || jsTreeId === '#output_schema_editor_jsTree') {
        hideDefaultValue = true;
    } else {
        hideDefaultValue = false;
    }

    if (ref.get_node(sel).text === pathParametersText) {
        disableFields = true;
        hideDefaultValue = true;
        disableSelectDropdown = true;
    } else if (ref.get_node(sel).text === reqHeadersText) {
        disableFields = true;
        disableSelectDropdown = true;
    } else if (ref.get_node(sel).text === payloadText) {
        disableSelectDropdown = true;
    } else {
        // Check parent nodes
        var parents = ref.get_node(sel).parents;
        for (var i = 0; i < parents.length; i++) {
            var parentNode = ref.get_node(parents[i]);
            if (parentNode.text === pathParametersText) {
                disableFields = true;
                hideDefaultValue = true;
                break;
            } else if (parentNode.text === reqHeadersText) {
                disableFields = true;
                break;
            }
        }
    }

    function disableDropdown(id, val) {
        if (val) {
            $("#" + id).attr('disabled', 'disabled');
            $("#" + id).addClass('disabled-dropdown');
        } else {
            $("#" + id).removeAttr('disabled');
            $("#" + id).removeClass('disabled-dropdown');
        }
    }

    function disableProp2(id, val) {
        if (val) {
            $("#" + id).attr('disabled', 'disabled');
        } else {
            $("#" + id).removeAttr('disabled');
        }
    }

    function toggleDefaultValueTab(displayNone) {
        if (displayNone) {
            $(".default_value").hide();
        } else {
            $(".default_value").show();
        }
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
    function toggleVisibility(data, sel) {
        const jsTreeInstance = $(data).jstree(true);
        let nodeDetails = jsTreeInstance.get_node(sel);

        if (!nodeDetails) {
            console.error("Node details not found for ID:", sel);
            return;
        }

        let nodeText = nodeDetails.text;
        let nodeType = nodeDetails.type;
        const element = document.getElementById("columnTypeContainer");

        if (element === null) {
            return;
        }

        if ((nodeText === "inputDocList" || nodeText === "outputDocList") && nodeType === "documentList") {
            element.style.display = "none";
            return; // Only child elements should show ColumnType options
        }

        function checkParentNode(node) {
            if (
                (node.text !== "inputDocList" && node.text !== "outputDocList") &&
                node.parent &&
                node.parent !== "#"
            ) {
                const parentNodeDetails = jsTreeInstance.get_node(node.parent);
                if (parentNodeDetails) {
                    return checkParentNode(parentNodeDetails); // Recursive call
                }
            }
            return node;
        }

        nodeDetails = checkParentNode(nodeDetails);
        nodeText = nodeDetails.text;
        nodeType = nodeDetails.type;

        if ((nodeText === "inputDocList" || nodeText === "outputDocList") && nodeType === "documentList") {
            element.style.display = "";
        } else {
            element.style.display = "none";
        }
    }

    toggleVisibility(jsTreeId, sel) // Hide columnTypeContainer from SQl Properties

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
    showProperties(elemType);
    //ref.set_type(sel,'docList');
    // Get the <span> element that closes the modal
    var span = document.getElementById("closeNodeProperties");
    var closeBtn = document.getElementById("closePropertyModalDialog");
    $("#currentNodePath").html(currentNodePath);
    // When the user clicks on the button, open the modal
    modal.style.display = "block";
    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        let elemTypeNew = currentSelectedJSONObject.nodeType.replace("List", "");
        let validation = validateElementType(elemTypeNew, $("#ServiceelementValueInput").val());
        if (validation.isValid) {
            if(currentSelectedJSONObject.jsTreeId == "#landing_arrow_jsTree"){
                updateDataType(elemTypeNew, currentSelectedJSONObject.jsTreeId);
            }
        } else {
            swal({
                title: "Validation Error",
                text: validation.message,
                type: "error",
                confirmButtonColor: "#f2533e"
            });

            return;
        }
        modal.style.display = "none";
        $(".elementProperty").css("display", "none");


        let assignItem = getAssignList(inputJstreeRef);
        var value = $("#ServiceelementValueInput").val();
        var evaluate = null;
        var eev = $("#Serviceelement_ExpressionVariable").prop("checked");
        if (eev == true)
            evaluate = "EEV";
        var eev = $("#Serviceelement_ExpressionSubstitution").prop("checked");
        if (eev == true)
            evaluate = "EEV2";
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
        showProperties(elemType);
        resetDataField(prevNode);
        currentSelectedJSONObject.nodeType = elemType;
        if(currentSelectedJSONObject.jsTreeId == "#landing_arrow_jsTree"){
            updateDataType(elemType, currentSelectedJSONObject.jsTreeId);
        }
    }

    openServiceSetValueModelDialog(jsTreeId);
    toggleDefaultValueTab(hideDefaultValue);
    disableDropdown("elementType", disableSelectDropdown);
    disableProp2("isArray", disableFields);
    //disableProp("isRequiredField", !checkValidationStatus);
}
function validateElementType(elemType, value) {
    let result = { isValid: true, message: "" };

    if (null == value || value.trim() == "") {
        return result;
    }

    switch (elemType) {
        case "integer":
            if (!/^[+-]?\d+$/.test(value) && !/^.*#\{.*\}.*$/.test(value)) {
                result.isValid = false;
                result.message = "Please enter a valid integer.";
            }
            break;
        case "number":
            if (!/^[+-]?\d+(\.\d+)?$/.test(value) && !/^.*#\{.*\}.*$/.test(value)) {
                result.isValid = false;
                result.message = "Please enter a valid decimal number.";
            }
            break;
        case "date":
            if (!/^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[012])\/\d{4}$/.test(value) && !/^.*#\{.*\}.*$/.test(value)) {
                result.isValid = false;
                result.message = "Please enter a date in the format dd/mm/yyyy.";
            }
            break;
        case "boolean":
            if (!/^(true|false|0|1)$/.test(value) && !/^.*#\{.*\}.*$/.test(value)) {
                result.isValid = false;
                result.message = "Please enter 'true' or 'false' for boolean values.";
            }
            break;
        case "string":
            if ((typeof value !== 'string' || value.trim() === '') && !/^.*#\{.*\}.*$/.test(value)) {
                result.isValid = false;
                result.message = "Please enter a non-empty string.";
            }
            break;
        default:
            result.message = "Unsupported element type provided. Please verify your input and try again.";
            break;

    }
    return result;

}


function openServiceSetValueModelDialog(id) {
    //inputJstreeRef
    if (id != '#input_schema_editor_jsTree') {
        $(".default_value").hide();
        return ;
    }
    $(".default_value").show();
    var span = document.getElementById("ServicecloseSetValueModelDialog");

    let assignItem = getAssignList(inputJstreeRef);

    if (assignItem) {
        //alert(createItem.value);
        $("#Serviceelement_NoneVariable").prop("checked", true);
        $("#ServiceelementValueInput").val(assignItem.value);
        if (assignItem.evaluate == "EEV")
            $("#Serviceelement_ExpressionVariable").prop("checked", true);
        if (assignItem.evaluate == "EEV2")
            $("#Serviceelement_ExpressionSubstitution").prop("checked", true);
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

function getAssignList(inputJstreeRef) {
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

function showProperties(elementType) {
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
    changeCurrentNodeType($("#isArray").prop('checked'));
    if (typeof mapperObj !== 'undefined') {
        mapperObj.renameInitiatedDataType(curDataNode, elementType);
    }
}

function resetDataField(node){
    node = JSON.parse(node);
    if (node.type.endsWith("List"))
        $("#isArray").prop('checked', true);
    else
        $("#isArray").prop('checked', false);
    changeCurrentNodeType($("#isArray").prop('checked'));
    var curDataNode = currentSelectedJSONObject.selNode;
    curDataNode.data = {};
    if (node.data == null){
        curDataNode.data = {};
    }
    else{
        for (var key in node.data){
            updateDataField(key, node.data[key]);
        }
    }
}

function updateDataField(field, value) {
    var curDataNode = currentSelectedJSONObject.selNode;
    if (curDataNode.data == null)
        curDataNode.data = {};
    if (field.endsWith('Description') || field.endsWith('regex'))
        value = btoa(value);
    curDataNode.data[field] = value;
}

function addDblclickClickListener(id, callback) {
    $(id).dblclick(function (event) {

        callback();

    });
}

function setUnsavedChanges(fileURL, markStar) {
    if (SDK_EMBEDDED) {
        return ;
    }
    var tokenize = fileURL.split("/");
    var name = tokenize[tokenize.length - 1].split(".")[0];
    if (markStar && markStar != false)
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
                swal({
                    title: "",
                    text: "Please select item(s) to export.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });

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
                    swal({
                        title: "Warning",
                        text: "Please select Tools>Build first",
                        type: "warning",
                        confirmButtonColor: "#f2533e" // or any color you want
                    });

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
                            asyncRestRequest("/packages.middleware.pub.server.build.api.promoteBuild.main?" + qp + "&environment_id=" + $("#environment_id").val(),  content, "POST","POST",
                                function (res) {
                                    sendPackage(res);
                                },
                                function (error) {
                                    console.error("Error in promoteBuild api");
                                });
                        } else {
                            asyncRestRequest("/build?" + qp,  content, "POST",
                                function (res) {
                                    sendPackage(res);
                                },
                                function (error) {
                                    console.error("Error in build api");

                                });
                        }
                        function sendPackage(response){
                                var jObj = JSON.parse(response.payload);

                                if ($("#import_environment").is(":checked")) {
                                    console.log(jObj);
                                    if (jObj.status == "Saved") {
                                        swal({
                                                title: "Imported",
                                                text: "",
                                                type: "success",
                                                confirmButtonColor: "#2C61F5" // change color as needed
                                            });

                                    } else {
                                        swal({
                                            title: "Error",
                                            text: "Please try again.",
                                            type: "error",
                                            confirmButtonColor: "#f2533e" // Custom red or any color you prefer
                                            });

                                    }
                                } else {
                                    if (jObj.msg == "Success") {
                                        //alert(jObj.msg);
                                        var element = document.createElement('a');
                                        element.setAttribute('href', JSON.parse(response.payload).url
                                            + "?access_token=" + encodeURIComponent(localStorage.getItem("AuthToken")));
                                        element.setAttribute('target', "_blank");
                                        document.body.appendChild(element);
                                        element.click();
                                    } else {
                                        swal({
                                            title: jObj.msg,
                                            text: "", // You can add a message if needed
                                            type: "error",
                                            confirmButtonColor: "#f2533e" // Optional custom button color
                                        });

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
            openBuildConfigurationForm();
        }
    });
});

function importBuild() {
    var tree = $("#packageManagerJsTree").jstree(true);
    var sel = "j1_1";
    var dest = tree.get_path(sel, '/');
    var url = '/upload/packages?dest=' + dest;
    uploadFile(url, "file", ".zip");
}

function importBuildV2() {
    var url = '/upload/packages?dest=packages';
    uploadFile(url, "file", ".zip");
}

function getQueryVariable(variable) {
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

function cloneProperties(newFlowName) {
    var urlLoadFile = loadFile.trim() + "$";
    var propertyPath = urlLoadFile.replace(".service$", ".properties").replace(".api$", ".properties").replace(".sql$", ".properties").replace(".flow$", ".properties");
    //var propertyPath=loadFile.replace(".service",".properties").replace(".flow",".properties");//).replace("/files","alias?fqn=packages").replace(".service",".main");
    //alert("propFilePath: "+propertyPath);
    var propFileName = (propertyPath.split("/").join(".")).replace("files.", "");
    //alert("propFileName: "+propFileName);
    var propURLPath = ("/files/packages/" + propertyPath.split("/")[2] + "/dependency/config/" + propFileName);
    //alert("propURLPath: "+propURLPath);
   asyncRestRequest(propURLPath, null,"GET",
        function (properties) {
            if (properties != null && properties.trim().length > 0) {
                urlLoadFile = newFlowName.trim() + "$";
                propertyPath = urlLoadFile.replace(".service$", ".properties").replace(".api$", ".properties").replace(".sql$", ".properties");

                propFileName = (propertyPath.split("/").join(".")).replace("files.", "");
                propURLPath = ("/files/packages/" + propertyPath.split("/")[2] + "/dependency/config/" + propFileName);
                asyncRestRequest(propURLPath,  properties, "POST",
                    function (response) {
                    },
                    function (error) {
                        console.error("Error in propFile Api Call");

                    });
            }
        },
        function (error) {
            console.error("Error in cloneProperties()");
        });




}
var jwt_expiration_in = 8;
function openJWTPopup() {
    var modal = document.getElementById("jwtModelDialog");
    var span = document.getElementById("closejwtModelDialog");
    var selectArtifactsButton = document.getElementById("JWTOKButton");
    modal.style.display = "block";
    span.onclick = function () {
        modal.style.display = "none";
        //$(".elementProperty").css("display","none");
    }

    getLoggedInUser();

    var userId = USER_PROFILE.userId || localStorage.getItem("loginUserId") || "";
    var tenantId = USER_PROFILE.tenantId || (USER_PROFILE.profile && USER_PROFILE.profile.tenant) || localStorage.getItem("tenant") || "";
    var tokenKey = userId + "-" + tenantId + "-token";

    /*$.get( resolveUrl("/jwt?expiration_time=" + jwt_expiration_in + "&userID=" + USER_PROFILE.userId + "&token_key=default-token"), function (data, status) {
        $("#jwtInput").val(data);
        jwt_expiration_in = 8;
    });*/

    jwt_expiration_in = 8;
    if (!$("#jwt_token_key").val()) {
        $("#jwt_token_key").val(tokenKey);
    }

    $.ajax({
        url: resolveUrl("/jwt?expiration_time=" + jwt_expiration_in +
            "&userID=" + encodeURIComponent(userId) +
            "&token_key=" + encodeURIComponent($("#jwt_token_key").val() || tokenKey)),
        type: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
        },
        success: function (data, status) {
            $("#jwtInput").val(data);
            jwt_expiration_in = 8;
        },
        error: function (xhr, status, error) {
            console.error("Error:", error);
        }
    });

    selectArtifactsButton.onclick = function () {
        modal.style.display = "none";
    }
}

function openJWTPopupTime() {
    jwt_expiration_in = $("#jwt_expiration_in").val();
    if (jwt_expiration_in == "expir_custom") {
        jwt_expiration_in = parseInt($("#expir_custom_hours").val());
    }
    if (jwt_expiration_in <= 0) {
       swal({
            title: "Invalid time",
            text: "Please provide a valid time",
            type: "error",
            confirmButtonColor: "#f2533e" // Optional: change to your desired color
        });

        return ;
    }
    openJWTPopup();
}

function focusOnElement(file, shouldOpen) {
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

function getAllEnvironments() {
    asyncRestRequest("/packages.middleware.pub.environments.api.getEnvironments.main?start=0&length=100", null, "GET", function (response) {
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
            let region = "";
            if (null != response.environments[i].reason && response.environments[i].reason.trim() != "") {
                region = '<div class="alert_mes"> <img src="' + getSystemResourcePath() + '/assets/img/promotion_alert.svg">' + response.environments[i].reason + '</div>'
            }
            $("#promote_environments").append("<div class='col-md-4'><div class='envir_in'>" + region + "<div class='invr_name'><input " + isDisabled + " class='styled-checkbox promoting-servers' type='checkbox' name='API2' value='" + response.environments[i].id + "' id='encheck" + i + "'><label for='encheck" + i + "'><span class='red'>" + response.environments[i].name.substring(0, 2).toLocaleUpperCase() + "</span> " + response.environments[i].name + " </label> <div class='promot_notification' id='env-up-" + response.environments[i].id + "'></div> </div><div class='tenant_name'>Tenant: " + response.environments[i].tenant + " </div><div class='tenant_name'> Platform: " + logo + " </div><div class='invr_url'><a class='cpy' href='javascript:void(0)' id=''><img src='/middleware/pub/server/ui/assets/img/copy_icon.svg'></a><a class='url_gr' href='https://" + response.environments[i].sub_domain + "' target='_blank'>https://" + response.environments[i].sub_domain + "</a> </div></div></div>");
        }
    });
}
$(document).ready(function () {
    //getAllEnvironments();
});

$(document).on("click", ".cpy", function () {
    // Find the URL anchor tag with class .url_gr inside .invr_url and get its href
    let url = $(this).closest('.invr_url').find("a.url_gr").attr("href");

    if (url) {
        // Copy the URL to clipboard using the Clipboard API
        navigator.clipboard.writeText(url).then(() => {
            // Change the copy icon and add a new class
            $(this).find("img")
                .attr("src", "middleware/pub/server/ui/assets/img/copy_check.svg")
                .addClass("copied-success"); // Add new class

            // Restore the icon and remove the class after 2 seconds
            setTimeout(() => {
                $(this).find("img")
                    .attr("src", "middleware/pub/server/ui/assets/img/copy_icon.svg")
                    .removeClass("copied-success"); // Remove the class
            }, 2000);
        }).catch(err => console.error("Failed to copy: ", err));
    }
});



function loadGroupsDP() {
    asyncRestRequest("/packages.middleware.pub.security.flow.getGroups.main", null, "GET",
        function (response) {
            let groups = [...new Set(response.groups)];

            if (!groups.includes("administrators")) {
                groups.unshift("administrators");
            }
            if (!groups.includes("developers")) {
                groups.unshift("developers");
            }

            groups.forEach(group => {
                if (!$('#consumer-groups option').filter((_, el) => $(el).text() === group).length) {
                    $('#consumer-groups').append("<option>" + group + "</option>");
                }
                if (!$('#developer-groups option').filter((_, el) => $(el).text() === group).length) {
                    $('#developer-groups').append("<option>" + group + "</option>");
                }
                if (!$('.serviceConsumersGroups option').filter((_, el) => $(el).text() === group).length) {
                    $('.serviceConsumersGroups').append("<option>" + group + "</option>");
                }
                if (!$('.serviceDevelopersGroups option').filter((_, el) => $(el).text() === group).length) {
                    $('.serviceDevelopersGroups').append("<option>" + group + "</option>");
                }
            });
        },
        function (error) {
            console.error("Error in loadGroupsDP()");
        });
}

function softLogout() {
    Cookies.remove('pac4jCsrfToken');
    Cookies.remove('tenant');
    Cookies.remove('JSESSIONID');
    localStorage.clear();
    sessionStorage.clear();
    deleteAllCookies();
}

function doLogout() {
    softLogout();
    location.href = "/middleware/pub/server/ui/welcome/onboarding/login.html";
}

function doSessionExpiredLogout() {
    const returnUrl = window.location.href;
    softLogout();
    location.href = "/middleware/pub/server/ui/welcome/onboarding/login.html?r=" + encodeURIComponent(returnUrl);
}

function flowStepIOHeightAdjuster() {
    $("#landing_arrow_jsTree").children().css("height", $("#landing_arrow_jsTree").children().height() + 100);
    $("#launching_arrow_jsTree").children().css("height", $("#launching_arrow_jsTree").children().height() + 100);
    $("#landing_arrow_jsTree_function").children().css("height", $("#landing_arrow_jsTree_function").children().height() + 100);
    $("#launching_arrow_jsTree_function").children().css("height", $("#launching_arrow_jsTree_function").children().height() + 100);
}

function flowIOHeightAdjuster() {
    $("#input_schema_editor_jsTree").children().css("height", $("#input_schema_editor_jsTree").children().height() + 100);
    $("#output_schema_editor_jsTree").children().css("height", $("#output_schema_editor_jsTree").children().height() + 100);
}

function updateHeigtht(node_id){
    $("#"+node_id).children().css("height", $("#"+node_id).children().height() + 80);
}

var USER_PROFILE = {};

/*function getLoggedInUser() {
    asyncRestRequest("/packages.middleware.pub.service.getCurrentUserAccount.main", null,"GET",
        function (response) {
            USER_PROFILE = response.profile;
        },
        function (error) {
            console.error("Error in getLoggedInUser()");
        });
}*/

function getLoggedInUser() {
    var response = syncRestRequest("/packages.middleware.pub.service.getCurrentUserAccount.main", "GET", "");
    if(response.status == 200 && response.payload) {
        response = JSON.parse(response.payload);
        USER_PROFILE = response;
    }
}

function enableGraphQLForService() {
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

function enableCheckboxesForConfig(configurations) {
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


function downloadContentOffline(data, fileName, mime = "application/json") {
    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


$(document).ready(function () {

    if (SDK_EMBEDDED) {
        return ;
    }

    asyncRestRequest("/packages.middleware.pub.server.build.api.SysInfo.main", null,  "GET", function (response) {
        localStorage.setItem("SYNCLOOP_SYS_INFO", JSON.stringify(response));
        document.dispatchEvent(new CustomEvent("syncloop:sysinfo"));
        const input = document.getElementById("api-endpoint-gt");
        if (input) {
            input.value = response.api_url;
        }

        if (response.license_key) {} else {
            asyncRestRequest("/packages.middleware.pub.security.flow.getUsers.main", null, "GET", function (response) {
                if (Object.keys(response.users).length > 2) {
                    $("#license_warning").show();
                }
            });
        }
    });
});


$(function() {
    if (SDK_EMBEDDED || (typeof Cookies === 'undefined')) {
        return ;
    }

    const tenantCookie = Cookies.get("tenant");
    const tenantName = (tenantCookie || "").split(" ")[0];

    if (tenantName != "default") {
        return ;
    }

    asyncRestRequest("/packages.middleware.pub.server.build.api.checkBuildUpdate.main", null,  "GET", function (response) {
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

        $("#update_popup_title").html("Updating environment");
        $("#updating_popup_description").html("Please wait... your environment is getting updated.");
        openEvnirUpdatepopup();

        asyncRestRequest("/packages.middleware.pub.server.build.api.updateBuild.main?version=" + version, null,  "GET", function (response) {

            const bar = document.getElementById('progressBar'),
                percentage = document.getElementById('percentage');

            var interval = setInterval(function () {
                asyncRestRequest("/packages.middleware.pub.server.build.api.getUpdateStatus.main?uniqueId=" + response.uniqueId, null,  "GET", function (response) {
                    if (response.status == "COMPLETED_SUCCESS") {
                        percentage.textContent = '100 % completed';
                        $("#closenewUpdateModelDialog").trigger('click');
                       swal({
                            title: "Your environment is updated successfully.",
                            text: "", // Optional, can be left empty
                            type: "success",
                            confirmButtonColor: "#2C61F5" // Customize button color if needed
                        });

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
                                    rebooting();
                                }
                                else {
                                    swal.close();
                                }
                            });
                    } else if (response.status == "COMPLETED_ERROR") {
                        $("#closenewUpdateModelDialog").trigger('click');
                       swal({
                            title: "Your environment is not updated successfully. Please contact administrator",
                            text: "",
                            type: "error",
                            confirmButtonColor: "#f2533e" // Customize the button color
                        });

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
            swal({
                    title: errormessage.responseJSON ? errormessage.responseJSON.error : "An unexpected error occurred",
                    text: "",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                    }, function () {
                    resetProgressBar();
                });

        });

    }

    function resetProgressBar() {
        const bar = document.getElementById('progressBar');
        const percentage = document.getElementById('percentage');
        bar.value = 0;
        percentage.textContent = "0% completed";
    }
});

function rebooting() {
    swal({
            title: "Rebooting",
            text: "",
            type: "warning",
            confirmButtonColor: "#f2533e" // Optional: yellow/orange tone
        });

    asyncRestRequest("/packages.middleware.pub.server.core.RebootServer.main", null, "GET", function (response) {
    });
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
}

function updateUUID(response) {
    for (var i = 0 ; i < response.length ; i++) {
        if (null == response[i].data.guid) {
            response[i].data.guid = uuidv4();
        }
        if (null != response[i].children && response[i].children.length > 0) {
            updateUUID(response[i].children);
        }
    }
}

function replaceAndAdd(nodeId) {
    var nodeAnchor=$("#"+nodeId+"_anchor");
    if (null == nodeAnchor[0]) {
        return ;
    }

    let hasError = decorateError(nodeId);
    let simulationWarning = "";
    if (hasError) {
        simulationWarning = "<span onclick=openWarningpopup('" + nodeId + "') class='wr_icon'><img src='../../../icons/error.svg' alt=''>";
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
    } else if (innerText == "OBJECT") {
        let node = $("#flowDesignerJsTree").jstree(true).get_node(nodeId);
        let nodeService = "";
        if (null != node.data && null != node.data.fqn) {
            let splitter = node.data.fqn.split("/");
            nodeService = ": " + splitter[splitter.length - 1] + " ";
        }

        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(drag1.png); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='service-tape'>OBJECT</span> " + simulationWarning + "</span>" + nodeService);
    } else if (innerText == "FUNCTION") {
        let node = $("#flowDesignerJsTree").jstree(true).get_node(nodeId);
        let nodeService = "";
        if (null != node.data && null != node.data.acn) {
            nodeService = ": <i>@" + node.data.acn + "." + node.data.function + "<i> ";
        }

        nodeAnchor.html('<i class="jstree-icon jstree-themeicon jstree-themeicon-custom" role="presentation" style="background-image: url(drag1.png); background-position: center center; background-size: auto;"></i>');
        nodeAnchor.append("<span class='service-tape'>FUNCTION</span> " + simulationWarning + "</span>" + nodeService);
    }

}

function isInIframe() {
    return window.location !== window.parent.location;
}

function getFileLocation(r) {
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
function prepareRetainJson(parentText, parentType, obj) {
    for (var i = 0 ; i < obj.length ; i++) {

        if (null != obj[i].children && obj[i].children.length > 0) {
            prepareRetainJson(parentText + obj[i].text + "/", parentType + obj[i].type + "/", obj[i].children);
        } else {
            retainingJson.push({"path": parentText + obj[i].text, "typePath": parentType + obj[i].type})
        }
    }
}

function decorateError(nodeId) {
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

    let currentFile = SDK_EMBEDDED ? "standalone@0" : loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main").replace(/.flow$/, ".main");

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

function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

let INDEX_VAR_IN_SNAP = [];
function loadDebuggingData(guid) {
    if (null == guid) {
        return ;
    }

    $(getWorkspaceRef()).find(".step-guid").html(guid);
    $(getWorkspaceRef()).find(".step-i-guid").val(guid);

    if (!LOOP_RECURSION) {
        $(getWorkspaceRef()).find(".loop-index").hide();
        //$(parent.document).find("#loop-index-pre").html("");
        //$(parent.document).find("#loop-index-post").html("");
        //$(parent.document).find("#loop-index-pre").attr("data-val", guid);
        //$(parent.document).find("#loop-index-post").attr("data-val", guid);
        $(getWorkspaceRef()).find("#pre-indexes").html('');
        $(getWorkspaceRef()).find("#post-indexes").html('');
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
        INDEX_VAR_IN_SNAP = INDEX_VAR_IN_SNAP.filter(onlyUnique);
        for (var j = 0 ; j < INDEX_VAR_IN_SNAP.length ; j++) {
            $(getWorkspaceRef()).find("#pre-indexes").append('<div class="ac_item loop-index" style="display: none;"><div class="plt_loop"><label>Loop Last ' + INDEX_VAR_IN_SNAP[j] + ':</label><select data-var="' + INDEX_VAR_IN_SNAP[j] + '" data-val="' + guid + '" class="form-control loop-index-pre" id="loop-index-pre-' + INDEX_VAR_IN_SNAP[j].replace("*", "") + '"></select></div></div>');
            $(getWorkspaceRef()).find("#post-indexes").append('<div class="ac_item loop-index" style="display: none;"><div class="plt_loop"><label>Loop Last ' + INDEX_VAR_IN_SNAP[j] + ':</label><select data-var="' + INDEX_VAR_IN_SNAP[j] + '" data-val="' + guid + '" class="form-control loop-index-post" id="loop-index-post-' + INDEX_VAR_IN_SNAP[j].replace("*", "") + '"></select></div></div>');
        }

        $(getWorkspaceRef()).find(".loop-index-post, .loop-index-pre").change(function(){
            LOOP_RECURSION = true;
            loadDebuggingData($(this).attr("data-val"));
        });
    }

    let currentFile = SDK_EMBEDDED ? "standalone@0" : loadFile.replaceAll("files/", "").replaceAll("/", ".").replace(/.api$/, ".main").replace(/.flow$/, ".main");

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
                let filteredItem = processInternalObj(itemKey, item[itemKey]);
                if (null != item["meta"]) {
                    filteredItem["meta"] = item["meta"];
                }
                if (item.before_execution) {
                    let foundLoop = enableIndexDebuggingLoop(filteredItem, itemKey, true);
                    let displayingIndex = {};
                    $(getWorkspaceRef()).find(".loop-index-pre").each(function () {
                        displayingIndex[$(this).attr('data-var')] = $(this).val();
                    });
                    HTML += jsonToTable(filteredItem, itemKey, !$(getWorkspaceRef()).find("#internal-v-pre").is(":checked"), foundLoop, displayingIndex, "debug-data-pre");
                } else {
                    let foundLoop = enableIndexDebuggingLoop(filteredItem, itemKey, false);
                    let displayingIndex = {};
                    $(getWorkspaceRef()).find(".loop-index-post").each(function () {
                        displayingIndex[$(this).attr('data-var')] = $(this).val();
                    });
                    HTML_POST += jsonToTable(filteredItem, itemKey, !$(getWorkspaceRef()).find("#internal-v-post").is(":checked"), foundLoop, displayingIndex, "debug-data-post");
                }
                if (!LOOP_RECURSION) {
                    filterSelectLoopIndexes();
                }
            }
        });
        if (isInIframe()) {
            // parent.debugDataLoader("#debug-data-pre", HTML);
            // parent.debugDataLoader("#debug-data-post", HTML_POST);
            getMyParentRef().openDebuggingPanels();
        } else {
            // debugDataLoader("#debug-data-pre", HTML);
            // debugDataLoader("#debug-data-post", HTML_POST);
            openDebuggingPanels();
        }
    } else {
        if (isInIframe()) {
            getMyParentRef().closeDebuggingPanels();
        } else {
            closeDebuggingPanels();
        }
    }
}

function filterSelectLoopIndexes() {
    $(getWorkspaceRef()).find(".loop-index-pre, .loop-index-post").each(function () {
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
function enableIndexDebuggingLoop(filteredItem, itemKey, before_execution) {
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
                $(getWorkspaceRef()).find("#loop-index-pre-" + INDEX_VAR_IN_SNAP[j].replace("*", "")).append("<option>" + masterIndexes[INDEX_VAR_IN_SNAP[j]] + "</option>");
            }
        } else {
            for (var j = 0 ; j < INDEX_VAR_IN_SNAP.length ; j++) {
                if (null == masterIndexes[INDEX_VAR_IN_SNAP[j]]) {
                    continue;
                }
                $(getWorkspaceRef()).find("#loop-index-post-" + INDEX_VAR_IN_SNAP[j].replace("*", "")).append("<option>" + masterIndexes[INDEX_VAR_IN_SNAP[j]] + "</option>");
            }
        }

        $(getWorkspaceRef()).find(".loop-index").show();
    }
    return foundLoop;
}

$(document).ready(function () {
    $(getWorkspaceRef()).find("#internal-v-pre, #internal-v-post").click(function(){
        loadDebuggingData($(this).val());
    });
});

function determineLoop(filteredItem, displayIndex) {
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

function jsonToTable(json, itemKey, hideInternal, foundLoop, displayIndex, renderingPanel) {
    if (foundLoop) {
        let requiredToDisplay = determineLoop(json, displayIndex);
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
    if (isInIframe()) {
        getMyParentRef().document.getElementById(renderingPanel).innerHTML = "";
        displayJSON(getMyParentRef().document.getElementById(renderingPanel), finalJson, hideInternal, null);
    } else {
        document.getElementById(renderingPanel).innerHTML = "";
        displayJSON(document.getElementById(renderingPanel), finalJson, hideInternal, null);
    }

    return "";//table + "<br /><br /><br />";
}

function displayJSON(element, data, hideInternal, parentKey) {
    for (let key in data) {
        if ((key.includes("*") && hideInternal)) {
            continue;
        }
        const item = document.createElement('div');
        if (typeof data[key] === 'object' && data[key] !== null) {
            let theKey = key;
            if (!isNaN(key)) {
                theKey = parentKey + `[${key}]`;
            } else if (theKey.indexOf("packages.") == 0 || theKey.indexOf("standalone@") == 0) {
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
                displayJSON(childContainer, data[key], hideInternal, key);
            } else {
                childContainer.classList.add('json-object');
                displayJSON(childContainer, data[key], hideInternal, null);
            }
        } else {
            item.innerHTML = `<span class="json-key">${key}:</span> ${data[key]}`;
        }
        element.appendChild(item);
    }
}

function processInternalObj (key, obj) {
    let newObj = obj.filter(item => Object.keys(item).length > 0);
    return newObj;
}

function stopSimulation() {
    localStorage.removeItem("simulation_snapshot");
    localStorage.removeItem("simulating_service");
    localStorage.removeItem("simulate_response");
    if (SDK_EMBEDDED) {
        flowDesignerJsTreeRef.deselect_all();
        flowDesignerJsTreeRef.settings.core.data = flowDesignerJsTreeRef.get_json('#', {
            flat: false
        });
        flowDesignerJsTreeRef.refresh();
        $("#stop_simulation_emd_btn").hide();
        closeDebuggingPanels();
    } else {
        location.reload();
    }
}

function predictMyLoopIdentifier(ref, id, LOOP_IDENTIFIER_COUNT) {
    let pId = ref.get_parent(id);
    if ("#" != pId) {
        //if (ref.get_node(id).type == "foreach" || ref.get_node(id).type == "redo" || ref.get_node(id).type == "repeat") {
            LOOP_IDENTIFIER_COUNT++;
        //}
        return predictMyLoopIdentifier(ref, pId, LOOP_IDENTIFIER_COUNT);
    }
    return LOOP_IDENTIFIER_COUNT;
}

function getWorkspaceRef() {
    if (isInIframe()) {
        return getMyParentRef().document;
    }
    return document;
}


function serviceInputToSchema() {

    var $testButton = $("#testButton");
    $testButton.hide();
    $testButton.before('<div id="testSpinner" class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>');

    let payload = [];
    let requestHeaders = {};
    let queryParameters = [];
    let pathParameters = {};
    let inputJson = inputJstreeRef.get_json('#', {flat:false});
    let formDataFlag = false;
    let formData = [];
    for (let i = 0 ; i < inputJson.length ; i++) {
        if (inputJson[i].text == "*payload" || inputJson[i].text == "payload") {
            payload.push(inputJson[i]);
        } else if (inputJson[i].text == "*requestHeaders" || inputJson[i].text == "requestHeaders") {
            requestHeaders = inputJson[i];
        } else if (inputJson[i].text == "*pathParameters" || inputJson[i].text == "pathParameters") {
            pathParameters = inputJson[i];
        }else if (inputJson[i].text == "*formData" || inputJson[i].text == "formData") {
            formDataFlag = true;
            formData = inputJson[i];
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
    asyncRestRequest(urlPath, null,"GET",
        function (response) {
            let alias = "";
            if (response.status == 404) {
                alias = "GET/" + ("/" + urlLoadFile).replace("/files/", "").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main").split("/").join(".");
            } else {
                alias = response.alias;
            }
            localStorage.setItem("json_recent_params", JSON.stringify({
                "requestHeaders": (null != requestHeaders.children) ? requestHeaders.children : {},
                "queryParameters": (null == queryParameters) ? [] : queryParameters,
                "pathParameters": (null == pathParameters.children) ? {} : pathParameters.children,
                "formData": (null != formData.children) ? formData.children : {},
                "alias": alias,
                "serviceName": (loadFile.split("/")[loadFile.split("/").length - 1]).replace(".api", "").replace(".flow", ""),
                "fqn": ("/" + urlLoadFile).replace("/files/", "").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main").split("/").join(".")
            }));

        },
        function (error) {
            let alias = "";
            alias = "GET/" + ("/" + urlLoadFile).replace("/files/", "").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main").split("/").join(".");
            localStorage.setItem("json_recent_params", JSON.stringify({
                "requestHeaders": (null != requestHeaders.children) ? requestHeaders.children : {},
                "queryParameters": (null == queryParameters) ? [] : queryParameters,
                "pathParameters": (null == pathParameters.children) ? {} : pathParameters.children,
                "formData":formData,
                "alias": alias,
                "serviceName": (loadFile.split("/")[loadFile.split("/").length - 1]).replace(".api", "").replace(".flow", ""),
                "fqn": ("/" + urlLoadFile).replace("/files/", "").replace(".service$", ".main").replace(".api$", ".main").replace(".flow$", ".main").replace(".sql$", ".main").split("/").join(".")
            }));

        });


    asyncRestRequest("/packages.middleware.pub.util.SyncloopIOtoSchema.main", JSON.stringify({
        "json": JSON.stringify(payload)
    }) , "POST", function (resp) {

        localStorage.setItem("json_recent_schema", JSON.stringify(resp.schema));
       localStorage.setItem("json_recent_schema_json", "{}");
       localStorage.setItem("is_payload_missing", payload.length == 0);

        $("#test_popup_id").attr("src", getSystemResourcePath() + "/workspace/web/api-service-ui-client.html");
        localStorage.setItem("json_recent_output", JSON.stringify({}));

        var modal = document.getElementById("testModelDialog");
        var p = document.getElementById("closeTestModelDialog");
        modal.style.display = "block";
        p.onclick = function() {
            modal.style.display = "none";
            localStorage.setItem("json_recent_output", JSON.stringify({}));
        }

        $("#testSpinner").remove();
        $testButton.show();

    }, function (error) {
        $("#testSpinner").remove();
        $testButton.show();
    });
}


function openEvnirUpdatepopup() {
    var modal = document.getElementById("newUpdateModelDialog");
    var span = document.getElementById("closenewUpdateModelDialog");
    modal.style.display = "block";
    span.onclick = function() {
        modal.style.display = "none";

    }
}

function addService() {

    var ref = $("#flowDesignerJsTree").jstree(true);
    let selectedNodeRef = ref.get_selected()[0];

    if (null != selectedNodeRef && (ref.get_node(selectedNodeRef).type == "function"
        || ref.get_node(selectedNodeRef).type == "object")) {
       swal({
                title: "Invalid Change",
                text: "Select a service type step.",
                type: "error",
                confirmButtonColor: "#f2533e" // Customize as needed
            });

        return ;
    }

    if (localStorage.getItem("currentSelectedService_type") === "function") {
        var sel = createSchema("function", ref);
        var node = ref.get_node(sel);
        var data = JSON.parse(localStorage.getItem("currentSelectedService_json"));
        var nodeText = "@" + data.acn + "." + data.function;
        if (node.text != nodeText) {
            mapperObj.clean();
            node.data.lines = null;
            node.data.transformers = null;

            node.data.acn = data.acn;
            node.data.argumentsWrapper = data.argumentsWrapper;
            node.data.arguments = data.arguments;
            node.data.outputArgument = data.outputArguments;
            node.data.function = data.function;
            node.data.staticFunction = data.staticFunction;
            node.data.constructor = data.constructor;
            node.data.identifier = data.identifier;

            launching_arrow_jsTree_function_ref.settings.core.data = [];
            launching_arrow_jsTree_function_ref.refresh();
            landing_arrow_jsTree_function_ref.settings.core.data = [];
            landing_arrow_jsTree_function_ref.refresh();
            //ref.rename_node(node,nodeText);
            node.data.serviceType = localStorage.getItem("currentSelectedService_type");
            ref.select_node(node.id);
            replaceAndAdd(sel);
        }
    } else if (localStorage.getItem("currentSelectedService_type") === "object") {
        var sel = createSchema("object", ref);

        var node=ref.get_node(sel);
        let splitter = localStorage.getItem("currentSelectedService").split("/");
        var nodeText = splitter[splitter.length - 1];
        if(node.text!=nodeText){
            mapperObj.clean();
            node.data.lines=null;
            node.data.transformers=null;
            node.data.fqn=localStorage.getItem("currentSelectedService");
            launching_arrow_jsTree_function_ref.settings.core.data=[];
            launching_arrow_jsTree_function_ref.refresh();
            landing_arrow_jsTree_function_ref.settings.core.data=[];
            landing_arrow_jsTree_function_ref.refresh();
            //ref.rename_node(node,nodeText);
            node.data.serviceType=localStorage.getItem("currentSelectedService_type");
            ref.select_node(node.id);
            replaceAndAdd(sel);
        }
    } else {
        var sel = (null == RECENT_ADDED_NODE) ? (null == selectedNodeRef) ? createSchema("invoke", ref) : selectedNodeRef : RECENT_ADDED_NODE;
        RECENT_ADDED_NODE = null;

        var node=ref.get_node(sel);
        let splitter = localStorage.getItem("currentSelectedService").split("/");
        var nodeText = splitter[splitter.length - 1];
        if(node.text!=nodeText){
            mapperObj.clean();
            node.data.lines=null;
            node.data.transformers=null;
            node.data.fqn=localStorage.getItem("currentSelectedService");
            launching_arrow_jsTree_function_ref.settings.core.data=[];
            launching_arrow_jsTree_function_ref.refresh();
            landing_arrow_jsTree_function_ref.settings.core.data=[];
            landing_arrow_jsTree_function_ref.refresh();
            //ref.rename_node(node,nodeText);
            node.data.serviceType=localStorage.getItem("currentSelectedService_type");
            ref.select_node(node.id);
            replaceAndAdd(sel);
        }
    }

    // node.text=
    localStorage.setItem("enableServiceSelectionMode",false);
    //alert(localStorage.getItem("currentSelectedService"));
    //ref.refresh();

    var modal = document.getElementById("serviceModelDialog");

    modal.style.display = "none";

    flowJsTree_id = loadFile + "_flowJsTree";
    var data = flowDesignerJsTreeRef.get_json('#', {
        flat: true
    });
    localStorage.setItem(flowJsTree_id, JSON.stringify(data));
    setUnsavedChanges(loadFile);
    $("#flowDesignerJsTree").jstree().deselect_all(true);
}

function createOthersJstree(id, value) {

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

                'data': value
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
                        "folder", "service", "package", "api", "flow", "map", "transformer", "html", "js", "css", "jar", "jdbc", "sql", "properties"
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
                "function": {
                    "icon": getSystemResourcePath() + "/icons/java_icon.svg",
                    "valid_children": []
                },
                "object": {
                    "icon": getSystemResourcePath() + "/icons/java_icon.svg",
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
                }
            },
            "plugins": ["unique", "contextmenu",
                "search", "state", "types", "wholerow"
            ]
        });
    return $(id).jstree(true);
}

let FANCY_C_TOOLTIP = null;
let showdownConverter = new showdown.Converter();
$(document).ready(function () {
    $(".doc-i-button").hover(function () {
        let thisRef = this;
        FANCY_C_TOOLTIP = setTimeout(function () {
            if ($(thisRef).find('.doc-popup').length == 0) {
                let id = $(thisRef).data("id");
                let doc = id;
                if (null != DOCUMENTATION[id]) {
                    doc = showdownConverter.makeHtml(DOCUMENTATION[id].document);
                }
                $(thisRef).append('<div class="doc-popup"><div class="doc-main-panel">' + doc + '</div></div>');
            }
            $(thisRef).find('.doc-popup').css({'display': 'block'});
        }, 400);

    }, function () {
        $(this).find('.doc-popup').css({'display': 'none'});
        clearInterval(FANCY_C_TOOLTIP);
    });
});

function openToolTipPopup(ref) {
    let thisRef = ref;

    let id = $(thisRef).data("id");

    if (null == DOCUMENTATION[id].popup) {

        return ;
    }

    var modal = document.getElementById("tooltipInfoModelDialog");
    var span = document.getElementById("closeInfModelDialog");
    modal.style.display = "block";
    span.onclick = function() {
        modal.style.display = "none";
    }

    let doc = id;
    if (null != DOCUMENTATION[id]) {
        doc = showdownConverter.makeHtml(DOCUMENTATION[id].document);
    }

    $("#doc-title").html(DOCUMENTATION[id].popup.title);
    if (DOCUMENTATION[id].popup.description == "#ref") {
        $("#doc-description").html(doc);
    } else {
        $("#doc-description").html(showdownConverter.makeHtml(DOCUMENTATION[id].popup.description));
    }

    if (null != DOCUMENTATION[id].popup.uses && DOCUMENTATION[id].popup.uses.trim() != "") {
        $("#doc-uses").html(showdownConverter.makeHtml(DOCUMENTATION[id].popup.uses));
        $("#doc-uses-title").show();
        $("#doc-uses").show();
    } else {
        $("#doc-uses-title").hide();
        $("#doc-uses").hide();
    }

    if (null != DOCUMENTATION[id].popup.example && DOCUMENTATION[id].popup.example.trim() != "") {
        $("#doc-example").html(showdownConverter.makeHtml(DOCUMENTATION[id].popup.example));
        $("#doc-example-title").show();
        $("#doc-example").show();
    } else {
        $("#doc-example-title").hide();
        $("#doc-example").hide();
    }

}

function getMyParentRef() {
    if (null != parent.iframeWindow) {
        return parent.iframeWindow;
    } else if (SDK_EMBEDDED) {
        return window;
    }
    return parent;
}

function inputWatermarkAppearance() {
    if (inputJstreeRef._model.data["#"].children.length > 0) {
        $("#input_watermark").hide();
    } else {
        $("#input_watermark").show();
    }
}

function outputWatermarkAppearance() {
    if (outputJstreeRef._model.data["#"].children.length > 0) {
        $("#output_watermark").hide();
    } else {
        $("#output_watermark").show();
    }
}

function apiDesignWatermarkAppearance() {
    if (flowDesignerJsTreeRef._model.data["#"].children.length > 0) {
        $("#api_designer_watermark").hide();
    } else {
        $("#api_designer_watermark").show();
    }
}

if (!SDK_EMBEDDED) {
}


function extractJsonFromResponse(response) {
    const jsonMatch = response.match(/```json([\s\S]*?)```/);
    if (jsonMatch) {
        return removeJSONComments(jsonMatch[1].trim());
    }
    return null;
}

function extractLatestJsonObject(response) {
    if (response === null || response === undefined) {
        return null;
    }

    let parsedResponse = response;

    if (typeof response === "string") {
        try {
            parsedResponse = JSON.parse(removeJSONComments(response).trim());
        } catch (e) {
            return null;
        }
    }

    if (typeof parsedResponse !== "object" || parsedResponse === null) {
        return null;
    }

    if (parsedResponse.latest) {
        return JSON.stringify(parsedResponse);
    }

    if (!Object.prototype.hasOwnProperty.call(parsedResponse, "resp")) {
        return null;
    }

    const respValue = parsedResponse.resp;

    if (typeof respValue === "string") {
        const cleanedRespValue = removeJSONComments(respValue).trim();
        try {
            const parsedRespValue = JSON.parse(cleanedRespValue);
            return (parsedRespValue && typeof parsedRespValue === "object") ? JSON.stringify(parsedRespValue) : respValue;
        } catch (e) {
            return respValue;
        }
    }

    if (typeof respValue === "object" && respValue !== null) {
        return JSON.stringify(respValue);
    }

    return respValue;
}


function openSmartAipopup() {

                document.getElementById("smartModelDialog").style.display = "block";

}


async function sendMessageToThread(message, assistantID, smartAI) {
    return new Promise(async (resolve, reject) => {
        let threadId = null;
        const currentTime = new Date().getTime();
        const storedThreadId = localStorage.getItem('thread_id');
        const threadIdExpiration = localStorage.getItem('thread_id_expiration');

        // Check if the stored thread_id has expired
        if (storedThreadId && threadIdExpiration && currentTime < parseInt(threadIdExpiration, 10)) {
            //threadId = storedThreadId;
        } else {
            localStorage.removeItem('thread_id');
            localStorage.removeItem('thread_id_expiration');
            threadId = null;
        }

        if (smartAI) {
            threadId = null;
        }

        /*const timeout = setTimeout(() => {
            reject(new Error("Request timed out"));
            if(smartAI){
                swal("Request Timed Out", "Please check your network connection", "error");
            }
        }, 120000);*/

        try {
            asyncRestRequest(`/v1/completeRun?thread_id=${threadId}&assistantID=${assistantID}&serviceType=${SERVICE_TYPE}`, JSON.stringify({
                "role": "user",
                "content": message,
            }), 'POST', function (data) {
                //clearTimeout(timeout);
                if (!smartAI && data.thread_id) {
                    const expirationTime = currentTime + (15 * 60 * 1000); // 15 minutes in milliseconds
                    localStorage.setItem('thread_id', data.thread_id);
                    localStorage.setItem('thread_id_expiration', expirationTime.toString());
                }
                if (data) {
                    return resolve(data);
                }
            }, function (error) {
                reject(error);
            });
        } catch (error) {
            //clearTimeout(timeout);
            reject(error);
           swal({
                    title: "Error Occurred",
                    text: "Please check your network connection",
                    type: "error",
                    confirmButtonColor: "#f2533e" // or any hex color you want
                });

        }
    });
}

// function getAgentIdentifierByName(agentName, callback, errorCallback) {
//     asyncRestRequest('/packages.Awareness.dashboard.services.api.listAgents.main', null, 'GET', function (response) {
//         const normalizedAgentName = (agentName || "").trim().toLowerCase();
//         const agentList = (response && response.Agents)
//             || (response && response.spec && response.spec.Agents)
//             || (response && response.payload && response.payload.Agents)
//             || (Array.isArray(response) ? response : []);

//         const matchingAgent = Array.isArray(agentList) ? agentList.find(function (agent) {
//             const currentAgentName = ((agent && (agent.name || agent.NAME || agent.title || agent.TITLE)) || "").trim().toLowerCase();
//             return currentAgentName === normalizedAgentName;
//         }) : null;

//         if (typeof callback === "function") {
//             callback(
//                 matchingAgent ? (matchingAgent.identifier || matchingAgent.id || matchingAgent.AGENT_ID || null) : null,
//                 matchingAgent,
//                 response
//             );
//         }
//     }, errorCallback);
// }

function parseCoderAgentResponse(rawMessage) {
    if (!rawMessage) {
        return rawMessage;
    }

    if (typeof rawMessage === "object") {
        return rawMessage;
    }

    try {
        return JSON.parse(rawMessage);
    } catch (e) {
        return rawMessage;
    }
}




function getDataFromCoderAgent(agentID, message, cb, errorCallback) {
    const payload = {
                "agentID": agentID,
                "prompt": message,
                "enableInternetGrounding": false,
                "chatTitle": "SL 1.0 Coder"

        };
    asyncRestRequest('/packages.Awareness.assistant.api.chat.main', JSON.stringify(payload), 'POST', cb, errorCallback);
}





async function sendMessageToThreadForDescriptionAPI(message, assistantID, smartAI) {
    return new Promise(async (resolve, reject) => {
        let threadId = null;
        const currentTime = new Date().getTime();
        const storedThreadId = localStorage.getItem('thread_id');
        const threadIdExpiration = localStorage.getItem('thread_id_expiration');

        // Check if the stored thread_id has expired
        if (storedThreadId && threadIdExpiration && currentTime < parseInt(threadIdExpiration, 10)) {
            //threadId = storedThreadId;
        } else {
            localStorage.removeItem('thread_id');
            localStorage.removeItem('thread_id_expiration');
            threadId = null;
        }

        if (smartAI) {
            threadId = null;
        }

        try {
            asyncRestRequest(`/v1/completeRun?thread_id=${threadId}&assistantID=${assistantID}&serviceType=API`, JSON.stringify({
                "role": "user",
                "content": message,
            }), 'POST', function (data) {
                //clearTimeout(timeout);
                if (!smartAI && data.thread_id) {
                    const expirationTime = currentTime + (15 * 60 * 1000); // 15 minutes in milliseconds
                    localStorage.setItem('thread_id', data.thread_id);
                    localStorage.setItem('thread_id_expiration', expirationTime.toString());
                }
                if (data) {
                    return resolve(data);
                }
            }, function (error) {
                reject(error);
            });
        } catch (error) {
            //clearTimeout(timeout);
            reject(error);
            swal({
                    title: "Error Occurred",
                    text: "Please check your network connection",
                    type: "error",
                    confirmButtonColor: "#f2533e" // Custom red color (you can change this)
                });

        }
    });
}


function createThreadForGPT() {
    return new Promise((resolve) => {
        asyncRestRequest('/packages.middleware.pub.syncloopGPT.create_thread.main', null, 'POST', function (data) {
            localStorage.setItem('thread_id', data.id);
            resolve(data.id);
        });
    });

}

 function openaitab(newtab){
	  localStorage.setItem('activeTab', newtab);
   }

function updateServiceUsingGPT(overwrite, response) {
    response = JSON.parse(response);
    updateUUID(response.latest.api);

    if (null != response.created_on && '' == response.created_on) {
        $("#created_on_service").val(response.created_on);
    }


    if (response.consumers && false) {
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

    if (response.developers && false) {
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

    for (let i = 0; i < response.input.length; i++) {
        if (null == response.input[i].state) {
            continue;
        }
        response.input[i].state.hidden = false;
    }

    for (let i = 0; i < response.output.length; i++) {
        if (null == response.output[i].state) {
            continue;
        }
        response.output[i].state.hidden = false;
    }

    for (let i = 0; i < response.api.length; i++) {
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
    loadFromLocalStorage2(overwrite);
}

function loadFromLocalStorage2(overwrite) {
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
    if (overwrite !== false) {
        setUnsavedChanges(loadFile, false);
    }
}

function updateServiceWithComments(overwrite, commentsResponse, existingJsonStructure) {
    let comments;
    try {
        comments = JSON.parse(commentsResponse);
    } catch (e) {
        console.error("Failed to parse response:", e);
            swal({
                    title: "Error Occurred",
                    text: "Failed to parse response from Agent.",
                    type: "error",
                    confirmButtonColor: "#f2533e" // Customize this color as needed
                });

        return;
    }

    let serviceJson;
    try {
        serviceJson = JSON.parse(existingJsonStructure);
        if (!serviceJson || !serviceJson.latest) {
            throw new Error("Service JSON structure is invalid or missing.");
        }
    } catch (e) {
        console.error("Failed to fetch existing service JSON:", e);
        swal({
                title: "Error Occurred",
                text: "Failed to fetch existing service JSON.",
                type: "error",
                confirmButtonColor: "#f2533e" // Customize this hex color as needed
            });

        return;
    }

    function addCommentsToJson(node, comments) {
        if (node.data && node.data.guid) {
            let commentObj = comments.find(c => c.guid === node.data.guid);
            if (commentObj) {
                if (commentObj.comment) {
                    node.data.comment = commentObj.comment;
                    node.data.fieldDescription = btoa(commentObj.comment); // Encode in base64

                }
                if (commentObj.fieldDescription) {
                    node.data.fieldDescription = btoa(commentObj.fieldDescription); // Encode in base64
                }
            }

        }

        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                addCommentsToJson(child, comments);
            });
        }
    }

    if (Array.isArray(serviceJson.latest.input)) {
        serviceJson.latest.input.forEach(inputNode => {
            addCommentsToJson(inputNode, comments);
        });
    }

    if (Array.isArray(serviceJson.latest.output)) {
        serviceJson.latest.output.forEach(outputNode => {
            addCommentsToJson(outputNode, comments);
        });
    }

    if (Array.isArray(serviceJson.latest.api)) {
        serviceJson.latest.api.forEach(apiNode => {
            addCommentsToJson(apiNode, comments);
        });
    }

    const apiInfo = comments.find(c => c.title || c.description);
    if (apiInfo) {
        serviceJson.latest.api_info = {
            title: apiInfo.title || serviceJson.latest.api_info.title,
            description: apiInfo.description || serviceJson.latest.api_info.description
        };
    }

    updateServiceUsingGPT(overwrite, JSON.stringify(serviceJson));
}

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

let JSONDATA = {};
let isAborted = false;

function eventStream(apiUrl, onProgress, onFailed, onComplete, totalBytesReceived, sessionId){
    const eventSource = new EventSource(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + apiUrl
                    + "&access_token=" + encodeURIComponent(localStorage.getItem("AuthToken")));
    let RJSON = "";

    let isFailed = false;

    eventSource.onerror = function(event) {
        isFailed = true;
        onFailed("Something went wrong. Please try later.");
        eventSource.close();
    };

    eventSource.addEventListener("thread.run.created", function (event) {
        if (null == JSONDATA[sessionId]) {
            JSONDATA[sessionId] = [];
        }

        if (isAborted) {
            $("#chat-submit").show();
            $("#chat-stop").hide();
            isAborted = false;
            eventSource.close();
            console.log("Aborted");
        }

    }, false);
    eventSource.addEventListener("thread.run.queued", function (event) {}, false);
    eventSource.addEventListener("thread.run.in_progress", function (event) {
        if (isAborted) {
            $("#chat-submit").show();
            $("#chat-stop").hide();
            isAborted = false;
            eventSource.close();
            console.log("Aborted");
        }
        onProgress();
    }, false);
    eventSource.addEventListener("thread.run.failed", function (event) {
        if (isAborted) {
            $("#chat-submit").show();
            $("#chat-stop").hide();
            isAborted = false;
            eventSource.close();
            console.log("Aborted");
        }
        isFailed = true;
        onFailed(JSON.parse(event.data).last_error.message);
    }, false);
    eventSource.addEventListener("thread.message.delta", function (event) {
        if (isAborted) {
            $("#chat-submit").show();
            $("#chat-stop").hide();
            isAborted = false;
            eventSource.close();
            console.log("Aborted");
        }
        console.log(event);
        let json = JSON.parse(event.data);
        for (var i = 0 ; i < json.delta.content.length; i++) {
            RJSON += json.delta.content[i].text.value;
        }

        let count = 0;
        for(var i = 0 ; i < JSONDATA[sessionId].length ; i++) {
            count += JSONDATA[sessionId][i].length;
        }

        totalBytesReceived(count + RJSON.length);
    }, false);
    eventSource.addEventListener("thread.run.complete", function (event) {
        $("#chat-submit").show();
        $("#chat-stop").hide();
        isAborted = false;
        if (isAborted) {
            console.log("Aborted but completed!");
        }
        console.log(event);
    }, false);

    eventSource.addEventListener("thread.message.completed", function (event) {
        $("#chat-submit").show();
        $("#chat-stop").hide();
        isAborted = false;
        if (isAborted) {
            console.log("Aborted but completed!");
        }
        console.log(event);
    }, false);

    eventSource.addEventListener("thread.run.step.completed", function (event) {
        $("#chat-submit").show();
        $("#chat-stop").hide();
        isAborted = false;
        if (isAborted) {
            console.log("Aborted but completed!");
        }
        console.log(event);
    }, false);

    eventSource.addEventListener("thread.message.incomplete", function (event) {
        $("#chat-submit").show();
        $("#chat-stop").hide();
        isAborted = false;
        console.log(event);
        eventSource.close();
        if (isAborted) {
            console.log("Aborted but completed!");
        }
        JSONDATA[sessionId].push(RJSON);
        console.log("PENDING DATA ::: " + JSONDATA[sessionId]);

        eventStream(apiUrl, onProgress, onFailed, onComplete, totalBytesReceived, sessionId);

    }, false);

    eventSource.addEventListener("done", function (event) {
        $("#chat-submit").show();
        $("#chat-stop").hide();
        isAborted = false;
        eventSource.close();
        if (isAborted) {
            console.log("Aborted but completed!");
        }
        JSONDATA[sessionId].push(RJSON);
        console.log(JSONDATA[sessionId]);
        if (!isFailed) {
            onComplete(JSONDATA[sessionId]);
        }

    }, false);
}


function removeJSONComments(json) {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, null, 2);
    }

    return json.replace(/("(?:\\.|[^"\\])*")|\/\*[\s\S]*?\*\/|\/\/.*(?=[\n\r])/g, (match, group1) => {
        // If the match is a string (group1), return it unchanged
        if (group1) {
            return group1;
        } else {
            // Otherwise, it's a comment, so replace it with an empty string
            return '';
        }
    }).trim();
}

function formatSize(bytes) {
    if (bytes < 1024) {
        return "Received " + bytes + " bytes";
    } else if (bytes < 1024 * 1024) {
        return "Received " + (bytes / 1024).toFixed(2) + " KB";
    } else {
        return "Received " + (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }
}

function formatInPercentage(bytes) {
    if (bytes < 1024) {
        return bytes / 100; // Scale to max 10
    } else if (bytes < 1024 * 1024) {
        return ((bytes / (1024 * 1024)) * 50) + 10; // Scale to max 50
    } else {
        return 50 + (((bytes - 1024 * 1024) / (1024 * 1024)) * 50) + 10; // More than 50
    }
}

function missingPartBuilder(api) {
    for (let i = 0 ; i < api.length ; i++) {
        if (null != api[i].children && api[i].children.length > 0) {
            api[i].children = missingPartBuilder(api[i].children);
        }

        api[i].a_attr = {};
        api[i].state = {};
    }
    return api;
}

function toggleServiceEndpointforAPI(radio) {
    const container = radio.closest('.copy-text2');
    if (!container) return;

    const input = container.querySelector('.service_full_path');
    if (!input || !input.value) return;

    const apiBase = window.env?.API_BASE_URL;
    const wsBase  = window.env?.WS_BASE_URL;

    if (!apiBase || !wsBase) return;

    if (radio.value === 'ws' && input.value.startsWith(apiBase)) {
        input.value = input.value.replace(apiBase, wsBase + "/ws");
    }

    if (radio.value === 'api' && input.value.startsWith(wsBase)) {
        input.value = input.value.replace(wsBase + "/ws", apiBase);
    }
}


function toggleServiceEndpointforService(radio) {
    const wrapper =
        radio.closest('.copy-text2') ||
        radio.closest('.position') ||
        radio.closest('div');

    if (!wrapper) return;

    const input = wrapper.querySelector('.service_full_path');
    if (!input || !input.value) return;

    const apiBase = window.env?.API_BASE_URL;
    const wsBase  = window.env?.WS_BASE_URL;

    if (!apiBase || !wsBase) return;

    if (radio.value === 'ws' && input.value.includes(apiBase)) {
        input.value = input.value.replace(apiBase, wsBase + "/ws");
    }

    if (radio.value === 'api' && input.value.includes(wsBase)) {
        input.value = input.value.replace(wsBase + "/ws", apiBase);
    }
}
function toggleServiceEndpointforSQL(radio) {
    if (!radio || !window.ENV) return;

    const apiBase = window.ENV.API_BASE_URL;
    const wsBase  = window.ENV.WS_BASE_URL;

    const wrapper = radio.closest('.position') || document;
    const input = wrapper.querySelector('.service_full_path');

    if (!input) {
        console.warn("service_full_path not found");
        return;
    }

    let value = input.value || "";

    if (value.includes(wsBase)) {
        value = value.replace(wsBase + "/ws", apiBase);
    }

    if (radio.value === 'ws') {
        value = value.replace(apiBase, wsBase + "/ws");
    }

    input.value = value;
}

$(document).ready(function () {

    $("#api-endpoint-gt").on("click", function () {
        $(this).select();
        document.execCommand("copy");
    });

});
