/*let appDescriptionRef = null;
		ClassicEditor.create(document.querySelector('#app_edit_requirement'))
			.then(editor => {
				appDescriptionRef = editor;
			}).catch(error => {
				console.error(error);
			});*/

// $("#chat-circle").click(function() {
// 	$("#chat-circle").toggle('scale');
// 	$(".chat-box").toggle('scale');
//
// });
//
// $(".chat-box-toggle").click(function() {
// 	$("#chat-circle").toggle('scale');
// 	$(".chat-box").toggle('scale');
// });

angular.element(document).ready(function () {
    const loader = document.getElementById('initial-loader');
    if (loader) loader.remove(); // clean kill of the pre-Angular loader
});

$(document).on("click", "#test-chat-trigger", function() {
    if (!$scope.chatModalVisible) {
        $scope.openChatTest($scope.defaultAgent); // Or pass actual agent object
        $scope.$applyAsync(); // To ensure Angular picks up changes
    }
    $("#chat-circle").toggle('scale');
    $(".chat-box").toggle('scale');
});

$("#menu-toggle").click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
});

// Remove action param immediately on page load
(function () {
    // capture action before cleaning URL
    window.__syncloopAction = new URLSearchParams(window.location.search).get("action");

    // clean URL immediately
    if (window.location.search.includes("action=")) {
        const clean = window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, clean);
    }
})();

var app = angular.module('jsonEditorApp', []);

// Directive to read files from file input
app.directive('fileReader', function() {
    return {
        scope: {
            fileReader: "="
        },
        link: function(scope, element, attrs) {
            element.bind('change', function(changeEvent) {
                var file = changeEvent.target.files[0];
                if (file) {
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        scope.$apply(function() {
                            scope.fileReader(e.target.result);
                        });
                    };
                    reader.readAsText(file);
                }
            });
        }
    };
});

app.directive('fileDropZone', function () {
    return {
        restrict: 'A',
        link: function (scope, element) {

            element.on('dragover', function (e) {
                e.preventDefault();
                e.stopPropagation();
                element.addClass('drag-hover');
            });

            element.on('dragleave', function (e) {
                e.preventDefault();
                e.stopPropagation();
                element.removeClass('drag-hover');
            });

            element.on('drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
                element.removeClass('drag-hover');

                const files = e.originalEvent
                    ? e.originalEvent.dataTransfer.files
                    : e.dataTransfer.files;

                scope.$evalAsync(function () {
                    if (typeof scope.handleRAGFilesSelected === 'function') {
                        scope.handleRAGFilesSelected(files);
                    }
                });
            });
        }
    };
});

// custom tab animation
const tabs   = document.querySelectorAll('[role="connectllmboxtab"]');
const panels = document.querySelectorAll('[role="connectllmboxtabpanel"]');

function activateTab(tab) {
    // sab tabs reset
    tabs.forEach(t => {
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');       // roving tabindex
        t.classList.remove('is-active');
    });

    // sab panels reset
    panels.forEach(p => {
        p.hidden = true;
        p.classList.remove('is-active');
    });

    // selected tab + uska panel activate
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    tab.classList.add('is-active');

    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    panel.hidden = false;
    panel.classList.add('is-active');

    tab.focus();
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab));

    tab.addEventListener('keydown', e => {
        const list  = [...tabs];
        const index = list.indexOf(tab);

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            list[(index + 1) % list.length].focus();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            list[(index - 1 + list.length) % list.length].focus();
        } else if (e.key === 'Home') {
            e.preventDefault(); list[0].focus();
        } else if (e.key === 'End') {
            e.preventDefault(); list[list.length - 1].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault(); activateTab(tab);
        }
    });
});

// initial roving tabindex (active = 0)
tabs.forEach((t,i)=> t.setAttribute('tabindex', i===0 ? '0' : '-1'));

$(function () {
    $('#connectllm_modal').modal({
        show: false,     // open on load
        backdrop: true, // outside click closes (don't use 'static')
        keyboard: true  // ESC closes
    });
});



app.controller('MainCtrl', ['$scope', '$http', '$timeout', '$sce', function($scope, $http, $timeout, $sce, $q, $injector) {

    $scope.activeTab = 'apps';
    $scope.addappPopUpHeading = 'Edit App'
    $scope.teamPopUpHeading = 'Edit Teams';
    $scope.agentPopUpHeading = 'Edit Agents';
    $scope.toolPopUpHeading = 'Edit Tools';
    $scope.LLMPopUpHeading  = 'Edit LLM';
    $scope.knowledgeBasePopUpHeading = 'Edit Knowledge Base';
    $scope.isAppAvailable = false;
    $scope.disableConfirmDelete = false;
    $scope.appId = null;

    // Chat Test enhancement variables
    $scope.chatModalVisible = false;
    $scope.appChatModalVisible = false;
    $scope.chatHistory = [];
    $scope.currentChatAgent = null;
    $scope.newChatMessage = "";
    $scope.chatSendVisible = true;
    $scope.chatWaitVisible = false;
    $scope.inProgressVisible = false;
    $scope.isDataLoading = true;
    $scope.isLoadingTeams = false;
    $scope.inProgressApps = false;
    $scope.inProgressTeams = false;

    // KB Search Test enhancement variables
    $scope.kbSearchModalVisible = false;
    $scope.currentKB = null;
    $scope.kbSearchText = "";
    $scope.kbSearchResults = {};
    $scope.enableQueryExpander = false;
    $scope.kbSearchWaitVisible = false;
    $scope.searchTeamChatText = "";
    $scope.minisidebar_class = "";
    $scope.main_wrapper_view = "";
    $scope.chat_list_type = "packages.syncloopai.assistant.teams.executeTeam";
    $scope.chat_list_type_agent = "chat";
    $scope.currentHost = window.location.protocol + "//" + window.location.host;
    $scope.tenantName = localStorage.getItem("tenant");
    $scope.oidcRedirectCallback = $scope.currentHost + "/callback-oidc.html";
    $scope.currentTeam = null;
    $scope.currentConversation = null;
    $scope.jwtToken = null;
    $scope.currentUrl = location.href;
    $scope.copyLinkCaption = "Copy link";
    $scope.isAgentInviting = false;
    $scope.sharedConsumers = [];
    $scope.invitingUser = "";
    $scope.restricted_keywords = ["abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "continue", "default", "do", "double", "else", "enum", "extends", "final", "finally", "float", "for", "if", "implements", "import", "instanceof", "int", "interface", "long", "native", "new", "null", "package", "private", "protected", "public", "return", "short", "static", "strictfp", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "try", "void", "volatile", "while"];

    $scope.users = {};
    $scope.openSwagger = function() {
        window.open("middleware/pub/server/ui/oas/client.html?fqn=" + $scope.chat_list_type, '_blank');
    }

    $scope.viewSwagger = function() {
        window.open("middleware/pub/server/ui/oas/client.html?fqn=packages.ConsumerAgents.wrapper.api.agents._" +
            ($scope.currentAgent.identifier.replaceAll("-", "_")), '_blank');
    }

    $scope.searchText = {
        agents: '',
        apps: '',
        teams: '',
        tools: '',
        llms: '',
        kbs: '',
        rags: '',
        embeddings: ''
    };

    $scope.copyAgentLink = function() {
        navigator.clipboard.writeText(location.href).then(function() {
        }).catch(function(err) {
            console.error("Failed to copy: ", err);
        });

        $scope.copyLinkCaption = "Copied";


        $timeout(function() {
            $scope.copyLinkCaption = "Copy Link";
        }, 1000);
    }

    $scope.showNotification = function (type, message) {
        //swal("", message, type);
        console.log(type + " " + message);
    };

    $scope.filterAgents = function(agent) {
        const query = ($scope.searchText.agents || '').toLowerCase();
        const id = ($scope.maskedIdentifier(agent.identifier) || '').toLowerCase();
        const name = (agent.name || '').toLowerCase();
        const title = (agent.title || '').toLowerCase();
        const llm = ($scope.getLLMName(agent.LLMkey) || '').toLowerCase();
        const teams = ($scope.getTeamsName(agent).join(', ') || '').toLowerCase();
        const tools = ($scope.getAgentTools(agent).join(', ') || '').toLowerCase();

        return [id, name, title, llm, teams, tools].some(field => field.includes(query));
    };

    $scope.filterApps = function(app) {
        const query = ($scope.searchText.apps || '').toLowerCase();
        const name = (app.appName || '').toLowerCase();
        const desc = ($scope.decodeBase64(app.description) || '').toLowerCase();
        const subtitle = ($scope.getSubtitle(app.sub_title).join(', ') || '').toLowerCase();

        return [name, desc, subtitle].some(field => field.includes(query));
    };

    $scope.filterTeams = function(team) {
        const query = ($scope.searchText.teams || '').toLowerCase();
        const id = ($scope.maskedIdentifier(team.teamID) || '').toLowerCase();
        const name = (team.teamName || '').toLowerCase();
        const req = ($scope.decodeBase64(team.requirement) || '').toLowerCase();
        const agents = (team.Agents.map(a => $scope.getToolAgent(a)).join(', ') || '').toLowerCase();

        return [id, name, req, agents].some(field => field.includes(query));
    };

    $scope.filterTools = function(tool) {
        const query = ($scope.searchText.tools || '').toLowerCase();
        const fqn = (tool.fqn || '').toLowerCase();
        const agent = ($scope.getToolAgent(tool) || '').toLowerCase();

        return [fqn, agent].some(field => field.includes(query));
    };

    $scope.filterLLMs = function(llm) {
        const query = ($scope.searchText.llms || '').toLowerCase();

        const model = (llm.modelName || '').toLowerCase();
        const provider = (llm.provider || '').toLowerCase();
        const baseUrl = (llm.baseUrl || '').toLowerCase();
        const apiKey = ($scope.mask(llm.apiKey) || '').toLowerCase();
        const temperature = (llm.temperature !== undefined && llm.temperature !== null) ? String(llm.temperature).toLowerCase(): '';
        const maxTokens = (llm.maxTokens !== undefined ? llm.maxTokens.toString() : '').toLowerCase();
        const enablePFC = (llm.enableParallelToolCalling ? 'true' : 'false');
        const name = (llm.name || '').toLowerCase();

        return [
            model, provider, baseUrl, apiKey,
            temperature, maxTokens, enablePFC, name
        ].some(field => field.includes(query));
    };

    $scope.filterEmbeddingModels = function(em) {
        const query = ($scope.searchText.embeddings || '').toLowerCase();

        const name = (em.modelName || '').toLowerCase();
        const display = (em.displayName || '').toLowerCase();
        const provider = (em.provider || '').toLowerCase();
        const key = (em.EMkey || '').toLowerCase();

        return [name, display, provider, key].some(v => v.includes(query));
    };

    $scope.filterKBs = function(kb) {
        const query = ($scope.searchText.kbs || '').toLowerCase();
        const id = (kb.ragID || '').toLowerCase();
        const name = (kb.name || '').toLowerCase();

        return [id, name].some(field => field.includes(query));
    };

    $scope.filterRAGs = function(rag) {
        const query = ($scope.searchText.rags || '').toLowerCase();
        const kbName = ($scope.getKBNameForRAG(rag.ragID) || '').toLowerCase();
        const path = (rag.path || '').toLowerCase();
        const pattern = (rag.filePattern || '').toLowerCase();
        const seg = (rag.maxSegmentSizeInChars + '').toLowerCase();
        const overlap = (rag.maxOverlapSizeInChars + '').toLowerCase();
        const result = (rag.maxSearchResults + '').toLowerCase();

        return [kbName, path, pattern, seg, overlap, result].some(field => field.includes(query));
    };

    $scope.swalInfo = (title, text) =>
        $timeout(() => swal({ title, text, type: "info", showConfirmButton: false, allowOutsideClick:false, allowEscapeKey:false }), 120);

    $scope.swalSuccess = (title, text) =>
        $timeout(() => swal({ title, text, type: "success", confirmButtonColor:"#2C61F5", allowOutsideClick:false, allowEscapeKey:false, buttonsStyling:true }), 150);

    $scope.swalError = (title, text) =>
        $timeout(() => swal(title, text || "Unknown error", "error"), 120);

    $scope.swalErrorConfirm = function (title, text, onConfirm, onCancel) {
        $timeout(function () {
            swal({
                title: title,
                text: text || "Unknown error",
                type: "error",
                showCancelButton: true,
                confirmButtonColor: "#f2533e",
                confirmButtonText: "Save Anyway",
                cancelButtonText: "Cancel",
                closeOnConfirm: true,
                closeOnCancel: true,
                allowOutsideClick: false,
                allowEscapeKey: false
            }, function (isConfirm) {
                if (isConfirm) {
                    if (typeof onConfirm === "function") onConfirm();
                } else {
                    if (typeof onCancel === "function") onCancel();
                }
            });
        }, 120);
    };



    // new flags
    $scope.isSearchingTeams   = false;
    $scope.isSearchingLLMs   = false;
    $scope.isSearchingKBs    = false;
    $scope.isSearchingAgents = false;
    $scope.isSearchingTools  = false;
    $scope.isSearchingRAGs   = false;

    var SEARCH_DEBOUNCE_MS = 250;

    function makeSearchWatcher(modelPath, flag, timer) {
        $scope.$watch(modelPath, function (q) {
            if ($scope[timer]) { $timeout.cancel($scope[timer]); }
            if (!q) {
                $scope[flag] = false;
                return;
            }
            $scope[flag] = true;
            $scope[timer] = $timeout(function () {
                $scope[flag] = false;
            }, SEARCH_DEBOUNCE_MS);
        });
    }

    makeSearchWatcher('searchText.llms',   'isSearchingLLMs',   '_llmTimer');
    makeSearchWatcher('searchText.kbs',    'isSearchingKBs',    '_kbTimer');
    makeSearchWatcher('searchText.agents', 'isSearchingAgents', '_agentsTimer');
    makeSearchWatcher('searchText.tools',  'isSearchingTools',  '_toolsTimer');
    makeSearchWatcher('searchText.rags',   'isSearchingRAGs',   '_ragsTimer');
    makeSearchWatcher('searchText.teams',   'isSearchingTeams',   '_teamsTimer');
    makeSearchWatcher('searchText.embeddings', 'isSearchingEmbeddings', '_embTimer');

    $scope.doLogout = function() {
        Cookies.remove('pac4jCsrfToken');
        Cookies.remove('tenant');
        Cookies.remove('JSESSIONID');
        localStorage.clear();
        sessionStorage.clear();
        var cookies = document.cookie.split(";");

        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var eqPos = cookie.indexOf("=");
            var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        location.href = "/";
    }


    $scope.getSubtitle = function(str) {
        if (null == str) {
            return [];
        }
        return str.split("/");
    }


    // Initial JSON spec data
    $scope.spec = {};

    // Ensure arrays exist
    $scope.spec.LLMs = $scope.spec.LLMs || [];
    $scope.spec.Apps = $scope.spec.Apps || [];
    $scope.spec.Agents = $scope.spec.Agents || [];
    $scope.spec.Teams = $scope.spec.Teams || [];
    $scope.spec.Tools = $scope.spec.Tools || [];
    $scope.spec.ToolsRegistry = $scope.spec.ToolsRegistry || [];
    $scope.spec.RAGs = $scope.spec.RAGs || [];
    $scope.spec.KBs = $scope.spec.KBs || [];
    $scope.Conversations = $scope.Conversations || [];
    $scope.spec.ToolsRegistry = $scope.spec.ToolsRegistry || [];

    $scope.closeOverlayLLM = function() {
        document.getElementById("overlay-llm").classList.remove("open");
        document.getElementById("bgOverlay").classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");

        if ($scope.llmEdit && $scope.activeProvider) {
            if ($scope.llmEdit[$scope.activeProvider]) {
                $scope.llmEdit[$scope.activeProvider].apiKey = "";
            }
        }
    };

    $scope.closeOverlayAgent = function () {
        document.getElementById("overlay-agent").classList.remove("open");
        document.getElementById("bgOverlayAgent").classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");
    };
    $scope.closeteamconfigration = function () {
        document.getElementById("overlay-teamconfigration").classList.remove("open");
        document.getElementById("bgOverlayteamconfigration").classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");
    };

    $scope.closeOverlayTool = function () {
        document.getElementById("overlay-tool").classList.remove("open");
        document.getElementById("bgOverlayTool").classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");

        const input = document.getElementById("tool_edit_name");
        const descInput = document.getElementById("tool_edit_description");
        const staticPayloadInput = document.getElementById("tool_static_json_payload");
        const infoEl = document.getElementById("info_message_tool");
        const saveBtn = document.querySelector('#overlay-tool button[ng-click="completeToolEdit()"]');

        if (input) {
            input.value = "";
            input.classList.remove("is-invalid");
        }

        if (descInput) {
            descInput.value = "";
        }

        if (staticPayloadInput) {
            staticPayloadInput.value = "";
        }

        const mcpStaticPayload = document.getElementById("tool_mcp_static_payload");
        const mcpSchema = document.getElementById("tool_mcp_schema");
        if (mcpStaticPayload) mcpStaticPayload.value = "";
        if (mcpSchema) mcpSchema.value = "";

        $('#aiToolsAdd_api').val(null).trigger('change');
        $('#tool_edit_agents').val(null).trigger('change');

        $("#toolVariableInputs").empty();
        $("#toolVariablesRow").hide();
        $("#staticJsonPayloadRow").hide();

        $scope.toolName = "";
        $scope.selectedFqn = "";
        $scope.saveInProgress = false;

        if (infoEl) {
            infoEl.textContent = "";
        }

        saveBtn?.removeAttribute("disabled");
    };

    $scope.closeOverlayToolAuth = function() {
        document.getElementById("overlay-tool-auth").classList.remove("open");
        document.getElementById("bgOverlayToolAuth").classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");
        $scope.currentEditingAgentTool = null;
        $scope.toolAuthEdit = {
            id: '',
            name: '',
            skipAuthInfo: false,
            mcpAuth: getDefaultMcpAuthConfig()
        };
    };

    $scope.closeOverlay = function () {
        document.getElementById("overlayApp").classList.remove("open");
        document.getElementById("bgOverlayApp").classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");
    };

    $scope.closeOverlayTeam = function() {
        document.getElementById("overlay-team").classList.remove("open");
        document.getElementById("bgOverlayTeam").classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");
    };

    $scope.closeOverlayRAG = function () {
        document.getElementById("overlay-rag").classList.remove("open");
        document.getElementById("bgOverlayRAG").classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");
    };

    $scope.closeOverlayKB = function () {
        document.getElementById("overlay-kb").classList.remove("open");
        document.getElementById("bgOverlayKB").classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");
    };


    // In your controller
    $scope.connectllmboxclose    = true;   // picker visible
    $scope.connectllmbox_tabclose = false; // tabs hidden
    $scope.activeProvider = 'openai'; // 'google' | 'openai'

    $scope.openconnectllmbox_tab = function (provider) {
        if ($scope.isUIBusy && $scope.isUIBusy()) return;

        const p = (provider || 'otheragent').toLowerCase();

        $scope.activeProvider = p;

        $scope.llmEdit = $scope.llmEdit || {};
        if (!$scope.llmEdit[p]) {
            $scope.llmEdit[p] = {
                properties: {
                    currency: 'INR'
                },
                providerChoice: p === 'openai' ? 'openAI' : (p === 'google' ? 'Google' : (p === 'claude' ? 'claude' : '')),
                useTemperature: true,
                useTopP: true
            };
        }

        $scope.connectllmboxclose     = false;
        $scope.connectllmbox_tabclose = true;

        if ($scope.llmEdit[$scope.activeProvider]) {
            $scope.llmEdit[$scope.activeProvider].apiKey = "";
        }

        const def    = $scope.llmMeta[$scope.activeProvider]?.default_model;
        const models = $scope.llmProviders[$scope.activeProvider] || [];

        if (def) {
            $scope.llmEdit[$scope.activeProvider].modelName = def.model_name;
            $scope.llmSelectedModel[$scope.activeProvider]  = models.find(
                m => m.model_name === def.model_name
            );
        }

        if (typeof $scope.onModelSelect === 'function') {
            $scope.onModelSelect($scope.activeProvider, def?.model_name || '');
        }
        if (!$scope.llmEdit.otheragent) $scope.llmEdit.otheragent = {};
        $scope.llmEdit.otheragent.properties =
            $scope.llmEdit.otheragent.properties || {};

        if (!$scope.llmEdit.otheragent.properties.currency) {
            $scope.llmEdit.otheragent.properties.currency = 'INR';
        }

        $scope.connectLLM = $scope.connectLLM || {};
        $scope.connectLLM.provider =
            $scope.activeProvider === 'openai'
                ? 'openAI'
                : $scope.activeProvider.charAt(0).toUpperCase() + $scope.activeProvider.slice(1);

        if ($scope.activeProvider === 'otheragent') {
            $scope.llmEdit.otheragent.useTemperature = true;
            $scope.llmEdit.otheragent.useTopP = true;

            if ($scope.llmEdit.otheragent.temperature == null)
                $scope.llmEdit.otheragent.temperature = 1.0;
            if ($scope.llmEdit.otheragent.topP == null)
                $scope.llmEdit.otheragent.topP = 0.5;
        }

        $scope.llmEdit[p].apiKey = '';

        $timeout(() => {
            $scope.initLLMModelSelect2();
        }, 300);

        $scope.$applyAsync();
    };

    $scope.isUIBusy = function () {
        return !!($scope.saveInProgress || $scope._llmSubmitInFlight);
    };

    function resetSaveUI() {
        $scope.saveInProgress = false;
        $scope._llmSubmitInFlight = false;
        $scope.$applyAsync && $scope.$applyAsync();
    }

    const _origSelectProvider = $scope.selectProvider;

    $scope.selectProvider = function (provider) {
        if ($scope.isUIBusy()) return;
        if (_origSelectProvider) return _origSelectProvider(p);
        $scope.activeProvider = (provider || '').toLowerCase();
        $scope.connectLLM = $scope.connectLLM || {};
        $scope.connectLLM.provider =
            $scope.activeProvider === 'openai'
                ? 'openAI'
                : $scope.activeProvider.charAt(0).toUpperCase() + $scope.activeProvider.slice(1);

        const def = $scope.llmMeta[provider]?.default_model;
        const models = $scope.llmProviders[provider] || [];

        if (def) {
            $scope.llmEdit[provider].modelName = def.model_name;
            $scope.llmSelectedModel[provider] = models.find(m => m.model_name === def.model_name);
        }

        if (typeof $scope.onModelSelect === 'function') {
            $scope.onModelSelect(provider, def?.model_name || '');
        }

        if ($scope.activeProvider === 'otheragent') {
            if (!$scope.llmEdit.otheragent) $scope.llmEdit.otheragent = {};
            $scope.llmEdit.otheragent.useTemperature = true;
            $scope.llmEdit.otheragent.useTopP = true;

            if ($scope.llmEdit.otheragent.temperature == null)
                $scope.llmEdit.otheragent.temperature = 1.0;
            if ($scope.llmEdit.otheragent.topP == null)
                $scope.llmEdit.otheragent.topP = 0.5;
        }

    };

    $scope.openConnectLLMModal = function (opts = {}) {
        $scope.activeProvider         = null;
        $scope.connectllmboxclose     = true;
        $scope.connectllmbox_tabclose = false;

        if (opts.provider === 'google' || opts.provider === 'openai') {
            $scope.activeProvider         = opts.provider;
            $scope.connectllmboxclose     = false;
            $scope.connectllmbox_tabclose = true;
        }

        if ($scope.activeProvider && $scope.llmEdit[$scope.activeProvider]) {
            $scope.llmEdit[$scope.activeProvider].apiKey = "";
        }

        $scope.$applyAsync(function () {
            $timeout(function () {
                var $m = $('#connectllm_modal');
                if (!$m.length) return;
                if (!$m.parent().is('body')) $m.appendTo('body');
                $m.removeClass('show'); // avoid half-open state if present
                $m.modal({ backdrop: true, keyboard: true, show: true });
            }, 0);
        });
    };

    $scope.closeConnectLLMModal = function () {
        $('#connectllm_modal').modal('hide');
    };

    $scope.saveInProgress = false;
    $scope.llmEdit = {
        openai: {}, google: {}, claude: {}, xai: {}, mistral: {},groq:{}, otheragent: {}
    };
    $scope._llmSubmitInFlight = false;
    $scope.llmSelectedModel = {};
    $scope.llmProviders = { openai: [], google: [], claude: [], xai: [], mistral: [], groq: [] };
    $scope.llmMeta = {};
    $scope.llmProvidersMeta = $scope.llmMeta;
    $scope.llmVerificationState = 'idle'; // 'idle' | 'verifying' | 'verified' | 'failed'
    $scope.llmStatusByKey = {}

    $scope.actuallySaveLLM = function(
        LLMKey, name, description, providerForApi, maxTokens,
        llmUrl, apiKey, modelName, temperature, topP,
        enablePFC, displayName, sstcBool, showSuccessAfter, saveUnverifiedLLM = false, properties = {}
    ) {
        let currentRequest = null;
        let llmTimeout = setTimeout(() => {
            if (currentRequest && typeof currentRequest.abort === 'function') {
                try { currentRequest.abort(); } catch (e) { console.warn("Abort threw:", e); }
            }
            resetSaveUI();
            $scope.hideVerifyModal();
            try { swal.close(); } catch (e) {}

            if (showSuccessAfter === "VERIFICATION_ONLY") return;

            $scope.showErrorModal(
                "Connection attempt took too long. Please check your LLM server or credentials and try again.",
                function onSaveAnyway() {

                    const list = $scope.spec?.LLMs || [];
                    const existing = list.find(x => x.LLMkey === LLMKey);

                    if (existing) {
                        existing.props = existing.props || {};
                        existing.props.lastLLMStatus = 'Setup Pending';
                        existing.is_verified = false;
                    }

                    $scope.llmStatusByKey = $scope.llmStatusByKey || {};
                    $scope.llmStatusByKey[LLMKey] = {
                        status: 'Setup Pending',
                        verified: false,
                        updatedAt: Date.now()
                    };

                    $scope.actuallySaveLLM(
                        LLMKey, name, description, providerForApi, maxTokens,
                        llmUrl, apiKey, modelName, temperature, topP,
                        enablePFC, displayName, sstcBool, "NO_VERIFICATION", true
                    );

                    if ($scope.queueAgentAutosave) $scope.queueAgentAutosave();
                },
                function onCancel() { $scope.hideVerifyModal(); }
            );
        }, 50000);

        /*const ppmInput = parseFloat(document.querySelector('#ppm_input')?.value || 0);
        const ppmOutput = parseFloat(document.querySelector('#ppm_output')?.value || 0);
        const currency = document.querySelector('#token_currency')?.value || 'INR';

        const pptInput = ppmInput / 1_000_000;
        const pptOutput = ppmOutput / 1_000_000;

        const properties = {
            ppm_input: ppmInput,
            ppm_output: ppmOutput,
            ppt_input: pptInput,
            ppt_output: pptOutput,
            currency: currency
        };*/


        currentRequest = SYNCLOOP_AI.LLM.upsertLLM(
            LLMKey, name, description, providerForApi, maxTokens,
            llmUrl, apiKey, modelName, temperature, topP,
            enablePFC, displayName, sstcBool, showSuccessAfter,
            properties,

            function successLLM(response) {
                clearTimeout(llmTimeout);
                currentRequest = null;
                $scope.hideVerifyModal();

                let verified;
                if (saveUnverifiedLLM) {
                    verified = false;
                } else {
                    verified =
                        (response?.is_verified === true ||
                            response?.verified === true ||
                            (response?.status === "success" && !response.error))
                            ? true : false;
                }

                if (response.status === "failed" || response.error || response.error?.message) {
                    resetSaveUI();
                    $scope.llmStatusByKey = $scope.llmStatusByKey || {};
                    $scope.llmStatusByKey[LLMKey] = {
                        status: 'Setup Pending',
                        verified: false,
                        updatedAt: Date.now()
                    };

                    if ($scope.queueAgentAutosave) $scope.queueAgentAutosave();

                    if (showSuccessAfter === "VERIFICATION_ONLY") {
                        // mark UI red

                        // const $dot = document.querySelector('.unverified_tools');
                        // if ($dot) {
                        //     $dot.classList.remove('blink-dot');
                        //     $dot.style.backgroundColor = '#dc3545';
                        // }

                        $scope.llmVerificationState = 'failed';

                        const llmObj = ($scope.spec?.LLMs || []).find(x => x.LLMkey === LLMKey);
                        if (llmObj) {
                            llmObj.is_verified = false;
                            llmObj._verifiedInSession = false;
                        }

                        if ($scope.activeAgent) $scope.activeAgent.isLLMVerified = false;
                        $scope.$applyAsync();
                        return;
                    }

                    const errorMsg = response.error?.message || response.error ||
                        "Verification failed. Please check your API key or endpoint.";
                    $scope.showErrorModal(
                        errorMsg,
                        function onSaveAnyway() {
                            const list = $scope.spec?.LLMs || [];
                            const existing = list.find(x => x.LLMkey === LLMKey);

                            if (existing) {
                                existing.props = existing.props || {};
                                existing.props.lastLLMStatus = 'Setup Pending';
                                existing.is_verified = false;
                            }
                            $scope.actuallySaveLLM(
                                LLMKey, name, description, providerForApi, maxTokens,
                                llmUrl, apiKey, modelName, temperature, topP,
                                enablePFC, displayName, sstcBool, "NO_VERIFICATION", true
                            );
                        },
                        function onCancel() { $scope.hideVerifyModal(); }
                    );
                    return;
                }

                const list = $scope.spec.LLMs || [];
                let existing = list.find(x => x.LLMkey === LLMKey);
                if (existing) {

                    Object.assign(existing, {
                        LLMkey: LLMKey,
                        name,
                        provider: providerForApi,
                        maxTokens,
                        llmUrl: llmUrl || existing.llmUrl || '',
                        apiKey,
                        modelName,
                        temperature,
                        topP,
                        enableParallelToolCalls: enablePFC === true,
                        sstc: sstcBool === true,
                        displayName,
                        properties: properties && Object.keys(properties).length
                            ? { ...properties }
                            : (existing.properties || {}),
                        is_verified: verified
                    });
                } else {
                    list.push({
                        LLMkey: LLMKey,
                        name,
                        provider: providerForApi,
                        maxTokens,
                        llmUrl: llmUrl || '',
                        apiKey,
                        modelName,
                        temperature,
                        topP,
                        enableParallelToolCalls: enablePFC === true,
                        sstc: sstcBool === true,
                        displayName,
                        properties: properties && Object.keys(properties).length
                            ? { ...properties }
                            : {},
                        is_verified: verified,
                        _justAdded: true
                    });
                }

                if ($scope.activeAgent) {
                    $scope.activeAgent.LLMkey = LLMKey;
                    if ($scope.agentForm) $scope.agentForm.llmKey = LLMKey;
                    if ($scope.queueAgentAutosave) $scope.queueAgentAutosave();
                }

                if(verified) {
                    $scope.llmStatusByKey = $scope.llmStatusByKey || {};
                    $scope.llmStatusByKey[LLMKey] = {
                        status: 'Working',
                        verified: true,
                        updatedAt: Date.now()
                    };
                    if (existing) {
                        existing.props = existing.props || {};
                        existing.props.lastLLMStatus = 'Working';
                    }
                }

                if ($scope.queueAgentAutosave) $scope.queueAgentAutosave();

                if (showSuccessAfter === "VERIFICATION_ONLY") {
                    // mark UI green

                    // const $dot = document.querySelector('.unverified_tools');
                    // if ($dot) {
                    //     $dot.classList.remove('blink-dot');
                    //     $dot.style.backgroundColor = '#28a745';
                    // }

                    $scope.llmVerificationState = 'verified';

                    const llmObj = ($scope.spec?.LLMs || []).find(x => x.LLMkey === LLMKey);
                    if (llmObj) {
                        llmObj.is_verified = true;
                        llmObj._verifiedInSession = true;
                    }

                    if ($scope.activeAgent) $scope.activeAgent.isLLMVerified = true;

                    $scope.$applyAsync();
                    return;
                }

                $scope.recomputeLLMState && $scope.recomputeLLMState();
                $scope.llmEdit = { openai: {}, google: {}, xai: {}, mistral: {}, groq: {}, otheragent: {} };
                $scope.activeProvider = null;

                resetSaveUI();
                $scope.swalSuccess(
                    `'${modelName}'\nConnected Successfully!`,
                    "You can now start using this model across your agents & AI apps."
                );
                $('#connectllm_modal').modal('hide');
                $scope.closellmBox();

                // const $dot = document.querySelector('.unverified_tools');
                // if ($dot) {
                //     $dot.classList.add('verified-blink');
                //     setTimeout(() => $dot.classList.remove('verified-blink'), 4000);
                // }
            },

            function errorLLM(xhr, status, error) {
                clearTimeout(llmTimeout);
                currentRequest = null;
                $scope.hideVerifyModal();
                resetSaveUI();
                try { swal.close(); } catch (e) {}

                const aborted = (status === 'abort') || (xhr && (xhr.statusText === 'abort' || xhr.readyState === 0 && xhr.status === 0));
                if (aborted) return;

                const httpStatus = xhr?.status || 0;
                let message = "An unexpected error occurred while connecting to your LLM. Please try again.";
                if (httpStatus >= 500 && httpStatus < 600) {
                    message = "The LLM service or server encountered an internal error (HTTP " + httpStatus + "). Please check your LLM Base URL or try again later.";
                } else if (xhr?.responseText) {
                    message = xhr.responseText;
                }

                $scope.llmStatusByKey = $scope.llmStatusByKey || {};
                $scope.llmStatusByKey[LLMKey] = {
                    status: 'Setup Pending',
                    verified: false,
                    updatedAt: Date.now()
                };
                if ($scope.queueAgentAutosave) $scope.queueAgentAutosave();

                if (showSuccessAfter === "VERIFICATION_ONLY") {
                    // mark UI red

                    // const $dot = document.querySelector('.unverified_tools');
                    // if ($dot) {
                    //     $dot.classList.remove('blink-dot');
                    //     $dot.style.backgroundColor = '#dc3545';
                    // }

                    $scope.llmVerificationState = 'failed';

                    const llmObj = ($scope.spec?.LLMs || []).find(x => x.LLMkey === LLMKey);
                    if (llmObj) {
                        llmObj.is_verified = false;
                        llmObj._verifiedInSession = false;
                    }

                    if ($scope.activeAgent) $scope.activeAgent.isLLMVerified = false;

                    $scope.$applyAsync();
                    return;
                }


                $scope.showErrorModal(
                    message,
                    function onSaveAnyway() {
                        const existing = $scope.spec?.LLMs?.find(x => x.LLMkey === LLMKey);

                        if (existing) {
                            existing.is_verified = false;
                            existing.props = existing.props || {};
                            existing.props.lastLLMStatus = 'Setup Pending';
                            existing.is_verified = false;
                        }
                        $scope.actuallySaveLLM(
                            LLMKey, name, description, providerForApi, maxTokens,
                            llmUrl, apiKey, modelName, temperature, topP,
                            enablePFC, displayName, sstcBool, "NO_VERIFICATION", true
                        );
                    },
                    function onCancel() { $scope.hideVerifyModal(); }
                );
            }
        );
    };

    $scope.resolveProviderKey = function (provider) {
        return (provider || 'otheragent').toLowerCase();
    };


    function resolveProviderForApi(providerKey, model) {
        // if (providerKey === 'groq') {
        //     return 'openai';
        // }

        if (providerKey === 'otheragent') {
            return ($scope.activeProvider || '').trim();
        }

        return (
            model.providerChoice ||
            model.apiProvider ||
            providerKey
        );
    }

    function ensureProperties(m) {
        m.properties = m.properties || {};

        // backward compatibility
        if (m.ppmInput != null)  m.properties.ppm_input  = m.ppmInput;
        if (m.ppmOutput != null) m.properties.ppm_output = m.ppmOutput;
        if (m.currency)          m.properties.currency   = m.currency;

        // defaults
        if (m.properties.currency == null) {
            m.properties.currency = 'INR';
        }
    }

    function resolveModelName(providerKey) {
        const cfg = $scope.llmEdit[providerKey];

        if (!cfg) return null;

        if (cfg.useCustomModel === true) {
            return (cfg.customModelName || '').trim();
        }

        return cfg.modelName;
    }

    $scope.saveConnectLLM = function (form) {
        if (form.$invalid) {
            form.$setSubmitted();
            angular.forEach(form, function (field) {
                if (field && field.$setTouched) field.$setTouched();
            });
            return;
        }

        if (!$scope.activeProvider) {
            swal("Pick a provider", "Please select a provider (OpenAI, Google, Claude, xai, Mistral, Groq, or Other).", "error");
            return;
        }

        if ($scope.saveInProgress || $scope._llmSubmitInFlight) return;
        $scope.saveInProgress = true;
        $scope._llmSubmitInFlight = true;

        const providerKey = ($scope.activeProvider || 'otheragent').toLowerCase();
        const m = ($scope.llmEdit && $scope.llmEdit[providerKey]) || {};

        const modelName = resolveModelName(providerKey);
        const llmUrl      = (m.baseUrl   || '').trim();
        const apiKey      = (m.apiKey    || '').trim();
        const displayName = (m.displayName || modelName || '').trim();
        const name        = displayName;
        const description = (m.description || '').trim();

        function safeNum(value) {
            if (value === undefined || value === null || value === '' || Number.isNaN(value)) return null;
            const num = Number(value);
            return Number.isFinite(num) ? num : null;
        }

        const temperature = (m.useTemperature === false) ? null : safeNum(m.temperature);
        const topP        = (m.useTopP === false) ? null : safeNum(m.topP);
        const maxTokens   = safeNum(m.maxTokens);

        const enablePFC   = !!m.pfc;
        const sstcBool    = !!m.toolCalling;

        const urlOk = /^https?:\/\/[^\s]+$/i.test(llmUrl);
        if (!modelName || !llmUrl || !apiKey || !urlOk) {
            form.$setSubmitted();
            angular.forEach(form, function (field) {
                if (field && field.$setTouched) field.$setTouched();
            });
            swal({
                title: "Missing / invalid fields",
                text: (!urlOk ? "Base URL must start with http(s)://.\n" : "") + "Please fill Model, Base URL and API Key.",
                icon: "error",
                confirmButtonColor: "#f2533e"
            });
            $scope.saveInProgress = false;
            $scope._llmSubmitInFlight = false;
            return;
        }

        const providerForApi = resolveProviderForApi(providerKey, m);

        ensureProperties(m);

        const LLMKey = generateUUID();

        try { swal.close(); } catch (e) {}
        // $scope.swalInfo("Verifying connection…", "Setting up model '" + modelName + "' for use.");
        $scope.showVerifyModal(modelName);

        function readNumber(val) {
            const n = Number(val);
            return Number.isFinite(n) ? n : 0;
        }

        const props = m.properties || {};

        const ppmInput  = Number(props.ppm_input  || 0);
        const ppmOutput = Number(props.ppm_output || 0);
        const currency  = props.currency || 'INR';

        const properties = {
            ppm_input: ppmInput,
            ppm_output: ppmOutput,
            ppt_input: ppmInput / 1_000_000,
            ppt_output: ppmOutput / 1_000_000,
            currency
        };

        $scope.actuallySaveLLM(
            LLMKey, name, description, providerForApi, maxTokens,
            llmUrl, apiKey, modelName, temperature,
            topP, enablePFC, displayName, sstcBool,
            "VERIFICATION_FIRST",
            false,
            properties
        );

    };

    $scope.managerFirst = function(agent) {
        // Return a sorting key: 0 for managers, 1 for others.
        return agent.title === 'Manager' ? 0 : 1;
    };

    $scope.showVerifyModal = function (modelName) {
        $scope.verifyingModelName = modelName || '';
        $scope.$applyAsync();

        const $modal = $('#verifyConnectionModal');

        $modal.appendTo('body');

        const anyModalOpen = $('.modal.show').length > 0;
        $modal.modal({
            backdrop: anyModalOpen ? false : true,
            keyboard: false,
            show: true
        });

        const highestZ = Math.max(...$('.modal').map(function () {
            const z = parseInt($(this).css('z-index')) || 1050;
            return z;
        }).get());
        $modal.css('z-index', highestZ + 20);
    };

    $scope.hideVerifyModal = function () {
        const modal = document.getElementById('verifyConnectionModal');

        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }

        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';

        document.querySelectorAll('.modal-backdrop')
            .forEach(e => e.remove());

        if (document.activeElement) {
            document.activeElement.blur();
        }
    };

    $scope.showErrorModal = function (errorMsg, onSaveAnyway, onCancel) {
        $('#verifyConnectionModal').modal('hide');

        $scope.connectionErrorText = (errorMsg && String(errorMsg)) || "Unexpected error occurred.";
        $scope.$applyAsync();

        const $modal = $('#connectionFailedModal');
        $modal.appendTo('body');

        const anyModalOpen = $('.modal.show').length > 0;
        $modal.modal({
            backdrop: anyModalOpen ? false : true,
            keyboard: true,
            show: true
        });

        const highestZ = Math.max(...$('.modal').map(function () {
            const z = parseInt($(this).css('z-index')) || 1050;
            return z;
        }).get());
        $modal.css('z-index', highestZ + 20);

        $('#saveAnywayBtn').off('click').on('click', function () {
            $modal.modal('hide');
            if (typeof onSaveAnyway === 'function') onSaveAnyway();
        });

        $('#connectionFailedModal .modal_btncancel').off('click').on('click', function () {
            $modal.modal('hide');
            if (typeof onCancel === 'function') onCancel();
        });
    };

    function toNumOrNull(v) {
        if (v === '' || v === undefined || v === null) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }

    $scope.testLLMConnection = function testLLMConnection({ provider, llmUrl, apiKey, modelName, temperature, topP, maxTokens, toolCalling, enableParallelToolCalling}) {

        const temp  = toNumOrNull(temperature);
        const top_p = toNumOrNull(topP);
        const max_t = toNumOrNull(maxTokens);

        const buildOpenAIPayload = () => {
            const body = {
                model: modelName,
                messages: [{ role: 'user', content: 'Just an echo call' }],
            };
            if (temp  !== null) body.temperature = temp;
            if (top_p !== null) body.top_p       = top_p;
            if (max_t !== null) body.max_tokens  = max_t;

            if (enableParallelToolCalling === true) {
                body.parallel_tool_calls = true;
            }

            if (toolCalling) {
                body.tools = [
                    {
                        type: "function",
                        function: {
                            name: "get_weather",
                            description: "Get current weather in a city",
                            parameters: {
                                type: "object",
                                properties: { city: { type: "string", description: "Name of the city" } },
                                required: ["city"]
                            }
                        }
                    },
                    {
                        type: "function",
                        function: {
                            name: "get_time",
                            description: "Get the current time in a city",
                            parameters: {
                                type: "object",
                                properties: { city: { type: "string", description: "City name" } },
                                required: ["city"]
                            }
                        }
                    }
                ];
            }
            return body;
        };

        switch ((provider || '').toLowerCase()) {
            case 'mistral':
            case 'xai':
            case 'groq':
            case 'openai': {
                const payload = buildOpenAIPayload();

                const requestBody = {
                    method: 'POST',
                    url: llmUrl + "/chat/completions",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    payload: JSON.stringify(payload)
                };

                return $http
                    .post(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.client.http.requestAPI.main", requestBody,
                        {
                            headers: {
                                "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                                "Content-Type": "application/json"
                            }
                        })
                    .then(r => r.data);
            }

            case 'google':{
                const payload = buildOpenAIPayload();

                const requestBody = {
                    method: 'POST',
                    url: llmUrl + "/chat/completions",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    payload: JSON.stringify(payload)
                };

                return $http
                    .post(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.client.http.requestAPI.main", requestBody,
                        {
                            headers: {
                                "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                                "Content-Type": "application/json"
                            }
                        })
                    .then(r => r.data);
            }

            default:
                return Promise.resolve({ _skipped: true, provider });
        }
    };

    $scope.connectllmenable = Array.isArray($scope.spec?.LLMs) && $scope.spec.LLMs.length > 0;
    $scope.llmDisabled = true;
    $scope.chatDisabled = false;
    $scope.toneDisabled = false;


    $scope.recomputeToolCapability = function (llm) {
        if (!llm || typeof llm !== 'object') {
            $scope.toolsDisabled = false;
            return false;
        }

        const hasValidMap = !!llm;
        const toolCalling = llm.toolCalling === true || llm.enable_tool_calling === true || llm.sstc === true;

        $scope.toolsDisabled = hasValidMap && toolCalling === false;

        if ($scope.toolsDisabled) {
            const toolsCollapse = document.getElementById('collapsetools');
            if (toolsCollapse && toolsCollapse.classList.contains('show')) {
                $(toolsCollapse).collapse('hide');
            }
        }
    };


    $scope.recomputeLLMState = function () {
        const llmList = Array.isArray($scope.spec?.LLMs) ? $scope.spec.LLMs : [];
        const llmCount = llmList.length;

        const currentKey = ($scope.activeAgent && $scope.activeAgent.LLMkey)
            ? String($scope.activeAgent.LLMkey).trim()
            : null;

        let linkedLLM = null;
        if (currentKey) {
            linkedLLM = llmList.find(x => String(x.LLMkey).trim() === currentKey) || null;
        }
        if (!linkedLLM && !currentKey && llmCount > 0) {
            linkedLLM = llmList[0];
            $scope.activeAgent.LLMkey = linkedLLM.LLMkey;
        }

        if (linkedLLM) {
            $scope.agentForm = $scope.agentForm || {};
            $scope.agentForm.llm = linkedLLM;
            $scope.activeAgent.LLMkey = linkedLLM.LLMkey;
        } else {
            // nothing selected
            if ($scope.agentForm) $scope.agentForm.llm = null;
        }

        $scope.recomputeToolCapability(linkedLLM);
        const hasValidMap = !!linkedLLM;

        if (llmCount === 0) {
            $scope.connectllmenable = false;
            $scope.llmDisabled      = true;
            $scope.chatDisabled     = true;
            $scope.selectedLLMName  = 'Select LLM';

            const llmCollapse = document.getElementById('collapsellm');
            if (llmCollapse && llmCollapse.classList.contains('show')) {
                $(llmCollapse).collapse('hide');
            }
            return;
        }

        if (hasValidMap) {
            $scope.connectllmenable = true;
            $scope.llmDisabled      = false;
            $scope.chatDisabled     = false;
            $scope.selectedLLMName  = linkedLLM.displayName || linkedLLM.name || linkedLLM.modelName || 'LLM';
        } else {
            $scope.connectllmenable = false;
            $scope.llmDisabled      = false;
            $scope.chatDisabled     = true;
            $scope.selectedLLMName  = 'Select LLM';
        }

        $timeout(function () {
            const $el = $('#llmSelect');
            if ($el.data('select2')) {
                $el.trigger('change.select2');
            }
        }, 0);
    };

    function triggerSilentVerification(linkedLLM) {
        if (!linkedLLM) return;

        if (linkedLLM._verifiedInSession === undefined) {
            linkedLLM._verifiedInSession = false;
        }

        if (linkedLLM._verifiedInSession === true) {
            return;
        }

        linkedLLM._verifiedInSession = true;
        $scope.llmVerificationState = 'verifying';

        // const blinkEl = document.querySelector('.unverified_tools');
        // if (blinkEl && !blinkEl.classList.contains('blink-dot')) {
        //     blinkEl.classList.add('blink-dot');
        // }

        $scope.actuallySaveLLM(
            linkedLLM.LLMkey,
            linkedLLM.name,
            linkedLLM.description || '',
            linkedLLM.provider,
            linkedLLM.maxTokens,
            linkedLLM.baseUrl,
            linkedLLM.apiKey,
            linkedLLM.modelName,
            linkedLLM.temperature,
            linkedLLM.topP,
            linkedLLM.enableParallelToolCalling,
            linkedLLM.displayName,
            linkedLLM.sstc,
            "VERIFICATION_ONLY",
            false,
            linkedLLM.properties || {}
        );
    }

    $scope.reverifyActiveLLM = function () {
        const selectedLLM = $scope.spec?.LLMs?.find(
            x => x.LLMkey === $scope.activeAgent?.LLMkey
        );

        if (!selectedLLM) return;

        // allow re-verification
        selectedLLM._verifiedInSession = false;
        triggerSilentVerification(selectedLLM);
    };


    $scope.$watch(() => $scope.activeAgent && $scope.activeAgent.LLMkey, $scope.recomputeLLMState());
    $scope.$watch(
        () => ($scope.spec && $scope.spec.LLMs && $scope.spec.LLMs.length) || 0,
        $scope.recomputeLLMState()
    );
    let llmVerifyTriggered = false;

    $scope.$watch('agentForm.llmKey', function (newVal, oldVal) {
        if (!oldVal) return;
        if (!newVal || newVal === oldVal) return;

        if (llmVerifyTriggered) return;
        llmVerifyTriggered = true;

        const selectedLLM = $scope.spec?.LLMs?.find(x => x.LLMkey === newVal);
        if (!selectedLLM || selectedLLM._justAdded) {
            llmVerifyTriggered = false;
            return;
        }

        triggerSilentVerification(selectedLLM);

        $timeout(function () {
            llmVerifyTriggered = false;
        }, 3000);
    });

    $scope.$watchGroup([
        'llmEdit[activeProvider].toolCalling'
    ], function (newVals) {
        const [providerToolCalling, otherToolCalling] = newVals;
        const providerKey = $scope.activeProvider || 'otheragent';
        const toolCallingValue =
            providerKey === 'otheragent' ? otherToolCalling : providerToolCalling;

        const isToolCallingEnabled = toolCallingValue === true || toolCallingValue === 'true';

        if (!isToolCallingEnabled) {
            $scope.llmEdit[providerKey].pfc = false;
            $scope.pfcDisabled = true;
        } else {
            $scope.pfcDisabled = false;
        }
    });

    $scope.$watch('llmEdit.otheragent.toolCalling', function (newVal, oldVal) {
        const isToolCallingEnabled = newVal === true || newVal === 'true';

        if (!isToolCallingEnabled) {
            $scope.llmEdit.otheragent.pfc = false;
            $scope.pfcDisabled = true;
        } else {
            $scope.pfcDisabled = false;
        }
    });

    $scope.$watch('llmEdit.otheragent.useTemperature', function(newVal) {
        if (newVal === false || newVal === 'false') {
            $scope.llmEdit.otheragent.temperature = null;
        }
    });

    $scope.$watch('llmEdit.otheragent.useTopP', function(newVal) {
        if (newVal === false || newVal === 'false') {
            $scope.llmEdit.otheragent.topP = null;
        }
    });

    function initLLMSelect2() {
        var $el = $('#llmSelect');
        if (!$el.length) return;
        if ($el.data('select2')) $el.select2('destroy');
        $el.select2({
            placeholder: 'Select LLM',
            allowClear: true,
            width: '100%'
        });
        $el.val($scope.agentForm.llmKey ?? null).trigger('change.select2');
        $el.on('change', function () {
            $scope.$applyAsync(function () {
                $scope.agentForm.llmKey = $el.val() || null;
            });
        });

    }

    function getBadgeClass(badge) {
        switch (badge) {
            case 'NEW': return 'badge badge-success';
            case 'BETA': return 'badge badge-info';
            case 'FAST': return 'badge badge-fast';
            case 'PRO': return 'badge badge-pro';
            case 'LEGACY': return 'badge badge-legacy';
            case 'DEPRECATED': return 'badge badge-danger';
            case 'EXPERIMENTAL': return 'badge badge-warning';
            case 'PREVIEW':      return 'badge badge-preview';
            case 'REASONING':    return 'badge badge-reasoning';
            default: return 'badge badge-info';
        }
    }

    function formatModelOption(option) {
        if (!option.id) return option.text;

        const raw = $(option.element).data('badges');
        if (!raw) return option.text;

        const badges = String(raw)
            .split(',')
            .map(b => b.trim())
            .filter(Boolean);

        if (!badges.length) return option.text;

        const badgeHtml = badges.map(badge => `
        <span class="${getBadgeClass(badge)}" style="margin-left:6px">
            ${badge}
        </span>
    `).join('');

        return `
        <span>
            ${option.text}
            ${badgeHtml}
        </span>
    `;
    }


    $scope.initLLMModelSelect2 = function () {

        if ($scope.activeProvider === 'otheragent') return;

        $timeout(function () {
            const $selects = $('.llm-select');
            if (!$selects.length) return;

            $selects.each(function () {
                const $el = $(this);
                const providerKey = $scope.activeProvider;

                if ($el.hasClass('select2-hidden-accessible')) {
                    $el.select2('destroy');
                }

                const $modalParent = $el.closest('.modal');

                $el.select2({
                    placeholder: 'Select model',
                    allowClear: true,
                    width: '100%',
                    ...( $modalParent.length && { dropdownParent: $modalParent } ),
                    templateResult: formatModelOption,
                    templateSelection: formatModelOption,
                    escapeMarkup: m => m
                });

                $el.off('change.llm').on('change.llm', function () {
                    const value = $(this).val();
                    const providerKey = $scope.activeProvider;

                    $scope.$applyAsync(function () {
                        if (!$scope.llmEdit[providerKey]) {
                            $scope.llmEdit[providerKey] = {};
                        }

                        $scope.llmEdit[providerKey].modelName = value;

                        if (value === '__other__') {
                            $scope.llmEdit[providerKey].useCustomModel = true;
                            $scope.llmEdit[providerKey].customModelName = '';
                        } else {
                            $scope.llmEdit[providerKey].useCustomModel = false;
                            $scope.llmEdit[providerKey].customModelName = null;
                        }

                        if (typeof $scope.onModelSelect === 'function' && value !== '__other__') {
                            $scope.onModelSelect(providerKey, value);
                        }
                    });
                });
            });
        }, 0);
    };

    $scope.switchBackToDropdown = function (providerKey) {
        $scope.llmEdit[providerKey].useCustomModel = false;
        $scope.llmEdit[providerKey].customModelName = null;

        $timeout(() => {
            $scope.initLLMModelSelect2();
        }, 0);
    };

    $scope.$watch(
        () => $scope.llmProviders[$scope.activeProvider],
        function (newVal) {
            if (newVal && newVal.length) {
                $scope.initLLMModelSelect2();
            }
        },
        true
    );

    $scope.fixMojibake = function(str) {
        if (!str) return str;
        try {
            return decodeURIComponent(escape(str));
        } catch (e) {
            return str;
        }
    };


    // Base64 utility functions
    $scope.decodeBase64 = function(str) {
        if (!str) return "";
        try {
            return decodeURIComponent(atob(str).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        } catch (e) {
            console.warn("Base64 decoding failed:", e, "Input:", str);
            return "!!DECODE_ERROR!!"; // Indicate error in UI
        }
    };
    $scope.maskedIdentifier = function (uuid) {
        return uuid.slice(0, 4) + "*****" + uuid.slice(-4);
    };

    $scope.agentTeamTags = Object.create(null);

    function recomputeAgentTeamTags() {
        const agents = Array.isArray($scope.spec.Agents) ? $scope.spec.Agents : [];
        const teams  = Array.isArray($scope.spec.Teams)  ? $scope.spec.Teams  : [];

        const map = Object.create(null);
        for (let i = 0; i < agents.length; i++) {
            const a = agents[i];
            if (!a || a.identifier == null) continue;
            map[String(a.identifier)] = [];
        }

        const sets = Object.create(null);
        const add = (id, tag) => {
            if (id == null) return;
            const key = String(id);
            if (!sets[key]) sets[key] = new Set();
            sets[key].add(tag);
        };

        for (let i = 0; i < teams.length; i++) {
            const t = teams[i] || {};
            const name = t.teamName || 'Team';

            if (t.managerId != null) {
                add(t.managerId, `${name} (Manager)`);
            }

            const members = Array.isArray(t.Agents)   ? t.Agents
                : Array.isArray(t.agents)   ? t.agents
                    : Array.isArray(t.agentIds) ? t.agentIds
                        : [];
            for (let j = 0; j < members.length; j++) {
                const m = members[j];
                const mid = (m && typeof m === 'object') ? m.identifier : m;
                add(mid, name);
            }
        }

        Object.keys(sets).forEach(k => {
            map[k] = Array.from(sets[k]);
        });

        $scope.agentTeamTags = map;
    }

    $scope.getTeamsName = function(agent) {
        if (!agent || agent.identifier == null) return [];
        return $scope.agentTeamTags[String(agent.identifier)] || [];
    };

    function computeVisibleTags(agent) {
        const container = document.getElementById("badge-container-" + agent.identifier);
        if (!container) return { visible: [], hidden: [] };

        const allTeams = $scope.getTeamsName(agent) || [];
        const visible = [];
        const hidden = [];

        const temp = document.createElement("div");
        temp.style.visibility = "hidden";
        temp.style.position = "absolute";
        temp.style.whiteSpace = "nowrap";
        document.body.appendChild(temp);

        allTeams.forEach(team => {
            const span = document.createElement("span");
            span.className = "custom_badge dinline-block mt-3";
            span.textContent = team;
            temp.appendChild(span);
        });

        const containerWidth = container.offsetWidth;
        let usedWidth = 0;

        [...temp.children].forEach((child, i) => {
            const w = child.getBoundingClientRect().width + 8; // include gap
            if (usedWidth + w <= containerWidth - 40) { // reserve ~40px for +N
                visible.push(allTeams[i]);
                usedWidth += w;
            } else {
                hidden.push(allTeams[i]);
            }
        });

        temp.remove();
        return { visible, hidden };
    }

    $scope.tagVisibilityCache = {};

    function computeVisibleTagsOnce(agent) {
        if (!$scope.tagVisibilityCache[agent.identifier]) {
            $scope.tagVisibilityCache[agent.identifier] = computeVisibleTags(agent);
        }
        return $scope.tagVisibilityCache[agent.identifier];
    }

    $scope.visibleTeams = a => computeVisibleTagsOnce(a).visible;
    $scope.hiddenTeams  = a => computeVisibleTagsOnce(a).hidden;

    $scope.refreshBadges = function() {
        $timeout(() => {
            $scope.tagVisibilityCache = {};
            recomputeAgentTeamTags();
            ($scope.spec.Agents || []).forEach(agent => {
                $scope.tagVisibilityCache[agent.identifier] = computeVisibleTags(agent);
            });

            $scope.$applyAsync();
        }, 0);
    };

    $scope.getAgentTeams = function(Agents) {
        let teams = [];
        for (let i = 0 ; i < $scope.spec.Teams.length ; i++) {

            if (Agents.identifier == $scope.spec.Teams[i].managerId) {
                teams.push($scope.spec.Teams[i]);
            }

            for (let j = 0 ; j < $scope.spec.Teams[i].Agents.length ; j++) {

                if (Agents.identifier == $scope.spec.Teams[i].Agents[j].identifier) {
                    teams.push($scope.spec.Teams[i]);
                }
            }
        }

        return teams;
    }

    $scope.getAgentsForTeam = function (team) {
        if (!team) return [];
        var allAgents = ($scope.filterAgentsForApp && $scope.filterAgentsForApp()) || [];
        var ids = ((team.Agents) || []).map(function (x) {
            return x && x.identifier;
        });

        // Include manager agent
        if (team.managerId) {
            ids.push(team.managerId);
        }

        // Create a set for quick lookup
        var idSet = Object.create(null);
        for (var i = 0; i < ids.length; i++) {
            if (ids[i]) idSet[ids[i]] = true;
        }

        return allAgents.filter(function (a) {
            return a && idSet[a.identifier];
        });
    };

    $scope.hasAnyTeamWithAgents = function () {
        if (!$scope.spec || !$scope.spec.Teams) return false;
        for (var i = 0; i < $scope.spec.Teams.length; i++) {
            var team = $scope.spec.Teams[i];
            var agents = ($scope.getAgentsForTeam(team) || []);
            // reuse the same filter used in the tab
            agents = $scope.$eval("agents | filter:filterAgents", { agents: agents });
            if (agents.length > 0) return true;
        }
        return false;
    };


    $scope.encodeBase64 = function(str) {
        if (!str) return "";
        try {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
                return String.fromCharCode('0x' + p1);
            }));
        } catch (e) {
            console.error("Base64 encoding failed:", e);
            return "!!ENCODE_ERROR!!";
        }
    };

    // UUID generator (v4)
    function generateUUID() {
        var d = new Date().getTime();
        var d2 = (performance && performance.now && (performance.now() * 1000)) || 0;
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16;
            if (d > 0) {
                r = (d + r) % 16 | 0;
                d = Math.floor(d / 16);
            } else {
                r = (d2 + r) % 16 | 0;
                d2 = Math.floor(d2 / 16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    $scope.mask = function(input) {
        if (null == input || input.trim() == "") {
            return "-";
        }

        if (input.trim().length < 21) {
            return "***";
        }

        if (!input || input.length <= 4) return input; // Return as-is if too short
        const visibleChars = 4; // Number of characters to show at the start and end
        const maskLength = input.length > 20 ?
            20 - visibleChars * 2 // For inputs over 32, use a fixed masked length
            :
            input.length - visibleChars * 2;

        return input.slice(0, visibleChars) +
            '*'.repeat(maskLength) +
            input.slice(-visibleChars);
    };

    $timeout(function () {
        $('#llm_edit_provider').select2({
            placeholder: "Select Provider",
            allowClear: true,
            width: '100%'
        });
    }, 0);



    $scope.providerList = [
        { value: "openAI", name: "openAI" },
        { value: "Google", name: "Google" }
    ];

    $scope.selectedllmIds = [];
    $scope.openLLMAdd = function() {
        $scope.llmEdit.otheragent = {};

        $scope.LLMPopUpHeading = 'Add LLM';
        document.body.classList.add("bodyscroll-fixed");

        $scope.currentLLM = null;
        $('#llm_edit_id').val('');
        $('#llm_edit_modelName').val('');
        $('#llm_edit_provider').val('');
        $('#llm_edit_baseUrl').val('');
        $('#llm_edit_apiKey').val('');
        $('#llm_edit_temperature').val('');
        $('#llm_edit_maxTokens').val('');
        $('#llm_edit_enableParallelToolCalling').prop('checked', false);
        $('#llm_edit_enablePFC').prop('checked', false);
        $('#llm_edit_name').val('');

        $('#ppm_input').val('');
        $('#ppm_output').val('');
        $('#token_currency').val('INR');

        $('#addUpdateLLMModel').modal('show');
        $("#llm_edit_provider").select2({
            placeholder: "Select Provider",
            width: "100%"
        }).val($scope.selectedllm).trigger('change');

        document.getElementById("overlay-llm").classList.add("open");
        document.getElementById("bgOverlay").classList.add("active");

        $scope.recomputeLLMState();
    };

    $scope.openLLMEdit = function(llm) {
        $scope.llmEdit.otheragent = {};
        $scope.LLMPopUpHeading = 'Edit LLM';
        $scope.currentLLM = llm;
        document.body.classList.add("bodyscroll-fixed");

        $('#llm_edit_modelName').val(llm.modelName);
        $('#llm_edit_baseUrl').val(llm.baseUrl);
        $('#llm_edit_apiKey').val(llm.apiKey);
        $('#llm_edit_temperature').val(llm.temperature);
        $('#llm_edit_name').val(llm.name);
        $('#llm_edit_provider').val([llm.provider]).trigger('change');
        $('#llm_edit_maxTokens').val(llm.maxTokens);
        $('#llm_edit_enablePFC').prop('checked', llm.enableParallelToolCalling);
        $('#addUpdateLLMModel').modal('show');

        const props = llm.properties || {};
        $('#ppm_input').val(props.ppm_input || '');
        $('#ppm_output').val(props.ppm_output || '');
        $('#token_currency').val(props.currency || 'INR');

        $scope.llmEdit.otheragent.modelName = llm.modelName;
        $scope.llmEdit.otheragent.providerChoice = llm.provider;
        $scope.llmEdit.otheragent.displayName = llm.name;
        $scope.llmEdit.otheragent.description = llm.description || '';
        $scope.llmEdit.otheragent.baseUrl = llm.baseUrl;

        if (llm.temperature) {
            $scope.llmEdit.otheragent.useTemperature = true;
            $scope.llmEdit.otheragent.temperature = llm.temperature;
        }

        if (llm.topP) {
            $scope.llmEdit.otheragent.useTopP = true;
            $scope.llmEdit.otheragent.topP = llm.topP;
        }

        $scope.llmEdit.otheragent.maxTokens = llm.maxTokens;
        $scope.llmEdit.otheragent.apiKey = llm.apiKey;
        $scope.llmEdit.otheragent.toolCalling = llm.sstc;
        $scope.llmEdit.otheragent.pfc = llm.enableParallelToolCalling;

        document.getElementById("overlay-llm").classList.add("open");
        document.getElementById("bgOverlay").classList.add("active");
    };

    $scope.completeLLMEdit = function() {

        document.body.classList.remove("bodyscroll-fixed");

        var modelName = $scope.llmEdit.otheragent.modelName;
        var provider = $scope.llmEdit.otheragent.providerChoice;
        var name = $scope.llmEdit.otheragent.displayName;
        var description = $scope.llmEdit.otheragent.description || '';
        var baseUrl = $scope.llmEdit.otheragent.baseUrl;
        var useTemperature = $scope.llmEdit.otheragent.useTemperature;
        var temperature = $scope.llmEdit.otheragent.temperature;
        var useTopP = $scope.llmEdit.otheragent.useTopP;
        var topP = $scope.llmEdit.otheragent.topP;
        var maxTokensStr = $scope.llmEdit.otheragent.maxTokens;
        var apiKey = $scope.llmEdit.otheragent.apiKey;
        var sstc = $scope.llmEdit.otheragent.toolCalling;
        var enableParallelToolCalling = $scope.llmEdit.otheragent.pfc;

        if (!modelName) {
            swal({
                title: "Missing Model",
                text: "Please enter Model.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });

            return;
        }

        if (modelName.length > 99) {
            swal({
                title: "Name Too Long",
                text: "Try using a more concise name.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            return;
        }


        if (!provider) {
            return swal({title: "Missing Provider",
                text: "Please enter Provider.",
                type: "error",
                confirmButtonColor: "#f2533e" // Optional: customize button color
            })
        }

        if (!name) {
            swal({
                title: "Missing Model Name",
                text: "Please enter Model Name.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            return;
        }

        if (!baseUrl) {
            return swal({
                title: "Missing Base URL",
                text: "Please enter Base URL.",
                type: "error",
                confirmButtonColor: "#f2533e"
            })
        }

        if (maxTokensStr) {
            var maxTokens = parseInt(maxTokensStr);
            if (isNaN(maxTokens) || maxTokens < 1) return swal({ title: "Invalid Max Tokens", text: "Must be an integer >= 1.", type: "error", confirmButtonColor: "#f2533e"}), $scope.saveInProgress = false;
        }

        if (!apiKey) {
            return swal({  title: "Missing API Key",  text: "Please enter API Key.",  type: "error",  confirmButtonColor: "#f2533e"
            })
        }

        $scope.saveInProgress = true;

        let onSuccess = () => {
            $scope.$applyAsync();
            $scope.saveInProgress = false;
            document.getElementById("overlay-llm").classList.remove("open");
            document.getElementById("bgOverlay").classList.remove("active");
        };

        let onError = () => {
            swal({
                title: "Error",
                text: "Failed to save LLM.",
                type: "error",
                confirmButtonColor: "#f2533e"  // Optional: custom color
            });

            $scope.saveInProgress = false;
            $scope.$applyAsync();
        };

        //$scope.showVerifyModal();

        function saveLLM(LLMkey, name, provider, maxTokens, baseUrl, apiKey, modelName, temperature,
                         topP, enableParallelToolCalling, name, sstc, llmVerificationType) {

            const ppmInput = parseFloat(document.querySelector('#ppm_input')?.value || 0);
            const ppmOutput = parseFloat(document.querySelector('#ppm_output')?.value || 0);
            const currency = document.querySelector('#token_currency')?.value || 'INR';
            const pptInput = ppmInput / 1_000_000;
            const pptOutput = ppmOutput / 1_000_000;
            const properties = {
                ppm_input: ppmInput,
                ppm_output: ppmOutput,
                ppt_input: pptInput,
                ppt_output: pptOutput,
                currency: currency
            };

            SYNCLOOP_AI.LLM.upsertLLM(
                LLMkey, name, description, provider, maxTokens, baseUrl, apiKey, modelName, temperature,
                topP, enableParallelToolCalling, name, sstc, llmVerificationType, properties,
                function (resp) {
                    $scope.saveInProgress = false;
                    if (resp.status === "success") {
                        if ($scope.currentLLM) {
                            Object.assign($scope.currentLLM, {
                                modelName,
                                baseUrl,
                                apiKey,
                                temperature,
                                name,
                                description,
                                provider,
                                maxTokens,
                                enableParallelToolCalling,
                                topP,
                                displayName: name,
                                properties: properties
                            });
                        }
                        else {
                            $scope.spec.LLMs.push({
                                LLMkey: LLMkey,
                                modelName: modelName,
                                displayName: name,
                                provider: provider,
                                baseUrl: baseUrl,
                                apiKey: apiKey,
                                name: name,
                                description: description,
                                temperature: temperature,
                                topP: topP,
                                maxTokens: maxTokens,

                                enableParallelToolCalling: enableParallelToolCalling,
                                toolCalling: sstc,

                                properties: properties
                            });
                        }
                        $scope.swalSuccess(
                            `'${modelName}'\nSaved Successfully!`,
                            "You can now start using this model across your agents & AI apps."
                        );
                        onSuccess();
                        $scope.$applyAsync();
                    } else {
                        const errorMsg = resp.error?.message || resp.error || "Verification failed. Please check your API key or endpoint.";
                        $scope.showErrorModal(
                            errorMsg,
                            function onSaveAnyway() {
                                saveLLM(LLMkey, name, provider, maxTokens, baseUrl, apiKey, modelName,
                                    temperature, topP, enableParallelToolCalling, name, sstc, "NO_VERIFICATION");
                            },
                            function onCancel() { $scope.hideVerifyModal(); }
                        );
                        return;
                    }
                    $scope.$applyAsync();
                },
                onError
            );
        }

        if ($scope.currentLLM) {
            saveLLM($scope.currentLLM.LLMkey, name, provider, maxTokens, baseUrl, apiKey, modelName,
                useTemperature ? temperature : null,
                useTopP ? topP : null,
                enableParallelToolCalling,
                name, (null == sstc ? false: sstc), "VERIFICATION_FIRST");
        } else {
            let newLLM = {
                name, baseUrl, apiKey, temperature, modelName, provider, maxTokens,
                enableParallelToolCalling, topP, name, displayName: name,
                LLMkey: 'llm_' + Date.now()
            };

            saveLLM(newLLM.LLMkey, name, provider, maxTokens, baseUrl, apiKey, modelName,
                useTemperature ? temperature : null,
                useTopP ? topP : null,
                enableParallelToolCalling,
                name, (null == sstc ? false : sstc), "VERIFICATION_FIRST");

            /*SYNCLOOP_AI.LLM.upsertLLM(
                newLLM.LLMkey, modelName, provider, maxTokens, baseUrl, apiKey, name,
                useTemperature ? temperature : null,
                useTopP ? topP : null,
                enableParallelToolCalling,
                name, sstc, "VERIFICATION_FIRST",
                function (resp) {
                    $scope.saveInProgress = false;
                    if (resp.status === "success") {
                        $scope.spec.LLMs.push(newLLM);

                        $scope.swalSuccess(
                            `'${modelName}'\nSaved Successfully!`,
                            "You can now start using this model across your agents & AI apps."
                        );

                        onSuccess();
                    } else {
                        const errorMsg = resp.error?.message || resp.error || "Verification failed. Please check your API key or endpoint.";
                        $scope.showErrorModal(
                            errorMsg,
                            function onSaveAnyway() {
                                // mark false when saving anyway

                            },
                            function onCancel() { $scope.hideVerifyModal(); }
                        );
                        return;
                    }

                },
                onError
            );*/
        }
    };

    $scope.confirmDeleteLLM = function(llm) {
        swal({
            title: "Are you sure?",
            text: "Once you click 'Yes'. The '" + llm.modelName + "' LLM will be permanently deleted and cannot be recovered",
            imageUrl: "Awareness/pub/images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: true
        }, function() {
            SYNCLOOP_AI.LLM.deleteLLM(llm.LLMkey,
                function (response) {
                    var index = $scope.spec.LLMs.indexOf(llm);
                    if (index > -1) {
                        $scope.spec.LLMs.splice(index, 1);
                    }

                    if (!$scope.spec.LLMs || $scope.spec.LLMs.length === 0) {
                        $scope.connectllmenable = false;
                    }

                    $scope.$applyAsync();
                },
                function (xhr, status, error) {
                    var message = (xhr && xhr.responseJSON && xhr.responseJSON.error) || error || 'Could not delete LLM.';
                    console.error('Error deleting LLM:', message);
                    swal({
                        title: "Could not delete LLM",
                        text: message,
                        type: "error"
                    });
                }
            );
        });

        setTimeout(function () {
            const confirmBtn = document.querySelector('.confirm');
            const cancelBtn = document.querySelector('.cancel');

            if (confirmBtn) {
                confirmBtn.classList.add('custom-delete-btn');
                confirmBtn.addEventListener('click', removeCustomBtnClass);
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', removeCustomBtnClass);
            }

            function removeCustomBtnClass() {
                confirmBtn?.classList.remove('custom-delete-btn');
            }
        }, 0);
    };

    $scope.getLLMName = function(LLMkey) {
        var found = $scope.spec.LLMs.find(function(llm) {
            return llm.LLMkey === LLMkey;
        });
        return found ? found.modelName : "N/A";
    };

    $scope.getCurrentAgentTokenUsage = function() {
        var fallback = {
            input: 0,
            output: 0,
            total: 0,
            ppt_input: 0,
            ppt_output: 0,
            amount: "0",
            currency: "USD"
        };

        var current = $scope.currentAgent || $scope.activeAgent;
        if (!current) {
            return fallback;
        }

        var source = current;
        if (current.identifier && Array.isArray($scope.spec && $scope.spec.Agents)) {
            var latest = $scope.spec.Agents.find(function(agent) {
                return agent && agent.identifier === current.identifier;
            });
            if (latest) {
                source = latest;
            }
        }

        var usage = source && source.tokenUsage;
        if (!usage) {
            return fallback;
        }

        return {
            input: usage.input || 0,
            output: usage.output || 0,
            total: usage.total || 0,
            ppt_input: usage.ppt_input || 0,
            ppt_output: usage.ppt_output || 0,
            amount: usage.amount || "0",
            currency: usage.currency || "USD"
        };
    };

    $scope.showEmbeddingOverlay = false;
    $scope.embeddingProviderChosen = false;

    $scope.openEmbeddingAdd = function () {
        $scope.embeddingProviderChosen = false;
        $scope.embeddingEdit = {
            emProviderType: 'EXTERNAL',
            emStoreType: null,

            modelName: null,
            displayName: null,

            provider: null,
            baseUrl: '',
            apiKey: '',
            dimensions: null,

            properties: {
                ppm_input: null,
                ppm_output: null,
                currency: null
            },

            // IMPORTANT: no defaults
            qdrant: {
                host: '',
                port: null,
                tls: false,
                api_key: ''
            }
        };

        $scope.showEmbeddingOverlay = true;
        document.getElementById("overlay-embedding").classList.add("open");
        document.getElementById("bgOverlayEmbedding").classList.add("active");
        document.body.classList.add("bodyscroll-fixed");
    };

    $scope.openEmbeddingEdit = function (em) {
        $scope.embeddingProviderChosen = true;
        $scope.embeddingEdit = angular.copy(em);
        $scope.embeddingEdit.properties = em.properties || {};
        $scope.embeddingPopUpHeading = "Edit Embedding Model";

        $scope.showEmbeddingOverlay = true;
        document.getElementById("overlay-embedding").classList.add("open");
        document.getElementById("bgOverlayEmbedding").classList.add("active");
        document.body.classList.add("bodyscroll-fixed");
    };

    $scope.closeEmbeddingOverlay = function () {
        $scope.showEmbeddingOverlay = false;
        document.getElementById("overlay-embedding").classList.remove("open");
        document.getElementById("bgOverlayEmbedding").classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");
        $scope.embeddingProviderChosen = false;
    };

    $scope.saveEmbeddingModel = function (form) {

        if (!$scope.embeddingEdit?.modelName) {
            swal({ title: "Missing Model", text: "Please select a Model Name.", type: "error", confirmButtonColor: "#f2533e" });
            return;
        }

        if (!$scope.embeddingEdit?.emStoreType) {
            swal({ title: "Missing Store", text: "Please select an EM Store.", type: "error", confirmButtonColor: "#f2533e" });
            return;
        }

        if (form.$invalid) {
            form.$setSubmitted();
            return;
        }

        const em = $scope.embeddingEdit || {};
        const isInBuilt = em.emProviderType === 'INBUILT';

        const ppmInput  = parseFloat(em.properties?.ppm_input || 0);
        const ppmOutput = parseFloat(em.properties?.ppm_output || 0);
        const currency  = em.properties?.currency || 'INR';

        const pptInput  = ppmInput  / 1_000_000;
        const pptOutput = ppmOutput / 1_000_000;

        const properties = {
            ppm_input: ppmInput,
            ppm_output: ppmOutput,
            ppt_input: pptInput,
            ppt_output: pptOutput,
            currency: currency
        };

        if (em.emStoreType) {
            Object.assign(properties, {
                store_name: em.emStoreType,
                host: em.store?.host,
                port: em.store?.port,
                tls: !!em.store?.tls,
                api_key: em.store?.api_key
            });
        }

        const payload = {
            modelName: em.modelName,
            displayName: em.displayName,
            dimensions: parseInt(em.dimensions || 0),

            provider: isInBuilt ? "local" : em.provider,
            baseUrl:  isInBuilt ? "" : em.baseUrl,
            apiKey:   isInBuilt ? "" : em.apiKey,

            verifyFirst: true,
            llmVerificationType: "NO_VERIFICATION",
            properties
        };

        if (em.EMkey) {
            payload.EMkey = em.EMkey;
        } else {
            payload.EMkey = generateUUID();
        }

        $http.post(
            window.ENV.API_BASE_URL +
            "/tenant/" + localStorage.getItem("tenant") +
            "/packages.Awareness.dashboard.services.api.createEM.main",
            payload,
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                    "Content-Type": "application/json"
                }
            }
        ).then(function (res) {

            if (res.data.status === "success") {
                SYNCLOOP_AI.CORE.initialize();
                const isEdit = !!em.EMkey;
                if (isEdit) {

                    const idx = $scope.spec.EMBEDDING_MODELs
                        .findIndex(x => x.EMkey === em.EMkey);

                    if (idx !== -1) {
                        $scope.spec.EMBEDDING_MODELs[idx] = angular.copy(payload);
                    }

                } else {

                    $scope.spec.EMBEDDING_MODELs.push(angular.copy(payload));

                }
                swal({
                    title: "Success",
                    text: "Embedding model saved successfully",
                    type: "success",
                    confirmButtonColor: "#2C61F5"
                });
                $scope.closeEmbeddingOverlay();

            } else {

                swal({
                    title: "Error",
                    text: res.data.message || "Failed to save embedding",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });

            }

        }).catch(function (err) {
            swal("Error", err?.statusText || "Request failed", "error");
        });
    };


    $scope.confirmDeleteEmbedding = function (em) {
        swal({
            title: "Delete Embedding?",
            text: "This action cannot be undone",
            imageUrl: "Awareness/pub/images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Delete",
            closeOnConfirm: false
        }, function (confirmed) {
            if (confirmed) {
                deleteEmbedding(em);
            }
        });
    };

    $scope.embeddingEdit = $scope.embeddingEdit || {};

    $scope.embeddingEdit.properties = $scope.embeddingEdit.properties || {
        ppm_input: 0,
        ppm_output: 0,
        currency: "USD"
    };

    $scope.embeddingEdit.store = $scope.embeddingEdit.store || {
        host: "",
        port: "",
        tls: false,
        api_key: ""
    };

    function deleteEmbedding(em) {
        $http.delete(
            window.ENV.API_BASE_URL +
            "/tenant/" + localStorage.getItem("tenant") +
            "/packages.Awareness.dashboard.services.api.deleteEM.main",
            {
                params: { EMKey: em.EMkey },
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("AuthToken")
                }
            }
        ).then(function () {

            $scope.spec.EMBEDDING_MODELs =
                $scope.spec.EMBEDDING_MODELs.filter(x => x.EMkey !== em.EMkey);

            swal({
                title: "Deleted",
                text: "Embedding model removed",
                type: "success",
                confirmButtonColor: "#2C61F5"
            });
        }).catch(function (err) {
            swal("Error", err?.statusText || "Delete failed", "error");
        });

    }

    $scope.quickSelectEmbeddingProvider = function(provider){

        $scope.embeddingProviderChosen = true;

        if(provider === 'OTHER'){
            $scope.emActiveProvider = 'other';
            return;
        }

        const providerLower = provider.toLowerCase();

        $scope.emActiveProvider = providerLower;
        $scope.embeddingEdit.provider = provider;

    };

    $scope.embeddingCompanies = [];
    $scope.embeddingProvidersMap = {};
    $scope.embeddingStores = [];
    $scope.embeddingSelectedModel = {};

    const requestBody = {
        method: 'GET',
        url: "https://cdn.syncloop.com/available_embedding_models.json"
    };

    $http.post(
        window.ENV.API_BASE_URL +
        "/tenant/" + localStorage.getItem("tenant") +
        "/packages.middleware.pub.client.http.requestAPI.main",
        requestBody,
        {
            headers:{
                "Authorization":"Bearer " + localStorage.getItem("AuthToken"),
                "Content-Type":"application/json"
            }
        }
    )
        .then(function(resp){
            resp.data = JSON.parse(resp.data.respPayload);
            if(!resp.data || !resp.data.response) return;

            const providers = resp.data.response.embedding_models || [];
            $scope.embeddingCompanies = providers.map(function(p){
                return {
                    company_name: p.company_name,
                    logo_icon: p.logo_icon,
                    api_base_endpoint: p.api_base_endpoint,
                    raw: p
                };
            });

            providers.forEach(function(p){
                $scope.embeddingProvidersMap[p.company_name] = p.models || [];
            });

            $scope.embeddingStores = (resp.data.response.embedding_store || []).map(function(s){
                return s.company_slug;
            });

            $scope.embeddingEdit.modelName = null;
            $scope.embeddingEdit.emStoreType = null;
        })
        .catch(function(err){
            console.error('Failed to fetch embedding models', err);
        });

    $scope.onEmbeddingModelSelect = function(providerKey, modelName) {
        if (!providerKey || !modelName) return;

        var providerKeyExact = Object.keys($scope.embeddingProvidersMap || {}).find(function(k){
            return (k || '').toLowerCase() === (providerKey || '').toLowerCase();
        }) || providerKey;

        var models = $scope.embeddingProvidersMap[providerKeyExact] || [];
        var m = models.find(function(x){ return x.model_name === modelName; });
        if (!m) return;

        $scope.embeddingEdit.modelName = m.model_name || '';
        $scope.embeddingEdit.displayName = m.pretty_name || m.model_name || m.description || $scope.embeddingEdit.displayName || '';
        $scope.embeddingEdit.baseUrl = m.base_url || ($scope.embeddingCompanies.find(function(c){ return (c.company_name||'').toLowerCase() === (providerKeyExact||'').toLowerCase(); }) || {}).api_base_endpoint || $scope.embeddingEdit.baseUrl || '';
        $scope.embeddingEdit.dimensions = m.dimensions || $scope.embeddingEdit.dimensions || null;

        $scope.embeddingEdit.properties = $scope.embeddingEdit.properties || {};
        if (m.pricing) {
            $scope.embeddingEdit.properties.ppm_input  = typeof m.pricing.input_price === 'number' ? m.pricing.input_price : ($scope.embeddingEdit.properties.ppm_input || 0);
            $scope.embeddingEdit.properties.ppm_output = typeof m.pricing.output_price === 'number' ? m.pricing.output_price : ($scope.embeddingEdit.properties.ppm_output || 0);
            $scope.embeddingEdit.properties.currency   = m.pricing.currency || $scope.embeddingEdit.properties.currency || 'USD';
        } else if (m.properties) {
            $scope.embeddingEdit.properties.ppm_input  = typeof m.properties.ppm_input === 'number' ? m.properties.ppm_input : ($scope.embeddingEdit.properties.ppm_input || 0);
            $scope.embeddingEdit.properties.ppm_output = typeof m.properties.ppm_output === 'number' ? m.properties.ppm_output : ($scope.embeddingEdit.properties.ppm_output || 0);
            $scope.embeddingEdit.properties.currency   = m.properties.currency || $scope.embeddingEdit.properties.currency || 'USD';
        }

        $scope.embeddingSelectedModel[(providerKeyExact || '').toLowerCase()] = m;
    };

    $scope.selectEmbeddingProvider = function(provider){
        $scope.embeddingEdit.provider = provider;
        $scope.embeddingEdit.modelName = '';
        $scope.embeddingEdit.displayName = '';
        $scope.embeddingEdit.baseUrl = '';
        $scope.embeddingEdit.dimensions = null;
    };

    $scope.emActiveProvider = 'openai';

    $scope.selectEMProvider = function(provider){

        if ($scope.isUIBusy && $scope.isUIBusy()) return;

        provider = (provider || '').toLowerCase();

        $scope.emActiveProvider = provider;

        $scope.embeddingEdit = {
            emProviderType: 'EXTERNAL',
            provider: null,
            modelName: null,
            displayName: '',
            baseUrl: '',
            apiKey: '',
            dimensions: null,

            properties: {
                ppm_input: null,
                ppm_output: null,
                currency: null
            },

            emStoreType: null,

            store: {
                host: '',
                port: null,
                tls: false,
                api_key: ''
            }
        };

        if(provider !== 'other'){

            const match = $scope.embeddingCompanies.find(function(c){
                return (c.company_name || '').toLowerCase() === provider;
            });

            if(match){
                $scope.embeddingEdit.provider = match.company_name;
            }

        }

        $scope.embeddingSelectedModel = {};

    };

    // Agent functions
    $scope.addAgent = function() {
        if ($scope.spec.LLMs.length === 0) {
            swal({
                title: "Warning !!",
                text: "Please create at least one LLM before adding an Agent.",
                type: "warning",
                confirmButtonColor: "#f2533e" // Optional: orange warning color
            });

            return;
        }
        var newAgent = {
            LLMkey: $scope.spec.LLMs[0].LLMkey,
            identifier: generateUUID(),
            name: "",
            tn: "",
            title: "",
            appId: $scope.appId,
            roleDescription: "",
            editing: true,
            expanded: false,
            roleDescriptionDecoded: ""
        };
        $scope.spec.Agents.push(newAgent);
    };
    $scope.editAgent = function(agent) {
        agent.editing = true;
        agent.roleDescriptionDecoded = $scope.decodeBase64(agent.roleDescription);
    };

    $scope.addAgentInTeam = function (identifier, teamID) {

        SYNCLOOP_AI.TEAMS.addAgentInTeam(teamID, identifier,
            function (response) {
                for (let i = 0; i < $scope.spec.Teams.length; i++) {
                    $scope.spec.Teams[i].Agents = $scope.spec.Teams[i].Agents.filter(function(agent) {
                        return agent.identifier !== identifier;
                    });
                }

                for (let i = 0; i < $scope.spec.Teams.length; i++) {
                    if ($scope.spec.Teams[i].teamID == teamID) {
                        $scope.spec.Teams[i].Agents.push({identifier: identifier, name: "TT"});
                        break;
                    }
                }

                $scope.$applyAsync();
            },
            function (xhr, status, error) {});
    };


    $scope.completeAgentEdit = function () {
        $scope.saveInProgress = true;
        document.body.classList.remove("bodyscroll-fixed");

        setTimeout(() => {
            const agentId = $("#agent_edit_id").val().trim();
            const agentName = $("#agent_edit_name").val().trim();
            const agentTitle = $("#agent_edit_title").val().trim();
            const agentLLM = $("#agent_edit_llm").val();
            const agentTeamId = $("#agent_edit_teams").val();
            const agentDescription = $("#agent_edit_description").val().trim();
            const selectedToolValues = $("#agent_edit_tools").val() || [];

            if (agentName === "") {
                swal({
                    title: "Missing Name",
                    text: "Please enter an Agent Name.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (agentName.length > 99) {
                swal({
                    title: "Name Too Long",
                    text: "Try using a more concise name.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (agentTitle === "") {
                swal({
                    title: "Missing Title",
                    text: "Please enter an Agent Title.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });

                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (!agentLLM || agentLLM === "") {
                swal({
                    title: "Missing LLM",
                    text: "Please select an LLM.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });

                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (agentDescription === "") {
                swal({
                    title: "Missing Description",
                    text: "Please enter the description.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });

                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (!agentTeamId || agentTeamId === "") {
                // swal("Missing Team", "Please select a Team.", "error");
                // $scope.saveInProgress = false;
                // $scope.$applyAsync();
                // return;
            }

            if (!selectedToolValues || selectedToolValues.length === 0) {
                // swal("Missing Tools", "Please select at least one Tool.", "error");
                // $scope.saveInProgress = false;
                // $scope.$applyAsync();
                // return;
            }

            let appId = $scope.appId;
            if (appId == null) {
                for (let i = 0; i < $scope.spec.Teams.length; i++) {
                    if ($scope.spec.Teams[i].teamID == agentTeamId) {
                        appId = $scope.spec.Teams[i].appId;
                        break;
                    }
                }
            }

            if (agentId === "") {
                const newAgentId = generateUUID();

                const newAgent = {
                    LLMkey: agentLLM,
                    identifier: newAgentId,
                    name: agentName,
                    appId: appId,
                    tn: "",
                    title: agentTitle,
                    roleDescription: $scope.encodeBase64(agentDescription),
                    editing: false,
                    expanded: false,
                    roleDescriptionDecoded: agentDescription
                };

                const icon = (agent?.icon || $scope.agentForm?.icon || 'Awareness/pub/images/robot-icon.svg');

                SYNCLOOP_AI.AGENTS.upsertAgent(newAgentId, agentTitle, agentName, agentDescription, agentLLM, icon, false,
                    {
                        teamID: agentTeamId || "",
                        manageTeamAssignment: true
                    },
                    function (response) {
                        $scope.spec.Agents.push(newAgent);
                        newAgent.teamID = agentTeamId || "";
                        $scope.saveInProgress = false;

                        document.getElementById("overlay-agent").classList.remove("open");
                        document.getElementById("bgOverlayAgent").classList.remove("active");

                        $scope.reloadTree();
                        $scope.$applyAsync();
                    },
                    function () {
                        swal({
                            title: "Error",
                            text: "Failed to create Agent. Please try again.",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });

                        $scope.saveInProgress = false;
                        $scope.$applyAsync();
                    }
                );

                return;
            }

            for (let i = 0; i < $scope.spec.Agents.length; i++) {
                const agent = $scope.spec.Agents[i];
                if (agentId === agent.identifier) {
                    agent.name = agentName;
                    agent.title = agentTitle;
                    agent.LLMkey = agentLLM;
                    agent.teamID = agentTeamId;
                    agent.appId = appId;
                    agent.roleDescription = $scope.encodeBase64(agentDescription);
                    agent.roleDescriptionDecoded = agentDescription;
                    const icon = (agent?.icon || $scope.agentForm?.icon || 'Awareness/pub/images/robot-icon.svg');

                    SYNCLOOP_AI.AGENTS.upsertAgent(agentId, agentTitle, agentName, agentDescription, agentLLM, icon, false,
                        {
                            teamID: agentTeamId || "",
                            manageTeamAssignment: true
                        },
                        function (response) {
                            $scope.saveInProgress = false;

                            document.getElementById("overlay-agent").classList.remove("open");
                            document.getElementById("bgOverlayAgent").classList.remove("active");

                            $scope.$applyAsync();

                            $scope.reloadTree();
                        },
                        function () {
                            swal({
                                title: "Error",
                                text: "Failed to update Agent. Please try again.",
                                type: "error",
                                confirmButtonColor: "#f2533e"
                            });

                            $scope.saveInProgress = false;
                            $scope.$applyAsync();
                        }
                    );

                    break;
                }
            }
        }, 0);
    };

    $scope.getAgentTools = function(Agent) {
        let tools = [];
        for (let i = 0 ; i < $scope.spec.Tools.length ; i++) {
            if (Agent.identifier == $scope.spec.Tools[i].identifier) {
                tools.push($scope.spec.Tools[i].fqn);
            }
        }

        return tools;
    }

    $scope.getAgentApiPrefix = function () {
        return $("#agent-public-switch").prop("checked") ? "/public" : "";
    };

    $scope.isAgentSetAsPublic = function () {
        return $("#agent-public-switch").prop("checked") ? true : false;
    };

    $scope.openAgentAdd = function () {
        $scope.agentPopUpHeading = 'Add Agent';
        document.getElementById("overlay-agent").classList.add("open");
        document.getElementById("bgOverlayAgent").classList.add("active");
        document.body.classList.add("bodyscroll-fixed");

        $("#agent_edit_name").val("");
        $("#agent_edit_title").val("");

        $("#agent_edit_llm").html("");
        for (let i = 0 ; i < $scope.spec.LLMs.length ; i++) {
            $("#agent_edit_llm").append("<option value='" + $scope.spec.LLMs[i].LLMkey + "'>" + $scope.spec.LLMs[i].modelName + "</option>");
        }
        $timeout(function () {
            $('#teams_edit_agents').select2({
                placeholder: "Select Agents",
                allowClear: true,
                width: '100%'
            });
        }, 0);
        $("#agent_edit_teams").html("");
        for (let i = 0 ; i < $scope.spec.Teams.length ; i++) {
            $("#agent_edit_teams").append("<option value='" + $scope.spec.Teams[i].teamID + "'>" + $scope.spec.Teams[i].teamName + "</option>");
        }

        $("#agent_edit_tools").html("");
        const delimiter = "::";
        for (let i = 0 ; i < $scope.spec.Tools.length ; i++) {
            $("#agent_edit_tools").append(new Option($scope.spec.Tools[i].fqn,
                $scope.spec.Tools[i].identifier + delimiter + $scope.spec.Tools[i].fqn, false, false));
        }

        $("#agent_edit_llm").val("");
        $("#agent_edit_description").val("");
        $("#agent_edit_id").val("");

        $("#agent_edit_tools").select2({
            placeholder: "Select tools",
            width: '100%',
            allowClear: true
        });

        setTimeout(function () {
            $("#agent_edit_teams").select2({
                placeholder: "Select Team",
                width: "100%"
            }).val("").trigger('change');

            $("#agent_edit_llm").select2({
                placeholder: "Select LLM",
                width: "100%"
            }).val("").trigger('change');

        }, 0);
    }

    $scope.configureTeam = function (team) {
        $scope.configureTeamHeading = 'Configuration Team';
        $scope.currentTeam = team;
        document.getElementById("overlay-teamconfigration").classList.add("open");
        document.getElementById("bgOverlayteamconfigration").classList.add("active");
        document.body.classList.add("bodyscroll-fixed");

    }


    $scope.openAgentEdit = function (agent) {
        $scope.activeAgent = agent;
        $scope.agentForm = $scope.activeAgent;
        $scope.agentPopUpHeading = 'Edit Agent';
        document.getElementById("overlay-agent").classList.add("open");
        document.getElementById("bgOverlayAgent").classList.add("active");
        document.body.classList.add("bodyscroll-fixed");
        //agent.editing = true;
        agent.roleDescriptionDecoded = $scope.decodeBase64(agent.roleDescription);
        $("#agent_edit_name").val(agent.name);
        $("#agent_edit_title").val(agent.title);
        $("#agent_edit_llm").html("");
        for (let i = 0 ; i < $scope.spec.LLMs.length ; i++) {
            $("#agent_edit_llm").append("<option value='" + $scope.spec.LLMs[i].LLMkey + "'>" + $scope.spec.LLMs[i].modelName + "</option>");
        }

        $("#agent_edit_teams").html("");
        for (let i = 0 ; i < $scope.spec.Teams.length ; i++) {
            $("#agent_edit_teams").append("<option value='" + $scope.spec.Teams[i].teamID + "'>" + $scope.spec.Teams[i].teamName + "</option>");
        }

        $("#agent_edit_teams").select2({
            placeholder: "Select Team",
            width: "100%",
            allowClear: true
        });

        let teams = $scope.getAgentTeams(agent);

        if (teams.length > 0) {
            $("#agent_edit_teams").val([teams[0].teamID]).trigger("change");
        }

        $("#agent_edit_tools").html("");
        const delimiter = "::";
        for (let i = 0; i < $scope.spec.Tools.length; i++) {
            const tool = $scope.spec.Tools[i];
            const optionValue = tool.identifier + delimiter + tool.fqn;
            $("#agent_edit_tools").append(new Option(tool.fqn, optionValue, false, false));
        }

        let preselected = [];
        for (let i = 0 ; i < $scope.spec.Tools.length ; i++) {
            if (agent.identifier == $scope.spec.Tools[i].identifier) {
                preselected.push($scope.spec.Tools[i].identifier + "::" + $scope.spec.Tools[i].fqn);
            }
        }
        $("#agent_edit_tools").val(preselected).trigger("change");

        $("#agent_edit_llm").val(agent.LLMkey);
        $("#agent_edit_description").val($scope.decodeBase64(agent.roleDescription));
        $("#agent_edit_id").val(agent.identifier);

        $("#agent_edit_tools").select2({
            placeholder: "Select tools",
            width: '100%',
            allowClear: true
        });
    }

    $scope.doneEditAgent = function(agent) {
        agent.roleDescription = $scope.encodeBase64(agent.roleDescriptionDecoded || "");
        agent.editing = false;
    };
    $scope.cancelEditAgent = function(agent) {
        if (!agent.name) {
            var index = $scope.spec.Agents.indexOf(agent);
            $scope.spec.Agents.splice(index, 1);
        } else {
            agent.editing = false;
        }
    };

    $scope.deleteAgent = function(agent) {
        const teamsUsingAgent = $scope.getAgentTeams(agent);
        if (teamsUsingAgent.length > 0) {
            const teamNames = teamsUsingAgent.map(t => t.teamName).join(', ');
            swal({
                title: "Cannot delete agent",
                text: `'${agent.name}' is currently used in team(s): '${teamNames}'. Please remove the agent from these teams first.`,
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            return;
        }

        swal({
            title: "Are you sure?",
            text: "Once you click 'Yes'. The '" + agent.name + "' will be permanently deleted and cannot be recovered",
            imageUrl: "Awareness/pub/images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
        }, function () {

            $scope.closeConnectLLMModal();

            swal({
                title: "Deleting...",
                text: "Please wait while we delete this agent and its tools.",
                imageUrl: "Awareness/pub/images/delete_exclamation.svg",
                confirmButtonColor: "#f2533e",
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            SYNCLOOP_AI.AGENTS.deleteAgent(agent.identifier, function () {

                const toolsToDelete = $scope.spec.Tools.filter(t =>
                    t.identifier === agent.identifier &&
                    t.fqn === "packages.Awareness.assistant.tools.currentTime"
                );

                let pending = toolsToDelete.length, failed = 0;

                function finishCascade() {
                    const idx = $scope.spec.Agents.indexOf(agent);
                    if (idx !== -1) $scope.spec.Agents.splice(idx, 1);

                    $scope.spec.Teams.forEach(team => {
                        team.Agents = team.Agents.filter(a => a.identifier !== agent.identifier);
                    });

                    if ($scope.currentAgent && $scope.currentAgent.identifier === agent.identifier) {
                        $scope.closeAgentBox();
                    }

                    $scope.$applyAsync();
                    swal({
                        title: "Deleted",
                        text: failed ? `Agent deleted. ${failed} tool(s) failed to delete on server.` : "Agent deleted successfully!",
                        type: failed ? "warning" : "success",
                        confirmButtonColor: failed ? "#f0ad4e" : "#2C61F5"
                    });
                    $scope.reloadTree();
                }

                if (pending === 0) {
                    finishCascade();
                } else {
                    toolsToDelete.forEach(tool => {
                        SYNCLOOP_AI.TOOLS.deleteTool(tool.identifier, tool.fqn, function () {
                            const i = $scope.spec.Tools.indexOf(tool);
                            if (i !== -1) $scope.spec.Tools.splice(i, 1);
                            if (--pending === 0) finishCascade();
                            $scope.$applyAsync();
                        }, function () {
                            failed++;
                            if (--pending === 0) finishCascade();
                        });
                    });
                }

            }, function () {
                swal({
                    title: "Error",
                    text: "Failed to delete agent. Please try again.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
            });
        });

        setTimeout(function () {
            const confirmBtn = document.querySelector('.confirm');
            const cancelBtn = document.querySelector('.cancel');

            if (confirmBtn) {
                confirmBtn.classList.add('custom-delete-btn');
                confirmBtn.addEventListener('click', removeCustomBtnClass);
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', removeCustomBtnClass);
            }

            function removeCustomBtnClass() {
                confirmBtn?.classList.remove('custom-delete-btn');
            }
        }, 0);
    };

    // Allow only one agent to be expanded at a time, with details immediately below the agent row
    $scope.toggleAgent = function(agent) {
        if (agent.expanded) {
            agent.expanded = false;
        } else {
            $scope.spec.Agents.forEach(function(a) {
                a.expanded = false;
            });
            agent.expanded = true;
        }
    };

    $scope.getToolAgent = function (tool) {
        for (let i = 0 ; i < $scope.spec.Agents.length ; i++) {
            if (tool.identifier == $scope.spec.Agents[i].identifier) {
                return $scope.spec.Agents[i].name;
            }
        }
        return "Unknown";
    }

    $scope.getAgent = function (agentId) {
        for (let i = 0 ; i < $scope.spec.Agents.length ; i++) {
            if (agentId == $scope.spec.Agents[i].identifier) {
                return $scope.spec.Agents[i];
            }
        }
        return null;
    }

    $scope.addPayloadEdit = function(tool) {
        $scope.isEditingRegistry = false;
        $("#tool_edit_payload_id").val(tool.identifier + "-" + tool.fqn);
        $("#tool_edit_payload_description").val($scope.decodeBase64(tool.staticJsonPayload));
        $("#addUpdatePayloadModel").modal('show');
    };

    $scope.completePayloadEdit = function() {
        const payloadText = $("#tool_edit_payload_description").val();


        try {
            JSON.parse(payloadText);
        } catch (err) {
            swal({  title: "Invalid JSON",  text: "The payload must be valid JSON.",  type: "error",  confirmButtonColor: "#f2533e"
            });
            return;
        }

        for (let i = 0; i < $scope.spec.Tools.length; i++) {
            if ($("#tool_edit_payload_id").val() === $scope.spec.Tools[i].identifier + "-" + $scope.spec.Tools[i].fqn) {
                $scope.spec.Tools[i].staticJsonPayload = $scope.encodeBase64(payloadText);

                SYNCLOOP_AI.TOOLS.upsertTool(
                    $scope.spec.Tools[i].identifier,
                    $scope.spec.Tools[i].fqn,
                    payloadText,
                    $scope.decodeBase64($scope.spec.Tools[i].inputJSONSchema),
                    $scope.decodeBase64($scope.spec.Tools[i].functionDescription),
                    function (response) {
                        $scope.spec.Tools.push(newTool);
                        $scope.$applyAsync();
                    }, function (xhr, status, error) {

                    });

                break;
            }
        }

        $("#tool_edit_payload_id").val("");
        $("#tool_edit_payload_description").val("");
        $("#addUpdatePayloadModel").modal('hide');
    };

    $scope.addSchemaEdit = function(tool) {
        $scope.isEditingRegistry = false;
        $("#tool_edit_schema_id").val(tool.identifier + "-" + tool.fqn);
        $("#tool_edit_schema_description").val($scope.decodeBase64(tool.inputJSONSchema));
        $("#addUpdateSchemaModel").modal('show');
    };
    $scope.showAgentBox = false;
    $scope.showNAppls   = true;
    $scope.kbToAttachId = null;
    $scope.activeAgent  = null;
    $scope.currentAgent = null;
    let saveTimer = null;

    $scope.isSaving = false;
    $scope.didSave  = false;
    $scope.notSaved = false;

    $scope.startSaving = function () {
        $scope.isSaving = true;
        $scope.didSave  = false;
        $scope.notSaved = false;
        $scope.$applyAsync();
    };

    $scope.finishSaving = function (durationMs = 2000) {
        $scope.isSaving = false;
        $scope.didSave  = true;
        $scope.notSaved = false;
        $scope.$applyAsync();

        $timeout(() => {
            $scope.didSave = false;
            $scope.$applyAsync();
        }, durationMs);
    };

    $scope.resetSaveStatus = function () {
        $scope.isSaving = false;
        $scope.didSave  = false;
        $scope.notSaved = true;
        $scope.$applyAsync();
    };

    function safeAtob(s){ try { return atob(s || ''); } catch(e){ return ''; } }
    function safeBtoa(s){ try { return btoa(s || ''); } catch(e){ return ''; } }
    $scope.decodeBase64 = safeAtob;
    $scope.encodeBase64 = safeBtoa;

    $scope.utf8Base64Encode = function(str) {
        if (str == null) return "";
        try {
            if (typeof TextEncoder !== 'undefined') {
                const bytes = new TextEncoder().encode(String(str));
                let binary = "";
                bytes.forEach(b => binary += String.fromCharCode(b));
                return btoa(binary);
            }
            return btoa(unescape(encodeURIComponent(String(str))));
        } catch (e) {
            console.warn("utf8Base64Encode failed:", e);
            return "";
        }
    };

    $scope.utf8Base64Decode = function(str) {
        if (!str) return "";
        try {
            if (typeof TextDecoder !== 'undefined') {
                const binary = atob(String(str));
                const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
                return new TextDecoder("utf-8").decode(bytes);
            }
            return decodeURIComponent(escape(atob(String(str))));
        } catch (e) {
            console.warn("utf8Base64Decode failed:", e, "Input:", str);
            return "";
        }
    };

    $scope.encodeUtf8ToBase64 = $scope.utf8Base64Encode;
    $scope.decodeBase64ToUtf8 = $scope.utf8Base64Decode;

    $scope.kbId = function (kb) {
        return (kb && (kb.ragID || kb.kbID || kb.name || kb.path)) || '';
    };

    $scope.getAgentKBsFor = function (agent) {
        var kbs = ($scope.spec && $scope.spec.KBs) || [];
        if (!agent || !agent.identifier) return [];
        return kbs.filter(function (kb) { return kb.identifier === agent.identifier; });
    };

    $scope.getUnattachedKBs = function (agent) {
        var kbs = ($scope.spec && $scope.spec.KBs) || [];
        if (!agent || !agent.identifier) return kbs;
        return kbs.filter(function (kb) { return !kb.identifier || kb.identifier !== agent.identifier; });
    };

    $scope.attachKBToAgent = function (agent, kbIdValue) {
        if (!agent || !agent.identifier || !kbIdValue) return;
        var kb = (($scope.spec && $scope.spec.KBs) || []).find(function (k) {
            return $scope.kbId(k) === kbIdValue;
        });
        if (!kb) return;
        kb.identifier = agent.identifier;
        $scope.kbToAttachId = '';
        if ($scope.queueAgentAutosave) $scope.queueAgentAutosave();
    };

    $scope.detachKBFromAgent = function (agent, kb) {
        if (!kb) return;
        if (kb.identifier === (agent && agent.identifier)) {
            kb.identifier = null;
            if ($scope.queueAgentAutosave) $scope.queueAgentAutosave();
        }
    };

    $scope.agentForm = {
        name: '',
        title: '',
        instructions: '',
        guardrails: '',
        tone: '',
        llmKey: '',
        selectedToolIds: [],
        selectedKBIds: []
    };

    $scope.agentForm = $scope.agentForm || { name: '', title: '', instructions: '', llmKey: '', icon: '' };
    $scope.showWelcomeBubble = false;   // we'll use a real chat bubble instead
    $scope.isNewAgent = false;

    function resetChatState() {
        $scope.chatHistory = [];
        $scope.conversationID = null;
        $scope.newChatMessage = "";
        $scope.chatHistoryLoading = false;
        $scope.chatWaitVisible = false;
    }

    $scope.isMyLLMVerified = function() {
        if (!$scope.spec || !$scope.spec.LLMs || !$scope.activeAgent || !$scope.activeAgent.LLMkey) {
            return false;
        }

        var found = $scope.spec.LLMs.find(function(llm) {
            return llm && llm.LLMkey === $scope.activeAgent.LLMkey;
        });

        return !!(found && found.is_verified === true);
    };

    $scope.trimToolName = function (s) {
        if (!s) return '';
        var i = s.lastIndexOf('.');
        return i > -1 ? s.slice(i + 1) : s;
    };

    $scope.likeMessage = function (msg) {
        msg.liked = true;
        msg.unliked = false;
        SYNCLOOP_AI.CONVERSATIONS.likeMessage(msg.uuid, function (resp) {
        }, function (xhr, status, error) {

        });
        $scope.$applyAsync();
    }

    $scope.unlikeMessage = function (msg) {
        msg.liked = false;
        msg.unliked = true;
        SYNCLOOP_AI.CONVERSATIONS.unlikeMessage(msg.uuid, function (resp) {
        }, function (xhr, status, error) {

        });
        $scope.$applyAsync();
    }

    $scope.agentsSubTab = $scope.agentsSubTab || 'all';
    $scope.openedFromByTeam = $scope.openedFromByTeam || false;
    $scope.openedFromMyAgents = $scope.openedFromMyAgents || false;
    $scope._loadingChatHistoryFor = null;

    $scope.openAgentBox = function (agent = null, isNew = false, opts = {}) {
        $scope.rightsideopened = true;
        $scope.rightPanelMode = 'chat';

        $scope.currentAgent = agent;
        $scope.activeAgent  = agent;

        $('.collapse.show').each(function () {
            $(this).collapse('hide');
        });

        opts = angular.isObject(opts) ? opts : {};
        const skipUrl = !!opts.skipUrl;
        const isOpenedFromAPP = !!opts.isOpenedFromAPP;
        $scope.openedFromByTeam = !!opts.openedFromByTeam;
        $scope.openedFromMyAgents = !!opts.openedFromMyAgents;

        // ===== NEW AGENT FLOW =====
        if (isNew || !agent) {
            const defaultName = "Default Agent";
            //TODO - Add BE support to take agent userId as input for creating new/importing agents
            const newAgent = {
                identifier: generateUUID(),
                name: defaultName,
                title: "",
                LLMkey: "",
                roleDescription: $scope.encodeBase64(""),
                isDraft: true,
                userId: $scope.currentUserId
            };

            $scope.spec.Agents = $scope.spec.Agents || [];
            $scope.spec.Agents.push(newAgent);

            $scope.currentAgent = newAgent;
            $scope.activeAgent  = newAgent;
            if (!skipUrl) {
                // setQueryParam("agent_id", ($scope.activeAgent || agent)?.identifier);
            }

            $scope.agentForm.name         = defaultName;
            $scope.agentForm.title        = "";
            $scope.agentForm.tone         = "";
            $scope.agentForm.guardrails   = "";
            $scope.agentForm.instructions = "";
            $scope.agentForm.icon = (agent && agent.icon) || 'Awareness/pub/images/robot-icon1.svg';
            $scope.agentForm.llmKey = ($scope.spec.LLMs && $scope.spec.LLMs.length > 0)
                ? $scope.spec.LLMs[0].LLMkey : "";

            if($scope.agentForm.llmKey !== ""){
                $scope.queueAgentAutosave(true);
            }

            $scope.recomputeLLMState();

            resetChatState();
            $scope.isNewAgent = true;
            $scope.showWelcomeBubble = false;
            $scope.Conversations        = [];

            const starterTipsHtml = `
                  <div>
                    <strong>Let’s get you started:</strong>
                    <ul style="margin:6px 0 0 18px;">
                      <li><b>Rename</b> this agent (left panel) — type a new name.</li>
                      <li><b>Select an LLM</b> in the “LLM” section.</li>
                      <li><b>Add Tools</b> (APIs/KBs) from the “Tools” &amp; “RAGs” sections.</li>
                      <li>Your changes are <b>auto-saved</b> as you type.</li>
                    </ul>
                    <div style="margin-top:8px;">When ready, send me a message below 👇</div>
                  </div>
                `;

            $scope.showWelcomeBubble = false;

            $scope.chatHistory.push({
                user: "Agent",
                alias: "Syncloop Assistant",
                text: $sce.trustAsHtml(starterTipsHtml),
                _welcome: true
            });
            scrollAgentChatToBottom({ smooth: true });

            $scope.showAgentBox = true;
            document.body.classList.add("bodyscroll-fixed");
            $('#sidebar-wrapper').addClass('minsidebar');

            $scope.wrapperService = WRAPPER_SERVICE_JSON;

            WRAPPER_SERVICE_JSON.latest.api[0].children[0].children[0].data.createList = [];

            WRAPPER_SERVICE_JSON.latest.api[0].children[0].children[0].data.createList.push({
                path: "*payload/agentID",
                value: newAgent.identifier,
                id: generateUUID(),
                typePath: 'document/string'
            });

            WRAPPER_SERVICE_JSON.latest.api[0].children[0].children[0].data.createList.push({
                path: "*payload/name",
                value: newAgent.name,
                id: generateUUID(),
                typePath: 'document/string'
            });

            if (!$scope.spec.LLMs || $scope.spec.LLMs.length === 0) {
                $scope.openConnectLLMModal();
            }

            $scope.currentChatAgent = agent;

            $('#sidebar-wrapper').addClass('minsidebar');
            $('#wrapper').removeClass('fullleft-width');

            $scope.TeamsConversations = [];

            /**
             * Calling Chat History
             */

            const historyUrl = "/chatHistory?agentID=" + newAgent.identifier;

            $http.get(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + historyUrl,
                {
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                        "Content-Type": "application/json"
                    }
                }).then(function (resp) {}, function (err) {

            });


            $scope.$applyAsync();

            return;
        }

        // ===== EXISTING AGENT FLOW =====
        $scope.currentChatAgent = agent;

        if (!skipUrl) {
            // setQueryParam("agent_id", ($scope.activeAgent || agent)?.identifier);
        }

        $scope.agentBoxBreadcrumb = 'Agents';

        if (isOpenedFromAPP) {
            let appName = (opts && opts.appName) || '';
            try {
                if (!appName && typeof $scope.getApp === 'function') {
                    const app = $scope.getApp();
                    if (app && app.appName) appName = app.appName;
                }
            } catch (e) {
            }

            if (!appName) appName = 'this app';

            if (isOpenedFromAPP) {
                $scope.agentBoxBreadcrumb = appName ;
            } else {
                $scope.agentBoxBreadcrumb = 'Agents';
            }
        }

        $scope.loadWrapperService();

        let description = $scope.utf8Base64Decode(agent.roleDescription || '') || '';
        let splittedDes = description.split(":::: Tone instructions are ::::");
        const instructions = splittedDes[0];

        splittedDes = splittedDes.length > 1 ? splittedDes[1].split(":::: Guardrails instructions are ::::") : [];
        let tone = splittedDes.length > 0 ? splittedDes[0] : '';
        let guardrails = splittedDes.length > 1 ? splittedDes[1] : '';

        if (agent.tone) tone = agent.tone;
        if (agent.guardrails) guardrails = agent.guardrails;

        $scope.agentForm.name           = (agent.name  || '').trim();
        $scope.agentForm.title          = (agent.title || '').trim();
        $scope.agentForm.instructions   = instructions || '';
        $scope.agentForm.guardrails     = guardrails || '';
        $scope.agentForm.tone           = tone || '';
        $scope.agentForm.webSearch      = agent.web_search;
        $scope.agentForm.llmKey         = agent.LLMkey || '';
        $scope.agentForm.icon = (agent && agent.icon) || 'Awareness/pub/images/robot-icon1.svg';

        $scope.isThinkActive           = agent.web_search || false;

        $scope.recomputeLLMState();

        // Verify LLM
        if ($scope.agentForm.llmKey) {
            const selectedLLM = ($scope.spec.LLMs || []).find(llm => llm.LLMkey === $scope.agentForm.llmKey);
            if (selectedLLM) {
                // if (llmVerifyTriggered) return;
                llmVerifyTriggered = true;
                // if (!selectedLLM?.is_verified) {
                triggerSilentVerification(selectedLLM);
                // }
                setTimeout(() => { llmVerifyTriggered = false; }, 3000);
            }
        }

        $scope.isNewAgent = false;
        $scope.showWelcomeBubble = false;

        resetChatState();
        $scope.chatHistoryLoading = true;

        $scope.showAgentBox = true;
        document.body.classList.add("bodyscroll-fixed");
        $('#sidebar-wrapper').addClass('minsidebar');
        $('#wrapper').removeClass('fullleft-width');

        if ((!agent.LLMkey || agent.LLMkey.trim() === '') ||
            !$scope.spec.LLMs || $scope.spec.LLMs.length === 0) {
            $scope.openConnectLLMModal();
        }

        if ($scope._loadingChatHistoryFor === agent.identifier) {
            return;
        }
        $scope._loadingChatHistoryFor = agent.identifier;

        const historyUrl = "/chatHistory?agentID=" + agent.identifier;

        $http.get(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + historyUrl,
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                    "Content-Type": "application/json"
                }
            }).then(function (resp) {
            $scope._loadingChatHistoryFor = null;
            $scope.chatHistoryLoading = false;
            if (resp.data && Array.isArray(resp.data.chatHistory)) {
                $scope.chatHistory = resp.data.chatHistory.map(function (msg) {
                    return {
                        ...msg,
                        text: msg.user === "Agent"
                            ? $sce.trustAsHtml(showdownConverter.makeHtml(msg.text))
                            : $sce.trustAsHtml(msg.text)
                    };
                });

                $scope.chatHistory.unshift({
                    user: "Agent",
                    alias: $scope.currentAgent.name,
                    text: $sce.trustAsHtml(
                        '<div>👋 Welcome back! Ask me anything about your app, teams, agents, tools, or KBs.</div>'
                    ),
                    _welcome: true
                });

                $scope.$applyAsync();
                scrollAgentChatToBottom({ smooth: true });

            } else {
                $scope.chatHistory = [{
                    user: "Agent",
                    alias: $scope.currentAgent.name,
                    text: $sce.trustAsHtml(
                        '<div>👋 Welcome! Ask me anything about your app, teams, agents, tools, or KBs.</div>'
                    ),
                    _welcome: true
                }];
                $scope.$applyAsync();
            }

        }, function (err) {
            $scope._loadingChatHistoryFor = null;
            $scope.chatHistoryLoading = false;
            $scope.chatHistory = [{
                user: "Agent",
                alias: "Syncloop Assistant",
                text: $sce.trustAsHtml(
                    '<div>👋 Welcome! Ask me anything about your app, teams, agents, tools, or KBs.</div>'
                ),
                _welcome: true
            }];
            $scope.$applyAsync();
            $scope.showNotification && $scope.showNotification(
                'error',
                "Failed to load chat history: " + (err.data?.error || err.statusText)
            );
        });

        $scope.filterTeamsConversations();
    };

    $scope.getOnlyDescriptionHtml = function(description) {
        if (!description) return $sce.trustAsHtml('');

        let splittedDes = description.split(":::: Tone instructions are ::::");
        let instructions = splittedDes[0] || '';

        // escape HTML chars to avoid XSS
        let escaped = String(instructions)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // convert runs of spaces into &nbsp; preserving indentation and multiple spaces
        // replace each run of N spaces with N times &nbsp;
        escaped = escaped.replace(/ {2,}/g, function(m){
            return m.split('').map(function(){ return '&nbsp;'; }).join('');
        });

        // Also preserve leading spaces on each line
        escaped = escaped.replace(/^\s+/gm, function(m){
            return m.replace(/ /g, '&nbsp;'); // tabs/spaces -> &nbsp;
        });

        // convert line breaks to <br/>
        let html = escaped.replace(/\r\n|\n|\r/g, '<br/>');

        return $sce.trustAsHtml(html);
    };

    $scope.renderPlainTextHtml = function(text) {
        if (!text) return $sce.trustAsHtml('');
        let str = String(text);

        let escaped = str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        escaped = escaped.replace(/ {2,}/g, m =>
            '&nbsp;'.repeat(m.length)
        );

        escaped = escaped.replace(/^\s+/gm, m =>
            m.replace(/ /g, '&nbsp;')
        );

        const html = escaped.replace(/\r\n|\n|\r/g, '<br/>');
        return $sce.trustAsHtml(html);
    };


    $scope.loadWrapperService = function () {
        let serviceName = "_" + ($scope.currentAgent.identifier).replaceAll("-", "_");

        $http.get(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + '/files/packages/ConsumerAgents/wrapper/api/agents/' + serviceName + '.api',
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                    "Content-Type": "application/json"
                }
            })
            .then(function (res) {

                $scope.wrapperService = res.data;

                $scope.sharedConsumers = $scope.wrapperService['consumers'].split(",").filter(item => item !== "");

                if ($scope.sharedConsumers.includes("guest")) {
                    $("#agent-public-switch").prop("checked", true);
                    $("#full-chat-view").show();
                } else {
                    $("#full-chat-view").hide();
                }

            }, function () {
                $scope.groups = [];
            });
    }

    $scope.isAnimated = false;
    $scope.closeAgentBox = function () {
        $scope.showBox = true;
        $scope.showAgentBox = false;
        $scope.showNAppls = true;
        $scope.showsettingBox = false;
        $scope.showaddmodaltoolBox = false;
        $scope.showaddmodalllmBox = false;
        $scope.showaddmodalragbaseBox = false;
        $scope.showaddmodalpayloadbox = false;
        $scope.showaddmodalschemabox = false;
        $scope.showaddmodalchathistory = false;
        document.body.classList.remove("bodyscroll-fixed");

        // Handle "By Team"
        if ($scope.openedFromByTeam) {
            console.log("[closeAgentBox] returning to By Team tab…");
            $scope.activeTab = 'agents';
            $scope.agentsSubTab = 'team';
            setTimeout(() => switchToTab('#byteam', 'By Team'), 150);
            $scope.openedFromByTeam = false;
            return;
        }

        // Handle "My Agents"
        if ($scope.openedFromMyAgents) {
            console.log("[closeAgentBox] returning to My Agents tab…");
            $scope.activeTab = 'agents';
            $scope.agentsSubTab = 'my';
            setTimeout(() => switchToTab('#myagents', 'My Agents'), 150);
            $scope.openedFromMyAgents = false;
            return;
        }

    };

    function switchToTab(tabSelector, label) {

        const anchor = Array.from(document.querySelectorAll('#myTab .nav-link')).find(a =>
            a.getAttribute('href') === tabSelector ||
            a.textContent.trim().toLowerCase().includes(label.toLowerCase())
        );
        if (anchor) {
            anchor.click();
            return;
        }

        if (window.jQuery && jQuery.fn && jQuery.fn.tab) {
            const $anchor = jQuery(`#myTab a[href="${tabSelector}"]`).first();
            if ($anchor.length) {
                $anchor.tab('show');
                console.log(`[switchToTab] bootstrap tab('show') ${label}`);
                return;
            }
        }
    }

    (function installChatEndScroller(){
        function ensureSentinel(log){
            let s = log.querySelector('#chat-end-sentinel');
            if (!s) {
                s = document.createElement('div');
                s.id = 'chat-end-sentinel';
                s.style.cssText = 'height:1px;width:1px;';
                log.appendChild(s);
            } else if (s !== log.lastElementChild) {
                log.appendChild(s); // keep it the very last node
            }
            return s;
        }

        function settleScroll(host){
            let tries = 0;
            const tick = () => {
                const target = host.scrollHeight - host.clientHeight;
                host.scrollTop = target;
                if (++tries < 8) requestAnimationFrame(tick);
            };
            tick();
        }

        function scrollAgentChatToEnd(force){
            $timeout(function(){
                const host = document.getElementById('agentChatWindow');
                if (!host) return;
                const log = host.querySelector('.chat-logsagent');
                if (!log) return;

                const dist = host.scrollHeight - host.scrollTop - host.clientHeight;
                if (!force && dist > 60) return;

                const s = ensureSentinel(log);
                s.scrollIntoView({ block: 'end', inline: 'nearest', behavior: 'auto' });

                settleScroll(host);
            }, 0, false);
        }

        $scope.scrollAgentChatToBottom = scrollAgentChatToEnd;
        window.scrollAgentChatToBottom = scrollAgentChatToEnd;

        $scope.$watch(
            () => ($scope.chatHistory && $scope.chatHistory.length) || 0,
            (n, o) => { if (n !== o) scrollAgentChatToEnd(true); }
        );

        $timeout(function(){
            const host = document.getElementById('agentChatWindow');
            const log  = host && host.querySelector('.chat-logsagent');
            if (!host || !log || typeof ResizeObserver !== 'function') return;

            const ro = new ResizeObserver(() => scrollAgentChatToEnd(false));
            ro.observe(log);
            $scope.$on && $scope.$on('$destroy', () => ro.disconnect());
        }, 0, false);
    })();

    let showdownConverter = new showdown.Converter();

    $scope.isAgentPickerOpen = false;
    $scope.agentSearchQuery = "";
    $scope.filteredAgents = function () {
        var q = ($scope.agentSearchQuery || "").toLowerCase();
        var list = ($scope.spec && $scope.spec.Agents) || [];
        if (!q) return list;
        return list.filter(function (a) {
            return ((a.name || "").toLowerCase().includes(q) ||
                (a.title || "").toLowerCase().includes(q));
        });
    };

    $scope.toggleAgentPicker = function () {
        $scope.isAgentPickerOpen = !$scope.isAgentPickerOpen;
    };

    $scope.selectChatAgent = function (agent) {
        if (!agent) return;

        const normalizedAgent = normalizeAgent(agent);

        $scope.currentChatAgent = normalizedAgent;
        $scope.activeAgent = normalizedAgent;

        $scope.agentSearchQuery = "";
        $scope.isAgentPickerOpen = false;
        $scope.showWelcomeBubble = true;
        $scope.chatHistory = [];
        $scope.conversationID = null;

        loadAgentChatHistoryForRightPane(normalizedAgent);
    };

    function normalizeAgent(agent) {
        if (!agent) return null;

        return {
            ...agent,
            icon: agent.icon && agent.icon.trim()
                ? agent.icon
                : 'Awareness/pub/images/robot-iconfirst.svg'
        };
    }

    $scope.updateActiveAgentIcon = function(newIcon) {
        if ($scope.activeAgent) {
            $scope.activeAgent.icon = newIcon;
        }
    };


    function loadAgentChatHistoryForRightPane(agent) {
        if (!agent) return;
        $scope.currentChatAgent    = agent;
        $scope.chatHistory         = [];
        $scope.conversationID      = null;
        $scope.newChatMessage      = "";
        $scope.chatHistoryLoading  = true;
        $scope.chatWaitVisible     = false;

        $scope.welcomeText     = "Hi! What would you like to learn today?";
        $scope.welcomeSafeHtml = $sce.trustAsHtml($scope.welcomeText);
        $scope.showWelcomeBubble = false;

        if ($scope._loadingChatHistoryFor === agent.identifier) {
            return;
        }
        $scope._loadingChatHistoryFor = agent.identifier;

        let historyUrl = "/chatHistory?agentID=" + agent.identifier;
        if ($scope.currentChatAgent.type === 'TEAM') {
            historyUrl = "/chatHistory?teamId=" + agent.teamId;
        }

        $http.get(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + historyUrl,
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                    "Content-Type": "application/json"
                }
            }).then(function (response) {
            $scope.chatHistoryLoading = false;

            if (response.data && Array.isArray(response.data.chatHistory) && response.data.chatHistory.length) {
                $scope.chatHistory = response.data.chatHistory.map(function (msg) {
                    const isAgent = msg.user === "Agent";
                    const html = isAgent
                        ? $sce.trustAsHtml(showdownConverter.makeHtml(msg.text || ""))
                        : $sce.trustAsHtml(msg.text || "");
                    return { ...msg, text: html };
                });
            } else {
                $scope.chatHistory = [];
            }

            $scope.chatHistory = $scope.chatHistory.filter(function (m) { return !m._welcome; });

            $scope.chatHistory.unshift({
                user: "Agent",
                alias: ($scope.currentChatAgent && $scope.currentChatAgent.name) || "Agent",
                text: $sce.trustAsHtml('<div>👋 Welcome! Ask me anything about your app, teams, agents, tools, or KBs.</div>'),
                _welcome: true
            });

            $scope.showWelcomeBubble = false;
            $scope.showAgentBox = true;

            $scope.$evalAsync(function () {
                scrollAgentChatToBottom({ smooth: true });
            });
        }, function () {
            $scope.chatHistoryLoading = false;
            $scope.chatWaitVisible    = false;
            $scope.showAgentBox       = true;

            $scope._loadingChatHistoryFor = null;

            $scope.chatHistory = [];
            $scope.showWelcomeBubble = true;

            $scope.$evalAsync(function () {
                scrollAgentChatToBottom({ smooth: true });
            });

            //$scope.showNotification('error', "Failed to load chat history: " + (error.data?.error || error.statusText));
        });
    }


    $scope.createAgentQuick = function () {
        var name = prompt("Name your agent:");
        if (!name) return;
        var newAgent = {
            identifier: (self.crypto?.randomUUID?.() || (Date.now()+"")),
            name: name,
            title: "",
            LLMkey: "",
            roleDescription: $scope.encodeBase64(""),
        };
        ($scope.spec.Agents = $scope.spec.Agents || []).push(newAgent);
        $scope.selectChatAgent(newAgent);
        $scope.$applyAsync();
    };

    $scope.newChatMessage = "";

    const logv = (...args) => console.log(new Date().toISOString(), '[VOICE]', ...args);

    var SRSTATE = 'idle';
    var _srCoolDownUntil = 0;
    var _cooldownMs = 250;

    function _setState(s) { logv('state:', SRSTATE, '->', s); SRSTATE = s; }
    function _inCooldown() { return Date.now() < _srCoolDownUntil; }
    function _armCooldown() { _srCoolDownUntil = Date.now() + _cooldownMs; }

    function _resetVoiceUI() {
        try { mode = null; } catch (_) {}
        $scope.isVoicePrimaryActive = false;
        $scope.isVoiceAppendActive  = false;
        $scope._startedPrimaryWithEmpty = false;
        $scope.$applyAsync();
        logv('UI reset');
    }


    $scope.handleAgentChatKeydown = function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const txt = ($scope.newChatMessage || '').trim();
            if (!txt) {
                if (SRSTATE !== 'idle') { $scope.stopAll(); }
                $scope.newChatMessage = '';
                $scope.$applyAsync();
                logv('Enter with empty -> cleared + stopAll');
                return;
            }
            if (SRSTATE !== 'idle') { $scope.stopAll(); }
            logv('Enter send:', txt.slice(0,140));
            $scope.sendAgentChatMessage(txt);
        }
    };

    function pushAgentReply(html, replyToIdx, messageId) {
        $scope.chatHistory.push({
            user: "Agent",
            uuid: messageId,
            text: $sce.trustAsHtml(html),
            ...(typeof replyToIdx === 'number' ? { _replyToIdx: replyToIdx } : {})
        });
        scrollAgentChatToBottom?.({ smooth: true });
        scrollChatToBottom?.();
    }

    function pushAgentError(errMsg, conversationChatID) {
        const safe = String(errMsg).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
        const html = `
    <div class="agent-error">
      <div class="agent-error__title">⚠️ Chat Error</div>
      <div class="agent-error__msg">${safe}</div>
      ${conversationChatID ? `<div class="agent-error__meta"><b>Conversation ID:</b> ${conversationChatID}</div>` : ''}
    </div>`;
        pushAgentReply(html);
    }

    $scope.sendAgentChatMessage = function (messageText) {
        if (!$scope.activeAgent || !$scope.activeAgent.identifier) return;
        if ($scope.chatWaitVisible) return;

        const userMessage = ((messageText ?? $scope.newChatMessage) || '').trim();
        if (!userMessage) { logv && logv('sendAgentChatMessage: empty, skip'); return; }

        if (!$scope.conversationID || $scope.conversationID === null) {
            const tempTitle = userMessage.trim().length < 4 ? "New Chat" : userMessage.substring(0, 60);

            const localId = (self.crypto?.randomUUID?.() || (Date.now() + ''));
            $scope.conversationID = localId;

            $scope.currentConversation = {
                IDENTIFIER: localId,
                SUBJECT: tempTitle,
                AGENTID: $scope.activeAgent.identifier,
                CTEATED_TS_MS: Date.now(),
                DATETIME: Date.now(),
                MODIFIED_TS_MS: Date.now(),
                EMAIL: "admin",
                UUID: localId
            };

            if (!$scope.Conversations) $scope.Conversations = [];

            const existsMain = $scope.Conversations.some(c => c.IDENTIFIER === localId);
            if (!existsMain) {
                $scope.Conversations.unshift($scope.currentConversation);
            }
        }


        $scope.newChatMessage = '';
        $scope.$applyAsync();

        const trustedHtml = $sce.trustAsHtml(userMessage.replace(/\n/g, '<br>'));
        $scope.chatHistory.push({ user: "User", text: trustedHtml, _rawText: userMessage });
        scrollAgentChatToBottom({ smooth: false });
        const userIdx = $scope.chatHistory.length - 1;
        $scope.newChatMessage = "";

        setTimeout(function(){
            var chatWindow = document.querySelector('.fullmodal_box--rightscroll');
            if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
        }, 0);

        var payload = { agentID: $scope.activeAgent.identifier, prompt: userMessage, chatID: $scope.conversationID };
        let chatURL = "/packages.Awareness.assistant.api.chat.main";
        if ($scope.activeAgent.type === 'TEAM') {
            chatURL = "/team/chat";
            payload = { teamId: $scope.activeAgent.teamId, prompt: userMessage, chatID: $scope.conversationID };
        }
        // if ($scope.chatHistory.length < 3) payload['chatTitle'] = userMessage.trim().length < 4 ? "New Chat" : userMessage;

        if ($scope._activeChatCancel && typeof $scope._activeChatCancel.resolve === 'function') {
            $scope._activeChatCancel.resolve();
        }
        $scope._activeChatCancel = null;

        let $qSafe = null;
        try { $qSafe = $injector.get('$q'); } catch (_) {}

        $scope.chatWaitVisible = true;

        const httpCfg = { headers: { 'Content-Type': 'application/json' } };
        if ($qSafe) {
            $scope._activeChatCancel = $qSafe.defer();
            httpCfg.timeout = $scope._activeChatCancel.promise;
        }

        $scope.newChatRequest = true;
        if ($scope.activeAgent.type === 'TEAM') {
            openTeamChat(payload,
                function () { /* ignore transcript updates */ },
                function (finalMsg, conversationChatID, messageId) {
                    $scope.chatWaitVisible = false;
                    try {
                        const data = JSON.parse(finalMsg || '{}');
                        $scope.conversationID = conversationChatID;

                        // if (payload['chatTitle']) {
                        //     $scope.Conversations.push({
                        //         AGENTID: $scope.activeAgent.identifier,
                        //         CTEATED_TS_MS: new Date().getTime(),
                        //         DATETIME: new Date().getTime(),
                        //         EMAIL: "admin",
                        //         IDENTIFIER: conversationChatID,
                        //         MODIFIED_TS_MS: new Date().getTime(),
                        //         SUBJECT: payload['chatTitle'],
                        //         UUID: conversationChatID
                        //     });
                        // }

                        $scope.filterTeamsConversations();

                        if (data.resp || data.response || data.result.length > 0) {
                            const html = showdownConverter.makeHtml(data.resp || data.response || data.result[0]);
                            $scope.$applyAsync(() => pushAgentReply(html, undefined, messageId));
                        } else if (data.error) {
                            $scope.$applyAsync(() => pushAgentError(data.error, data.conversationChatID));
                        } else {
                            $scope.$applyAsync(() => pushAgentError("Unexpected chat response.", data.conversationChatID));
                        }
                    } catch (e) {
                        console.log(e);
                        $scope.$applyAsync(() => pushAgentError("Malformed response from server.", null));
                    }
                },
                function () { $scope.chatWaitVisible = false; },
                function (err) {
                    $scope.chatWaitVisible = false;
                    const msg = (err && (err.message || err.toString())) || "Chat connection error.";
                    $scope.$applyAsync(() => pushAgentError(msg, null));
                }
            );
        } else {
            openAgentChat($scope.activeAgent.identifier, userMessage, $scope.conversationID, $scope.isThinkActive, $scope.currentConversation?.SUBJECT || null,
                function (msg) {
                    if($scope.newChatRequest==true){
                        window.TranscriptUI.clear();
                        $scope.newChatRequest=false;
                        window.TranscriptUI.slideOut();
                    }

                    window.TranscriptUI.addMessage(msg);

                },
                function (finalMsg, conversationID, messageId) {
                    $scope.chatWaitVisible = false;
                    try {
                        const data = JSON.parse(finalMsg || '{}');
                        $scope.conversationID = conversationID;

                        // if (payload['chatTitle']) {
                        //     $scope.Conversations.push({
                        //         AGENTID: $scope.activeAgent.identifier,
                        //         CTEATED_TS_MS: new Date().getTime(),
                        //         DATETIME: new Date().getTime(),
                        //         EMAIL: "admin",
                        //         IDENTIFIER: conversationID,
                        //         MODIFIED_TS_MS: new Date().getTime(),
                        //         SUBJECT: payload['chatTitle'],
                        //         UUID: conversationID
                        //     });
                        // }

                        $scope.filterTeamsConversations();

                        if (data.resp || data.response || data.result.length > 0) {
                            const html = showdownConverter.makeHtml(data.resp || data.response || data.result[0]);
                            $scope.$applyAsync(() => pushAgentReply(html, undefined, messageId));

                        } else if (data.error) {
                            $scope.$applyAsync(() => pushAgentError(data.error, conversationID));
                        } else {
                            $scope.$applyAsync(() => pushAgentError("Unexpected chat response.", conversationID));
                        }
                    } catch (e) {
                        console.log(e);
                        $scope.$applyAsync(() => pushAgentError("Malformed response from server.", null));
                    }
                },
                function () {
                    $scope.chatWaitVisible = false;
                    window.TranscriptUI.disconnect();
                    $scope.newChatRequest=true;
                    console.log("Closed");
                },
                function (err) {

                    window.TranscriptUI.disconnect();
                    console.log("Error");

                    $scope.chatWaitVisible = false;
                    const msg = (err && (err.message || err.toString())) || "Chat connection error.";
                    $scope.$applyAsync(() => pushAgentError(msg, null));
                }
            );
        }
    };

    $scope.reloadMessage = function (msg, $event) {
        if (!msg) return;
        if (!$scope.activeAgent || !$scope.activeAgent.identifier) return;

        const tip = $event?.currentTarget?.querySelector?.('.tooltiptext, .tooltip-text');
        const setTip = (t) => {
            if (!tip) return;
            const orig = tip.getAttribute('data-default') || 'Reload';
            tip.textContent = t;
            setTimeout(() => (tip.textContent = orig), 1500);
        };

        let prompt = msg._rawPrompt;
        if (!prompt) {
            if (typeof msg._replyToIdx === 'number') {
                const u = $scope.chatHistory[msg._replyToIdx];
                prompt = u?._rawText;
            }
            if (!prompt) {
                const idx = $scope.chatHistory.indexOf(msg);
                for (let i = idx - 1; i >= 0; i--) {
                    const m = $scope.chatHistory[i];
                    if (m.user === 'User') {
                        const div = document.createElement('div');
                        div.innerHTML =
                            (typeof m.text === 'string') ? m.text : ($sce.getTrustedHtml?.(m.text) || '');
                        prompt = (div.textContent || div.innerText || '').trim();
                        break;
                    }
                }
            }
        }

        if (!prompt) { setTip('No input'); return; }

        msg._reloading = true;
        $scope.$applyAsync();

        const agentType = $scope.activeAgent.type || 'AGENT';
        const chatID = $scope.conversationID;
        const updateScroll = () => {
            setTimeout(() => {
                const chatWindow = document.querySelector('.fullmodal_box--rightscroll');
                if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
            }, 0);
            scrollAgentChatToBottom({ smooth: true });
        };

        const handleResponse = function (finalMsg, conversationID) {
            msg._reloading = false;
            try {
                const data = JSON.parse(finalMsg || '{}');
                $scope.conversationID = conversationID;

                if (data.resp || data.response) {
                    const respHtml = showdownConverter.makeHtml(data.resp || data.response);
                    $scope.$applyAsync(() => {
                        msg.text = $sce.trustAsHtml(respHtml);
                        msg._baseHtml = respHtml;
                        setTip('Reloaded!');
                        updateScroll();
                    });
                } else if (data.error) {
                    const errHtml = `
                    <div class="agent-error">
                      <div class="agent-error__title">⚠️ Chat Error</div>
                      <div class="agent-error__msg">${data.error}</div>
                    </div>`;
                    $scope.$applyAsync(() => {
                        msg.text = $sce.trustAsHtml(errHtml);
                        setTip('Error');
                    });
                } else {
                    $scope.$applyAsync(() => setTip('Unexpected'));
                }
            } catch (e) {
                $scope.$applyAsync(() => setTip('Malformed'));
            }
        };

        const handleError = function (err) {
            msg._reloading = false;
            const msgText = (err && (err.message || err.toString())) || 'Chat connection error.';
            const errHtml = `
            <div class="agent-error">
              <div class="agent-error__title">⚠️ Chat Error</div>
              <div class="agent-error__msg">${msgText}</div>
            </div>`;
            $scope.$applyAsync(() => {
                msg.text = $sce.trustAsHtml(errHtml);
                setTip('Error');
            });
        };

        if (agentType === 'TEAM') {
            openTeamChat(
                { teamId: $scope.activeAgent.teamId, prompt, chatID },
                function () { /* ignore transcripts */ },
                handleResponse,
                function () { msg._reloading = false; },
                handleError
            );
        } else {
            openAgentChat(
                $scope.activeAgent.identifier,
                prompt,
                chatID, false,
                "",
                function () { /* ignore transcripts */ },
                handleResponse,
                function () { msg._reloading = false; },
                handleError
            );
        }
    };


    $scope.clearAgentSearch = function($event){
        $scope.agentSearchQuery = '';
    }

    $scope.encodeURIComponent = window.encodeURIComponent;

    (function initSpeech(){
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        $scope.srSupported = !!SR;
        if (!$scope.srSupported) return;

        const r = new SR();
        r.lang = 'en-US';
        r.interimResults = true;
        r.continuous = true;

        let buffer = '';
        let startText = '';
        let mode = null;               // 'primary' | 'append' | null
        let srManualStop = false;      // guard to NOT auto-restart

        $scope.isVoicePrimaryActive = false;
        $scope.isVoiceAppendActive  = false;
        $scope._startedPrimaryWithEmpty = false;

        $scope.isRecording = function() {
            return mode !== null;
        };

        function begin(m){
            mode = m;
            srManualStop = false;
            buffer = '';
            startText = '';

            if (mode === 'primary') {
                startText = '';
                $scope.newChatMessage = '';
                $scope._startedPrimaryWithEmpty = true;
                $scope.isVoicePrimaryActive = true;
                $scope.isVoiceAppendActive = false;
            } else {
                startText = ($scope.newChatMessage || '').trim();
                $scope._startedPrimaryWithEmpty = false;
                $scope.isVoiceAppendActive = true;
                $scope.isVoicePrimaryActive = false;
            }

            try { r.start(); }
            catch (err) {
                try { r.stop(); r.start(); } catch(e) { console.warn("sr start failed", e); }
            }
            $scope.$applyAsync();
        }

        $scope.startPrimaryVoice = function () {
            if (!$scope.srSupported) return;
            if (_inCooldown()) { logv('startPrimaryVoice blocked: cooldown'); return; }
            if (SRSTATE === 'starting' || SRSTATE === 'recording' || SRSTATE === 'stopping') {
                logv('startPrimaryVoice blocked: state=', SRSTATE);
                return;
            }
            startText = '';
            _setState('starting');
            logv('begin primary');
            begin('primary');
        };

        $scope.startAppendVoice = function () {
            if (!$scope.srSupported) return;
            if (_inCooldown()) { logv('startAppendVoice blocked: cooldown'); return; }
            if (SRSTATE === 'starting' || SRSTATE === 'recording' || SRSTATE === 'stopping') {
                logv('startAppendVoice blocked: state=', SRSTATE);
                return;
            }
            startText = ($scope.newChatMessage || '').trim();
            _setState('starting');
            logv('begin append (prefix len=', startText.length, ')');
            begin('append');
        };

        $scope.stopVoice = function () {
            logv('stopVoice called. state=', SRSTATE);
            srManualStop = true;
            _setState('stopping');
            try {
                if (typeof r.abort === 'function') { r.abort(); logv('r.abort()'); }
                else { r.stop(); logv('r.stop()'); }
            } catch (e) { logv('stop/abort threw', e); }
            _resetVoiceUI();
        };

        $scope.stopAll = function () {
            logv('stopAll called');
            try { srManualStop = true; } catch (_) {}
            try {
                if (r) {
                    if (typeof r.abort === 'function') r.abort(); else r.stop();
                    logv('forced stop');
                }
            } catch (_) {}
            _setState('stopping');
            _resetVoiceUI();

            if ($scope._activeChatCancel && typeof $scope._activeChatCancel.resolve === 'function') {
                $scope._activeChatCancel.resolve();
            }
            $scope._activeChatCancel = null;
            $scope.chatWaitVisible = false;
            $scope.$applyAsync();
        };

        r.onresult = function (e) {
            if (SRSTATE === 'stopping' || SRSTATE === 'idle' || mode === null) {
                logv('onresult ignored (state/mode)', SRSTATE, mode);
                return;
            }
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const res = e.results[i];
                if (res.isFinal) buffer += (res[0].transcript || '');
                else interim += (res[0].transcript || '');
            }

            if (mode === 'append') {
                const prefix = startText ? (startText + ' ') : '';
                $scope.newChatMessage = (prefix + buffer + interim).trim();
            } else if (mode === 'primary') {
                $scope.newChatMessage = (buffer + interim).trim();
            }

            $scope.$applyAsync();
        };

        r.onerror = function (err) {
            console.warn("SpeechRecognition error:", err);
            $scope.isVoicePrimaryActive = false;
            $scope.isVoiceAppendActive  = false;
            mode = null;
            $scope.$applyAsync();
        };

        r.onend = function () {
            logv('onend', {srManualStop});
            _armCooldown();
            _setState('idle');
            if (srManualStop) srManualStop = false;
            _resetVoiceUI();

            $scope.isVoicePrimaryActive = false;
            $scope.isVoiceAppendActive  = false;

            if ($scope._startedPrimaryWithEmpty && buffer.trim()) {
                $scope.sendAgentChatMessage(buffer.trim());
            }

            buffer = '';
            startText = '';
            $scope._startedPrimaryWithEmpty = false;
            mode = null;
            $scope.$applyAsync();
        };
    })();

    $scope.hasTypedText = function () {
        return !!($scope.newChatMessage && $scope.newChatMessage.trim().length);
    };

    $scope.isRecording = function () {
        return SRSTATE === 'starting' || SRSTATE === 'recording' || ($scope.isVoicePrimaryActive || $scope.isVoiceAppendActive);
    };

    $scope.agentIcons = [
        { src: "Awareness/pub/images/robot-iconfirst.svg" },
        { src: "Awareness/pub/images/robot-iconsecond.svg" },
        { src: "Awareness/pub/images/robot-iconthird.svg" },
        { src: "Awareness/pub/images/robot-iconfour.svg" },
        { src: "Awareness/pub/images/robot-iconfive.svg" },
        { src: "Awareness/pub/images/robot-iconsix.svg" },
        { src: "Awareness/pub/images/robot-iconseven.svg" },
        { src: "Awareness/pub/images/robot-iconeight.svg" },
        { src: "Awareness/pub/images/robot-iconnine.svg" },
        { src: "Awareness/pub/images/robot-iconten.svg" },
        { src: "Awareness/pub/images/robot-iconeleven.svg" },
        { src: "Awareness/pub/images/robot-icontweleve.svg" }
    ];


    $scope.unlinkedTools = function () {
        if (!$scope.currentAgent) return [];
        var id = $scope.currentAgent.identifier;
        return ($scope.spec.Tools || []).filter(function (t) { return t.identifier !== id; });
    };

    $scope.findToolIndex = function(agentId, fqn){
        return ($scope.spec.Tools || []).findIndex(t => t.identifier === agentId && t.fqn === fqn);
    };

    $scope.attachExistingToolToAgent = function (agent, fqn) {
        if (!agent || !agent.identifier || !fqn) return;

        var tools = ($scope.spec.Tools || []);

        var src = tools.find(function (t) { return t && t.fqn === fqn; });
        if (!src) return;

        $scope.startSaving();

        function parseMaybeB64Json(s, fallback) {
            if (!s) return fallback;
            try {
                var dec = atob(s);
                return JSON.parse(dec);
            } catch (_) {}
            try {
                return JSON.parse(s);
            } catch (_) {}
            return fallback;
        }
        function stringifyPlain(obj) {
            try { return JSON.stringify(obj || {}); } catch (_) { return "{}"; }
        }

        var descPlain =
            src.functionDescriptionDecoded
            || $scope.decodeBase64(src.functionDescription)
            || src.functionDescription
            || '';

        var payloadObj = parseMaybeB64Json(src.staticJsonPayload, {});
        var schemaObj  = parseMaybeB64Json(src.inputJSONSchema, {});

        var trueFqn =
            (typeof payloadObj['*fqn'] === 'string' && payloadObj['*fqn']) ||
            (src.fqn && src.fqn.startsWith('packages.') ? src.fqn : '');

        if (!payloadObj['*fqn'] && trueFqn) {
            payloadObj['*fqn'] = trueFqn;
        }

        var staticPayloadPlain = stringifyPlain(payloadObj);
        var inputSchemaPlain   = stringifyPlain(schemaObj);

        SYNCLOOP_AI.TOOLS.upsertTool(
            String(agent.identifier),          // agentID
            src.fqn || '',                     // UI name (your API expects this in the "fqn" slot)
            staticPayloadPlain,                // plain JSON string
            inputSchemaPlain,                  // plain JSON string
            descPlain,                         // plain text description
            function onOk () {
                var target = tools.find(function (t) {
                    return t
                        && t.identifier === String(agent.identifier)
                        && t.fqn === (src.fqn || '');
                });

                if (target && target !== src) {
                    target.provider                   = src.provider || target.provider || 'API';
                    target.functionDescriptionDecoded = descPlain;
                    target.functionDescription        = $scope.encodeBase64(descPlain);
                    target.inputJSONSchema            = inputSchemaPlain;
                    target.staticJsonPayload          = staticPayloadPlain;

                    var idx = tools.indexOf(src);
                    if (idx > -1) tools.splice(idx, 1);
                } else {
                    src.identifier                   = String(agent.identifier);
                    src.provider                     = src.provider || 'API';
                    src.functionDescriptionDecoded   = descPlain;
                    src.functionDescription          = $scope.encodeBase64(descPlain);
                    src.inputJSONSchema              = inputSchemaPlain;
                    src.staticJsonPayload            = staticPayloadPlain;
                }

                $timeout(function () {
                    $scope.toolToAttachFqn = null;
                    const $el = angular.element('#toolselect');
                    if ($el.length) {
                        $el.val('').trigger('change.select2');
                    }
                });
                $scope.finishSaving(2000);
                $scope.$applyAsync();
            },
            function onErr () {
                $scope.finishSaving(2000);
                $scope.$applyAsync();
            }
        );
    };

    $scope.availableApiFqns = function(){
        var set = new Set();

        if (Array.isArray($scope.apiCatalog)) {
            $scope.apiCatalog.forEach(x => x && x.fqn && set.add(x.fqn));
        }

        ($scope.spec.Tools || []).forEach(t => {
            if (!t || !t.fqn) return;
            // Heuristic: exclude your KB tool FQN
            if (t.fqn === 'packages.Awareness.assistant.tools.searchKnowledgeBase') return;
            set.add(t.fqn);
        });

        return Array.from(set).sort();
    };

    $scope.availableKBs = function(){
        return ($scope.spec.KBs || []).filter(k => k && (k.ragID || k.kbID));
    };

    $scope.removeToolFromCurrentAgent = function (tool) {
        if (!tool || !$scope.currentAgent) return;

        swal({
            title: "Are you sure?",
            text: "Once you click 'Yes'. The tool will be permanently removed from this agent and cannot be recovered",
            imageUrl: "Awareness/pub/images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
        }, function () {

            swal({
                title: "Deleting...",
                text: "Please wait while we remove this tool.",
                type: "info",
                showConfirmButton: false,
                confirmButtonColor: "#2C61F5",
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            $scope.startSaving && $scope.startSaving();

            SYNCLOOP_AI.TOOLS.deleteTool(
                $scope.currentAgent.identifier,
                tool.fqn,
                function onOk () {
                    $scope.spec.Tools = ($scope.spec.Tools || []).filter(function (t) {
                        return !(t.identifier === $scope.currentAgent.identifier && t.fqn === tool.fqn);
                    });

                    $scope.finishSaving && $scope.finishSaving(2000);
                    $scope.$applyAsync();

                    swal({
                        title: "Deleted",
                        text: "Tool deleted successfully!",
                        type: "success",
                        confirmButtonColor: "#2C61F5"
                    });
                },
                function onErr (xhr) {
                    $scope.resetSaveStatus && $scope.resetSaveStatus();
                    $scope.$applyAsync();

                    swal({
                        title: "Failed",
                        text: (xhr && xhr.responseText) || "Failed to delete the tool.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                }
            );
        });

        setTimeout(function () {
            var confirmBtn = document.querySelector('.confirm');
            var cancelBtn  = document.querySelector('.cancel');

            function removeCustomBtnClass () {
                if (confirmBtn) confirmBtn.classList.remove('custom-delete-btn');
            }

            if (confirmBtn) {
                confirmBtn.classList.add('custom-delete-btn');
                confirmBtn.addEventListener('click', removeCustomBtnClass);
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', removeCustomBtnClass);
            }
        }, 0);
    };

    $scope.showaddmodaltoolBox = false;
    $scope.toolForm = {
        type: 'api',          // 'api' | 'kb'
        selected: '',         // API fqn or KB ragID
        agentId: '',          // filled from currentAgent
        description: '',
        staticPayload: '',    // optional JSON for API
        schemaObj: null,      // optional JSON object for API schema
        skipStaticPayload: false,
        skipAuthInfo: false,
        selectedToolSource: 'SL_API',
        hideStaticPayloadEditor: false,
        mcpAuth: null
    };
    $scope.toolAuthEdit = {
        id: '',
        name: '',
        skipAuthInfo: false,
        mcpAuth: getDefaultMcpAuthConfig()
    };
    $scope.currentEditingAgentTool = null;

    $scope.opentoolBox = function (agent) {
        $scope.rightsideopened = true;
        $scope.rightPanelMode = 'tools';
        $scope.closeragbaseBox();
        $scope.closellmBox();

        var a = agent || $scope.currentAgent || $scope.activeAgent;
        if (!a || !a.identifier) {
            console.warn('No current agent to attach a tool to.');
            return;
        }

        $scope.toolForm = {
            type: 'api',
            selected: null,
            agentId: a.identifier,
            description: '',
            name: '',
            staticPayload: '',
            schemaObj: null,
            skipStaticPayload: false,
            skipAuthInfo: false,
            selectedToolSource: 'SL_API',
            hideStaticPayloadEditor: false,
            mcpAuth: getDefaultMcpAuthConfig()
        };

        if ($scope.treePackages) {
            populateAITools($scope.treePackages);
        }

        $scope.showaddmodaltoolBox = true;
        $scope.$evalAsync();

        $scope.showaddmodalpayloadbox = false;
        $scope.showaddmodalschemabox = false;
        $scope.showaddmodalchathistory = false;
        $scope.rightsideopened = true;
        $scope.agentoverlay = true;

        setTimeout(initAiToolsFormSelect2, 5);
        setTimeout(_initRegistryToolSelect2, 10);
    };

    $scope.isJson = function (s) {
        if (!s || !s.trim()) return true;
        try { JSON.parse(s); return true; } catch(e){ return false; }
    };

    $scope.showBox = true;

    $scope.descPlain = function(t){
        return t.functionDescriptionDecoded
            || $scope.decodeBase64(t.functionDescription)
            || t.functionDescription
            || "";
    };

    $scope.deleteTool = function(tool){
        if (tool) tool.identifier = null;
    };

    $scope.queueAgentAutosave = function() {
        $scope.startSaving();

        if (saveTimer) $timeout.cancel(saveTimer);
        saveTimer = $timeout($scope.saveCurrentAgent, 600); // debounce 600ms
    };

    $scope.getTenant = function() {
        var tenantName = localStorage.getItem("tenant");
        /*var cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
            var coo = cookies[i].split("=");
            if (coo[0].trim() === "tenant") {
                tenantName = coo[1].replaceAll('"', "").split(" ")[0];
                break;
            }
        }*/
        return tenantName;
    }

    $scope.inviteAgent = function() {
        $scope.isAgentInviting = true;
        const a = $scope.currentAgent;
        if (!a || !a.identifier) return;
        const desc   = ($scope.agentForm.instructions || '').trim();

        const name   = ($scope.agentForm.name || '').trim();

        if (!name) return;

        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        let group = $scope.getShareToConsumers();

        if ($scope.invitingUser) {
            group = $scope.invitingUser;
        }

        if (!re.test(group)) {
            swal({
                title: "Invalid Email",
                text: "Please add a valid email address.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            $scope.isAgentInviting = false;
            return ;
        }

        if (!$scope.groups.includes(group)) {
            $.ajax({
                url: window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.security.flow.addGroup.main",
                method: 'POST',
                headers: { "Authorization": `Bearer ${localStorage.getItem("AuthToken")}` },
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({"group_name": group}),
                success: function(response) {

                },
                error: function(xhr, status, error) {

                }
            });
        }

        $.ajax({
            url: window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.syncloopai.dashboard.services.api.sendAgentInvitationEmail.main",
            method: 'POST',
            headers: { "Authorization": `Bearer ${localStorage.getItem("AuthToken")}` },
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                "to_email":group,
                "to_name":group,
                "agent_name":name,
                "agent_link": location.protocol + "//" + location.host + "/Awareness/pub/agent.html?agent_id="
                    + a.identifier + "&tenant=" + $scope.getTenant()
            }),
            success: function(response) {
                swal({
                    title: "Success",
                    text: "Invitation has been sent successfully!",
                    type: "success",
                    confirmButtonColor: "#2C61F5"
                });

            },
            error: function(xhr, status, error) {

            }
        });

        $("#agent_share_option").val("");
        $scope.invitingUser = "";

        SYNCLOOP_AI.AGENTS.addWrapperService(a.identifier, name, desc, group, false, $scope.wrapperService, function (response) {
            $scope.isAgentInviting = false;
            $scope.loadWrapperService();
        }, function (xhr, status, error) {

        });

    };

    $scope.revokeAgentAccess = function(group) {

        const a = $scope.currentAgent;
        if (!a || !a.identifier) return;
        const desc   = ($scope.agentForm.instructions || '').trim();

        const name   = ($scope.agentForm.name || '').trim();

        if (!name) return;

        $scope.wrapperService.consumers = $scope.wrapperService.consumers.split(",").filter(item => item !== group).toString();

        SYNCLOOP_AI.AGENTS.addWrapperService(a.identifier, name, desc, null, false, $scope.wrapperService, function (response) {
            $scope.isAgentInviting = false;
            $scope.loadWrapperService();
        }, function (xhr, status, error) {

        });
    }

    $scope.containsEmoji = function (text) {
        if (!text) return false;

        const emojiRegex = /\p{Extended_Pictographic}/u;
        return emojiRegex.test(text);
    };

    function utf8ToBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    function base64ToUtf8(str) {
        return decodeURIComponent(escape(atob(str)));
    }

    $scope.agentRename = false;
    $scope.onAgentFieldChange = function () {
        $scope.agentRename = true;
        $scope.queueAgentAutosave();
    };

    function resolveAgentPropsFromLLM(llmKey) {

        const map = $scope.llmStatusByKey || {};
        const entry = map[llmKey];

        if (!entry) return {};

        return {
            lastLLMStatus: entry.status
        };
    }


    $scope.saveCurrentAgent = function() {
        const a = $scope.currentAgent;
        if (!a || !a.identifier) return;

        const name   = ($scope.agentForm.name || '').trim();
        const title  = ($scope.agentForm.title || '').trim();
        const desc   = ($scope.agentForm.instructions || '').trim();
        const tone   = ($scope.agentForm.tone || '').trim();
        const guardrails   = ($scope.agentForm.guardrails || '').trim();
        const llmKey = (typeof $scope?.agentForm?.llmKey === 'string'
            ? $scope.agentForm.llmKey.replace(/^\w+:/, '').trim()
            : '');
        const icon       = $scope.agentForm.icon || 'Awareness/pub/images/robot-icon1.svg';
        const webSearch       = $("#allowWebSearch").is(":checked");
        $scope.isThinkActive           = webSearch;

        if (!name) return;
        if (name.length > 99) {
            swal({
                title: "Name Too Long",
                text: "Try using a more concise name.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            $scope.resetSaveStatus();
            return;
        }

        /*if ($scope.containsEmoji(desc)) {
            swal({
                title: "Invalid Characters",
                text: "Invalid characters detected (emoji). Please remove them to continue.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            $scope.resetSaveStatus();
            return;
        }*/

        const descDecoded = desc + ":::: Tone instructions are ::::" + tone + ":::: Guardrails instructions are ::::" + guardrails || "";

        Object.assign(a, {
            name,
            title,
            LLMkey: llmKey,
            roleDescription: utf8ToBase64(desc || ''),
            roleDescriptionDecoded: descDecoded,
            tone: tone || '',
            guardrails: guardrails || '',
            icon
        });

        $scope.startSaving();

        const agentProps = resolveAgentPropsFromLLM(llmKey);
        a.props = {
            ...a.props,
            ...agentProps
        };

        SYNCLOOP_AI.AGENTS.upsertAgent(
            a.identifier,
            title || "",
            name,
            descDecoded,

            llmKey || "",
            icon,
            webSearch,
            a.props,
            function onOk() {
                a.isDraft = false;

                $scope.spec.Agents = $scope.spec.Agents || [];
                const idx = $scope.spec.Agents.findIndex(x => x.identifier === a.identifier);

                if (idx === -1) {
                    $scope.spec.Agents.push(a);
                    $scope.activeAgent      = a;
                    $scope.currentAgent     = a;
                    $scope.currentChatAgent = a;
                } else {
                    Object.assign($scope.spec.Agents[idx], a);
                    $scope.activeAgent      = $scope.spec.Agents[idx];
                    $scope.currentAgent     = $scope.spec.Agents[idx];
                    $scope.currentChatAgent = $scope.spec.Agents[idx];
                }

                if (Array.isArray($scope.chatHistory)) {
                    $scope.chatHistory.forEach(msg => {
                        if (msg.user === 'Agent') {
                            msg.alias = a.name;
                        }
                    });
                }

                if (
                    $scope.rightsideopened === true &&
                    $scope.rightPanelMode === 'chat' &&
                    $scope.currentChatAgent?.identifier === a.identifier &&
                    $scope.agentRename === true
                ) {
                    if (typeof $scope.openChatTest === 'function') {
                        $scope.openChatTest(a);
                    }
                }

                if (!$scope.activeAgent.LLMkey) {
                    $scope.activeAgent.LLMkey = null;
                }
                $scope.agentForm.llmKey = $scope.activeAgent.LLMkey ?? null;

                $scope.finishSaving(2000);
                $scope.$applyAsync();

                $scope.recomputeLLMState();

                SYNCLOOP_AI.AGENTS.addWrapperService(
                    a.identifier, a.name,
                    $scope.agentForm.instructions || '',
                    [],
                    $("#agent-public-switch").is(":checked"),
                    $scope.wrapperService
                );
                if ($("#agent-public-switch").is(":checked")) {
                    $("#full-chat-view").show();
                } else {
                    $("#full-chat-view").hide();
                }
            }
            ,
            function onErr(err) {
                $scope.resetSaveStatus();
                $scope.$applyAsync();
                $scope.showNotification && $scope.showNotification('error', 'Failed to save agent.');
            }
        );
    };

    $scope.syncAgentTools = function(agent, selected) {
        const delimiter = '::';

        $scope.spec.Tools = ($scope.spec.Tools || []).filter(t => t.identifier !== agent.identifier);

        (selected || []).forEach(val => {
            const [identifier, fqn] = val.split(delimiter);
            $scope.spec.Tools.push({
                identifier: agent.identifier,
                fqn,
                functionDescription: '',
                provider: 'API'
            });
        });
    };

    $scope.closeAllModals = function () {
        $scope.showAgentBox          = false;
        $scope.showsettingBox        = false;
        $scope.showaddmodaltoolBox   = false;
        $scope.showaddmodalragbaseBox= false;
        $scope.showaddmodalllmBox    = false;
        $scope.showaddmodalresultBox = false;
        $scope.showNAppls            = true;
    };

    $scope.showsettingBox = false;
    $scope.rightsideopened = true;
    $scope.rightPanelMode = 'null';

    $scope.openSettingBox = function () {
        $scope.rightsideopened = true;
        $scope.rightPanelMode = 'settings';

        $scope.showsettingBox = true;
        $scope.showaddmodaltoolBox = false;
        $scope.showaddmodalllmBox = false;
        $scope.showaddmodalragbaseBox = false;
        $scope.showaddmodalpayloadbox = false;
        $scope.showaddmodalschemabox = false;
        $scope.showaddmodalchathistory = false;

        $scope.chatModalVisible = false;
    };


    $scope.showaddmodalpayloadbox = false;
    $scope.openpayloadbox = function() {
        $scope.showaddmodalpayloadbox = true;
        $scope.showaddmodalschemabox = false;
        $scope.showaddmodaltoolBox = false;
        $scope.showaddmodalchathistory = false;
        $scope.rightsideopened = true;
        $scope.agentoverlay = true;
    }
    $scope.showaddmodalschemabox = false;
    $scope.openschemabox = function() {
        $scope.showaddmodalschemabox = true;
        $scope.showaddmodalpayloadbox = false;
        $scope.showaddmodaltoolBox = false;
        $scope.showaddmodalchathistory = false;
        $scope.rightsideopened = true;
        $scope.agentoverlay = true;
    }

    $scope.closeSettingBox= function(){
        $scope.showsettingBox = false;
        $scope.rightsideopened = false;

    }
    $scope.$watch('showaddmodaltoolBox', function (isOpen) {
        if (isOpen === true) {
            $timeout(_initRegistryToolSelect2, 10);
        }
        if (isOpen === false && $scope.toolFormNg) {
            $scope.toolFormNg.$setPristine();
            $scope.toolFormNg.$setUntouched();
            $scope.toolFormNg.$submitted = false;

            // Clear any custom validity (e.g., your JSON validator)
            if ($scope.toolFormNg.staticPayload) {
                $scope.toolFormNg.staticPayload.$setValidity('json', true);
            }

            // Optionally clear model values so fields look empty next open
            $scope.toolForm = {
                name: '',
                type: '',
                selected: null,
                description: '',
                staticPayload: '',
                skipStaticPayload: false,
                skipAuthInfo: false,
                selectedToolSource: 'SL_API',
                hideStaticPayloadEditor: false,
                mcpAuth: getDefaultMcpAuthConfig()
            };
        }
    });

// Close modal
    $scope.closeragbaseBox = function () {
        $scope.showaddmodalragbaseBox = false; // triggers watcher below
    };

// Reset when modal hides
    $scope.$watch('showaddmodalragbaseBox', function (isOpen) {
        if (isOpen === false && $scope.ragFormNg) {
            // 1) Reset Angular form state
            $scope.ragFormNg.$setPristine();
            $scope.ragFormNg.$setUntouched();
            $scope.ragFormNg.$submitted = false;

            // 2) Clear models used by the form
            $scope.ragEdit = {
                ragName: '',
                filesDisplay: '',
                filesDisplayFull: '',
                filePattern: '',
                maxSegmentSizeInChars: null,
                maxOverlapSizeInChars: null,
                maxSearchResults: null
            };

            // 3) Clear the hidden <input type="file"> value
            setTimeout(function () {
                var el = document.getElementById('ragFileInput');
                if (el) el.value = null; // removes selected files
            }, 0);
        }
    });


    $scope.closetoolBox= function(){
        $scope.rightPanelMode = 'chat';
        $scope.showaddmodaltoolBox = false;
        $scope.rightsideopened = true;
        $scope.agentoverlay = false;
        $scope.showaddmodaltoolBox = false;
        $scope.toolForm = {
            skipStaticPayload: false,
            skipAuthInfo: false,
            selectedToolSource: 'SL_API',
            hideStaticPayloadEditor: false,
            mcpAuth: getDefaultMcpAuthConfig()
        };
    }
    $scope.closepayloadBox= function(){
        $scope.showaddmodalpayloadbox = false;
        $scope.rightsideopened = false;
        $scope.agentoverlay = false;
    }
    $scope.closeschemaBox= function(){
        $scope.showaddmodalschemabox = false;
        $scope.rightsideopened = false;
        $scope.agentoverlay = false;
    }
    $scope.showaddmodalragbaseBox = false;
    $scope.openragbaseBox = function() {
        $scope.rightsideopened = true;
        $scope.rightPanelMode = 'rag';

        $scope.closetoolBox();
        $scope.closellmBox();

        $scope.ragEdit = {
            ragName: '',
            filesDisplay: '',
            filePattern: '',
            maxSegmentSizeInChars: 1000,
            maxOverlapSizeInChars: 100,
            maxSearchResults: 5
        };

        if ($scope.spec.EMBEDDING_MODELs && $scope.spec.EMBEDDING_MODELs.length > 0) {
            $scope.ragEdit.EMKey = $scope.spec.EMBEDDING_MODELs[0].EMkey;
        }

        $scope.showaddmodalragbaseBox = true;
        $scope.showaddmodalchathistory = false;
        $scope.rightsideopened = true;
        $scope.agentoverlay = true;
    };


    $scope.showaddmodalchathistory = false;
    $scope.openhistroybox = function() {
        $scope.showaddmodalchathistory = true;
    }


    $scope.closeragbaseBox= function(){
        $scope.rightPanelMode = 'chat';
        $scope.showaddmodalragbaseBox = false;
        $scope.rightsideopened = true;
        $scope.agentoverlay = false;
    }

    $scope.showaddmodalllmBox = false;
    $scope.openllmBox = function() {
        $scope.rightPanelMode = 'llm';

        $scope.closetoolBox();
        $scope.closeragbaseBox();

        $scope.showaddmodalllmBox = true;
        $scope.showaddmodalchathistory = false;
        $scope.activeProvider         = null;
        $scope.connectllmboxclose     = true;
        $scope.connectllmbox_tabclose = false;
        $scope.rightsideopened = true;
        $scope.agentoverlay = true;
    }

    $scope.defaultopen = true;
    $scope.adddefaultclass = function(){
        $scope.tonesOpen = true;
        $scope.defaultopen = false;
        $scope.agentForm.tone = '';
    }
    $scope.removedefaulttone = function(){
        $scope.tonesOpen = false;
        $scope.defaultopen = true;
    }


    $scope.closellmBox = function() {
        $scope.rightPanelMode = 'chat';
        if ($scope.activeProvider) {
            const p = $scope.activeProvider;
            $scope.llmEdit[p] = {
                modelName: '', displayName: '', description: '',
                baseUrl: '', temperature: null, maxTokens: null, topP: null,
                apiKey: '', pfc: false,
                logoIcon: '', companyId: null, companyName: '', websiteUrl: '',
                apiKeyDocUrl: '', apiBaseEndpoint: '', freeTokenLimit: null, defaultModelId: null
            };
            $scope.llmSelectedModel[p] = null;
        }

        $scope.activeProvider = null;
        $scope.showaddmodalllmBox = false;
        $scope.connectllmboxclose = true;
        $scope.connectllmbox_tabclose = false;
        $scope.rightsideopened = true;
        $scope.agentoverlay = false;
    };

    $scope.showaddmodalresultBox = false;
    $scope.openresultBox = function() {
        $scope.showaddmodalresultBox = true;
    }
    $scope.closetransriptbox= function(){
        $scope.showaddmodalresultBox = false;
    }

    $scope.closehistorybox= function(){
        $scope.showaddmodalchathistory = false;
    }

    $('.collapse').on('show.bs.collapse', function () {
        $(this).prev('.card-header').find('.arrow-icons').addClass('rotate');
    });

    $('.collapse').on('hide.bs.collapse', function () {
        $(this).prev('.card-header').find('.arrow-icons').removeClass('rotate');
    });


    // $scope.showchathistory = false;
    // $scope.showchathistorybtn =  function(){
    //       $scope.showchathistory = !$scope.showchathistory;
    // }

    //  const triggers  = document.getElementById('showchathistorybtn');
    //  const dropdowns = document.getElementById('showchathistory');
    // if (!triggers || !dropdowns) return;

    // triggers.addEventListener('click', (e) => {
    // e.preventDefault();
    // e.stopPropagation();
    // dropdowns.classList.toggle('show');
    // });

    // document.addEventListener('click', (e) => {
    // if (!dropdowns.contains(e.target) && !triggers.contains(e.target)) {
    //     dropdowns.classList.remove('show');
    // }
    // });

    // document.addEventListener('keydown', (e) => {
    // if (e.key === 'Escape') dropdowns.classList.remove('show');
    // });



    $scope.completeSchemaEdit = function() {
        const schemaText = $("#tool_edit_schema_description").val();

        try {
            JSON.parse(schemaText);
        } catch (err) {
            swal({
                title: "Invalid JSON",
                text: "The schema must be valid JSON.",
                type: "error",
                confirmButtonColor: "#f2533e" // or any hex color
            });
            return;
        }

        for (let i = 0; i < $scope.spec.Tools.length; i++) {
            if ($("#tool_edit_schema_id").val() === $scope.spec.Tools[i].identifier + "-" + $scope.spec.Tools[i].fqn) {
                $scope.spec.Tools[i].inputJSONSchema = $scope.encodeBase64(schemaText);

                SYNCLOOP_AI.TOOLS.upsertTool(
                    $scope.spec.Tools[i].identifier,
                    $scope.spec.Tools[i].fqn,
                    $scope.spec.Tools[i].staticJsonPayload,
                    schemaText,
                    $scope.spec.Tools[i].functionDescription,
                    function (response) {
                        $scope.spec.Tools.push(newTool);
                        $scope.$applyAsync();
                    }, function (xhr, status, error) {

                    });

                break;
            }
        }

        $("#tool_edit_schema_id").val("");
        $("#tool_edit_schema_description").val("");
        $("#addUpdateSchemaModel").modal('hide');
    };

    $scope.beautifyStaticJsonInModal = function (textareaId) {
        try {
            const raw = $(`#${textareaId}`).val();
            const beautified = beautifyAndValidateJson(raw);
            $(`#${textareaId}`).val(beautified);
        } catch (e) {
            $scope.showNotification('error', 'Beautify failed: Invalid JSON.');
        }
    };

    function beautifyAndValidateJson(jsonString) {
        // console.log("beautify")
        $scope.jsonError = null;
        try {
            if (!jsonString || jsonString.trim() === '') return '';
            var obj = JSON.parse(jsonString);
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            $scope.jsonError = "Invalid JSON: " + e.message;
            return jsonString;
        }
    }

    $scope.availableApiFqns = [];

    function populateAITools(response) {
        const seen = new Set();
        $scope.availableApiFqns = [];

        function traverse(node) {
            if (node && node.fqn && !seen.has(node.fqn) &&
                (node.type === 'api' || node.type === 'flow' || node.type === 'service')) {
                seen.add(node.fqn);
                $scope.availableApiFqns.push({ fqn: node.fqn, type: node.type }); // Angular select uses this
            }
            if (node && node.children && node.children.length) node.children.forEach(traverse);
        }
        traverse(response);

        var opts = ['<option value=""></option>'];
        $scope.availableApiFqns.forEach(x => {
            opts.push(`<option value="${x.fqn}" title="${x.type}">${x.fqn}</option>`);
        });

        $('.aiToolsAdd').each(function () {
            var $sel = $(this);
            if (!$sel.is('[ng-options]')) {
                $sel.empty().append(opts.join(''));
            }
        });

        $scope.$applyAsync(function () { $timeout(initAiToolsSelect2, 0); });
    }

    function initAiToolsSelect2() {
        $('.aiToolsAdd').each(function () {
            var $sel = $(this);
            if ($sel.hasClass('select2-hidden-accessible')) $sel.select2('destroy');

            var $parent = $sel.closest('.modal:visible');
            $sel.select2({
                placeholder: 'Select API',
                width: '100%',
                allowClear: true,
                dropdownParent: $parent.length ? $parent : $(document.body)
            });
        });

        var $ngSel = $('.aiToolsAdd[ng-model="toolForm.selected"]');

        $ngSel.off('.aitools').on('change.aitools', function () {
            var val = $(this).val() || null;
            $scope.$evalAsync(function () {
                $scope.toolForm = $scope.toolForm || {};
                $scope.toolForm.selected = val;
            });
        });

        $scope.$watch('toolForm.selected', function (nv) {
            if (!$ngSel.length) return;
            if (($ngSel.val() || '') !== (nv || '')) {
                $ngSel.val(nv || '').trigger('change.select2');
            }
        });
    }

    $scope._aiSelCache = { api: null, kb: null };

    function _whenReady($el, done, tries) {
        var left = (typeof tries === 'number') ? tries : 40; // up to ~2s
        (function tick() {
            var visible = $el.is(':visible') && $el.width() > 0 && $el.height() > 0;
            var realOptions = $el.find('option').filter(function () {
                var v = this.value;
                return v !== '' && !(v && v.charAt && v.charAt(0) === '?');
            }).length;
            if (visible && realOptions > 0) return done(true);
            if (--left <= 0) return done(false);
            setTimeout(tick, 50);
        })();
    }

    function _ensureEmptyOption($el) {
        if ($el.find('option[value=""]').length === 0) {
            $el.prepend('<option value=""></option>');
        }
    }

    function _initOneSelect2(selector, modelExpr, placeholderText) {
        var $sel = $(selector);
        if (!$sel.length) return;

        _whenReady($sel, function () {
            // Clean previous init
            if ($sel.data('select2')) $sel.select2('destroy');
            $sel.off('.aitools');

            // Remove previous watchers/observers if any
            var prevUnwatch = $sel.data('aitools_unwatch');
            if (typeof prevUnwatch === 'function') { prevUnwatch(); $sel.removeData('aitools_unwatch'); }
            var prevMo = $sel.data('aitools_mo');
            if (prevMo) { try { prevMo.disconnect(); } catch(e){} $sel.removeData('aitools_mo'); }

            _ensureEmptyOption($sel);

            // Stable dropdown parent (prevents jumping/flicker)
            var $parent = $sel.closest('.chat_addtoll:visible, .modal:visible');
            var dropdownParent = $parent.length ? $parent : $(document.body);

            $sel.select2({
                placeholder: placeholderText || 'Select',
                width: '100%',
                allowClear: true,
                dropdownParent: dropdownParent
            });

            // Get Angular ngModel controller so Angular does decoding of the value
            var ngModelCtrl = angular.element($sel).controller('ngModel');

            // Avoid redundant refreshes
            var refreshingUI = false;
            var lastDomVal = $sel.val();

            function refreshIfNeeded() {
                var current = $sel.val();
                if (current === lastDomVal) return;     // nothing changed → avoid flicker
                refreshingUI = true;
                try {
                    lastDomVal = current;
                    $sel.trigger('change.select2');       // refresh Select2 UI only
                } finally {
                    setTimeout(function(){ refreshingUI = false; }, 0);
                }
            }

            // DOM → Model (user picks/clears)
            $sel.on('change.aitools', function () {
                if (!ngModelCtrl || refreshingUI) return;
                var serialized = $sel.val();            // string or null (Angular-serialized)
                lastDomVal = serialized;
                $scope.$applyAsync(function () {
                    ngModelCtrl.$setViewValue(serialized); // Angular decodes to real $modelValue
                    // Cache REAL model per tab
                    $scope.$evalAsync(function () {
                        var realVal = ngModelCtrl.$modelValue; // decoded (number/string/object or null)
                        var cacheKey = (selector === '#apiSelect') ? 'api' : 'kb';
                        $scope._aiSelCache = $scope._aiSelCache || {};
                        $scope._aiSelCache[cacheKey] = (realVal == null ? null : realVal);
                    });
                });
            });

            // Model → DOM via $render: after Angular marks the selected <option>, refresh UI if needed
            if (ngModelCtrl) {
                var originalRender = ngModelCtrl.$render;
                ngModelCtrl.$render = function () {
                    if (originalRender) { try { originalRender(); } catch(e){} }
                    setTimeout(refreshIfNeeded, 0);
                };
            }

            // Watch the model expression and refresh UI when it changes elsewhere
            var unwatch = $scope.$watch(modelExpr, function () { setTimeout(refreshIfNeeded, 0); });
            $sel.data('aitools_unwatch', unwatch);

            // Refresh on options mutation (e.g., when ng-options repopulates) — debounced
            var refreshTimer = null;
            var mo = new MutationObserver(function () {
                if (refreshTimer) clearTimeout(refreshTimer);
                refreshTimer = setTimeout(function () {
                    _ensureEmptyOption($sel);
                    lastDomVal = $sel.val();
                    refreshIfNeeded();
                }, 50);
            });
            mo.observe($sel[0], { childList: true, subtree: true });
            $sel.data('aitools_mo', mo);

            // Initial gentle refresh
            setTimeout(function () {
                lastDomVal = $sel.val();
                refreshIfNeeded();
            }, 0);

            // Cleanup when scope dies
            $scope.$on('$destroy', function () {
                try { var m = $sel.data('aitools_mo'); if (m) m.disconnect(); } catch(e){}
                var uw = $sel.data('aitools_unwatch'); if (typeof uw === 'function') uw();
                $sel.off('.aitools');
                if ($sel.data('select2')) $sel.select2('destroy');
                $sel.removeData('aitools_unwatch').removeData('aitools_mo');
            });
        });
    }

    function initAiToolsFormSelect2() {
        _initOneSelect2('#apiSelect', 'toolForm.selected', 'Choose API');
        _initOneSelect2('#kbSelect',  'toolForm.selected', 'Choose KB');
    }

    function _initRegistryToolSelect2() {
        var $sel = $('#registryToolSelect');
        if (!$sel.length) return;

        // Destroy previous instance if any
        if ($sel.data('select2')) $sel.select2('destroy');
        $sel.off('.registrytool');

        var prevUnwatch = $sel.data('rt_unwatch');
        if (typeof prevUnwatch === 'function') { prevUnwatch(); $sel.removeData('rt_unwatch'); }

        var $parent = $sel.closest('.chat_addtoll:visible, .modal:visible');
        var dropdownParent = $parent.length ? $parent : $(document.body);

        $sel.select2({
            placeholder: 'Select tool',
            width: '100%',
            allowClear: true,
            dropdownParent: dropdownParent
        });

        var ngModelCtrl = angular.element($sel).controller('ngModel');

        function _normalizeRegistryUUID(val) {
            if (typeof val !== 'string') return val;
            if (!val) return null;
            return val.indexOf('string:') === 0 ? val.substring(7) : val;
        }

        // DOM → Model: user picks a value
        $sel.on('change.registrytool', function () {
            var normalizedVal = _normalizeRegistryUUID($sel.val());
            if (!ngModelCtrl) return;
            $scope.$applyAsync(function () {
                ngModelCtrl.$setViewValue(normalizedVal);
                $scope.toolForm = $scope.toolForm || {};
                $scope.toolForm.registryUUID = normalizedVal;
                $scope.$evalAsync(function () {
                    var realUUID = _normalizeRegistryUUID(ngModelCtrl.$modelValue);
                    $scope.onToolRegistrySelect(realUUID);
                });
            });
        });

        // Model → DOM: keep Select2 UI in sync when model changes externally
        if (ngModelCtrl) {
            var origRender = ngModelCtrl.$render;
            ngModelCtrl.$render = function () {
                if (origRender) { try { origRender(); } catch(e){} }
                setTimeout(function () { $sel.trigger('change.select2'); }, 0);
            };
        }

        var unwatch = $scope.$watch('toolForm.registryUUID', function () {
            setTimeout(function () { $sel.trigger('change.select2'); }, 0);
        });
        $sel.data('rt_unwatch', unwatch);

        // Refresh when ng-options repopulates the <option> list
        var mo = new MutationObserver(function () {
            setTimeout(function () { $sel.trigger('change.select2'); }, 50);
        });
        mo.observe($sel[0], { childList: true });
        $sel.data('rt_mo', mo);

        $scope.$on('$destroy', function () {
            $sel.off('.registrytool');
            var uw = $sel.data('rt_unwatch'); if (typeof uw === 'function') uw();
            try { var m = $sel.data('rt_mo'); if (m) m.disconnect(); } catch(e){}
            if ($sel.data('select2')) $sel.select2('destroy');
        });
    }

    $scope.$watch('toolForm.type', function (type) {
        if (!type) return;

        var key = (type === 'api') ? 'api' : 'kb';
        var selector = (key === 'api') ? '#apiSelect' : '#kbSelect';
        var $sel = $(selector);

        var cachedModel = ($scope._aiSelCache && $scope._aiSelCache[key] != null)
            ? $scope._aiSelCache[key]
            : null;

        $scope.$evalAsync(function () {
            $scope.toolForm = $scope.toolForm || {};
            $scope.toolForm.selected = cachedModel;
        });

        $timeout(initAiToolsFormSelect2, 0, false);

        $timeout(function () {
            _whenReady($sel, function () {
                var ngModelCtrl = angular.element($sel).controller('ngModel');
                if (ngModelCtrl && typeof ngModelCtrl.$render === 'function') {
                    ngModelCtrl.$render();
                }
                $sel.trigger('change.select2');
            }, 40);
        }, 0, false);
    });

    $scope.toolsForCurrentAgent = function () {
        if (!$scope.currentAgent) return [];
        const tools = ($scope.spec && Array.isArray($scope.spec.Tools)) ? $scope.spec.Tools : [];

        const agentId = $scope.currentAgent.identifier;
        const llmId =
            $scope.currentAgent.llmIdentifier ||
            ($scope.currentAgent.llm && $scope.currentAgent.llm.identifier) ||
            $scope.currentAgent.llm_id;

        return tools.filter(t => {
            if (llmId && (t.llmIdentifier === llmId || (Array.isArray(t.linkedLLMs) && t.linkedLLMs.includes(llmId)))) return true;
            if (agentId && (t.agentIdentifier === agentId || t.identifier === agentId)) return true;
            return false;
        });
    };

    $scope.linkedToolsCount = function () {

        if(!$scope.currentAgent) return 0;

        if(!$scope.spec || !$scope.spec.AgentTools) return 0;

        return $scope.spec.AgentTools.filter(function(t){
            return t.AGENT_ID === $scope.currentAgent.identifier;
        }).length;

    };


    $scope.schemaLoaded = false;
    $scope.selectedFqn = null;
    $scope.latestToolSchemaFqn = null;
    $scope.latestToolSchema = null;
    $scope.latestToolSchemaPromise = null;

    $('#aiToolsAdd_api')
        .off('select2:select select2:unselect')
        .on('select2:select select2:unselect', (e) => {
            console.log('[select2 event fired]', e.type);
            const all = $('#aiToolsAdd_api').val();
            $scope.selectedFqn = Array.isArray(all) ? all[0] : all;
        });


    function onAIToolsAddChange() {
        const $select = $('#aiToolsAdd_api');
        const selectedOption = $select.find('option:selected');
        const fqn = $select.val();
        const extension = selectedOption.attr('title');
        // const isCustom = selectedOption.data('select2-tag') === true;

        $("#toolVariableInputs").empty();
        $("#toolVariablesRow").hide();
        // $("#staticJsonPayloadRow").toggle(isCustom);
        $("#staticJsonPayloadRow").hide();
        $scope.latestToolSchemaFqn = null;
        $scope.latestToolSchema = null;
        $scope.latestToolSchemaPromise = null;

        // if (!fqn || isCustom) {
        if ($scope.toolType !== 'api') {
            return;
        }

        if (!extension) {
            $("#staticJsonPayloadRow").show();
            return;
        }

        _fetchSchemaForApiTool(fqn, { forceRefresh: true, includeMeta: true }).then(({ schema, fileResp }) => {
            const currentDesc = $("#tool_edit_description").val().trim();
            if (!currentDesc) {
                const apiDesc = fileResp?.data?.latest?.api_info?.description || "";
                $("#tool_edit_description").val(apiDesc);
            }
            _mountToolPayloadEditor(schema, {});
        });

    }

    function _fetchSchemaForApiTool(fqn, options) {
        options = options || {};
        const selectedOption = $("#aiToolsAdd_api option:selected");
        const extension = selectedOption.attr("title");

        if ($scope.toolType !== 'api' || !fqn || !extension) {
            return Promise.resolve(null);
        }

        if (!options.forceRefresh && $scope.latestToolSchemaFqn === fqn && $scope.latestToolSchema) {
            return Promise.resolve(options.includeMeta ? {
                schema: $scope.latestToolSchema,
                fileResp: null
            } : $scope.latestToolSchema);
        }

        if (!options.forceRefresh && $scope.latestToolSchemaFqn === fqn && $scope.latestToolSchemaPromise) {
            return $scope.latestToolSchemaPromise.then(result => options.includeMeta ? result : result?.schema || {});
        }

        const tenant = localStorage.getItem("tenant");
        const authToken = localStorage.getItem("AuthToken");
        const url = "/files/" + fqn.replace(/\./g, "/") + "." + extension;

        $scope.latestToolSchemaFqn = fqn;
        $scope.latestToolSchema = null;

        const schemaPromise = $http.get(window.ENV.API_BASE_URL + "/tenant/" + tenant + url, {
            headers: {
                "Authorization": "Bearer " + authToken,
                "Content-Type": "application/json"
            }
        }).then(fileResp => {
            const inputData = extension === "service"
                ? fileResp.data.input
                : fileResp.data.latest?.input;

            return $http.post(
                window.ENV.API_BASE_URL + "/tenant/" + tenant +
                "/packages.middleware.pub.util.SyncloopIOtoSchema.main",
                { json: JSON.stringify(inputData || {}) },
                {
                    headers: {
                        "Authorization": "Bearer " + authToken,
                        "Content-Type": "application/json"
                    }
                }
            ).then(schemaResp => {
                const schema = schemaResp.data?.schema || {};
                const result = { schema, fileResp };
                $scope.latestToolSchema = schema;
                return result;
            });
        }).finally(() => {
            $scope.latestToolSchemaPromise = null;
        });

        $scope.latestToolSchemaPromise = schemaPromise;
        return schemaPromise.then(result => options.includeMeta ? result : result.schema);
    }

    function _hasMeaningfulPayloadValue(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === "string") return value.trim() !== "";
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "object") return Object.keys(value).length > 0;
        return true;
    }

    function _schemaHasEditableFields(schema) {
        if (!schema || typeof schema !== "object") return false;
        if (schema.type === "object") {
            return !!schema.properties && Object.keys(schema.properties).length > 0;
        }
        return true;
    }

    function _resetToolPayloadEditor() {
        const container = document.getElementById('toolVariableInputs');
        if (!container) return;
        container.innerHTML = '';
        container._payloadData = null;
        container._payloadSchema = null;
    }

    function _sanitizeStaticPayload(payload) {
        if (!payload || typeof payload !== "object") return {};

        function sanitize(value) {
            if (value === null || value === undefined) return undefined;
            if (typeof value === "string") {
                const trimmed = value.trim();
                return trimmed ? trimmed : undefined;
            }
            if (Array.isArray(value)) {
                const items = value
                    .map(sanitize)
                    .filter(item => item !== undefined);
                return items.length ? items : undefined;
            }
            if (typeof value === "object") {
                const out = {};
                Object.keys(value).forEach(key => {
                    const sanitized = sanitize(value[key]);
                    if (sanitized !== undefined) {
                        out[key] = sanitized;
                    }
                });
                return Object.keys(out).length ? out : undefined;
            }
            return value;
        }

        return sanitize(payload) || {};
    }

    function _resolveCurrentToolSchemaAndPayload(selectedFqn, schemaOverride, assignedVars) {
        const container = document.getElementById('toolVariableInputs');
        const fallbackSchema = (container && container._payloadSchema) || {};
        const normalizedPayload = _sanitizeStaticPayload(assignedVars || {});

        if (schemaOverride) {
            return Promise.resolve({
                schema: schemaOverride,
                staticPayload: JSON.stringify(normalizedPayload)
            });
        }

        return _fetchSchemaForApiTool(selectedFqn)
            .catch(err => {
                console.warn("Failed to fetch fresh tool schema, using editor schema.", err);
                return fallbackSchema;
            })
            .then(freshSchema => {
                const schema = freshSchema || fallbackSchema || {};
                return {
                    schema,
                    staticPayload: JSON.stringify(_schemaHasEditableFields(schema) ? normalizedPayload : {})
                };
            });
    }

    function _isKnowledgeBaseRegistryTool(tool) {
        return !!tool && tool.FQN === "packages.Awareness.assistant.tools.searchKnowledgeBase";
    }

    $scope.validateToolNameInput = function(e) {
        const input = e.target;
        const text = input.value.trim();
        const infoEl = document.getElementById("info_message_tool");
        const saveBtn = document.querySelector('#overlay-tool button[ng-click="completeToolEdit()"]');
        const NEW_ITEM_TYPE = "Tool";

        let message = "";

        if (!text) {
            infoEl.textContent = "";
            input.classList.remove("is-invalid");
            saveBtn?.removeAttribute("disabled");
            return;
        }

        if ($scope.restricted_keywords.includes(text.toLowerCase())) {
            message = `${NEW_ITEM_TYPE} name is a reserved keyword.`;
        } else if (text.length > 100) {
            message = `${NEW_ITEM_TYPE} name must be less than 100 characters.`;
        } else if (/^[\d\s]/.test(text)) {
            message = `${NEW_ITEM_TYPE} name shouldn't start with a number or space.`;
        } else if (!/^[a-zA-Z]+[A-Za-z0-9_]*$/.test(text)) {
            message = `${NEW_ITEM_TYPE} name must be alphanumeric and start with a letter.`;
        }

        if (message) {
            infoEl.textContent = message;
            input.classList.add("is-invalid");
            saveBtn?.setAttribute("disabled", true);
        } else {
            infoEl.textContent = "";
            input.classList.remove("is-invalid");
            saveBtn?.removeAttribute("disabled");
        }
    };

    function getDefaultMcpAuthConfig() {
        return {
            type: "OIDC",
            enabled: true,
            config: {
                oidc: {
                    issuer: "",
                    client_id: "",
                    client_secret: "",
                    redirect_uri: $scope.oidcRedirectCallback,
                    scopesText: "",
                    response_type: "code",
                    grant_type: "authorization_code",
                    token_endpoint: "",
                    authorization_endpoint: "",
                    userinfo_endpoint: "",
                    jwks_uri: "",
                    tokens: {
                        access_token: "",
                        refresh_token: "",
                        token_type: "",
                        expires_in: "",
                        expires_at: "",
                        scope: ""
                    }
                },
                api_key: {
                    header_name: "",
                    key: "",
                    prefix: ""
                },
                bearer: {
                    token: ""
                },
                basic: {
                    username: "",
                    password: "",
                    encode: "base64"
                }
            }
        };
    }

    function buildMcpAuthConfigFromAuthInfo(rawAuthInfo) {
        const defaultAuth = getDefaultMcpAuthConfig();
        if (!rawAuthInfo) {
            return {
                mcpAuth: defaultAuth,
                skipAuthInfo: true
            };
        }

        try {
            const authInfo = typeof rawAuthInfo === 'string' ? JSON.parse(rawAuthInfo) : rawAuthInfo;
            if (!authInfo || !authInfo.type) {
                return {
                    mcpAuth: defaultAuth,
                    skipAuthInfo: true
                };
            }

            defaultAuth.type = authInfo.type || 'API_KEY';
            defaultAuth.enabled = authInfo.enabled !== undefined ? authInfo.enabled : true;

            if (authInfo.config) {
                if (authInfo.type === 'API_KEY' && authInfo.config.api_key) {
                    defaultAuth.config.api_key = Object.assign({}, defaultAuth.config.api_key, authInfo.config.api_key);
                } else if (authInfo.type === 'OIDC' && authInfo.config.oidc) {
                    const incoming = authInfo.config.oidc;
                    defaultAuth.config.oidc = Object.assign(defaultAuth.config.oidc || {}, incoming);

                    if (Array.isArray(incoming.scopes)) {
                        const scopesComma = incoming.scopes.join(', ');
                        defaultAuth.config.oidc.scopes = scopesComma;
                        defaultAuth.config.oidc.scopesText = scopesComma;
                    }

                    if (incoming.tokens) {
                        const t = incoming.tokens;
                        defaultAuth.config.oidc.tokens = defaultAuth.config.oidc.tokens || {};
                        defaultAuth.config.oidc.tokens.access_token = t.access_token || '';
                        defaultAuth.config.oidc.tokens.refresh_token = t.refresh_token || '';
                        defaultAuth.config.oidc.tokens.token_type = t.token_type || '';
                        defaultAuth.config.oidc.tokens.expires_in = t.expires_in ? parseInt(t.expires_in, 10) : null;
                        defaultAuth.config.oidc.tokens.expires_at = t.expires_at ? parseInt(t.expires_at, 10) : null;
                        defaultAuth.config.oidc.tokens.scope =
                            t.scope || (Array.isArray(incoming.scopes) ? incoming.scopes.join(', ') : '');
                    }
                } else if (authInfo.type === 'BASIC' && authInfo.config.basic) {
                    defaultAuth.config.basic = Object.assign({}, defaultAuth.config.basic, authInfo.config.basic);
                }
            }

            return {
                mcpAuth: defaultAuth,
                skipAuthInfo: false
            };
        } catch (e) {
            return {
                mcpAuth: defaultAuth,
                skipAuthInfo: true
            };
        }
    }

    function normalizeMcpScopes(scopes) {
        if (Array.isArray(scopes)) {
            return scopes.map(function(scope) { return String(scope).trim(); }).filter(Boolean);
        }

        if (!scopes) {
            return [];
        }

        const scopesText = String(scopes).trim();
        if (!scopesText) {
            return [];
        }

        return scopesText
            .split(scopesText.indexOf(",") >= 0 ? "," : /\s+/)
            .map(function(scope) { return scope.trim(); })
            .filter(Boolean);
    }

    function stringifyMcpAuthValue(value) {
        return value === undefined || value === null ? "" : String(value);
    }

    function buildMcpOidcTokenPayload(tokens) {
        const sourceTokens = tokens || {};
        return {
            access_token: stringifyMcpAuthValue(sourceTokens.access_token),
            refresh_token: stringifyMcpAuthValue(sourceTokens.refresh_token),
            token_type: stringifyMcpAuthValue(sourceTokens.token_type),
            expires_in: stringifyMcpAuthValue(sourceTokens.expires_in),
            expires_at: stringifyMcpAuthValue(sourceTokens.expires_at),
            scope: stringifyMcpAuthValue(sourceTokens.scope)
        };
    }

    function getMcpOidcScopesText(oidc) {
        const sourceOidc = oidc || {};
        return normalizeMcpScopes(sourceOidc.scopesText || sourceOidc.scopes || sourceOidc.tokens?.scope).join(", ");
    }

    function buildAgentToolAuthInfo(auth) {
        const sourceAuth = auth || getDefaultMcpAuthConfig();
        const sourceAuthType = sourceAuth.type || "API_KEY";
        const authType = sourceAuthType === "BEARER" ? "API_KEY" : sourceAuthType;
        const config = {};

        if (sourceAuthType === "OIDC") {
            const oidc = sourceAuth.config?.oidc || {};
            const tokens = oidc.tokens || {};
            config.oidc = {
                issuer: oidc.issuer || "",
                client_id: oidc.client_id || "",
                client_secret: oidc.client_secret || "",
                redirect_uri: oidc.redirect_uri || "",
                scopes: normalizeMcpScopes(oidc.scopesText || oidc.scopes || tokens.scope),
                response_type: oidc.response_type || "code",
                grant_type: oidc.grant_type || "authorization_code",
                token_endpoint: oidc.token_endpoint || "",
                authorization_endpoint: oidc.authorization_endpoint || "",
                userinfo_endpoint: oidc.userinfo_endpoint || "",
                jwks_uri: oidc.jwks_uri || "",
                tokens: buildMcpOidcTokenPayload(tokens)
            };
        } else if (sourceAuthType === "API_KEY") {
            const apiKey = sourceAuth.config?.api_key || {};
            config.api_key = {
                header_name: apiKey.header_name || "",
                key: apiKey.key || "",
                prefix: apiKey.prefix || ""
            };
        } else if (sourceAuthType === "BEARER") {
            const bearerToken = sourceAuth.config?.bearer?.token || "";
            config.api_key = {
                header_name: "Authorization",
                key: bearerToken ? ("Bearer " + bearerToken) : "",
                prefix: ""
            };
        } else if (sourceAuthType === "BASIC") {
            const basic = sourceAuth.config?.basic || {};
            config.basic = {
                username: basic.username || "",
                password: basic.password || "",
                encode: basic.encode || "base64"
            };
        }

        return JSON.stringify({
            type: authType,
            enabled: sourceAuth.enabled !== false,
            config: config
        });
    }

    $scope.mcpForm = {
        MCP_ID: "",
        MCP_NAME: "",
        MCP_ENDPOINT: "",
        DESCRIPTION: ""
    };

    $scope.mcpMarketplace = {
        items: [],
        searchText: "",
        loading: false,
        error: "",
        loadingMore: false,
        loadingMoreError: "",
        start: 0,
        length: 20,
        hasMore: true,
        total: 0,
        view: "list"
    };

    $scope.connectedMarketplaceMcp = {};
    $scope.mcpConnectForm = {
        name: "",
        client_id: "",
        client_secret: "",
        header_name: "",
        api_key: "",
        bearer_token: "",
        username: "",
        password: "",
        authenticated: false,
        tokens: {}
    };
    $scope.connectMcpOidcTokenInProgress = false;
    $scope.pendingConnectMcpOidcState = null;
    $scope.connectMcpOidcPopupWatcher = null;

    $scope.mcpOidcTokenInProgress = false;
    $scope.pendingMcpOidcState = null;
    $scope.mcpOidcPopupWatcher = null;

    function getMcpOidcCallbackUrl() {
        return window.location.origin + "/callback-oidc.html";
    }

    function buildMarketplaceConnectMcpPayload(plugin, tokens) {
        var mcpAuthConfig = plugin && plugin.mcpAuthConfig ? plugin.mcpAuthConfig : {};
        var authInfo = mcpAuthConfig.authInfo || {};
        var scopes = Array.isArray(authInfo.scopes) ? authInfo.scopes : (authInfo.scopes ? String(authInfo.scopes).split(/\s+/).filter(Boolean) : []);
        var resolvedTokens = tokens || {};
        var sourceAuthType = mcpAuthConfig.authType || "OIDC";
        var authType = sourceAuthType === "BEARER" ? "API_KEY" : sourceAuthType;

        var config = {};
        var enabled = true;

        if (sourceAuthType === "NONE") {
            enabled = false;
        }

        if (sourceAuthType === "OIDC") {
            config.oidc = {
                issuer: authInfo.issuer || "",
                client_id: ($scope.mcpConnectForm.client_id || authInfo.client_id || "").trim(),
                client_secret: $scope.mcpConnectForm.client_secret || authInfo.client_secret || "",
                redirect_uri: getMcpOidcCallbackUrl(),
                scopes: scopes,
                response_type: authInfo.response_type || "code",
                grant_type: authInfo.grant_type || "authorization_code",
                token_endpoint: authInfo.token_endpoint || "",
                authorization_endpoint: authInfo.authorization_endpoint || "",
                userinfo_endpoint: authInfo.userinfo_endpoint || "",
                jwks_uri: authInfo.jwks_uri || "",
                tokens: {
                    access_token: resolvedTokens.access_token || "",
                    refresh_token: resolvedTokens.refresh_token || "",
                    token_type: resolvedTokens.token_type || "",
                    expires_in: resolvedTokens.expires_in || "",
                    expires_at: resolvedTokens.expires_at || "",
                    scope: resolvedTokens.scope || ""
                }
            };
        } else if (sourceAuthType === "API_KEY") {
            config.api_key = {
                header_name: ($scope.mcpConnectForm.header_name || authInfo.header_name || "").trim(),
                key: $scope.mcpConnectForm.api_key || authInfo.key || "",
                prefix: authInfo.prefix || ""
            };
        } else if (sourceAuthType === "BEARER") {
            config.api_key = {
                header_name: "Authorization",
                key: "Bearer " + ($scope.mcpConnectForm.bearer_token || "").trim(),
                prefix: ""
            };
        } else if (sourceAuthType === "BASIC") {
            config.basic = {
                username: ($scope.mcpConnectForm.username || authInfo.username || "").trim(),
                password: $scope.mcpConnectForm.password || authInfo.password || "",
                encode: authInfo.encode || "base64"
            };
        }

        return {
            mcpName: ($scope.mcpConnectForm.name || mcpAuthConfig.mcpName || plugin.name || "").trim(),
            description: plugin.short_description || plugin.description || "",
            mcpEndpoint: mcpAuthConfig.mcpEndpoint || "",
            authType: authType,
            authInfo: sourceAuthType === "NONE" ? null : {
                type: authType,
                enabled: enabled,
                config: config
            }
        };
    }

    function saveConnectedMarketplaceMcp(plugin, tokens) {
        var payload = buildMarketplaceConnectMcpPayload(plugin, tokens);

        if (!payload.mcpName) {
            swal("Validation", "Name is required.", "warning");
            return;
        }

        if (!payload.mcpEndpoint) {
            swal("Validation", "MCP endpoint is required.", "warning");
            return;
        }

        SYNCLOOP_AI.MCP.add(
            payload.mcpEndpoint,
            payload.mcpName,
            payload.authType,
            payload.authInfo,
            payload.description,
            [],
            false,
            function (response) {
                if (!response || response.status !== "success") {
                    swal({
                        title: "Failed",
                        text: (response && (response.error || response.message)) || "Failed to save MCP.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                    return;
                }

                $scope.$applyAsync(function () {
                    $scope.spec.MCPs = $scope.spec.MCPs || [];
                    $scope.spec.MCPs.push({
                        UUID: response.mcpId,
                        MCP_NAME: payload.mcpName,
                        MCP_ENDPOINT: payload.mcpEndpoint,
                        DESCRIPTION: payload.description,
                        AUTH_TYPE: payload.authType,
                        AUTH_INFO: JSON.stringify(payload.authInfo)
                    });
                });

                $scope.closeMcpMarketplaceDrawer();
                swal({
                    title: "Success",
                    text: "MCP connected successfully.",
                    type: "success",
                    confirmButtonColor: "#2C61F5"
                });
            },
            function () {
                swal({
                    title: "Error",
                    text: "Failed to save MCP.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
            }
        );
    }

    function updateMcpOidcTokenFields(tokens) {
        tokens = tokens || {};

        $("#mcp_oidc_access_token").val(tokens.access_token || "");
        $("#mcp_oidc_refresh_token").val(tokens.refresh_token || "");
        $("#mcp_oidc_token_type").val(tokens.token_type || "");
        $("#mcp_oidc_expires_in").val(tokens.expires_in || "");
        $("#mcp_oidc_expires_at").val(tokens.expires_at || "");
        $("#mcp_oidc_token_scope").val(tokens.scope || "");

        if (!$scope.mcpAuth) {
            $scope.mcpAuth = getDefaultMcpAuthConfig();
        }

        $scope.mcpAuth.config.oidc.tokens.access_token = tokens.access_token || "";
        $scope.mcpAuth.config.oidc.tokens.refresh_token = tokens.refresh_token || "";
        $scope.mcpAuth.config.oidc.tokens.token_type = tokens.token_type || "";
        $scope.mcpAuth.config.oidc.tokens.expires_in = tokens.expires_in || "";
        $scope.mcpAuth.config.oidc.tokens.expires_at = tokens.expires_at || "";
        $scope.mcpAuth.config.oidc.tokens.scope = tokens.scope || "";
    }

    function ensureMcpOidcMessageListener() {
        if (window.__mcpOidcMessageListenerAttached) {
            return;
        }

        window.addEventListener("message", function (event) {
            var data = event.data || {};

            if (!data || data.type !== "mcp-oidc-token") {
                return;
            }

            // determine which flow this belongs to
            var isMcpFlow  = data.state && data.state === $scope.pendingMcpOidcState;
            var isToolFlow = data.state && data.state === $scope.pendingToolMcpOidcState;
            var isConnectFlow = data.state && data.state === $scope.pendingConnectMcpOidcState;
            var isToolEditFlow = data.state && data.state === $scope.pendingToolAuthEditOidcState;

            if (!isMcpFlow && !isToolFlow && !isConnectFlow && !isToolEditFlow) {
                return;
            }

            localStorage.removeItem("mcp_oidc_ctx_" + data.state);

            if (data.error) {
                if (isMcpFlow && $scope.mcpOidcPopupWatcher) {
                    clearInterval($scope.mcpOidcPopupWatcher);
                    $scope.mcpOidcPopupWatcher = null;
                }
                if (isToolFlow && $scope.toolMcpOidcPopupWatcher) {
                    clearInterval($scope.toolMcpOidcPopupWatcher);
                    $scope.toolMcpOidcPopupWatcher = null;
                }
                if (isConnectFlow && $scope.connectMcpOidcPopupWatcher) {
                    clearInterval($scope.connectMcpOidcPopupWatcher);
                    $scope.connectMcpOidcPopupWatcher = null;
                }
                if (isToolEditFlow && $scope.toolAuthEditOidcPopupWatcher) {
                    clearInterval($scope.toolAuthEditOidcPopupWatcher);
                    $scope.toolAuthEditOidcPopupWatcher = null;
                }
                $scope.$applyAsync(function () {
                    if (isMcpFlow) {
                        $scope.mcpOidcTokenInProgress = false;
                        $scope.pendingMcpOidcState = null;
                    }
                    if (isToolFlow) {
                        $scope.toolMcpOidcTokenInProgress = false;
                        $scope.pendingToolMcpOidcState = null;
                    }
                    if (isConnectFlow) {
                        $scope.connectMcpOidcTokenInProgress = false;
                        $scope.pendingConnectMcpOidcState = null;
                    }
                    if (isToolEditFlow) {
                        $scope.toolAuthEditOidcTokenInProgress = false;
                        $scope.pendingToolAuthEditOidcState = null;
                    }
                });
                swal("OIDC Error", data.error_description || data.error, "error");
                return;
            }

            if (isMcpFlow) {
                if ($scope.mcpOidcPopupWatcher) {
                    clearInterval($scope.mcpOidcPopupWatcher);
                    $scope.mcpOidcPopupWatcher = null;
                }
                $scope.$applyAsync(function () {
                    updateMcpOidcTokenFields(data.tokens || {});
                    $scope.mcpOidcTokenInProgress = false;
                    $scope.pendingMcpOidcState = null;
                });
            }

            if (isToolFlow) {
                if ($scope.toolMcpOidcPopupWatcher) {
                    clearInterval($scope.toolMcpOidcPopupWatcher);
                    $scope.toolMcpOidcPopupWatcher = null;
                }
                $scope.$applyAsync(function () {
                    var tokens = data.tokens || {};
                    $scope.toolForm.mcpAuth.config.oidc.tokens = buildMcpOidcTokenPayload(tokens);
                    $scope.toolMcpOidcTokenInProgress = false;
                    $scope.pendingToolMcpOidcState = null;
                });
            }

            if (isConnectFlow) {
                if ($scope.connectMcpOidcPopupWatcher) {
                    clearInterval($scope.connectMcpOidcPopupWatcher);
                    $scope.connectMcpOidcPopupWatcher = null;
                }
                $scope.$applyAsync(function () {
                    $scope.mcpConnectForm.tokens = data.tokens || {};
                    $scope.mcpConnectForm.authenticated = true;
                    $scope.connectMcpOidcTokenInProgress = false;
                    $scope.pendingConnectMcpOidcState = null;
                });
                saveConnectedMarketplaceMcp($scope.connectedMarketplaceMcp, data.tokens || {});
            }

            if (isToolEditFlow) {
                if ($scope.toolAuthEditOidcPopupWatcher) {
                    clearInterval($scope.toolAuthEditOidcPopupWatcher);
                    $scope.toolAuthEditOidcPopupWatcher = null;
                }
                $scope.$applyAsync(function () {
                    var tokens = data.tokens || {};
                    $scope.toolAuthEdit.mcpAuth.config.oidc.tokens = buildMcpOidcTokenPayload(tokens);
                    $scope.toolAuthEditOidcTokenInProgress = false;
                    $scope.pendingToolAuthEditOidcState = null;
                });
            }
        });

        window.__mcpOidcMessageListenerAttached = true;
    }

    $scope.generateMcpOidcToken = function () {
        var authorizationEndpoint = $("#mcp_oidc_authorization_endpoint").val();
        var clientId = $("#mcp_oidc_client_id").val();
        var responseType = $("#mcp_oidc_response_type").val() || "code";
        var redirectUri = $("#mcp_oidc_redirect_uri").val() || getMcpOidcCallbackUrl();
        var scopes = $("#mcp_oidc_scopes").val() || "";

        if (!authorizationEndpoint || !clientId) {
            swal("Validation", "Authorization Endpoint and Client ID are required.", "warning");
            return;
        }

        ensureMcpOidcMessageListener();

        $scope.mcpOidcTokenInProgress = true;
        $scope.pendingMcpOidcState = "mcp_oidc_" + Date.now() + "_" + Math.random().toString(36).slice(2);

        $("#mcp_oidc_redirect_uri").val(redirectUri);
        if ($scope.mcpAuth && $scope.mcpAuth.config && $scope.mcpAuth.config.oidc) {
            $scope.mcpAuth.config.oidc.redirect_uri = redirectUri;
        }

        localStorage.setItem("mcp_oidc_ctx_" + $scope.pendingMcpOidcState, JSON.stringify({
            token_endpoint: $("#mcp_oidc_token_endpoint").val(),
            client_id: clientId,
            client_secret: $("#mcp_oidc_client_secret").val(),
            redirect_uri: redirectUri,
            grant_type: $("#mcp_oidc_grant_type").val() || "authorization_code",
            scope: scopes
        }));

        var authUrl = new URL(authorizationEndpoint);
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", responseType);
        authUrl.searchParams.set("scope", scopes.replace(/,/g, " "));
        authUrl.searchParams.set("state", $scope.pendingMcpOidcState);

        var popup = window.open(authUrl.toString(), "mcpOidcPopup", "width=720,height=760,resizable=yes,scrollbars=yes");

        if (!popup) {
            $scope.mcpOidcTokenInProgress = false;
            $scope.pendingMcpOidcState = null;
            swal("Popup Blocked", "Allow popups to generate the OIDC token.", "warning");
            return;
        }

        if ($scope.mcpOidcPopupWatcher) {
            clearInterval($scope.mcpOidcPopupWatcher);
        }

        $scope.mcpOidcPopupWatcher = setInterval(function () {
            if (!popup || popup.closed) {
                clearInterval($scope.mcpOidcPopupWatcher);
                $scope.mcpOidcPopupWatcher = null;

                $scope.$applyAsync(function () {
                    $scope.mcpOidcTokenInProgress = false;
                    $scope.pendingMcpOidcState = null;
                });
            }
        }, 500);

        popup.focus();
    };

    $scope.generateToolMcpOidcToken = function () {
        var oidc = $scope.toolForm && $scope.toolForm.mcpAuth && $scope.toolForm.mcpAuth.config && $scope.toolForm.mcpAuth.config.oidc
            ? $scope.toolForm.mcpAuth.config.oidc
            : {};

        var authorizationEndpoint = oidc.authorization_endpoint || "";
        var clientId              = oidc.client_id              || "";
        var responseType          = oidc.response_type          || "code";
        var redirectUri           = oidc.redirect_uri           || getMcpOidcCallbackUrl();
        var scopes                = getMcpOidcScopesText(oidc);

        if (!authorizationEndpoint || !clientId) {
            swal("Validation", "Authorization Endpoint and Client ID are required.", "warning");
            return;
        }

        ensureMcpOidcMessageListener();

        $scope.toolMcpOidcTokenInProgress = true;
        $scope.pendingToolMcpOidcState = "tool_mcp_oidc_" + Date.now() + "_" + Math.random().toString(36).slice(2);

        // update redirect_uri back into model
        $scope.toolForm.mcpAuth.config.oidc.redirect_uri = redirectUri;

        localStorage.setItem("mcp_oidc_ctx_" + $scope.pendingToolMcpOidcState, JSON.stringify({
            token_endpoint: oidc.token_endpoint  || "",
            client_id:      clientId,
            client_secret:  oidc.client_secret   || "",
            redirect_uri:   redirectUri          || $scope.oidcRedirectCallback,
            grant_type:     oidc.grant_type      || "authorization_code",
            scope:          scopes
        }));

        var authUrl = new URL(authorizationEndpoint);
        authUrl.searchParams.set("client_id",     clientId);
        authUrl.searchParams.set("redirect_uri",  redirectUri);
        authUrl.searchParams.set("response_type", responseType);
        authUrl.searchParams.set("scope",         scopes.replace(/,/g, " "));
        authUrl.searchParams.set("state",         $scope.pendingToolMcpOidcState);

        var popup = window.open(authUrl.toString(), "toolMcpOidcPopup", "width=720,height=760,resizable=yes,scrollbars=yes");

        if (!popup) {
            $scope.toolMcpOidcTokenInProgress = false;
            $scope.pendingToolMcpOidcState = null;
            swal("Popup Blocked", "Allow popups to generate the OIDC token.", "warning");
            return;
        }

        if ($scope.toolMcpOidcPopupWatcher) {
            clearInterval($scope.toolMcpOidcPopupWatcher);
        }

        $scope.toolMcpOidcPopupWatcher = setInterval(function () {
            if (!popup || popup.closed) {
                clearInterval($scope.toolMcpOidcPopupWatcher);
                $scope.toolMcpOidcPopupWatcher = null;

                $scope.$applyAsync(function () {
                    $scope.toolMcpOidcTokenInProgress = false;
                    $scope.pendingToolMcpOidcState = null;
                });
            }
        }, 500);

        popup.focus();
    };

    $scope.generateAgentToolMcpOidcToken = function () {
        var oidc = $scope.toolAuthEdit && $scope.toolAuthEdit.mcpAuth && $scope.toolAuthEdit.mcpAuth.config && $scope.toolAuthEdit.mcpAuth.config.oidc
            ? $scope.toolAuthEdit.mcpAuth.config.oidc
            : {};

        var authorizationEndpoint = oidc.authorization_endpoint || "";
        var clientId              = oidc.client_id              || "";
        var responseType          = oidc.response_type          || "code";
        var redirectUri           = oidc.redirect_uri           || getMcpOidcCallbackUrl();
        var scopes                = getMcpOidcScopesText(oidc);

        if (!authorizationEndpoint || !clientId) {
            swal("Validation", "Authorization Endpoint and Client ID are required.", "warning");
            return;
        }

        ensureMcpOidcMessageListener();

        $scope.toolAuthEditOidcTokenInProgress = true;
        $scope.pendingToolAuthEditOidcState = "tool_auth_edit_oidc_" + Date.now() + "_" + Math.random().toString(36).slice(2);

        $scope.toolAuthEdit.mcpAuth.config.oidc.redirect_uri = redirectUri;

        localStorage.setItem("mcp_oidc_ctx_" + $scope.pendingToolAuthEditOidcState, JSON.stringify({
            token_endpoint: oidc.token_endpoint  || "",
            client_id:      clientId,
            client_secret:  oidc.client_secret   || "",
            redirect_uri:   redirectUri          || $scope.oidcRedirectCallback,
            grant_type:     oidc.grant_type      || "authorization_code",
            scope:          scopes
        }));

        var authUrl = new URL(authorizationEndpoint);
        authUrl.searchParams.set("client_id",     clientId);
        authUrl.searchParams.set("redirect_uri",  redirectUri);
        authUrl.searchParams.set("response_type", responseType);
        authUrl.searchParams.set("scope",         scopes.replace(/,/g, " "));
        authUrl.searchParams.set("state",         $scope.pendingToolAuthEditOidcState);

        var popup = window.open(authUrl.toString(), "toolAuthEditMcpOidcPopup", "width=720,height=760,resizable=yes,scrollbars=yes");

        if (!popup) {
            $scope.toolAuthEditOidcTokenInProgress = false;
            $scope.pendingToolAuthEditOidcState = null;
            swal("Popup Blocked", "Allow popups to generate the OIDC token.", "warning");
            return;
        }

        if ($scope.toolAuthEditOidcPopupWatcher) {
            clearInterval($scope.toolAuthEditOidcPopupWatcher);
        }

        $scope.toolAuthEditOidcPopupWatcher = setInterval(function () {
            if (!popup || popup.closed) {
                clearInterval($scope.toolAuthEditOidcPopupWatcher);
                $scope.toolAuthEditOidcPopupWatcher = null;

                $scope.$applyAsync(function () {
                    $scope.toolAuthEditOidcTokenInProgress = false;
                    $scope.pendingToolAuthEditOidcState = null;
                });
            }
        }, 500);

        popup.focus();
    };

    $scope.syncMcpAuthType = function(type) {

        if (!$scope.mcpAuth) {
            $scope.mcpAuth = getDefaultMcpAuthConfig();
        }

        $scope.mcpAuth.type = type;
    };


    $scope.openmcpmodel = function () {
        $("#mcpmpdal").modal('show');
    };

    $scope.getMCPTools = function () {
        if (!$scope.mcpForm.MCP_NAME || !$scope.mcpForm.MCP_NAME.trim()) {
            swal("Validation", "MCP name is required.", "warning");
            return;
        }
        if (!$scope.mcpForm.MCP_ENDPOINT || !$scope.mcpForm.MCP_ENDPOINT.trim()) {
            swal("Validation", "MCP endpoint is required.", "warning");
            return;
        }

        var payload = $scope.buildMcpPayload();
        $scope.mcpToolsLoading = true;
        $scope.mcpToolsList = [];

        SYNCLOOP_AI.MCP.listMCPTools(
            payload.mcpName,
            payload.mcpEndpoint,
            payload.authType,
            payload.authInfo,
            function (response) {
                $scope.$applyAsync(function () {
                    $scope.mcpToolsLoading = false;
                    var tools = Array.isArray(response) ? response : (response.tools || response.data || []);
                    $scope.mcpToolsList = tools.map(function (t) {
                        return typeof t === "string" ? { name: t, selected: false } : Object.assign({ selected: false }, t);
                    });
                    $("#mcpmpdal").modal('show');
                });
            },
            function (xhr, status, error) {
                $scope.$applyAsync(function () {
                    $scope.mcpToolsLoading = false;
                });
                swal({
                    title: "Error",
                    text: "Failed to load MCP tools.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
            }
        );
    };

    $scope.saveMCPWithTools = function () {
        var allowedTools = ($scope.mcpToolsList || [])
            .filter(function (t) { return t.selected; })
            .map(function (t) { return t.name; });

        $("#mcpmpdal").modal('hide');
        $scope._executeMCPSave(allowedTools, false);
    };



    $scope._executeMCPSave = function (allowedTools, saveWithoutTools) {

        var payload = $scope.buildMcpPayload();
        payload.allowedTools     = allowedTools     || [];
        payload.saveWithoutTools = saveWithoutTools || false;

        $scope.saveInProgress = true;

        function applyMcpToScope(response, allowedToolsList) {

            if ($scope.isMcpEdit) {
                var index = $scope.spec.MCPs.findIndex(function (m) {
                    return m.UUID === payload.id;
                });

                if (index !== -1) {
                    $scope.spec.MCPs[index].MCP_NAME     = payload.mcpName;
                    $scope.spec.MCPs[index].MCP_ENDPOINT = payload.mcpEndpoint;
                    $scope.spec.MCPs[index].DESCRIPTION  = payload.description;
                    $scope.spec.MCPs[index].AUTH_TYPE    = payload.authType;
                    $scope.spec.MCPs[index].AUTH_INFO    = JSON.stringify(payload.authInfo);
                    $scope.spec.MCPs[index].ALLOWED_TOOLS = allowedToolsList;
                }

            } else {

                $scope.spec.MCPs.push({
                    UUID:         response.mcpId,
                    MCP_NAME:     payload.mcpName,
                    MCP_ENDPOINT: payload.mcpEndpoint,
                    DESCRIPTION:  payload.description,
                    AUTH_TYPE:    payload.authType,
                    AUTH_INFO:    JSON.stringify(payload.authInfo),
                    ALLOWED_TOOLS: allowedToolsList
                });
            }
        }

        function syncToolsToRegistry(toolNames, mcpId) {

            if (payload.saveWithoutTools === true) return;

            $scope.spec.ToolsRegistry = $scope.spec.ToolsRegistry || [];

            toolNames.forEach(function (toolName) {

                const exists = $scope.spec.ToolsRegistry.some(function (t) {
                    return t.FQN === toolName && t.MCP_ID === mcpId;
                });

                if (!exists) {
                    $scope.spec.ToolsRegistry.push({
                        UUID: generateUUID(),
                        NAME: toolName,
                        DESCRIPTION: "",
                        FQN: toolName,
                        SCHEMA: "",
                        STATIC_PAYLOAD: "",
                        SOURCE: "MCP",
                        STATUS: "ACTIVE",
                        AGENT_ACCESS: "PRIVATE",
                        MCP_ID: mcpId,
                        mcp: ($scope.spec.MCPs || []).find(m => m.UUID === mcpId) || {}
                    });
                }
            });
        }

        function handleSuccess(response) {

            if (!response || response.status !== "success") {

                $scope.$applyAsync(function () {
                    $scope.saveInProgress = false;
                });

                swal({
                    title: "Warning",
                    text: (response && response.error ? response.error : "Operation failed") + "\n\nDo you want to save anyway?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#f2533e",
                    confirmButtonText: "Yes, save anyway",
                    cancelButtonText: "Cancel"
                }, function (isConfirm) {
                    if (isConfirm) {
                        $scope._executeMCPSave(payload.allowedTools, true);
                    }
                });

                return;
            }

            const isAllTools = !payload.allowedTools || payload.allowedTools.length === 0;

            if (isAllTools) {

                SYNCLOOP_AI.MCP.listMCPTools(
                    payload.mcpName,
                    payload.mcpEndpoint,
                    payload.authType,
                    payload.authInfo,

                    function (res) {

                        const allTools = (res.tools || res || [])
                            .map(function (t) {
                                return typeof t === "string" ? t : t.name;
                            });

                        $scope.$applyAsync(function () {

                            $scope.saveInProgress = false;

                            applyMcpToScope(response, allTools);

                            syncToolsToRegistry(allTools, response.mcpId);

                            $scope.closeOverlayMcp();

                            swal({
                                title: "Success",
                                text: $scope.isMcpEdit
                                    ? "MCP updated successfully."
                                    : "MCP created successfully.",
                                type: "success",
                                confirmButtonColor: "#2C61F5"
                            });
                        });
                    },

                    function () {
                        $scope.$applyAsync(function () {
                            $scope.saveInProgress = false;
                        });

                        swal({
                            title: "Error",
                            text: "Failed to fetch MCP tools.",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });
                    }
                );

            } else {

                $scope.$applyAsync(function () {

                    $scope.saveInProgress = false;

                    applyMcpToScope(response, payload.allowedTools || []);

                    syncToolsToRegistry(payload.allowedTools || [], response.mcpId);

                    $scope.closeOverlayMcp();

                    swal({
                        title: "Success",
                        text: $scope.isMcpEdit
                            ? "MCP updated successfully."
                            : "MCP created successfully.",
                        type: "success",
                        confirmButtonColor: "#2C61F5"
                    });
                });
            }
        }

        function handleError() {
            $scope.$applyAsync(function () {
                $scope.saveInProgress = false;
            });

            swal({
                title: "Error",
                text: "Failed to save MCP.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
        }

        if ($scope.isMcpEdit) {
            SYNCLOOP_AI.MCP.edit(
                payload.id,
                payload.mcpEndpoint,
                payload.mcpName,
                payload.authType,
                payload.authInfo,
                payload.description,
                payload.allowedTools,
                payload.saveWithoutTools,
                handleSuccess,
                handleError
            );
        } else {
            SYNCLOOP_AI.MCP.add(
                payload.mcpEndpoint,
                payload.mcpName,
                payload.authType,
                payload.authInfo,
                payload.description,
                payload.allowedTools,
                payload.saveWithoutTools,
                handleSuccess,
                handleError
            );
        }
    };

    $scope.mcpsTabLoaded = true;

    $scope.openMcpAdd = function () {
        $scope.toolPopUpHeading = "Add MCP";
        $scope.isMcpEdit = false;

        $scope.mcpForm = {
            MCP_ID: "",
            MCP_NAME: "",
            MCP_ENDPOINT: "",
            DESCRIPTION: ""
        };

        $scope.mcpAuth = getDefaultMcpAuthConfig();
        $scope.mcpsTabLoaded = true;

        $timeout(function () {
            $scope.mcpAuth.type = "OIDC";

            var redirectUri = $scope.oidcRedirectCallback
                || (window.location.protocol + "//" + window.location.host + "/callback-oidc.html");

            $scope.mcpAuth.config.oidc.redirect_uri = redirectUri;

            var el = document.getElementById("overlay-mcp");
            var bg = document.getElementById("bgOverlayMCP");
            if (el) el.classList.add("open");
            if (bg) bg.classList.add("active");
            document.body.classList.add("bodyscroll-fixed");
        }, 50);
    };

    $scope.filterMarketplaceMCPs = function (plugin) {
        var search = ($scope.mcpMarketplace && $scope.mcpMarketplace.searchText ? $scope.mcpMarketplace.searchText : "").trim().toLowerCase();

        if (!search) {
            return true;
        }

        return (
            (plugin.name && plugin.name.toLowerCase().indexOf(search) !== -1) ||
            (plugin.short_description && plugin.short_description.toLowerCase().indexOf(search) !== -1) ||
            (plugin.vendor && plugin.vendor.toLowerCase().indexOf(search) !== -1) ||
            (plugin.tags && plugin.tags.join(" ").toLowerCase().indexOf(search) !== -1)
        );
    };

    $scope.fetchMarketplaceMCPs = function (append) {
        var tenant = localStorage.getItem("tenant") || "default";
        var accessToken = localStorage.getItem("AuthToken") || "";
        var isAppend = !!append;
        var start = isAppend ? ($scope.mcpMarketplace.start || 0) : 0;
        var length = $scope.mcpMarketplace.length || 20;
        var apiUrl = window.ENV.API_BASE_URL +
            "/tenant/" + tenant +
            "/packages.middleware.pub.platform.MCP.main?start=" + start + "&length=" + length;

        if (accessToken) {
            apiUrl += "&access_token=" + encodeURIComponent(accessToken);
        }

        if (isAppend) {
            if ($scope.mcpMarketplace.loading || $scope.mcpMarketplace.loadingMore || !$scope.mcpMarketplace.hasMore) {
                return;
            }
            $scope.mcpMarketplace.loadingMore = true;
            $scope.mcpMarketplace.loadingMoreError = "";
        } else {
            $scope.mcpMarketplace.loading = true;
            $scope.mcpMarketplace.error = "";
            $scope.mcpMarketplace.loadingMoreError = "";
            $scope.mcpMarketplace.items = [];
            $scope.mcpMarketplace.start = 0;
            $scope.mcpMarketplace.hasMore = true;
            $scope.mcpMarketplace.total = 0;
        }

        var requestConfig = {
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (accessToken) {
            requestConfig.headers.Authorization = "Bearer " + accessToken;
        }

        return $http.get(apiUrl, requestConfig).then(function (response) {
            var marketplace = ((response || {}).data || {}).marketplace || {};
            var plugins = marketplace.plugins || [];
            var mappedPlugins = plugins.map(function (plugin) {
                var nameSlug = plugin.name_slug || "";
                var service = plugin.service || "";

                return Object.assign({}, plugin, {
                    logo_url: "https://repo.syncloop.com/logo/" + nameSlug + ".svg",
                    logo_fallback_1: "https://repo.syncloop.com/logo/logo_" + nameSlug + ".svg",
                    logo_fallback_2: service ? ("https://repo.syncloop.com/logo/logo_" + service + ".svg") : "",
                    mcpAuthConfig: plugin.mcpAuthConfig || null
                });
            });

            $scope.mcpMarketplace.total = marketplace.total || 0;
            $scope.mcpMarketplace.items = isAppend
                ? $scope.mcpMarketplace.items.concat(mappedPlugins)
                : mappedPlugins;

            $scope.mcpMarketplace.start = start + 1;
            $scope.mcpMarketplace.hasMore = plugins.length === length &&
                (!$scope.mcpMarketplace.total || $scope.mcpMarketplace.items.length < $scope.mcpMarketplace.total);
            $scope.mcpMarketplace.error = "";
        }).catch(function () {
            if (isAppend) {
                $scope.mcpMarketplace.loadingMoreError = "Failed to load more MCPs.";
            } else {
                $scope.mcpMarketplace.items = [];
                $scope.mcpMarketplace.error = "Failed to load available MCPs.";
            }
        }).finally(function () {
            if (isAppend) {
                $scope.mcpMarketplace.loadingMore = false;
            } else {
                $scope.mcpMarketplace.loading = false;
            }

            if ($("#overlay-mcp-marketplace").hasClass("open")) {
                bindMcpMarketplaceScroll();
            }
        });
    };

    $scope.loadMoreMarketplaceMCPs = function () {
        $scope.fetchMarketplaceMCPs(true);
    };

    function ensureMcpMarketplaceScrollable() {
        $timeout(function () {
            var el = document.getElementById("mcpMarketplaceScroll");

            if (!el || $scope.mcpMarketplace.loading || $scope.mcpMarketplace.loadingMore || !$scope.mcpMarketplace.hasMore) {
                return;
            }

            if (el.scrollHeight <= el.clientHeight + 20) {
                $scope.loadMoreMarketplaceMCPs();
                ensureMcpMarketplaceScrollable();
            }
        }, 150);
    }

    function bindMcpMarketplaceScroll() {
        $timeout(function () {
            var $container = $("#mcpMarketplaceScroll");

            $container.off("scroll.mcpMarketplace");
            $container.on("scroll.mcpMarketplace", function () {
                if (!$scope.mcpMarketplace.hasMore || $scope.mcpMarketplace.loading || $scope.mcpMarketplace.loadingMore) {
                    return;
                }

                var el = this;
                if (!el) {
                    return;
                }

                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
                    $scope.$applyAsync(function () {
                        $scope.loadMoreMarketplaceMCPs();
                    });
                }
            });

            ensureMcpMarketplaceScrollable();
        }, 100);
    }

    $scope.closeMcpMarketplaceDrawer = function () {
        var el = document.getElementById("overlay-mcp-marketplace");
        var bg = document.getElementById("bgOverlayMCPMarketplace");
        if (el) el.classList.remove("open");
        if (bg) bg.classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");
        $scope.mcpMarketplace.view = "list";
    };

    $scope.backToMcpMarketplaceList = function () {
        $scope.mcpMarketplace.view = "list";
        $timeout(function () {
            bindMcpMarketplaceScroll();
        }, 50);
    };

    $scope.openMcpMarketplace = function () {
        $scope.mcpMarketplace.searchText = "";
        $scope.mcpMarketplace.view = "list";

        $scope.fetchMarketplaceMCPs();
        $timeout(function () {
            var el = document.getElementById("overlay-mcp-marketplace");
            var bg = document.getElementById("bgOverlayMCPMarketplace");
            if (el) el.classList.add("open");
            if (bg) bg.classList.add("active");
            document.body.classList.add("bodyscroll-fixed");
            bindMcpMarketplaceScroll();
        }, 50);
    };

    $scope.openCustomMcpFromMarketplace = function () {
        $scope.closeMcpMarketplaceDrawer();
        $timeout(function () {
            $scope.openMcpAdd();
        }, 200);
    };

    $scope.onMarketplaceMcpTileClick = function (plugin) {
        if (!plugin || plugin.installing || plugin.installSuccess) {
            return;
        }

        if (plugin.installed) {
            $scope.connectMarketplaceMcp(plugin);
            return;
        }

        $scope.installMarketplaceMcp(plugin);
    };

    $scope.connectMarketplaceMcp = function (plugin) {
        $scope.selectedMarketplaceMcp = plugin;

        var mcpAuthConfig = plugin && plugin.mcpAuthConfig ? plugin.mcpAuthConfig : {};
        var authInfo = mcpAuthConfig.authInfo || {};

        $scope.connectedMarketplaceMcp = plugin || {};
        $scope.mcpConnectForm = {
            name: mcpAuthConfig.mcpName || plugin.name || "",
            client_id: authInfo.client_id || "",
            client_secret: authInfo.client_secret || "",
            header_name: authInfo.header_name || "",
            api_key: authInfo.key || "",
            bearer_token: authInfo.key && typeof authInfo.key === "string" && authInfo.key.indexOf("Bearer ") === 0 ? authInfo.key.substring(7) : "",
            username: authInfo.username || "",
            password: authInfo.password || "",
            authenticated: false,
            tokens: {}
        };

        console.log("Connect MCP clicked:", plugin);
        $scope.mcpMarketplace.view = "connect";
    };

    $scope.authenticateMarketplaceMcpOidc = function () {
        var plugin = $scope.connectedMarketplaceMcp || {};
        var mcpAuthConfig = plugin.mcpAuthConfig || {};
        var authInfo = mcpAuthConfig.authInfo || {};

        var authorizationEndpoint = authInfo.authorization_endpoint || "";
        var clientId = ($scope.mcpConnectForm.client_id || authInfo.client_id || "").trim();
        var clientSecret = $scope.mcpConnectForm.client_secret || authInfo.client_secret || "";
        var responseType = authInfo.response_type || "code";
        var redirectUri = getMcpOidcCallbackUrl();
        var scopes = Array.isArray(authInfo.scopes) ? authInfo.scopes.join(" ") : (authInfo.scopes || "");

        if (!authorizationEndpoint || !clientId) {
            swal("Validation", "Authorization Endpoint and Client ID are required.", "warning");
            return;
        }

        ensureMcpOidcMessageListener();

        $scope.connectMcpOidcTokenInProgress = true;
        $scope.pendingConnectMcpOidcState = "connect_mcp_oidc_" + Date.now() + "_" + Math.random().toString(36).slice(2);
        $scope.mcpConnectForm.authenticated = false;

        localStorage.setItem("mcp_oidc_ctx_" + $scope.pendingConnectMcpOidcState, JSON.stringify({
            token_endpoint: authInfo.token_endpoint || "",
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: authInfo.grant_type || "authorization_code",
            scope: scopes
        }));

        var authUrl = new URL(authorizationEndpoint);
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", responseType);
        authUrl.searchParams.set("scope", scopes);
        authUrl.searchParams.set("state", $scope.pendingConnectMcpOidcState);

        var popup = window.open(authUrl.toString(), "connectMcpOidcPopup", "width=720,height=760,resizable=yes,scrollbars=yes");

        if (!popup) {
            $scope.connectMcpOidcTokenInProgress = false;
            $scope.pendingConnectMcpOidcState = null;
            swal("Popup Blocked", "Allow popups to generate the OIDC token.", "warning");
            return;
        }

        if ($scope.connectMcpOidcPopupWatcher) {
            clearInterval($scope.connectMcpOidcPopupWatcher);
        }

        $scope.connectMcpOidcPopupWatcher = setInterval(function () {
            if (!popup || popup.closed) {
                clearInterval($scope.connectMcpOidcPopupWatcher);
                $scope.connectMcpOidcPopupWatcher = null;

                $scope.$applyAsync(function () {
                    $scope.connectMcpOidcTokenInProgress = false;
                    $scope.pendingConnectMcpOidcState = null;
                });
            }
        }, 500);

        popup.focus();
    };

    $scope.saveMarketplaceApiKeyMcp = function () {
        saveConnectedMarketplaceMcp($scope.connectedMarketplaceMcp, {});
    };

    $scope.saveMarketplaceBearerMcp = function () {
        saveConnectedMarketplaceMcp($scope.connectedMarketplaceMcp, {});
    };

    $scope.saveMarketplaceNoAuthMcp = function () {
        saveConnectedMarketplaceMcp($scope.connectedMarketplaceMcp, {});
    };

    $scope.saveMarketplaceBasicMcp = function () {
        saveConnectedMarketplaceMcp($scope.connectedMarketplaceMcp, {});
    };

    $scope.installMarketplaceMcp = function (plugin) {
        if (!plugin || plugin.installing) {
            return;
        }

        var tenant = localStorage.getItem("tenant") || "default";
        var accessToken = localStorage.getItem("AuthToken") || "";
        var token = crypto.randomUUID();

        function stopPolling() {
            if (plugin._installPoller) {
                clearInterval(plugin._installPoller);
                plugin._installPoller = null;
            }
        }

        function completeSuccess() {
            stopPolling();

            $scope.$applyAsync(function () {
                plugin.installing = false;
                plugin.installed = true;
                plugin.installSuccess = true;
                plugin.installToken = token;
            });

            $timeout(function () {
                plugin.installSuccess = false;
            }, 1600);
        }

        function completeError(message) {
            stopPolling();

            $scope.$applyAsync(function () {
                plugin.installing = false;
            });

            swal({
                title: "Error",
                text: message || "Failed to install MCP",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
        }

        function startPolling() {
            plugin._installPoller = setInterval(function () {
                var pollingUrl = window.ENV.API_BASE_URL +
                    "/tenant/" + tenant +
                    "/packages.middleware.pub.platform.checkPollingPluginStatus.main" +
                    "?token=" + encodeURIComponent(token) +
                    "&access_token=" + encodeURIComponent(accessToken);

                var pollingConfig = {
                    headers: {
                        "Content-Type": "application/json"
                    }
                };

                if (accessToken) {
                    pollingConfig.headers.Authorization = "Bearer " + accessToken;
                }

                $http.get(pollingUrl, pollingConfig).then(function (response) {
                    var pollResponse = ((response || {}).data || {}).response || {};

                    if (pollResponse.status === "COMPLETED_SUCCESS") {
                        completeSuccess();
                    } else if (pollResponse.status === "COMPLETED_ERROR") {
                        completeError(pollResponse.message || "Failed to install MCP");
                    }
                }).catch(function () {
                    completeError("Failed to check MCP install status");
                });
            }, 5000);
        }

            $scope.$applyAsync(function () {
                plugin.installing = true;
                plugin.installSuccess = false;
                plugin.installToken = token;
            });

        var installUrl = window.ENV.API_BASE_URL +
            "/tenant/" + tenant +
            "/packages.middleware.pub.platform.installAPlugin.main" +
            "?pluginId=" + encodeURIComponent(plugin.unique_id || "") +
            "&version=" + encodeURIComponent(plugin.latest_version || "") +
            "&token=" + encodeURIComponent(token);

        var requestConfig = {
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (accessToken) {
            requestConfig.headers.Authorization = "Bearer " + accessToken;
        }

        $http.post(installUrl, null, requestConfig).then(function () {
            startPolling();
        }).catch(function () {
            completeError("Failed to start MCP installation");
        });
    };

// To fetch the list
    $scope.fetchMCPToolsList = function() {
        console.log("Fetching MCP Tools...");

        SYNCLOOP_AI.MCP.listMCPTools(
            payload.mcpName,
            payload.mcpEndpoint,
            payload.authType,
            JSON.stringify(payload.authInfo),
            function (response) {
                $scope.$applyAsync(function () {
                    $scope.mcpToolsLoading = false;
                    var tools = Array.isArray(response) ? response : (response.tools || response.data || []);
                    $scope.mcpToolsList = tools.map(function (t) {
                        return typeof t === "string" ? { name: t, selected: false } : Object.assign({ selected: false }, t);
                    });
                    $("#mcpmpdal").modal('show');
                });
            },
            function (xhr, status, error) {
                $scope.$applyAsync(function () {
                    $scope.mcpToolsLoading = false;
                });
                swal({
                    title: "Error",
                    text: "Failed to load MCP tools.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
            }
        );
    };



    $scope.openMCPEdit = function (mcp) {
        $scope.toolPopUpHeading = "Edit MCP";
        $scope.isMcpEdit = true;

        $scope.mcpForm = {
            MCP_ID: mcp.UUID,
            MCP_NAME: mcp.MCP_NAME,
            MCP_ENDPOINT: mcp.MCP_ENDPOINT || "",
            DESCRIPTION: mcp.DESCRIPTION
        };

        $scope.mcpAuth = getDefaultMcpAuthConfig();
        $scope.$applyAsync(function() {
            if ($scope.mcpAuth) {
                const type = $scope.mcpAuth.type;
                $scope.mcpAuth.type = null;
                $scope.mcpAuth.type = type;
            }
        });
        $scope.mcpsTabLoaded = true;

        let auth = mcp.AUTH_INFO;
        if (typeof auth === "string") {
            try { auth = JSON.parse(auth); } catch (e) { auth = {}; }
        }
        if (!auth) auth = {};

        $scope.mcpAuth.enabled = auth.enabled !== false;

        var redirectUri = $scope.oidcRedirectCallback
            || (window.location.protocol + "//" + window.location.host + "/callback-oidc.html");

        if (mcp.AUTH_TYPE === "OIDC") {
            $scope.mcpAuth.type = "OIDC";
            var oidcAuth   = auth.config && auth.config.oidc ? auth.config.oidc : auth;
            var oidcTokens = oidcAuth.tokens || {};
            $scope.mcpAuth.config.oidc.issuer                  = oidcAuth.issuer || "";
            $scope.mcpAuth.config.oidc.client_id               = oidcAuth.client_id || "";
            $scope.mcpAuth.config.oidc.client_secret           = oidcAuth.client_secret || "";
            $scope.mcpAuth.config.oidc.redirect_uri            = redirectUri;
            $scope.mcpAuth.config.oidc.response_type           = oidcAuth.response_type || "code";
            $scope.mcpAuth.config.oidc.grant_type              = oidcAuth.grant_type || "authorization_code";
            $scope.mcpAuth.config.oidc.token_endpoint          = oidcAuth.token_endpoint || "";
            $scope.mcpAuth.config.oidc.authorization_endpoint  = oidcAuth.authorization_endpoint || "";
            $scope.mcpAuth.config.oidc.userinfo_endpoint       = oidcAuth.userinfo_endpoint || "";
            $scope.mcpAuth.config.oidc.jwks_uri                = oidcAuth.jwks_uri || "";
            $scope.mcpAuth.config.oidc.tokens.access_token     = oidcTokens.access_token || "";
            $scope.mcpAuth.config.oidc.tokens.refresh_token    = oidcTokens.refresh_token || "";
            $scope.mcpAuth.config.oidc.tokens.token_type       = oidcTokens.token_type || "";
            $scope.mcpAuth.config.oidc.tokens.expires_in       = oidcTokens.expires_in ? Number(oidcTokens.expires_in) : null;
            $scope.mcpAuth.config.oidc.tokens.expires_at       = oidcTokens.expires_at ? Number(oidcTokens.expires_at) : null;
            $scope.mcpAuth.config.oidc.tokens.scope            = oidcTokens.scope || "";
            if (Array.isArray(oidcAuth.scopes)) {
                $scope.mcpAuth.config.oidc.scopesText = oidcAuth.scopes.join(", ");
            }
        } else if (mcp.AUTH_TYPE === "API_KEY") {
            var apiKeyAuth = auth.config && auth.config.api_key ? auth.config.api_key : auth;
            var apiKeyValue = apiKeyAuth.key || "";
            var apiKeyHeader = apiKeyAuth.header_name || "";
            var isBearerAuth = apiKeyHeader.toLowerCase() === "authorization" &&
                typeof apiKeyValue === "string" &&
                apiKeyValue.indexOf("Bearer ") === 0;

            if (isBearerAuth) {
                $scope.mcpAuth.type = "BEARER";
                $scope.mcpAuth.config.bearer.token = apiKeyValue.substring(7);
            } else {
                $scope.mcpAuth.type = "API_KEY";
                $scope.mcpAuth.config.api_key.header_name = apiKeyHeader;
                $scope.mcpAuth.config.api_key.key         = apiKeyValue;
                $scope.mcpAuth.config.api_key.prefix      = apiKeyAuth.prefix || "";
            }
        } else if (mcp.AUTH_TYPE === "BEARER") {
            $scope.mcpAuth.type = "BEARER";
            var bearerAuth = auth.config && auth.config.bearer ? auth.config.bearer : auth;
            $scope.mcpAuth.config.bearer.token = bearerAuth.token || "";
        } else if (mcp.AUTH_TYPE === "BASIC") {
            $scope.mcpAuth.type = "BASIC";
            var basicAuth = auth.config && auth.config.basic ? auth.config.basic : auth;
            $scope.mcpAuth.config.basic.username = basicAuth.username || "";
            $scope.mcpAuth.config.basic.password = basicAuth.password || "";
            $scope.mcpAuth.config.basic.encode   = basicAuth.encode   || "base64";
        }

        $timeout(function () {
            var el = document.getElementById("overlay-mcp");
            var bg = document.getElementById("bgOverlayMCP");
            if (el) el.classList.add("open");
            if (bg) bg.classList.add("active");
            document.body.classList.add("bodyscroll-fixed");
        }, 50);
    };

    $scope.closeOverlayMcp = function () {
        document.getElementById("overlay-mcp").classList.remove("open");
        document.getElementById("bgOverlayMCP").classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");
    };

    $scope.buildMcpPayload = function () {

        var authType = $scope.mcpAuth.type;

        var config = {};

        if (authType === "OIDC") {

            var scopes = [];
            var scopesText = $("#mcp_oidc_scopes").val();

            if (scopesText) {
                scopes = scopesText
                    .split(",")
                    .map(function (s) { return s.trim(); })
                    .filter(Boolean);
            }

            config['oidc'] = {
                issuer: $("#mcp_oidc_issuer").val(),
                client_id: $("#mcp_oidc_client_id").val(),
                client_secret: $("#mcp_oidc_client_secret").val(),
                redirect_uri: $("#mcp_oidc_redirect_uri").val(),
                scopes: scopes,
                response_type: $("#mcp_oidc_response_type").val(),
                grant_type: $("#mcp_oidc_grant_type").val(),
                token_endpoint: $("#mcp_oidc_token_endpoint").val(),
                authorization_endpoint: $("#mcp_oidc_authorization_endpoint").val(),
                userinfo_endpoint: $("#mcp_oidc_userinfo_endpoint").val(),
                jwks_uri: $("#mcp_oidc_jwks_uri").val(),
                tokens: {
                    access_token: $("#mcp_oidc_access_token").val(),
                    refresh_token: $("#mcp_oidc_refresh_token").val(),
                    token_type: $("#mcp_oidc_token_type").val(),
                    expires_in: $("#mcp_oidc_expires_in").val(),
                    expires_at: $("#mcp_oidc_expires_at").val(),
                    scope: $("#mcp_oidc_token_scope").val()
                }
            };

        }
        else if (authType === "API_KEY") {

            config['api_key'] = {
                header_name: $("#mcp_api_key_header_name").val(),
                key: $("#mcp_api_key_key").val(),
                prefix: $("#mcp_api_key_prefix").val()
            };

        }
        else if (authType === "BEARER") {

            var bearerToken = ($("#mcp_bearer_token").val() || "").trim();

            config['api_key'] = {
                header_name: "Authorization",
                key: bearerToken ? ("Bearer " + bearerToken) : "",
                prefix: ""
            };

        }
        else if (authType === "BASIC") {

            config['basic'] = {
                username: $("#mcp_basic_username").val(),
                password: $("#mcp_basic_password").val(),
                encode: $("#mcp_basic_encode").val()
            };
        }

        var payloadAuthType = authType === "BEARER" ? "API_KEY" : authType;

        return {
            id: $scope.mcpForm.MCP_ID || null,
            mcpName: $scope.mcpForm.MCP_NAME,
            description: $scope.mcpForm.DESCRIPTION,
            mcpEndpoint: $scope.mcpForm.MCP_ENDPOINT,
            authType: payloadAuthType,
            authInfo: {
                type: payloadAuthType,
                enabled: $scope.mcpAuth.enabled,
                config: config
            }
        };
    };

    $scope.filterMCPs = function (mcp) {
        if (!$scope.searchText || !$scope.searchText.MCPs || !$scope.searchText.MCPs.trim()) {
            return true;
        }

        var search = $scope.searchText.MCPs.toLowerCase();

        return (
            (mcp.MCP_NAME && mcp.MCP_NAME.toLowerCase().indexOf(search) !== -1) ||
            (mcp.DESCRIPTION && mcp.DESCRIPTION.toLowerCase().indexOf(search) !== -1) ||
            (mcp.MCP_ENDPOINT && mcp.MCP_ENDPOINT.toLowerCase().indexOf(search) !== -1)
        );
    };

    $scope.validateMcpNameInput = function ($event) {
        var value = $scope.mcpForm.MCP_NAME || "";
        var el = document.getElementById("info_message_mcp");
        if (!value.trim()) {
            if (el) el.innerHTML = "MCP name is required.";
            return false;
        }

        if (value.length > 99) {
            if (el) el.innerHTML = "MCP name must be at most 100 characters.";
            return false;
        }

        if (el) el.innerHTML = "";
        return true;
    };


    $scope.saveMCP = function () {
        var name = $scope.mcpForm.MCP_NAME ? $scope.mcpForm.MCP_NAME.trim() : "";
        if (!name) {
            swal("Validation", "MCP name is required.", "warning");
            return;
        }
        if (name.length > 99) {
            swal("Validation", "MCP name must be at most 100 characters.", "warning");
            return;
        }
        if (!$scope.mcpForm.MCP_ENDPOINT || !$scope.mcpForm.MCP_ENDPOINT.trim()) {
            swal("Validation", "MCP endpoint is required.", "warning");
            return;
        }
        if (!$scope.mcpForm.DESCRIPTION || !$scope.mcpForm.DESCRIPTION.trim()) {
            swal("Validation", "Description is required.", "warning");
            return;
        }

        const endpoint = $scope.mcpForm.MCP_ENDPOINT || '';
        if (!endpoint.trim()) {
            swal({ title: "Missing Endpoint", text: "Please enter an MCP endpoint URL.", type: "error", confirmButtonColor: "#f2533e" });
            return;
        }
        try {
            const url = new URL(endpoint.trim());
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                throw new Error('Invalid protocol');
            }
        } catch(e) {
            swal({ title: "Invalid URL", text: "Please enter a valid HTTP or HTTPS URL.", type: "error", confirmButtonColor: "#f2533e" });
            return;
        }

        $scope._executeMCPSave([], false);
    };

    $scope.confirmOverlay = {
        visible: false,
        title: "",
        text: "",
        confirmText: "Yes",
        cancelText: "No"
    };

    $scope.openConfirmOverlay = function(config) {
        $scope.confirmOverlay.title = config.title || "Please Confirm";
        $scope.confirmOverlay.text = config.text || "";
        $scope.confirmOverlay.confirmText = config.confirmText || "Yes";
        $scope.confirmOverlay.cancelText = config.cancelText || "No";
        $scope.confirmOverlay.onConfirm = config.onConfirm || null;
        $scope.confirmOverlay.onCancel = config.onCancel || null;
        $scope.confirmOverlay.visible = true;
        $scope.$applyAsync();
    };

    $scope.closeConfirmOverlay = function() {
        $scope.confirmOverlay.visible = false;
        $scope.confirmOverlay.title = "";
        $scope.confirmOverlay.text = "";
        $scope.confirmOverlay.confirmText = "Yes";
        $scope.confirmOverlay.cancelText = "No";
        $scope.confirmOverlay.onConfirm = null;
        $scope.confirmOverlay.onCancel = null;
        $scope.$applyAsync();
    };

    $scope.confirmOverlayYes = function() {
        const callback = $scope.confirmOverlay.onConfirm;
        $scope.closeConfirmOverlay();
        if (typeof callback === "function") {
            setTimeout(function () {
                callback();
            }, 0);
        }
    };

    $scope.confirmOverlayNo = function() {
        const callback = $scope.confirmOverlay.onCancel;
        $scope.closeConfirmOverlay();
        if (typeof callback === "function") {
            setTimeout(function () {
                callback();
            }, 0);
        }
    };

    $scope.deleteMCP = function (mcp) {

        function executeDeleteMCP(deleteTools) {

            swal({
                title: "Deleting...",
                text: "Please wait...",
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            SYNCLOOP_AI.MCP.delete(
                mcp.UUID,
                deleteTools,

                function (response) {

                    if (!response || response.status !== "success") {
                        swal("Error", response?.error || "Delete failed", "error");
                        return;
                    }

                    $scope.$applyAsync(function () {
                        $scope.spec.MCPs = ($scope.spec.MCPs || []).filter(item => item.UUID !== mcp.UUID);

                        if (deleteTools) {
                            $scope.spec.ToolsRegistry = ($scope.spec.ToolsRegistry || [])
                                .filter(t => t.MCP_ID !== mcp.UUID);
                        }
                    });

                    swal("Deleted", "MCP deleted successfully.", "success");
                },

                function () {
                    swal("Error", "Failed to delete MCP.", "error");
                }
            );
        }

        function askDeleteMcpTools() {
            $scope.openConfirmOverlay({
                title: "Delete Related Tools?",
                text: "Do you also want to delete tools linked to this MCP?",
                confirmText: "Yes",
                cancelText: "No",
                onConfirm: function () {
                    executeDeleteMCP(true);
                },
                onCancel: function () {
                    executeDeleteMCP(false);
                }
            });
        }

        $scope.openConfirmOverlay({
            title: "Delete MCP?",
            text: "This MCP will be permanently deleted.",
            confirmText: "Continue",
            cancelText: "Cancel",
            onConfirm: function () {
                askDeleteMcpTools();
            },
            onCancel: function () {}
        });
    };

    $scope.openToolAdd = function() {
        $scope.toolPopUpHeading = 'Add Tool';
        document.getElementById("overlay-tool").classList.add("open");
        document.getElementById("bgOverlayTool").classList.add("active");
        document.body.classList.add("bodyscroll-fixed");

        $scope.isToolEdit = false;

        $scope.toolType = 'api';
        $("#tool_edit_name, #tool_edit_description, #tool_static_json_payload, #tool_edit_id, #tool_mcp_name").val('');
        _resetToolPayloadEditor();
        $("#toolVariablesRow, #staticJsonPayloadRow").hide();
        $("#tool_edit_name").removeAttr('readonly');
        $scope.latestToolSchemaFqn = null;
        $scope.latestToolSchema = null;
        $scope.latestToolSchemaPromise = null;

        if ($.fn.select2 && $('#aiToolsAdd_api').hasClass("select2-hidden-accessible")) {
            $('#aiToolsAdd_api').select2('destroy');
        }
        $scope.selectedFqn = null;
        $('#aiToolsAdd_api').off('change').empty().select2({
            placeholder: "Select Tool",
            tags: false,
            width: '100%',
            allowClear: true
        }).prop("disabled", false);

        $("#tool_edit_agents").empty();
        $scope.spec.Agents.forEach(a =>
            $("#tool_edit_agents")
                .append(`<option value="${a.identifier}">${a.name} ${a.title}</option>`)
        );
        $("#tool_edit_agents").val("").select2({
            placeholder: "Select Agent",
            width: '100%',
            allowClear: true
        }).prop("disabled", false);

        $scope.onToolTypeChange();
    };

    $scope.onToolTypeChange = function() {
        $scope.latestToolSchemaFqn = null;
        $scope.latestToolSchema = null;
        $scope.latestToolSchemaPromise = null;
        const $select = $('#aiToolsAdd_api').off('change select2:select').empty();
        if ($scope.toolType === 'api') {
            populateAITools($scope.treePackages);
        } else if ($scope.toolType === 'mcp') {
            ($scope.spec.MCPs || []).forEach(mcp =>
                $select.append(`<option value="${mcp.UUID}" title="${mcp.MCP_NAME}" data-endpoint="${mcp.MCP_ENDPOINT || ''}">${mcp.MCP_NAME}</option>`)
            );
        } else {
            $scope.spec.KBs.forEach(kb =>
                $select.append(`<option value="${kb.ragID}" title="${kb.name}">${kb.name}</option>`)
            );
        }
        const placeholder = $scope.toolType === 'kb' ? 'Select KB' : ($scope.toolType === 'mcp' ? 'Select MCP' : 'Select API');
        $select.select2({ placeholder: placeholder, tags:false, width:'100%', allowClear:true })
            .on('select2:select', onAIToolsAddChange)
            .val(null).trigger('change');
    }


    $scope.isToolEdit = false;

    $scope.openToolEdit = function (tool) {

        const knowledgeBaseFqn = "packages.Awareness.assistant.tools.searchKnowledgeBase";
        const askAgentFqn = "packages.Awareness.assistant.tools.askAgent";

        let STATIC_PAYLOAD = tool.STATIC_PAYLOAD;
        let FQN = tool.FQN;
        let CREATED_TS_MS = tool.CREATED_TS_MS;
        let ACTIVE = tool.ACTIVE;
        let AGENT_ACCESS = tool.AGENT_ACCESS;
        let NAME = tool.NAME;
        let MODIFIED_TS_MS = tool.MODIFIED_TS_MS;
        let STATUS = tool.STATUS;
        let SCHEMA = tool.SCHEMA;
        let DESCRIPTION = tool.DESCRIPTION;
        let SOURCE = tool.SOURCE;
        let UUID = tool.UUID;

        $scope.isToolEdit = true;

        $scope.toolPopUpHeading = 'Edit Tool';
        $("#toolVariablesRow").hide();
        $("#toolVariableInputs").empty();

        document.body.classList.add("bodyscroll-fixed");
        const schemaStrRaw = STATIC_PAYLOAD || $scope.decodeBase64("{}");
        let parsedSchema = {};
        try {
            const decoded = schemaStrRaw;
            parsedSchema = JSON.parse(decoded);
        } catch (e) {
            console.warn("Invalid schema JSON", e);
        }

        const mcpId = parsedSchema?.mcpId || "";
        const trueFqn = FQN.startsWith("packages.") ? FQN : parsedSchema?.["*fqn"] || "";
        const ragID = parsedSchema?.ragID || "";
        const isMCP = SOURCE === 'MCP' || mcpId !== "";
        const isKB = ragID !== "";

        $scope.toolType = isMCP ? 'mcp' : (isKB ? 'kb' : 'api');
        $scope.onToolTypeChange();

        const $select = $('#aiToolsAdd_api');
        if ($select.data('select2')) $select.select2('destroy');
        $select.empty();

        if ($scope.toolType === 'api') {
            populateAITools($scope.treePackages);
        } else if ($scope.toolType === 'mcp') {
            ($scope.spec.MCPs || []).forEach(mcp => {
                $select.append(
                    `<option value="${mcp.UUID}" title="${mcp.MCP_NAME}" data-endpoint="${mcp.MCP_ENDPOINT || ''}">${mcp.MCP_NAME}</option>`
                );
            });
        } else {
            $scope.spec.KBs.forEach(kb => {
                $select.append(
                    `<option value="${kb.ragID}" title="${kb.name}">${kb.name}</option>`
                );
            });
        }

        $select.select2({
            placeholder: $scope.toolType === 'kb' ? 'Select KB' : ($scope.toolType === 'mcp' ? 'Select MCP' : 'Select API'),
            tags: true,
            width: '100%',
            allowClear: true
        }).prop("disabled", true);

        $select.val($scope.toolType === 'kb' ? ragID : ($scope.toolType === 'mcp' ? mcpId : trueFqn)).trigger('change');
        $scope.selectedFqn = $scope.toolType === 'kb' ? ragID : ($scope.toolType === 'mcp' ? mcpId : trueFqn);

        const decodedDesc = DESCRIPTION;
        tool.functionDescriptionDecoded = decodedDesc;
        $("#tool_edit_description").val(decodedDesc);
        $("#tool_edit_id").val(UUID || "");
        $("#tool_edit_name").val(NAME);
        $("#tool_mcp_name").val($scope.toolType === 'mcp' ? FQN : "");

        // ── Static Payload editor ──────────────────────────────────────────
        // SCHEMA holds the field definitions; STATIC_PAYLOAD holds saved values.
        // SCHEMA is the separate schema string on the tool.
        let schema = {};
        try {
            schema = JSON.parse(SCHEMA || '{}');
        } catch(e) {
            console.warn("Invalid SCHEMA JSON", e);
        }

        if (!schema.properties || Object.keys(schema.properties).length === 0) {
            schema = _schemaFromPayload(parsedSchema);
        }

        _mountToolPayloadEditor(schema, parsedSchema);

        document.getElementById("overlay-tool").classList.add("open");
        document.getElementById("bgOverlayTool").classList.add("active");
    };

    $scope.completeToolEdit = function () {
        $scope.saveInProgress = true;
        // document.body.classList.remove("bodyscroll-fixed");

        setTimeout(() => {
            const toolName = $("#tool_edit_name").val().trim();
            const selectedFqn = $("#aiToolsAdd_api").val();
            const mcpToolName = $("#tool_mcp_name").val().trim();
            const description = $("#tool_edit_description").val().trim();

            if (!toolName) {
                swal({
                    title: "Missing Name",
                    text: "Please enter tool name.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (toolName.length > 99) {
                swal({
                    title: "Name Too Long",
                    text: "Try using a more concise name.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (!selectedFqn) {
                swal({
                    title: "Missing Tool",
                    text: "Please select API/KB/MCP.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if ($scope.toolType === 'mcp' && !mcpToolName) {
                swal({
                    title: "Missing Tool Name",
                    text: "Please enter MCP tool name.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (!description) {
                swal({
                        title: "Missing Description",
                        text: "Please enter a Description.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if ($scope.toolType === 'mcp') {
                const selectedMcpOption = $("#aiToolsAdd_api option:selected");

                // const staticPayload = JSON.stringify({
                //     mcpId: selectedFqn,
                //     mcpName: selectedMcpOption.text().trim(),
                //     mcpEndpoint: selectedMcpOption.attr("data-endpoint") || ""
                // });

                const staticPayload = $("#tool_mcp_static_payload").val().trim() || "";
                const schema = $("#tool_mcp_schema").val().trim() || "{}";
                const registryUuid = ($("#tool_edit_id").val() || "").trim();

                const onSuccess = function (response) {
                    if (response?.status === 'failed') {
                        const backendMessage = response.error || response.message || "Failed to save MCP tool.";
                        $scope.saveInProgress = false;
                        $scope.$applyAsync();
                        $timeout(function () {
                            swal({
                                title: "Error",
                                text: backendMessage,
                                type: "error",
                                confirmButtonColor: "#f2533e"
                            });
                        }, 100);
                        return;
                    }

                    $scope.$applyAsync(function () {
                        $scope.saveInProgress = false;
                        console.log("MCP tool registry saved successfully:", response);
                        $scope.closeOverlayTool();
                    });

                swal({
                        title: "Success",
                        text: registryUuid
                            ? "Tool updated successfully."
                            : "Tool created successfully.",
                        type: "success",
                        confirmButtonColor: "#2C61F5"
                    });
                };

                const onError = function (xhr, status, error) {
                    const backendMessage = xhr?.responseJSON?.message || xhr?.responseJSON?.error || xhr?.responseText || error || "Failed to save MCP tool.";
                    $scope.$applyAsync(function () {
                        $scope.saveInProgress = false;
                        swal({
                                title: "Error",
                                text: backendMessage,
                                type: "error",
                                confirmButtonColor: "#f2533e"
                            });
                    });
                };

                if (registryUuid) {
                    SYNCLOOP_AI.TOOLS_REGISTRY.updateRegistry(
                        registryUuid, toolName, description, mcpToolName, schema, staticPayload, "PRIVATE", "ACTIVE", "MCP", selectedFqn,
                        function (response) {
                            const idx = ($scope.spec.ToolsRegistry || []).findIndex(t => t.UUID === registryUuid);
                            if (idx !== -1) {
                                $scope.spec.ToolsRegistry[idx].NAME           = toolName;
                                $scope.spec.ToolsRegistry[idx].DESCRIPTION    = description;
                                $scope.spec.ToolsRegistry[idx].FQN            = mcpToolName;
                                $scope.spec.ToolsRegistry[idx].SCHEMA         = schema;
                                $scope.spec.ToolsRegistry[idx].STATIC_PAYLOAD = staticPayload;
                                $scope.spec.ToolsRegistry[idx].SOURCE         = "MCP";
                            }
                            onSuccess(response);
                        },
                        onError
                    );
                } else {
                    SYNCLOOP_AI.TOOLS_REGISTRY.saveRegistry(
                        toolName, description, mcpToolName, schema, staticPayload, "PRIVATE", "ACTIVE", "MCP", selectedFqn,
                        function (response) {
                            if (response?.status !== 'success') {
                                onSuccess(response);
                                return;
                            }
                            $scope.spec.ToolsRegistry = $scope.spec.ToolsRegistry || [];
                            $scope.spec.ToolsRegistry.push({
                                UUID:           generateUUID(),
                                NAME:           toolName,
                                DESCRIPTION:    description,
                                FQN:            mcpToolName,
                                SCHEMA:         schema,
                                STATIC_PAYLOAD: staticPayload,
                                SOURCE:         "MCP",
                                STATUS:         "ACTIVE",
                                AGENT_ACCESS:   "PRIVATE",
                                MCP_ID:         selectedFqn,
                                mcp:            ($scope.spec.MCPs || []).find(m => m.UUID === selectedFqn) || {}
                            });
                            onSuccess(response);
                        },
                        onError
                    );
                }

                return;
            }

            const selectedFqnExtension = $("#aiToolsAdd_api option:selected").attr("title");
            const createNewToolWithSchema = !!selectedFqnExtension;

            if (!createNewToolWithSchema) {
                const staticPayload = $("#tool_static_json_payload").val().trim() || "";
                const registryUuid = ($("#tool_edit_id").val() || "").trim();

                SYNCLOOP_AI.TOOLS_REGISTRY.saveRegistry(
                    toolName, description, selectedFqn, {}, staticPayload, "PRIVATE", "ACTIVE", "SL_API", null,
                    function (response) {
                        $scope.$applyAsync(function () {
                            $scope.saveInProgress = false;
                            console.log("Tool registry saved successfully:", response);
                            if (response?.status !== 'failed') {
                                if (!registryUuid) {
                                    $scope.spec.ToolsRegistry = $scope.spec.ToolsRegistry || [];
                                    $scope.spec.ToolsRegistry.push({
                                        UUID:           response?.uuid || generateUUID(),
                                        NAME:           toolName,
                                        DESCRIPTION:    description,
                                        FQN:            selectedFqn,
                                        SCHEMA:         "{}",
                                        STATIC_PAYLOAD: staticPayload,
                                        SOURCE:         "SL_API",
                                        STATUS:         "ACTIVE",
                                        AGENT_ACCESS:   "PRIVATE"
                                    });
                                    swal({
                                        title: "Success",
                                        text: "Tool added successfully.",
                                        type: "success",
                                        confirmButtonColor: "#2C61F5"
                                    });
                                } else {
                                    const idx = ($scope.spec.ToolsRegistry || []).findIndex(t => t.UUID === registryUuid);
                                    if (idx !== -1) {
                                        $scope.spec.ToolsRegistry[idx].NAME           = toolName;
                                        $scope.spec.ToolsRegistry[idx].DESCRIPTION    = description;
                                        $scope.spec.ToolsRegistry[idx].FQN            = selectedFqn;
                                        $scope.spec.ToolsRegistry[idx].STATIC_PAYLOAD = staticPayload;
                                    }
                                    swal({
                                        title: "Success",
                                        text: "Tool updated successfully.",
                                        type: "success",
                                        confirmButtonColor: "#2C61F5"
                                    });
                                }
                            }
                            $scope.closeOverlayTool();
                        });
                    },
                    function (xhr, status, error) {
                        const backendMessage = xhr?.responseJSON?.message || xhr?.responseJSON?.error || xhr?.responseText || error || "Failed to save tool.";
                        $scope.$applyAsync(function () {
                            $scope.saveInProgress = false;
                            console.error("Failed to save tool registry:", xhr?.responseText || error, xhr);
                            swal({
                                title: "Error",
                                text: backendMessage,
                                type: "error",
                                confirmButtonColor: "#f2533e"
                            });
                        });
                    }
                );

                return;
            }

            processToolInputsAndSaveForRegistry(
                $("#tool_edit_id").val(),
                selectedFqn,
                toolName,
                description,
                "SL_API",
                function onSuccess() {
                    $scope.saveInProgress = false;
                    $scope.closeOverlayTool();
                    $scope.$applyAsync();
                },
                function onError(xhr, status, error) {
                    const backendMessage = xhr?.responseJSON?.message || xhr?.responseJSON?.error || xhr?.responseText || error || "Failed to save tool with schema.";
                    swal({
                        title: "Error",
                        text: backendMessage,
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                    $scope.saveInProgress = false;
                    $scope.$applyAsync();
                }
            );
        }, 0);
    };

    function processToolInputsAndSaveForRegistry(uuid, selectedFqn, toolName, description, source, successCallback, errorCallback) {
        $scope.saveInProgress = true;

        try {
            let assignedVars = $scope.getToolStaticPayload() || {};

            let fqn;
            let schemaOverride = null;
            let rag = undefined;

            if ($scope.toolType === 'kb') {
                fqn = "packages.Awareness.assistant.tools.searchKnowledgeBase";
                rag = $("#aiToolsAdd_api").val();
                schemaOverride = {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "object",
                    "properties": { "searchText": { "type": "string" } },
                    "required": ["searchText"]
                };
            } else {
                fqn = selectedFqn;
            }

            if (rag) assignedVars.ragID = rag;
            _resolveCurrentToolSchemaAndPayload(fqn, schemaOverride, assignedVars).then(({ schema, staticPayload }) => {
                const schemaToSave = schema || {};

                if (uuid.trim() == "") {
                    SYNCLOOP_AI.TOOLS_REGISTRY.saveRegistry(
                        toolName, description, fqn, schemaToSave, staticPayload, "PRIVATE", "ACTIVE", source, null,
                        function (response) {
                            $scope.$applyAsync(function () {
                                if (response.status === "failed") {
                                    console.error("Failed to save tool registry with schema:", response);
                                    swal({ title: "Error", text: response.error, type: "error", confirmButtonColor: "#f2533e" });
                                } else {
                                    console.log("Tool registry with schema saved successfully:", response);
                                    $scope.spec.ToolsRegistry = $scope.spec.ToolsRegistry || [];
                                    $scope.spec.ToolsRegistry.push({
                                        UUID:           response?.uuid || generateUUID(),
                                        NAME:           toolName,
                                        DESCRIPTION:    description,
                                        FQN:            fqn,
                                        SCHEMA:         JSON.stringify(schemaToSave),
                                        STATIC_PAYLOAD: staticPayload,
                                        SOURCE:         source,
                                        STATUS:         "ACTIVE",
                                        AGENT_ACCESS:   "PRIVATE"
                                    });
                                   swal({
                                        title: "Success",
                                        text: "Tool added successfully.",
                                        type: "success",
                                        confirmButtonColor: "#2C61F5"
                                    });
                                    if (typeof successCallback === "function") successCallback();
                                }
                                $scope.saveInProgress = false;
                            });
                        },
                        function (xhr, status, error) {
                            $scope.$applyAsync(function () {
                                $scope.saveInProgress = false;
                                console.error("Failed to save tool registry with schema:", xhr?.responseText || error, xhr);
                                if (typeof errorCallback === "function") errorCallback(xhr, status, error);
                            });
                        }
                    );
                } else {
                    SYNCLOOP_AI.TOOLS_REGISTRY.updateRegistry(
                        uuid, toolName, description, fqn, schemaToSave, staticPayload, "PRIVATE", "ACTIVE", source, null,
                        function (response) {
                            $scope.$applyAsync(function () {
                                if (response.status === "failed") {
                                    console.error("Failed to save tool registry with schema:", response);
                                    swal({
                                        title: "Error",
                                        text: response.error,
                                        type: "error",
                                        confirmButtonColor: "#f2533e"
                                    });
                                } else {
                                    console.log("Tool registry with schema saved successfully:", response);
                                    const idx = ($scope.spec.ToolsRegistry || []).findIndex(t => t.UUID === uuid);
                                    if (idx !== -1) {
                                        $scope.spec.ToolsRegistry[idx].NAME           = toolName;
                                        $scope.spec.ToolsRegistry[idx].DESCRIPTION    = description;
                                        $scope.spec.ToolsRegistry[idx].FQN            = fqn;
                                        $scope.spec.ToolsRegistry[idx].SCHEMA         = JSON.stringify(schemaToSave);
                                        $scope.spec.ToolsRegistry[idx].STATIC_PAYLOAD = staticPayload;
                                        $scope.spec.ToolsRegistry[idx].SOURCE         = source;
                                    }
                                    swal({
                                        title: "Success",
                                        text: "Tool updated successfully.",
                                        type: "success",
                                        confirmButtonColor: "#2C61F5"
                                    });
                                    if (typeof successCallback === "function") successCallback();
                                }
                                $scope.saveInProgress = false;
                            });
                        },
                        function (xhr, status, error) {
                            $scope.$applyAsync(function () {
                                $scope.saveInProgress = false;
                                console.error("Failed to save tool registry with schema:", xhr?.responseText || error, xhr);
                                if (typeof errorCallback === "function") errorCallback(xhr, status, error);
                            });
                        }
                    );
                }
            }).catch(err => {
                console.error("Error while resolving current tool schema:", err);
                $scope.saveInProgress = false;
                if (typeof errorCallback === "function") {
                    errorCallback(null, null, err.message || "Unexpected error occurred while saving tool.");
                } else {
                    swal({
                        title: "Error",
                        text: "Unexpected error occurred while saving tool.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                }
                $scope.$applyAsync();
            });
        } catch (err) {
            console.error("Error in processing tool inputs:", err);
            $scope.saveInProgress = false;
            if (typeof errorCallback === "function") {
                errorCallback(null, null, err.message || "Unexpected error occurred while saving tool.");
            } else {
                swal({
                        title: "Error",
                        text: "Unexpected error occurred while saving tool.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
            }
            $scope.$applyAsync();
        }
    }

    $scope.toolType = 'api';

    function processToolInputsAndSave(selectedFqn, selectedAgent, successCallback, errorCallback) {
        $scope.saveInProgress = true;

        try {
            let assignedVars = $scope.getToolStaticPayload();

            let fqn;
            let schemaOverride = null;
            let rag = undefined;

            if ($scope.toolType === 'kb') {
                fqn = "packages.Awareness.assistant.tools.searchKnowledgeBase";
                rag = $("#aiToolsAdd").val();
                schemaOverride = {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "object",
                    "properties": {
                        "searchText": { "type": "string" }
                    },
                    "required": ["searchText"]
                };
            } else {
                fqn = $("#aiToolsAdd").val();
            }

            assignedVars["*fqn"] = fqn;
            if (rag) assignedVars.ragID = rag;

            const staticPayload = JSON.stringify(assignedVars);
            const stringifiedSchema = JSON.stringify(schemaOverride || {});

            const description = $("#tool_edit_description").val();
            const toolName = $("#tool_edit_name").val();
            const encodedDesc = $scope.utf8Base64Encode(description);

            const newTool = {
                inputJSONSchema: $scope.encodeBase64(stringifiedSchema),
                fqn: toolName,
                identifier: selectedAgent || generateUUID(),
                functionDescription: encodedDesc,
                editing: false,
                functionDescriptionDecoded: description,
                inputJSONSchemaDecoded: stringifiedSchema,
                staticJsonPayload: $scope.encodeBase64(staticPayload),
                toolType: $scope.toolType
            };

            SYNCLOOP_AI.TOOLS.upsertTool(
                newTool.identifier, newTool.fqn,
                staticPayload, stringifiedSchema, encodedDesc,
                function () {
                    $scope.spec.Tools.push(newTool);
                    $scope.saveInProgress = false;
                    if (typeof successCallback === "function") successCallback();
                    else {
                        document.getElementById("overlay-tool").classList.remove("open");
                        document.getElementById("bgOverlayTool").classList.remove("active");
                    }
                    $scope.$applyAsync();
                },
                function () {
                    $scope.saveInProgress = false;
                    if (typeof errorCallback === "function") errorCallback();
                    else swal({
                        title: "Error",
                        text: "Failed to save tool. Please try again.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });

                    $scope.$applyAsync();
                }
            );
        } catch (err) {
            console.error("Error in processing tool inputs:", err);
            $scope.saveInProgress = false;
            if (typeof errorCallback === "function") errorCallback();
            else swal({
                title: "Error",
                text: "Unexpected error occurred while saving tool.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });

            $scope.$applyAsync();
        }
    }

    $scope.createToolFromModal = function(form){
        form.$setSubmitted();
        if (form.registryTool) {
            form.registryTool.$setViewValue($scope.toolForm.registryUUID);
        }
        if(form.$invalid){
            return;
        }

        $scope.toolForm.staticPayload = $scope.getToolStaticPayload();

        const registryUUID = $scope.toolForm.registryUUID;

        const registryTool = ($scope.spec.ToolsRegistry || [])
            .find(t => t.UUID === registryUUID);

        if(!registryTool){
            swal({
                    title: "Error",
                    text: "Tool registry entry not found",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
            return;
        }

        let authInfo = "{}";
        const isKnowledgeBaseRegistryTool = _isKnowledgeBaseRegistryTool(registryTool);
        const shouldSendEmptyStaticPayload = !isKnowledgeBaseRegistryTool && !!$scope.toolForm.skipStaticPayload;
        const shouldSendEmptyAuthInfo = !!$scope.toolForm.skipAuthInfo;

        if(registryTool.SOURCE === 'MCP' && !shouldSendEmptyAuthInfo){
            authInfo = buildAgentToolAuthInfo($scope.toolForm.mcpAuth);
        }

        const saveAgentTool = function(schemaText, staticPayloadText) {
            const payload = {
                toolId: registryTool.UUID,
                agentId: $scope.currentAgent?.identifier,
                staticPayload: staticPayloadText,
                agentSchema: schemaText,
                description: $scope.toolForm.description,
                active: true,
                authInfo: authInfo,
                status: "ACTIVE"
            };

            $http.post(
                window.ENV.API_BASE_URL +
                "/tenant/" + localStorage.getItem("tenant") +
                "/packages.Awareness.dashboard.services.api.agent_tools.save.main",
                payload,
                {
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                        "Content-Type": "application/json"
                    }
                }
            ).then(function(response){

                if(response.data && response.data.status === "success"){
                    SYNCLOOP_AI.CORE.initialize();
                    swal({
                        title: "Success",
                        text: "Tool added successfully",
                        type: "success",
                        confirmButtonColor: "#2C61F5"
                    });
                    $scope.closetoolBox();

                    $scope.spec.AgentTools = $scope.spec.AgentTools || [];

                    $scope.spec.AgentTools.push({
                        UUID: response.data.uuid,
                        AGENT_ID: $scope.currentAgent.identifier,
                        STATIC_PAYLOAD: staticPayloadText,
                        STATUS: "ACTIVE",
                        ACTIVE: true,
                        TOOL_ID: registryTool.UUID,
                        DESCRIPTION: $scope.toolForm.description,
                        AUTH_INFO: authInfo,
                        AGENT_SCHEMA: schemaText,
                        tools_registry: registryTool
                    });

                    $scope.$applyAsync();

                }else{

                    console.error("API error:", response.data);

                  swal({
                            title: "Error",
                            text: response.data?.error || "Failed to save tool",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });

                }

            });
        };

        if (shouldSendEmptyStaticPayload) {
            saveAgentTool("{}", "{}");
            return;
        }

        if (isKnowledgeBaseRegistryTool) {
            saveAgentTool(registryTool.SCHEMA || "{}", registryTool.STATIC_PAYLOAD || "{}");
            return;
        }

        let staticPayload = $scope.getToolStaticPayload() || {};

        _resolveCurrentToolSchemaAndPayload(registryTool.FQN, null, staticPayload).then(({ schema, staticPayload: staticPayloadText }) => {
            const schemaText = typeof registryTool.SCHEMA === 'string'
                ? registryTool.SCHEMA
                : JSON.stringify(registryTool.SCHEMA || schema || {});
            saveAgentTool(schemaText || "{}", staticPayloadText || "{}");
        }).catch(err => {
            console.error("Failed to resolve current agent tool schema:", err);
            swal({
                title: "Error",
                text: err?.message || "Failed to prepare tool payload.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
        });

    };

    $scope.removeAgentTool = function (tool) {
        if (!tool || !$scope.currentAgent) return;

        swal({
            title: "Are you sure?",
            text: "Once you click 'Yes'. The tool will be permanently removed from this agent and cannot be recovered",
            imageUrl: "Awareness/pub/images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
        }, function () {

            swal({
                title: "Deleting...",
                text: "Please wait while we remove this tool.",
                type: "info",
                showConfirmButton: false,
                confirmButtonColor: "#2C61F5",
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            SYNCLOOP_AI.AGENT_TOOL.deleteAgentTool(
                tool.UUID,
                function onOk(response) {
                    $scope.spec.AgentTools = ($scope.spec.AgentTools || []).filter(function (t) {
                        return t.UUID !== tool.UUID;
                    });

                    $scope.$applyAsync();

                    swal({
                        title: "Deleted",
                        text: "Tool removed successfully!",
                        type: "success",
                        confirmButtonColor: "#2C61F5"
                    });
                },
                function onErr(xhr) {
                    $scope.$applyAsync();
                    swal({
                        title: "Failed",
                        text: (xhr && xhr.responseText) || "Failed to remove the tool.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                }
            );
        });

        setTimeout(function () {
            var confirmBtn = document.querySelector('.confirm');
            var cancelBtn  = document.querySelector('.cancel');

            function removeCustomBtnClass() {
                if (confirmBtn) confirmBtn.classList.remove('custom-delete-btn');
            }

            if (confirmBtn) {
                confirmBtn.classList.add('custom-delete-btn');
                confirmBtn.addEventListener('click', removeCustomBtnClass);
            }
            if (cancelBtn) {
                cancelBtn.addEventListener('click', removeCustomBtnClass);
            }
        }, 0);
    };

    $scope.openAgentToolAuthEdit = function(tool) {
        if (!tool || !tool.tools_registry || tool.tools_registry.SOURCE !== 'MCP') {
            return;
        }

        const parsedAuth = buildMcpAuthConfigFromAuthInfo(tool.AUTH_INFO);
        $scope.currentEditingAgentTool = tool;
        $scope.toolAuthEdit = {
            id: tool.UUID,
            name: (tool.tools_registry && tool.tools_registry.NAME) || 'MCP Tool',
            skipAuthInfo: parsedAuth.skipAuthInfo,
            mcpAuth: parsedAuth.mcpAuth
        };

        document.getElementById("overlay-tool-auth").classList.add("open");
        document.getElementById("bgOverlayToolAuth").classList.add("active");
        document.body.classList.add("bodyscroll-fixed");
        $scope.$applyAsync();
    };

    $scope.saveAgentToolAuthEdit = function() {
        if (!$scope.toolAuthEdit || !$scope.toolAuthEdit.id) {
            return;
        }

        var authInfo = "{}";
        var validate = !$scope.toolAuthEdit.skipAuthInfo;

        if (!$scope.toolAuthEdit.skipAuthInfo) {
            authInfo = buildAgentToolAuthInfo($scope.toolAuthEdit.mcpAuth);
        }

        SYNCLOOP_AI.AGENT_TOOL.updateAuthInfo(
            $scope.toolAuthEdit.id,
            authInfo,
            validate,
            function(response) {
                if (response && (response.status === "failed" || response.error)) {
                    swal({
                        title: "Error",
                        text: response.error?.error_detail || response.error?.error_name || response.error || "Failed to update authentication.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                    return;
                }

                if ($scope.currentEditingAgentTool) {
                    $scope.currentEditingAgentTool.AUTH_INFO = authInfo;
                }

                $scope.closeOverlayToolAuth();
                $scope.$applyAsync();
                swal({
                    title: "Success",
                    text: "Tool authentication updated successfully.",
                    type: "success",
                    confirmButtonColor: "#2C61F5"
                });
            },
            function(xhr) {
                swal({
                    title: "Error",
                    text: (xhr && (xhr.responseJSON?.error || xhr.responseJSON?.error?.error_detail || xhr.statusText)) || "Failed to update authentication.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
            }
        );
    };

    $scope.onToolRegistrySelect = function(registryUUID) {
        if (!registryUUID) {
            $scope.toolForm.skipStaticPayload = false;
            $scope.toolForm.skipAuthInfo = false;
            $scope.toolForm.selectedToolSource = 'SL_API';
            $scope.toolForm.hideStaticPayloadEditor = false;
            $scope.toolForm.mcpAuth = getDefaultMcpAuthConfig();
            $('#toolVariablesRow').hide();
            return;
        }

        const selected = ($scope.spec.ToolsRegistry || []).find(t => t.UUID === registryUUID);
        if (!selected) return;

        $scope.toolForm.selectedToolSource = selected.SOURCE || 'SL_API';
        $scope.toolForm.skipStaticPayload = false;
        $scope.toolForm.skipAuthInfo = false;
        $scope.toolForm.hideStaticPayloadEditor = _isKnowledgeBaseRegistryTool(selected);

        if (selected.SOURCE === 'MCP') {
            const mcpId = selected.MCP_ID || selected.mcp?.UUID || selected.mcp?.MCP_ID;
            const currentMcp = ($scope.spec.MCPs || []).find(m => m.UUID === mcpId || m.MCP_ID === mcpId);
            const mcp = currentMcp || selected.mcp;
            const parsedAuth = buildMcpAuthConfigFromAuthInfo(mcp && mcp.AUTH_INFO);
            $scope.toolForm.mcpAuth = parsedAuth.mcpAuth;
        }

        $scope.toolForm.description = selected.DESCRIPTION || '';

        let schema = selected.SCHEMA;
        if (typeof schema === 'string') {
            try { schema = JSON.parse(schema); } catch(e) { schema = {}; }
        }

        if (!schema.properties || Object.keys(schema.properties).length === 0) {
            $('#toolVariablesRow').hide();

            const c = document.getElementById('toolVariableInputs');
            if (c) {
                c.innerHTML = '';
                c._payloadData = null;
                c._payloadSchema = null;
            }
            return;
        }

        if ($scope.toolForm.hideStaticPayloadEditor) {
            $('#toolVariablesRow').hide();
            const c = document.getElementById('toolVariableInputs');
            if (c) {
                c.innerHTML = '';
                c._payloadData = null;
                c._payloadSchema = schema;
            }
            $scope.$applyAsync();
            return;
        }

        let existingData = {};
        try {
            existingData = JSON.parse(selected.STATIC_PAYLOAD || '{}');
        } catch(e) {}

        _mountToolPayloadEditor(schema, existingData);

        $('#toolVariablesRow').show();
        $scope.$applyAsync();
    };

    // Infers a JSON schema from an existing payload object when SCHEMA is empty
    function _schemaFromPayload(payload) {
        if (!payload || typeof payload !== 'object') return {};

        function inferType(val) {
            if (val === null) return { type: 'string' };
            if (typeof val === 'boolean') return { type: 'boolean' };
            if (typeof val === 'number') return Number.isInteger(val) ? { type: 'integer' } : { type: 'number' };
            if (Array.isArray(val)) {
                const itemProp = val.length > 0 ? inferType(val[0]) : { type: 'string' };
                // If items are objects, build items schema
                if (itemProp.type === 'object') {
                    return { type: 'array', items: itemProp };
                }
                return { type: 'array', items: itemProp };
            }
            if (typeof val === 'object') {
                const props = {};
                for (const k in val) props[k] = inferType(val[k]);
                return { type: 'object', properties: props };
            }
            return { type: 'string' };
        }

        const properties = {};
        for (const key in payload) {
            properties[key] = inferType(payload[key]);
        }
        return { type: 'object', properties };
    }

    function _mountToolPayloadEditor(schema, existingData) {
        if (!schema || !schema.properties || Object.keys(schema.properties).length === 0) {
            _resetToolPayloadEditor();
            $('#toolVariablesRow').hide();
            return;
        }

        const container = document.getElementById('toolVariableInputs');
        PayloadEditor.render(container, schema, existingData || {});
        $('#toolVariablesRow').show();
    }

    $scope.getToolStaticPayload = function() {
        const container = document.getElementById('toolVariableInputs');
        return PayloadEditor.getValues(container);
    };

    $scope.getAgentTools = function(agent) {
        if (!agent || !agent.identifier) return [];
        if (!$scope.spec || !$scope.spec.AgentTools) return [];
        return $scope.spec.AgentTools.filter(function(t) {
            return t.AGENT_ID === agent.identifier;
        });
    };

    $scope.hasFqn = function(tool) {
        //  Check if it's a Tool Registry item (it will have a SOURCE property)
        if (tool.SOURCE) {
            return tool.SOURCE === 'MCP'; // Returns true for MCP
        }

        try {
            const payload = JSON.parse($scope.decodeBase64(tool.staticJsonPayload || ""));
            return payload["*fqn"];
        } catch (e) {
            return false;
        }
    };

    $scope.hasSLApi = function(tool) {
        return tool.SOURCE == 'SL_API';
    };
// KNOWLEDGE BASE UPDATE:

    $scope.isKnowledgeBaseTool = function(tool) {
        let fqn = "";

        // Case 1: SL_API (direct FQN)
        if (tool.FQN) {
            fqn = tool.FQN;
        }
        // Case 2: MCP (inside payload)
        else {
            try {
                const payload = JSON.parse($scope.decodeBase64(tool.staticJsonPayload || ""));
                fqn = payload["*fqn"] || "";
            } catch (e) {
                fqn = "";
            }
        }

        const kbFqns = [
            "packages.Awareness.assistant.api.searchKnowledgeBase",
            "packages.Awareness.assistant.tools.searchKnowledgeBase",
            "packages.Awareness.assistant.utils.searchKnowledgeBase"
        ];

        return kbFqns.includes(fqn);
    };

    $scope.getToolSource = function(tool) {

        if ($scope.isKnowledgeBaseTool(tool)) {
            return "KB";
        }

        if (tool.SOURCE === 'MCP') {
            return "MCP";
        }

        if (tool.SOURCE === 'SL_API') {
            return "SL_API";
        }

        return "";
    };


    $scope.getFqnPath = function(tool) {
        if ($scope.hasSLApi(tool)) {
            return tool.FQN.replace(/\./g, "/");
        }
        return "";
    };

    $scope.isLinkAvailable = function() {
        let app = $scope.getApp();
        if (null == app) {
            return false;
        }
        return app.appLink != null && app.appLink != '';
    }

    function refreshAppLlmDropdown(selectedLlmKey, attempt) {
        const $appLlm = $("#app_edit_llm");
        const llms = Array.isArray($scope.spec && $scope.spec.LLMs) ? $scope.spec.LLMs : [];
        const retryAttempt = typeof attempt === "number" ? attempt : 0;

        if ($appLlm.hasClass("select2-hidden-accessible")) {
            $appLlm.select2("destroy");
        }

        $appLlm.empty();
        $appLlm.append('<option value="" disabled>Select LLM</option>');

        if (!llms.length) {
            $appLlm.append('<option value="">Loading LLMs...</option>');
        } else {
            for (let i = 0; i < llms.length; i++) {
                const llm = llms[i];
                $appLlm.append(
                    `<option value="${llm.LLMkey}">${llm.displayName} (${llm.modelName})</option>`
                );
            }
        }

        $timeout(function () {
            $appLlm.select2({
                placeholder: "Select LLM",
                width: "100%",
                dropdownParent: $("#overlayApp")
            });

            if (selectedLlmKey) {
                $appLlm.val(selectedLlmKey).trigger('change');
            } else {
                $appLlm.val("").trigger('change');
            }
        }, 0);

        if (!llms.length && retryAttempt < 20) {
            $timeout(function () {
                refreshAppLlmDropdown(selectedLlmKey, retryAttempt + 1);
            }, 150);
        }
    }

    $scope.openAppEdit = function() {
        let app = $scope.getApp();
        $scope.openApp();
        $scope.addappPopUpHeading = 'Edit App';
        document.body.classList.add("bodyscroll-fixed");

        $("#app_edit_id").val($scope.appId);
        $("#app_edit_name").val(app.appName);
        $("#appLink").val(app.appLink);
        $("#app_edit_requirement").val(app.description);
        refreshAppLlmDropdown(app.LLMkey);
    }

    $scope.openApp = function() {
        $scope.addappPopUpHeading = 'Add App';
        document.getElementById("overlayApp").classList.add("open");
        document.getElementById("bgOverlayApp").classList.add("active");

        document.getElementById("app_edit_id").value = '';
        document.getElementById("app_edit_name").value = '';
        document.getElementById("app_edit_requirement").value = '';
        $("#appLink").val("");
        refreshAppLlmDropdown("");
    }

    $scope.getApp = function() {
        /*for (let i = 0 ; i < $scope.spec.Apps.length ; i++) {

            if ($scope.appId == $scope.spec.Apps[i].appId) {
                return $scope.spec.Apps[i];
            }
        }*/
        return $scope.selectedApp;
    }

    $scope.isValidUrl = function (string) {
        try {
            new URL(string);
            return true;
        } catch (err) {
            return false;
        }
    }

    $scope.findApp = function(appId) {
        for (let i = 0 ; i < $scope.spec.Apps.length ; i++) {

            if (appId == $scope.spec.Apps[i].appId) {
                return $scope.spec.Apps[i];
            }
        }
        return {
            appName: "N/A"
        };
    }

    $scope.isAppEdit = function() {
        return $("#app_edit_id").val() != ''
    }

    function sanitizeFQNName(name) {
        // Replace all non-alphanumeric characters (anything except a-z, A-Z, 0-9)
        // with underscores, and trim extra underscores if needed
        return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').trim();
    }

    $scope._removeLocalToolByKey = function(identifier, fqn) {
        if (!$scope.spec || !$scope.spec.Tools) return;
        for (let i = $scope.spec.Tools.length - 1; i >= 0; i--) {
            const t = $scope.spec.Tools[i];
            if (t && t.identifier === identifier && t.fqn === fqn) {
                $scope.spec.Tools.splice(i, 1);
            }
        }
    };

    $scope.countTeamsUsingPair = function(appId, managerId, excludeTeamId) {
        if (!$scope.spec || !$scope.spec.Teams) return 0;
        return $scope.spec.Teams.filter(tm =>
            tm.appId === appId &&
            tm.managerId === managerId &&
            (!excludeTeamId || tm.teamID !== excludeTeamId)
        ).length;
    };

    $scope.isAppManagerPairUsedByAnyTeam = function(appId, managerId, excludeTeamId) {
        return $scope.countTeamsUsingPair(appId, managerId, excludeTeamId) > 0;
    };

    $scope.addTeamToolBetweenAppAndManager = function(appId, managerId) {
        const App = ($scope.spec.Apps || []).find(a => a.appId === appId);
        const Manager = ($scope.spec.Agents || []).find(a => a.identifier === managerId);

        if (!App || !Manager) {
            console.warn("App or Manager not found for tool creation.", { appId, managerId });
            return;
        }

        const payloadStr = JSON.stringify({
            requesterAID: App.appId,
            servingAID: Manager.identifier,
            "*fqn": "packages.Awareness.assistant.tools.askAgent",
            name: Manager.name
        });

        const schemaStr = JSON.stringify({
            "$schema": "http://json-schema.org/draft-04/schema#",
            type: "object",
            properties: { prompt: { type: "string" } },
            required: ["prompt"]
        });

        const toolDescriptionStr =
            "This tool enables App `" + App.appName + "` to request help from Manager `" + Manager.name + "`.\n" +
            "Manager role description:\n" +
            $scope.decodeBase64(Manager.roleDescription || "");

        const fqn = "ask" + sanitizeFQNName(Manager.name);

        const newTool = {
            inputJSONSchema: $scope.encodeBase64(schemaStr),
            fqn: fqn,
            identifier: App.appId, // tool belongs to the APP
            functionDescription: $scope.encodeBase64(toolDescriptionStr),
            editing: true,
            functionDescriptionDecoded: toolDescriptionStr,
            inputJSONSchemaDecoded: schemaStr,
            staticJsonPayload: $scope.encodeBase64(payloadStr)
        };

        SYNCLOOP_AI.TOOLS.upsertTool(
            newTool.identifier,
            newTool.fqn,
            payloadStr,
            schemaStr,
            toolDescriptionStr,
            () => {
                $scope._removeLocalToolByKey(newTool.identifier, newTool.fqn);
                $scope.spec.Tools.push(newTool);
                $scope.$applyAsync();
            },
            (xhr, status, error) => {
                console.error("Team tool upsert failed for:", fqn, error);
            }
        );
    };

    $scope.ensureTeamTool = function(appId, managerId) {
        if (!appId || !managerId) return;
        $scope.addTeamToolBetweenAppAndManager(appId, managerId);
    };

    $scope.deleteTeamToolBetweenAppAndManager = function(appId, managerId) {
        const Manager = ($scope.spec.Agents || []).find(a => a.identifier === managerId);
        if (!Manager) {
            console.warn("Manager not found for deletion.", { managerId });
            return;
        }
        const fqn = "ask" + sanitizeFQNName(Manager.name);

        SYNCLOOP_AI.TOOLS.deleteTool(
            appId,
            fqn,
            () => {
                $scope._removeLocalToolByKey(appId, fqn);
                $scope.$applyAsync();
                $scope.reloadTree();
                // console.log("Team tool deleted:", fqn);
            },
            (xhr, status, error) => {
                console.error("Team tool delete failed:", fqn, error);
            }
        );
    };

    $scope.deleteTeamToolIfUnused = function(appId, managerId, excludeTeamId) {
        if (!appId || !managerId) return;
        if (!$scope.isAppManagerPairUsedByAnyTeam(appId, managerId, excludeTeamId)) {
            $scope.deleteTeamToolBetweenAppAndManager(appId, managerId);
        }
    };


    $scope.addTeamInApp = function(appIdentifier, agentId) {

        let App = null;

        for (let i = 0 ; i < $scope.spec.Apps.length ; i++) {
            if (appIdentifier == $scope.spec.Apps[i].appId) {
                App = $scope.spec.Apps[i];
            }
        }

        let Agent = null;

        for (let i = 0 ; i < $scope.spec.Agents.length ; i++) {
            if (agentId == $scope.spec.Agents[i].identifier) {
                Agent = $scope.spec.Agents[i];
            }
        }

        if (null == Agent || null == App) {

            return ;
        }

        const payload = JSON.stringify({
            "requesterAID": App.appId,
            "servingAID": Agent.identifier,
            "*fqn": "packages.Awareness.assistant.tools.askAgent",
            "name": "null"
        });

        const schema = JSON.stringify({
            "$schema": "http://json-schema.org/draft-04/schema#",
            "type": "object",
            "properties": {
                "prompt": {
                    "type": "string"
                }
            },
            "required": [
                "prompt"
            ]
        });

        const toolDescription = "This tool will allow you to use the support from the another Agent named " + Agent.name + ".\n" +
            "Following is the role description of the the agent: \n" +
            $scope.decodeBase64(App.description);

        var newTool = {
            inputJSONSchema: $scope.encodeBase64(schema),
            fqn: "ask" + sanitizeFQNName(Agent.name),
            identifier: App.appId,
            functionDescription: $scope.encodeBase64(toolDescription),
            editing: true,
            functionDescriptionDecoded: toolDescription,
            inputJSONSchemaDecoded: schema,
            staticJsonPayload: $scope.encodeBase64(payload)
        };

        $scope.spec.Tools.push(newTool);
    }

    $scope.addAgentToolBetweenAgents = function(agentId1, agentId2) {
        let Agent1 = null;
        let Agent2 = null;

        for (let i = 0 ; i < $scope.spec.Agents.length ; i++) {
            if (agentId1 == $scope.spec.Agents[i].identifier) {
                Agent1 = $scope.spec.Agents[i];
            }
            if (agentId2 == $scope.spec.Agents[i].identifier) {
                Agent2 = $scope.spec.Agents[i];
            }
        }

        if (!Agent1 || !Agent2) {
            console.warn("One or both agents not found.");
            return;
        }

        const payload = JSON.stringify({
            "requesterAID": agentId1,
            "servingAID": agentId2,
            "*fqn": "packages.Awareness.assistant.tools.askAgent",
            "name": Agent2.name
        });

        const schema = JSON.stringify({
            "$schema": "http://json-schema.org/draft-04/schema#",
            "type": "object",
            "properties": {
                "prompt": {
                    "type": "string"
                },
                "requesterAID": {
                    "type": "string"
                },
                "servingAID": {
                    "type": "string"
                },
                "*fqn": {
                    "type": "string"
                },
                "name": {
                    "type": "string"
                }
            }
        });

        const toolDescription = "This tool enables Agent `" + Agent1.name + "` to leverage the capabilities of Agent `" + Agent2.name + "`.\n" +
            "Role description of the serving agent:\n" +
            $scope.decodeBase64(Agent2.roleDescription);

        const newTool = {
            inputJSONSchema: $scope.encodeBase64(schema),
            fqn: "ask" + sanitizeFQNName(Agent2.name),
            identifier: Agent1.identifier,
            functionDescription: $scope.encodeBase64(toolDescription),
            editing: true,
            functionDescriptionDecoded: toolDescription,
            inputJSONSchemaDecoded: schema,
            staticJsonPayload: $scope.encodeBase64(payload)
        };

        SYNCLOOP_AI.TOOLS_REGISTRY.saveRegistry("ask" + sanitizeFQNName(Agent2.name),
            toolDescription, "packages.Awareness.assistant.tools.askAgent",
            schema, payload, "PRIVATE",
            "ACTIVE", "SL_API", null, function (response) {
                if (response?.status === "failed") {
                    swal({
                        title: "Error",
                        text: response.error || "Failed to save tool registry",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                    return;
                }

                const registryUuid = response?.uuid || response?.UUID;
                if (!registryUuid) {
                    swal({
                        title: "Error",
                        text: "Tool registry saved without a UUID.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                    return;
                }
                const authInfo = "{}";
                const registryTool = {
                    UUID: registryUuid,
                    NAME: "ask" + sanitizeFQNName(Agent2.name),
                    DESCRIPTION: toolDescription,
                    FQN: "packages.Awareness.assistant.tools.askAgent",
                    SCHEMA: schema,
                    STATIC_PAYLOAD: payload,
                    SOURCE: "SL_API",
                    STATUS: "ACTIVE",
                    AGENT_ACCESS: "PRIVATE"
                };

                const agentToolPayload = {
                    toolId: registryUuid,
                    agentId: Agent1.identifier,
                    staticPayload: payload, // ✅ correct now
                    agentSchema: schema,
                    description: toolDescription,
                    active: true,
                    authInfo: "{}",
                    status: "ACTIVE"
                };

                $http.post(
                    window.ENV.API_BASE_URL +
                    "/tenant/" + localStorage.getItem("tenant") +
                    "/packages.Awareness.dashboard.services.api.agent_tools.save.main",
                    agentToolPayload,
                    {
                        headers: {
                            "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                            "Content-Type": "application/json"
                        }
                    }
                ).then(function(response){

                    if(response.data && response.data.status === "success"){

                        swal({
                            title: "Success",
                            text: "Tool added successfully",
                            type: "success",
                            confirmButtonColor: "#2C61F5"
                        });
                        $scope.closetoolBox();

                        $scope.spec.AgentTools = $scope.spec.AgentTools || [];

                        $scope.spec.AgentTools.push({
                            UUID: response.data.uuid,
                            AGENT_ID: Agent1.identifier,
                            STATIC_PAYLOAD: JSON.stringify(payload),
                            STATUS: "ACTIVE",
                            ACTIVE: true,
                            TOOL_ID: registryTool.UUID,
                            DESCRIPTION: toolDescription,
                            AUTH_INFO: authInfo,
                            AGENT_SCHEMA: JSON.stringify(schema),
                            tools_registry: registryTool
                        });

                        $scope.$applyAsync();

                    }else{

                        console.error("API error:", response.data);

                        swal({
                            title: "Error",
                            text: response.data?.error || "Failed to save tool",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });

                    }

                });

            }, function (xhr, status, error) {
                console.error("Tool registry save failed for:", "ask" + sanitizeFQNName(Agent2.name), error);
            });

        /*SYNCLOOP_AI.TOOLS.upsertTool(
            newTool.identifier,
            newTool.fqn,
            payload,
            schema,
            toolDescription,
            function () {
                $scope.spec.Tools.push(newTool);
                $scope.$applyAsync();
            },
            function (xhr, status, error) {
                console.error("Tool upsert failed for:", tool.fqn, error);
            }
        );*/


    };

    $scope.deleteAgentToolBetweenAgents = function(agentId1, agentId2) {
        let Agent1 = null;
        let Agent2 = null;

        for (let i = 0; i < $scope.spec.Agents.length; i++) {
            if (agentId1 === $scope.spec.Agents[i].identifier) {
                Agent1 = $scope.spec.Agents[i];
            }
            if (agentId2 === $scope.spec.Agents[i].identifier) {
                Agent2 = $scope.spec.Agents[i];
            }
        }

        if (!Agent1 || !Agent2) {
            console.warn("One or both agents not found.");
            return;
        }

        const fqn = "ask" + sanitizeFQNName(Agent2.name);

        const toolIndex = $scope.spec.Tools.findIndex(tool =>
            tool.identifier === Agent1.identifier && tool.fqn === fqn
        );

        if (toolIndex > -1) {
            SYNCLOOP_AI.TOOLS.deleteTool($scope.spec.Tools[toolIndex].identifier,
                $scope.spec.Tools[toolIndex].fqn ,
                function (response) {
                    $scope.spec.Tools.splice(toolIndex, 1);
                    $scope.$applyAsync();
                    $scope.reloadTree();
                }, function (xhr, status, error) {

                })
            console.log("Tool deleted:", fqn);
        } else {
            console.warn("Tool not found for deletion:", fqn);
        }
    };

    $scope.reloadTree = function() {
        if (null == $scope.selectedApp) {
            return ;
        }
        const url = "/Awareness/tree-view.html?appId=" + $scope.selectedApp.appId + "&ts=" + Date.now();
        $scope.trustedUrl = $sce.trustAsResourceUrl(url);
        $scope.$applyAsync();
    }

    $scope.saveAppName = function () {

        let app = $scope.getApp();
        let appIdField = app.appId;

        var terminationAgentDescription = "You must ensure to achieved the following goal:\n" +
            "#{prompt}" +
            "!Important: You must reply with keyword \"SUBMIT-RESPONSE\" once the goal has achieved.\n" +
            "It will stop the work and send the final reply to the user. Response from previous agent mentioned below \n" +
            "#{response}";

        SYNCLOOP_AI.APPS.upsertApp(app.appId, $('#inputshowd').val()
            , $scope.decodeBase64(app.description), app.LLMkey, app.appLink,
            function (response) {
                if (isErrorResponse(response)) {
                    swal({
                        title: "Error",
                        text: getResponseErrorMessage(response, "Failed to update app."),
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                    $scope.$applyAsync();
                    return;
                }
                $scope.loadApps(function () {
                    $scope.$applyAsync();
                });
            },
            function (xhr) {
                swal({
                    title: "Error",
                    text: getAjaxErrorMessage(xhr, "Failed to update app."),
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.$applyAsync();
            });
    }

    //right side open on tab

    $scope.rightsideopen = function(){
        $scope.rightsideopened = true;
        $scope.agentoverlay = true;
    }
    $scope.rightsideclose = function(){
        $scope.rightsideopened = false;
        $scope.agentoverlay = false;
    }

    $scope.completeAddApp = function () {
        $scope.saveInProgress = true;
        document.body.classList.remove("bodyscroll-fixed");

        setTimeout(() => {
            var appName = $("#app_edit_name").val().trim();
            var appDescription = $("#app_edit_requirement").val().trim();
            var appLLM = $("#app_edit_llm").val();
            var appLink = $("#appLink").val().trim();

            if (appName === "") {
                swal({
                    title: "Missing Name",
                    text: "Please enter a Name for the App.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });

                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (appName.length > 99) {
                swal({
                    title: "Name Too Long",
                    text: "Try using a more concise name.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });

                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (appLink !== "" && !$scope.isValidUrl(appLink)) {
                swal({
                    title: "Invalid URL",
                    text: "Please enter a valid URL.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });

                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (appDescription === "") {
                swal({
                    title: "Missing Description",
                    text: "Please enter a Description for the App.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });

                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (!appLLM) {
                swal({
                    title: "Missing LLM",
                    text: "Please select an LLM from the dropdown.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });

                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            const appIdField = $("#app_edit_id").val().trim();

            if (appIdField === "") {
                const uuid = generateUUID();

                SYNCLOOP_AI.APPS.upsertApp(
                    uuid,
                    appName,
                    appDescription,
                    appLLM,
                    appLink,
                    function (response) {
                        if (isErrorResponse(response)) {
                            swal({
                                title: "Error",
                                text: getResponseErrorMessage(response, "Failed to create app."),
                                type: "error",
                                confirmButtonColor: "#f2533e"
                            });
                            $scope.saveInProgress = false;
                            $scope.$applyAsync();
                            return;
                        }
                        $scope.loadApps(function () {
                            $scope.reloadTree();
                            $scope.saveInProgress = false;
                            document.getElementById("overlayApp").classList.remove("open");
                            document.getElementById("bgOverlayApp").classList.remove("active");
                            $scope.$applyAsync();
                        });
                    },
                    function (xhr) {
                        swal({
                            title: "Error",
                            text: getAjaxErrorMessage(xhr, "Failed to create app."),
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });

                        $scope.saveInProgress = false;
                        $scope.$applyAsync();
                    }
                );

            } else {
                let updated = false;

                for (let i = 0; i < $scope.spec.Apps.length; i++) {
                    if (appIdField == $scope.spec.Apps[i].appId) {
                        const appId = $scope.spec.Apps[i].appId;

                        SYNCLOOP_AI.APPS.upsertApp(
                            appId,
                            appName,
                            appDescription,
                            appLLM,
                            appLink,
                            function (response) {
                                if (isErrorResponse(response)) {
                                    swal({
                                        title: "Error",
                                        text: getResponseErrorMessage(response, "Failed to update app."),
                                        type: "error",
                                        confirmButtonColor: "#f2533e"
                                    });

                                    $scope.saveInProgress = false;
                                    $scope.$applyAsync();
                                    return;
                                }
                                $scope.loadApps(function () {
                                    $scope.reloadTree();
                                    $scope.saveInProgress = false;
                                    document.getElementById("overlayApp").classList.remove("open");
                                    document.getElementById("bgOverlayApp").classList.remove("active");
                                    $scope.$applyAsync();
                                });
                            },
                            function (xhr) {
                                swal({
                                    title: "Error",
                                    text: getAjaxErrorMessage(xhr, "Failed to update app."),
                                    type: "error",
                                    confirmButtonColor: "#f2533e"
                                });

                                $scope.saveInProgress = false;
                                $scope.$applyAsync();
                            }
                        );

                        updated = true;
                        break;
                    }
                }

                if (!updated) {
                    swal({
                        title: "Update Error",
                        text: "App not found for update.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });

                    $scope.saveInProgress = false;
                    $scope.$applyAsync();
                }
            }
        }, 0);
    };

    $scope.getAppTeams = function() {
        const teams = [];

        for (let i = 0 ; i < $scope.spec.Teams.length ; i++) {
            if ($scope.spec.Teams[i].appId === $scope.appId) {
                teams.push($scope.spec.Teams[i]);
            }
        }
        return teams;
    }

    $scope.getAppAgents = function(app) {
        const agents = [];
        const teams = $scope.getAppTeams ? $scope.getAppTeams() : [];
        const allAgents = $scope.spec?.Agents || [];

        // Step 1: Match team-based agents
        for (let i = 0; i < teams.length; i++) {
            if (teams[i].appId === $scope.appId) {
                for (let j = 0; j < teams[i].Agents.length; j++) {
                    for (let k = 0; k < allAgents.length; k++) {
                        if (teams[i].Agents[j].identifier === allAgents[k].identifier) {
                            agents.push(allAgents[k]);
                        }
                    }
                }
            }
        }

        // Step 2: Match by identifier or appId
        for (let i = 0; i < allAgents.length; i++) {
            const agent = allAgents[i];
            if (agent.identifier === $scope.appId || agent.appId === $scope.appId) {
                if (!agents.some(a => a.identifier === agent.identifier)) {
                    agents.push(agent);
                }
            }
        }

        // Step 3: Include termination and report agents
        if (app) {
            const termAgentId = app.terminationAgent.identifier;
            const reportAgentId = app.reportingAgent.identifier;

            for (let i = 0; i < allAgents.length; i++) {
                const agent = allAgents[i];
                if (
                    agent.identifier === termAgentId ||
                    agent.identifier === reportAgentId
                ) {
                    if (!agents.some(a => a.identifier === agent.identifier)) {
                        agents.push(agent);
                    }
                }
            }
        }

        return agents;
    };

    $scope.getAppTools = function() {
        const tools = [];
        const teams = $scope.getAppTeams();

        for (let i = 0; i < teams.length; i++) {
            if (teams[i].appId === $scope.appId) {
                for (let j = 0; j < teams[i].Agents.length; j++) {
                    for (let k = 0; k < $scope.spec.Tools.length; k++) {
                        const tool = $scope.spec.Tools[k];

                        if (teams[i].Agents[j].identifier === tool.identifier) {

                            if (tool.functionDescriptionDecoded === undefined) {
                                tool.functionDescriptionDecoded = tool.functionDescription
                                    ? $scope.utf8Base64Decode(tool.functionDescription)
                                    : "";
                            }

                            tools.push(tool);
                        }
                    }
                }
            }
        }

        return tools;
    };


    //  agent character dropdown
    $timeout(function () {
        const trigger = document.getElementById("robotTrigger");
        const dropdown = document.getElementById("robotDropdown");

        // Toggle on trigger click
        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("show");
        });

        // Close when clicking outside
        document.addEventListener("click", (e) => {
            if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
                dropdown.classList.remove("show");
            }
        });

        // agent select dropdown
        const triggerfirst = document.getElementById("robotTriggerfirst");
        const dropdownfirst = document.getElementById("chatagentDropdown");

        // Toggle on trigger click
        triggerfirst.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdownfirst.classList.toggle("show");
        });

        // Close when clicking outside
        document.addEventListener("click", (e) => {
            if (!dropdownfirst.contains(e.target) && !triggerfirst.contains(e.target)) {
                dropdownfirst.classList.remove("show");
            }
        });

        // ✅ Close when clicking an item inside the box
        dropdownfirst.addEventListener('click', (e) => {
            if (e.target.closest('.icon-box')) {
                dropdownfirst.classList.remove("show");
            }
        });
    }, 0);



    $scope.isThinkingOpen = false;
    $scope.toggleThinking = function () {
        $scope.isThinkingOpen = !$scope.isThinkingOpen;
    };


    // plus icon show on collapse agent page
    $('.my-custom-collapse').on('show.bs.collapse', function () {
        $(this).prev('.card-header').find('.plusIcon').removeClass('d-none');
        $(this).prev('.card-header').find('.showtext_collapse').addClass('d-none');

        var scope = angular.element($('#chat_settingbox')).scope();
        $scope.safeApply(scope, function() {
            scope.showsettingBox = false;
        });
    });

    $('.my-custom-collapse').on('hide.bs.collapse', function () {
        $(this).prev('.card-header').find('.plusIcon').addClass('d-none');
        $(this).prev('.card-header').find('.showtext_collapse').removeClass('d-none');

        var scope1 = angular.element($('#collapsetools')).scope();
        $scope.safeApply(scope1, function() {
            scope1.showaddmodaltoolBox = false;
            scope1.showaddmodalpayloadbox = false;
            scope1.showaddmodalschemabox = false;
        });

        var scope2 = angular.element($('#collapsellm')).scope();
        $scope.safeApply(scope2, function() {
            scope2.showaddmodalllmBox = false;
        });
    });


    const btn = document.getElementById('moreBtn');
    const box = document.getElementById('moreBox');

    const trigger = document.getElementById('sharebox-agentlink');
    const dropdown = document.getElementById('shareagent_box');

// Toggle first dropdown
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        box.classList.toggle('is-open');

        // Close the other dropdown if open
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    });

// Toggle second dropdown
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('show');

        // Close the other dropdown if open
        if (box && box.classList.contains('is-open')) {
            box.classList.remove('is-open');
        }
    });


// Close on clicking outside
    document.addEventListener('click', (e) => {
        if (box && !box.contains(e.target) && !btn.contains(e.target)) {
            box.classList.remove('is-open');
        }
        if (dropdown && !dropdown.contains(e.target) && !trigger.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

// Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (box) box.classList.remove('is-open');
            if (dropdown) dropdown.classList.remove('show');
        }
    });





    $('#collapserag').on('show.bs.collapse', function (e) {
        if (e.target.id === 'collapserag') { // only outer collapse
            $(this).prev('.card-header').find('.plusIcon').removeClass('d-none');
            $(this).prev('.card-header').find('.showtext_collapse').addClass('d-none');
            var scope = angular.element($('#chat_settingbox')).scope();
            scope.$apply(function() {
                scope.showsettingBox = false;
            });
        }
    });

    $('#collapserag').on('hide.bs.collapse', function (e) {
        if (e.target.id === 'collapserag') { // only outer collapse
            $(this).prev('.card-header').find('.plusIcon').addClass('d-none');
            $(this).prev('.card-header').find('.showtext_collapse').removeClass('d-none');
            // Hide popup when collapse hides
            var scope = angular.element($('#collapserag')).scope();
            scope.$apply(function() {
                scope.showaddmodalragbaseBox = false;
            });
        }

    });

    $scope.showApiKey = {};

    $scope.toggleApiKeyVisibility = function(providerKey){
        $scope.showApiKey[providerKey] = !$scope.showApiKey[providerKey];
    };

    $scope.isThinkActive = false;

    $scope.toggleThink = function() {
        $scope.isThinkActive = !$scope.isThinkActive;
    };

    // toon collapse hide & show
    $('.collapse').on('show.bs.collapse', function () {
        $(this).prev('.card-header').find('.tons-first').addClass('d-none');
        $(this).prev('.card-header').find('.chat_settingbox-tabs').removeClass('d-none');

    });

    $('.collapse').on('hide.bs.collapse', function () {
        $(this).prev('.card-header').find('.tons-first').removeClass('d-none');
        $(this).prev('.card-header').find('.chat_settingbox-tabs').addClass('d-none');
    });


    $scope.isExpanded = false;
    $scope.toggleExpand = function() {
        $scope.isExpanded = !$scope.isExpanded;
    };




    // Tool functions
    $scope.addTool = function(agent) {
        var newTool = {
            inputJSONSchema: "",
            fqn: "",
            identifier: agent.identifier,
            functionDescription: "",
            editing: true,
            functionDescriptionDecoded: "",
            inputJSONSchemaDecoded: ""
        };
        $scope.spec.Tools.push(newTool);
    };
    $scope.editTool = function(tool) {
        tool.editing = true;
        tool.functionDescriptionDecoded = tool.functionDescription
            ? $scope.utf8Base64Decode(tool.functionDescription)
            : "";
        tool.inputJSONSchemaDecoded = $scope.decodeBase64(tool.inputJSONSchema);
    };
    $scope.doneEditTool = function(tool) {
        tool.functionDescription = utf8ToBase64(tool.functionDescriptionDecoded || "");
        tool.inputJSONSchema = utf8ToBase64(tool.inputJSONSchemaDecoded || "");
        tool.editing = false;
    };
    $scope.cancelEditTool = function(tool) {
        if (!tool.fqn) {
            var index = $scope.spec.Tools.indexOf(tool);
            $scope.spec.Tools.splice(index, 1);
        } else {
            tool.editing = false;
        }
    };

    $scope.deleteTool = function(tool) {
        swal({
            title: "Are you sure?",
            text: "Once you click 'Yes' this Tool will be permanently deleted and cannot be recovered",
            imageUrl: "Awareness/pub/images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
        }, function() {

            swal({
                title: "Deleting...",
                text: "Please wait while we delete this tool.",
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            SYNCLOOP_AI.TOOLS.deleteTool(tool.identifier, tool.fqn , function (response) {
                var index = $scope.spec.Tools.indexOf(tool);
                $scope.spec.Tools.splice(index, 1);
                $scope.$applyAsync();
                swal({
                    title: "Deleted",
                    text: "Tool deleted successfully!",
                    type: "success",
                    confirmButtonColor: "#2C61F5"
                });

            }, function (xhr, status, error) {

            })



        });
        setTimeout(function () {
            const confirmBtn = document.querySelector('.confirm');
            const cancelBtn = document.querySelector('.cancel');

            if (confirmBtn) {
                confirmBtn.classList.add('custom-delete-btn');
                confirmBtn.addEventListener('click', removeCustomBtnClass);
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', removeCustomBtnClass);
            }

            function removeCustomBtnClass() {
                confirmBtn?.classList.remove('custom-delete-btn');
            }
        }, 0);
    };
    //Tools

    //Update Static payload
    $scope.addRegistryPayloadEdit = function(tool) {
        $scope.isEditingRegistry = true;
        $scope.isEditingAgentTool = false;
        // We only need UUID as the unique identifier here
        $("#tool_edit_payload_id").val(tool.UUID);

        // Get the payload (default to empty JSON object if missing)
        let payloadText = tool.STATIC_PAYLOAD || "{}";

        // Format the JSON nicely with 4 spaces for the textarea
        try {
            let parsedJson = JSON.parse(payloadText);
            payloadText = JSON.stringify(parsedJson, null, 4);
        } catch (e) {
            console.warn("Payload is not valid JSON", e);
        }

        // Set the value in the textarea and open modal
        $("#tool_edit_payload_description").val(payloadText);
        $("#addUpdatePayloadModel").modal('show');
    };
// complete registry payload
    $scope.completeRegistryPayloadEdit = function() {
        // console.log("Its working");
        const payloadText = $("#tool_edit_payload_description").val();
        const editUuid = $("#tool_edit_payload_id").val();

        // 1. Validate JSON
        try {
            JSON.parse(payloadText);
        } catch (err) {
            swal({
                title: "Invalid JSON",
                text: "The payload must be valid JSON.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            return;
        }

        // 2. Find the matching tool in the Tool Registry array
        for (let i = 0; i < $scope.spec.ToolsRegistry.length; i++) {
            if (editUuid === $scope.spec.ToolsRegistry[i].UUID) {

                // 3. Call the Tool Registry API
                SYNCLOOP_AI.TOOLS_REGISTRY.updateStaticPayload(
                    editUuid,
                    payloadText,
                    function (response) {
                        // Update UI on success
                        $scope.spec.ToolsRegistry[i].STATIC_PAYLOAD = payloadText;
                        $scope.$applyAsync();

                        swal({
                            title: "Updated",
                            text: "Payload updated successfully!",
                            icon: "success",
                            confirmButtonColor: "#2C61F5"
                        });
                    },
                    function (xhr, status, error) {
                        console.error("Registry payload update failed", error);
                        swal({
                            title: "Error",
                            text: "Failed to update payload.",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });
                    }
                );
                break;
            }
        }

        // 4. Reset fields and hide the modal
        $("#tool_edit_payload_id").val("");
        $("#tool_edit_payload_description").val("");
        $("#addUpdatePayloadModel").modal('hide');
        $scope.isEditingRegistry = false;
        $scope.isEditingAgentTool = false;
    };

// 1. OPEN SCHEMA MODAL
    $scope.addRegistrySchemaEdit = function(tool) {
        $scope.isEditingRegistry = true; // Sets the flag for the HTML buttons
        $scope.isEditingAgentTool = false;

        $("#tool_edit_schema_id").val(tool.UUID);

        let schemaText = tool.SCHEMA || "{}";

        // Nicely format the JSON
        try {
            let parsedJson = JSON.parse(schemaText);
            schemaText = JSON.stringify(parsedJson, null, 4);
        } catch (e) { }

        $("#tool_edit_schema_description").val(schemaText);
        $("#addUpdateSchemaModel").modal('show');
    };

// 2. SAVE SCHEMA
    $scope.completeRegistrySchemaEdit = function() {
        const schemaText = $("#tool_edit_schema_description").val();
        const editUuid = $("#tool_edit_schema_id").val();

        // Validate JSON
        try {
            JSON.parse(schemaText);
        } catch (err) {
            swal({ title: "Invalid JSON", text: "The schema must be valid JSON.", type: "error", confirmButtonColor: "#f2533e" });
            return;
        }

        // Find and update the tool in your array
        for (let i = 0; i < $scope.spec.ToolsRegistry.length; i++) {
            if (editUuid === $scope.spec.ToolsRegistry[i].UUID) {

                // Call the API
                SYNCLOOP_AI.TOOLS_REGISTRY.updateSchema(
                    editUuid,
                    schemaText,
                    function (response) {
                        // Update UI instantly
                        $scope.spec.ToolsRegistry[i].SCHEMA = schemaText;
                        $scope.$applyAsync();

                        // Close modal and clear fields
                        $("#tool_edit_schema_id").val("");
                        $("#tool_edit_schema_description").val("");
                        $("#addUpdateSchemaModel").modal('hide');
                        $scope.isEditingRegistry = false;
                        $scope.isEditingAgentTool = false;

                        swal({
                            title: "Updated",
                            text: "Schema updated successfully!",
                            type: "success",
                            confirmButtonColor: "#2C61F5"
                        });
                    },
                    function (xhr, status, error) {
                        console.error("Failed to update schema:", error);
                        swal({
                            title: "Error",
                            text: "Failed to update schema.",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });
                    }
                );
                break;
            }
        }
    };

    $scope.isEditingAgentTool = false;

    function formatJsonForModal(rawText, fallbackText) {
        let text = rawText || fallbackText || "{}";
        try {
            text = JSON.stringify(JSON.parse(text), null, 4);
        } catch (e) {}
        return text;
    }

    function normalizeJsonString(rawText, fallbackText) {
        try {
            return JSON.stringify(JSON.parse(rawText || fallbackText || "{}"));
        } catch (e) {
            return fallbackText || "{}";
        }
    }

    function resetAgentToolEditModalState(modalSelector) {
        if (modalSelector === '#addUpdatePayloadModel') {
            $("#tool_edit_payload_id").val("");
            $("#tool_edit_payload_description").val("");
        } else if (modalSelector === '#addUpdateSchemaModel') {
            $("#tool_edit_schema_id").val("");
            $("#tool_edit_schema_description").val("");
        }

        $scope.isEditingRegistry = false;
        $scope.isEditingAgentTool = false;
        $(modalSelector).modal('hide');
    }

    function getAgentToolByUuid(uuid) {
        return ($scope.spec.AgentTools || []).find(t => t.UUID === uuid) || null;
    }

    function saveAgentToolAttachment(agentTool, updates, successMessage, onSuccess) {
        if (!agentTool) {
            swal({
                title: "Error",
                text: "Agent tool entry not found.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            return;
        }

        const payload = {
            uuid: agentTool.UUID,
            toolId: agentTool.TOOL_ID || agentTool.tools_registry?.UUID,
            agentId: agentTool.AGENT_ID || $scope.currentAgent?.identifier,
            staticPayload: updates.staticPayload !== undefined
                ? normalizeJsonString(updates.staticPayload, "{}")
                : normalizeJsonString(agentTool.STATIC_PAYLOAD, "{}"),
            agentSchema: updates.agentSchema !== undefined
                ? normalizeJsonString(updates.agentSchema, "{}")
                : normalizeJsonString(agentTool.AGENT_SCHEMA || agentTool.tools_registry?.SCHEMA, "{}"),
            description: updates.description !== undefined
                ? updates.description
                : (agentTool.DESCRIPTION || agentTool.tools_registry?.DESCRIPTION || ""),
            active: updates.active !== undefined
                ? updates.active
                : (agentTool.ACTIVE !== false),
            authInfo: updates.authInfo !== undefined
                ? updates.authInfo
                : (agentTool.AUTH_INFO || "{}"),
            status: updates.status !== undefined
                ? updates.status
                : (agentTool.STATUS || "ACTIVE")
        };

        $http.post(
            window.ENV.API_BASE_URL +
            "/tenant/" + localStorage.getItem("tenant") +
            "/packages.Awareness.dashboard.services.api.agent_tools.save.main",
            payload,
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                    "Content-Type": "application/json"
                }
            }
        ).then(function(response) {
            if (response.data && response.data.status === "success") {
                Object.assign(agentTool, {
                    UUID: response.data.uuid || agentTool.UUID,
                    STATIC_PAYLOAD: payload.staticPayload,
                    AGENT_SCHEMA: payload.agentSchema,
                    DESCRIPTION: payload.description,
                    ACTIVE: payload.active,
                    AUTH_INFO: payload.authInfo,
                    STATUS: payload.status
                });

                swal({
                    title: "Updated",
                    text: successMessage,
                    type: "success",
                    confirmButtonColor: "#2C61F5"
                });
                if (typeof onSuccess === "function") {
                    onSuccess();
                }
                $scope.$applyAsync();
                return;
            }

            console.error("Agent tool update API error:", response.data);
            swal({
                title: "Error",
                text: response.data?.error || "Failed to update agent tool.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
        }, function(xhr) {
            console.error("Failed to update agent tool:", xhr);
            swal({
                title: "Error",
                text: xhr?.responseJSON?.error || xhr?.responseJSON?.message || xhr?.responseText || "Failed to update agent tool.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
        });
    }

    $scope.addAgentToolPayloadEdit = function(tool) {
        $scope.isEditingRegistry = false;
        $scope.isEditingAgentTool = true;

        $("#tool_edit_payload_id").val(tool.UUID);
        $("#tool_edit_payload_description").val(
            formatJsonForModal(tool.STATIC_PAYLOAD, "{}")
        );
        $("#addUpdatePayloadModel").modal('show');
    };

    $scope.completeAgentToolPayloadEdit = function() {
        const payloadText = $("#tool_edit_payload_description").val();
        const editUuid = $("#tool_edit_payload_id").val();

        try {
            JSON.parse(payloadText);
        } catch (err) {
            swal({
                title: "Invalid JSON",
                text: "The payload must be valid JSON.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            return;
        }

        const agentTool = getAgentToolByUuid(editUuid);
        saveAgentToolAttachment(
            agentTool,
            { staticPayload: payloadText },
            "Payload updated successfully!",
            function() { resetAgentToolEditModalState('#addUpdatePayloadModel'); }
        );
    };

    $scope.addAgentToolSchemaEdit = function(tool) {
        $scope.isEditingRegistry = false;
        $scope.isEditingAgentTool = true;

        $("#tool_edit_schema_id").val(tool.UUID);
        $("#tool_edit_schema_description").val(
            formatJsonForModal(tool.AGENT_SCHEMA, tool.tools_registry?.SCHEMA || "{}")
        );
        $("#addUpdateSchemaModel").modal('show');
    };

    $scope.completeAgentToolSchemaEdit = function() {
        const schemaText = $("#tool_edit_schema_description").val();
        const editUuid = $("#tool_edit_schema_id").val();

        try {
            JSON.parse(schemaText);
        } catch (err) {
            swal({
                title: "Invalid JSON",
                text: "The schema must be valid JSON.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            return;
        }

        const agentTool = getAgentToolByUuid(editUuid);
        saveAgentToolAttachment(
            agentTool,
            { agentSchema: schemaText },
            "Schema updated successfully!",
            function() { resetAgentToolEditModalState('#addUpdateSchemaModel'); }
        );
    };
    //deleteTool registry

    $scope.deleteRegistry = function(tool) {

        function executeDeleteRegistry(deleteTools) {

            swal({
                title: "Deleting...",
                text: "Please wait...",
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            SYNCLOOP_AI.TOOLS_REGISTRY.deleteRegistry(
                tool.UUID,
                deleteTools,
                function (response) {

                    var index = $scope.spec.ToolsRegistry.indexOf(tool);
                    if (index !== -1) {
                        $scope.spec.ToolsRegistry.splice(index, 1);
                    }

                    if (deleteTools) {
                        $scope.spec.AgentTools = ($scope.spec.AgentTools || []).filter(function (agentTool) {
                            return agentTool.TOOL_ID !== tool.UUID &&
                                agentTool.tools_registry?.UUID !== tool.UUID;
                        });
                    }

                    $scope.$applyAsync();

                    swal("Deleted", "Tool deleted successfully!", "success");

                },
                function () {
                    swal("Error", "Failed to delete tool.", "error");
                }
            );
        }

        function askRegistryUnlink() {
            $scope.openConfirmOverlay({
                title: "Unlink from Agents?",
                text: "Do you also want to unlink this tool from all agents?",
                confirmText: "Yes",
                cancelText: "No",
                onConfirm: function () {
                    executeDeleteRegistry(true);
                },
                onCancel: function () {
                    executeDeleteRegistry(false);
                }
            });
        }

        $scope.openConfirmOverlay({
            title: "Delete Tool?",
            text: "This tool will be permanently deleted.",
            confirmText: "Continue",
            cancelText: "Cancel",
            onConfirm: function () {
                askRegistryUnlink();
            },
            onCancel: function () {}
        });
    };

    $scope.onManagerSelect = function() {
        $scope.$applyAsync();
    }

    $scope.isThisManager = function (agent) {
        if (agent.identifier == $("#teams_edit_manager_agents").val()) {

            return false;
        }
        return true;
    }

    $scope.openAITeamAdd = function () {
        $scope.teamPopUpHeading = 'Add Team';
        document.getElementById("overlay-team").classList.add("open");
        document.getElementById("bgOverlayTeam").classList.add("active");
        document.body.classList.add("bodyscroll-fixed");

        document.getElementById('teams_edit_id').value = '';
        document.getElementById('teams_edit_name').value = '';
        document.getElementById('teams_edit_requirement').value = '';

        $scope.selectedAppId = "";
        $scope.selectedAgentIds = [];

        setTimeout(function () {
            $("#teams_edit_manager_agents").html("");
            $scope.spec.Agents
                .filter(agent => !$scope.shouldHideAgentInTeam(agent))
                .forEach(function (agent) {
                    $("#teams_edit_manager_agents").append(
                        new Option(agent.name + " " + agent.title, agent.identifier, false, false)
                    );
                });

            $("#teams_edit_manager_agents").select2({
                placeholder: "Select Manager Agent",
                width: "100%"
            }).val($scope.selectedAgentIds).trigger('change');



            $("#teams_edit_agents").html("");
            $scope.spec.Agents
                .filter(agent => !$scope.shouldHideAgentInTeam(agent))
                .forEach(function (agent) {
                    $("#teams_edit_agents").append(
                        new Option(agent.name + " " + agent.title, agent.identifier, false, false)
                    );
                });

            $("#teams_edit_agents").select2({
                placeholder: "Select Agents",
                width: "100%"
            }).val($scope.selectedAgentIds).trigger('change');

            $("#teams_edit_app").select2({
                placeholder: "Select App",
                width: "100%"
            }).val($scope.selectedAppId).trigger('change');
        }, 0);
    };

    $scope.toggleSidebar = function () {
        const sidebar = document.getElementById("sidebar-wrapper");
        const wrapper = document.getElementById("wrapper");

        if (sidebar.classList.contains("minsidebar")) {
            // Currently minimized → expand it
            sidebar.classList.remove("minsidebar");
            wrapper.classList.add("fullleft-width");
            localStorage.setItem("sidebarState", "open");
        } else {
            // Currently expanded → minimize it
            sidebar.classList.add("minsidebar");
            wrapper.classList.remove("fullleft-width");
            localStorage.setItem("sidebarState", "minimized");
        }
        $scope.refreshBadges();
    };

    (function restoreSidebarState() {
        const sidebar = document.getElementById("sidebar-wrapper");
        const wrapper = document.getElementById("wrapper");

        const state = localStorage.getItem("sidebarState");

        if (state === "minimized") {
            sidebar.classList.add("minsidebar");
            wrapper.classList.remove("fullleft-width");
        } else {
            // Default → keep it open
            sidebar.classList.remove("minsidebar");
            wrapper.classList.add("fullleft-width");
            localStorage.setItem("sidebarState", "open");
        }
    })();

    const VALID_TABS = new Set([
        'studio', 'apps', 'teams', 'agents', 'tools', 'llms', 'kbs', 'rags','embeddings','tools_registry', 'mcps'
    ]);

    (function restoreActiveTab() {
        const saved = localStorage.getItem('activeTab');
        $scope.activeTab = VALID_TABS.has(saved) ? saved : 'apps';
    })();

    $scope.$watch('activeTab', function (newTab, oldTab) {
        if (VALID_TABS.has(newTab)) {
            localStorage.setItem('activeTab', newTab);
        }

        $scope.closeAllModals();

        if (newTab !== oldTab) {
            // if (newTab !== 'agents') setQueryParam('agent_id', null);
            $scope.searchText[newTab] = '';
            $timeout(function () {
                $scope.$applyAsync();
                if (newTab === 'agents') {
                    $scope.refreshBadges();
                }
            }, 0);
        }
    });

    $scope.copyTeamCurl = function ($event) {

        const tooltip = $($event.target).closest('.tooltip').find('.tooltiptext');

        navigator.clipboard
            .writeText($($event.target).parent().next().html())
            .then(function () {

                tooltip.text("Copied");
                tooltip.css("transform", "translateX(-60%)");
                setTimeout(function () {
                    tooltip.text("Copy");
                    tooltip.css("transform", "translateX(-50%)");
                }, 2000);

            })
            .catch(function (err) {
                console.error("Failed to copy: ", err);
            });
    };


    $scope.copyCurl = function ($event, rag) {

        if (!rag) return;

        const tooltip = $($event.currentTarget)
            .closest('.tooltip')
            .find('.tooltiptext');

        const path = $scope.uiFullPath(rag);
        if (!path) return;

        navigator.clipboard
            .writeText(path)
            .then(function () {

                tooltip.text("Copied");
                setTimeout(function () {
                    tooltip.text("Copy");
                }, 2000);

            })
            .catch(function (err) {
                console.error("Failed to copy: ", err);
            });
    };

    $scope.addAITeam = function (team) {
        $scope.editingTeamId = team.teamID;
        $scope.teamPopUpHeading = 'Edit Team';
        document.getElementById("overlay-team").classList.add("open");
        document.getElementById("bgOverlayTeam").classList.add("active");
        document.body.classList.add("bodyscroll-fixed");
        document.getElementById('teams_edit_id').value = '';
        document.getElementById('teams_edit_name').value = '';
        document.getElementById('teams_edit_requirement').value = '';

        $("#teams_edit_agents").html("");
        $scope.spec.Agents
            .filter(agent => !$scope.shouldHideAgentInTeam(agent))
            .forEach(function (agent) {
                $("#teams_edit_agents").append(new Option(agent.name + " " + agent.title, agent.identifier, false, false));
            });

        $("#teams_edit_id").val(team.teamID);
        $("#teams_edit_name").val(team.teamName);
        $("#teams_edit_requirement").val(team.requirement || '');

        const selectedAgentIds = team.Agents.map(agent => agent.identifier);
        $("#teams_edit_agents").val(selectedAgentIds).trigger('change');

        $("#teams_edit_manager_agents").html("");
        $scope.spec.Agents
            .filter(agent => !$scope.shouldHideAgentInTeam(agent))
            .forEach(function (agent) {
                $("#teams_edit_manager_agents").append(
                    new Option(agent.name + " " + agent.title, agent.identifier, false, false)
                );
            });

        $("#teams_edit_manager_agents").val(team.managerId);



        $("#teams_edit_app").html("");
        for (let i = 0 ; i < $scope.spec.Apps.length ; i++) {
            $("#teams_edit_app").append("<option value='" + $scope.spec.Apps[i].appId + "'>" + $scope.spec.Apps[i].appName + "</option>");
        }
        $("#teams_edit_app").val(team.appId);

        document.getElementById("overlay-team").classList.add("open");
        document.getElementById("bgOverlay").classList.add("active");
    };

    $scope.isManagerEnrollInOtherTeam = function (thisTeamId, managerId) {

        for (let i = 0 ; i < $scope.spec.Teams.length ; i++) {

            if ($scope.spec.Teams[i].managerId == managerId && $scope.spec.Teams[i].teamID != thisTeamId) {
                return true;
            }

        }

        return false;
    }

    $scope.shouldHideAgentInTeam = function(agent) {
        return $scope.spec.Apps.some(app =>
            app.appId === agent.identifier ||
            (app.terminationAgent && app.terminationAgent.identifier === agent.identifier) ||
            (app.reportingAgent && app.reportingAgent.identifier === agent.identifier)
        );
    };

    $scope.$watchCollection('messages', function(newMessages) {
        var chatWindow = document.getElementById('agentChatWindow');
        chatWindow.scrollTop = chatWindow.scrollHeight;
    });
    $scope.completeAITeam = function () {
        $scope.saveInProgress = true;
        document.body.classList.remove("bodyscroll-fixed");
        setTimeout(() => {
            const teamIdField = $("#teams_edit_id").val().trim();
            const teamName = $("#teams_edit_name").val().trim();
            const teamRequirement = $("#teams_edit_requirement").val().trim();
            const appId = $("#teams_edit_app").val();
            const agents = $("#teams_edit_agents").val();
            const manager = $("#teams_edit_manager_agents").val();

            if ($scope.isManagerEnrollInOtherTeam(teamIdField, manager)) {
                swal({
                    title: "Duplicate Manager",
                    text: "Manager cannot be part of more than one team.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (!teamName) {
                swal({
                    title: "Missing Team Name",
                    text: "Please enter a Team Name.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (teamName.length > 99) {
                swal({
                    title: "Name Too Long",
                    text: "Try using a more concise name.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (!manager || manager.length === 0) {
                swal({
                    title: "Missing Manager",
                    text: "Please select a Manager.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (!agents || agents.length === 0) {
                swal({
                    title: "Missing Agents",
                    text: "Please select at least one Agent.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (!teamRequirement) {
                swal({
                    title: "Missing Requirement",
                    text: "Please enter a Description.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            let agentSet = new Set(agents);

            for (let j = 0; j < $scope.spec.Teams.length; j++) {
                if (agentSet.has($scope.spec.Teams[j].managerId)) {
                    const currentTeam = $scope.spec.Teams[j];
                    if ($scope.editingTeamId && currentTeam.teamID === $scope.editingTeamId) continue;

                    for (let k = 0; k < currentTeam.Agents.length; k++) {
                        if (manager == currentTeam.Agents[k].identifier) {
                            swal({
                                title: "Circular Dependency",
                                text: "Manager '" + $scope.getAgent(manager).name + "' is part of a circular reference with team '" + currentTeam.teamName + "'.",
                                type: "error",
                                confirmButtonColor: "#f2533e"
                            });

                            $scope.saveInProgress = false;
                            $scope.$applyAsync();
                            return;
                        }
                    }
                }
            }

            for (let i = 0; i < agents.length; i++) {
                if (!$scope.isThisManager({ identifier: agents[i] })) {
                    swal({
                        title: "Invalid Agent",
                        text: "Manager cannot be added as an agent in the same team.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                    $scope.saveInProgress = false;
                    $scope.$applyAsync();
                    return;
                }
            }

            const targetTeamId = teamIdField || generateUUID();
            const onSuccess = function (response) {
                if (isErrorResponse(response)) {
                    swal({
                        title: "Error",
                        text: getResponseErrorMessage(response, teamIdField === "" ? "Failed to add team." : "Failed to update team."),
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                    $scope.saveInProgress = false;
                    $scope.$applyAsync();
                    return;
                }

                // Deprecated: FE no longer creates/deletes team-managed tools directly.
                // BE now owns manager<->agent links and app<->manager links.
                $scope.loadTeams(function (loadTeamsResponse) {
                    if (isErrorResponse(loadTeamsResponse)) {
                        swal({
                            title: "Error",
                            text: getResponseErrorMessage(loadTeamsResponse, "Failed to refresh teams."),
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });
                        $scope.saveInProgress = false;
                        $scope.$applyAsync();
                        return;
                    }

                    $scope.saveInProgress = false;
                    document.getElementById("overlay-team").classList.remove("open");
                    document.getElementById("bgOverlayTeam").classList.remove("active");
                    $scope.editingTeamId = null;
                    $scope.reloadTree();
                    $scope.$applyAsync();
                });
            };

            const onError = function () {
                swal({
                    title: "Error",
                    text: teamIdField === "" ? "Failed to add team. Please try again." : "Failed to update team. Please try again.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
                $scope.saveInProgress = false;
                $scope.$applyAsync();
            };

            SYNCLOOP_AI.TEAMS.upsertTeam(targetTeamId, teamName, teamRequirement, appId, manager, agents, onSuccess, onError);
        }, 0);
    };

    $scope.deleteAITeam = function(team) {
        swal({
                title: "Are you sure?",
                text: "Once you click 'Yes'. The '" + team.teamName + "' will be permanently deleted and cannot be recovered",
                imageUrl: "Awareness/pub/images/delete_exclamation.svg",
                showCancelButton: true,
                confirmButtonColor: '#f2533e',
                confirmButtonText: 'Yes, delete it!',
                closeOnConfirm: true
            },
            function() {
                swal({
                    title: "Deleting...",
                    text: "Please wait while we delete this team.",
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });

                SYNCLOOP_AI.TEAMS.deleteTeam(team.teamID, function (response) {
                    if (isErrorResponse(response)) {
                        swal({
                            title: "Error",
                            text: getResponseErrorMessage(response, "Failed to delete team."),
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });
                        return;
                    }

                    // Deprecated: FE no longer manually deletes team-managed tools.
                    // BE now deletes the team and all managed links together.
                    $scope.loadTeams(function (loadTeamsResponse) {
                        if (isErrorResponse(loadTeamsResponse)) {
                            swal({
                                title: "Error",
                                text: getResponseErrorMessage(loadTeamsResponse, "Failed to refresh teams."),
                                type: "error",
                                confirmButtonColor: "#f2533e"
                            });
                            return;
                        }

                        swal({
                            title: "Deleted!",
                            text: "Team has been deleted!",
                            icon: "success",
                            confirmButtonColor: "#2C61F5"
                        });
                        $scope.reloadTree();
                    });
                }, function(xhr, status, error) {
                    swal({
                        title: "Error",
                        text: "Failed to delete team. Please try again.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                });
            });
        setTimeout(function () {
            const confirmBtn = document.querySelector('.confirm');
            const cancelBtn = document.querySelector('.cancel');

            if (confirmBtn) {
                confirmBtn.classList.add('custom-delete-btn');
                confirmBtn.addEventListener('click', removeCustomBtnClass);
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', removeCustomBtnClass);
            }

            function removeCustomBtnClass() {
                confirmBtn?.classList.remove('custom-delete-btn');
            }
        }, 0);
    }

    $scope.deleteAIApp = function(app) {
        swal({
                title: "Are you sure?",
                text: "Once you click 'Yes'. The '" + app.appName + "' App will be permanently deleted and cannot be recovered.",
                imageUrl: "Awareness/pub/images/delete_exclamation.svg",
                showCancelButton: true,
                confirmButtonColor: '#f2533e',
                confirmButtonText: 'Yes, delete it!',
                closeOnConfirm: true
            },
            function() {

                swal({
                    title: "Deleting...",
                    text: "Please wait while we delete this app.",
                    icon: "info",
                    showConfirmButton: false,
                    confirmButtonColor: "#f2533e",
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });

                SYNCLOOP_AI.APPS.deleteApp(app.appId, function (response) {
                    if (isErrorResponse(response)) {
                        swal({
                            title: "Error",
                            text: getResponseErrorMessage(response, "Failed to delete app."),
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });
                        return;
                    }
                    $scope.loadApps(function () {
                        swal({
                            title: "Deleted!",
                            text: "App has been deleted!",
                            type: "success",
                            confirmButtonColor: "#2C61F5"
                        });
                    });
                }, function(xhr, status, error) {
                    swal({
                        title: "Error",
                        text: getAjaxErrorMessage(xhr, "Failed to delete app."),
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                });
            });

        setTimeout(function () {
            const confirmBtn = document.querySelector('.confirm');
            const cancelBtn = document.querySelector('.cancel');

            if (confirmBtn) {
                confirmBtn.classList.add('custom-delete-btn');
                confirmBtn.addEventListener('click', removeCustomBtnClass);
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', removeCustomBtnClass);
            }

            function removeCustomBtnClass() {
                confirmBtn?.classList.remove('custom-delete-btn');
            }
        }, 0);
    };

    $scope.getAppAgent = function() {

    }

    // RAG functions (for Agents)
    $scope.getKBNameForRAG = function (ragID) {
        const kb = $scope.spec.KBs.find(kb => kb.ragID === ragID);
        return kb ? kb.name : '—';
    };

    $scope.ragEdit = {};
    $scope.ragEditMode = false;

    $scope.openKBRAGAdd = function () {
        $scope.ragEditMode = false;

        var selectedKB = null;
        if ($scope.loadForKBId) {
            selectedKB = ($scope.spec.KBs || []).find(function(kb){ return kb.ragID === $scope.loadForKBId; });
        }
        if (!selectedKB) {
            selectedKB = ($scope.spec.KBs || [])[0] || null;
        }

        $scope.ragKBFrozen = true;
        $scope.ragBindingMode = 'kb';

        $scope.ragEdit = {
            ragName: '',
            ragID: selectedKB ? selectedKB.ragID : '',
            ESKey: generateUUID(),
            filePattern: '*.txt',
            maxSegmentSizeInChars: 1000,
            maxOverlapSizeInChars: 100,
            maxSearchResults: 5,
            filesDisplay: '',
            filesDisplayFull: '',
            fileNames: [],
            primaryFileName: ''
        };

        openRAGOverlay();
    };

    $scope.editRAG = function (rag) {
        $scope.ragEditMode = true;
        $scope.ragBeingEdited = rag;
        $scope.ragEdit = angular.copy(rag);
        openRAGOverlay();
    };

    function openRAGOverlay() {
        document.getElementById("overlay-rag").classList.add("open");
        document.getElementById("bgOverlayRAG").classList.add("active");
    }

    $scope.saveRAG = function () {
        $scope.saveInProgress = true;

        var onSuccess = function () {
            $scope.saveInProgress = false;
            $scope.$applyAsync();
            document.getElementById("overlay-rag").classList.remove("open");
            document.getElementById("bgOverlayRAG").classList.remove("active");
        };

        var onError = function (message) {

            $scope.saveInProgress = false;
            $scope.$applyAsync();
            swal({
                title: "Error",
                text: message || "Failed to save RAG configuration",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
        };
        var uploadPath = $scope.currentFilePath;
        var kbId = $scope.ragEdit && $scope.ragEdit.ragID;
        var fileNameOnly = '/uploads'+ RAG_UPLOAD_ROOT + '/kb/' + (uploadPath) + '/' || '';

        if (!kbId || !fileNameOnly) {
            $scope.saveInProgress = false;
            $scope.$evalAsync(function () {
                swal({
                    title: "Error",
                    text: "KB and at least one file are required.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
            });
            return;
        }

        if ($scope.ragEditMode) {
            SYNCLOOP_AI.RAG.upsertRAG(
                $scope.ragBeingEdited.ragID,
                $scope.ragBeingEdited.ESKey,
                fileNameOnly,
                $scope.ragEdit.filePattern,

                function (res) {

                    if (!res || res.status === "failed") {
                        onError(res && res.error ? res.error : "Failed to update RAG configuration");
                        return;
                    }

                    Object.assign($scope.ragBeingEdited, $scope.ragEdit, {
                        fileName: fileNameOnly,
                        name: fileNameOnly,
                        path: fileNameOnly
                    });
                    onSuccess();
                },

                function () {
                    onError("Failed to update RAG configuration");
                }
            );
        } else {
            let identifier = $scope.uploadingRagId;
            SYNCLOOP_AI.RAG.upsertRAG(
                "",
                $scope.ragEdit.ragID,
                identifier,
                fileNameOnly,
                $scope.ragEdit.filePattern,
                $scope.ragEdit.EMKey,

                function (res) {
                    if (!res || res.status === "failed") {
                        onError(res && res.error ? res.error : "Failed to save RAG configuration");
                        return;
                    }

                    $scope.spec = $scope.spec || {};
                    $scope.spec.RAGs = $scope.spec.RAGs || [];
                    var saved = Object.assign(
                        {
                            id: 'rag_' + Date.now(),
                            ragID: kbId,
                            fileName: fileNameOnly,
                            name: fileNameOnly,
                            path: fileNameOnly
                        },
                        $scope.ragEdit
                    );
                    $scope.spec.RAGs.push(saved);
                    onSuccess();
                },

                function () {
                    onError("Failed to save RAG configuration");
                }
            );
        }
    };

    $scope.triggerRAGDirPicker = function () {
        var el = document.getElementById('ragDirPicker');
        if (el) el.click();
    };

    $scope.clearRagPath = function () {
        $scope.ragEdit = $scope.ragEdit || {};
        $scope.ragEdit.path = '';
        $scope.ragEdit.ragName = '';
        $scope.ragEdit.fileNames = [];
        $scope.ragEdit.filesDisplayFull = '';
        $scope.ragEdit.primaryFileName = '';

        var el = document.getElementById('ragDirPicker');
        if (el) el.value = '';

        const inputs = ['ragFileInput', 'ragFileInputKB'];

        inputs.forEach(function(id){
            const el = document.getElementById(id);
            if (el) {
                el.value = '';
                el.type = 'text';
                el.type = 'file';
            }
        });
    };

    $scope.handleRAGFileChange = function (fileList) {
        var list = fileList ? Array.from(fileList) : [];
        $scope.ragEdit = $scope.ragEdit || {};

        var agentKey = ($scope.ragEdit && $scope.ragEdit.agentId) || ($scope.currentAgent && $scope.currentAgent.identifier);
        var kbKey    = (!agentKey && $scope.ragEdit && $scope.ragEdit.ragID) ? $scope.ragEdit.ragID : null;
        var folder   = agentKey ? (RAG_UPLOAD_ROOT + '/' + agentKey)
            : (kbKey ? (RAG_UPLOAD_ROOT + '/kb/' + kbKey) : '');

        $scope.ragEdit.fileNames = list.map(function (f) { return f.name; });

        var fullPaths = list.map(function (f) {
            var base = folder ? folder.replace(/\/+$/,'') : '';
            var rel  = (base ? base + '/' : '') + f.name.replace(/^\/+/, '');
            return '/uploads' + (rel[0] === '/' ? rel : '/' + rel);
        });

        if (fullPaths.length <= 2) {
            $scope.ragEdit.filesDisplay = fullPaths.join(', ');
        } else {
            $scope.ragEdit.filesDisplay = fullPaths.slice(0,2).join(', ') + ' +' + (fullPaths.length - 2) + ' more';
        }
        $scope.ragEdit.filesDisplayFull = fullPaths.join(', ');

        $scope.ragEdit.path = fullPaths[0] || '';

        $scope.ragEdit.primaryFileName = ($scope.ragEdit.fileNames && $scope.ragEdit.fileNames[0]) || '';

        var first = list[0];
        if (first && first.name && first.name.indexOf('.') > -1) {
            var ext = first.name.split('.').pop().toLowerCase();
            if (ext) $scope.ragEdit.filePattern = '*.' + ext;
        }

        $scope.$applyAsync();

        if (!list.length) return;
        var files = list.slice();
        var next = function () {
            var f = files.shift();
            if (!f) return;
            $scope.uploadRAGFile(f);
            var poll = function () {
                if ($scope.ragUploading) return setTimeout(poll, 100);
                next();
            };
            poll();
        };
        next();
    };

    $scope.deleteRAG = function (rag) {
        swal({
            title: "Are you sure?",
            text: "Once you click 'Yes'. The RAG will be permanently deleted and cannot be recovered",
            imageUrl: "Awareness/pub/images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
        }, function() {

            swal({
                title: "Deleting...",
                text: "Please wait while we delete this RAG.",
                type: "info", // Optional, for better indication
                showConfirmButton: false,
                confirmButtonColor: "#2C61F5", // Won't show unless confirm button is enabled
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            SYNCLOOP_AI.RAG.deleteRAG(
                rag.identifier,
                function (response) {
                    const index = $scope.spec.RAGs.indexOf(rag);
                    if (index !== -1) {
                        $scope.spec.RAGs.splice(index, 1);
                        $scope.$applyAsync();
                    }

                    swal({
                        title: "Deleted",
                        text: "Knowledge Base deleted successfully!",
                        type: "success",
                        confirmButtonColor: "#2C61F5"
                    });

                    SYNCLOOP_AI.CORE.initialize();
                });
        });
        setTimeout(function () {
            const confirmBtn = document.querySelector('.confirm');
            const cancelBtn = document.querySelector('.cancel');

            if (confirmBtn) {
                confirmBtn.classList.add('custom-delete-btn');
                confirmBtn.addEventListener('click', removeCustomBtnClass);
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', removeCustomBtnClass);
            }

            function removeCustomBtnClass() {
                confirmBtn?.classList.remove('custom-delete-btn');
            }
        }, 0);
    };

    // Knowledge Base (KB) functions
    $scope.openKBAdd = function () {
        $scope.currentKB = null;
        $scope.knowledgeBasePopUpHeading = 'Add Knowledge Base';
        $scope.kbEdit = {
            ragID: generateUUID(),
            name: ''
        };
        document.getElementById("overlay-kb").classList.add("open");
        document.getElementById("bgOverlayKB").classList.add("active");
    };

    $scope.openKBEdit = function (kb) {
        $scope.knowledgeBasePopUpHeading = 'Edit Knowledge Base';
        document.getElementById("overlay-kb").classList.add("open");
        document.getElementById("bgOverlayKB").classList.add("active");
        $scope.currentKB = kb;
        $scope.kbEdit = {
            ragID: kb.ragID,
            name: kb.name
        };

    };




    window.scope = $scope;

    $scope.completeKBEdit = function () {
        $scope.saveInProgress = true;

        var ragID = $('#kb_edit_ragID').val().trim();
        var name = $('#kb_edit_name').val().trim();

        if (name.length > 99) {
            swal({
                title: "Name Too Long",
                text: "Try using a more concise name..",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            $scope.saveInProgress = false;
            $scope.$applyAsync();
            return;
        }

        if (!name) {
            swal({
                title: "Missing Name",
                text: "Please enter Knowledge Base Name.",
                type: "error",
                confirmButtonColor: "#f2533e" // red button for error
            });

            $scope.saveInProgress = false;
            return;
        }





        let onSuccess = () => {
            $scope.saveInProgress = false;
            $scope.$applyAsync();
            document.getElementById("overlay-kb").classList.remove("open");
            document.getElementById("bgOverlayKB").classList.remove("active");
        };

        let onError = () => {
            swal({
                title: "Error",
                text: "Failed to save Knowledge Base.",
                type: "error",
                confirmButtonColor: "#f2533e" // red for error indication
            });

            $scope.saveInProgress = false;
            $scope.$applyAsync();
        };

        if ($scope.currentKB) {
            SYNCLOOP_AI.KB.upsertKB($scope.currentKB.ragID, name, "", function (response) {
                $scope.currentKB.name = name;
                onSuccess();
            }, onError);
        } else {
            var duplicate = $scope.spec.KBs.find(kb => kb.ragID === ragID);
            if (duplicate) {
                swal({
                    title: "Duplicate ID",
                    text: "This ragID already exists.",
                    type: "error",
                    confirmButtonColor: "#f2533e" // red color for error confirmation
                });

                $scope.saveInProgress = false;
                return;
            }

            SYNCLOOP_AI.KB.upsertKB(ragID, name, "", function (response) {
                $scope.spec.KBs.push({ ragID: ragID, name: name, expanded: false });
                onSuccess();
            }, onError);
        }
    };

    $scope.deleteKB = function (kb) {
        swal({
            title: "Are you sure?",
            text: "Once you click 'Yes'. The '" + kb.name + "' will be permanently deleted and cannot be recovered",
            imageUrl: "Awareness/pub/images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false,

        }, function () {

            swal({
                title: "Deleting...",
                text: "Please wait while we delete this knowledge base.",
                showConfirmButton: false,
                type: "error",
                confirmButtonColor: "#f2533e",
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            SYNCLOOP_AI.KB.deleteKB(kb.ragID, function (response) {
                if (response.status == "success") {
                    const index = $scope.spec.KBs.indexOf(kb);
                    if (index !== -1) {
                        $scope.spec.KBs.splice(index, 1);
                    }

                    $scope.spec.RAGs = $scope.spec.RAGs.filter(function (rag) {
                        return rag.ragID !== kb.ragID;
                    });

                    $scope.$applyAsync();

                    swal({
                        title: "Deleted",
                        text: "Knowledge Base deleted successfully!",
                        type: "success",
                        confirmButtonColor: "#2C61F5" // green color for success confirmation
                    });

                } else {
                    swal({
                        title: "Deleted",
                        text: response.error,
                        type: "error",
                        confirmButtonColor: "#f2533e" // red color for error confirmation
                    });

                }

            })
        });
        setTimeout(function () {
            const confirmBtn = document.querySelector('.confirm');
            const cancelBtn = document.querySelector('.cancel');

            if (confirmBtn) {
                confirmBtn.classList.add('custom-delete-btn');
                confirmBtn.addEventListener('click', removeCustomBtnClass);
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', removeCustomBtnClass);
            }

            function removeCustomBtnClass() {
                confirmBtn?.classList.remove('custom-delete-btn');
            }
        }, 0);

    };

    $scope.toggleKB = function(kb) {
        kb.expanded = !kb.expanded;
    };

    // KB RAG functions
    $scope.addKBRAG = function(kb) {
        var newRAG = {
            path: "",
            filePattern: "",
            ragID: kb.ragID,
            ESKey: kb.ragID,
            maxSegmentSizeInChars: 500,
            maxOverlapSizeInChars: 50,
            maxSearchResults: 10,
            editing: true
        };
        $scope.spec.RAGs.push(newRAG);
    };
    $scope.editKBRAG = function(rag) {
        rag.editing = true;
    };
    $scope.doneEditKBRAG = function(rag) {
        rag.editing = false;
    };
    $scope.cancelEditKBRAG = function(rag) {
        if (!rag.path) {
            var index = $scope.spec.RAGs.indexOf(rag);
            $scope.spec.RAGs.splice(index, 1);
        } else {
            rag.editing = false;
        }
    };
    $scope.deleteKBRAG = function(rag) {
        if (!$scope.disableConfirmDelete && !confirm("Delete this RAG?")) {
            return;
        }
        var index = $scope.spec.RAGs.indexOf(rag);
        $scope.spec.RAGs.splice(index, 1);
    };

    // Directory picker for RAGs (Agents)
    $scope.triggerDirPicker = function(index) {
        $("#dirPicker" + index).click();
    };
    $scope.setRAGPath = function(agent, event, rag) {
        var files = event.target.files;
        if (files.length > 0) {
            rag.path = files[0].webkitRelativePath.split("/")[0];
        }
    };

    // Directory picker for KB RAGs
    $scope.triggerKBDirPicker = function(index) {
        $("#kbDirPicker" + index).click();
    };
    $scope.setRAGPathKB = function(kb, event, rag) {
        var files = event.target.files;
        if (files.length > 0) {
            rag.path = files[0].webkitRelativePath.split("/")[0];
        }
    };

    // FQN Popup functions
    $scope.openFQNPopup = function(tool) {
        $scope.currentTool = tool;
        $.ajax({
            url: window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/tools",
            method: "GET",
            headers: { "Authorization": `Bearer ${localStorage.getItem("AuthToken")}` },
            success: function(data) {
                $scope.$apply(function() {
                    $scope.fqnList = data.tools;
                    $scope.fqnPopupVisible = true;
                });
            },
            error: function() {
                $scope.$apply(function() {
                    $scope.fqnList = [{
                        "fqn": "package.somethin.abc.1"
                    },
                        {
                            "fqn": "package.somethin.abc.2"
                        }
                    ];
                    $scope.fqnPopupVisible = true;
                });
            }
        });
    };
    $scope.closeFQNPopup = function() {
        $scope.fqnPopupVisible = false;
        $scope.currentTool = null;
    };
    $scope.selectFQN = function(fqn) {
        if ($scope.currentTool) {
            $scope.currentTool.fqn = fqn;
        }
        $scope.closeFQNPopup();
    };


    // Chat Test Enhancement functions
    function scrollChatToBottom() {
        $timeout(() => { // Use $timeout to ensure DOM is updated
            var chatWindow = document.getElementById('chatWindow');
            if (chatWindow) {
                chatWindow.scrollTop = chatWindow.scrollHeight;
            }
        }, 0, false); // Execute after current digest cycle
    }

    function scrollAppChatToBottom() {
        $timeout(() => { // Use $timeout to ensure DOM is updated
            var chatWindow = document.getElementById('appChatWindow');
            if (chatWindow) {
                chatWindow.scrollTop = chatWindow.scrollHeight;
            }
        }, 0, false); // Execute after current digest cycle
    }

    $scope.triggerChat = function(agent) {
        $(".chat_leftpanel-searchinput").val("");
        document.body.classList.add("bodyscroll-fixed");
        if (!$scope.chatModalVisible) {
            $scope.conversationID = null;
            $scope.openChatTest(agent);
            $scope.filterTeamsConversations();
            $scope.chatModalVisible = true; // ensure visible
            $scope.$applyAsync();
            $("#chatboxfirst").css("display", "block");
            $("#chat-circle").show('scale');
            $(".chat-box").show('scale');
        }

    };

    $scope.triggerTeamChat = function(team) {
        document.body.classList.add("bodyscroll-fixed");
        $(".chat_leftpanel-searchinput").val("");
        if (!$scope.chatModalVisible) {
            $scope.conversationID = null;
            $scope.openChatTest({
                name: team.teamName,
                teamId: team.teamID,
                identifier: team.managerId,
                type: 'TEAM'
            });
            $scope.filterTeamsConversations();
            $scope.chatModalVisible = true; // ensure visible
            $scope.$applyAsync();
            $("#chatboxfirst").css("display", "block");
            $("#chat-circle").show('scale');
            $(".chat-box").show('scale');
        }
    };

    $scope.triggerAppChat = function() {
        document.body.classList.add("bodyscroll-fixed");
        $(".chat_leftpanel-searchinput").val("");

        if (!$scope.appChatModalVisible) {
            let App = null;
            for (let i = 0; i < $scope.spec.Apps.length; i++) {
                if ($scope.appId == $scope.spec.Apps[i].appId) {
                    App = $scope.spec.Apps[i];
                }
            }

            $scope.openAppChat(App);
            $scope.appChatModalVisible = true;
            $("#chatboxsecond").css("display", "block");
            $scope.$applyAsync();

            $("#chat-circle").show('scale');
            $(".chat-box").show('scale');

            /*const payloadObj = {
                appId: App.appId,
                appName: App.appName,
                prompt: "Hi, start app chat",
                sessionID: generateUUID()
            };

            openAgentExecuteChat(
                payloadObj,
                function (msg) {
                },
                function (msg) {
                    console.log("Final Result:", msg);
                    $scope.addAppChatResult(msg);
                },
                function () {
                    console.log("App Chat Closed");
                },
                function (err) {
                    console.error("App Chat Error", err);
                }
            );*/
        }
    };

    $scope.openAppChat = function (App) {
        $scope.currentChatAgent = App;
        $scope.appChatModalVisible = true;
        $scope.chatHistory = [];
        $scope.newAppChatMessage = "";
        $scope.appChatHistoryLoading = true;
        $scope.appChatWaitVisible = false;
    }

    $scope.closeAppChat = function () {
        $scope.appChatModalVisible = false;
        $("#chatboxsecond").css("display", "none");
        $(".chat_boxtransitionsecond").removeClass("active");
        document.body.classList.remove("bodyscroll-fixed");
    };

    $scope.addAppChatResult = function(msg) {
        let data = typeof msg === "string" ? msg : JSON.stringify(msg);
        $scope.chatHistory.push({role: "system", text: data});
        $scope.$applyAsync();
    };

    $scope.handleChatKeydown = function(event) {
        // const textarea = event.target;

        /* if (event.key === 'Enter' && event.shiftKey) {
             textarea.classList.add('chat-expanded');
             return;
         }*/

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            // textarea.classList.remove('chat-expanded');
            $scope.sendChatMessage();
        }
    };

    $scope.handleAppChatKeydown = function(event) {
        // const textarea = event.target;

        /*if (event.key === 'Enter' && event.shiftKey) {
            textarea.classList.add("chat-expanded");
            return;
        }*/

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            // textarea.classList.remove("chat-expanded");
            $scope.sendAppChatMessage();
        }
    };

    $scope.sendAppChatMessage = function () {
        if (!$scope.newAppChatMessage || $scope.appChatWaitVisible) return;

        var userMessage = $scope.newAppChatMessage.trim();
        if (!userMessage) return;

        const trustedHtml = $sce.trustAsHtml(userMessage.replace(/\n/g, '<br>'));
        $scope.chatHistory.push({ user: "User", text: trustedHtml });
        $scope.newAppChatMessage = "";
        scrollAppChatToBottom();

        const payloadObj = {
            appId: $scope.appId,
            prompt: userMessage
        };

        $scope.appChatWaitVisible = true;
        window.newAppChatRequest = true;

        // ----- Streamed messages -----
        const listenTranscripts = function (msg) {
            try {
                if (window.TranscriptUI) {
                    if (window.newAppChatRequest === true) {
                        window.TranscriptUI.clear();
                        window.newAppChatRequest = false;
                        if (window.TranscriptUI.slideOut) window.TranscriptUI.slideOut();
                    }
                    window.TranscriptUI.addMessage(msg);
                }
            } catch (err) {
                console.warn("TranscriptUI error:", err);
            }
        };

        const listenResult = function (lastMsg, conversationChatID) {
            $scope.$applyAsync(() => {
                $scope.appChatWaitVisible = false;
                if (!lastMsg) {
                    $scope.chatHistory.push({ user: "Agent", text: $sce.trustAsHtml("No response received.") });
                    scrollAppChatToBottom();
                    return;
                }

                try {
                    const parsed = JSON.parse(lastMsg);
                    $scope.conversationID = conversationChatID;
                    const resp = parsed.response || parsed.resp || parsed.result?.[0] || lastMsg;

                    $scope.chatHistory.push({
                        user: "Agent",
                        text: $sce.trustAsHtml(showdownConverter.makeHtml(
                            (resp && resp.error) ? resp.error.message : (typeof resp === "string" ? resp : JSON.stringify(resp))
                        ))
                    });
                } catch (err) {
                    $scope.chatHistory.push({
                        user: "Agent",
                        text: $sce.trustAsHtml(showdownConverter.makeHtml(lastMsg))
                    });
                }

                scrollAppChatToBottom();
            });
        };

        const onClose = function () {
            $scope.appChatWaitVisible = false;
            if (window.TranscriptUI && window.TranscriptUI.disconnect) {
                window.TranscriptUI.disconnect();
            }
            window.newAppChatRequest = true; // ✅ reset for next chat
            console.log("[sendAppChatMessage] websocket closed");
        };

        const onError = function (err) {
            if (window.TranscriptUI && window.TranscriptUI.disconnect) {
                window.TranscriptUI.disconnect();
            }

            $scope.$applyAsync(() => {
                $scope.appChatWaitVisible = false;
                $scope.showNotification('error', "Chat connection failed: " + (err && err.message ? err.message : err));
                $scope.chatHistory.push({ user: "System", text: "⚠️ Connection error." });
                scrollAppChatToBottom();
            });
        };

        try {
            if (typeof openAppChat !== "function") {
                throw new Error("openAppChat is not available");
            }
            const socket = openAppChat(payloadObj, listenTranscripts, listenResult, onClose, onError);
            $scope._currentAppChatSocket = socket;
        } catch (err) {
            onError(err);
        }
    };

    $scope.startNewChat = function() {
        $scope.chatHistory = [];
        $scope.conversationID = null;
        $scope.$applyAsync();
    }

    $scope.downloadChatHistory = function(conversation) {
        SYNCLOOP_AI.CONVERSATIONS.downloadChatHistory(conversation.AGENTID, conversation.IDENTIFIER);
    }

    $scope.isCurrentConversation = function (conversation) {
        if ( null == $scope.currentConversation) {
            return false;
        }

        return $scope.currentConversation.IDENTIFIER == conversation.IDENTIFIER;
    }

    $scope.switchChat = function(conversation) {
        $scope.currentConversation = conversation;
        SYNCLOOP_AI.CONVERSATIONS.getChatHistory(conversation.agentId, conversation.identifier, function (response) {

            $scope.chatHistory = [];

            $scope.chatHistory = response.chatHistory.map(msg => {
                return {
                    ...msg,
                    text: msg.user === "Agent"
                        ? $sce.trustAsHtml(showdownConverter.makeHtml(msg.text))
                        : $sce.trustAsHtml(msg.text)
                };
            });
            scrollChatToBottom();

            $scope.conversationID = conversation.identifier;
            $scope.$applyAsync();

        });


    }

    $scope.openChatTest = function (agent) {
        $scope.rightsideopened = true;
        $scope.rightPanelMode = 'chat';

        $scope.currentChatAgent = agent;
        $scope.showWelcomeBubble = true;
        $scope.welcomeText = "Hi! I'm " + (agent.name || "your assistant") +
            ". What would you like to learn today?";
        $scope.welcomeSafeHtml = $sce.trustAsHtml($scope.welcomeText);
        $scope.chatHistory = [];
        $scope.newChatMessage = "";
        $scope.chatHistoryLoading = true;
        $scope.chatWaitVisible = false;

        let historyUrl = "/chatHistory?agentID=" + agent.identifier;
        if ($scope.currentChatAgent.type === 'TEAM') {
            historyUrl = '/chatHistory?teamId=' + agent.teamId;
        }

        $http.get(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + historyUrl,
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                    "Content-Type": "application/json"
                }
            })
            .then(function (response) {
                $scope.chatHistoryLoading = false;
                if (response.data && response.data.chatHistory && Array.isArray(response.data.chatHistory)) {
                    $scope.chatHistory = response.data.chatHistory.map(msg => {
                        return {
                            ...msg,
                            text: msg.user === "Agent"
                                ? $sce.trustAsHtml(showdownConverter.makeHtml(msg.text))
                                : $sce.trustAsHtml(msg.text)
                        };
                    });
                    scrollChatToBottom();
                } else {
                    $scope.showNotification('info', "No chat history found or unexpected format.");
                }
            }, function (error) {
                $scope.chatHistoryLoading = false;
                $scope.showNotification('error', "Failed to load chat history: " + (error.data?.error || error.statusText));
            });

    };

    $scope.closeChatTest = function () {
        $scope.chatModalVisible = false;
        document.body.classList.remove("bodyscroll-fixed");

    };

    $scope.sendChatMessage = function () {
        /*setTimeout(function () {
            var textarea = document.querySelector('.chat-input textarea.form-control');
            if (textarea) {
                textarea.classList.remove('chat-expanded');
                textarea.style.height = "80px";
            }
        }, 0);*/

        if (!$scope.newChatMessage || $scope.chatWaitVisible) return;

        var userMessage = $scope.newChatMessage;
        const trustedHtml = $sce.trustAsHtml(userMessage.replace(/\n/g, '<br>'));
        $scope.chatHistory.push({ user: "User", text: trustedHtml });

        $scope.newChatMessage = "";
        scrollChatToBottom(); // Scroll after adding user message

        var payload = { agentID: $scope.currentChatAgent.identifier, prompt: userMessage, chatID: $scope.conversationID};
        $scope.chatWaitVisible = true; // Show thinking indicator

        let chatURL = "/packages.Awareness.assistant.api.chat.main";
        if ($scope.currentChatAgent.type === 'TEAM') {
            chatURL = "/team/chat";
            payload = { teamId: $scope.currentChatAgent.teamId,
                prompt: userMessage,
                chatID: $scope.conversationID
            };
        }

        if (!$scope.conversationID) {
            payload['chatTitle'] = userMessage.trim().length < 4 ? "New Chat": userMessage;
        }

        if ($scope.currentChatAgent.type === 'TEAM') {
            openTeamChat(payload,
                function () { /* ignore transcript updates */ },
                function (finalMsg, conversationChatID, messageId) {
                    $scope.chatWaitVisible = false;
                    try {
                        const data = JSON.parse(finalMsg || '{}');
                        $scope.conversationID = conversationChatID;

                        if (data.resp || data.response || data.result.length > 0) {
                            const html = showdownConverter.makeHtml(data.resp || data.response || data.result[0]);
                            $scope.$applyAsync(() => pushAgentReply(html, undefined, messageId));
                            if ($scope.chatHistory.length < 2 && typeof $scope.loadConversations === 'function') {
                                $scope.loadConversations();
                            }
                        } else if (data.error) {
                            $scope.$applyAsync(() => pushAgentError(data.error, conversationChatID));
                        } else {
                            $scope.$applyAsync(() => pushAgentError("Unexpected chat response.", conversationChatID));
                        }
                    } catch (e) {
                        console.log(e);
                        $scope.$applyAsync(() => pushAgentError("Malformed response from server.", null));
                    }
                },
                function () { $scope.chatWaitVisible = false; },
                function (err) {
                    $scope.chatWaitVisible = false;
                    const msg = (err && (err.message || err.toString())) || "Chat connection error.";
                    $scope.$applyAsync(() => pushAgentError(msg, null));
                }
            );
        } else {
            openAgentChat($scope.currentChatAgent.identifier, userMessage, $scope.conversationID, $scope.isThinkActive,payload.chatTitle,
                function () { /* ignore transcript updates */ },
                function (finalMsg, conversationID, messageId) {
                    $scope.chatWaitVisible = false;
                    try {
                        const data = JSON.parse(finalMsg || '{}');
                        $scope.conversationID = conversationID;

                        if (data.resp || data.response || data.result.length > 0) {
                            const html = showdownConverter.makeHtml(data.resp || data.response || data.result[0]);
                            $scope.$applyAsync(() => pushAgentReply(html, undefined, messageId));
                        } else if (data.error) {
                            $scope.$applyAsync(() => pushAgentError(data.error, conversationID));
                        } else {
                            $scope.$applyAsync(() => pushAgentError("Unexpected chat response.", conversationID));
                        }
                    } catch (e) {
                        console.log(e);
                        $scope.$applyAsync(() => pushAgentError("Malformed response from server.", null));
                    }
                },
                function () { $scope.chatWaitVisible = false; },
                function (err) {
                    $scope.chatWaitVisible = false;
                    const msg = (err && (err.message || err.toString())) || "Chat connection error.";
                    $scope.$applyAsync(() => pushAgentError(msg, null));
                }
            );
        }
    };

    $scope.kbSearchText = "";
    $scope.kbSearchResults = {};
    $scope.kbSearchResultsPretty = "";
    $scope.kbSearchWaitVisible = false;
    $scope.enableQueryExpander = false;
    $scope.kbSearchModalVisible = false;
    $scope.currentKB = null;
    $scope.currentRAG = null;
    $scope.currentSearchRagId = null;


    // From KB Table
    $scope.openKBSearchTest = function (kb) {

        if (!kb) return;

        $scope.currentKB = kb;
        $scope.currentRAG = null;

        $scope.currentSearchRagId = kb.ragID;

        $scope.kbSearchText = "";
        $scope.kbSearchResultsPretty = "";
        $scope.enableQueryExpander = false;
        $scope.kbSearchWaitVisible = false;

        $scope.kbSearchModalVisible = true;
    };


    // From Agent RAG
    $scope.openRAGSearchTest = function (rag) {

        if (!rag || !rag.ragID) return;

        $scope.currentKB = null;
        $scope.currentRAG = rag;

        $scope.currentSearchRagId = rag.ragID;

        $scope.kbSearchText = "";
        $scope.kbSearchResultsPretty = "";
        $scope.enableQueryExpander = false;
        $scope.kbSearchWaitVisible = false;

        $scope.kbSearchModalVisible = true;
    };

    $scope.closeKBSearchTest = function () {

        $scope.kbSearchModalVisible = false;
        $scope.currentKB = null;
        $scope.currentRAG = null;
        $scope.currentSearchRagId = null;

        $scope.kbSearchText = "";
        $scope.kbSearchResults = {};
        $scope.kbSearchResultsPretty = "";
        $scope.enableQueryExpander = false;
        $scope.kbSearchWaitVisible = false;
    };

    $scope.sendKBSearchRequest = function () {

        if (!$scope.currentSearchRagId) {
            console.warn("No RAG selected.");
            return;
        }

        if (!$scope.kbSearchText || !$scope.kbSearchText.trim()) {
            console.warn("Search text is empty.");
            return;
        }

        const tenant = localStorage.getItem("tenant");
        const token = localStorage.getItem("AuthToken");

        if (!tenant || !token) {
            swal("Session Expired", "Please login again.", "error");
            return;
        }

        $scope.kbSearchWaitVisible = true;

        const baseUrl =
            window.ENV.API_BASE_URL +
            "/tenant/" +
            tenant +
            "/packages.Awareness.assistant.api.searchKnowledgeBase.main";

        $http({
            method: "GET",
            url: baseUrl,
            params: {
                ragID: $scope.currentSearchRagId,
                searchText: $scope.kbSearchText.trim(),
                enableQueryExpander: $scope.enableQueryExpander
            },
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        }).then(function (response) {

            const resultData = response.data?.result || response.data;

            $scope.kbSearchResults = resultData;
            $scope.kbSearchResultsPretty =
                JSON.stringify(resultData, null, 4);

        }).catch(function (error) {

            console.error("KB Search Error:", error);

            const errorMessage =
                error.data?.message ||
                error.statusText ||
                "Unknown error occurred";

            swal({
                title: "Search Failed",
                text: errorMessage,
                type: "error",
                confirmButtonColor: "#f2533e"
            });

        }).finally(function () {
            $scope.kbSearchWaitVisible = false;
        });
    };

    $scope.clearSearch = function () {
        $scope.searchText.tools = '';
        $scope.searchText.agents = '';
        $scope.searchText.kbs = '';
        $scope.searchText.rags = '';
        $scope.searchText.llms = '';
        $scope.searchText.teams = '';
        $scope.searchText.apps = '';
    };

    // Apply Changes: Post the JSON spec to the REST API and retrieve response.
    $scope.applyChanges = function() {
        $scope.inProgressVisible = true;
        $http.post(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.Awareness.dashboard.services.api.importAll.main", JSON.stringify($scope.spec),
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                    "Content-Type": "application/json"
                }
            })
            .then(function(response) {
                $scope.inProgressVisible = false;
                if (response.data.status == "success") {
                    swal({
                        title: "Done",
                        text: "Your changes have been saved successfully.",
                        type: "success",
                        confirmButtonColor: "#2C61F5" // Bootstrap green
                    });

                    $('.confirm').addClass('blur_btn');

                    // Remove class when button is clicked
                    setTimeout(function () {
                        $('.confirm').one('click', function () {
                            $(this).removeClass('blur_btn');

                        });
                    }, 100);
                } else {
                    swal({
                        title: "Error",
                        text: "An error occurred while saving your changes. Please try again.",
                        type: "error",
                        confirmButtonColor: "#f2533e" // Red color
                    });

                }
                $scope.disableConfirmDelete = false;
            }, function(error) {
                swal({
                    title: "Apply Failed",
                    text: "Failed to apply changes. Error: " + error.statusText,
                    type: "error",
                    confirmButtonColor: "#f2533e" // Optional: red shade for error
                });

            });
    };

    $scope.filterTeamsForApp = function() {
        $scope.teamsPopUpHeading = 'Add Team';
        if ($scope.appId == null || $scope.appId == "" || true) {
            return $scope.spec.Teams;
        }
        let filtered = [];
        for (let i = 0 ; i < $scope.spec.Teams.length ; i++) {
            if ($scope.spec.Teams[i].appId === $scope.appId) {
                filtered.push($scope.spec.Teams[i]);
            }
        }
        return filtered;
    }

    $scope.filterAgentsForApp = function() {
        if ($scope.appId == null || $scope.appId == "" || true) {
            const list = ($scope.spec && $scope.spec.Agents) || [];
            return list
                .slice()
                .sort((a, b) => Number(b.createdDate || 0) - Number(a.createdDate || 0));
        }
        let filtered = [];
        for (let i = 0 ; i < $scope.spec.Agents.length ; i++) {
            if ($scope.spec.Agents[i].appId === $scope.appId) {
                filtered.push($scope.spec.Agents[i]);
            }
        }
        return filtered;
    }

    $scope.filterToolsForApp = function() {

        if ($scope.appId == null || $scope.appId == "" || true) {
            return $scope.spec.Tools;
        }
        let filtered = [];
        for (let i = 0 ; i < $scope.spec.Tools.length ; i++) {
            if ($scope.spec.Tools[i].appId === $scope.appId) {
                filtered.push($scope.spec.Tools[i]);
            }
        }
        return filtered;
    }

    function getAjaxErrorMessage(xhr, fallback) {
        const defaultMessage = fallback || "An unexpected error occurred.";
        if (!xhr) return defaultMessage;

        if (xhr.responseJSON && typeof xhr.responseJSON.error === "string" && xhr.responseJSON.error) {
            return xhr.responseJSON.error;
        }

        if (xhr.responseJSON && xhr.responseJSON.error && xhr.responseJSON.error.error_name) {
            return xhr.responseJSON.error.error_name;
        }

        if (typeof xhr.responseText === "string" && xhr.responseText) {
            try {
                const parsed = JSON.parse(xhr.responseText);
                if (parsed && typeof parsed.error === "string" && parsed.error) {
                    return parsed.error;
                }
            } catch (e) {}
        }

        return xhr.statusText || defaultMessage;
    }

    function getResponseErrorMessage(res, fallback) {
        if (!res) return fallback || "An unexpected error occurred.";
        if (typeof res.error === "string" && res.error) return res.error;
        if (res.error && res.error.error_name) return res.error.error_name;
        return fallback || "An unexpected error occurred.";
    }

    function normalizeAppRecord(app) {
        if (!app || typeof app !== "object") return null;

        if (app.appId || app.appName) {
            return Object.assign({
                appId: "",
                appName: "",
                description: "",
                appLink: "",
                LLMkey: "",
                terminationAgent: { identifier: "" },
                reportingAgent: { identifier: "" },
                managerAgents: []
            }, app);
        }

        return {
            appId: app.APP_ID || app.UUID || "",
            appName: app.NAME || "",
            name: app.NAME || "",
            description: app.DESCRIPTION || "",
            appLink: app.APP_LINK || "",
            LLMkey: app.LLM_KEY || "",
            terminationAgent: { identifier: app.TERMINATION_AGENT_ID || "" },
            reportingAgent: { identifier: app.REPORT_AGENT_ID || "" },
            createdOn: app.CREATED_ON || app.CREATED_TS_MS || null,
            createdTsMs: app.CREATED_TS_MS || null,
            modifiedTsMs: app.MODIFIED_TS_MS || null,
            uuid: app.UUID || app.APP_ID || "",
            managerAgents: []
        };
    }

    function normalizeTeamAgentRecord(agent) {
        if (!agent || typeof agent !== "object") return null;

        if (agent.identifier || agent.name) {
            return Object.assign({
                identifier: "",
                name: ""
            }, agent);
        }

        return {
            identifier: agent.AGENT_ID || agent.identifier || "",
            name: agent.NAME || agent.name || ""
        };
    }

    function normalizeTeamRecord(team) {
        if (!team || typeof team !== "object") return null;

        if (team.teamID || team.teamName) {
            return Object.assign({
                teamID: "",
                teamName: "",
                requirement: "",
                appId: "",
                managerId: "",
                Agents: [],
                editing: false,
                expanded: false
            }, team, {
                Agents: Array.isArray(team.Agents) ? team.Agents.map(normalizeTeamAgentRecord).filter(Boolean) : []
            });
        }

        return {
            teamID: team.TEAM_ID || "",
            teamName: team.NAME || "",
            requirement: team.REQUIREMENT || team.ROLE_DESCRIPTION_DECODED || "",
            appId: team.APP_ID || "",
            managerId: team.MANAGER_ID || "",
            Agents: Array.isArray(team.AGENTS) ? team.AGENTS.map(normalizeTeamAgentRecord).filter(Boolean) : [],
            editing: team.EDITING === true,
            expanded: team.EXPANDED === true
        };
    }

    function normalizeEnvironmentSpec(spec) {
        const normalizedSpec = Object.assign({}, spec || {});

        normalizedSpec.Apps = (normalizedSpec.Apps || normalizedSpec.APPS || [])
            .map(normalizeAppRecord)
            .filter(Boolean);

        normalizedSpec.Teams = (normalizedSpec.Teams || normalizedSpec.TEAMS || [])
            .map(normalizeTeamRecord)
            .filter(Boolean);

        return normalizedSpec;
    }

    function refreshEnvironmentSpec(onComplete) {
        const selectedAppId = ($scope.selectedApp && $scope.selectedApp.appId) || $scope.appId || null;
        const currentTeamId = ($scope.currentTeam && ($scope.currentTeam.teamID || $scope.currentTeam.identifier)) || null;

        SYNCLOOP_AI.CORE.exportAll(function (response) {
            if (isErrorResponse(response)) {
                if (typeof onComplete === "function") onComplete(response);
                return;
            }

            try {
                const exportSpec = normalizeEnvironmentSpec(extractExportSpec(response || {}));
                $scope.spec.LLMs = exportSpec.LLMs || [];
                $scope.spec.Agents = exportSpec.Agents || [];
                $scope.spec.Tools = exportSpec.Tools || [];
                $scope.spec.MCPs = exportSpec.MCPs || [];
                $scope.spec.ToolsRegistry = exportSpec.ToolsRegistry || [];
                $scope.spec.AgentTools = exportSpec.AgentTools || [];
                $scope.spec.RAGs = exportSpec.RAGs || [];
                $scope.spec.KBs = exportSpec.KBs || [];
                $scope.spec.EMBEDDING_MODELs = exportSpec.EMBEDDING_MODELs || [];
                $scope.spec.Apps = exportSpec.Apps || [];
                $scope.spec.Teams = exportSpec.Teams || [];

                $scope.spec.LLMs.forEach(function(LLM) { LLM["$$hashKey"] = null; });

                $scope.spec.KBs.forEach(function(KB) {
                    if (KB.kbID != null) KB.ragID = KB.kbID;
                    if (KB.ragID == null) KB.ragID = generateUUID();
                });

                $scope.spec.MCPs.forEach(function (mcp) {
                    if (typeof mcp.AUTH_INFO === "string") {
                        try {
                            mcp.AUTH_INFO = JSON.parse(mcp.AUTH_INFO);
                        } catch (e) {
                            mcp.AUTH_INFO = {};
                        }
                    }

                    mcp.mcpAuth = getDefaultMcpAuthConfig();

                    if (mcp.AUTH_TYPE) {
                        mcp.mcpAuth.type = mcp.AUTH_TYPE;
                    }

                    var auth = mcp.AUTH_INFO || {};

                    if (mcp.AUTH_TYPE === "OIDC") {
                        var oidcAuth = auth.config && auth.config.oidc ? auth.config.oidc : auth;
                        var oidcTokens = oidcAuth.tokens || {};

                        mcp.mcpAuth.config.oidc.issuer = oidcAuth.issuer || "";
                        mcp.mcpAuth.config.oidc.client_id = oidcAuth.client_id || "";
                        mcp.mcpAuth.config.oidc.client_secret = oidcAuth.client_secret || "";
                        mcp.mcpAuth.config.oidc.redirect_uri = oidcAuth.redirect_uri || $scope.oidcRedirectCallback;
                        mcp.mcpAuth.config.oidc.response_type = oidcAuth.response_type || "code";
                        mcp.mcpAuth.config.oidc.grant_type = oidcAuth.grant_type || "authorization_code";
                        mcp.mcpAuth.config.oidc.token_endpoint = oidcAuth.token_endpoint || "";
                        mcp.mcpAuth.config.oidc.authorization_endpoint = oidcAuth.authorization_endpoint || "";
                        mcp.mcpAuth.config.oidc.userinfo_endpoint = oidcAuth.userinfo_endpoint || "";
                        mcp.mcpAuth.config.oidc.jwks_uri = oidcAuth.jwks_uri || "";
                        mcp.mcpAuth.config.oidc.tokens.access_token = oidcTokens.access_token || "";
                        mcp.mcpAuth.config.oidc.tokens.refresh_token = oidcTokens.refresh_token || "";
                        mcp.mcpAuth.config.oidc.tokens.token_type = oidcTokens.token_type || "";
                        mcp.mcpAuth.config.oidc.tokens.expires_in = oidcTokens.expires_in || "";
                        mcp.mcpAuth.config.oidc.tokens.expires_at = oidcTokens.expires_at || "";
                        mcp.mcpAuth.config.oidc.tokens.scope = oidcTokens.scope || "";

                        if (Array.isArray(oidcAuth.scopes)) {
                            mcp.mcpAuth.config.oidc.scopesText = oidcAuth.scopes.join(", ");
                        }
                    } else if (mcp.AUTH_TYPE === "API_KEY") {
                        var apiKeyAuth = auth.config && auth.config.api_key ? auth.config.api_key : auth;
                        mcp.mcpAuth.config.api_key.header_name = apiKeyAuth.header_name || "";
                        mcp.mcpAuth.config.api_key.key = apiKeyAuth.key || "";
                        mcp.mcpAuth.config.api_key.prefix = apiKeyAuth.prefix || "";
                    } else if (mcp.AUTH_TYPE === "BASIC") {
                        var basicAuth = auth.config && auth.config.basic ? auth.config.basic : auth;
                        mcp.mcpAuth.config.basic.username = basicAuth.username || "";
                        mcp.mcpAuth.config.basic.password = basicAuth.password || "";
                        mcp.mcpAuth.config.basic.encode = basicAuth.encode || "base64";
                    }
                });

                recomputeAgentTeamTags();

                try {
                    if ($scope.spec && Array.isArray($scope.spec.Apps) &&
                        Array.isArray($scope.spec.Agents) && Array.isArray($scope.spec.Teams)) {

                        $scope.spec.Apps.forEach(function(app) {
                            app.managerAgents = [];
                            const appTeams = $scope.spec.Teams.filter(function(t) { return t.appId === app.appId; });

                            appTeams.forEach(function(team) {
                                if (!team.managerId) return;

                                const manager = $scope.spec.Agents.find(function(a) { return a.identifier === team.managerId; });
                                if (manager && !app.managerAgents.some(function(m) { return m.identifier === manager.identifier; })) {
                                    app.managerAgents.push({
                                        ...manager,
                                        isManager: true,
                                        teamName: team.teamName || ""
                                    });
                                }
                            });
                        });
                    }
                } catch (e) {
                    console.error("[Managers] Error mapping managers:", e);
                }

                if (selectedAppId) {
                    const refreshedSelectedApp = ($scope.spec.Apps || []).find(function(app) {
                        return app.appId === selectedAppId;
                    }) || null;

                    if (refreshedSelectedApp) {
                        $scope.selectedApp = refreshedSelectedApp;
                        $scope.appId = refreshedSelectedApp.appId;
                    } else if ($scope.selectedApp && $scope.selectedApp.appId === selectedAppId) {
                        $scope.selectedApp = null;
                    }
                }

                if (currentTeamId) {
                    $scope.currentTeam = ($scope.spec.Teams || []).find(function(team) {
                        return team.teamID === currentTeamId || team.identifier === currentTeamId;
                    }) || $scope.currentTeam;
                }

                $scope.$applyAsync();
                if (typeof onComplete === "function") onComplete();
            } catch (e) {
                if (typeof onComplete === "function") {
                    onComplete({
                        status: "failed",
                        error: (e && e.message) || "Failed to refresh data."
                    });
                }
            }
        }, function(xhr, status, error) {
            if (typeof onComplete === "function") {
                onComplete({
                    status: "failed",
                    error: error || status || ((xhr || {}).statusText) || "Failed to refresh data."
                });
            }
        });
    }

    $scope.loadApps = function(onComplete) {
        $scope.inProgressApps = true;
        refreshEnvironmentSpec(function(result) {
            $scope.inProgressApps = false;
            if (typeof onComplete === "function") onComplete(result);
        });
    }



    $scope.deleteConversation = function(conversation) {
        swal({
            title: "Are you sure?",
            text: "Once you click 'Yes' this Chat will be permanently deleted and cannot be recovered",
            imageUrl: "Awareness/pub/images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
        }, function () {
            // Optional: show loading indicator while processing
            swal({
                title: "Deleting...",
                text: "Please wait while we delete the chat history.",
                imageUrl: "https://i.imgur.com/4NZ6uLY.jpg",
                showConfirmButton: false,
                confirmButtonColor: "#f2533e", // Optional styling
                allowOutsideClick: false,
                allowEscapeKey: false
            });


            SYNCLOOP_AI.CONVERSATIONS.delete(conversation.IDENTIFIER, function (response) {
                const index = $scope.Conversations.indexOf(conversation);
                if (index > -1) {
                    $scope.Conversations.splice(index, 1);
                    $scope.filterTeamsConversations();
                }
                $scope.$applyAsync();
                $scope.startNewChat();

                swal({
                    title: "Deleted",
                    text: "Conversation deleted successfully!",
                    type: "success",
                    confirmButtonColor: "#2C61F5" // Green
                });


            }, function (xhr, status, error) {
                swal({
                    title: "Failed",
                    text: "Unable to delete the conversation.",
                    type: "error",
                    confirmButtonColor: "#f2533e" // Red color for error
                });

            });
        });
    }

    function safeAsync(fn){ ($scope.$root && $scope.$root.$$phase) ? $scope.$evalAsync(fn) : $scope.$applyAsync(fn); }

    $scope.deleteAllConversations = function () {
        var list = Array.isArray($scope.Conversations) ? $scope.Conversations.slice() : [];
        var total = list.length;
        if (!total) {
            swal({ title: "Nothing to delete", text: "No conversations found.", type: "info", confirmButtonColor: "#2C61F5" });
            return;
        }

        swal({
            title: "Delete all chats?",
            text: "This will permanently delete " + total + " conversation(s).",
            imageUrl: "Awareness/pub/images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Yes, delete all",
            closeOnConfirm: false
        }, function () {
            swal({
                title: "Deleting…",
                text: "Please wait while we delete " + total + " conversation(s).",
                imageUrl: "https://i.imgur.com/4NZ6uLY.jpg",
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            var i = 0, deleted = 0, failed = 0;

            (function next(){
                if (i >= total) {
                    $scope.currentConversation = null;
                    $scope.chatHistory = [];
                    $scope.conversationID = null;
                    $scope.showWelcomeBubble = true;
                    $scope.TeamsConversations.length = 0;

                    return safeAsync(function(){
                        swal({
                            title: failed ? "Completed with warnings" : "Deleted",
                            text: "Deleted " + deleted + " of " + total + " conversation(s)." + (failed ? (" Failed: " + failed + ".") : ""),
                            type: failed ? "warning" : "success",
                            confirmButtonColor: "#2C61F5"
                        });
                    });
                }

                var conv = list[i++];

                SYNCLOOP_AI.CONVERSATIONS.delete(conv.IDENTIFIER, function () {
                    deleted++;

                    var idx = $scope.Conversations.findIndex(function(c){ return c.IDENTIFIER === conv.IDENTIFIER; });
                    if (idx > -1) $scope.Conversations.splice(idx, 1);

                    if ($scope.currentConversation && $scope.currentConversation.IDENTIFIER === conv.IDENTIFIER) {
                        $scope.currentConversation = null;
                        $scope.chatHistory = [];
                        $scope.conversationID = null;
                        $scope.showWelcomeBubble = true;
                    }

                    $scope.filterTeamsConversations();

                    safeAsync(next);
                }, function () {
                    failed++;
                    safeAsync(next);
                });
            })();
        });
    };

    function asPlainJsonString(maybeB64OrJson) {
        if (!maybeB64OrJson) return "{}";
        try { JSON.parse(maybeB64OrJson); return maybeB64OrJson; } catch (_) {}
        try {
            const decoded = $scope.decodeBase64(maybeB64OrJson);
            JSON.parse(decoded);
            return decoded;
        } catch (_) {
            return "{}";
        }
    }

    function asPlainText(maybeB64OrText) {
        try { return $scope.decodeBase64(maybeB64OrText || ""); } catch(_) { return String(maybeB64OrText || ""); }
    }

    function makeCopyName(baseName, allNames) {
        const base = (baseName || 'Untitled').trim();
        const s = new Set(allNames.map(n => (n || '').trim()));
        let candidate = `${base} Copy`;
        if (!s.has(candidate)) return candidate;
        let i = 2;
        while (s.has(`${base} Copy${i}`)) i++;
        return `${base} Copy${i}`;
    }

    $scope.duplicateTool = function (sourceTool, newAgentId) {
        return new Promise((resolve, reject) => {
            const schemaStr        = asPlainJsonString(sourceTool.inputJSONSchema || sourceTool.inputJSONSchemaDecoded || "{}");
            const staticPayloadStr = asPlainJsonString(sourceTool.staticJsonPayload || sourceTool.staticPayload || "{}");
            const descPlain        = asPlainText(sourceTool.functionDescription || sourceTool.functionDescriptionDecoded || "");

            const baseFqn = String(sourceTool.fqn || "").trim();

            const existingFqns = ($scope.spec.Tools || [])
                .filter(t => t.identifier === newAgentId)
                .map(t => String(t.fqn || "").trim());

            const newFqn = makeCopyName(baseFqn, existingFqns);

            SYNCLOOP_AI.TOOLS.upsertTool(
                newAgentId,
                newFqn,
                staticPayloadStr,
                schemaStr,
                descPlain,
                function onOk(resp) {
                    ($scope.spec.Tools = $scope.spec.Tools || []).push({
                        identifier: newAgentId,
                        fqn: newFqn,
                        inputJSONSchema: schemaStr,
                        staticJsonPayload: staticPayloadStr,
                        functionDescription: $scope.encodeBase64 ? $scope.encodeBase64(descPlain) : descPlain,
                        functionDescriptionDecoded: descPlain
                    });
                    if (!$scope.$$phase) $scope.$applyAsync();
                    resolve(resp);
                },
                function onErr(xhr, status, err) {
                    reject(err || (xhr && (xhr.responseJSON?.error || xhr.statusText)) || status);
                }
            );
        });
    };

    $scope.duplicateRAG = function (sourceRag, newAgentId) {
        return new Promise((resolve, reject) => {
            const newRagIdentifier = generateUUID();
            const directory        = sourceRag.path || '';
            const fileNamePattern  = sourceRag.filePattern || '*.txt';

            SYNCLOOP_AI.RAG.upsertRAG(
                newAgentId,
                newRagIdentifier,
                directory,
                fileNamePattern,
                function onOk(resp) {
                    ($scope.spec.RAGs = $scope.spec.RAGs || []).push({
                        path: directory,
                        identifier: newRagIdentifier,
                        filePattern: fileNamePattern,
                        ESKey: newRagIdentifier,
                        EMKey: sourceRag.EMKey,
                        ragID: newAgentId,
                        maxSegmentSizeInChars: sourceRag.maxSegmentSizeInChars,
                        personalityId: newAgentId,
                        maxOverlapSizeInChars: sourceRag.maxOverlapSizeInChars,
                        maxSearchResults: sourceRag.maxSearchResults
                    });
                    resolve(resp);
                },
                function onErr(xhr, status, err) {
                    reject(err || (xhr && (xhr.responseJSON?.error || xhr.statusText)) || status);
                }
            );
        });
    };

    $scope.duplicateAgent = function (agent) {
        if (!agent) return;

        swal({
            title: "Duplicate this agent?",
            text: `A copy of “${agent.name || 'Untitled'}” will be created (Tools & RAGs included).`,
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, duplicate",
            confirmButtonColor: "#2C61F5",
            cancelButtonText: "Cancel"
        }, function (isConfirm) {
            if (!isConfirm) return;

            (async function () {
                try {
                    const allAgents  = ($scope.spec && $scope.spec.Agents) || [];
                    const newAgentId = generateUUID();
                    const newName    = makeCopyName(agent.name, allAgents.map(a => a.name));

                    const baseDesc = agent.roleDescriptionDecoded
                        || ($scope.decodeBase64 ? $scope.decodeBase64(agent.roleDescription || '') : agent.roleDescription || '');

                    const tone       = agent.tone || '';
                    const guardrails = agent.guardrails || '';

                    const descDecoded = (baseDesc || '') +
                        ":::: Tone instructions are ::::" + tone +
                        ":::: Guardrails instructions are ::::" + guardrails;

                    const llmKey  = agent.LLMkey || '';
                    const icon    = agent.icon || "pub/images/robot-icon.svg";
                    const webSearch = agent.isThinkActive || false;
                    const agentProps = resolveAgentPropsFromLLM(llmKey);

                    const agentResp = await new Promise((resolve, reject) => {
                        SYNCLOOP_AI.AGENTS.upsertAgent(
                            newAgentId,
                            agent.title || "",
                            newName,
                            descDecoded,
                            llmKey,
                            icon,
                            webSearch,
                            agentProps,
                            resolve,
                            (xhr, status, err) => reject(xhr?.responseJSON?.error || err || status)
                        );
                    });

                    if (agentResp && (agentResp.status === 'failed' || agentResp.success === false)) {
                        const msg = agentResp.error || "Agent create failed.";
                        swal({
                            title: "Agent not created",
                            text: msg,
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });
                        return;
                    }

                    const newAgentObj = {
                        identifier: newAgentId,
                        name: newName,
                        title: agent.title || "",
                        LLMkey: llmKey,
                        roleDescription: utf8ToBase64(baseDesc || ''),
                        roleDescriptionDecoded: descDecoded,
                        tone: tone,
                        guardrails: guardrails,
                        icon: icon,
                        props: agentProps,
                        isThinkActive: webSearch,
                        createdDate: Date.now(),
                        userId: agent.userId || "admin"
                    };

                    allAgents.push(newAgentObj);

                    if (!$scope.$$phase) $scope.$applyAsync();

                    const sourceTools = ($scope.spec.Tools || []).filter(t => t.identifier === agent.identifier);
                    for (const t of sourceTools) {
                        try { await $scope.duplicateTool(t, newAgentId); }
                        catch (e) { console.error("Tool duplicate failed:", t.fqn, e); }
                    }

                    const sourceRags = ($scope.spec.RAGs || []).filter(r =>
                        r.ragID === agent.identifier || r.personalityId === agent.identifier
                    );
                    for (const r of sourceRags) {
                        try { await $scope.duplicateRAG(r, newAgentId); }
                        catch (e) { console.error("RAG duplicate failed:", r.identifier, e); }
                    }

                    swal({
                        title: "Duplicated!",
                        text: `Created “${newName}”.`,
                        type: "success",
                        confirmButtonColor: "#2C61F5"
                    });

                } catch (e) {
                    const msg = (typeof e === 'string') ? e : (e?.message || 'Unknown error');
                    swal({
                        title: "Error",
                        text: msg,
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                }
            })();
        });
    };

    $timeout(function () {
        $('#llmSelect').select2({
            placeholder: 'Select an LLM',
            allowClear: true,
            width: '100%'
        })
            .off('change.llm select2:select select2:clear')
            .on('change.llm select2:select select2:clear', function () {
                var val = $(this).val() || '';
                $scope.$applyAsync(function () {
                    val = (typeof val === 'string'
                        ? val.replace(/^\w+:/, '').trim()
                        : '');
                    if(val === ''){
                        return;
                    }
                    $scope.agentForm.llmKey = val;
                    $scope.queueAgentAutosave();
                });
            });
    }, 0);

    $scope.clearChatHistory = function() {
        swal({
            title: "Are you sure?",
            text: "You will not be able to recover all chat histories!",
            imageUrl: "Awareness/pub/images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
        }, function () {

            // Loading state
            swal({
                title: "Deleting...",
                text: "Please wait while we delete all chat histories.",
                imageUrl: "https://i.imgur.com/4NZ6uLY.jpg",
                showConfirmButton: false,
                confirmButtonColor: "#f2533e", // Optional (has no visible effect when confirmButton is hidden)
                allowOutsideClick: false,
                allowEscapeKey: false
            });


            SYNCLOOP_AI.CONVERSATIONS.clearChatHistory(
                "",
                $scope.TeamsConversations.map(chat => chat.identifier),
                function (response) {
                    $scope.TeamsConversations = [];
                    $scope.$applyAsync();
                    $scope.startNewChat();

                    swal({
                        title: "Deleted",
                        text: "All conversations are deleted successfully!",
                        type: "success",
                        confirmButtonColor: "#2C61F5" // green button
                    });

                },
                function (xhr, status, error) {
                    swal({
                        title: "Failed",
                        text: "Unable to delete conversations.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                }
            );
        });
    };



    $scope.TeamsConversations = [];

    $scope.filterTeamsConversations = function() {

        if (null ==  $scope.currentChatAgent) {
            return ;
        }
        let agentId = $scope.currentChatAgent.identifier;
        if (null == agentId) {
            return ;
        }

        $scope.TeamsConversations = [];

        for (let i = 0 ; i < $scope.Conversations?.length ; i++) {
            if (agentId == $scope.Conversations[i].AGENTID) {
                $scope.TeamsConversations.push($scope.Conversations[i]);
            }
        }

        $scope.$applyAsync();
    }

    $scope.filterTeamsConversationsOnSearch = function(conversation) {

        if (!$scope.searchTeamChatText) {
            return true;
        }

        return conversation.SUBJECT.toLowerCase().includes($scope.searchTeamChatText.toLowerCase());
    }

    $scope.loadConversations = function() {
        SYNCLOOP_AI.CONVERSATIONS.findAll(function (response) {

            if (null != response.conversations) {
                response.conversations.sort((a, b) => Number(b.dateTime) - Number(a.dateTime));
            }
            $scope.Conversations = response.conversations;
            $scope.filterTeamsConversations();

        }, function(xhr, status, error) {

        })
    }

    $scope.getShareToConsumers = function() {
        let value = $("#agent_share_option").val();

        /*let userKey = Object.keys($scope.users);

        let groups = [];

        for (let i = 0 ; i < userKey.length ; i++) {
            if (value == userKey[i]) {
                groups.push(...$scope.users[userKey[i]].profile.groups)
            }
        }

        return groups;*/
        return value;
    }

    $scope.getEMName = function( EMKey ){
        const model = $scope.spec.EMBEDDING_MODELs.find(
            m => m.EMkey === EMKey
        );
        if (null == model) {
            return "Unknown";
        }
        return model.displayName;
    }

    $scope.getESName = function( EMKey ){
        const model = $scope.spec.EMBEDDING_MODELs.find(
            m => m.EMkey === EMKey
        );

        if (null == model) {
            return "Unknown";
        }

        let properties = model.properties;

        if (properties.store_name === "QDRANT") {
            return "Qdrant";
        }

        return "In Built";
    }

    $scope.loadChanges = function() {
        $scope.minisidebar_class = localStorage.getItem("minisidebar");
        if (null != $scope.minisidebar_class) {
            $scope.main_wrapper_view = 'fullleft-width';
        }



        fetch(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.service.getCurrentUserAccount.main",
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.text())
            .then(resp => {
                let USER_PROFILE = JSON.parse(resp);
                $scope.currentUserId = USER_PROFILE.userId; // <-- ADD THIS
                fetch(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/jwt?expiration_time=2" + "&userID=" + USER_PROFILE.userId + "&token_key=default-token",
                    {
                        headers: {
                            "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                            "Content-Type": "application/json"
                        }
                    })
                    .then(response => response.text())
                    .then(token => { $scope.jwtToken = token; })
                    .catch(error => { console.error("Fetch error:", error); });
            })
            .catch(error => { console.error("Fetch error:", error); });

        $scope.isMyAgent = function (a) {
            if (!a) return false;

            var me = ($scope.currentUserId || '').toString().toLowerCase();

            return (a.ownerId && String(a.ownerId).toLowerCase() === me) ||
                (a.createdBy && String(a.createdBy).toLowerCase() === me) ||
                (a.userId    && String(a.userId).toLowerCase()    === me) ||
                (typeof a.owner === 'string' && a.owner.toLowerCase() === 'me');
        };

        $scope.notMyAgent = function (a) {
            return !$scope.isMyAgent(a);
        };

        $scope.isSystemAgent = function (agent) {
            return agent && agent.userId === 'SYSTEM';
        };

        $scope.notSystemAgent = function (agent) {
            return !agent || agent.userId !== 'SYSTEM';
        };

        $scope.agentStatus = function (a) { return (a && a.active === false) ? 'Not working' : 'Active'; };


        $scope.loadSysInfo = function() {
            $http.get(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.server.build.api.SysInfo.main",
                {
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                        "Content-Type": "application/json"
                    }
                }).then(function (resp) {
                $scope.currentHost = resp.data.api_url.endsWith("/") ? resp.data.api_url : resp.data.api_url + "/";
                $scope.$applyAsync();
            }, function (err) {

            });
        }

        $scope.loadSysInfo();

        $scope.loadConversations();

        $scope.inProgressVisible = true;

        $scope.loadTeams = function(onComplete) {
            $scope.isLoadingTeams = true;
            $scope.$applyAsync();

            refreshEnvironmentSpec(function(result) {
                $scope.isLoadingTeams = false;
                $scope.$applyAsync();
                if (typeof onComplete === "function") onComplete(result);
            });
        };

        function loadTeamsAsync () {
            $scope.isLoadingTeams = true;
            $scope.$applyAsync();

            return new Promise(function (resolve, reject) {
                refreshEnvironmentSpec(function(result) {
                    $scope.isLoadingTeams = false;
                    $scope.$applyAsync();

                    if (result) {
                        reject(result);
                    } else {
                        resolve();
                    }
                });
            });
        }

        const requestBody = {
            method: 'GET',
            url: "https://cdn.syncloop.com/available_models.json"
        };

        $scope.onModelChange = function (providerKey) {
            const selected = $scope.llmEdit[providerKey].modelName;

            if (selected === '__other__') {
                $scope.llmEdit[providerKey].useCustomModel = true;
                $scope.llmEdit[providerKey].customModelName = '';
            } else {
                $scope.llmEdit[providerKey].useCustomModel = false;
                $scope.llmEdit[providerKey].customModelName = null;
            }
        };


        function appendOther(models) {
            return [
                ...(models || []),
                {
                    model_name: '__other__',
                    pretty_name: 'Other',
                    badges: []
                }
            ];
        }

        function ensureClaudeProviderFallback() {
            if ($scope.llmMeta.claude) return;

            const claudeModels = appendOther([
                {
                    model_name: 'claude-sonnet-4-20250514',
                    pretty_name: 'Claude Sonnet 4',
                    description: 'Anthropic Claude Sonnet 4 model.',
                    base_url: 'https://api.anthropic.com/v1',
                    default_temperature: 0.7,
                    top_p: 0.9,
                    max_token_limit: 200000,
                    enable_tool_calling: true,
                    enable_pfc: false,
                    is_default: 1,
                    badges: ['DEFAULT'],
                    properties: {
                        currency: 'USD',
                        ppm_input: 0,
                        ppm_output: 0
                    }
                },
                {
                    model_name: 'claude-opus-4-1-20250805',
                    pretty_name: 'Claude Opus 4.1',
                    description: 'Anthropic Claude Opus 4.1 model.',
                    base_url: 'https://api.anthropic.com/v1',
                    default_temperature: 0.7,
                    top_p: 0.9,
                    max_token_limit: 200000,
                    enable_tool_calling: true,
                    enable_pfc: false,
                    badges: [],
                    properties: {
                        currency: 'USD',
                        ppm_input: 0,
                        ppm_output: 0
                    }
                },
                {
                    model_name: 'claude-3-7-sonnet-latest',
                    pretty_name: 'Claude 3.7 Sonnet',
                    description: 'Anthropic Claude 3.7 Sonnet model.',
                    base_url: 'https://api.anthropic.com/v1',
                    default_temperature: 0.7,
                    top_p: 0.9,
                    max_token_limit: 200000,
                    enable_tool_calling: true,
                    enable_pfc: false,
                    badges: [],
                    properties: {
                        currency: 'USD',
                        ppm_input: 0,
                        ppm_output: 0
                    }
                }
            ]);

            $scope.llmProviders.claude = claudeModels;
            $scope.llmMeta.claude = {
                logo_icon: 'claude-icon.svg',
                company_id: 'claude',
                company_name: 'Claude',
                website_url: 'https://www.anthropic.com',
                api_key_doc_url: 'https://console.anthropic.com/settings/keys',
                free_token_limit: null,
                api_base_endpoint: 'https://api.anthropic.com/v1',
                default_latest_model_id: 'claude-sonnet-4-20250514',
                default_model: claudeModels[0],
                api_provider: 'claude'
            };
        }

        $http
            .post(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.client.http.requestAPI.main", requestBody,
                {
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                        "Content-Type": "application/json"
                    }
                })
            .then(function (resp) {
                resp.data = JSON.parse(resp.data.respPayload);
                if (!resp.data || !resp.data.response) return;
                const providers = resp.data.response;

                providers.forEach(p => {
                    const key = (p.company_name || '').toLowerCase();

                    p.models = (p.models || []).map(m => {
                        const pricing = m.pricing || {};
                        m.properties = {
                            currency: pricing.currency || 'USD',
                            ppm_input: typeof pricing.input_price === 'number' ? pricing.input_price : 0,
                            ppm_output: typeof pricing.output_price === 'number' ? pricing.output_price : 0
                        };
                        return m;
                    });

                    const models = p.models || [];
                    const defaultByFlag = models.find(m => m.is_default === 1);
                    const def = defaultByFlag
                        ? defaultByFlag
                        : (p.default_model && typeof p.default_model === 'object' ? p.default_model : {});

                    if (def && Object.keys(def).length) {
                        const pricing = def.pricing || {};
                        def.properties = {
                            currency: pricing.currency || 'USD',
                            ppm_input: typeof pricing.input_price === 'number' ? pricing.input_price : 0,
                            ppm_output: typeof pricing.output_price === 'number' ? pricing.output_price : 0
                        };
                        p.default_model = def;
                    }

                    const entry = {
                        logo_icon: p.logo_icon || '',
                        company_id: p.company_id,
                        company_name: p.company_name,
                        website_url: p.website_url,
                        api_key_doc_url: p.api_key_doc_url,
                        free_token_limit: p.free_token_limit,
                        api_base_endpoint: p.api_base_endpoint,
                        default_latest_model_id: p.default_latest_model_id,
                        default_model: p.default_model || {},
                        api_provider: p.api_provider || ''
                    };

                    if (key.includes('openai'))    { $scope.llmProviders.openai    = p.models || []; $scope.llmMeta.openai    = entry; }
                    else if (key.includes('google')) { $scope.llmProviders.google    = p.models || []; $scope.llmMeta.google    = entry; }
                    else if (key.includes('claude') || key.includes('anthropic')) { $scope.llmProviders.claude = appendOther(p.models || []); $scope.llmMeta.claude = entry; }
                    else if (key.includes('xai')) { $scope.llmProviders.xai = p.models || []; $scope.llmMeta.xai = entry; }
                    else if (key.includes('mistral'))   { $scope.llmProviders.mistral   = p.models || []; $scope.llmMeta.mistral   = entry; }
                    else if (key.includes('groq'))   { $scope.llmProviders.groq   = appendOther(p.models || []); $scope.llmMeta.groq   = entry; }
                });

                ensureClaudeProviderFallback();

                if (providers && providers.length > 0) {
                    const firstProvider = (providers.find(p => p.default_model) || providers[0]).company_name.toLowerCase();
                    $scope.activeProvider = firstProvider;

                    Object.keys($scope.llmMeta).forEach(provider => {
                        // const def = $scope.llmMeta[provider].default_model || {};
                        const models = $scope.llmProviders[provider] || [];
                        const defaultByFlag = models.find(m => m.is_default === 1);

                        const def = defaultByFlag
                            ? defaultByFlag
                            : ($scope.llmMeta[provider].default_model || {});

                        const props = def.properties || { currency: 'USD', ppm_input: 0, ppm_output: 0 };

                        $scope.llmEdit[provider] = {
                            modelName: def.model_name,
                            displayName: def.pretty_name,
                            description: def.description,
                            providerChoice: $scope.llmMeta[provider].api_provider || provider,
                            baseUrl: def.base_url || $scope.llmMeta[provider].api_base_endpoint,
                            temperature: Number(def.default_temperature) || null,
                            topP: Number(def.top_p) || null,
                            maxTokens: Number(def.max_token_limit) || null,
                            pfc: normalizeBool(def.enable_pfc),
                            toolCalling: normalizeBool(def.enable_tool_calling),
                            apiKey: '',
                            logoIcon: $scope.llmMeta[provider].logo_icon,
                            companyId: $scope.llmMeta[provider].company_id,
                            companyName: $scope.llmMeta[provider].company_name,
                            websiteUrl: $scope.llmMeta[provider].website_url,
                            apiKeyDocUrl: $scope.llmMeta[provider].api_key_doc_url,
                            apiBaseEndpoint: $scope.llmMeta[provider].api_base_endpoint,
                            freeTokenLimit: $scope.llmMeta[provider].free_token_limit,
                            defaultModelId: $scope.llmMeta[provider].default_latest_model_id,
                            apiProvider: $scope.llmMeta[provider].api_provider || '',
                            properties: props,
                            badges: def.badges
                        };

                        const found = models.find(m => m.model_name === def.model_name);
                        if (found) $scope.llmSelectedModel[provider] = found;
                    });

                    $timeout(() => {
                        if (typeof $scope.onModelSelect === 'function') {
                            $scope.onModelSelect(firstProvider, $scope.llmEdit[firstProvider].modelName);
                        }
                    }, 0);
                }
            })
            .catch(function (err) {
                console.error('Failed to fetch LLM details:', err);
            });

        $scope.isTempReadonly = false;
        $scope.isTopPReadonly = false;
        $scope.isMaxTokensReadonly = false;

        $scope.onModelSelect = function (provider, modelName) {
            provider = (provider || '').toLowerCase();
            $scope.llmEdit[provider].modelName = modelName;
            const list = Array.isArray($scope.llmProviders[provider]) ? $scope.llmProviders[provider] : [];
            const m = list.find(x => x.model_name === modelName);
            if (!m) return;

            $scope.llmEdit[provider].modelName   = m.model_name || '';
            $scope.llmEdit[provider].displayName = m.pretty_name || m.model_name || '';
            $scope.llmEdit[provider].description = m.description || '';
            $scope.llmEdit[provider].baseUrl     = m.base_url || '';
            $scope.llmEdit[provider].temperature = Number(m.default_temperature) || null;
            $scope.llmEdit[provider].maxTokens   = Number(m.max_token_limit) || null;
            $scope.llmEdit[provider].topP        = Number(m.top_p) || null;
            $scope.llmEdit[provider].pfc         = normalizeBool(m.enable_pfc);
            $scope.llmEdit[provider].toolCalling = normalizeBool(m.enable_tool_calling);
            $scope.llmEdit[provider].badges = m.badges || '';

            $scope.llmSelectedModel[provider] = m;

            $scope.isTempReadonly = m.default_temperature == null;
            $scope.isTopPReadonly = m.top_p == null;
            $scope.isMaxTokensReadonly = m.max_token_limit == null;
            $scope.sstcDisabled = $scope.llmEdit[provider].toolCalling == false;

            const meta = $scope.llmMeta[provider] || {};
            $scope.llmEdit[provider].logoIcon        = meta.logo_icon || '';
            $scope.llmEdit[provider].companyId       = meta.company_id || null;
            $scope.llmEdit[provider].companyName     = meta.company_name || '';
            $scope.llmEdit[provider].websiteUrl      = meta.website_url || '';
            $scope.llmEdit[provider].apiKeyDocUrl    = meta.api_key_doc_url || '';
            $scope.llmEdit[provider].apiBaseEndpoint = meta.api_base_endpoint || '';
            $scope.llmEdit[provider].freeTokenLimit  = meta.free_token_limit || null;
            $scope.llmEdit[provider].defaultModelId  = meta.default_latest_model_id || null;

            const props = m.properties || {};
            $scope.llmEdit[provider].properties = {
                ppm_input:  typeof props.ppm_input === 'number' ? props.ppm_input : 0,
                ppm_output: typeof props.ppm_output === 'number' ? props.ppm_output : 0,
                currency:   props.currency || 'USD'
            };

            $timeout(function () {
                const selector = `.llm-select`;
                const $select = $(selector);

                if (!$select.length) return;

                const currentVal = $select.val();
                if (currentVal !== modelName) {
                    $select
                        .val(modelName)
                        .trigger('change.select2');
                }
            }, 0);
        };

        $scope.resetLLMFields = function() {
            ['openai','google','xai','mistral','groq','otheragent'].forEach(p => {
                $scope.llmEdit[p] = {
                    modelName: '', displayName: '', description: '',
                    baseUrl: '', temperature: null, maxTokens: null, topP: null,
                    apiKey: '', pfc: false,
                    logoIcon: '', companyId: null, companyName: '', websiteUrl: '',
                    apiKeyDocUrl: '', apiBaseEndpoint: '', freeTokenLimit: null, defaultModelId: null,
                    properties: { currency: 'USD', ppm_input: 0, ppm_output: 0 }
                };
                $scope.llmSelectedModel[p] = null;
            });
        };

        function normalizeBool(value) {
            if (value === true || value === false) return value;
            if (value === 1 || value === '1' || value === 'true') return true;
            return false;
        }

        $scope.onToggleChange = function (providerKey, field) {
            const value = !!$scope.llmEdit[providerKey][field];
            $scope.llmEdit[providerKey][field] = value;
        };

        SYNCLOOP_AI.CORE.exportAll(function (response) {
                if (isErrorResponse(response)) {
                    $timeout(function () {
                        $scope.isDataLoading = false;
                    }, 0);
                    swal({
                        title: "Error",
                        text: getResponseErrorMessage(response, "Failed to load data."),
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                    return;
                }

                const exportSpec = normalizeEnvironmentSpec(extractExportSpec(response || {}));
                $scope.spec.LLMs  = exportSpec.LLMs || [];
                $scope.spec.Agents = exportSpec.Agents || [];
                $scope.spec.Tools = exportSpec.Tools || [];
                $scope.spec.MCPs = exportSpec.MCPs || [];
                $scope.spec.ToolsRegistry = exportSpec.ToolsRegistry || [];
                $scope.spec.AgentTools = exportSpec.AgentTools || [];
                $scope.spec.RAGs = exportSpec.RAGs || [];
                $scope.spec.KBs = exportSpec.KBs || [];
                $scope.spec.EMBEDDING_MODELs = exportSpec.EMBEDDING_MODELs || [];
                $scope.spec.Apps = exportSpec.Apps || [];
                $scope.spec.Teams = exportSpec.Teams || [];

                $scope.spec.LLMs.forEach(function(LLM){ LLM["$$hashKey"] = null; });

                $scope.spec.KBs.forEach(function(KB){
                    if (KB.kbID != null) KB.ragID = KB.kbID;
                    if (KB.ragID == null) KB.ragID = generateUUID();
                });

                $scope.spec.MCPs.forEach(function (mcp) {

                    if (typeof mcp.AUTH_INFO === "string") {
                        try {
                            mcp.AUTH_INFO = JSON.parse(mcp.AUTH_INFO);
                        } catch (e) {
                            mcp.AUTH_INFO = {};
                        }
                    }

                    mcp.mcpAuth = getDefaultMcpAuthConfig();

                    if (mcp.AUTH_TYPE) {
                        mcp.mcpAuth.type = mcp.AUTH_TYPE;
                    }

                    var auth = mcp.AUTH_INFO || {};

                    if (mcp.AUTH_TYPE === "OIDC") {

                        var oidcAuth = auth.config && auth.config.oidc ? auth.config.oidc : auth;
                        var oidcTokens = oidcAuth.tokens || {};

                        mcp.mcpAuth.config.oidc.issuer = oidcAuth.issuer || "";
                        mcp.mcpAuth.config.oidc.client_id = oidcAuth.client_id || "";
                        mcp.mcpAuth.config.oidc.client_secret = oidcAuth.client_secret || "";
                        mcp.mcpAuth.config.oidc.redirect_uri = oidcAuth.redirect_uri || $scope.oidcRedirectCallback;
                        mcp.mcpAuth.config.oidc.response_type = oidcAuth.response_type || "code";
                        mcp.mcpAuth.config.oidc.grant_type = oidcAuth.grant_type || "authorization_code";
                        mcp.mcpAuth.config.oidc.token_endpoint = oidcAuth.token_endpoint || "";
                        mcp.mcpAuth.config.oidc.authorization_endpoint = oidcAuth.authorization_endpoint || "";
                        mcp.mcpAuth.config.oidc.userinfo_endpoint = oidcAuth.userinfo_endpoint || "";
                        mcp.mcpAuth.config.oidc.jwks_uri = oidcAuth.jwks_uri || "";
                        mcp.mcpAuth.config.oidc.tokens.access_token = oidcTokens.access_token || "";
                        mcp.mcpAuth.config.oidc.tokens.refresh_token = oidcTokens.refresh_token || "";
                        mcp.mcpAuth.config.oidc.tokens.token_type = oidcTokens.token_type || "";
                        mcp.mcpAuth.config.oidc.tokens.expires_in = oidcTokens.expires_in || "";
                        mcp.mcpAuth.config.oidc.tokens.expires_at = oidcTokens.expires_at || "";
                        mcp.mcpAuth.config.oidc.tokens.scope = oidcTokens.scope || "";

                        if (Array.isArray(oidcAuth.scopes)) {
                            mcp.mcpAuth.config.oidc.scopesText = oidcAuth.scopes.join(", ");
                        }

                    }
                    else if (mcp.AUTH_TYPE === "API_KEY") {

                        var apiKeyAuth = auth.config && auth.config.api_key ? auth.config.api_key : auth;

                        mcp.mcpAuth.config.api_key.header_name = apiKeyAuth.header_name || "";
                        mcp.mcpAuth.config.api_key.key = apiKeyAuth.key || "";
                        mcp.mcpAuth.config.api_key.prefix = apiKeyAuth.prefix || "";

                    }
                    else if (mcp.AUTH_TYPE === "BASIC") {

                        var basicAuth = auth.config && auth.config.basic ? auth.config.basic : auth;

                        mcp.mcpAuth.config.basic.username = basicAuth.username || "";
                        mcp.mcpAuth.config.basic.password = basicAuth.password || "";
                        mcp.mcpAuth.config.basic.encode = basicAuth.encode || "base64";

                    }

                });

                recomputeAgentTeamTags();

                try {
                    if ($scope.spec && Array.isArray($scope.spec.Apps) &&
                        Array.isArray($scope.spec.Agents) && Array.isArray($scope.spec.Teams)) {

                        $scope.spec.Apps.forEach(app => {
                            app.managerAgents = [];
                            const appTeams = $scope.spec.Teams.filter(t => t.appId === app.appId);

                            appTeams.forEach(team => {
                                if (!team.managerId) return;

                                const manager = $scope.spec.Agents.find(a => a.identifier === team.managerId);
                                if (manager && !app.managerAgents.some(m => m.identifier === manager.identifier)) {
                                    app.managerAgents.push({
                                        ...manager,
                                        isManager: true,
                                        teamName: team.teamName || ""
                                    });
                                }
                            });
                        });
                    } else {
                        console.warn("[Managers] Spec data incomplete: Apps/Agents/Teams missing");
                    }
                } catch (e) {
                    console.error("[Managers] Error mapping managers:", e);
                }

                $timeout(function () {
                    $scope.isDataLoading = false;
                }, 0);
            }, function (xhr, status, error) {
                $timeout(function () {
                    $scope.isDataLoading = false;
                }, 0);
                swal({
                        title: "Error",
                        text: "Failed to load data: " + getAjaxErrorMessage(xhr, (error || status || "Unknown")),
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
            });

        $http.get(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.server.browse.getPackagesAsTree.main",
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                    "Content-Type": "application/json"
                }
            })
            .then(function (resp2) {
                $scope.treePackages = resp2.data;
                populateAITools($scope.treePackages);
            })
            .catch(function (error2) {
                swal({
                    title: "Error",
                    text: "Failed to load package tree. Error: " + error2.statusText,
                    type: "error",
                    confirmButtonColor: "#f2533e" // optional red color
                });

            });

        $http.get(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.security.flow.getUsers.main",
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                    "Content-Type": "application/json"
                }
            })
            .then(function (res) {
                $scope.users = (res && res.data && res.data.users) || {};

                //let userKey = Object.keys($scope.users);

                /*$("#agent_share_option").append("<option value=''></option>");

                for (let i = 0 ; i < userKey.length ; i++) {
                    $("#agent_share_option").append("<option value='" + userKey[i] + "'>" + $scope.users[userKey[i]].profile.name + "</option>");
                }*/

            }, function () {
                $scope.users = {};
            });

        $http.get(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.security.flow.getGroups.main",
            {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                    "Content-Type": "application/json"
                }
            })
            .then(function (res) {
                $scope.groups = (res && res.data && res.data.groups) || [];

                //let userKey = Object.keys($scope.users);

                /*$("#agent_share_option").append("<option value=''></option>");

                for (let i = 0 ; i < userKey.length ; i++) {
                    $("#agent_share_option").append("<option value='" + userKey[i] + "'>" + $scope.users[userKey[i]].profile.name + "</option>");
                }*/

            }, function () {
                $scope.groups = [];
            });

    };

    // run after the DOM renders (and after spec.LLMs is available)
    $timeout(function () {
        $('#llmSelect').select2({
            placeholder: 'Select an LLM',
            allowClear: true,
            width: '100%'
        });
    }, 0);

    $scope.toolToAttachFqn = null;
    $timeout(function initToolSelect2() {

        function safeInitToolSelect2() {
            const el = document.querySelector('#toolselect');
            if (!el) {
                $timeout(safeInitToolSelect2, 150);
                return;
            }

            if (typeof $.fn.select2 !== 'function') {
                console.warn('Select2 plugin not loaded');
                return;
            }

            const $el = $(el);

            if ($el.hasClass('select2-hidden-accessible')) $el.select2('destroy');

            $el.select2({
                placeholder: 'Select a tool to attach',
                allowClear: true,
                width: '100%'
            });

            $el.on('change.select2', function () {
                const val = $el.val() || null;
                $scope.$evalAsync(() => { $scope.toolToAttachFqn = val; });
            });

            function syncSelectedValue() {
                $timeout(() => {
                    if ($scope.toolToAttachFqn) {
                        $el.val($scope.toolToAttachFqn).trigger('change.select2');
                    } else {
                        $el.val('').trigger('change.select2');
                    }
                }, 150);
            }

            syncSelectedValue();

            $scope.$watchCollection(
                () => ($scope.unlinkedTools && $scope.unlinkedTools()) || [],
                function (newTools, oldTools) {
                    if (!newTools || newTools.length === 0) return;

                    $timeout(() => {
                        $el.trigger('change.select2');
                        syncSelectedValue();
                    }, 200);
                }
            );

            $scope.$watch('toolToAttachFqn', function (newVal) {
                if (newVal !== $el.val()) {
                    $timeout(() => {
                        $el.val(newVal || '').trigger('change.select2');
                    });
                }
            });

            $scope.$on('$destroy', function () {
                if ($el.hasClass('select2-hidden-accessible')) $el.select2('destroy');
            });
        }

        safeInitToolSelect2();

    }, 0);


    function setQueryParam(key, value, { replace = false } = {}) {
        const url = new URL(window.location.href);
        if (value == null || value === "") {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
        const method = replace ? "replaceState" : "pushState";
        history[method]({}, "", url);
    }

    function getQueryParam(key) {
        return new URL(window.location.href).searchParams.get(key);
    }

    /*function routeAgentFromUrl(retry = 0) {
        const id = getQueryParam("agent_id");
        if (!id) {
            if ($scope.showAgentBox) $scope.closeAgentBox();
            return;
        }

        const list = ($scope.spec && $scope.spec.Agents) || [];
        const agent = list.find(a => a.identifier === id);

        if (agent) {
            $scope.openAgentBox(agent, false, { skipUrl: true });
            $scope.$applyAsync();
        } else if (retry < 20) {
            // Agents may not be loaded yet; try again in ~100ms (up to ~2s)
            setTimeout(() => routeAgentFromUrl(retry + 1), 100);
        }
    }

    // Run once on load (so refresh opens the right agent)
    setTimeout(() => routeAgentFromUrl(), 0);

    window.addEventListener("popstate", () => {
        $scope.$evalAsync(routeAgentFromUrl);
    });*/

    /*$scope.loadChanges = function() {
        $scope.inProgressVisible = true;
        let response = {};
        $scope.inProgressVisible = false;
        $scope.spec.LLMs = $scope.spec.LLMs || [];
        $scope.spec.Agents = $scope.spec.Agents || [];
        $scope.spec.Tools = $scope.spec.Tools || [];
        $scope.spec.RAGs = $scope.spec.RAGs || [];
        $scope.spec.KBs = $scope.spec.KBs || [];
        $scope.disableConfirmDelete = false;
        $scope.spec.Agents.map(Agent => {
            Agent.Team = "3a8b1e67-7c9e-4f94-b2fd-24d7b8c60dce";
        });
    };*/
    function cleanSpecForPersistence(spec) {
        let specCopy = angular.copy(spec); // Work on a copy
        const cleanItem = (item) => {
            delete item.editing;
            delete item._original;
            delete item.expanded; // Ensure expanded state isn't saved
            // Remove temporary decoded fields if they exist on the item
            delete item.roleDescriptionDecoded;
            delete item.functionDescriptionDecoded;
            delete item.inputJSONSchemaDecoded;
            // Add any other transient UI properties here
        };

        (specCopy.LLMs || []).forEach(cleanItem);
        (specCopy.Agents || []).forEach(cleanItem);
        (specCopy.Tools || []).forEach(cleanItem);
        (specCopy.RAGs || []).forEach(cleanItem);
        (specCopy.KBs || []).forEach(cleanItem);
        (specCopy.Apps || []).forEach(cleanItem);
        (specCopy.Teams || []).forEach(cleanItem);
        (specCopy.ToolsRegistry || []).forEach(cleanItem);
        (specCopy.AgentTools || []).forEach(cleanItem);
        (specCopy.MCPs || []).forEach(cleanItem);

        return specCopy;
    }

    function extractExportSpec(responseData) {
        if (responseData && responseData.status === "success" && responseData.spec && typeof responseData.spec === "object") {
            return cleanSpecForPersistence(responseData.spec);
        }

        if (responseData && typeof responseData === "object" && responseData.spec && typeof responseData.spec === "object") {
            return cleanSpecForPersistence(responseData.spec);
        }

        return cleanSpecForPersistence(responseData || {});
    }

    $scope.exportJSON = function () {
        SYNCLOOP_AI.CORE.exportAll(function(response) {
            if (isErrorResponse(response)) {
                $scope.showNotification('error', 'Failed to export configuration: ' + ((response && response.error) || 'Export failed'));
                return;
            }

            const exportPayload = extractExportSpec(response || {});
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
            var downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "syncloop_ai_environment.json");

            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            $scope.showNotification('success', 'Configuration exported successfully.');
        }, function(xhr, status, error) {
            $scope.showNotification('error', 'Failed to export configuration: ' + (error || status || ((xhr || {}).statusText) || 'Unknown error'));
        });
    };

    $scope.exportAppBundle = function (app) {
        if ($scope.isDataLoading) {
            swal({
                title: "Please wait",
                text: "Data is still loading. Try again in a moment.",
                type: "info",
                confirmButtonColor: "#2C61F5"
            });
            return;
        }
        $scope.appId = app.appId;
        const relatedTeams = $scope.getAppTeams ? $scope.getAppTeams() : [];
        const relatedAgents = $scope.getAppAgents ? $scope.getAppAgents(app) : [];
        const relatedTools = $scope.getAppTools ? $scope.getAppTools() : [];

        /* const llmKeys = new Set();
         if (app.terminationAgent?.LLMkey) llmKeys.add(app.terminationAgent.LLMkey);
         if (app.reportingAgent?.LLMkey) llmKeys.add(app.reportingAgent.LLMkey);*/

        const relatedLLMs = ($scope.spec.LLMs || []).filter(llm => {
            const appKey = app.LLM_KEY ?? app.LLMkey;
            return appKey && llm && llm.LLMkey === appKey;
        });

        const bundle = {
            Apps: [angular.copy(app)],
            Teams: angular.copy(relatedTeams),
            Agents: angular.copy(relatedAgents),
            Tools: angular.copy(relatedTools),
            LLMs: angular.copy(relatedLLMs)
        };

        const jsonContent = JSON.stringify(bundle, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = `${app.appName.replace(/\s+/g, "_")}_app_bundle.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };


    // Import JSON: Trigger file input via the hidden file input.
    $scope.triggerImport = function() {
        const el = document.getElementById('jsonImport');
        if (!el) {
            return;
        }
        el.click();
    };

    $scope.handleFile = function(fileContent) {
        try {
            var imported = JSON.parse(fileContent);

            $scope.inProgressVisible = true;

            swal({
                title: "Importing...",
                text: "Please wait...",
                type: "info",
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            $http.post(
                window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.Awareness.dashboard.services.api.importAll.main",
                JSON.stringify(imported),
                {
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                        "Content-Type": "application/json"
                    }
                }
            ).then(function(response) {

                $scope.inProgressVisible = false;
                document.getElementById("jsonImport").value = "";

                swal.close();

                swal.close();

                $timeout(function () {
                    if (response.data && (response.data.status === "success" || response.data.status === "partial_success")) {
                        swal({
                            title: "Done",
                            text: "JSON imported successfully.",
                            type: "success",
                            confirmButtonColor: "#2C61F5"
                        });

                        if (typeof $scope.loadChanges === "function") {
                            $scope.loadChanges();
                        }

                    } else {
                        swal({
                            title: "Error",
                            text: "An error occurred while importing your JSON.",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });
                    }
                }, 200);

            }, function(error) {

                $scope.inProgressVisible = false;
                document.getElementById("jsonImport").value = "";

                swal.close();

                swal({
                    title: "Import Failed",
                    text: "Failed to import JSON. Error: " + error.statusText,
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
            });

        } catch (err) {
            swal({
                title: "Error",
                text: "Failed to parse JSON: " + err,
                type: "error",
                confirmButtonColor: "#f2533e"
            });
        }
    };

    const action = window.__syncloopAction;

    if (action === "import") {

        $timeout(function () {

            swal({
                title: "Import configuration",
                text: "Do you want to import a JSON configuration file?",
                type: "info",
                showCancelButton: true,
                confirmButtonText: "Choose File",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#2C61F5"
            }, function (isConfirm) {

                if (isConfirm) {
                    $scope.triggerImport();
                }

            });

        }, 500);
    }

    if (action === "export") {

        $timeout(function () {
            $scope.exportJSON();
        }, 200);
    }

    $scope.loadRAGs = function(kb) {
        $scope.activeTab = 'rags';
        $scope.loadForKBId = kb.ragID;
    }

    $scope.loadRAGsForAgent = function(agent) {
        $scope.activeTab = 'rags';
        $scope.loadForAgentId = agent.identifier;
    };

    $scope.filterMyRag = function(rags) {

        let RAGs = [];

        for (let i = 0 ; i < rags.length ; i++) {
            if (rags[i].ragID == $scope.loadForKBId) {
                RAGs.push(rags[i]);
            }
        }

        return RAGs;
    }

    $scope.getAgentRAGs = function (agent) {
        if (!agent) return [];
        return ($scope.spec?.RAGs || []).filter(r => r.ragID === agent.identifier);
    };

    $scope.openAgentRAGAdd = function (agent) {
        if (!agent) return;

        $scope.currentAgent = agent;
        $scope.ragEditMode = false;
        $scope.ragBindingMode = 'agent';

        $scope.ragEdit = {
            ragName: '',
            agentId: agent.identifier,
            ragID:   agent.identifier,
            ESKey:   agent.identifier,
            path: '',
            filePattern: '*.txt',
            maxSegmentSizeInChars: 500,
            maxOverlapSizeInChars: 50,
            maxSearchResults: 10
        };

        $scope.showaddmodalragbaseBox = true;
    };

    $scope.currentFilePath = null;

    $scope.safeApply = function(fn) {
        const phase = $scope.$root && $scope.$root.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (typeof fn === 'function') fn();
        } else {
            $scope.$apply(fn);
        }
    };

    $scope.saveAgentRAG = function(form) {
        form = form || $scope.ragFormNg;
        if (!form) {
            console.warn('ragFormNg not found on scope');
            return;
        }

        if (form.$invalid) {
            form.$setSubmitted();
            angular.forEach(form, function(field) {
                if (field && field.$setTouched) field.$setTouched();
            });
            return;
        }

        $scope.saveInProgress = true;

        var onSuccess = function () {
            $scope.saveInProgress = false;
            $scope.showaddmodalragbaseBox = false;
            $scope.currentFilePath = null;
            swal({
                title: "Success",
                text: "RAG added successfully!",
                type: "success",
                confirmButtonColor: "#2C61F5"
            });
            $scope.safeApply();
            SYNCLOOP_AI.CORE.initialize();
        };
        var onError   = function () { $scope.saveInProgress = false; $scope.safeApply(); };

        var agentKey =
            ($scope.ragEdit && $scope.ragEdit.agentId) ||
            ($scope.ragEdit && $scope.ragEdit.ragID) ||
            ($scope.currentAgent && $scope.currentAgent.identifier);

        var uploadPath = $scope.currentFilePath;

        var ragName =
            ($scope.ragEdit && $scope.ragEdit.ragName) ||
            ($scope.currentAgent && $scope.currentAgent.name) ||
            'Unnamed_RAG';

        var fileNameOnly = '/uploads'+ RAG_UPLOAD_ROOT + '/' + (uploadPath) + '/' || '';
        var emKey     = $scope.ragEdit && $scope.ragEdit.EMKey;

        if (!agentKey || !fileNameOnly) {
            $scope.saveInProgress = false;
            return $scope.$evalAsync(function () {
                swal({
                    title: "Error",
                    text: "Agent and at least one file are required.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
            });
        }

        $scope.startSaving();
        let identifier = $scope.uploadingRagId;

        SYNCLOOP_AI.RAG.upsertRAG(
            ragName,
            agentKey,
            identifier,
            fileNameOnly,
            $scope.ragEdit.filePattern,
            emKey,
            function (response) {
                if (!response || response.status === "failed") {

                    $scope.saveInProgress = false;

                 return swal({
                        title: "Error",
                        text: response?.error || "Failed to save RAG.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });
                }

                if ($scope.ragEditMode) {
                    Object.assign($scope.ragBeingEdited, $scope.ragEdit, {
                        fileName: fileNameOnly,
                        path: fileNameOnly
                    });
                } else {
                    $scope.spec = $scope.spec || {};
                    $scope.spec.RAGs = $scope.spec.RAGs || [];
                    var saved = Object.assign(
                        {
                            id: 'rag_' + Date.now(),
                            agentId: agentKey,
                            identifier: identifier,
                            ragID: agentKey,
                            fileName: fileNameOnly,
                            name: fileNameOnly,
                            ragName: ragName,
                            path: fileNameOnly
                        },
                        $scope.ragEdit

                    );
                    $scope.spec.RAGs.push(saved);
                    $scope.finishSaving(2000);
                }
                onSuccess();
            },
            function () {
                onError();
                $scope.resetSaveStatus();
            }
        );
    };

    // Simple: copies msg.text (which may be $sce.trustAsHtml) as PLAIN TEXT
    $scope.copyHtml = function ($event, html) {
        // 1) unwrap trusted HTML to string
        var rawHtml;
        try {
            rawHtml = (typeof html === 'string') ? html : $sce.getTrustedHtml(html);
        } catch (e) {
            rawHtml = String(html || '');
        }

        // 2) convert HTML → plain text (what user sees)
        var div = document.createElement('div');
        div.innerHTML = rawHtml || '';
        var text = (div.textContent || div.innerText || '').trim();
        if (!text) return;

        // 3) write to clipboard (with simple fallback)
        var tip = $event.currentTarget.querySelector('.tooltiptext, .tooltip-text');
        var ok = function () {
            if (tip) {
                var orig = tip.getAttribute('data-default') || 'Copy';
                tip.textContent = 'Copied!';
                setTimeout(function(){ tip.textContent = orig; }, 1500);
            }
        };
        var fail = function () {
            try {
                var ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                ok();
            } catch (_) {
                if (tip) {
                    var orig = tip.getAttribute('data-default') || 'Copy';
                    tip.textContent = 'Copy failed';
                    setTimeout(function(){ tip.textContent = orig; }, 1500);
                }
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(ok).catch(fail);
        } else {
            fail();
        }
    };


    $scope.uiFullPath = function (rag) {
        if (!rag) return '';
        // var file = (rag.fileName || rag.path || '').replace(/^\/+/, '');
        // if (!file) return '';

        var agentKey = rag.agentId || ($scope.currentAgent && $scope.currentAgent.identifier);
        var kbKey = (!agentKey && rag.ragID) ? rag.ragID : null;

        var folder = agentKey ? (RAG_UPLOAD_ROOT + '/' + agentKey)
            : (kbKey ? (RAG_UPLOAD_ROOT + '/kb/' + kbKey) : '');

        var p = (folder ? folder.replace(/\/+$/,'') + '/' : '/') ;
        return '/uploads' + (p[0] === '/' ? p : '/' + p);
    };


    $scope.clearRagPath = function () {
        $scope.ragEdit.ragName = '';
        $scope.ragEdit.filesDisplay = '';
        $scope.ragEdit.filesDisplayFull = '';
        $scope.ragEdit.fileNames = [];
        var el = document.getElementById('ragFileInput');
        if (el) el.value = '';
    }

    $scope.resetRAGFiles = function () {
        $scope.ragEdit.files = [];
        $scope.ragEdit.filesDisplay = '';
        $scope.ragEdit.filesDisplayFull = '';
        $scope.ragEdit.filePattern = '';

        // reset native file input
        var el = document.getElementById('ragFileInput');
        if (el) el.value = '';

        // reset form control state
        if ($scope.ragFormNg && $scope.ragFormNg.filesDisplay) {
            $scope.ragFormNg.filesDisplay.$setPristine();
            $scope.ragFormNg.filesDisplay.$setUntouched();
        }
    };


    $timeout(function () {
        document.addEventListener('change', function (e) {
            if (e.target && e.target.type === 'file') {
                if (e.target.id !== 'ragFileInput' && e.target.id !== 'ragFileInputKB') return;
                const files = e.target.files;
                $scope.$applyAsync(function () {
                    $scope.handleRAGFilesSelected(files);
                });
            }
        });
    }, 0);


    $scope.onRAGActionClick = function () {
        var el = document.getElementById('ragFileInput');
        if (el) el.click();
    };

    $scope.openKBRAGFilePicker = function () {
        const input = document.getElementById('ragFileInputKB');
        if (!input) return;
        input.value = '';
        input.click();
    };

    const SUPPORTED_EXTENSIONS = ['pdf','txt'];

    $scope.handleRAGFilesSelected = function (files) {
        if (!files || !files.length) {
            $scope.ragEdit.filePattern = '';
            return;
        }

        if (files.length > 1) {
            showRAGAlert('Only one file can be uploaded at a time.');
            $scope.resetRAGFiles();
            return;
        }

        const validFiles = [];
        const rejected = [];

        Array.from(files).forEach(function (file) {
            const ext = file.name.split('.').pop().toLowerCase();
            if (SUPPORTED_EXTENSIONS.includes(ext)) {
                validFiles.push(file);
            } else {
                rejected.push(file.name);
            }
        });

        if (rejected.length) {
            showRAGAlert('Unsupported file type:\n' + rejected.join(', '));
            $scope.ragEdit.filePattern = '';
            $scope.resetRAGFiles();
            return;
        }

        $scope.ragEdit.files = validFiles;

        const file = validFiles[0];

        $scope.ragEdit.filesDisplay = file.name;
        $scope.ragEdit.filesDisplayFull = file.name;

        const ext = file.name.split('.').pop().toLowerCase();
        $scope.ragEdit.filePattern = '*.' + ext;

        $scope.uploadRAGFile(file);
    };

    var RAG_UPLOAD_ROOT = '/rags';
    $scope.resolveRAGFolderPath = function () {
        var newUUID = generateUUID();
        $scope.currentFilePath = newUUID;
        $scope.uploadingRagId = newUUID;
        var kbKey = $scope.ragEdit && $scope.ragEdit.ragID;
        if (kbKey) return RAG_UPLOAD_ROOT + '/kb/' + newUUID;
        var agentKey = ($scope.ragEdit && $scope.ragEdit.agentId) || ($scope.currentAgent && $scope.currentAgent.identifier);
        if (agentKey) return RAG_UPLOAD_ROOT + '/' + newUUID;
        return null;
    };

    $scope.ragUploading = false;
    $scope.ragUploadProgress = 0;

    $scope.uploadRAGFile = function (file) {
        var folderPath = $scope.resolveRAGFolderPath();
        if (!folderPath) {
            return $scope.$evalAsync(function () {
               swal({
                    title: "Missing context",
                    text: "Open from an Agent or KB before uploading.",
                    type: "warning",
                    confirmButtonColor: "#f0ad4e"
                });
            });
        }

        $scope.ragUploading = true;
        $scope.ragUploadProgress = 0;

        var fd = new FormData();
        fd.append('file', file);
        fd.append('path', folderPath);

        var xhr = new XMLHttpRequest();
        xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) $scope.$apply(function () {
                $scope.ragUploadProgress = (e.loaded / e.total) * 100;
            });
        };
        xhr.open('POST',  window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + '/packages.FileManager.dashboard.services.api.UploadFile.main?folderPath=' +
            encodeURIComponent(folderPath));
        xhr.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("AuthToken"));
        xhr.onload = function () {
            $scope.ragUploading = false;
            var r = null; try { r = JSON.parse(xhr.responseText); } catch(e) {}
            if (!r || r.status !== 'success') {
                $scope.$applyAsync(function () {
                    if ($scope.ragEdit) {
                        $scope.ragEdit.filePattern = '';
                    }
                });
                showRAGAlert('Upload failed' + (r && r.error ? ': ' + r.error : ''));
                $scope.resetRAGFiles();
            }
            $scope.$applyAsync();
        };
        xhr.onerror = function () {
            $scope.ragUploading = false;
            $scope.$applyAsync(function () {
                if ($scope.ragEdit) {
                    $scope.ragEdit.filePattern = '';
                }
            });
            showRAGAlert('Upload error'); $scope.$apply();
            $scope.resetRAGFiles();
        };
        xhr.send(fd);
    };

    function showRAGAlert(msg){
        try {
                swal({
                    title: "Alert",
                    text: msg,
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });
            }
        catch(e){ console.error(msg); }
    }

    /*$(document).off('change.rag').on('change.rag', '#ragFileInput', function () {
        var list = this.files ? Array.from(this.files) : [];

        $scope.ragEdit = $scope.ragEdit || {};
        $scope.ragEdit.fileNames = list.map(function (f) { return f.name; });

        if ($scope.ragEdit.fileNames.length <= 2) {
            $scope.ragEdit.filesDisplay = $scope.ragEdit.fileNames.join(', ');
        } else {
            $scope.ragEdit.filesDisplay = $scope.ragEdit.fileNames.slice(0,2).join(', ')
                + ' +' + ($scope.ragEdit.fileNames.length - 2) + ' more';
        }
        $scope.ragEdit.filesDisplayFull = ($scope.ragEdit.fileNames || []).join(', ');
        $scope.ragEdit.primaryFileName = ($scope.ragEdit.fileNames && $scope.ragEdit.fileNames[0]) || '';

        var first = list[0];
        if (first && first.name && first.name.indexOf('.') > -1) {
            var ext = first.name.split('.').pop().toLowerCase();
            if (ext) $scope.ragEdit.filePattern = '*.' + ext;
        }

        $scope.$applyAsync();

        if (!list.length) { this.value=''; return; }
        var files = list.slice();
        var next = function () {
            var f = files.shift();
            if (!f) { $('#ragFileInput').val(''); return; }
            $scope.uploadRAGFile(f);
            var poll = function () { if ($scope.ragUploading) return setTimeout(poll, 100); next(); };
            poll();
        };
        next();
    });*/

    $scope.selectAppDetailTab = function(app) {
        $scope.selectedApp = app;
        $scope.activeTab = 'app_detail';
        $scope.appId = app.appId;
        const timestamp = Date.now();
        const url = `/Awareness/tree-view.html?appId=${app.appId}&ts=${timestamp}`;

        $scope.trustedUrl = $sce.trustAsResourceUrl(url);
    };

    $scope.exitAppDetail = function() {
        $scope.trustedUrl = null;
        $scope.selectedApp = null;
        $scope.appId = null;
        $scope.activeTab = 'apps';
        $scope.$applyAsync();
    };

    $scope.launchApp = function(app) {
        //$scope.isAppAvailable 	= true;
        //$scope.activeTab 		= 'teams';

        window.open($scope.getApp().appLink, '_blank');

        //$scope.triggerAppChat();
    }

    $scope.startAppChat = function(app) {
        $scope.isAppAvailable 	= true;
        $scope.activeTab 		= 'app_detail';
        $(".chat_boxtransitionsecond").addClass("active");
        $scope.triggerAppChat();
    }

    $scope.selectApiTab = function () {
        $scope.activeTab = 'api';

        // Delay execution slightly to make sure DOM is rendered
        setTimeout(function () {
            $scope.initializeAPITab();
        }, 0);
    };

    $scope.initializeAPITab = function () {
        loadData();

        // Set up search bar event only once
        $("#api-search-bar").off("keyup").on("keyup", function () {
            table.search(this.value).draw();
        });

        // Set table URL and reload
        let url = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.server.dashboard.api_page.getAPILogs.main";
        $(".select-all-apis").prop("checked", false);
        //TODO - Blocker
        table.ajax.url(url).load();

        // Handle select all checkbox
        $(".select-all-apis").off("click").on("click", function () {
            $(".select-this-api").prop("checked", this.checked);
        });
    };

    function isErrorResponse(res) {
        if (!res) return false;

        // Case 1:  { error: "...", status: "failed" }
        if (typeof res.error === "string") return true;

        // Case 2: { error: { error_name: "...", ... } }
        if (typeof res.error === "object") return true;

        // Case 3: status failed
        if (res.status && res.status.toLowerCase() === "failed") return true;

        return false;
    }

    // Merge imported spec into the current spec based on unique keys.
    function mergeImportedSpec(importedSpec) {
        if (!importedSpec) return;

        function decodeBase64IfEncoded(str) {
            try {
                return atob(str || '');
            } catch (e) {
                return str;
            }
        }

        function llmExists(key) {
            if (!key) return false;
            const allLLMs = [
                ...($scope.spec.LLMs || []),
                ...(importedSpec.LLMs || [])
            ];
            return allLLMs.some(llm => llm.LLMkey === key);
        }

        // --- LLMs ---
        (importedSpec.LLMs || []).forEach(llm => {
            const existing = $scope.spec.LLMs.find(x => x.LLMkey === llm.LLMkey);

            const props = llm.properties || {};
            const ppm_input  = typeof props.ppm_input === 'number' ? props.ppm_input : 0;
            const ppm_output = typeof props.ppm_output === 'number' ? props.ppm_output : 0;
            const currency   = props.currency || 'USD';

            const ppt_input  = ppm_input  / 1_000_000;
            const ppt_output = ppm_output / 1_000_000;

            llm.properties = {
                ppm_input,
                ppm_output,
                ppt_input,
                ppt_output,
                currency
            };

            SYNCLOOP_AI.LLM.upsertLLM(
                llm.LLMkey,
                llm.name,
                llm.description || '',
                llm.provider,
                llm.maxTokens,
                llm.baseUrl,
                llm.apiKey,
                llm.modelName,
                llm.temperature,
                llm.topP,
                llm.enableParallelToolCalling,
                llm.displayName || llm.name,
                llm.sstc || llm.toolCalling || false,
                "NO_VERIFICATION",
                llm.properties,
                function (res) {
                    if (isErrorResponse(res)) return;

                    if (!existing) $scope.spec.LLMs.push(llm);
                    else Object.assign(existing, llm);
                    $scope.$applyAsync();
                },
                function () {}
            );
        });

        // --- Agents ---
        (importedSpec.Agents || []).forEach(agent => {
            const existing = $scope.spec.Agents.find(x => x.identifier === agent.identifier);
            const decodedDesc = decodeBase64IfEncoded(agent.roleDescription || '');

            let llmKey = typeof agent.LLMkey === 'string'
                ? agent.LLMkey
                : (agent.LLMkey && agent.LLMkey.LLMkey) || '';

            /* if (!llmExists(llmKey)) {
                 llmKey = null;
             }*/

            SYNCLOOP_AI.AGENTS.upsertAgent(
                agent.identifier,
                agent.title,
                agent.name,
                decodedDesc,
                llmKey,
                agent.icon || "Awareness/pub/images/robot-icon1.svg",
                false,
                function (res) {
                    if (isErrorResponse(res)) return;

                    if (!existing) $scope.spec.Agents.push(agent);
                    else Object.assign(existing, agent);
                    $scope.$applyAsync();
                },
                function () {}
            );
        });

        // --- Apps ---
        (importedSpec.Apps || importedSpec.APPS || []).map(normalizeAppRecord).filter(Boolean).forEach(app => {
            const description = app.description || '';
            const llmKey =
                typeof app.reportingAgent?.LLMkey === 'string' ? app.reportingAgent.LLMkey :
                    typeof app.terminationAgent?.LLMkey === 'string' ? app.terminationAgent.LLMkey : '';

            const reportingAgentId = app.reportingAgent?.identifier || '';
            const terminationAgentId = app.terminationAgent?.identifier || '';
            const existingApp = $scope.spec.Apps.find(x => x.appId === app.appId);

            const payload = {
                appId: app.appId,
                name: app.appName || app.name,
                description,
                llmKey,
                appLink: app.appLink || '',
                reportingAgentId,
                terminationAgentId
            };

            const onSuccess = (res) => {
                if (isErrorResponse(res)) return;

                if (!existingApp) $scope.spec.Apps.push(app);
                else Object.assign(existingApp, app);
                $scope.$applyAsync();
            };

            SYNCLOOP_AI.APPS.upsertApp(
                payload.appId, payload.name, payload.description, payload.llmKey,
                payload.appLink, onSuccess, function () {}
            );
        });

        // --- Teams ---
        (importedSpec.Teams || importedSpec.TEAMS || []).map(normalizeTeamRecord).filter(Boolean).forEach(team => {
            const appId = team.app?.appId || team.appId || '';
            const existingTeam = $scope.spec.Teams.find(x => x.teamID === team.teamID);

            const payload = {
                teamID: team.teamID,
                name: team.teamName,
                managerId: team.managerId,
                requirement: team.requirement || '',
                appId,
                agents: (team.Agents || []).map(a => a.identifier || a)
            };

            const onSuccess = (res) => {
                if (isErrorResponse(res)) return;

                if (!existingTeam) $scope.spec.Teams.push(team);
                else Object.assign(existingTeam, team);
                $scope.$applyAsync();
            };

            SYNCLOOP_AI.TEAMS.upsertTeam(
                payload.teamID, payload.name, payload.requirement, payload.appId, payload.managerId, payload.agents,
                onSuccess, function (xhr) {
                    if (xhr && xhr.success) onSuccess();
                }
            );
        });

        // --- Tools ---
        (importedSpec.Tools || []).forEach(tool => {
            const existing = $scope.spec.Tools.find(x =>
                x.identifier === tool.identifier && x.fqn === tool.fqn
            );

            const decodedPayload = decodeBase64IfEncoded(tool.staticJsonPayload || '{}');
            const decodedSchema = decodeBase64IfEncoded(tool.inputJSONSchema || '{}');
            const decodedDesc = decodeBase64IfEncoded(tool.functionDescription || '');

            SYNCLOOP_AI.TOOLS.upsertTool(
                tool.identifier, // was previously agentID, should be identifier
                tool.fqn,
                decodedPayload,
                decodedSchema,
                decodedDesc,
                function (res) {
                    if (isErrorResponse(res)) return;

                    if (!existing) $scope.spec.Tools.push(tool);
                    else Object.assign(existing, tool);
                    $scope.$applyAsync();
                },
                function (xhr, status, error) {
                    console.error("Tool upsert failed for:", tool.fqn, error);
                }
            );
        });

        // --- KBs ---
        (importedSpec.KBs || []).forEach(kb => {
            const existing = $scope.spec.KBs.find(x => x.ragID === kb.ragID);
            SYNCLOOP_AI.KB.upsertKB(
                kb.ragID,
                kb.name,
                kb.description || '',
                function (res) {
                    if (isErrorResponse(res)) return;

                    if (!existing) $scope.spec.KBs.push(kb);
                    else Object.assign(existing, kb);
                    $scope.$applyAsync();
                },
                function () {}
            );
        });

        // --- RAGs ---
        (importedSpec.RAGs || []).forEach(rag => {
            const existing = $scope.spec.RAGs.find(x => x.ragID === rag.ragID);

            SYNCLOOP_AI.RAG.upsertRAG(
                rag.ragName || "Unnamed RAG",
                rag.ragID,
                rag.identifier,
                rag.path,
                rag.filePattern,
                function (res) {
                    if (isErrorResponse(res)) return;

                    if (!existing) $scope.spec.RAGs.push(rag);
                    else Object.assign(existing, rag);
                    $scope.$applyAsync();
                },
                function (xhr, status, error) {
                    console.error("RAG upsert failed:", error);
                }
            );
        });

        // --- EMBEDDING MODELS ---
        (importedSpec.EMBEDDING_MODELs || []).forEach(em => {

            const existing = ($scope.spec.EMBEDDING_MODELs || [])
                .find(x => x.EMkey === em.EMkey);

            const props = em.properties || {};

            const ppmInput  = typeof props.ppm_input === 'number' ? props.ppm_input : 0;
            const ppmOutput = typeof props.ppm_output === 'number' ? props.ppm_output : 0;
            const currency  = props.currency || 'INR';

            const pptInput  = ppmInput  / 1_000_000;
            const pptOutput = ppmOutput / 1_000_000;

            const properties = {
                ppm_input: ppmInput,
                ppm_output: ppmOutput,
                ppt_input: pptInput,
                ppt_output: pptOutput,
                currency
            };

            // QDRANT support
            if (props.store_name === 'QDRANT') {
                Object.assign(properties, {
                    store_name: 'QDRANT',
                    host: props.host || '',
                    port: props.port || null,
                    tls: !!props.tls,
                    api_key: props.api_key || ''
                });
            }

            const payload = {
                modelName: em.modelName,
                displayName: em.displayName,

                provider: em.emProviderType === 'INBUILT' ? '' : em.provider,
                baseUrl:  em.emProviderType === 'INBUILT' ? '' : em.baseUrl,
                apiKey:   em.emProviderType === 'INBUILT' ? '' : em.apiKey,

                verifyFirst: false,
                llmVerificationType: "NO_VERIFICATION",
                properties
            };

            if (em.EMkey) {
                payload.EMKey = em.EMkey;
            }

            $http.post(
                window.ENV.API_BASE_URL +
                "/tenant/" + localStorage.getItem("tenant") +
                "/packages.Awareness.dashboard.services.api.createEM.main",
                payload,
                {
                    headers: {
                        "Authorization": "Bearer " + localStorage.getItem("AuthToken"),
                        "Content-Type": "application/json"
                    }
                }
            ).then(function (res) {

                if (res.data?.status !== "success") return;

                const saved = res.data.embedding || {
                    ...em,
                    ...payload
                };

                if (!existing) {
                    $scope.spec.EMBEDDING_MODELs.push(saved);
                } else {
                    Object.assign(existing, saved);
                }

                $scope.$applyAsync();

            }).catch(function (err) {
                console.error("Embedding import failed:", em.modelName, err);
            });

        });

    }
    $scope.loadChanges();

    $scope.safeApply = $scope.safeApply || function(fn){
        var phase = $scope.$root && $scope.$root.$$phase;
        if (phase === '$apply' || phase === '$digest') { return typeof fn === 'function' ? $scope.$evalAsync(fn) : null; }
        $scope.$apply(fn);
    };

    function normalizeHistory(resp) {
        if (!resp) return [];
        var arr = resp.chatHistory || resp.history || resp.messages || [];
        return Array.isArray(arr) ? arr : [];
    }

    function toTrustedMessage(msg){
        var raw = (msg && msg.text) || '';
        return {
            ...msg,
            text: (msg.user === 'Agent')
                ? $sce.trustAsHtml(showdownConverter.makeHtml(raw || ''))
                : $sce.trustAsHtml(String(raw || ''))
        };
    }

    function updateWelcomeAvatar(){
        try {
            var el = document.querySelector('.chat-logsagent img[alt="agent"], .chat-logsagent .d-flex img');
            if (el) {
                el.src = 'Awareness/pub/images/robot-iconchat.svg';
                el.classList.add('chatuser_bg');
                el.style.setProperty('--bg-color', '#DFF5FF');
            }
        } catch (e) {}
    }

    $scope.$watch('showWelcomeBubble', function(v){
        if (v) setTimeout(updateWelcomeAvatar, 0);
    });

    $scope.startFreshConversation = function startFreshConversation() {
        if (!$scope.activeAgent || !$scope.activeAgent.identifier) {
            $scope.showNotification && $scope.showNotification('error', 'Pick an agent first');
            return;
        }
        //$scope.conversationID = (self.crypto?.randomUUID?.() || (Date.now() + ''));
        $scope.currentConversation = {
            identifier: $scope.conversationID,
            subject: 'New Chat',
            agentId: $scope.activeAgent.identifier,
            createdAt: Date.now()
        };

        $scope.chatHistory = [];
        $scope.chatWaitVisible = false;
        $scope.chatHistoryLoading = false;
        $scope.showWelcomeBubble = true;
        var nm = ($scope.activeAgent.name || 'your assistant');
        $scope.welcomeSafeHtml = $sce.trustAsHtml("Hi! I'm " + nm + ". What would you like to do today?");
        setTimeout(updateWelcomeAvatar, 0);

        if (Array.isArray($scope.TeamsConversations)) {
            var exists = $scope.TeamsConversations.some(function(c){ return c.identifier === $scope.conversationID; });
            if (!exists) {
                $scope.TeamsConversations.unshift({
                    identifier: $scope.conversationID,
                    subject: 'New Chat',
                    agentId: $scope.activeAgent.identifier
                });
            }
        }

        setTimeout(function(){
            var chatWindow = document.querySelector('.fullmodal_box--rightscroll');
            if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
        }, 0);
    };

    $scope.openConversationFromHistory = function (conversation) {
        if (!conversation) return;

        var agentId =
            conversation.AGENTID ||
            ($scope.activeAgent && ($scope.activeAgent.identifier || $scope.activeAgent.agentId));

        if (!agentId) {
            $scope.showNotification && $scope.showNotification('error', 'Missing agentId for this conversation.');
            return;
        }

        $scope.currentConversation = conversation;
        $scope.conversationID      = conversation.IDENTIFIER || conversation.UUID;
        $scope.chatHistory         = [];
        $scope.showWelcomeBubble   = false;
        $scope.chatHistoryLoading  = true;

        SYNCLOOP_AI.CONVERSATIONS.getChatHistory(agentId, conversation.IDENTIFIER, function (resp) {
            var respMessages = normalizeHistory(resp).slice().reverse();

            var list = [];

            for (var i = 0 ; i < respMessages.length; i++) {
                list.push({
                    text: respMessages[i].prompt,
                    user: 'User',
                    uuid: respMessages[i].uuid
                });

                list.push({
                    liked: respMessages[i].liked,
                    unliked: respMessages[i].unliked,
                    text: respMessages[i].response,
                    user: 'Agent',
                    uuid: respMessages[i].uuid
                });
            }

            $scope.chatHistory = list.map(toTrustedMessage);
            $scope.chatHistoryLoading = false;
            $scope.showaddmodalchathistory = false;

            setTimeout(function(){
                var scroller = document.querySelector('.fullmodal_box--rightscroll');
                if (scroller) scroller.scrollTop = scroller.scrollHeight;
            }, 0);

            $scope.safeApply();
        }, function (err) {
            $scope.chatHistoryLoading = false;
            $scope.showNotification && $scope.showNotification(
                'error',
                'Failed to load chat history' + (err && err.statusText ? (': ' + err.statusText) : '.')
            );
            $scope.safeApply();
        });
    };
    //
$scope.getRelativeTime = function(tsMs) {
    if (!tsMs) return '';

    var now     = Date.now();
    var diff    = now - tsMs;

    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours   = Math.floor(minutes / 60);
    var days    = Math.floor(hours / 24);
    var weeks   = Math.floor(days / 7);
    var years   = Math.floor(days / 365);

    if (seconds < 60)  return 'Just now';
    if (minutes < 60)  return minutes + 'm' + (minutes === 1 ? '' : '') + ' ago';
    if (hours < 24)    return hours   + 'h'   + (hours   === 1 ? '' : '') + ' ago';
    if (days < 7)      return days    + 'd'    + (days    === 1 ? '' : '') + ' ago';
    if (weeks < 52)    return weeks   + 'w'   + (weeks   === 1 ? '' : '') + ' ago';
    return years + 'y' + (years === 1 ? '' : '') + ' ago';
};

//
    $scope.switchChat = $scope.openConversationFromHistory;

    (function bindMoreMenuOnce(){
        var btn  = document.getElementById('moreBtn');
        var menu = document.getElementById('moreBox');
        if (!btn || !menu || btn._newChatBound) return;
        btn._newChatBound = true;

        btn.addEventListener('click', function(e){
            e.preventDefault();
            e.stopPropagation();
            menu.classList.toggle('open');
        });

        menu.addEventListener('click', function(e){
            var a = e.target && e.target.closest('a');
            if (!a) return;
            var label = (a.textContent || '').trim().toLowerCase();
            if (label.indexOf('new chat') === 0) {
                e.preventDefault();
                e.stopPropagation();
                menu.classList.remove('open');
                $scope.safeApply(function(){ $scope.startFreshConversation(); });
            }
        });

        document.addEventListener('click', function(){ menu.classList.remove('open'); });
    })();

}]);

let table = null;

function loadData() {
    let url = "/packages.middleware.pub.server.dashboard.api_page.getAPILogs.main";

    if (table != null) {
        table.destroy();
    }

    table = $("#aPiTable").DataTable({
        "serverSide": true,
        "ajax": {
            "url": window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + url,
            "dataSrc": function (data) {
                return data.data ?? [];
            },
            "type": "GET",
            "headers": {
                "Authorization": "Bearer " + localStorage.getItem("AuthToken")
            }
        },
        saveState: true,
        deferRender: true,
        iDisplayLength: 20,
        lengthMenu: [20, 50, 100],
        fnRowCallback: function (nRow, aData, iDisplayIndex) {
            $("#startCheckBox").show();
            $("td:nth-of-type(2)", nRow).html(table.page.info().start + iDisplayIndex + 1);
            return nRow;
        },
        columnDefs: [
            { orderable: false, targets: "_all" },
            { maxWidth: "100px", targets: 2 },
        ],
        autoWidth: false,
        columns: [
            {
                data: "id", render: function (data, type, full) {
                    return `<input type="checkbox" class="select-this-api" onclick="selectFnq()" value="${full.fqn}" />`;
                }
            },
            {
                data: "id", render: function (data) {
                    return data ?? "-";
                }
            },
            {
                data: "fqn", render: function (data, type, full) {
                    let openServiceLink = "middleware/pub/server/ui/workspace/web/workspace.html?r=files/" + data.replaceAll(".", "/") + ".api";
                    if (full.details?.trim()) {
                        return `<a target="_blank" href="${openServiceLink}"><img src="middleware/pub/server/ui/icons/flow.svg" /></a> <a href="api-detail.html?fqn=${encodeURIComponent(data)}">${data}</a>`;
                    }
                    return data ? `<a target="_blank" href="${openServiceLink}"><img src="middleware/pub/server/ui/icons/flow.svg" /></a> ${data}` : "-";
                }
            },
            {
                data: "dateTimeStmp", render: function (data) {
                    return data ?? "-";
                }
            },
            {
                data: "duration", render: function (data) {
                    return data ?? "-";
                }
            },
            {
                data: "details", render: function (details, type, full) {
                    let STATUS = (details?.trim()) ? "" : "-";
                    let services = details?.split(";") ?? [];
                    for (let j = 0; j < services.length && j <= 5; j++) {
                        let chunks = services[j].split(",");
                        if (chunks[2]?.trim()) {
                            STATUS += `<div class="ekatooltipdefault"><a href="api-detail.html?correlationId=${chunks[1]}&sessionId=${chunks[1]}&fqn=${full.fqn}#run_history_highlights"><span class="status st-danger"></span></a><span class="ekatooltipdefaulttext">ERROR</span></div>`;
                        } else {
                            STATUS += `<div class="ekatooltipdefault"><a href="api-detail.html?correlationId=${chunks[1]}&sessionId=${chunks[1]}&fqn=${full.fqn}#run_history_highlights"><span class="status st-success"></span></a><span class="ekatooltipdefaulttext">200 OK</span></div>`;
                        }
                    }
                    return STATUS;
                }
            }
        ]
    });
}

let index = 1;

const on = (listener, query, fn) => {
    document.querySelectorAll(query).forEach(item => {
        item.addEventListener(listener, el => {
            fn(el);
        })
    })
}

on('click', '.selectBtn', item => {
    const next = item.target.nextElementSibling;
    next.classList.toggle('toggle');
    next.style.zIndex = index++;
});
on('click', '.option', item => {
    item.target.parentElement.classList.remove('toggle');

    const parent = item.target.closest('.select').children[0];
    parent.setAttribute('data-type', item.target.getAttribute('data-type'));
    parent.innerText = item.target.innerText;
});







function copyToClipboard(element) {
    const container = element.parentElement;
    const realID = container.querySelector('.realTeamID').innerText.trim();
    const tooltip = container.querySelector('.tooltip-text');

    navigator.clipboard.writeText(realID).then(() => {
        tooltip.innerText = "Copied!";
        setTimeout(() => {
            tooltip.innerText = "Copy";
        }, 1500);
    });
}

$(document).on('select2:open', () => {
    $('.select2-results__option').each(function () {
        $(this).attr('title', $(this).text());
    });

});

/* ----------  EVENT DELEGATION  ---------- */
document.addEventListener("click", (e) => {

    /* 2A. Click on a dropdown button → toggle its menu */
    const btn = e.target.closest(".select-dropdown-button");
    if (btn) {
        const menu = btn.nextElementSibling;
        menu.classList.toggle("show");

        // close any other open menus
        document.querySelectorAll(".select-dropdown-content.show").forEach((m) => {
            if (m !== menu) m.classList.remove("show");
        });
        return;               // <‑ stop here; no further processing needed
    }

    /* 2B. Click on an option → update that dropdown */
    const option = e.target.closest(".select-option");
    if (option) {
        e.preventDefault();
        const dropdown = option.closest(".dropdown-container");

        // set visible label
        dropdown.querySelector(".selected-value").innerhtml = `<img src="images/chat_dropdown.svg" alt="">`;
        // set hidden input
        dropdown.querySelector(".hidden-select-value").value =
            option.dataset.value;

        // close the menu
        dropdown.querySelector(".select-dropdown-content").classList.remove("show");
        return;
    }

    /* 2C. Clicked anywhere else → close all menus */
    document.querySelectorAll(".select-dropdown-content.show")
        .forEach((m) => m.classList.remove("show"));
});

// drop down is top when no space is bottom
function toggleDropdown(button) {
    const container = button.closest(".dropdown-container");
    const dropdown = container.querySelector(".select-dropdown-content");

    // First make it visible to measure
    dropdown.style.display = 'block';
    dropdown.classList.add('open');

    // Get space below and above
    const rect = dropdown.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Estimate height if hidden
    const dropdownHeight = dropdown.offsetHeight || 200;

    // Remove previous state
    dropdown.classList.remove('drop-up');

    // Add drop-up if not enough space below and more space above
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        dropdown.classList.add('drop-up');
    }

    // Hide again to apply CSS transition correctly
    setTimeout(() => {
        dropdown.classList.toggle('open');
    }, 10);
}


function persistChat(agentId, sessionId, messages) {
    localStorage.setItem(
        `chat:${agentId}:${sessionId}`,
        JSON.stringify({ messages, meta: { agentId, sessionId, savedAt: Date.now() } })
    );
}

// Draggable Window Screen --> Agents Tab
(function () {
    const container = document.querySelector('.fullmodal_box');
    const leftPane  = document.querySelector('.fullmodal_box--left');
    const rightPane = document.querySelector('.fullmodal_box--right');
    const resizer   = document.querySelector('.resizer');
    const restoreBtn = document.getElementById('panelRestoreBtn');
    const chatCircle = document.getElementById('chat-circle'); // FAB

    if (!container || !leftPane || !rightPane || !resizer) return;

    // Config
    const MAX_RIGHT_RATIO      = 0.5; // hard cap: 50%
    const COLLAPSE_THRESHOLD   = 0.4; // collapse if right < 40%
    const MIN_RIGHT_PX_DEFAULT = (() => {
        const cssMin = parseInt(getComputedStyle(rightPane).minWidth || '280', 10);
        return Number.isFinite(cssMin) ? cssMin : 280;
    })();

    let dragState = null;

    function clampRightPx(px) {
        const cw = container.getBoundingClientRect().width;
        const maxPx = Math.floor(cw * MAX_RIGHT_RATIO);
        const minPx = MIN_RIGHT_PX_DEFAULT;
        return Math.max(minPx, Math.min(px, maxPx));
    }

    function setRightPercent(percent) {
        rightPane.style.setProperty('--right-width', percent.toFixed(2) + '%');
        rightPane.style.flexBasis = percent.toFixed(2) + '%';
        rightPane.style.width     = percent.toFixed(2) + '%';
        updateAria(percent);
        updateChatVisibility(percent);
    }

    function setRightWidthPx(px) {
        const cw = container.getBoundingClientRect().width;
        const clamped = clampRightPx(px);
        const percent = (clamped / cw) * 100;
        setRightPercent(percent);
    }

    function updateAria(percent) {
        resizer.setAttribute('role', 'separator');
        resizer.setAttribute('aria-orientation', 'vertical');
        resizer.setAttribute('aria-valuemin', '0');
        resizer.setAttribute('aria-valuemax', String(Math.round(MAX_RIGHT_RATIO * 100))); // 50
        resizer.setAttribute('aria-valuenow', String(Math.round(Math.min(percent, MAX_RIGHT_RATIO * 100))));
    }

    function collapseRight() {
        rightPane.classList.add('is-collapsed');
        restoreBtn?.classList.add('is-visible');
        if (chatCircle) chatCircle.style.display = 'block';
    }

    function expandRightFromCollapse() {
        rightPane.classList.remove('is-collapsed');
        restoreBtn?.classList.remove('is-visible');
        if (chatCircle) chatCircle.style.display = 'none';
    }

    function restoreRightTo50() {
        expandRightFromCollapse();
        setRightPercent(50);
    }

    function updateChatVisibility(percent) {
        if (percent < COLLAPSE_THRESHOLD * 100) {
            collapseRight();
        } else {
            expandRightFromCollapse();
        }
    }
    function applyRightWidthPx(px) {
        const cw = container.getBoundingClientRect().width;
        const minPx = MIN_RIGHT_PX_DEFAULT;

        if (px < minPx) {
            collapseRight();
            return;
        }
        setRightWidthPx(px);
    }

    // Dragging
    resizer.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        resizer.setPointerCapture(e.pointerId);
        const rightRect = rightPane.getBoundingClientRect();
        dragState = { pointerId: e.pointerId, startX: e.clientX, startRightWidth: rightRect.width };
        container.classList.add('is-dragging');
        resizer.classList.add('is-dragging');
    });

    resizer.addEventListener('pointermove', (e) => {
        if (!dragState) return;
        const dx = e.clientX - dragState.startX;
        const newRightWidth = dragState.startRightWidth - dx;
        applyRightWidthPx(newRightWidth);
    });

    function endDrag() {
        if (!dragState) return;
        try { resizer.releasePointerCapture(dragState.pointerId); } catch (_) {}
        dragState = null;
        container.classList.remove('is-dragging');
        resizer.classList.remove('is-dragging');
    }
    resizer.addEventListener('pointerup', endDrag);
    resizer.addEventListener('pointercancel', endDrag);
    window.addEventListener('blur', endDrag);


    resizer.addEventListener('dblclick', (e) => {
        e.preventDefault();
        restoreRightTo50();
    });

    restoreBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        restoreRightTo50();
    });

    chatCircle?.addEventListener('click', (e) => {
        e.preventDefault();
        restoreRightTo50();
    });

    function initWidth() {
        rightPane.classList.remove('is-collapsed');
        restoreBtn?.classList.remove('is-visible');
        if (chatCircle) chatCircle.style.display = 'none';
        setRightPercent(50);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidth);
    } else {
        initWidth();
    }
    window.addEventListener('load', initWidth);

    window.addEventListener('resize', () => {
        if (rightPane.classList.contains('is-collapsed')) return;
        const cw = container.getBoundingClientRect().width;
        const cur = rightPane.getBoundingClientRect().width;
        const capped = Math.min(cur, Math.floor(cw * MAX_RIGHT_RATIO));
        setRightWidthPx(capped);
        //refreshBadges();
    });
})();

function updateAllCurlSnippets() {
    var tenantName = localStorage.getItem("tenant");
    /*var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
        var coo = cookies[i].split("=");
        if (coo[0].trim() === "tenant") {
            tenantName = coo[1].replaceAll('"', "").split(" ")[0];
            break;
        }
    }*/




    document.querySelectorAll("pre.text_wrap").forEach(function(preElem) {
        //var updatedCurl = preElem.textContent;
        //updatedCurl = updatedCurl.replace(/{{currentHost}}/g, $scope.currentHost + "/tenant/" + tenantName);
        //preElem.textContent = updatedCurl;
    });



}

updateAllCurlSnippets();

function deleteAllCookies() {
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

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

    location.reload(true);
}
