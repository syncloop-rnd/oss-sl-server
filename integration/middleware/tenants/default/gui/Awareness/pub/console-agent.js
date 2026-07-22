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

app.controller('MainCtrl', ['$scope', '$http', '$timeout', '$sce', '$q', '$injector', function($scope, $http, $timeout, $sce, $q, $injector) {

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
    $scope.currentHost = window.location.protocol + "//" + window.location.host;
    $scope.currentTeam = null;
    $scope.currentConversation = null;
    $scope.jwtToken = null;
    $scope.currentUrl = location.href;
    $scope.copyLinkCaption = "Copy link";
    $scope.isAgentInviting = false;
    $scope.sharedConsumers = [];
    $scope.restricted_keywords = ["abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "continue", "default", "do", "double", "else", "enum", "extends", "final", "finally", "float", "for", "if", "implements", "import", "instanceof", "int", "interface", "long", "native", "new", "null", "package", "private", "protected", "public", "return", "short", "static", "strictfp", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "try", "void", "volatile", "while"];

    $scope.users = {};
    $scope.openSwagger = function() {
        window.open("middleware/pub/server/ui/oas/client.html?fqn=" + $scope.chat_list_type, '_blank');
    }

    $scope.searchText = {
        agents: '',
        apps: '',
        teams: '',
        tools: '',
        llms: '',
        kbs: '',
        rags: ''
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
        const temperature = (llm.temperature !== undefined ? llm.temperature.toString() : '').toLowerCase();
        const maxTokens = (llm.maxTokens !== undefined ? llm.maxTokens.toString() : '').toLowerCase();
        const enablePFC = (llm.enableParallelToolCalling ? 'true' : 'false');
        const name = (llm.name || '').toLowerCase();

        return [
            model, provider, baseUrl, apiKey,
            temperature, maxTokens, enablePFC, name
        ].some(field => field.includes(query));
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
    $scope.spec.RAGs = $scope.spec.RAGs || [];
    $scope.spec.KBs = $scope.spec.KBs || [];
    $scope.Conversations = $scope.Conversations || [];

    $scope.closeOverlayLLM = function() {
        document.getElementById("overlay-llm").classList.remove("open");
        document.getElementById("bgOverlay").classList.remove("active");
        document.body.classList.remove("bodyscroll-fixed");
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
        const infoEl = document.getElementById("info_message_tool");
        const saveBtn = document.querySelector('#overlay-tool button[ng-click="completeToolEdit()"]');

        input.value = "";
        input.classList.remove("is-invalid");
        infoEl.textContent = "";
        saveBtn?.removeAttribute("disabled");
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
        var all = ($scope.filterAgentsForApp && $scope.filterAgentsForApp()) || [];
        var ids = ((team && team.Agents) || []).map(function (x) { return x && x.identifier; });
        var idSet = Object.create(null);
        for (var i = 0; i < ids.length; i++) {
            if (ids[i]) idSet[ids[i]] = true;
        }
        return all.filter(function (a) { return a && idSet[a.identifier]; });
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
        $('#addUpdateLLMModel').modal('show');
        $("#llm_edit_provider").select2({
            placeholder: "Select Provider",
            width: "100%"
        }).val($scope.selectedllm).trigger('change');


        document.getElementById("overlay-llm").classList.add("open");
        document.getElementById("bgOverlay").classList.add("active");
    };

    $scope.openLLMEdit = function(llm) {
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

        document.getElementById("overlay-llm").classList.add("open");
        document.getElementById("bgOverlay").classList.add("active");
    };

    $scope.completeLLMEdit = function() {
        $scope.saveInProgress = true;
        document.body.classList.remove("bodyscroll-fixed");

        var modelName = $('#llm_edit_modelName').val().trim();
        var baseUrl = $('#llm_edit_baseUrl').val().trim();
        var apiKey = $('#llm_edit_apiKey').val().trim();
        var temperatureStr = $('#llm_edit_temperature').val().trim();
        var name = $('#llm_edit_name').val().trim();
        var provider = $('#llm_edit_provider').val().trim();
        var maxTokensStr = $('#llm_edit_maxTokens').val().trim();
        var enableParallelToolCalling = $('#llm_edit_enablePFC').is(':checked');

        if (!modelName) {
            swal({
                title: "Missing Model Name",
                text: "Please enter Model Name.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            $scope.saveInProgress = false;
            return;
        }

        if (modelName.length > 99) {
            swal({
                title: "Name Too Long",
                text: "Try using a more concise name.",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
            $scope.saveInProgress = false;
            return;
        }




        if (!provider) return swal({title: "Missing Provider",
            text: "Please enter Provider.",
            type: "error",
            confirmButtonColor: "#f2533e" // Optional: customize button color
        }), $scope.saveInProgress = false;
        if (!baseUrl) return swal({ title: "Missing Base URL",  text: "Please enter Base URL.", type: "error", confirmButtonColor: "#f2533e" // Optional: red-style confirm button
        }), $scope.saveInProgress = false;
        if (!apiKey) return swal({  title: "Missing API Key",  text: "Please enter API Key.",  type: "error",  confirmButtonColor: "#f2533e" // Optional: custom confirm button color
        }), $scope.saveInProgress = false;
        if (!temperatureStr) return swal({ title: "Missing Temperature",  text: "Please enter Temperature.",  type: "error",  confirmButtonColor: "#f2533e" // Optional: sets a custom color for the confirm button
        }), $scope.saveInProgress = false;
        var temperature = parseFloat(temperatureStr);
        if (isNaN(temperature)) return swal({  title: "Invalid Temperature",  text: "Temperature must be a number.",  type: "error",
            confirmButtonColor: "#f2533e"}), $scope.saveInProgress = false;
        if (!maxTokensStr) return swal({  title: "Missing Max Tokens",  text: "Please enter Max Tokens.",  type: "error",  confirmButtonColor: "#f2533e" // Optional: custom confirm button color
        }), $scope.saveInProgress = false;
        var maxTokens = parseInt(maxTokensStr);
        if (isNaN(maxTokens) || maxTokens < 1) return swal({ title: "Invalid Max Tokens", text: "Must be an integer >= 1.", type: "error", confirmButtonColor: "#f2533e"}), $scope.saveInProgress = false;

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

        if ($scope.currentLLM) {
            SYNCLOOP_AI.LLM.upsertLLM(
                $scope.currentLLM.LLMkey, name, provider, maxTokens, baseUrl, apiKey, modelName, temperature, enableParallelToolCalling,
                function () {
                    Object.assign($scope.currentLLM, { modelName, baseUrl, apiKey, temperature, name, provider, maxTokens, enableParallelToolCalling });
                    onSuccess();
                },
                onError
            );
        } else {
            let newLLM = {
                modelName, baseUrl, apiKey, temperature, name, provider, maxTokens,
                enableParallelToolCalling,
                LLMkey: 'llm_' + Date.now()
            };

            SYNCLOOP_AI.LLM.upsertLLM(
                newLLM.LLMkey, name, provider, maxTokens, baseUrl, apiKey, modelName, temperature, enableParallelToolCalling,
                function () {
                    $scope.spec.LLMs.push(newLLM);
                    onSuccess();
                },
                onError
            );
        }
    };

    $scope.confirmDeleteLLM = function(llm) {
        swal({
            title: "Are you sure?",
            text: "Once you click 'Yes'. The '" + llm.modelName + "' LLM will be permanently deleted and cannot be recovered",
            imageUrl: "images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: true
        }, function() {

            console.log(llm);

            SYNCLOOP_AI.LLM.deleteLLM(llm.LLMkey,
                function (response) {
                    var index = $scope.spec.LLMs.indexOf(llm);
                    if (index > -1) {
                        $scope.spec.LLMs.splice(index, 1);
                    }
                    $scope.$applyAsync();
                },
                function (xhr, status, error) {
                    var message = (xhr && xhr.responseJSON && xhr.responseJSON.error) || error || 'Could not delete LLM.';
                    swal({
                        title: "Could not delete LLM",
                        text: message,
                        type: "error"
                    });
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

    $scope.getLLMName = function(LLMkey) {
        var found = $scope.spec.LLMs.find(function(llm) {
            return llm.LLMkey === LLMkey;
        });
        return found ? found.modelName : "N/A";
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

                SYNCLOOP_AI.AGENTS.upsertAgent(newAgentId, agentTitle, agentName, agentDescription, agentLLM,
                    function (response) {
                        $scope.spec.Agents.push(newAgent);
                        if (null != agentTeamId) {
                            $scope.addAgentInTeam(newAgentId, agentTeamId);
                        }
                        $scope.saveInProgress = false;

                        document.getElementById("overlay-agent").classList.remove("open");
                        document.getElementById("bgOverlayAgent").classList.remove("active");

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

                    SYNCLOOP_AI.AGENTS.upsertAgent(agentId, agentTitle, agentName, agentDescription, agentLLM,
                        function (response) {
                            if (null != agentTeamId) {
                                $scope.addAgentInTeam(agent.identifier, agentTeamId);
                            }
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
            imageUrl: "images/delete_exclamation.svg",
            showCancelButton: true,
            confirmButtonColor: "#f2533e",
            confirmButtonText: "Yes, delete it!",
            closeOnConfirm: false
        }, function () {

            swal({
                title: "Deleting...",
                text: "Please wait while we delete this agent and its tools.",
                imageUrl: "images/delete_exclamation.svg",
                confirmButtonColor: "#f2533e",
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });

            SYNCLOOP_AI.AGENTS.deleteAgent(agent.identifier, function () {

                const toolsToDelete = $scope.spec.Tools.filter(t => t.identifier === agent.identifier);
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
        llmKey: '',
        selectedToolIds: [],
        selectedKBIds: []
    };

    $scope.agentForm = $scope.agentForm || { name: '', title: '', instructions: '', llmKey: '' };
    $scope.showWelcomeBubble = false;   // we'll use a real chat bubble instead
    $scope.isNewAgent = false;

    function resetChatState() {
        $scope.chatHistory = [];
        $scope.conversationID = null;
        $scope.newChatMessage = "";
        $scope.chatHistoryLoading = false;
        $scope.chatWaitVisible = false;
    }

    $scope.openAgentBox = function (agent = null, isNew = false, opts = {}) {
        const skipUrl = !!opts.skipUrl;
        // ===== NEW AGENT FLOW =====
        if (isNew || !agent) {
            const defaultName = "Default Agent";
            const newAgent = {
                identifier: generateUUID(),
                name: defaultName,
                title: "",
                LLMkey: "",
                roleDescription: $scope.encodeBase64(""),
                isDraft: true
            };

            $scope.spec.Agents = $scope.spec.Agents || [];
            $scope.spec.Agents.push(newAgent);

            $scope.currentAgent = newAgent;
            $scope.activeAgent  = newAgent;
            if (!skipUrl) {
                setQueryParam("agent_id", ($scope.activeAgent || agent)?.identifier);
            }

            $scope.agentForm.name         = defaultName;
            $scope.agentForm.title        = "";
            $scope.agentForm.instructions = "";
            $scope.agentForm.llmKey = ($scope.spec.LLMs && $scope.spec.LLMs.length > 0)
                ? $scope.spec.LLMs[0].LLMkey : "";

            $scope.queueAgentAutosave(true);

            resetChatState();
            $scope.isNewAgent = true;
            $scope.showWelcomeBubble = false;

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
                text: $sce.trustAsHtml(starterTipsHtml)
            });
           $scope.$applyAsync(function () {
                $scope.scrollToLastMessage();
            });

            $scope.showAgentBox = true;
            document.body.classList.add("bodyscroll-fixed");
            $('#sidebar-wrapper').addClass('minsidebar');

            $scope.wrapperService = WRAPPER_SERVICE_JSON;

            WRAPPER_SERVICE_JSON.latest.api[0].children[0].children[0].data.createList = [];

            WRAPPER_SERVICE_JSON.latest.api[0].children[0].children[0].data.createList.push({
                path: "agentId",
                value: newAgent.identifier,
                id: generateUUID(),
                typePath: 'string'
            });

            WRAPPER_SERVICE_JSON.latest.api[0].children[0].children[0].data.createList.push({
                path: "agentName",
                value: newAgent.name,
                id: generateUUID(),
                typePath: 'string'
            });

            return;
        }

        // ===== EXISTING AGENT FLOW =====
        $scope.currentAgent = agent;
        $scope.activeAgent  = agent;

        if (!skipUrl) {
            setQueryParam("agent_id", ($scope.activeAgent || agent)?.identifier);
        }

        $scope.loadWrapperService();

        $scope.agentForm.name         = (agent.name  || '').trim();
        $scope.agentForm.title        = (agent.title || '').trim();
        $scope.agentForm.instructions = $scope.decodeBase64(agent.roleDescription) || '';
        $scope.agentForm.llmKey       = agent.LLMkey || '';

        $scope.isNewAgent = false;
        $scope.showWelcomeBubble = false;

        resetChatState();
        $scope.chatHistoryLoading = true;

        $scope.showAgentBox = true;
        document.body.classList.add("bodyscroll-fixed");
        $('#sidebar-wrapper').addClass('minsidebar');

        const historyUrl = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/chatHistory?agentID=" + agent.identifier;
        $http.get(historyUrl).then(function (resp) {
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
                scrollAgentChatToBottom && scrollAgentChatToBottom();

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
    };

    $scope.loadWrapperService = function () {

    }

    $scope.isAnimated = false;
    $scope.closeAgentBox = function () {
        $scope.showAgentBox = false;
        $scope.showNAppls = true;
        document.body.classList.remove("bodyscroll-fixed");
        setQueryParam("agent_id", null);
    };

    function scrollAgentChatToBottom () {
        $timeout(function () {
            var el = document.getElementById('agentChatWindow');
            if (el) el.scrollTop = el.scrollHeight;
        }, 0, false);
    }

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
        $scope.activeAgent = agent;
        $scope.currentChatAgent = agent;
        $scope.agentSearchQuery = "";
        $scope.isAgentPickerOpen = false;

        $scope.chatHistory = [];
        $scope.conversationID = null;
        loadAgentChatHistoryForRightPane(agent);
    };

    function loadAgentChatHistoryForRightPane(agent) {
        if (!agent) return;
        $scope.currentChatAgent    = agent;
        $scope.chatHistory         = [];
        $scope.conversationID      = null;
        $scope.newChatMessage      = "";
        $scope.chatHistoryLoading  = true;
        $scope.chatWaitVisible     = false;

        // Optional: welcome line for empty/any history
        $scope.welcomeText     = "Hi! What would you like to learn today?";
        $scope.welcomeSafeHtml = $sce.trustAsHtml($scope.welcomeText);

        // Same endpoint logic as legacy, but DO NOT touch chatModalVisible/#chatboxfirst, etc.
        let historyUrl = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/chatHistory?agentID=" + agent.identifier;
        if ($scope.currentChatAgent.type === 'TEAM') {
            historyUrl = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + '/chatHistory?teamId=' + agent.teamId;
        }

        $http.get(historyUrl).then(function (response) {
            $scope.chatHistoryLoading = false;
            if (response.data && Array.isArray(response.data.chatHistory)) {
                $scope.chatHistory = response.data.chatHistory.map(function (msg) {
                    return {
                        ...msg,
                        text: msg.user === "Agent"
                            ? $sce.trustAsHtml(showdownConverter.makeHtml(msg.text))
                            : $sce.trustAsHtml(msg.text)
                    };
                });
            } else {
                // still show welcome even if no history
                $scope.chatHistory = [];
            }
            // ensure the agent box (new design) is visible
            $scope.showAgentBox = true;
            $scope.$applyAsync();
            scrollAgentChatToBottom?.();
        }, function (error) {
            $scope.chatHistoryLoading = false;
            $scope.showNotification('error', "Failed to load chat history: " + (error.data?.error || error.statusText));
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

    $scope.handleAgentChatKeydown = function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            $scope.sendAgentChatMessage();
        }
    };

    $scope.scrollToLastMessage = function () {
        $timeout(function () {
            const el = document.querySelector(".chat-logsagent");
            if (el) el.scrollTop = el.scrollHeight;
        }, 50);
    };

    $scope.sendAgentChatMessage = function () {
        if (!$scope.activeAgent || !$scope.activeAgent.identifier) return;
        if (!$scope.newChatMessage || $scope.chatWaitVisible) return;

        var userMessage = $scope.newChatMessage;
        const trustedHtml = $sce.trustAsHtml(userMessage.replace(/\n/g, '<br>'));
        $scope.chatHistory.push({ user: "User", text: trustedHtml, _rawText: userMessage });
       $scope.$applyAsync(function () {
            $scope.scrollToLastMessage();
        });
        const userIdx = $scope.chatHistory.length - 1;
        $scope.newChatMessage = "";

        setTimeout(function(){
            var chatWindow = document.querySelector('.fullmodal_box--rightscroll');
            if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
        }, 0);

        const agentId = getQueryParam("agent_id");

        var payload = { agentID: agentId, prompt: userMessage, chatID: $scope.conversationID };
        let serviceName = "_" + agentId.replaceAll("-", "_");

        const params = new URLSearchParams(window.location.search);
        const tenant = params.get("tenant");

        let chatURL = window.ENV.API_BASE_URL + "/tenant/" + tenant + "/public/packages.ConsumerAgents.wrapper.api.agents." + serviceName + ".main/chat";
        if ($scope.activeAgent.type === 'TEAM') {
            chatURL = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/team/chat";
            payload = { teamId: $scope.activeAgent.teamId, prompt: userMessage, chatID: $scope.conversationID };
        }
        if ($scope.chatHistory.length < 2) payload['chatTitle'] = userMessage.trim().length < 4 ? "New Chat" : userMessage;

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

        if (localStorage.getItem("AuthToken")) {
            //httpCfg.headers['Authorization'] = "Bearer " + localStorage.getItem("AuthToken");
        }

        $http.post(chatURL, payload, httpCfg)
            .then(function (response) {
                if (!$scope.chatWaitVisible) return; // aborted
                $scope.chatWaitVisible = false;

                if (response.data && (response.data.resp || response.data.response)) {
                    $scope.conversationID = response.data.conversationChatID || $scope.conversationID;
                    var resp = response.data.resp || response.data.response;
                    $scope.chatHistory.push({
                        user: "Agent",
                        text: $sce.trustAsHtml(showdownConverter.makeHtml(resp)),
                        _replyToIdx: userIdx,
                        _rawPrompt: userMessage
                    });
                   $scope.$applyAsync(function () {
                        $scope.scrollToLastMessage();
                    });
                    setTimeout(function(){
                        var chatWindow = document.querySelector('.fullmodal_box--rightscroll');
                        if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
                    }, 0);
                } else {
                    $scope.showNotification && $scope.showNotification('error', "Unexpected chat API response.");
                    const data = response.data || {};
                    const errMsg = data.error || "Unexpected chat API response.";
                    $scope.chatHistory.push({
                        user: "Agent",
                        alias: "Syncloop Assistant",
                        text: $sce.trustAsHtml(`
                        <div class="agent-error">
                          <div class="agent-error__title">⚠️ Chat Error</div>
                          <div class="agent-error__msg">${String(errMsg).replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]))}</div>
                          ${data.conversationChatID ? `<div class="agent-error__meta"><b>Conversation ID:</b> ${data.conversationChatID}</div>` : ''}
                        </div>
                      `)
                    });
                   $scope.$applyAsync(function () {
                        $scope.scrollToLastMessage();
                    });
                    setTimeout(() => {
                        const chatWindow = document.querySelector('.fullmodal_box--rightscroll');
                        if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
                    }, 0);
                }
            }, function (error) {
                const aborted = (error && (error.status === -1 || error.xhrStatus === 'abort'));
                $scope.chatWaitVisible = false;
                if (!aborted) {
                    $scope.showNotification && $scope.showNotification('error', "Failed to send chat: " + (error.data?.error || error.statusText));
                    const data = response.data || {};
                    const errMsg = data.error || "Unexpected chat API response.";
                    $scope.chatHistory.push({
                        user: "Agent",
                        alias: "Syncloop Assistant",
                        text: $sce.trustAsHtml(`
                        <div class="agent-error">
                          <div class="agent-error__title">⚠️ Chat Error</div>
                          <div class="agent-error__msg">${String(errMsg).replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]))}</div>
                          ${data.conversationChatID ? `<div class="agent-error__meta"><b>Conversation ID:</b> ${data.conversationChatID}</div>` : ''}
                        </div>
                      `)
                    });
                   $scope.$applyAsync(function () {
                        $scope.scrollToLastMessage();
                    });
                    setTimeout(() => {
                        const chatWindow = document.querySelector('.fullmodal_box--rightscroll');
                        if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
                    }, 0);
                }
            })
            .finally(function () {
                $scope._activeChatCancel = null;
            });
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

        const params = new URLSearchParams(window.location.search);
        const tenant = params.get("tenant");

        const agentId = getQueryParam("agent_id");
        let serviceName = "_" + agentId.replaceAll("-", "_");
        let chatURL = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/tenant/" + tenant + "/public/packages.ConsumerAgents.wrapper.api.agents." + serviceName + ".main/chat";

        let payload = { agentID: agentId, prompt: prompt, chatID: $scope.conversationID };
        if ($scope.activeAgent.type === 'TEAM') {
            chatURL = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/team/chat";
            payload = { teamId: $scope.activeAgent.teamId, prompt: prompt, chatID: $scope.conversationID };
        }

        msg._reloading = true;

        const headers = { 'Content-Type': 'application/json' };
        if (localStorage.getItem("AuthToken")) {
            // headers['Authorization'] = "Bearer " + localStorage.getItem("AuthToken");
        }

        $http.post(chatURL, payload, { headers: headers })
            .then(function (response) {
                if (response.data && (response.data.resp || response.data.response)) {
                    $scope.conversationID = response.data.conversationChatID || $scope.conversationID;

                    const resp = response.data.resp || response.data.response;
                    const newHtml = showdownConverter.makeHtml(resp);

                    msg._baseHtml = newHtml;
                    msg.text = $sce.trustAsHtml(newHtml);
                    setTip('Reloaded!');
                } else {
                    const data = response.data || {};
                    const errMsg = data.error || "Unexpected chat API response.";
                    if (data.conversationChatID) $scope.conversationID = data.conversationChatID;

                    const errHtml = `
                      <div class="agent-error" style="margin-top:6px">
                        <div class="agent-error__title">⚠️ Chat Error</div>
                        <div class="agent-error__msg">${String(errMsg).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]))}</div>
                        ${data.conversationChatID ? `<div class="agent-error__meta"><b>Conversation ID:</b> ${data.conversationChatID}</div>` : ''}
                      </div>`;
                    msg.text = $sce.trustAsHtml(errHtml);
                    setTip('Error');
                }
            }, function (error) {
                const data = error?.data || {};
                const errMsg = data.error || error.statusText || 'Reload failed';
                if (data.conversationChatID) $scope.conversationID = data.conversationChatID;

                const errHtml = `
                    <div class="agent-error" style="margin-top:6px">
                      <div class="agent-error__title">⚠️ Chat Error</div>
                      <div class="agent-error__msg">${String(errMsg).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]))}</div>
                      ${data.conversationChatID ? `<div class="agent-error__meta"><b>Conversation ID:</b> ${data.conversationChatID}</div>` : ''}
                    </div>`;
                msg.text = $sce.trustAsHtml(errHtml);
                setTip('Error');
            })
            .finally(function () {
                msg._reloading = false;
                $scope.$applyAsync();
               $scope.$applyAsync(function () {
                    $scope.scrollToLastMessage();
                });
                setTimeout(function () {
                    const chatWindow = document.querySelector('.fullmodal_box--rightscroll');
                    if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
                }, 0);
            });
    };

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
        let mode = null;               // 'primary' | 'append'
        let srManualStop = false;      // <-- guard to NOT auto-restart

        $scope.isVoicePrimaryActive = false;
        $scope.isVoiceAppendActive  = false;

        $scope.hasTypedText = function(){
            return !!($scope.newChatMessage || '').trim();
        };

        function begin(m){
            mode = m;
            srManualStop = false;
            buffer = '';
            if (mode === 'primary') {
                startText = '';
                $scope.newChatMessage = '';
                $scope.isVoicePrimaryActive = true;
                $scope.isVoiceAppendActive  = false;
            } else {
                startText = ($scope.newChatMessage || '').trim();
                $scope.isVoiceAppendActive  = true;
                $scope.isVoicePrimaryActive = false;
            }
            try { r.start(); } catch(_) { try { r.stop(); r.start(); } catch(__) {} }
            $scope.$applyAsync();
        }

        $scope.startPrimaryVoice = function () {
            if (!$scope.srSupported) return;
            if ($scope.isRecording()) return;
            $scope.isVoicePrimaryActive = true;
            $scope.isVoiceAppendActive  = false;
            $scope._startedPrimaryWithEmpty = !($scope.newChatMessage || '').trim();
            try { r.start(); } catch (_) { r.stop(); r.start(); }
            $scope.$applyAsync();
        };

        $scope.startAppendVoice = function () {
            if (!$scope.srSupported) return;
            if ($scope.isRecording()) return;
            $scope.isVoiceAppendActive  = true;
            $scope.isVoicePrimaryActive = false;
            try { r.start(); } catch (_) { r.stop(); r.start(); }
            $scope.$applyAsync();
        };

        $scope.stopVoice = function () {
            srManualStop = true;
            try { r.stop(); } catch(_) {}
            $scope.isVoicePrimaryActive = false;
            $scope.isVoiceAppendActive  = false;
            $scope.$applyAsync();
        };


        $scope.stopAll = function () {
            $scope.stopVoice();
            if ($scope._activeChatCancel && typeof $scope._activeChatCancel.resolve === 'function') {
                $scope._activeChatCancel.resolve();
            }
            $scope._activeChatCancel = null;
            $scope.chatWaitVisible = false;
            $scope.$applyAsync();
        };

        r.onresult = function (e) {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const res = e.results[i];
                if (res.isFinal) buffer += res[0].transcript;
                else interim += res[0].transcript;
            }

            if ($scope.isVoiceAppendActive) {
                $scope.newChatMessage = (startText + ' ' + buffer + interim).trim();
            } else if ($scope.isVoicePrimaryActive) {
                $scope.newChatMessage = (buffer + interim).trim();
            }
            $scope.$applyAsync();
        };

        r.onerror = function(){
            $scope.isVoicePrimaryActive = false;
            $scope.isVoiceAppendActive  = false;
            mode = null;
            $scope.$applyAsync();
        };

        r.onend = function () {
            if (srManualStop) return;

            $scope.isVoicePrimaryActive = false;
            $scope.isVoiceAppendActive  = false;

            if ($scope._startedPrimaryWithEmpty && buffer.trim()) {
                $scope.sendAgentChatMessage();
            }

            $scope.$applyAsync();
        };
    })();

    $scope.hasTypedText = function () {
        return !!($scope.newChatMessage && $scope.newChatMessage.trim().length);
    };

    $scope.isRecording = function () {
        return !!($scope.isVoicePrimaryActive || $scope.isVoiceAppendActive);
    };

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

                $scope.toolToAttachFqn = '';
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
        $scope.startSaving();

        SYNCLOOP_AI.TOOLS.deleteTool(
            $scope.currentAgent.identifier,
            tool.fqn,
            function onOk () {
                $scope.spec.Tools = ($scope.spec.Tools || []).filter(function (t) {
                    return !(t.identifier === $scope.currentAgent.identifier && t.fqn === tool.fqn);
                });
                $scope.finishSaving(2000);
                $scope.$applyAsync();
            },
            function onErr () {
                $scope.resetSaveStatus();
                $scope.$applyAsync();
            }
        );
    };

    $scope.showaddmodaltoolBox = false;
    $scope.toolForm = {
        type: 'api',          // 'api' | 'kb'
        selected: '',         // API fqn or KB ragID
        agentId: '',          // filled from currentAgent
        description: '',
        staticPayload: '',    // optional JSON for API
        schemaObj: null       // optional JSON object for API schema
    };

    $scope.opentoolBox = function (agent) {
        var a = agent || $scope.currentAgent || $scope.activeAgent;
        if (!a || !a.identifier) {
            console.warn('No current agent to attach a tool to.');
            return;
        }

        $scope.toolForm = {
            type: 'api',
            selected: '',
            agentId: a.identifier,
            description: '',
            name: '',
            staticPayload: '',
            schemaObj: null
        };

        if ($scope.treePackages) {
            populateAITools($scope.treePackages);
        }

        $scope.showaddmodaltoolBox = true;
        $scope.$evalAsync();
        $scope.showaddmodalpayloadbox = false;
        $scope.showaddmodalschemabox = false;
        $scope.showaddmodalchathistory = false;
    };

    $scope.createToolFromModal = function () {

        if (!$scope.toolForm.agentId && $scope.currentAgent && $scope.currentAgent.identifier) {
            $scope.toolForm.agentId = $scope.currentAgent.identifier;  // <-- fallback
        }
        const f = $scope.toolForm || {};

        if (!f.agentId)              { console.warn('No agentId'); return; }
        if (!f.type)                 { console.warn('No type'); return; }
        if (f.type === 'api' && !f.selected && !f.name) { console.warn('Pick API or provide name'); return; }
        if (f.type === 'kb'  && !f.selected)            { console.warn('Pick a KB'); return; }
         $scope.showaddmodaltoolBox = false;
        const toolName    = (f.name || (f.type === 'api' ? f.selected : '') || '').trim();
        const description = (f.description || '').trim();

        let staticPayload = {};
        let schemaObj     = {};

        try {
            if (f.type === 'api') {
                const chosenFqn = f.selected || toolName;
                staticPayload = f.staticPayload ? JSON.parse(f.staticPayload) : {};
                staticPayload['*fqn'] = chosenFqn;
                schemaObj = { type: 'object', required: [], properties: {} };
            } else {
                // KB tool – canonical *fqn + ragID
                const kbFqn = 'packages.Awareness.assistant.tools.searchKnowledgeBase';
                staticPayload = { '*fqn': kbFqn, ragID: f.selected };
                schemaObj = {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    type: "object",
                    properties: { searchText: { type: "string" } },
                    required: ["searchText"]
                };
            }
        } catch (e) {
            console.error('Invalid static payload JSON', e);
            return;
        }

        const staticPayloadStr = JSON.stringify(staticPayload);
        const schemaStr        = JSON.stringify(schemaObj);

        $scope.startSaving();

        SYNCLOOP_AI.TOOLS.upsertTool(
            f.agentId,
            toolName,              // NOTE: this is your "fqn" param - UI label/name
            staticPayloadStr,      // plain JSON string
            schemaStr,             // plain JSON string
            description,
            function onOk () {
                ($scope.spec.Tools = $scope.spec.Tools || []).push({
                    identifier: f.agentId,
                    fqn: toolName,                             // UI label
                    provider: (f.type === 'kb' ? 'KB' : 'API'),
                    functionDescription: $scope.encodeBase64(description),
                    functionDescriptionDecoded: description,
                    inputJSONSchema: schemaStr,
                    staticJsonPayload: staticPayloadStr
                });

                $scope.finishSaving(2000);
                $scope.showaddmodaltoolBox = false;
                $scope.$applyAsync();
            },
            function onErr () {
                $scope.resetSaveStatus();
                $scope.$applyAsync();
            }
        );
    };


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

    };

    $scope.inviteAgent = function() {
        $scope.isAgentInviting = true;
        const a = $scope.currentAgent;
        if (!a || !a.identifier) return;
        const desc   = ($scope.agentForm.instructions || '').trim();

        const name   = ($scope.agentForm.name || '').trim();

        if (!name) return;

        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        let group = $scope.getShareToConsumers();

        if (!re.test(group)) {
            swal("Invalid Email", "Please add a valid email address.", "error");
            $scope.isAgentInviting = false;
            return ;
        }

        if (!$scope.groups.includes(group)) {
            $.ajax({
                url: window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.security.flow.addGroup.main",
                method: 'POST',
//                headers: { "Authorization": `Bearer ${localStorage.getItem("AuthToken")}` },
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
            url: window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.security.flow.addUserFlow.main",
            method: 'POST',
            // headers: { "Authorization": `Bearer ${localStorage.getItem("AuthToken")}` },
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                "userId": group,
                "password": generateUUID(),
                "name": "Syncloop User",
                "email": group,
                "isAdmin": false,
                "isDeveloper": false,
                "groups": [group]
            }),
            success: function(response) {

            },
            error: function(xhr, status, error) {

            }
        });

        $("#agent_share_option").val("");

        SYNCLOOP_AI.AGENTS.addWrapperService(a.identifier, name, desc, group, false, $scope.wrapperService, function (response) {
            $scope.isAgentInviting = false;
            $scope.loadWrapperService();
        }, function (xhr, status, error) {

        });

    };

    $scope.saveCurrentAgent = function() {
        const a = $scope.currentAgent;
        if (!a || !a.identifier) return;

        const name   = ($scope.agentForm.name || '').trim();
        const title  = ($scope.agentForm.title || '').trim();
        const desc   = ($scope.agentForm.instructions || '').trim();
        const llmKey = $scope.agentForm.llmKey || '';

        if (!name) return;

        Object.assign(a, {
            name,
            title,
            LLMkey: llmKey,
            roleDescription: $scope.encodeBase64(desc || ''),
            roleDescriptionDecoded: desc || ''
        });

        $scope.startSaving();

        SYNCLOOP_AI.AGENTS.upsertAgent(
            a.identifier,
            title || "",
            name,
            desc || "",
            llmKey || "",
            function onOk() {
                a.isDraft = false;
                if (!($scope.spec.Agents||[]).some(x => x.identifier === a.identifier)) {
                    ($scope.spec.Agents = $scope.spec.Agents || []).push(a);
                }
                $scope.finishSaving(2000);
                $scope.$applyAsync();

                SYNCLOOP_AI.AGENTS.addWrapperService(a.identifier, name,
                    desc, [], $("#agent-public-switch").is(":checked"),
                    $scope.wrapperService);

            },
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
    $scope.openSettingBox = function() {
        $scope.showsettingBox = true;
         scope.showaddmodaltoolBox = false;
         scope.showaddmodalllmBox = false;
         scope.showaddmodalragbaseBox = false;
         scope.showaddmodalpayloadbox = false;
         scope.showaddmodalschemabox = false;
    }

    $scope.showaddmodalpayloadbox = false;
     $scope.openpayloadbox = function() {
        $scope.showaddmodalpayloadbox = true;
         $scope.showaddmodalschemabox = false;
          scope.showaddmodaltoolBox = false;
     }
     $scope.showaddmodalschemabox = false;
     $scope.openschemabox = function() {
        $scope.showaddmodalschemabox = true;
         $scope.showaddmodalpayloadbox = false;
          scope.showaddmodaltoolBox = false;
     }

    $scope.closeSettingBox= function(){
        $scope.showsettingBox = false;
    }

    $scope.closetoolBox= function(){
        $scope.showaddmodaltoolBox = false;
    }
    $scope.closepayloadBox= function(){
        $scope.showaddmodalpayloadbox = false;
    }
    $scope.closeschemaBox= function(){
        $scope.showaddmodalschemabox = false;
    }
    $scope.showaddmodalragbaseBox = false;
    $scope.openragbaseBox = function() {
        $scope.showaddmodalragbaseBox = true;
        $scope.showaddmodalchathistory = false;
    }

    $scope.showaddmodalchathistor = false;
    $scope.openhistroybox = function() {
        $scope.showaddmodalchathistory = true;
    }


    $scope.closeragbaseBox= function(){
        $scope.showaddmodalragbaseBox = false;
    }

    $scope.showaddmodalllmBox = false;
    $scope.openllmBox = function() {
        $scope.showaddmodalllmBox = true;
        $scope.showaddmodalchathistory = false;
    }
    $scope.closellmBox= function(){
        $scope.showaddmodalllmBox = false;
    }

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


    $scope.schemaLoaded = false;
    $scope.selectedFqn = null;

    $('#aiToolsAdd')
        .off('select2:select select2:unselect')
        .on('select2:select select2:unselect', (e) => {
            const all = $('#aiToolsAdd').val();
            $scope.selectedFqn = Array.isArray(all) ? all[0] : all;
        });


    function onAIToolsAddChange() {
        const $select = $('#aiToolsAdd');
        const selectedOption = $select.find('option:selected');
        const fqn = $select.val();
        const extension = selectedOption.attr('title');
        const isCustom = selectedOption.data('select2-tag') === true;

        $("#toolVariableInputs").empty();
        $("#toolVariablesRow").hide();
        $("#staticJsonPayloadRow").toggle(isCustom);

        if (!fqn || isCustom) {
            return;
        }
        if (!extension) {
            return;
        }

        const url = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/files/" + fqn.replace(/\./g, "/") + "." + extension;
        $http.get(url).then(resp => {
            const currentDesc = $("#tool_edit_description").val().trim();
            if (!currentDesc) {
                const apiDesc = resp.data.latest?.api_info?.description || "";
                $("#tool_edit_description").val(apiDesc);
            }
            const inputData = extension === "service"
                ? resp.data.input
                : resp.data.latest.input;
            return $http.post(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") +
                "/packages.middleware.pub.util.SyncloopIOtoSchema.main",
                { json: JSON.stringify(inputData) }
            );
        }).then(resp => {
            const schema = resp.data.schema || {};
            $scope.latestSchema = schema;

            $("#toolVariableInputs").empty();

            const hasInputs = schema.properties
                && Object.keys(schema.properties).length > 0;

            if (hasInputs) {
                renderInputFieldsFromSchema(schema);
            }

            $("#toolVariablesRow").toggle(hasInputs);
        });

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

    $scope.openToolAdd = function() {
        $scope.toolPopUpHeading = 'Add Tool';
        document.getElementById("overlay-tool").classList.add("open");
        document.getElementById("bgOverlayTool").classList.add("active");
        document.body.classList.add("bodyscroll-fixed");

        $scope.isToolEdit = false;

        $scope.toolType = 'api';
        $scope.latestSchema = null;
        $("#tool_edit_name, #tool_edit_description, #tool_static_json_payload, #tool_edit_id").val('');
        $("#toolVariableInputs").empty();
        $("#toolVariablesRow, #staticJsonPayloadRow").hide();
        $("#tool_edit_name").removeAttr('readonly');

        if ($.fn.select2 && $('#aiToolsAdd').hasClass("select2-hidden-accessible")) {
            $('#aiToolsAdd').select2('destroy');
        }
        $scope.selectedFqn = null;
        $('#aiToolsAdd').off('change').empty().select2({
            placeholder: "Select Tool",
            tags: false,
            width: '100%',
            allowClear: true
        }).prop("disabled", false).on('change', onAIToolsAddChange);

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
        const $select = $('#aiToolsAdd').off('change').empty();
        if ($scope.toolType === 'api') {
            populateAITools($scope.treePackages);
        } else {
            $scope.spec.KBs.forEach(kb =>
                $select.append(`<option value="${kb.ragID}" title="${kb.name}">${kb.name}</option>`)
            );
        }
        $select.select2({ placeholder:"Select Tool", tags:false, width:'100%', allowClear:true })
            .on('change', onAIToolsAddChange)
            .val(null).trigger('change');
    };

    function renderInputFieldsFromSchema(schema, parentKey = "") {
        if (!schema || !schema.properties) return;

        Object.entries(schema.properties).forEach(([key, val]) => {
            const fullKey = parentKey ? `${parentKey}.${key}` : key;
            const inputId = `var_${fullKey.replace(/\./g, "_")}`;
            const label = `${key} (${val.type || 'unknown'})`;

            console.log("Rendering key:", fullKey, "Type:", val.type);

            if (val.type === "object" && val.properties && Object.keys(val.properties).length > 0) {
                renderInputFieldsFromSchema(val, fullKey);
            } else if (val.type === "array" && val.items) {
                const baseName = fullKey;
                const baseId = baseName.replace(/\./g, "_");
                const itemType = val.items?.type || 'unknown';
                const label = `${baseName.split('.').pop()} (array of ${itemType})`;

                if (itemType === "object" && val.items.properties) {
                    const groupHTML = `
                    <div class="form-group array-field-group" data-name="${baseName}" data-type="object">
                    <label class="d-block mb-1" style="font-size: 0.85rem;">${label}</label>
                    <div class="array-item-list" id="array_list_${baseId}"></div>
                    <div class="mt-1">
                      <button class="btn btn-sm btn-light border add-array-item d-inline-flex align-items-center px-2 py-1"
                              type="button"
                              data-name="${baseName}" data-id="${baseId}"
                              style="font-size: 0.75rem; line-height: 1;">
                        <img src="./images/chatplus.svg" alt="Add" style="height: 14px; width: 14px; margin-right: 4px;" />
                        Add ${baseName.split('.').pop()}
                      </button>
                    </div>
                    </div>`;

                    $("#toolVariableInputs").append(groupHTML);
                    renderArrayObjectItem(baseName, baseId, val.items.properties, 0);
                } else {
                    const arrayHTML = `
				<div class="form-group array-field-group" data-name="${baseName}" data-type="${itemType}">
					<label>${label}</label>
					<div class="array-item-list">
						<div class="input-group mb-2 array-item" data-index="0">
							<div class="input-group-prepend">
								<span class="input-group-text">${baseName.split('.').pop()}[0]</span>
							</div>
							<input type="text" class="form-control var-input"
								id="var_${baseId}_0"
								data-name="${baseName}" data-type="${itemType}" />
							<div class="input-group-append">
								<button class="blueimg add-array-item text-center tooltip" type="button">
									<img src="./images/textfield_plus.svg" alt="Add" />
                                    <span class="tooltiptext">Add</span>
								</button>
							</div>
						</div>
					</div>
				</div>`;
                    $("#toolVariableInputs").append(arrayHTML);
                }
            } else {
                const fieldHTML = `
			<div class="form-group">
				<label>${label}</label>
				<input type="text" class="form-control var-input" data-name="${fullKey}" data-type="${val.type}" id="${inputId}" />
			</div>`;
                $("#toolVariableInputs").append(fieldHTML);
            }
        });
    }

    function renderArrayObjectItem(baseName, baseId, properties, index) {
        const label = baseName.split('.').pop();
        const containerId = `array_list_${baseId}`;
        let innerHTML = `
		<div class="array-item mb-3 border p-2 rounded" data-index="${index}">
			<label>${label}[${index}] (object)</label>
			<div class="nested-fields">`;

        Object.entries(properties).forEach(([childKey, childVal]) => {
            const childFullKey = `${baseName}[${index}].${childKey}`;
            const childId = `var_${baseId}_${index}_${childKey}`;
            innerHTML += `
		<div class="input-group mb-2">
			<div class="input-group-prepend">
				<span class="input-group-text">${childKey} (${childVal.type || 'unknown'})</span>
			</div>
			<input type="text" class="form-control var-input"
				id="${childId}" data-name="${childFullKey}" data-type="${childVal.type}" />
		</div>
	`;
        });


        if (index > 0) {
            innerHTML += `
		<div class="input-group-append">
			<button class="btn btn-outline-danger remove-array-object-item" type="button" title="Remove">
				<img src="middleware/pub/server/ui/icons/delete-filed.svg" alt="Delete" />
			</button>
		</div>`;
        }

        innerHTML += `</div></div>`;

        $(`#${containerId}`).append(innerHTML);
    }

    $(document).on('click', '.add-array-object-item', function () {
        const baseName = $(this).data('name');
        const baseId = $(this).data('id');
        const containerId = `array_list_${baseId}`;
        const index = $(`#${containerId} .array-item`).length;

        const schema = $scope.latestSchema?.properties?.[baseName]?.items?.properties;
        if (schema) {
            renderArrayObjectItem(baseName, baseId, schema, index);
        }
    });

    $(document).on('click', '.remove-array-object-item', function () {
        const group = $(this).closest('.array-field-group');
        $(this).closest('.array-item').remove();

        const baseName = group.data('name');
        const baseId = baseName.replace(/\./g, "_");
        group.find('.array-item').each(function (idx) {
            $(this).attr('data-index', idx);
            $(this).find('label').first().text(`${baseName.split('.').pop()}[${idx}]`);
        });
    });

    $(document).on('click', '.add-array-item', function () {
        const container = $(this).closest('.array-field-group');
        const list = container.find('.array-item-list');
        const baseName = container.data('name');
        const dataType = container.data('type');
        const index = list.find('.array-item').length;
        const baseId = baseName.replace(/\./g, "_");
        const label = baseName.split('.').pop();

        console.log("Add clicked for:", baseName, index);

        const newInput = `
		<div class="input-group mb-2 array-item" data-index="${index}">
			<div class="input-group-prepend">
				<span class="input-group-text">${label}[${index}]</span>
			</div>
			<input type="text" class="form-control var-input"
				id="var_${baseId}_${index}"
				data-name="${baseName}" data-type="${dataType}" />
			<div class="ed_action input-group-append">
				<button class="dl-hover action-icon remove-array-item tooltip text-center" type="button">
					<img src="./images/textfield_delete.svg" alt="Delete"/>
                    <span class="tooltiptext">Delete</span>
				</button>
			</div>
		</div>`;

        list.append(newInput);
    });

    $(document).on('click', '.remove-array-item', function () {
        const container = $(this).closest('.array-field-group');
        $(this).closest('.array-item').remove();

        const baseName = container.data('name');
        const baseId = baseName.replace(/\./g, "_");
        const label = baseName.split('.').pop();

        container.find('.array-item').each(function (idx) {
            $(this).attr('data-index', idx);
            $(this).find('.input-group-text').text(`${label}[${idx}]`);
            $(this).find('input').attr('id', `var_${baseId}_${idx}`);
        });
    });

    $scope.isToolEdit = false;

    $scope.openToolEdit = function (tool) {

        const knowledgeBaseFqn = "packages.Awareness.assistant.tools.searchKnowledgeBase";
        const askAgentFqn = "packages.Awareness.assistant.tools.askAgent";

        $scope.isToolEdit = true;

        $scope.toolPopUpHeading = 'Edit Tool';
        $("#toolVariablesRow").hide();
        $("#toolVariableInputs").empty();
        $("#tool_edit_name").attr('readonly', 'readonly');
        document.body.classList.add("bodyscroll-fixed");
        const schemaStrRaw = tool.staticJsonPayload || $scope.decodeBase64("{}");;
        let parsedSchema = {};
        try {
            const decoded = $scope.decodeBase64(schemaStrRaw); // Your existing Base64 decoder
            parsedSchema = JSON.parse(decoded);
        } catch (e) {
            console.warn("Invalid schema JSON", e);
        }

        const trueFqn = tool.fqn.startsWith("packages.") ? tool.fqn : parsedSchema?.["*fqn"] || "";
        const ragID = parsedSchema?.ragID || "";
        const isKB = ragID !== "";

        $scope.toolType = isKB ? 'kb' : 'api';
        $scope.onToolTypeChange();

        const selectVal = tool.fqn;

        $("#tool_edit_agents").empty();
        $scope.spec.Agents.forEach(agent => {
            $("#tool_edit_agents").append(`<option value="${agent.identifier}">${agent.name} ${agent.title}</option>`);
        });
        $("#tool_edit_agents").val(tool.identifier).select2({
            placeholder: "Select Agent",
            width: "100%",
            allowClear: true
        }).prop("disabled", true);;

        const $select = $('#aiToolsAdd');
        if ($select.data('select2')) $select.select2('destroy');
        $select.empty();

        if ($scope.toolType === 'api') {
            populateAITools($scope.treePackages);
        } else {
            $scope.spec.KBs.forEach(kb => {
                $select.append(
                    `<option value="${kb.ragID}" title="${kb.name}">${kb.name}</option>`
                );
            });
        }

        $select.select2({
            placeholder: isKB ? 'Select KB' : 'Select API',
            tags: true,
            width: '100%',
            allowClear: true
        }).prop("disabled", true);;

        $select.val(isKB ? ragID : trueFqn).trigger('change');
        $scope.selectedFqn = isKB ? ragID : trueFqn;

        tool.functionDescriptionDecoded = $scope.decodeBase64(tool.functionDescription);
        $("#tool_edit_id").val(tool.identifier || "");

        $("#tool_edit_description").val(tool.functionDescriptionDecoded || "");
        $("#tool_edit_name").val(selectVal || "");

        document.getElementById("overlay-tool").classList.add("open");
        document.getElementById("bgOverlayTool").classList.add("active");
    };

    $scope.completeToolEdit = function () {
        $scope.saveInProgress = true;
        document.body.classList.remove("bodyscroll-fixed");

        setTimeout(() => {
            const toolName = $("#tool_edit_name").val();
            const selectedFqn = $("#aiToolsAdd").val();
            const selectedAgent = $("#tool_edit_agents").val();
            const description = $("#tool_edit_description").val().trim();

            if (!toolName) {
                swal({
                    title: "Missing Name",
                    text: "Please select tool name.",
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
                    text: "Please select API/KB.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });

                $scope.saveInProgress = false;
                $scope.$applyAsync();
                return;
            }

            if (!selectedAgent) {
                swal({
                    title: "Missing Agent",
                    text: "Please select an Agent.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });


                $scope.saveInProgress = false; $scope.$applyAsync(); return;
            }

            if (!description) {

                swal({
                    title: "Missing Description",
                    text: "Please enter a Description.",
                    type: "error",
                    confirmButtonColor: "#f2533e" // red button
                });


                $scope.saveInProgress = false; $scope.$applyAsync(); return;
            }

            const selectedFqnExtension = $("#aiToolsAdd option:selected").attr("title");
            const createNewToolWithSchema = !!selectedFqnExtension;
            const isNewTool = ($("#tool_edit_id").val() || "").trim() === "";

            if (!createNewToolWithSchema) {
                const staticPayload = $("#tool_static_json_payload").val();

                const newTool = {
                    inputJSONSchema: "",
                    fqn: toolName,
                    identifier: selectedAgent,
                    functionDescription: $scope.encodeBase64(description),
                    editing: false,
                    functionDescriptionDecoded: description,
                    inputJSONSchemaDecoded: "",
                    staticJsonPayload: $scope.encodeBase64(staticPayload)
                };

                SYNCLOOP_AI.TOOLS.upsertTool(
                    selectedAgent, toolName, staticPayload, "", description,
                    function () {
                        $scope.spec.Tools.push(newTool);
                        $scope.saveInProgress = false;
                        document.getElementById("overlayTool").classList.remove("open");
                        document.getElementById("bgOverlayTool").classList.remove("active");
                        $scope.$applyAsync();
                        $scope.reloadTree();
                    },
                    function () {
                        swal({
                            title: "Error",
                            text: "Failed to add tool. Please try again.",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });

                        $scope.saveInProgress = false;
                        $scope.$applyAsync();
                    }
                );

                return;
            }

            const existingId = $("#tool_edit_id").val();
            if (!isNewTool) {
                $scope.spec.Tools = $scope.spec.Tools.filter(t => t.identifier !== existingId);
            }


            processToolInputsAndSave(selectedFqn, selectedAgent,
                function onSuccess() {
                    $scope.saveInProgress = false;
                    document.getElementById("overlay-tool").classList.remove("open");
                    document.getElementById("bgOverlayTool").classList.remove("active");

                    $scope.$applyAsync();
                },
                function onError() {
                    swal({
                        title: "Error",
                        text: "Failed to save tool with schema. Please try again.",
                        type: "error",
                        confirmButtonColor: "#f2533e"
                    });

                    $scope.saveInProgress = false;
                    $scope.$applyAsync();
                }
            );
        }, 0);
    };

    $scope.toolType = 'api';

    function processToolInputsAndSave(selectedFqn, selectedAgent, successCallback, errorCallback) {
        $scope.saveInProgress = true;

        try {
            const schemaCopy = JSON.parse(JSON.stringify($scope.latestSchema || {}));
            let assignedVars = {};

            $("#toolVariableInputs .var-input").each(function () {
                const val = $(this).val().trim();
                const name = $(this).data("name");
                if (val) {
                    assignedVars[name] = val;
                    delete schemaCopy.properties?.[name];
                }
            });

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
            const stringifiedSchema = JSON.stringify(schemaOverride || schemaCopy);

            const description = $("#tool_edit_description").val();
            const toolName = $("#tool_edit_name").val();

            const newTool = {
                inputJSONSchema: $scope.encodeBase64(stringifiedSchema),
                fqn: toolName,
                identifier: selectedAgent || generateUUID(),
                functionDescription: $scope.encodeBase64(description),
                editing: false,
                functionDescriptionDecoded: description,
                inputJSONSchemaDecoded: stringifiedSchema,
                staticJsonPayload: $scope.encodeBase64(staticPayload),
                toolType: $scope.toolType
            };

            SYNCLOOP_AI.TOOLS.upsertTool(
                newTool.identifier, newTool.fqn,
                staticPayload, stringifiedSchema, description,
                function () {
                    $scope.spec.Tools.push(newTool);
                    $scope.saveInProgress = false;
                    if (typeof successCallback === "function") successCallback();
                    else {
                        document.getElementById("overlayTool").classList.remove("open");
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

    $scope.hasFqn = function(tool) {
        try {
            const payload = JSON.parse($scope.decodeBase64(tool.staticJsonPayload || ""));
            return payload["*fqn"];
        } catch (e) {
            return false;
        }
    };

    $scope.getFqnPath = function(tool) {
        try {
            const payload = JSON.parse($scope.decodeBase64(tool.staticJsonPayload || ""));
            if (payload["*fqn"]) {
                return payload["*fqn"].replace(/\./g, "/");
            }
        } catch (e) {
            return "";
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

    $scope.openAppEdit = function() {
        let app = $scope.getApp();
        $scope.openApp();
        $scope.addappPopUpHeading = 'Edit App';
        document.body.classList.add("bodyscroll-fixed");

        $("#app_edit_id").val($scope.appId);
        $("#app_edit_name").val(app.appName);
        $("#appLink").val(app.appLink);
        $("#app_edit_requirement").val($scope.decodeBase64(app.description));
        setTimeout(function () {
            $("#app_edit_llm").select2({
                placeholder: "Select LLM",
                width: "100%"
            }).val(app.LLMkey).trigger('change');
        }, 0);

    }

    $scope.openApp = function() {
        $scope.addappPopUpHeading = 'Add App';
        document.getElementById("overlayApp").classList.add("open");
        document.getElementById("bgOverlayApp").classList.add("active");

        $("#app_edit_llm").html("");
        for (let i = 0 ; i < $scope.spec.LLMs.length ; i++) {
            $("#app_edit_llm").append("<option value='" + $scope.spec.LLMs[i].LLMkey + "'>" + $scope.spec.LLMs[i].modelName + "</option>");
        }

        setTimeout(function () {
            $("#app_edit_llm").select2({
                placeholder: "Select LLM",
                width: "100%"
            }).val("").trigger('change');
        }, 0);

        document.getElementById("app_edit_id").value = '';
        document.getElementById("app_edit_name").value = '';
        document.getElementById("app_edit_requirement").value = '';
        $("#appLink").val("");
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
            fqn: "ask" + Agent.name,
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
                }
            },
            "required": ["prompt"]
        });

        const toolDescription = "This tool enables Agent `" + Agent1.name + "` to leverage the capabilities of Agent `" + Agent2.name + "`.\n" +
            "Role description of the serving agent:\n" +
            $scope.decodeBase64(Agent2.roleDescription);

        const newTool = {
            inputJSONSchema: $scope.encodeBase64(schema),
            fqn: "ask" + Agent2.name,
            identifier: Agent1.identifier,
            functionDescription: $scope.encodeBase64(toolDescription),
            editing: true,
            functionDescriptionDecoded: toolDescription,
            inputJSONSchemaDecoded: schema,
            staticJsonPayload: $scope.encodeBase64(payload)
        };

        SYNCLOOP_AI.TOOLS.upsertTool(
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
        );


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

        const fqn = "ask" + Agent2.name;

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

        SYNCLOOP_AI.APPS.updateApp(app.appId, $('#inputshowd').val()
            , $scope.decodeBase64(app.description), app.LLMkey, app.appLink,
            app.identifier, app.terminationAgent.identifier,
            function (response) {

                for (let i = 0; i < $scope.spec.Apps.length; i++) {
                    if (appIdField == $scope.spec.Apps[i].appId) {
                        $scope.spec.Apps[i].appName = $('#inputshowd').val();

                        $scope.spec.Apps[i].terminationAgent.name = $('#inputshowd').val() + " Termination Agent";
                        $scope.spec.Apps[i].terminationAgent.title = $('#inputshowd').val();
                        $scope.spec.Apps[i].reportingAgent.name = $('#inputshowd').val() + " Reporting Agent";
                        $scope.spec.Apps[i].reportingAgent.title = $('#inputshowd').val();

                        for (let j = 0; j < $scope.spec.Agents.length; j++) {
                            if (appIdField == $scope.spec.Agents[j].identifier) {
                                $scope.spec.Agents[j].name = $('#inputshowd').val() + " Agent";
                                $scope.spec.Agents[j].title = $('#inputshowd').val();

                                SYNCLOOP_AI.AGENTS.upsertAgent(appIdField,
                                    $('#inputshowd').val(), $scope.spec.Agents[j].name, "", app.LLMkey,
                                    function (response){} , function() {}
                                );

                            }

                            if ($scope.spec.Apps[i].terminationAgent.identifier == $scope.spec.Agents[j].identifier) {
                                $scope.spec.Agents[j].name = $('#inputshowd').val() + " Termination Agent";
                                $scope.spec.Agents[j].title = $('#inputshowd').val();

                                SYNCLOOP_AI.AGENTS.upsertAgent($scope.spec.Apps[i].terminationAgent.identifier,
                                    $('#inputshowd').val(), $scope.spec.Agents[j].name, terminationAgentDescription, app.LLMkey,
                                    function (response){} , function() {}
                                );
                            }

                            if ($scope.spec.Apps[i].reportingAgent.identifier == $scope.spec.Agents[j].identifier) {
                                $scope.spec.Agents[j].name = $('#inputshowd').val() + " Reporting Agent";
                                $scope.spec.Agents[j].title = $('#inputshowd').val();

                                SYNCLOOP_AI.AGENTS.upsertAgent($scope.spec.Apps[i].reportingAgent.identifier,
                                    $('#inputshowd').val(), $scope.spec.Agents[j].name, "", app.LLMkey,
                                    function (response){} , function() {}
                                );
                            }
                        }

                        break;
                    }
                }

                $scope.$applyAsync();
            },
            function () {
                $scope.$applyAsync();
            });
    }

    $scope.completeAddApp = function () {
        $scope.saveInProgress = true;
        document.body.classList.remove("bodyscroll-fixed");


        setTimeout(() => {
            var appName = $("#app_edit_name").val().trim();
            var appDescription = $("#app_edit_requirement").val().trim();
            var appLLM = $("#app_edit_llm").val();

            if (appName === "") {
                swal({
                    title: "Missing Name",
                    text: "Please enter a Name for the App.",
                    type: "error",
                    confirmButtonColor: "#f2533e"  // your desired button color
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

            if ("" != $("#appLink").val().trim() && !$scope.isValidUrl($("#appLink").val())) {
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

                $scope.saveInProgress = false; $scope.$applyAsync();
                return;
            }

            if (!appLLM) {
                swal({
                    title: "Missing LLM",
                    text: "Please select an LLM from the dropdown.",
                    type: "error",
                    confirmButtonColor: "#f2533e"
                });

                $scope.saveInProgress = false; $scope.$applyAsync();
                return;
            }


            const appIdField = $("#app_edit_id").val().trim();

            var terminationAgentDescription = "You must ensure to achieved the following goal:\n" +
                "#{prompt}" +
                "!Important: You must reply with keyword \"SUBMIT-RESPONSE\" once the goal has achieved.\n" +
                "It will stop the work and send the final reply to the user. Response from previous agent mentioned below \n" +
                "#{response}";

            if (appIdField === "") {
                const uuid = generateUUID();

                var newApp = {
                    inputJSONSchema: "",
                    appName: appName,
                    appLink: $("#appLink").val(),
                    LLMkey: appLLM,
                    description: $scope.encodeBase64(appDescription),
                    terminationAgent: {
                        LLMkey: appLLM,
                        identifier: generateUUID(),
                        name: appName + " Termination Agent",
                        appId: uuid,
                        tn: "",
                        title: appName,
                        roleDescription: $scope.encodeBase64(terminationAgentDescription),
                        editing: false,
                        expanded: false,
                        roleDescriptionDecoded: terminationAgentDescription
                    },
                    reportingAgent: {
                        LLMkey: appLLM,
                        identifier: generateUUID(),
                        name: appName + " Reporting Agent",
                        appId: uuid,
                        tn: "",
                        title: appName,
                        roleDescription: $scope.encodeBase64(""),
                        editing: false,
                        expanded: false,
                        roleDescriptionDecoded: ""
                    },
                    appId: uuid,
                    editing: false
                };

                SYNCLOOP_AI.APPS.addApp(uuid, appName, appDescription, appLLM, $("#appLink").val(),
                    newApp.reportingAgent.identifier, newApp.terminationAgent.identifier,
                    function (response) {
                        $scope.spec.Apps.push(newApp);

                        SYNCLOOP_AI.AGENTS.upsertAgent(newApp.terminationAgent.identifier, newApp.terminationAgent.title,
                            newApp.terminationAgent.name, newApp.terminationAgent.roleDescriptionDecoded,
                            appLLM,
                            function (response) {

                                $scope.spec.Agents.push(newApp.terminationAgent);

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

                        SYNCLOOP_AI.AGENTS.upsertAgent(newApp.reportingAgent.identifier, newApp.reportingAgent.title,
                            newApp.reportingAgent.name, newApp.reportingAgent.roleDescriptionDecoded,
                            appLLM,
                            function (response) {

                                $scope.spec.Agents.push(newApp.reportingAgent);

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

                        const tool = {
                            inputJSONSchema: $scope.encodeBase64(""),
                            fqn: "packages.Awareness.assistant.tools.currentTime",
                            functionDescription: $scope.encodeBase64(""),
                            editing: true,
                            functionDescriptionDecoded: "",
                            inputJSONSchemaDecoded: "",
                            staticJsonPayload: $scope.encodeBase64("")
                        };

                        /*SYNCLOOP_AI.TOOLS.upsertTool(
                            newApp.terminationAgent.identifier, // was previously agentID, should be identifier
                            tool.fqn,
                            "",
                            "",
                            "",
                            function () {
                                $scope.spec.Tools.push({ ...tool, identifier: newApp.terminationAgent.identifier });
                                $scope.$applyAsync();
                            },
                            function (xhr, status, error) {
                                console.error("Tool upsert failed for:", tool.fqn, error);
                            }
                        );*/

                        /*SYNCLOOP_AI.TOOLS.upsertTool(
                            newApp.reportingAgent.identifier, // was previously agentID, should be identifier
                            tool.fqn,
                            "",
                            "",
                            "",
                            function () {
                                $scope.spec.Tools.push({ ...tool, identifier: newApp.reportingAgent.identifier });
                                $scope.$applyAsync();
                            },
                            function (xhr, status, error) {
                                console.error("Tool upsert failed for:", tool.fqn, error);
                            }
                        );*/

                        SYNCLOOP_AI.AGENTS.upsertAgent(uuid, appName,
                            appName + " Agent", appDescription, appLLM,
                            function (response) {

                                $scope.spec.Agents.push({
                                    LLMkey: appLLM,
                                    identifier: uuid,
                                    name: appName + " Agent",
                                    appId: uuid,
                                    tn: "",
                                    title: appName,
                                    roleDescription: $scope.encodeBase64(appDescription),
                                    editing: false,
                                    expanded: false,
                                    roleDescriptionDecoded: appDescription
                                });

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

                        $scope.saveInProgress = false;
                        document.getElementById("overlayApp").classList.remove("open");
                        document.getElementById("bgOverlayApp").classList.remove("active");
                        $scope.$applyAsync();
                    },
                    function () {
                        swal({
                            title: "Error",
                            text: "Failed to create app. Please try again.",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });

                        $scope.saveInProgress = false;
                        $scope.$applyAsync();
                    });

            } else {
                let updated = false;

                for (let i = 0; i < $scope.spec.Apps.length; i++) {
                    if (appIdField == $scope.spec.Apps[i].appId) {
                        const appId = $scope.spec.Apps[i].appId;
                        $scope.spec.Apps[i].appName = appName;
                        $scope.spec.Apps[i].description = $scope.encodeBase64(appDescription);
                        $scope.spec.Apps[i].terminationAgent.LLMkey = appLLM;
                        $scope.spec.Apps[i].terminationAgent.name = appName + " Termination Agent";
                        $scope.spec.Apps[i].terminationAgent.title = appName;
                        $scope.spec.Apps[i].reportingAgent.LLMkey = appLLM;
                        $scope.spec.Apps[i].reportingAgent.name = appName + " Reporting Agent";
                        $scope.spec.Apps[i].reportingAgent.title = appName;
                        $scope.spec.Apps[i].appLink = $("#appLink").val();
                        $scope.spec.Apps[i].LLMkey = appLLM;

                        for (let j = 0; j < $scope.spec.Agents.length; j++) {
                            if (appIdField == $scope.spec.Agents[j].identifier) {
                                $scope.spec.Agents[j].name = appName + " Agent";
                                $scope.spec.Agents[j].title = appName;
                                $scope.spec.Agents[j].appId = appId;
                                $scope.spec.Agents[j].LLMkey = appLLM;
                                $scope.spec.Agents[j].roleDescription = $scope.encodeBase64(appDescription);
                                $scope.spec.Agents[j].roleDescriptionDecoded = appDescription;

                                SYNCLOOP_AI.AGENTS.upsertAgent(appIdField,
                                    appName, $scope.spec.Agents[j].name, "", appLLM
                                );

                            }

                            if ($scope.spec.Apps[i].terminationAgent.identifier == $scope.spec.Agents[j].identifier) {
                                $scope.spec.Agents[j].name = appName + " Termination Agent";
                                $scope.spec.Agents[j].title = appName;

                                SYNCLOOP_AI.AGENTS.upsertAgent($scope.spec.Apps[i].terminationAgent.identifier,
                                    appName, $scope.spec.Agents[j].name, terminationAgentDescription, appLLM
                                );
                            }

                            if ($scope.spec.Apps[i].reportingAgent.identifier == $scope.spec.Agents[j].identifier) {
                                $scope.spec.Agents[j].name = appName + " Reporting Agent";
                                $scope.spec.Agents[j].title = appName;

                                SYNCLOOP_AI.AGENTS.upsertAgent($scope.spec.Apps[i].reportingAgent.identifier,
                                    appName, $scope.spec.Agents[j].name, "", appLLM
                                );
                            }
                        }

                        SYNCLOOP_AI.APPS.updateApp(appId, appName, appDescription, appLLM, $("#appLink").val(),
                            $scope.spec.Apps[i].reportingAgent.identifier,
                            $scope.spec.Apps[i].terminationAgent.identifier,
                            function () {

                                $scope.reloadTree();

                                $scope.saveInProgress = false;
                                document.getElementById("overlayApp").classList.remove("open");
                                document.getElementById("bgOverlayApp").classList.remove("active");
                                $scope.$applyAsync();
                            },
                            function () {
                                swal({
                                    title: "Error",
                                    text: "Failed to update app. Please try again.",
                                    type: "error",
                                    confirmButtonColor: "#f2533e"
                                });

                                $scope.saveInProgress = false;
                                $scope.$applyAsync();
                            });
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

    $scope.getAppAgents = function() {
        const agents = [];

        const teams = $scope.getAppTeams();

        for (let i = 0 ; i < teams.length ; i++) {
            if (teams[i].appId === $scope.appId) {
                for (let j = 0 ; j < teams[i].Agents.length ; j++) {
                    for (let k = 0 ; k < $scope.spec.Agents.length ; k++) {
                        if (teams[i].Agents[j].identifier == $scope.spec.Agents[k].identifier) {
                            agents.push($scope.spec.Agents[k]);
                        }
                    }
                }
            }
        }

        return agents;
    }

    $scope.getAppTools = function() {
        const tools = [];

        const teams = $scope.getAppTeams();

        for (let i = 0 ; i < teams.length ; i++) {
            if (teams[i].appId === $scope.appId) {
                for (let j = 0 ; j < teams[i].Agents.length ; j++) {
                    for (let k = 0 ; k < $scope.spec.Tools.length ; k++) {
                        if (teams[i].Agents[j].identifier === $scope.spec.Tools[k].identifier) {
                            tools.push($scope.spec.Tools[k]);
                        }
                    }
                }
            }
        }

        return tools;
    }

    $timeout(function () {

        const trigger = document.getElementById("robotTrigger");
        const dropdown = document.getElementById("robotDropdown");

        if (trigger && dropdown) {
            trigger.addEventListener("click", function (e) {
                e.stopPropagation();
                dropdown.classList.toggle("show");
            });

            document.addEventListener("click", function (e) {
                if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
                    dropdown.classList.remove("show");
                }
            });
        }

        const triggerfirst = document.getElementById("robotTriggerfirst");
        const dropdownfirst = document.getElementById("chatagentDropdown");

        if (triggerfirst && dropdownfirst) {
            triggerfirst.addEventListener("click", function (e) {
                e.stopPropagation();
                dropdownfirst.classList.toggle("show");
            });

            document.addEventListener("click", function (e) {
                if (!dropdownfirst.contains(e.target) && !triggerfirst.contains(e.target)) {
                    dropdownfirst.classList.remove("show");
                }
            });

            dropdownfirst.addEventListener("click", function (e) {
                if (e.target.closest(".icon-box")) {
                    dropdownfirst.classList.remove("show");
                }
            });
        }

    }, 0, false);


    $scope.isThinkingOpen = false;
    $scope.toggleThinking = function () {
        $scope.isThinkingOpen = !$scope.isThinkingOpen;
    };


    const shareDropdown = document.getElementById('shareagent_box');

    if (shareDropdown) {

        document.addEventListener('click', function(e) {
            if (!shareDropdown.contains(e.target)) {
                shareDropdown.classList.remove('show');
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                shareDropdown.classList.remove('show');
            }
        });

    }


// plus icon show on collapse agent page
    $('.my-custom-collapse').on('show.bs.collapse', function () {
        $(this).prev('.card-header').find('.plusIcon').removeClass('d-none');
        var scope = angular.element($('#chat_settingbox')).scope();
        scope.$apply(function() {
            scope.showsettingBox = false;
        });
    });

    $('.my-custom-collapse').on('hide.bs.collapse', function () {
        $(this).prev('.card-header').find('.plusIcon').addClass('d-none');

        var scope = angular.element($('#collapsetools')).scope();
        scope.$apply(function() {
            scope.showaddmodaltoolBox = false;
            scope.showaddmodalpayloadbox = false;
            scope.showaddmodalschemabox = false;
        });

        scope = angular.element($('#collapsellm')).scope();
        scope.$apply(function() {
            scope.showaddmodalllmBox = false;
        });
    });


    const btn = document.getElementById('moreBtn');
    const box = document.getElementById('moreBox');

    if (btn && box) {

        btn.addEventListener('click', function(e){
            e.stopPropagation();
            box.classList.toggle('is-open');
        });

        document.addEventListener('click', function(e){
            if (!box.contains(e.target) && !btn.contains(e.target)) {
                box.classList.remove('is-open');
            }
        });

        document.addEventListener('keydown', function(e){
            if (e.key === 'Escape') box.classList.remove('is-open');
        });

    }


    $('#collapserag').on('show.bs.collapse', function (e) {
        if (e.target.id === 'collapserag') {
            $(this).prev('.card-header').find('.plusIcon').removeClass('d-none');

            var scope = angular.element($('#chat_settingbox')).scope();
            scope.$apply(function() {
                scope.showsettingBox = false;
            });
        }
    });


    $('#collapserag').on('hide.bs.collapse', function (e) {
        if (e.target.id === 'collapserag') {
            $(this).prev('.card-header').find('.plusIcon').addClass('d-none');

            var scope = angular.element($('#collapserag')).scope();
            scope.$apply(function() {
                scope.showaddmodalragbaseBox = false;
            });
        }
    });

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


    $scope.clearSearch = function () { $scope.searchText.agents = ''; };
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
        tool.functionDescriptionDecoded = $scope.decodeBase64(tool.functionDescription);
        tool.inputJSONSchemaDecoded = $scope.decodeBase64(tool.inputJSONSchema);
    };
    $scope.doneEditTool = function(tool) {
        tool.functionDescription = $scope.encodeBase64(tool.functionDescriptionDecoded || "");
        tool.inputJSONSchema = $scope.encodeBase64(tool.inputJSONSchemaDecoded || "");
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
            imageUrl: "images/delete_exclamation.svg",
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
                    icon: "success",
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
        $scope.$applyAsync();
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
        'studio', 'apps', 'teams', 'agents', 'tools', 'llms', 'kbs', 'rags'
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
            $scope.searchText[newTab] = '';
            $timeout(function () {
                $scope.$applyAsync();
                if (newTab === 'agents') {
                    $scope.refreshBadges();
                }
            }, 0);
        }
    });

    $scope.copyTeamCurl = function($event) {
        navigator.clipboard.writeText($($event.target).next().html()).then(function() {
            console.log("Copied to clipboard!");
        }).catch(function(err) {
            console.error("Failed to copy: ", err);
        });
    }

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
        $("#teams_edit_requirement").val($scope.decodeBase64(team.requirement));

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

            if (!appId || appId === "") {
                // Optional validation for appId
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
                                confirmButtonColor: "#f2533e"  // Customize as needed
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

            if (teamIdField === "") {
                // Add new team
                const newTeamId = generateUUID();
                const newTeam = {
                    teamName: teamName,
                    teamID: newTeamId,
                    requirement: $scope.encodeBase64(teamRequirement),
                    appId: appId,
                    editing: false,
                    expanded: false,
                    managerId: manager,
                    Agents: [],
                    roleDescriptionDecoded: teamRequirement
                };

                agents.forEach(agent => {
                    newTeam.Agents.push({ identifier: agent, name: "TT" });
                    $scope.addAgentToolBetweenAgents(manager, agent);
                });

                SYNCLOOP_AI.TEAMS.addTeam(newTeamId, teamName, teamRequirement, appId, manager, agents,
                    function () {
                        $scope.spec.Teams.push(newTeam);
                        $scope.spec.Agents.forEach(a => {
                            if (agents.includes(a.identifier)) {
                                a.teamID = newTeamId;
                            }
                        });
                        $scope.saveInProgress = false;
                        document.getElementById("overlay-team").classList.remove("open");
                        document.getElementById("bgOverlayTeam").classList.remove("active");
                        $scope.$applyAsync();
                    },
                    function (xhr, status, error) {
                        swal({
                            title: "Error",
                            text: "Failed to add team. Please try again.",
                            icon: "error",
                            confirmButtonColor: "#f2533e"
                        });
                        $scope.saveInProgress = false;
                        $scope.$applyAsync();
                    }
                );
            } else {
                // Update existing team
                SYNCLOOP_AI.TEAMS.updateTeam(teamIdField, teamName, teamRequirement, appId, manager, agents,
                    function () {
                        for (let i = 0; i < $scope.spec.Teams.length; i++) {
                            if (teamIdField == $scope.spec.Teams[i].teamID) {
                                const team = $scope.spec.Teams[i];

                                team.Agents.forEach(agent => {
                                    $scope.deleteAgentToolBetweenAgents(team.managerId, agent.identifier);
                                });

                                team.teamName = teamName;
                                team.appId = appId;
                                team.managerId = manager;
                                team.requirement = $scope.encodeBase64(teamRequirement);
                                team.roleDescriptionDecoded = teamRequirement;
                                team.Agents = [];

                                agents.forEach(agentId => {
                                    team.Agents.push({ identifier: agentId, name: "TT" });
                                    $scope.addAgentToolBetweenAgents(manager, agentId);
                                });

                                $scope.spec.Agents.forEach(a => {
                                    if (agents.includes(a.identifier)) {
                                        a.teamID = team.teamID;
                                    }
                                });

                                $scope.saveInProgress = false;
                                document.getElementById("overlay-team").classList.remove("open");
                                document.getElementById("bgOverlayTeam").classList.remove("active");
                                $scope.$applyAsync();
                                break;
                            }
                        }
                        $scope.reloadTree();
                    },
                    function () {
                        swal({
                            title: "Error",
                            text: "Failed to update team. Please try again.",
                            type: "error",
                            confirmButtonColor: "#f2533e"
                        });
                        $scope.saveInProgress = false;
                        $scope.$applyAsync();
                    }
                );
            }

            $scope.editingTeamId = null;
        }, 0);
    };

    $scope.deleteAITeam = function(team) {
        swal({
                title: "Are you sure?",
                text: "Once you click 'Yes'. The '" + team.teamName + "' will be permanently deleted and cannot be recovered",
                imageUrl: "images/delete_exclamation.svg",
                showCancelButton: true,
                confirmButtonColor: '#f2533e',
                confirmButtonText: 'Yes, delete it!',
                closeOnConfirm: true,
                //closeOnCancel: false
            },
            function() {
                // swal("Deleted!", "Team has been deleted!", "success");

                swal({
                    title: "Deleting...",
                    text: "Please wait while we delete this team.",
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });

                SYNCLOOP_AI.TEAMS.deleteTeam(team.teamID, function () {

                    var index = $scope.spec.Teams.indexOf(team);

                    for (let k = 0; k < $scope.spec.Teams[index].Agents.length; k++) {
                        $scope.deleteAgentToolBetweenAgents($scope.spec.Teams[index].managerId, $scope.spec.Teams[index].Agents[k].identifier);
                    }

                    $scope.spec.Teams.splice(index, 1);
                    $scope.$applyAsync();
                    swal({
                        title: "Deleted!",
                        text: "Team has been deleted!",
                        icon: "success",
                        confirmButtonColor: "#2C61F5"
                    });

                    $scope.reloadTree();

                }, function(xhr, status, error) {

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
                text: "Once you click 'Yes'. The '" + app.appName +"' App will be permanently deleted and cannot be recovered.",
                imageUrl: "images/delete_exclamation.svg",
                showCancelButton: true,
                confirmButtonColor: '#f2533e',
                confirmButtonText: 'Yes, delete it!',
                closeOnConfirm: true,
                //closeOnCancel: false
            },
            function() {

                swal({
                    title: "Deleting...",
                    text: "Please wait while we delete this app.",
                    icon: "info",
                    showConfirmButton: false, // confirm button is hidden
                    confirmButtonColor: "#f2533e", // won't be visible unless showConfirmButton is true
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });


                SYNCLOOP_AI.APPS.deleteApp(app.appId, function () {
                    var index = $scope.spec.Apps.indexOf(app);
                    $scope.spec.Apps.splice(index, 1);
                    $scope.$applyAsync();
                    swal({
                        title: "Deleted!",
                        text: "App has been deleted!",
                        type: "success",
                        confirmButtonColor: "#2C61F5"
                    });

                }, function(xhr, status, error) {

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

        var onError = function () {
            $scope.saveInProgress = false;
            $scope.$applyAsync();
            swal({
                title: "Error",
                text: "Failed to save RAG configuration",
                type: "error",
                confirmButtonColor: "#f2533e"
            });
        };

        var kbId = $scope.ragEdit && $scope.ragEdit.ragID;
        var fileNameOnly = '/uploads'+ RAG_UPLOAD_ROOT + '/' + ($scope.ragEdit && ($scope.ragEdit.ragID)) + '/' || '';

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
                function () {
                    Object.assign($scope.ragBeingEdited, $scope.ragEdit, {
                        fileName: fileNameOnly,
                        name: fileNameOnly,
                        path: fileNameOnly
                    });
                    onSuccess();
                },
                function(){ onError(); }
            );
        } else {
            SYNCLOOP_AI.RAG.upsertRAG(
                $scope.ragEdit.ragID,
                $scope.ragEdit.ESKey,
                fileNameOnly,
                $scope.ragEdit.filePattern,
                function () {
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
                function(){ onError(); }
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
        $scope.ragEdit.fileNames = [];
        $scope.ragEdit.filesDisplayFull = '';
        $scope.ragEdit.primaryFileName = '';
        var el = document.getElementById('ragDirPicker');
        if (el) el.value = '';
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

    $scope.clearRagPath = function () {
        $scope.ragEdit.path = "";
    };

    $scope.deleteRAG = function (rag) {
        swal({
            title: "Are you sure?",
            text: "Once you click 'Yes'. The RAG will be permanently deleted and cannot be recovered",
            imageUrl: "images/delete_exclamation.svg",
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
            imageUrl: "images/delete_exclamation.svg",
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
            // headers: { "Authorization": `Bearer ${localStorage.getItem("AuthToken")}` },
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

            for (let i = 0 ; i < $scope.spec.Apps.length ; i++) {
                if ($scope.appId == $scope.spec.Apps[i].appId) {
                    App = $scope.spec.Apps[i];
                }
            }

            $scope.openAppChat(App);
            $scope.appChatModalVisible = true; // ensure visible
            $("#chatboxsecond").css("display", "block");
            $scope.$applyAsync();

            $("#chat-circle").show('scale');
            $(".chat-box").show('scale');
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


    $scope.sendAppChatMessage = function() {
        /*setTimeout(function () {
            var textarea = document.querySelector('.chat-input textarea.form-control');
            if (textarea) {
                textarea.classList.remove('chat-expanded');
                textarea.style.height = "80px";
            }
        }, 0);*/

        if (!$scope.newAppChatMessage || $scope.appChatWaitVisible) return;

        var userMessage = $scope.newAppChatMessage;
        const trustedHtml = $sce.trustAsHtml(userMessage.replace(/\n/g, '<br>'));
        $scope.chatHistory.push({ user: "User", text: trustedHtml });
       $scope.$applyAsync(function () {
            $scope.scrollToLastMessage();
        });
        $scope.newAppChatMessage = "";
        scrollAppChatToBottom();

        var payload = {prompt: userMessage };
        $scope.appChatWaitVisible = true; // Show thinking indicator

        $http.post(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.syncloopai.assistant.apps.executeApp.main?appId=" + $scope.appId, payload, { headers: { 'Content-Type': 'application/json' } })
            .then(function (response) {
                $scope.appChatWaitVisible = false;
                if (response.data && response.data.response) {
                    let resp = response.data.response;
                    try {
                        JSON.parse(response.data.response);
                    } catch (err) {

                    }
                    $scope.chatHistory.push({
                        user: "Agent",
                        text: $sce.trustAsHtml(showdownConverter.makeHtml(
                            (null == resp.error) ? resp : resp.error.message
                        ))
                    });
                    scrollAppChatToBottom(); // Scroll after adding agent response
                   $scope.$applyAsync(function () {
                        $scope.scrollToLastMessage();
                    });
                } else {
                    $scope.showNotification('error', "Received an unexpected response from the chat API.");
                }
            }, function (error) {
                $scope.appChatWaitVisible = false;
                $scope.showNotification('error', "Failed to send chat message: " + (error.data?.error || error.statusText));
                // Optionally add an error message to the chat history
                $scope.chatHistory.push({ user: "System", text: "Error sending message."});
               $scope.$applyAsync(function () {
                    $scope.scrollToLastMessage();
                });
                scrollAppChatToBottom();
            });
    }

    $scope.startNewChat = function() {
        $scope.chatHistory = [];
        $scope.conversationID = null;
        $scope.$applyAsync();
    }

    $scope.downloadChatHistory = function(conversation) {
        SYNCLOOP_AI.CONVERSATIONS.downloadChatHistory(conversation.agentId, conversation.identifier);
    }


    $scope.isCurrentConversation = function (conversation) {
        if ( null == $scope.currentConversation) {
            return false;
        }

        return $scope.currentConversation.identifier == conversation.identifier;
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
        $scope.currentChatAgent = agent;
        $scope.welcomeText = "Hi! I'm " + (agent.name || "your assistant") +
            ". What would you like to learn today?";
        $scope.welcomeSafeHtml = $sce.trustAsHtml($scope.welcomeText);
        $scope.chatModalVisible = true;
        $scope.chatHistory = [];
        $scope.newChatMessage = "";
        $scope.chatHistoryLoading = true;
        $scope.chatWaitVisible = false;

        let historyUrl = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/chatHistory?agentID=" + agent.identifier;
        if ($scope.currentChatAgent.type === 'TEAM') {
            historyUrl = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + '/chatHistory?teamId=' + agent.teamId;
        }

        $http.get(historyUrl)
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
       $scope.$applyAsync(function () {
            $scope.scrollToLastMessage();
        });

        $scope.newChatMessage = "";
        scrollChatToBottom(); // Scroll after adding user message

        var payload = { agentID: $scope.currentChatAgent.identifier, prompt: userMessage, chatID: $scope.conversationID};
        $scope.chatWaitVisible = true; // Show thinking indicator

        let chatURL = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.Awareness.assistant.api.chat.main";
        if ($scope.currentChatAgent.type === 'TEAM') {
            chatURL = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/team/chat";
            payload = { teamId: $scope.currentChatAgent.teamId,
                prompt: userMessage,
                chatID: $scope.conversationID
            };
        }

        if ($scope.chatHistory.length < 2) {
            payload['chatTitle'] = userMessage.trim().length < 4 ? "New Chat": userMessage;
        }

        $http.post(chatURL, payload, { headers: { 'Content-Type': 'application/json' } })
            .then(function (response) {
                $scope.chatWaitVisible = false;
                if (response.data && response.data.resp) {
                    $scope.conversationID=response.data.conversationChatID;

                    if ($scope.chatHistory.length < 2) {
                        $scope.loadConversations();
                    }

                    $scope.chatHistory.push({
                        user: "Agent",
                        text: $sce.trustAsHtml(showdownConverter.makeHtml(response.data.resp))
                    });
                   $scope.$applyAsync(function () {
                        $scope.scrollToLastMessage();
                    });
                    scrollChatToBottom(); // Scroll after adding agent response
                } else {
                    $scope.showNotification('error', "Received an unexpected response from the chat API.");
                }
            }, function (error) {
                $scope.chatWaitVisible = false;
                $scope.showNotification('error', "Failed to send chat message: " + (error.data?.error || error.statusText));
                // Optionally add an error message to the chat history
                $scope.chatHistory.push({ user: "System", text: $sce.trustAsHtml("Error sending message.") });
               $scope.$applyAsync(function () {
                    $scope.scrollToLastMessage();
                });
                scrollChatToBottom();
            });
    };

    // KB Search Test functions
    $scope.openKBSearchTest = function(kb) {
        $scope.currentKB = kb;
        $scope.kbSearchModalVisible = true;
        $scope.kbSearchText = "";
        $scope.kbSearchResults = {};
    };

    $scope.closeKBSearchTest = function() {
        $scope.kbSearchModalVisible = false;
        $scope.currentKB = null;
        $scope.kbSearchText = "";
        $scope.kbSearchResults = {};
    };

    $scope.sendKBSearchRequest = function() {
        if (!$scope.kbSearchText) return;
        $scope.kbSearchWaitVisible = true;
        var url = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.Awareness.assistant.api.searchKnowledgeBase.main?ragID=" + $scope.currentKB.ragID +
            "&searchText=" + encodeURIComponent($scope.kbSearchText) +
            "&enableQueryExpander=" + ($scope.enableQueryExpander ? "true" : "false");
        $http.get(url)
            .then(function(response) {
                $scope.kbSearchWaitVisible = false;
                $scope.kbSearchResults = response.data.result;
            }, function(error) {
                $scope.kbSearchWaitVisible = false;
                swal({
                    title: "Search Failed",
                    text: "Failed to perform search. Error: " + error.statusText,
                    type: "error",
                    confirmButtonColor: "#f2533e" // Optional: red shade for errors
                });

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
        $http.post(window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.Awareness.dashboard.services.api.importAll.main", JSON.stringify($scope.spec), {
            headers: {
                'Content-Type': 'application/json'
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
            return $scope.spec.Agents;
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

    $scope.loadApps = function() {
        $scope.inProgressApps = true;
        SYNCLOOP_AI.APPS.findAllApps(function (response) {
            $scope.inProgressApps = false;
            $scope.spec.Apps = [];
            for (let i = 0 ; i < response.Apps.length ; i++) {
                $scope.spec.Apps.push({
                    inputJSONSchema: "",
                    LLMkey: response.Apps[i].LLM_KEY,
                    appName: response.Apps[i].NAME,
                    appLink: response.Apps[i].APP_LINK,
                    description: $scope.encodeBase64(response.Apps[i].DESCRIPTION),
                    terminationAgent: {
                        identifier: response.Apps[i].TERMINATION_AGENT_ID
                    },
                    reportingAgent: {
                        identifier: response.Apps[i].REPORT_AGENT_ID
                    },
                    appId: response.Apps[i].APP_ID,
                    editing: false
                });
            }
        }, function(xhr, status, error) {

        });
    }

    $scope.deleteConversation = function(conversation) {
        swal({
            title: "Are you sure?",
            text: "Once you click 'Yes' this Chat will be permanently deleted and cannot be recovered",
            imageUrl: "images/delete_exclamation.svg",
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


            SYNCLOOP_AI.CONVERSATIONS.delete(conversation.identifier, function (response) {
                const index = $scope.TeamsConversations.indexOf(conversation);
                if (index > -1) {
                    $scope.TeamsConversations.splice(index, 1);
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



    $scope.clearChatHistory = function() {
        swal({
            title: "Are you sure?",
            text: "You will not be able to recover all chat histories!",
            imageUrl: "images/delete_exclamation.svg",
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

        for (let i = 0 ; i < $scope.Conversations.length ; i++) {
            if (agentId == $scope.Conversations[i].agentId) {
                $scope.TeamsConversations.push($scope.Conversations[i]);
            }
        }

        $scope.$applyAsync();
    }

    $scope.loadConversations = function() {

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

    $scope.loadChanges = function() {
        $scope.minisidebar_class = localStorage.getItem("minisidebar");
        if (null != $scope.minisidebar_class) {
            $scope.main_wrapper_view = 'fullleft-width';
        }

        $scope.agentsSubTab = $scope.agentsSubTab || 'all';

        $scope.isMyAgent = function (a) {
            if (!a) return false;

            var me = ($scope.currentUserId || '').toString().toLowerCase();

            return (a.ownerId && String(a.ownerId).toLowerCase() === me) ||
                (a.createdBy && String(a.createdBy).toLowerCase() === me) ||
                (typeof a.owner === 'string' && a.owner.toLowerCase() === 'me');
        };

        $scope.notMyAgent = function (a) {
            return !$scope.isMyAgent(a);
        };

        $scope.agentStatus = function (a) { return (a && a.active === false) ? 'Not working' : 'Active'; };




        //$scope.loadApps();

        $scope.loadConversations();

        $scope.inProgressVisible = true;

        function loadTeamsAsync () {
            $scope.isLoadingTeams = true;
            $scope.$applyAsync();

            return new Promise(function (resolve, reject) {
                SYNCLOOP_AI.TEAMS.findAllTeams(function (response){
                    try {
                        const list = (response && Array.isArray(response.Teams)) ? response.Teams : [];
                        const next = [];

                        for (let i = 0 ; i < list.length ; i++) {
                            const t = list[i] || {};
                            const agents = Array.isArray(t.Agents) ? t.Agents : [];

                            const team = {
                                teamName: t.NAME,
                                teamID: t.TEAM_ID,
                                managerId: t.MANAGER_ID,
                                requirement: $scope.encodeBase64 ? $scope.encodeBase64(t.REQUIREMENT) : '',
                                appId: t.APP_ID,
                                editing: false,
                                expanded: false,
                                Agents: [],
                                roleDescriptionDecoded: t.REQUIREMENT
                            };

                            for (let j = 0; j < agents.length; j++) {
                                const a = agents[j] || {};
                                team.Agents.push({ identifier: a.AGENT_ID, name: 'TT' });
                            }

                            next.push(team);
                        }

                        $scope.spec.Teams = next;
                        resolve();
                    } catch (e) {
                        reject(e);
                    } finally {
                        $scope.isLoadingTeams = false;
                        $scope.$applyAsync();
                    }
                }, function (xhr, status, error) {
                    try {
                        reject(error || status);
                    } finally {
                        $scope.isLoadingTeams = false;
                        $scope.$applyAsync();
                    }
                });
            });
        }

        const agentId = getQueryParam("agent_id");
        let serviceName = "_" + agentId.replaceAll("-", "_");

        const params = new URLSearchParams(window.location.search);
        const tenant = params.get("tenant");

        $http.post(window.ENV.API_BASE_URL + "/tenant/" + tenant + "/public/packages.ConsumerAgents.wrapper.api.agents." + serviceName + ".main/get_agent")
            .then(function (resp2) {
                $scope.spec.Agents = [resp2.data.Agent];
            })
            .catch(function (error2) {

            });



        /*loadTeamsAsync()
            .then(function () {
                return $http.get("/packages.Awareness.dashboard.services.api.exportAll.main");
            })
            .then(function (response) {

                if (response.data.status == "success") {
                    $scope.spec.LLMs  = response.data.spec.LLMs  || [];
                    $scope.spec.Agents= response.data.spec.Agents|| [];
                    $scope.spec.Tools = response.data.spec.Tools || [];
                    $scope.spec.RAGs  = response.data.spec.RAGs  || [];
                    $scope.spec.KBs   = response.data.spec.KBs   || [];

                    $scope.spec.LLMs.forEach(function(LLM){ LLM["$$hashKey"] = null; });

                    $scope.spec.KBs.forEach(function(KB){
                        if (KB.kbID != null) KB.ragID = KB.kbID;
                        if (KB.ragID == null) KB.ragID = generateUUID();
                    });
                    recomputeAgentTeamTags();
                } else {
                    swal({ title:"Response", text: response.data, type:"info", confirmButtonColor:"#2C61F5" });
                }
            })
            .catch(function (err) {
                $scope.isDataLoading = false;
                swal({ title:"Error", text:"Failed to load data: " + (err && err.statusText || err || 'Unknown'), type:"error", confirmButtonColor:"#f2533e" });
            })
            .finally(function () {
                $scope.isDataLoading = false;
            });*/

    };

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

    function routeAgentFromUrl(retry = 0) {
        const id = getQueryParam("agent_id");
        if (!id) {
            if ($scope.showAgentBox) $scope.closeAgentBox();
            return;
        }

        const list = ($scope.spec && $scope.spec.Agents) || [];
        const agent = list.find(a => a.identifier === id);

        $scope.openAgentBox(agent, false, { skipUrl: true });
        $scope.$applyAsync();
    }

    // Run once on load (so refresh opens the right agent)
    setTimeout(() => routeAgentFromUrl(), 0);

    window.addEventListener("popstate", () => {
        $scope.$evalAsync(routeAgentFromUrl);
    });

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

        return specCopy;
    }

    $scope.exportJSON = function () {
        let specToExport = cleanSpecForPersistence($scope.spec);
        try {
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(specToExport, null, 2));
            var downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `syncloop_ai_environment.json`);

            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            $scope.showNotification('success', 'Configuration exported successfully.');
        } catch (e) {
            $scope.showNotification('error', 'Failed to create export file: ' + e.message);
        }
    };

    $scope.exportAppBundle = function (app) {

        $scope.appId = app.appId;
        const relatedTeams = $scope.getAppTeams ? $scope.getAppTeams() : [];
        const relatedAgents = $scope.getAppAgents ? $scope.getAppAgents() : [];
        const relatedTools = $scope.getAppTools ? $scope.getAppTools() : [];

        const llmKeys = new Set();
        if (app.terminationAgent?.LLMkey) llmKeys.add(app.terminationAgent.LLMkey);
        if (app.reportingAgent?.LLMkey) llmKeys.add(app.reportingAgent.LLMkey);

        const relatedLLMs = $scope.spec.LLMs.filter(llm =>
            llmKeys.has(llm.LLMkey)
        );

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
        document.getElementById('jsonImport').click();
    };

    // Handle file content loaded via the fileReader directive.
    $scope.handleFile = function(fileContent) {
        try {
            var imported = JSON.parse(fileContent);
            mergeImportedSpec(imported);
            swal({
                title: "Success",
                text: "JSON imported and merged successfully.",
                type: "success",
                confirmButtonColor: "#2C61F5" // optional green color
            });

        } catch (err) {
            swal({
                title: "Error",
                text: "Failed to parse JSON: " + err,
                type: "error",
                confirmButtonColor: "#f2533e" // optional red color
            });

        }
    };

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

    $scope.safeApply = function(fn) {
        const phase = $scope.$root && $scope.$root.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (typeof fn === 'function') fn();
        } else {
            $scope.$apply(fn);
        }
    };

    $scope.saveAgentRAG = function () {
        $scope.saveInProgress = true;
         $scope.showaddmodalragbaseBox = false;

        var onSuccess = function () { $scope.saveInProgress = false; $scope.safeApply(); };
        var onError   = function () { $scope.saveInProgress = false; $scope.safeApply(); };

        var agentKey =
            ($scope.ragEdit && $scope.ragEdit.agentId) ||
            ($scope.ragEdit && $scope.ragEdit.ragID) ||
            ($scope.currentAgent && $scope.currentAgent.identifier);

        var fileNameOnly = '/uploads'+ RAG_UPLOAD_ROOT + '/' + ($scope.ragEdit && ($scope.ragEdit.ragID)) + '/' || '';

        if (!agentKey || !fileNameOnly) {
            $scope.saveInProgress = false;
            return $scope.$evalAsync(function () {
                swal({ title: "Error", text: "Agent and at least one file are required.", type: "error", confirmButtonColor: "#f2533e" });
            });
        }

        $scope.startSaving();

        SYNCLOOP_AI.RAG.upsertRAG(
            agentKey,
            generateUUID(),
            fileNameOnly,
            $scope.ragEdit.filePattern,
            function (response) {
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
                            ragID: agentKey,
                            fileName: fileNameOnly,
                            name: fileNameOnly,
                            path: fileNameOnly
                        },
                        $scope.ragEdit

                    );
                    $scope.spec.RAGs.push(saved);
                    $scope.finishSaving(2000);
                }
                onSuccess();
            },
            function () { onError();  $scope.resetSaveStatus();}
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


    $scope.onRAGActionClick = function () {
        var el = document.getElementById('ragFileInput');
        if (el) el.click();
    };

    var RAG_UPLOAD_ROOT = '/rags';
    $scope.resolveRAGFolderPath = function () {
        var agentKey = ($scope.ragEdit && $scope.ragEdit.agentId) || ($scope.currentAgent && $scope.currentAgent.identifier);
        if (agentKey) return RAG_UPLOAD_ROOT + '/' + agentKey;
        var kbKey = $scope.ragEdit && $scope.ragEdit.ragID;
        if (kbKey) return RAG_UPLOAD_ROOT + '/kb/' + kbKey;
        return null;
    };

    $scope.ragUploading = false;
    $scope.ragUploadProgress = 0;

    $scope.uploadRAGFile = function (file) {
        var folderPath = $scope.resolveRAGFolderPath();
        if (!folderPath) {
            return $scope.$evalAsync(function () {
                swal({ title:"Missing context", text:"Open from an Agent or KB before uploading.", type:"warning", confirmButtonColor:"#f2533e" });
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
        xhr.open('POST', '/packages.FileManager.dashboard.services.api.UploadFile.main?folderPath=' +
            encodeURIComponent(folderPath));
        xhr.onload = function () {
            $scope.ragUploading = false;
            var r = null; try { r = JSON.parse(xhr.responseText); } catch(e) {}
            if (!r || r.status !== 'success') {
                showRAGAlert('Upload failed' + (r && r.error ? ': ' + r.error : ''));
            }
            $scope.$applyAsync();
        };
        xhr.onerror = function () {
            $scope.ragUploading = false;
            showRAGAlert('Upload error'); $scope.$applyAsync();
        };
        xhr.send(fd);
    };

    function showRAGAlert(msg){
        try { swal({ title:'Alert', text:msg, type:'error', confirmButtonColor:'#f2533e' }); }
        catch(e){ console.error(msg); }
    }

    $(document).off('change.rag').on('change.rag', '#ragFileInput', function () {
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
    });

    $scope.selectAppDetailTab = function (app) {
        $scope.selectedApp = app;
        $scope.activeTab = 'app_detail';
        $scope.appId = app.appId;
        const timestamp = Date.now();
        const url = "/Awareness/tree-view.html?appId=" + app.appId + "&ts=" + timestamp;

        $scope.trustedUrl = $sce.trustAsResourceUrl(url);
        $scope.$applyAsync();
    }

    $scope.launchApp = function(app) {
        //$scope.isAppAvailable 	= true;
        //$scope.activeTab 		= 'teams';

        window.open($scope.getApp().appLink, '_blank');

        //$scope.triggerAppChat();
    }

    $scope.startAppChat = function(app) {
        $scope.isAppAvailable 	= true;
        //$scope.activeTab 		= 'teams';
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

    // Merge imported spec into the current spec based on unique keys.
    function mergeImportedSpec(importedSpec) {
        if (!importedSpec) return;

        (importedSpec.LLMs || []).forEach(llm => {
            const existing = $scope.spec.LLMs.find(x => x.LLMkey === llm.LLMkey);

            SYNCLOOP_AI.LLM.upsertLLM(
                llm.LLMkey,
                llm.name,
                llm.provider,
                llm.maxTokens,
                llm.baseUrl,
                llm.apiKey,
                llm.modelName,
                llm.temperature,
                llm.enableParallelToolCalling,
                function () {
                    if (!existing) $scope.spec.LLMs.push(llm);
                    else Object.assign(existing, llm);
                    $scope.$applyAsync();
                },
                function () {}
            );
        });

        (importedSpec.Agents || []).forEach(agent => {
            const existing = $scope.spec.Agents.find(x => x.identifier === agent.identifier);
            const decodedDesc = atob(agent.roleDescription || '');
            const llmKey = typeof agent.LLMkey === 'string' ? agent.LLMkey :
                (agent.LLMkey && agent.LLMkey.LLMkey) || '';

            SYNCLOOP_AI.AGENTS.upsertAgent(
                agent.identifier,
                agent.title,
                agent.name,
                decodedDesc,
                llmKey,
                function () {
                    if (!existing) $scope.spec.Agents.push(agent);
                    else Object.assign(existing, agent);
                    $scope.$applyAsync();
                },
                function () {}
            );
        });

        (importedSpec.Apps || []).forEach(app => {
            const description = atob(app.description || '');
            const llmKey =
                typeof app.reportingAgent?.LLMkey === 'string' ? app.reportingAgent.LLMkey :
                    typeof app.terminationAgent?.LLMkey === 'string' ? app.terminationAgent.LLMkey :
                        '';

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

            const onSuccess = () => {
                if (!existingApp) $scope.spec.Apps.push(app);
                else Object.assign(existingApp, app);
                $scope.$applyAsync();
            };

            if (existingApp) {
                SYNCLOOP_AI.APPS.updateApp(
                    ...Object.values(payload),
                    onSuccess,
                    function () {}
                );
            } else {
                SYNCLOOP_AI.APPS.addApp(
                    ...Object.values(payload),
                    onSuccess,
                    function () {}
                );
            }
        });

        (importedSpec.Teams || []).forEach(team => {
            const appId = team.app?.appId || team.appId || '';
            const existingTeam = $scope.spec.Teams.find(x => x.teamID === team.teamID);

            const payload = {
                teamID: team.teamID,
                name: team.teamName,
                managerId: team.managerId,
                requirement: $scope.decodeBase64(team.requirement),
                appId,
                agents: team.Agents.map(item => item.identifier)
            };

            const onSuccess = () => {
                if (!existingTeam) $scope.spec.Teams.push(team);
                else Object.assign(existingTeam, team);
                $scope.$applyAsync();

            };

            if (existingTeam) {
                SYNCLOOP_AI.TEAMS.updateTeam(
                    payload.teamID, payload.name, payload.requirement, payload.appId, payload.managerId, payload.agents,
                    onSuccess,
                    function (xhr, status, error) {
                        try {
                            if (xhr && xhr.success === true) {
                                onSuccess();
                                return;
                            }
                        } catch (e) {
                            console.error("Failed to update team:", team.teamName);
                        }
                    }
                );
            } else {
                SYNCLOOP_AI.TEAMS.addTeam(
                    payload.teamID, payload.name, payload.requirement, payload.appId, payload.managerId, payload.agents,
                    onSuccess,
                    function (xhr, status, error) {
                        try {
                            if (xhr && xhr.success === true) {
                                onSuccess();
                                return;
                            }
                        } catch (e) {
                            console.error("Failed to add team:", team.teamName);
                        }
                    }
                );
            }
        });

        function decodeBase64IfEncoded(str) {
            try {
                return atob(str || '');
            } catch (e) {
                return str;
            }
        }

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
                function () {
                    if (!existing) $scope.spec.Tools.push(tool);
                    else Object.assign(existing, tool);
                    $scope.$applyAsync();
                },
                function (xhr, status, error) {
                    console.error("Tool upsert failed for:", tool.fqn, error);
                }
            );
        });

        (importedSpec.KBs || []).forEach(kb => {
            const existing = $scope.spec.KBs.find(x => x.ragID === kb.ragID);
            SYNCLOOP_AI.KB.upsertKB(
                kb.ragID,
                kb.name,
                kb.description,
                function () {
                    if (!existing) $scope.spec.KBs.push(kb);
                    else Object.assign(existing, kb);
                    $scope.$applyAsync();
                },
                function () {}
            );
        });

        (importedSpec.RAGs || []).forEach(rag => {
            const existing = $scope.spec.RAGs.find(x => x.agentID === rag.agentID);
            SYNCLOOP_AI.RAG.upsertRAG(
                rag.ragID,
                rag.identifier,
                rag.path,
                rag.filePattern,
                function () {
                    if (!existing) $scope.spec.RAGs.push(rag);
                    else Object.assign(existing, rag);
                    $scope.$applyAsync();
                },
                function (xhr, status, error) {}
            );
        });
    }
    $scope.loadChanges();
}]);

let table = null;

function loadData() {
    let url = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant") + "/packages.middleware.pub.server.dashboard.api_page.getAPILogs.main";

    if (table != null) {
        table.destroy();
    }

    table = $("#aPiTable").DataTable({
        "serverSide": true,
        "ajax": {
            "url": url,
            "dataSrc": function (data) {
                return data.data ?? [];
            },
            "type": "GET"
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
    var tenantName = "";
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
        var coo = cookies[i].split("=");
        if (coo[0].trim() === "tenant") {
            tenantName = coo[1].replaceAll('"', "").split(" ")[0];
            break;
        }
    }




    document.querySelectorAll("pre.text_wrap").forEach(function(preElem) {
        var updatedCurl = preElem.textContent;
        updatedCurl = updatedCurl.replace(/{{currentHost}}/g, location.origin + "/tenant/" + tenantName);
        preElem.textContent = updatedCurl;
    });
}

updateAllCurlSnippets();

