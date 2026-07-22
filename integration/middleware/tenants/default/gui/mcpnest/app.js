(function () {
  'use strict';

  angular.module('mcpManagerApp', [])
    .filter('arrayJoin', function () {
      return function (input, separator) {
        if (!input) return '';
        if (!Array.isArray(input)) return String(input);
        return input.join(separator || ', ');
      };
    })
    .factory('oauthFlowService', ['$q', '$interval', '$timeout', '$window', 'api', function ($q, $interval, $timeout, $window, api) {
      function generateKey() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var out = '';
        for (var i = 0; i < 9; i++) {
          out += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return 'OTSU-' + out;
      }

      function readJsonSafe(value) {
        if (value == null) return null;
        if (typeof value === 'string') {
          var trimmed = value.replace(/^["']|["']$/g, '').trim();
          if (trimmed.charAt(0) === '{' || trimmed.charAt(0) === '[') {
            try { return JSON.parse(trimmed); } catch (e) { return trimmed; }
          }
          return trimmed;
        }
        if (typeof value === 'object' && 'data' in value) return value.data;
        return value;
      }

      function openPopup(finalUrl) {
        var win = $window.open(finalUrl, '_blank', 'width=700,height=600,scrollbars=yes,resizable=yes');
        try { $window.authWindow = win; } catch (e) { /* ignore */ }
        return win;
      }

      return {
        start: function (setup, options) {
          options = options || {};
          var mcp = options.mcp || null;
          var visibility = options.visibility || '';
          var uniqueName = setup && (setup.uniqueName || (setup.setup && setup.setup.uniqueName)) || '';
          var onEvent = options.onEvent || angular.noop;
          var pollInterval = options.pollInterval || 2000;
          var timeoutMs = options.timeoutMs || 5 * 60 * 1000;
          var knownTokenIds = options.knownTokenIds || null;
          var deferred = $q.defer();
          var pollHandle = null;
          var timeoutHandle = null;
          var finished = false;

          function cleanup() {
            if (finished) return;
            finished = true;
            if (pollHandle) { $interval.cancel(pollHandle); pollHandle = null; }
            if (timeoutHandle) { $timeout.cancel(timeoutHandle); timeoutHandle = null; }
          }

          function emit(event) {
            onEvent(event);
            if (event.type === 'success' || event.type === 'error' || event.type === 'timeout' || event.type === 'cancelled') {
              deferred.resolve(event);
            }
          }

          function findNewToken(tokens) {
            if (!Array.isArray(tokens)) return null;
            for (var i = 0; i < tokens.length; i++) {
              var t = tokens[i];
              if (!t || !t.tokenId) continue;
              if (knownTokenIds && Array.isArray(knownTokenIds) && knownTokenIds.indexOf(t.tokenId) !== -1) continue;
              if (mcp && mcp.mcpId && t.mcpId && t.mcpId !== mcp.mcpId) continue;
              return t;
            }
            return null;
          }

          function tryFetchNewToken() {
            if (finished) return;
            api('listOAuthTokens', { request: { uniqueName: uniqueName } }, { quietErrors: true }).then(function (resp) {
              if (finished) return;
              var tokens = readJsonSafe(resp) || [];
              var newToken = findNewToken(tokens);
              if (newToken) {
                cleanup();
                emit({ type: 'success', token: newToken, tokens: tokens });
              } else {
                emit({ type: 'polling', count: Array.isArray(tokens) ? tokens.length : 0 });
              }
            }).catch(function () {
              if (finished) return;
              emit({ type: 'polling-error' });
            });
          }

          if (!uniqueName) {
            emit({ type: 'error', message: 'Missing setup unique name.' });
            return deferred.promise;
          }

          emit({ type: 'starting' });

          api('getUserID', {}, { quietErrors: true }).then(function (userIdResp) {
            if (finished) return null;
            var userIdData = readJsonSafe(userIdResp) || {};
            var userId = (userIdData.userID || userIdData.userId || userIdData.user_id || '').toString();
            if (!userId) throw new Error('Could not retrieve current user ID.');
            var tokenKey = generateKey();
            return api('getOtsuToken', { userID: userId, token_key: tokenKey }, { quietErrors: true }).then(function (tokenResp) {
              if (finished) return null;
              var tokenValue = readJsonSafe(tokenResp) || '';
              if (tokenValue && typeof tokenValue === 'object' && tokenValue.token) tokenValue = tokenValue.token;
              var jwt = String(tokenValue || '').replace(/^["']|["']$/g, '').trim();
              if (!jwt) throw new Error('OTSU token was empty.');
              var state = 'access_token:' + jwt;
              var authorizePayload = { name: uniqueName, mcpId: mcp && mcp.mcpId || mcp || '', otsu: state };
              if (visibility) authorizePayload.visibility = visibility;
              return api('authorizeOAuth', authorizePayload).then(function (authResp) {
                if (finished) return null;
                var authResult = readJsonSafe(authResp) || {};
                var rawUrl = authResult.authorizeUrl;
                if (!rawUrl) throw new Error('Authorization response did not include authorizeUrl.');
                var separator = rawUrl.indexOf('?') >= 0 ? '&' : '?';
                var finalUrl = rawUrl + separator + 'otsu=' + encodeURIComponent(state);

                emit({ type: 'popup-opening', url: finalUrl });
                var popup = openPopup(finalUrl);
                if (!popup) {
                  emit({ type: 'popup-error', message: 'Popup was blocked. Please allow popups.' });
                } else {
                  emit({ type: 'popup-opened' });
                }

                var knownCount = 0;
                if (knownTokenIds && Array.isArray(knownTokenIds)) knownCount = knownTokenIds.length;
                api('listOAuthTokens', { request: { uniqueName: uniqueName } }, { quietErrors: true }).then(function (resp) {
                  if (finished) return;
                  var initialTokens = readJsonSafe(resp) || [];
                  if (Array.isArray(initialTokens)) knownCount = Math.max(knownCount, initialTokens.length);
                });

                pollHandle = $interval(function () {
                  if (finished) return;
                  if (popup && popup.closed) {
                    cleanup();
                    tryFetchNewToken();
                    return;
                  }
                  tryFetchNewToken();
                }, pollInterval);

                timeoutHandle = $timeout(function () {
                  if (finished) return;
                  cleanup();
                  emit({ type: 'timeout' });
                }, timeoutMs);

                deferred.promise.finally(function () {
                  cleanup();
                });
                return null;
              });
            });
          }).catch(function (error) {
            cleanup();
            emit({ type: 'error', message: (error && error.message) || 'OAuth flow failed.' });
          });

          return deferred.promise;
        },
        cancel: function () {
          cleanup();
        }
      };
    }])
    .directive('oauthFlowButton', ['oauthFlowService', '$parse', function (oauthFlowService, $parse) {
      return {
        restrict: 'E',
        scope: {
          setup: '=',
          mcp: '=?',
          visibility: '@',
          onComplete: '&'
        },
        template: [
          '<div class="oauth-flow-button">',
            '<button type="button" class="btn btn-primary oauth-flow-trigger" ng-click="startFlow()" ng-disabled="state.busy" ng-class="state.status">',
              '<i class="ph-bold ph-key" ng-if="!state.busy && state.status !== \'success\'"></i>',
              '<i class="ph-bold ph-check-circle" ng-if="state.status === \'success\'"></i>',
              '<i class="ph-bold ph-warning-circle" ng-if="state.status === \'error\'"></i>',
              '<span class="oauth-flow-trigger-label">{{ triggerLabel() }}</span>',
            '</button>',
            '<div class="oauth-flow-status" ng-class="state.status" ng-if="state.status && state.status !== \'idle\'">',
              '<div class="oauth-flow-status-head">',
                '<i class="ph-bold" ng-class="statusIcon()"></i>',
                '<strong>{{ statusTitle() }}</strong>',
                '<button type="button" class="oauth-flow-cancel" ng-if="state.busy" ng-click="cancelFlow()" title="Cancel" aria-label="Cancel"><i class="ph-bold ph-x"></i></button>',
              '</div>',
              '<p class="oauth-flow-status-msg" ng-if="state.message">{{ state.message }}</p>',
              '<div class="oauth-flow-token" ng-if="state.token">',
                '<div class="oauth-flow-token-row"><span>Token ID</span><div class="oauth-flow-token-value"><code title="{{ state.token.tokenId }}">{{ state.token.tokenId }}</code><button type="button" class="command-copy-icon" ng-click="copy(state.token.tokenId)" title="Copy token id" aria-label="Copy token id"><i class="ph-bold ph-copy"></i></button></div></div>',
                '<div class="oauth-flow-token-row"><span>Status</span><strong><span class="status-pill" ng-class="state.token.status === \'active\' ? \'on\' : \'off\'">{{ state.token.status || \'unknown\' }}</span></strong></div>',
                '<div class="oauth-flow-token-row"><span>Visibility</span><strong>{{ state.token.visibility || \'—\' }}</strong></div>',
                '<div class="oauth-flow-token-row"><span>User ID</span><div class="oauth-flow-token-value"><code title="{{ state.token.userId }}">{{ state.token.userId || \'—\' }}</code><button type="button" class="command-copy-icon" ng-click="copy(state.token.userId)" title="Copy user id" aria-label="Copy user id"><i class="ph-bold ph-copy"></i></button></div></div>',
                '<div class="oauth-flow-token-row"><span>MCP ID</span><div class="oauth-flow-token-value"><code title="{{ state.token.mcpId }}">{{ state.token.mcpId || \'—\' }}</code><button type="button" class="command-copy-icon" ng-click="copy(state.token.mcpId)" title="Copy mcpId" aria-label="Copy mcpId"><i class="ph-bold ph-copy"></i></button></div></div>',
                '<div class="oauth-flow-token-row"><span>Updated</span><strong>{{ state.token.updatedAt || state.token.createdAt || \'—\' }}</strong></div>',
              '</div>',
              '<pre class="oauth-flow-raw" ng-if="state.tokenRaw">{{ state.tokenRaw | json }}</pre>',
            '</div>',
          '</div>'
        ].join(''),
        link: function (scope, element) {
          scope.state = {
            status: 'idle',
            busy: false,
            message: '',
            token: null,
            tokenRaw: null
          };

          scope.triggerLabel = function () {
            if (scope.state.busy) return 'Authorizing…';
            if (scope.state.status === 'success') return 'Authorized';
            if (scope.state.status === 'error') return 'Failed — Retry';
            if (scope.state.status === 'timeout') return 'Timed out — Retry';
            return 'Authorize with OTSU';
          };

          scope.statusTitle = function () {
            if (scope.state.status === 'popup-opening' || scope.state.status === 'popup-opened' || scope.state.status === 'popup-error' || scope.state.status === 'polling' || scope.state.status === 'starting') return 'Authorization in progress';
            if (scope.state.status === 'success') return 'Token issued';
            if (scope.state.status === 'error') return 'Authorization failed';
            if (scope.state.status === 'timeout') return 'Authorization timed out';
            if (scope.state.status === 'cancelled') return 'Authorization cancelled';
            return 'Pending';
          };

          scope.statusIcon = function () {
            if (scope.state.status === 'success') return 'ph-check-circle';
            if (scope.state.status === 'error') return 'ph-warning-circle';
            if (scope.state.status === 'timeout') return 'ph-clock-clockwise';
            if (scope.state.status === 'cancelled') return 'ph-x-circle';
            return 'ph-spinner ph-spin';
          };

          scope.copy = function (text) {
            if (!text) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(text).catch(function () { /* ignore */ });
            }
          };

          scope.startFlow = function () {
            scope.state.status = 'starting';
            scope.state.busy = true;
            scope.state.message = 'Preparing OTSU authorization…';
            scope.state.token = null;
            scope.state.tokenRaw = null;
            oauthFlowService.start(scope.setup, {
              mcp: scope.mcp || null,
              visibility: scope.visibility || '',
              onEvent: function (event) {
                scope.$apply(function () {
                  scope.state.status = event.type;
                  if (event.type === 'starting') {
                    scope.state.message = 'Preparing OTSU authorization…';
                  } else if (event.type === 'popup-opening') {
                    scope.state.message = 'Opening headless authorization window…';
                  } else if (event.type === 'popup-opened') {
                    scope.state.message = 'Complete the authorization in the headless window, then close it when done.';
                  } else if (event.type === 'popup-error') {
                    scope.state.message = 'Popup was blocked. Please allow popups for this site, then retry.';
                  } else if (event.type === 'polling') {
                    scope.state.message = 'Detecting new token…';
                  } else if (event.type === 'polling-error') {
                    scope.state.message = 'Detecting new token… (retrying)';
                  } else if (event.type === 'success') {
                    scope.state.busy = false;
                    scope.state.message = 'Token successfully issued.';
                    scope.state.token = event.token;
                    scope.state.tokenRaw = event.token;
                    if (scope.onComplete) scope.onComplete({ token: event.token, tokens: event.tokens });
                  } else if (event.type === 'error') {
                    scope.state.busy = false;
                    scope.state.message = event.message || 'Authorization failed.';
                  } else if (event.type === 'timeout') {
                    scope.state.busy = false;
                    scope.state.message = 'Authorization timed out. Please try again.';
                  } else if (event.type === 'cancelled') {
                    scope.state.busy = false;
                    scope.state.message = 'Authorization cancelled.';
                  }
                });
              }
            });
          };

          scope.cancelFlow = function () {
            oauthFlowService.cancel();
            scope.$apply(function () {
              scope.state.status = 'cancelled';
              scope.state.busy = false;
              scope.state.message = 'Authorization cancelled.';
            });
          };
        }
      };
    }])
    .controller('AppController', ['$http', '$timeout', '$q', '$scope', '$window', function ($http, $timeout, $q, $scope, $window) {
      var vm = this;
      var CONFIG_KEY = 'mcpManager.serverConfig';
      var authWindow = null;
      var authCallback = null;
      var authExpectedOrigin = '';
      var THEME_KEY = 'mcpManager.theme';
      var COLLECTIONS_KEY = 'mcpManager.recentCollections';
      var CATEGORIES = ['MCPNEST_MCP', 'MCPNEST_MCP_OAUTH'];

      vm.theme = localStorage.getItem(THEME_KEY) || 'light';
      vm.loadingCount = 0;
      vm.toasts = [];
      vm.tab = 'dashboard';
      vm.mcps = [];
      vm.collections = [];
      vm.toolsByMcp = {};
      vm.collectionTools = [];
      vm.operations = [];
      vm.baseUrl = '';
      vm.selectedMcp = null;
      vm.usageDetails = {};
      vm.descriptionModal = { title: '', text: '' };
      vm.recentCollections = readJson(COLLECTIONS_KEY, []);
      vm.categories = CATEGORIES.slice();
      vm.filters = { mcp: '', tool: '', collection: '', collectionTool: '', mcpActive: 'active', oauthActive: 'active', mcpPage: 1, mcpPageSize: 20 };
      vm.categoryFilter = { mcpCategories: [], oauthCategories: [], selectedMcpCategories: [], selectedOAuthCategories: [], mcpSearch: '', oauthSearch: '' };
      vm.collectionLookup = { id: '' };
      vm.sidebarCounts = { mcpCount: null, collectionCount: null };
      vm.loadedTabs = { mcps: false, collections: false, oauth: false, mappingProfiles: false };
      vm.callToolForm = { tool: {}, argumentsText: '{}', argumentsModel: {}, argumentSchema: null, expanded: {}, result: '', renderError: '', openEpoch: 0, busy: false };
      vm.explorer = { operation: {}, payloadText: '', result: null };
      vm.productManager = defaultProductManagerState();
      vm.connectorTemplates = [];
      vm.templateCategories = [];
      vm.templateSearch = '';
      vm.selectedTemplate = null;
      vm.mcpEditMode = false;
      vm.callToolSchemaRequestId = 0;
      vm.editCollectionToolSchemaRequestId = 0;
      vm.callToolEditorVisible = true;
      vm.mcpAuthEditor = { schema: null, model: {}, expanded: { root: true }, openEpoch: 0 };
      vm.dashboard = {
        stack: [],
        current: { level: 'overview', label: 'Overview', params: {}, data: {}, loading: false, error: '', chartInstances: [] },
        zoom: { zoomLevel: '1day', startDate: '', endDate: '' },
        toolLogStatus: 'all',
        chartRequestId: 0
      };
      vm.oauth = {
        activeTab: 'setups',
        setups: [],
        setupsLoading: false,
        setupsError: '',
        filterKeyword: '',
        selectedSetup: null,
        viewSetup: null,
        form: defaultOAuthSetupForm(),
        formMode: 'add',
        formOpenEpoch: 0,
        formBusy: false,
        formError: '',
        savedAuthorizeUrl: '',
        savedRedirectUri: '',
        collapsed: { 'setup-details': false, endpoints: true, credentials: true, advanced: true },
        testForm: { name: '', mcpId: '', visibility: '' },
        testResult: null,
        testBusy: false,
        callbackForm: { name: '', code: '', state: '' },
        callbackResult: null,
        callbackBusy: false,
        showAuthTokenBusy: false,
        showAuthTokenResult: null,
        tokens: [],
        tokensLoading: false,
        tokensError: '',
        tokenFilter: { mcpId: '', name: '', uniqueName: '', search: '' },
        lastResponses: {}
      };
      vm.mappingProfiles = {
        profiles: [],
        loading: false,
        error: '',
        filterKeyword: '',
        selected: null,
        form: defaultMappingProfileForm(),
        formMode: 'add',
        formBusy: false,
        formError: ''
      };

      vm.interceptors = {
        list: [],
        loading: false,
        error: '',
        filter: '',
        selected: null,
        editMode: false,
        form: { apiId: '', mcpToolId: '', apiText: '', direction: 'input' }
      };

      vm.login = angular.extend({
        protocol: 'https',
        host: 'dev-new-api.syncloop.com',
        port: '',
        tenant: '1782168784544462123',
        token: ''
      }, readJson(CONFIG_KEY, {}));

      vm.loginMode = 'auth';

      vm.authLogin = {
        step: 1,
        userId: '',
        password: '',
        tenants: [],
        selectedTenant: '',
        token: '',
        tenant: '',
        busy: false,
        error: ''
      };

      vm.forms = {
        mcp: defaultMcpForm(),
        internalTerminal: defaultInternalTerminalForm(),
        cloneMcp: defaultCloneMcpForm(),
        cloneCollection: defaultCloneCollectionForm(),
        editCollectionTool: defaultEditCollectionToolForm(),
        cloneCollectionTool: defaultCloneCollectionToolForm()
      };

      vm.deleteConfirm = {
        message: '',
        callback: null
      };

      vm.showDeleteConfirm = function (message, callback) {
        vm.deleteConfirm.message = message;
        vm.deleteConfirm.callback = callback;
        showModal('deleteConfirmModal');
      };

      vm.confirmDelete = function () {
        hideModal('deleteConfirmModal');
        if (vm.deleteConfirm.callback) {
          vm.deleteConfirm.callback();
          vm.deleteConfirm.callback = null;
        }
        vm.deleteConfirm.message = '';
      };

      vm.collectionWizard = defaultCollectionWizard();

      var paths = {
        createToolCollection: '/packages.MCPNest.wrapper.api.createToolCollection.main',
        addMcpEndpoint: '/packages.MCPNest.wrapper.api.addMcpEndpoint.main',
        addToolToCollection: '/packages.MCPNest.wrapper.api.addToolToCollection.main',
        listToolsByMcpId: '/packages.MCPNest.wrapper.api.listToolsByMcpId.main',
        listToolsByCollectionId: '/packages.MCPNest.wrapper.api.listToolsByCollectionId.main',
        getToolUsageDetails: '/packages.MCPNest.wrapper.api.getToolUsageDetails.main',
        toolDebugCurl: '/packages.MCPNest.wrapper.api.toolDebugCurl.main',
        listMcps: '/packages.MCPNest.wrapper.api.listMcps.main',
        listCollections: '/packages.MCPNest.wrapper.api.listCollections.main',
        addInternalTerminalMcp: '/packages.MCPNest.wrapper.api.addInternalTerminalMcp.main',
        enableDisableToolInCollection: '/packages.MCPNest.wrapper.api.enableDisableToolInCollection.main',
        callTool: '/packages.MCPNest.wrapper.api.callTool.main',
        enableDisableMcpEndpoint: '/packages.MCPNest.wrapper.api.enableDisableMcpEndpoint.main',
        removeToolFromCollection: '/packages.MCPNest.wrapper.api.removeToolFromCollection.main',
        enableDisableTool: '/packages.MCPNest.wrapper.api.enableDisableTool.main',
        exportMcpNestDatabase: '/packages.MCPNest.wrapper.api.exportMcpNestDatabase.main',
        importMcpNestDatabase: '/packages.MCPNest.wrapper.api.importMcpNestDatabase.main',
        recreateMcpNestDatabase: '/packages.MCPNest.wrapper.api.recreateMcpNestDatabase.main',
        migrateMcpNestDatabase: '/packages.MCPNest.wrapper.api.migrateMcpNestDatabase.main',
        editToolInCollection: '/packages.MCPNest.wrapper.api.editToolInCollection.main',
        cloneMcp: '/packages.MCPNest.wrapper.api.cloneMcp.main',
        cloneToolCollection: '/packages.MCPNest.wrapper.api.cloneToolCollection.main',
        cloneToolInCollection: '/packages.MCPNest.wrapper.api.cloneToolInCollection.main',
        purgeToolCallLogs: '/packages.MCPNest.wrapper.api.purgeToolCallLogs.main',
        getDashboardStats: '/packages.MCPNest.wrapper.api.getDashboardStats.main',
        refreshMcpTools: '/packages.MCPNest.wrapper.api.refreshMcpTools.main',
        listOAuthSetups: '/packages.MCPNest.wrapper.api.oauth.listOAuthSetups.main',
        getOAuthSetup: '/packages.MCPNest.wrapper.api.oauth.getOAuthSetup.main',
        addOAuthSetup: '/packages.MCPNest.wrapper.api.oauth.addOAuthSetup.main',
        editOAuthSetup: '/packages.MCPNest.wrapper.api.oauth.editOAuthSetup.main',
        deleteOAuthSetup: '/packages.MCPNest.wrapper.api.oauth.deleteOAuthSetup.main',
        authorizeOAuth: '/packages.MCPNest.wrapper.api.oauth.authorizeOAuth.main',
        testOAuthAuthorization: '/packages.MCPNest.wrapper.api.oauth.testOAuthAuthorization.main',
        oauthCallback: '/packages.MCPNest.wrapper.api.oauth.oauthCallback.main',
        listOAuthTokens: '/packages.MCPNest.wrapper.api.oauth.listOAuthTokens.main',
        deleteOAuthToken: '/packages.MCPNest.wrapper.api.oauth.deleteOAuthToken.main',
        showAuthToken: '/packages.MCPNest.wrapper.api.oauth.showAuthToken.main',
        addOAuthMappingProfile: '/packages.MCPNest.wrapper.api.oauth.addOAuthMappingProfile.main',
        editOAuthMappingProfile: '/packages.MCPNest.wrapper.api.oauth.editOAuthMappingProfile.main',
        getOAuthMappingProfile: '/packages.MCPNest.wrapper.api.oauth.getOAuthMappingProfile.main',
        deleteOAuthMappingProfile: '/packages.MCPNest.wrapper.api.oauth.deleteOAuthMappingProfile.main',
        listOAuthMappingProfiles: '/packages.MCPNest.wrapper.api.oauth.listOAuthMappingProfiles.main',
        changeOAuthTokenAccess: '/packages.MCPNest.wrapper.api.oauth.changeOAuthTokenAccess.main',
        applyOAuthMappingProfile: '/packages.MCPNest.wrapper.api.oauth.applyOAuthMappingProfile.main',
        mergeDefaultOAuthCatalog: '/packages.MCPNest.wrapper.api.mergeDefaultOAuthCatalog.main',
        listMcpCategories: '/packages.MCPNest.wrapper.api.listMcpCategories.main',
        listOAuthCategories: '/packages.MCPNest.wrapper.api.oauth.listOAuthCategories.main',
        addInterceptorApi: '/packages.MCPNest.wrapper.api.interceptor.addInterceptorApi.main',
        updateInterceptorApi: '/packages.MCPNest.wrapper.api.interceptor.updateInterceptorApi.main',
        deleteInterceptorApi: '/packages.MCPNest.wrapper.api.interceptor.deleteInterceptorApi.main',
        getInterceptorApi: '/packages.MCPNest.wrapper.api.interceptor.getInterceptorApi.main',
        deleteMcpEndpoint: '/packages.MCPNest.wrapper.api.deleteMcpEndpoint.main',
        deleteToolCollection: '/packages.MCPNest.wrapper.api.deleteToolCollection.main',
        deleteMcpTool: '/packages.MCPNest.wrapper.api.deleteMcpTool.main',
        getUserID: '/packages.MCPNest.wrapper.api.getUserID.main',
        getOtsuToken: '/jwt'
      };

      vm.operations = defaultOperations();
      loadSwaggerOperations();
      restoreSession();

      vm.isConnected = function () {
        return Boolean(vm.login.token && vm.baseUrl);
      };

      vm.mcpEndpointUrl = function () {
        return vm.baseUrl ? vm.baseUrl + '/MCPNest/mcp' : '';
      };

      vm.copyMcpEndpoint = function () {
        var endpoint = vm.mcpEndpointUrl();
        if (!endpoint) {
          return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(endpoint).then(function () {
            $timeout(function () {
              vm.notify('success', 'Copied', 'MCP endpoint copied to clipboard.');
            });
          }).catch(function () {
            fallbackCopy(endpoint);
          });
          return;
        }

        fallbackCopy(endpoint);
      };

      vm.copyText = function (text) {
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            $timeout(function () {
              vm.notify('success', 'Copied', 'Copied to clipboard.');
            });
          }).catch(function () {
            fallbackCopy(text);
          });
          return;
        }
        fallbackCopy(text);
      };

      vm.truncateText = function (value, max) {
        var text = String(value || '');
        var limit = Number(max) || 0;
        if (!limit || text.length <= limit) return text;
        return text.slice(0, limit) + '...';
      };

      vm.connect = function () {
        vm.baseUrl = buildBaseUrl();
        sessionStorage.setItem('mcpManager.token', vm.login.token);
        persistServerConfig();
        vm.notify('success', 'Connected', 'Server setup saved for this browser session.');
        resetLazyData();
        vm.openDashboard();
      };

      function buildHostUrl() {
        var host = String(vm.login.host || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
        var port = vm.login.port ? ':' + String(vm.login.port).replace(/^:/, '') : '';
        return vm.login.protocol + '://' + host + port;
      }

      vm.basicAuthLogin = function () {
        vm.authLogin.error = '';
        vm.authLogin.busy = true;
        var hostUrl = buildHostUrl();
        var credentials = btoa(vm.authLogin.userId + ':' + vm.authLogin.password);
        $http({
          method: 'GET',
          url: hostUrl + '/jwt/basic',
          headers: { 'Authorization': 'Basic ' + credentials }
        }).then(function (response) {
          var raw = response.data;
          var data = (raw && raw.result) ? raw.result : raw;
          vm.authLogin.token = data.token || '';
          vm.authLogin.tenant = data.tenant || '';
          return $http({
            method: 'POST',
            url: hostUrl + '/tenants/',
            headers: { 'Authorization': 'Bearer ' + vm.authLogin.token, 'Content-Type': 'application/json' },
            data: { token: vm.authLogin.token, tenant: vm.authLogin.tenant, userId: vm.authLogin.userId }
          });
        }).then(function (response) {
          if (!response) return;
          var raw = response.data;
          var data = (raw && raw.result) ? raw.result : raw;
          var list = data.tenants || data.items || (Array.isArray(data) ? data : []);
          vm.authLogin.tenants = list;
          vm.authLogin.token = data.token || vm.authLogin.token;
          vm.authLogin.step = 2;
          vm.authLogin.busy = false;
        }).catch(function (error) {
          vm.authLogin.busy = false;
          var msg = (error && error.data && (error.data.error || error.data.message)) || (error && error.statusText) || 'Request failed.';
          vm.authLogin.error = msg;
        });
      };

      vm.selectTenant = function (tenantName) {
        vm.authLogin.selectedTenant = tenantName;
        vm.switchTenant();
      };

      vm.switchTenant = function () {
        vm.authLogin.error = '';
        vm.authLogin.busy = true;
        var hostUrl = buildHostUrl();
        return $http({
          method: 'GET',
          url: hostUrl + '/tenant/switch?targetTenant=' + encodeURIComponent(vm.authLogin.selectedTenant),
          headers: { 'Authorization': 'Bearer ' + vm.authLogin.token }
        }).then(function (response) {
          var data = response.data;
          vm.login.host = String(vm.login.host || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
          vm.login.tenant = data.tenant || vm.authLogin.selectedTenant;
          vm.login.token = data.token || vm.authLogin.token;
          vm.authLogin.busy = false;
          vm.connect();
        }).catch(function (error) {
          vm.authLogin.busy = false;
          vm.authLogin.error = (error && error.data && error.data.error) || 'Failed to switch tenant.';
        });
      };

      vm.resetAuthLogin = function () {
        vm.authLogin.step = 1;
        vm.authLogin.userId = '';
        vm.authLogin.password = '';
        vm.authLogin.tenants = [];
        vm.authLogin.selectedTenant = '';
        vm.authLogin.token = '';
        vm.authLogin.tenant = '';
        vm.authLogin.error = '';
      };

      vm.setLoginMode = function (mode) {
        vm.loginMode = mode;
        vm.authLogin.error = '';
      };

      vm.logout = function () {
        vm.login.token = '';
        vm.baseUrl = '';
        sessionStorage.removeItem('mcpManager.token');
        persistServerConfig();
        resetLazyData();
      };

      vm.toggleTheme = function () {
        vm.theme = vm.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, vm.theme);
      };

      vm.refreshAll = function () {
        var jobs = [];
        if (vm.dashboard.stack.length || vm.tab === 'dashboard') {
          if (!vm.dashboard.stack.length) {
            vm.dashboard.stack.push({ level: 'overview', label: 'Overview', params: {} });
          }
          jobs.push(loadDashboardLevel(vm.dashboard.stack[vm.dashboard.stack.length - 1]));
        }
        if (vm.loadedTabs.mcps || vm.tab === 'mcps') {
          jobs.push(ensureMcpsLoaded(true));
        }
        if (vm.loadedTabs.collections || vm.tab === 'collections') {
          jobs.push(ensureCollectionsLoaded(true));
        }
        if (vm.loadedTabs.oauth || vm.tab === 'oauth') {
          jobs.push(vm.openOAuthManager(true));
        } else if (vm.loadedTabs.mappingProfiles || vm.tab === 'mappingProfiles') {
          jobs.push(vm.openMappingProfiles(true));
        }
        if (vm.tab === 'interceptors') {
          jobs.push(vm.listInterceptors());
        }
        if (!jobs.length) return $q.when();
        return $q.all(jobs);
      };

      vm.refreshCurrentTab = function (force) {
        force = Boolean(force);
        if (vm.tab === 'dashboard') {
          if (!vm.dashboard.stack.length) {
            vm.dashboard.stack.push({ level: 'overview', label: 'Overview', params: {} });
          }
          return loadDashboardLevel(vm.dashboard.stack[vm.dashboard.stack.length - 1]);
        }
        if (vm.tab === 'mcps') {
          return vm.openMcps(force);
        }
        if (vm.tab === 'collections') {
          return vm.openCollections(force);
        }
        if (vm.tab === 'oauth') {
          return vm.openOAuthManager(force);
        }
        if (vm.tab === 'mappingProfiles') {
          return vm.openMappingProfiles(force);
        }
        return $q.when();
      };

      vm.listMcps = function () {
        var offset = (vm.filters.mcpPage - 1) * vm.filters.mcpPageSize;
        var payload = { keywords: tokenize(vm.filters.mcp), offset: offset, limit: vm.filters.mcpPageSize };
        if (vm.filters.mcpActive === 'active') {
          payload.active = true;
        } else {
          payload.active = false;
        }
        if (vm.categoryFilter.selectedMcpCategories.length) payload.categories = vm.categoryFilter.selectedMcpCategories;
        return api('listMcps', payload).then(function (response) {
          var result = unwrapResult(response);
          var raw = (result && result.items) ? result.items : asArray(result);
          vm.mcps = raw.map(normalizeMcpRecord);
          vm.mcpPagination = {
            total: (result && result.totalCount != null) ? result.totalCount : vm.mcps.length,
            filtered: (result && result.filteredCount != null) ? result.filteredCount : vm.mcps.length,
            returned: (result && result.returnedCount != null) ? result.returnedCount : vm.mcps.length,
            offset: (result && result.offset != null) ? result.offset : offset,
            limit: (result && result.limit != null) ? result.limit : vm.filters.mcpPageSize
          };
          vm.loadedTabs.mcps = true;
          if (vm.selectedMcp && vm.selectedMcp.mcpId) {
            var stillThere = findBy(vm.mcps, 'mcpId', vm.selectedMcp.mcpId);
            vm.selectedMcp = stillThere || null;
          }
          return vm.mcps;
        });
      };

      function ensureMcpsLoaded(force) {
        if (!force && vm.loadedTabs.mcps) return $q.when(vm.mcps || []);
        return vm.listMcps().then(function (list) {
          if (vm.selectedMcp && vm.selectedMcp.mcpId) {
            return vm.loadTools(vm.selectedMcp.mcpId).then(function () { return list; });
          }
          return list;
        });
      }

      vm.filteredMcps = function () {
        if (vm.filters.mcpActive === 'active') {
          return vm.mcps.filter(function (mcp) {
            return truthy(mcp.active);
          });
        } else if (vm.filters.mcpActive === 'available') {
          return vm.mcps.filter(function (mcp) {
            return truthy(mcp.ready) && !truthy(mcp.active);
          });
        }
        return vm.mcps;
      };

      vm.paginatedMcps = function () {
        var filtered = vm.filteredMcps();
        var p = vm.mcpPagination || { total: 0, filtered: 0, returned: 0, offset: 0, limit: vm.filters.mcpPageSize };
        var pageSize = vm.filters.mcpPageSize;
        var total = filtered.length;
        var totalPages = Math.max(1, Math.ceil(total / pageSize));
        if (vm.filters.mcpPage > totalPages) vm.filters.mcpPage = totalPages;
        var start = (vm.filters.mcpPage - 1) * pageSize;
        var end = start + pageSize;
        return { items: filtered.slice(start, end), total: total, page: vm.filters.mcpPage, totalPages: totalPages, pageSize: pageSize };
      };

      vm.mcpPageRange = function () {
        var p = vm.mcpPagination || { filtered: 0, offset: 0, returned: 0 };
        var start = p.offset + 1;
        var end = p.offset + p.returned;
        return start + '-' + end + ' of ' + p.filtered;
      };

      vm.mcpPrevPage = function () {
        if (vm.filters.mcpPage > 1) {
          vm.filters.mcpPage--;
          vm.reloadMcpsList();
        }
      };

      vm.mcpNextPage = function () {
        var p = vm.paginatedMcps();
        if (vm.filters.mcpPage < p.totalPages) {
          vm.filters.mcpPage++;
          vm.reloadMcpsList();
        }
      };

      vm.loadMcpCategories = function () {
        return api('listMcpCategories', {}).then(function (response) {
          vm.categoryFilter.mcpCategories = asArray(unwrapResult(response));
        });
      };

      vm.loadOAuthCategories = function () {
        return api('listOAuthCategories', {}).then(function (response) {
          vm.categoryFilter.oauthCategories = asArray(unwrapResult(response));
        });
      };

      vm.toggleMcpCategory = function (cat) {
        var idx = vm.categoryFilter.selectedMcpCategories.indexOf(cat);
        if (idx >= 0) vm.categoryFilter.selectedMcpCategories.splice(idx, 1);
        else vm.categoryFilter.selectedMcpCategories.push(cat);
      };

      vm.toggleOAuthCategory = function (cat) {
        var idx = vm.categoryFilter.selectedOAuthCategories.indexOf(cat);
        if (idx >= 0) vm.categoryFilter.selectedOAuthCategories.splice(idx, 1);
        else vm.categoryFilter.selectedOAuthCategories.push(cat);
      };

      vm.isMcpCategorySelected = function (cat) {
        return vm.categoryFilter.selectedMcpCategories.indexOf(cat) >= 0;
      };

      vm.isOAuthCategorySelected = function (cat) {
        return vm.categoryFilter.selectedOAuthCategories.indexOf(cat) >= 0;
      };

      function sortedCategories(categories, selected, search) {
        var list = categories || [];
        var q = lower(search);
        if (q) {
          list = list.filter(function (c) { return lower(c).indexOf(q) >= 0; });
        }
        var sel = list.filter(function (c) { return selected.indexOf(c) >= 0; });
        var unsel = list.filter(function (c) { return selected.indexOf(c) < 0; });
        sel.sort(function (a, b) { return a.localeCompare(b); });
        unsel.sort(function (a, b) { return a.localeCompare(b); });
        return sel.concat(unsel);
      }

      vm.getFilteredMcpCategories = function () {
        return sortedCategories(vm.categoryFilter.mcpCategories, vm.categoryFilter.selectedMcpCategories, vm.categoryFilter.mcpSearch);
      };

      vm.getFilteredOAuthCategories = function () {
        return sortedCategories(vm.categoryFilter.oauthCategories, vm.categoryFilter.selectedOAuthCategories, vm.categoryFilter.oauthSearch);
      };

      vm.getSelectedMcpCategoriesForDisplay = function () {
        return vm.categoryFilter.selectedMcpCategories.slice().sort(function (a, b) { return a.localeCompare(b); });
      };

      vm.getSelectedOAuthCategoriesForDisplay = function () {
        return vm.categoryFilter.selectedOAuthCategories.slice().sort(function (a, b) { return a.localeCompare(b); });
      };

      vm.applyMcpCategoryFilter = function () {
        hideModal('mcpCategoryFilterModal');
        vm.reloadMcpsList();
      };

      vm.applyOAuthCategoryFilter = function () {
        hideModal('oauthCategoryFilterModal');
        vm.listOAuthSetups();
      };

      vm.clearMcpCategoryFilter = function () {
        vm.categoryFilter.selectedMcpCategories = [];
        vm.categoryFilter.mcpSearch = '';
      };

      vm.clearOAuthCategoryFilter = function () {
        vm.categoryFilter.selectedOAuthCategories = [];
        vm.categoryFilter.oauthSearch = '';
      };

      vm.closeMcpCategoryFilter = function () {
        hideModal('mcpCategoryFilterModal');
      };

      vm.closeOAuthCategoryFilter = function () {
        hideModal('oauthCategoryFilterModal');
      };

      vm.showModal = function (id) {
        showModal(id);
      };

      vm.formCategoryPicker = { available: [], selected: [], newCategory: '' };
      vm.oauthCategoryPicker = { available: [], selected: [], newCategory: '' };

      vm.loadFormCategories = function () {
        return api('listMcpCategories', {}).then(function (response) {
          var cats = asArray(unwrapResult(response));
          vm.formCategoryPicker.available = cats;
        });
      };

      vm.loadOAuthFormCategories = function () {
        return api('listOAuthCategories', {}).then(function (response) {
          var cats = asArray(unwrapResult(response));
          vm.oauthCategoryPicker.available = cats;
        });
      };

      vm.getOAuthFormAvailableCategories = function () {
        var sel = vm.oauthCategoryPicker.selected;
        var q = lower(vm.oauthCategoryPicker.newCategory);
        return vm.oauthCategoryPicker.available.filter(function (c) {
          return sel.indexOf(c) < 0 && (!q || lower(c).indexOf(q) >= 0);
        }).sort(function (a, b) { return a.localeCompare(b); });
      };

      vm.getOAuthFormSelectedCategories = function () {
        return vm.oauthCategoryPicker.selected.slice().sort(function (a, b) { return a.localeCompare(b); });
      };

      vm.addOAuthFormCategory = function (cat) {
        if (vm.oauthCategoryPicker.selected.indexOf(cat) < 0) {
          vm.oauthCategoryPicker.selected.push(cat);
        }
        vm.oauth.form.categories = vm.oauthCategoryPicker.selected.slice();
      };

      vm.removeOAuthFormCategory = function (cat) {
        var idx = vm.oauthCategoryPicker.selected.indexOf(cat);
        if (idx >= 0) vm.oauthCategoryPicker.selected.splice(idx, 1);
        vm.oauth.form.categories = vm.oauthCategoryPicker.selected.slice();
      };

      vm.addNewOAuthFormCategory = function () {
        var name = (vm.oauthCategoryPicker.newCategory || '').trim();
        if (!name) return;
        if (vm.oauthCategoryPicker.selected.indexOf(name) < 0) {
          vm.oauthCategoryPicker.selected.push(name);
        }
        if (vm.oauthCategoryPicker.available.indexOf(name) < 0) {
          vm.oauthCategoryPicker.available.push(name);
        }
        vm.oauthCategoryPicker.newCategory = '';
        vm.oauth.form.categories = vm.oauthCategoryPicker.selected.slice();
      };

      vm.isOAuthFormCategoryAvailable = function (cat) {
        return vm.oauthCategoryPicker.selected.indexOf(cat) < 0;
      };

      vm.getFormSelectedCategories = function () {
        return vm.formCategoryPicker.selected.slice().sort(function (a, b) { return a.localeCompare(b); });
      };

      vm.getFormAvailableCategories = function () {
        var sel = vm.formCategoryPicker.selected;
        var q = lower(vm.formCategoryPicker.newCategory);
        return vm.formCategoryPicker.available.filter(function (c) {
          return sel.indexOf(c) < 0 && (!q || lower(c).indexOf(q) >= 0);
        }).sort(function (a, b) { return a.localeCompare(b); });
      };

      vm.addFormCategory = function (cat) {
        if (vm.formCategoryPicker.selected.indexOf(cat) < 0) {
          vm.formCategoryPicker.selected.push(cat);
        }
        vm.forms.mcp.request.categories = vm.formCategoryPicker.selected.slice();
      };

      vm.removeFormCategory = function (cat) {
        var idx = vm.formCategoryPicker.selected.indexOf(cat);
        if (idx >= 0) vm.formCategoryPicker.selected.splice(idx, 1);
        vm.forms.mcp.request.categories = vm.formCategoryPicker.selected.slice();
      };

      vm.addNewFormCategory = function () {
        var name = (vm.formCategoryPicker.newCategory || '').trim();
        if (!name) return;
        if (vm.formCategoryPicker.selected.indexOf(name) < 0) {
          vm.formCategoryPicker.selected.push(name);
        }
        if (vm.formCategoryPicker.available.indexOf(name) < 0) {
          vm.formCategoryPicker.available.push(name);
        }
        vm.formCategoryPicker.newCategory = '';
        vm.forms.mcp.request.categories = vm.formCategoryPicker.selected.slice();
      };

      vm.isFormCategoryAvailable = function (cat) {
        return vm.formCategoryPicker.selected.indexOf(cat) < 0;
      };

      vm.isMcpReady = function (mcp) {
        if (!mcp) return false;
        return truthy(mcp.active);
      };

      vm.isMcpInactive = function (mcp) {
        if (!mcp) return false;
        return !truthy(mcp.active) && !truthy(mcp.ready);
      };

      vm.selectMcp = function (mcp) {
        vm.selectedMcp = mcp;
        vm.loadTools(mcp.mcpId);
      };

      vm.listCollections = function () {
        return api('listCollections', { keywords: [] }, { quietErrors: true }).then(function (response) {
          vm.collections = asArray(unwrapResult(response));
          vm.loadedTabs.collections = true;
          var collectionIds = vm.collections.map(function (item) {
            return item && item.collectionId;
          }).filter(Boolean);
          vm.recentCollections = vm.recentCollections.filter(function (item) {
            return item && collectionIds.indexOf(item.collectionId) >= 0;
          });
          localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(vm.recentCollections));
          if (vm.collectionLookup.id && collectionIds.indexOf(vm.collectionLookup.id) < 0) {
            vm.collectionLookup.id = '';
            vm.collectionTools = [];
          }
          return vm.collections;
        }).catch(function () {
          vm.collections = [];
          return vm.collections;
        });
      };

      function ensureCollectionsLoaded(force) {
        if (!force && vm.loadedTabs.collections) {
          if (!vm.collectionLookup.id && (vm.collections || []).length) {
            vm.collectionLookup.id = vm.collections[0].collectionId;
          }
          if (vm.collectionLookup.id) {
            return vm.loadCollectionTools(vm.collectionLookup.id).then(function () {
              return vm.collections || [];
            });
          }
          return $q.when(vm.collections || []);
        }
        return vm.listCollections().then(function (list) {
          if (!vm.collectionLookup.id && list.length) {
            vm.collectionLookup.id = list[0].collectionId;
          }
          if (vm.collectionLookup.id) {
            return vm.loadCollectionTools(vm.collectionLookup.id).then(function () { return list; });
          }
          return list;
        });
      }

      vm.filteredCollections = function () {
        var q = lower(vm.filters.collection);
        if (!q) return vm.collections || [];
        return (vm.collections || []).filter(function (collection) {
          return [collection.collectionName, collection.collectionId, collection.description].some(function (value) {
            return lower(value).indexOf(q) >= 0;
          });
        });
      };

      vm.selectCollection = function (collection) {
        if (!collection || !collection.collectionId) return;
        vm.collectionLookup.id = collection.collectionId;
        return vm.loadCollectionTools(collection.collectionId);
      };

      vm.filteredCollectionTools = function () {
        var q = lower(vm.filters.collectionTool);
        if (!q) return vm.collectionTools || [];
        return (vm.collectionTools || []).filter(function (tool) {
          return [tool.alias, tool.name, tool.description, tool.collectionToolId, tool.toolId].some(function (value) {
            return lower(value).indexOf(q) >= 0;
          });
        });
      };

      vm.loadTools = function (mcpId) {
        return api('listToolsByMcpId', { mcpId: mcpId, keywords: tokenize(vm.filters.tool) }).then(function (response) {
          vm.toolsByMcp[mcpId] = asArray(unwrapResult(response));
          return vm.toolsByMcp[mcpId];
        });
      };

      vm.refreshingMcpTools = {};
      vm.refreshMcpTools = function (mcp) {
        var target = mcp || vm.selectedMcp;
        if (!target || !target.mcpId) {
          vm.notify('warning', 'No MCP selected', 'Choose an MCP first to re-fetch its tools.');
          return $q.when();
        }
        var mcpId = target.mcpId;
        vm.refreshingMcpTools[mcpId] = true;
        return api('refreshMcpTools', { request: { mcpId: mcpId } }).then(function (response) {
          var result = unwrapResult(response) || {};
          var created = Number(result.createdToolCount || 0);
          var updated = Number(result.updatedToolCount || 0);
          var unchanged = Number(result.unchangedToolCount || 0);
          var total = Number(result.toolCount || (created + updated + unchanged));
          var summary = 'Created ' + created + ' \u00b7 Updated ' + updated + ' \u00b7 Unchanged ' + unchanged + ' (total ' + total + ').';
          vm.notify('success', 'Tools refreshed', result.message || summary);
          return vm.loadTools(mcpId).then(function (tools) {
            vm.refreshingMcpTools[mcpId] = false;
            return tools;
          });
        }).catch(function () {
          vm.refreshingMcpTools[mcpId] = false;
        });
      };

      vm.filteredTools = function () {
        if (!vm.selectedMcp) return [];
        var tools = vm.toolsByMcp[vm.selectedMcp.mcpId] || [];
        var q = lower(vm.filters.tool);
        return tools.filter(function (tool) {
          return !q || [tool.name, tool.description, tool.toolId].some(function (value) {
            return lower(value).indexOf(q) >= 0;
          });
        });
      };

      vm.filteredTemplates = function () {
        var q = lower(vm.templateSearch);
        return vm.connectorTemplates.filter(function (template) {
          return !q || [template.name, template.category, template.description].some(function (value) {
            return lower(value).indexOf(q) >= 0;
          });
        });
      };

      vm.selectConnectorTemplate = function (template) {
        vm.selectedTemplate = template;
        vm.forms.mcp = formFromTemplate(template);
        vm.initMcpAuthEditor();
      };

      vm.startAddMcp = function () {
        vm.mcpEditMode = false;
        vm.selectedTemplate = manualTemplate();
        vm.forms.mcp = formFromTemplate(vm.selectedTemplate);
        vm.formCategoryPicker.selected = [];
        vm.formCategoryPicker.newCategory = '';
        vm.loadFormCategories().then(function () {
          vm.forms.mcp.request.categories = vm.formCategoryPicker.selected.slice();
        });
        vm.initMcpAuthEditor();
        showModal('addMcpModal');
      };

      vm.providerNameSearch = '';
      vm.selectedProviderName = null;

      vm.openProviderNameSelector = function () {
        vm.providerNameSearch = '';
        vm.selectedProviderName = null;
        if (!vm.oauth.setups || !vm.oauth.setups.length) {
          vm.listOAuthSetups().then(function () {
            showModal('providerNameSelectorModal');
          });
        } else {
          showModal('providerNameSelectorModal');
        }
      };

      vm.getFilteredProviderNames = function () {
        var q = lower(vm.providerNameSearch);
        return (vm.oauth.setups || []).filter(function (setup) {
          var name = setup.uniqueName || setup.oauthId || '';
          return !q || lower(name).indexOf(q) >= 0;
        }).sort(function (a, b) {
          var na = a.uniqueName || a.oauthId || '';
          var nb = b.uniqueName || b.oauthId || '';
          return na.localeCompare(nb);
        });
      };

      vm.selectProviderName = function (setup) {
        vm.selectedProviderName = setup.uniqueName || setup.oauthId || null;
      };

      vm.applyProviderName = function () {
        if (vm.selectedProviderName) {
          vm.forms.mcp.request.mcpName = vm.selectedProviderName;
        }
        hideModal('providerNameSelectorModal');
      };

      vm.editMcp = function (mcp) {
        if (!mcp) return;
        vm.mcpEditMode = true;
        vm.selectedTemplate = manualTemplate();
        vm.forms.mcp = formFromTemplate(vm.selectedTemplate);
        vm.forms.mcp.request.mcpId = mcp.mcpId || '';
        vm.forms.mcp.request.mcpAlias = mcp.alias || '';
        vm.forms.mcp.request.mcpName = mcp.name || '';
        vm.forms.mcp.request.endpointUrl = mcp.endpoint || '';
        vm.forms.mcp.request.description = mcp.description || '';
        vm.forms.mcp.request.endpointType = mcp.endpointType || 'STANDARD';
        vm.forms.mcp.request.authType = mcp.authType === 'CUSTOM_HEADER' ? 'API_KEY' : (mcp.authType || 'NONE');
        vm.forms.mcp.request.enabled = truthy(mcp.enabled);
        vm.forms.mcp.request.authInfo = angular.copy(mcp.authInfo || {});
        vm.forms.mcp.request.categories = normalizeCategories(mcp.categories || []);
        vm.formCategoryPicker.selected = vm.forms.mcp.request.categories.slice();
        vm.formCategoryPicker.newCategory = '';
        vm.loadFormCategories();
        vm.initMcpAuthEditor();
        showModal('addMcpModal');
      };

      vm.openCloneMcp = function (mcp) {
        if (!mcp || !mcp.mcpId) return;
        vm.forms.cloneMcp = defaultCloneMcpForm();
        vm.forms.cloneMcp.request.mcpId = mcp.mcpId;
        vm.forms.cloneMcp.request.newMcpAlias = (mcp.alias || mcp.name || 'cloned-mcp') + '-copy';
        vm.forms.cloneMcp.request.endpointUrl = mcp.endpoint || '';
        vm.forms.cloneMcp.request.mcpName = mcp.name || mcp.alias || 'MCP';
        vm.forms.cloneMcp.request.description = mcp.description || '';
        vm.forms.cloneMcp.request.endpointType = mcp.endpointType || 'STANDARD';
        vm.forms.cloneMcp.request.authType = (mcp.authType === 'CUSTOM_HEADER' ? 'API_KEY' : (mcp.authType || 'NONE'));
        vm.forms.cloneMcp.request.authInfo = normalizeAuthInfo(mcp.authInfo || {}, vm.forms.cloneMcp.request.authType);
        vm.forms.cloneMcp.request.categories = normalizeCategories(mcp.categories || []);
        vm.forms.cloneMcp.request.enabled = truthy(mcp.enabled);
        showModal('cloneMcpModal');
      };

      vm.cloneMcpEndpoint = function () {
        return api('cloneMcp', angular.copy(vm.forms.cloneMcp)).then(function (response) {
          var result = unwrapResult(response);
          vm.notify('success', 'MCP cloned', result.message || 'Endpoint cloned successfully.');
          hideModal('cloneMcpModal');
          return vm.refreshAll();
        });
      };

      vm.deleteMcpEndpoint = function (mcp) {
        if (!mcp || !mcp.mcpId) return;
        vm.showDeleteConfirm('Delete MCP endpoint "' + (mcp.alias || mcp.name || mcp.mcpId) + '"? This cannot be undone.', function () {
          return api('deleteMcpEndpoint', { request: { mcpId: mcp.mcpId } }).then(function (response) {
            var result = unwrapResult(response) || {};
            vm.notify('success', 'MCP deleted', result.message || 'Endpoint deleted successfully.');
            if (vm.selectedMcp && vm.selectedMcp.mcpId === mcp.mcpId) {
              vm.selectedMcp = null;
            }
            return vm.listMcps();
          });
        });
      };

      vm.deleteToolCollection = function (collection) {
        if (!collection || !collection.collectionId) return;
        vm.showDeleteConfirm('Delete collection "' + (collection.name || collection.collectionId) + '"? This cannot be undone.', function () {
          return api('deleteToolCollection', { request: { collectionId: collection.collectionId } }).then(function (response) {
            var result = unwrapResult(response) || {};
            vm.notify('success', 'Collection deleted', result.message || 'Collection deleted successfully.');
            if (vm.collectionLookup.id === collection.collectionId) {
              vm.collectionLookup.id = '';
              vm.collectionTools = [];
            }
            return vm.listCollections();
          });
        });
      };

      vm.deleteMcpTool = function (tool, mcpId) {
        if (!tool || !tool.toolId) return;
        vm.showDeleteConfirm('Delete tool "' + (tool.alias || tool.name || tool.toolId) + '"? This cannot be undone.', function () {
          return api('deleteMcpTool', { request: { toolId: tool.toolId } }).then(function (response) {
            var result = unwrapResult(response) || {};
            vm.notify('success', 'Tool deleted', result.message || 'Tool deleted successfully.');
            if (mcpId) {
              return vm.loadTools(mcpId);
            }
            return vm.listMcps();
          });
        });
      };

      vm.initMcpAuthEditor = function () {
        var schema = getAddMcpAuthInfoSchema();
        var current = normalizeAuthInfo(vm.forms.mcp.request.authInfo, vm.forms.mcp.request.authType);
        vm.mcpAuthEditor = {
          schema: schema,
          model: hydrateModelFromSchema(schema, current),
          expanded: { root: true },
          openEpoch: Date.now() + Math.floor(Math.random() * 1000)
        };
      };

      vm.onMcpAuthTypeChange = function () {
        vm.mcpAuthEditor.model = vm.mcpAuthEditor.model || {};
        vm.mcpAuthEditor.model.auth = vm.mcpAuthEditor.model.auth || {};
        vm.mcpAuthEditor.model.auth.header = Array.isArray(vm.mcpAuthEditor.model.auth.header) ? vm.mcpAuthEditor.model.auth.header : [];
        vm.mcpAuthEditor.model.auth.query = Array.isArray(vm.mcpAuthEditor.model.auth.query) ? vm.mcpAuthEditor.model.auth.query : [];
      };

      vm.isManualTemplate = function () {
        return !vm.selectedTemplate || vm.selectedTemplate.id === 'manual';
      };

      vm.openTemplateAuth = function () {
        if (!vm.selectedTemplate || !vm.selectedTemplate.authUrl) {
          vm.notify('info', 'No SSO URL', 'This template uses direct credentials or a manually issued endpoint.');
          return;
        }
        window.open(vm.selectedTemplate.authUrl, '_blank', 'noopener,noreferrer');
      };

      vm.addMcp = function () {
        var payload = angular.copy(vm.forms.mcp);
        try {
          applyTemplateFields(payload, vm.selectedTemplate);
        } catch (e) {
          vm.notify('warning', 'Missing connector detail', e.message);
          return;
        }
        payload.request.categories = normalizeCategories(payload.request.categories, ['MCPNEST_MCP']);
        var templateAuthInfo = normalizeAuthInfo(payload.request.authInfo, payload.request.authType);
        var editorAuthInfo = normalizeAuthInfo(vm.mcpAuthEditor.model, payload.request.authType);
        payload.request.authInfo = compactObject(mergeSchemaValues(editorAuthInfo, templateAuthInfo)) || {};
        return api('addMcpEndpoint', payload).then(function (response) {
          var result = unwrapResult(response);
          vm.notify('success', vm.mcpEditMode ? 'MCP updated' : 'MCP added', result.message || 'Endpoint saved and tools discovered.');
          hideModal('addMcpModal');
          vm.mcpEditMode = false;
          vm.forms.mcp = formFromTemplate(vm.selectedTemplate || manualTemplate());
          vm.initMcpAuthEditor();
          return vm.refreshAll();
        });
      };

      vm.startInternalTerminalMcp = function () {
        vm.forms.internalTerminal = defaultInternalTerminalForm();
      };

      vm.addInternalTerminalMcp = function () {
        var payload = angular.copy(vm.forms.internalTerminal);
        return api('addInternalTerminalMcp', payload).then(function (response) {
          var result = unwrapResult(response);
          vm.notify('success', 'Internal Terminal MCP saved', result.message || 'Internal terminal MCP configured successfully.');
          hideModal('internalTerminalMcpModal');
          vm.forms.internalTerminal = defaultInternalTerminalForm();
          return vm.refreshAll();
        });
      };

      vm.toggleMcp = function (mcp) {
        return api('enableDisableMcpEndpoint', { mcpId: mcp.mcpId, enabled: !truthy(mcp.enabled) }).then(function (response) {
          var result = unwrapResult(response);
          mcp.enabled = !truthy(mcp.enabled);
          vm.notify('success', 'MCP updated', result.message || 'Endpoint status updated.');
        });
      };

      vm.toggleTool = function (tool) {
        return api('enableDisableTool', { toolId: tool.toolId, enabled: !truthy(tool.enabled) }).then(function (response) {
          var result = unwrapResult(response);
          tool.enabled = !truthy(tool.enabled);
          vm.notify('success', 'Tool updated', result.message || 'Tool status updated.');
        });
      };

      vm.showDescription = function (tool) {
        if (!tool) return;
        vm.descriptionModal.title = tool.alias || tool.name || 'Tool';
        vm.descriptionModal.text = tool.description || 'No description available.';
        showModal('descriptionModal');
      };

      vm.showUsage = function (tool) {
        if (!tool) return;
        var payload = tool.collectionToolId
          ? { collectionToolId: tool.collectionToolId, toolId: tool.toolId }
          : { toolId: tool.toolId };
        return api('getToolUsageDetails', payload).then(function (response) {
          vm.usageDetails = unwrapResult(response);
          showModal('usageModal');
        });
      };

      vm.openCallTool = function (tool, options) {
        options = options || {};
        var selectedCollectionToolId = options.collectionToolId || tool.collectionToolId || '';
        var requestId = ++vm.callToolSchemaRequestId;
        var toolId = tool && tool.toolId;
        var initialArgs = defaultArguments(tool);
        var fallbackSchema = buildFallbackSchema(initialArgs);
        var initialModel = hydrateModelFromSchema(fallbackSchema, initialArgs);
        vm.callToolEditorVisible = false;
        vm.callToolForm = {
          tool: tool,
          argumentsText: '{}',
          argumentsModel: {},
          argumentSchema: null,
          expanded: { root: true },
          collectionToolId: selectedCollectionToolId,
          result: '',
          renderError: '',
          busy: false,
          openEpoch: Date.now() + Math.floor(Math.random() * 1000)
        };
        showModal('callToolModal');
        $timeout(function () {
          if (!isCurrentCallToolRequest(requestId, toolId)) {
            return;
          }
          vm.callToolForm.argumentSchema = fallbackSchema;
          vm.callToolForm.argumentsModel = initialModel;
          vm.callToolForm.argumentsText = JSON.stringify(initialModel, null, 2);
          vm.callToolForm.openEpoch = Date.now() + Math.floor(Math.random() * 1000);
          rebuildPayloadFromModel('open-calltool-initial');
          vm.callToolEditorVisible = true;
        }, 0);

        var usagePayload = selectedCollectionToolId
          ? { collectionToolId: selectedCollectionToolId, toolId: tool.toolId }
          : { toolId: tool.toolId };
        api('getToolUsageDetails', usagePayload, { quietErrors: true }).then(function (response) {
          if (!isCurrentCallToolRequest(requestId, toolId)) {
            return;
          }
          var details = unwrapResult(response);
          var schema = extractArgumentSchema(details) || fallbackSchema;
          var schemaDefaults = buildDefaultsFromSchema(schema);
          var args = mergeSchemaValues(initialArgs, schemaDefaults);
          var hydrated = hydrateModelFromSchema(schema, args);
          vm.callToolEditorVisible = false;
          vm.callToolForm.argumentSchema = schema;
          vm.callToolForm.argumentsModel = hydrated;
          vm.callToolForm.expanded = { root: true };
          vm.callToolForm.openEpoch = Date.now() + Math.floor(Math.random() * 1000);
          $timeout(function () {
            if (!isCurrentCallToolRequest(requestId, toolId)) {
              return;
            }
            rebuildPayloadFromModel('open-calltool-schema-load');
            vm.callToolEditorVisible = true;
          }, 0);
        }).catch(function () {
          if (!isCurrentCallToolRequest(requestId, toolId)) {
            return;
          }
          vm.callToolForm.renderError = 'Schema not available for this tool. You can still edit and run payload JSON.';
          vm.callToolEditorVisible = true;
        });
      };

      vm.submitToolArgumentsForm = function () {
        var cleaned = stripEmptyValues(vm.callToolForm.argumentsModel) || {};
        vm.callToolForm.argumentsModel = cleaned;
        vm.callToolForm.argumentsText = vm.renderPayloadJson();
        return vm.callTool(angular.copy(cleaned));
      };

      vm.submitToolDebugForm = function () {
        var cleaned = stripEmptyValues(vm.callToolForm.argumentsModel) || {};
        vm.callToolForm.argumentsModel = cleaned;
        vm.callToolForm.argumentsText = vm.renderPayloadJson();
        return vm.debugToolCurl(angular.copy(cleaned));
      };

      vm.renderPayloadJson = function () {
        try {
          return JSON.stringify(stripEmptyValues(vm.callToolForm.argumentsModel) || {}, null, 2);
        } catch (e) {
          return vm.callToolForm.argumentsText || '{}';
        }
      };

      vm.onArgValueChange = function (path, value, $event) {
        var nextValue = value;
        if ($event && $event.target) {
          if ($event.target.type === 'checkbox') {
            nextValue = Boolean($event.target.checked);
          } else if ($event.target.type === 'number') {
            nextValue = $event.target.value === '' ? '' : Number($event.target.value);
          } else {
            nextValue = $event.target.value;
          }
        }

        setValueAtPath(vm.callToolForm.argumentsModel, path, nextValue);
        $timeout(function () {
          rebuildPayloadFromModel('arg-change:' + (path || 'unknown'));
        }, 0);
      };

      vm.renderMcpAuthJson = function () {
        try {
          return JSON.stringify(vm.mcpAuthEditor.model || {}, null, 2);
        } catch (e) {
          return '{}';
        }
      };

      vm.onMcpAuthValueChange = function (path, value, $event) {
        var nextValue = value;
        if ($event && $event.target) {
          if ($event.target.type === 'checkbox') {
            nextValue = Boolean($event.target.checked);
          } else if ($event.target.type === 'number') {
            nextValue = $event.target.value === '' ? '' : Number($event.target.value);
          } else {
            nextValue = $event.target.value;
          }
        }
        setValueAtPath(vm.mcpAuthEditor.model, path, nextValue);
      };

      vm.isMcpAuthNodeOpen = function (path) {
        var value = vm.mcpAuthEditor.expanded[path];
        return value !== false;
      };

      vm.toggleMcpAuthNode = function (path) {
        vm.mcpAuthEditor.expanded[path] = !vm.isMcpAuthNodeOpen(path);
      };

      vm.addMcpAuthArrayItem = function (arrayRef, itemSchema, path) {
        if (!Array.isArray(arrayRef)) return;
        arrayRef.push(emptyItemFromSchema(itemSchema));
        vm.mcpAuthEditor.expanded[vm.arrayItemArgPath(path, arrayRef.length - 1)] = true;
      };

      vm.removeMcpAuthArrayItem = function (arrayRef, index, item, path) {
        if (!Array.isArray(arrayRef) || index < 0 || index >= arrayRef.length) return;
        var removeIndex = index;
        if (arrayRef[removeIndex] !== item) {
          removeIndex = arrayRef.indexOf(item);
          if (removeIndex < 0) return;
        }
        arrayRef.splice(removeIndex, 1);
        vm.mcpAuthEditor.expanded = reindexExpandedArrayMap(vm.mcpAuthEditor.expanded, path || '', removeIndex);
      };

      vm.renderEditManagedPayloadJson = function () {
        var editor = vm.forms.editCollectionTool.managedPayloadEditor;
        if (editor && editor.payloadText !== undefined) {
          return editor.payloadText;
        }
        try {
          return JSON.stringify((editor || {}).model || {}, null, 2);
        } catch (e) {
          return '{}';
        }
      };

      vm.syncManagedPayloadJson = function () {
        var editor = vm.forms.editCollectionTool.managedPayloadEditor;
        if (!editor) return;
        var stripped = stripEmptyValues(editor.model) || {};
        var serialized = safeSerialize(stripped);
        if (!serialized) return;
        var nextText = prettyFromSerialized(serialized);
        if (editor.payloadText !== nextText) {
          editor.payloadText = nextText;
        }
      };

      vm.onEditManagedPayloadValueChange = function (path, value, $event) {
        var nextValue = value;
        if ($event && $event.target) {
          if ($event.target.type === 'checkbox') {
            nextValue = Boolean($event.target.checked);
          } else if ($event.target.type === 'number') {
            nextValue = $event.target.value === '' ? '' : Number($event.target.value);
          } else {
            nextValue = $event.target.value;
          }
        }
        setValueAtPath(vm.forms.editCollectionTool.managedPayloadEditor.model, path, nextValue);
        $timeout(function () {
          rebuildManagedPayloadFromModel('arg-change:' + (path || 'unknown'));
        }, 0);
      };

      vm.isEditManagedPayloadNodeOpen = function (path) {
        var editor = vm.forms.editCollectionTool.managedPayloadEditor || { expanded: {} };
        var value = editor.expanded[path];
        return value !== false;
      };

      vm.toggleEditManagedPayloadNode = function (path) {
        var editor = vm.forms.editCollectionTool.managedPayloadEditor;
        if (!editor) return;
        editor.expanded[path] = !vm.isEditManagedPayloadNodeOpen(path);
      };

      vm.addEditManagedPayloadArrayItem = function (arrayRef, itemSchema, path) {
        if (!Array.isArray(arrayRef)) return;
        arrayRef.push(emptyItemFromSchema(itemSchema));
        vm.forms.editCollectionTool.managedPayloadEditor.expanded[vm.arrayItemArgPath(path, arrayRef.length - 1)] = true;
        rebuildManagedPayloadFromModel('array-add');
      };

      vm.removeEditManagedPayloadArrayItem = function (arrayRef, index, item, path) {
        if (!Array.isArray(arrayRef) || index < 0 || index >= arrayRef.length) return;
        var removeIndex = index;
        if (arrayRef[removeIndex] !== item) {
          removeIndex = arrayRef.indexOf(item);
          if (removeIndex < 0) return;
        }
        arrayRef.splice(removeIndex, 1);
        vm.forms.editCollectionTool.managedPayloadEditor.expanded = reindexExpandedArrayMap(vm.forms.editCollectionTool.managedPayloadEditor.expanded, path || '', removeIndex);
        rebuildManagedPayloadFromModel('array-remove');
      };

      vm.syncCallToolJson = function (source) {
        var stripped = stripEmptyValues(vm.callToolForm.argumentsModel) || {};
        var serialized = safeSerialize(stripped);
        if (!serialized) return;
        var nextText = prettyFromSerialized(serialized);
        if (vm.callToolForm.argumentsText !== nextText) {
          vm.callToolForm.argumentsText = nextText;
        }
      };

      vm.schemaFields = function (schema) {
        return Object.keys((schema && schema.properties) || {}).map(function (key) {
          return { key: key, schema: schema.properties[key] };
        });
      };

      vm.isObjectSchema = function (schema) {
        return Boolean(schema && (schema.type === 'object' || schema.properties));
      };

      vm.isArraySchema = function (schema) {
        return Boolean(schema && schema.type === 'array');
      };

      vm.isBooleanSchema = function (schema) {
        return Boolean(schema && schema.type === 'boolean');
      };

      vm.isNumberSchema = function (schema) {
        return Boolean(schema && (schema.type === 'integer' || schema.type === 'number'));
      };

      vm.isComplexSchema = function (schema) {
        return vm.isObjectSchema(schema) || vm.isArraySchema(schema);
      };

      vm.childArgPath = function (base, key) {
        return (base || 'root') + '.' + key;
      };

      vm.arrayItemArgPath = function (base, index) {
        return (base || 'root') + '[' + index + ']';
      };

      vm.isArgNodeOpen = function (path) {
        var value = vm.callToolForm.expanded[path];
        return value !== false;
      };

      vm.toggleArgNode = function (path) {
        vm.callToolForm.expanded[path] = !vm.isArgNodeOpen(path);
      };

      vm.addToolArgArrayItem = function (arrayRef, itemSchema, path) {
        if (!Array.isArray(arrayRef)) return;
        arrayRef.push(emptyItemFromSchema(itemSchema));
        vm.callToolForm.expanded[vm.arrayItemArgPath(path, arrayRef.length - 1)] = true;
        rebuildPayloadFromModel('array-add');
      };

      vm.removeToolArgArrayItem = function (arrayRef, index, item, path) {
        if (!Array.isArray(arrayRef) || index < 0 || index >= arrayRef.length) return;
        var removeIndex = index;
        if (arrayRef[removeIndex] !== item) {
          removeIndex = arrayRef.indexOf(item);
          if (removeIndex < 0) return;
        }
        arrayRef.splice(removeIndex, 1);
        reindexExpandedArray(path || '', removeIndex);
        rebuildPayloadFromModel('array-remove');
      };

      $scope.$watch(function () {
        return vm.callToolForm.argumentsModel;
      }, function () {
        vm.syncCallToolJson('deep-watch');
      }, true);

      $scope.$watch(function () {
        return vm.forms.editCollectionTool.managedPayloadEditor && vm.forms.editCollectionTool.managedPayloadEditor.model;
      }, function () {
        vm.syncManagedPayloadJson();
      }, true);

      function rebuildPayloadFromModel(source) {
        replaceModelInPlace(hydrateModelFromSchema(vm.callToolForm.argumentSchema, vm.callToolForm.argumentsModel));
        vm.syncCallToolJson(source);
      }

      function rebuildManagedPayloadFromModel(source) {
        var editor = vm.forms.editCollectionTool.managedPayloadEditor;
        if (!editor) return;
        replaceManagedPayloadModelInPlace(hydrateModelFromSchema(editor.schema, editor.model));
        vm.syncManagedPayloadJson();
      }

      function replaceModelInPlace(nextModel) {
        var current = vm.callToolForm.argumentsModel;
        var replacement = angular.copy(nextModel || {});

        if (!current || typeof current !== 'object' || Array.isArray(current)) {
          vm.callToolForm.argumentsModel = replacement;
          return;
        }

        Object.keys(current).forEach(function (key) {
          delete current[key];
        });

        Object.keys(replacement).forEach(function (key) {
          current[key] = replacement[key];
        });
      }

      function replaceManagedPayloadModelInPlace(nextModel) {
        var editor = vm.forms.editCollectionTool.managedPayloadEditor;
        if (!editor) return;
        var current = editor.model;
        var replacement = angular.copy(nextModel || {});

        if (!current || typeof current !== 'object' || Array.isArray(current)) {
          editor.model = replacement;
          return;
        }

        Object.keys(current).forEach(function (key) {
          delete current[key];
        });

        Object.keys(replacement).forEach(function (key) {
          current[key] = replacement[key];
        });
      }

      vm.callTool = function (overrideArgs) {
        var args = overrideArgs;
        if (!args) {
          args = angular.copy(vm.callToolForm.argumentsModel || {});
        }
        vm.callToolForm.argumentsModel = angular.copy(args);
        vm.callToolForm.argumentsText = JSON.stringify(args, null, 2);
        var payload = { toolId: vm.callToolForm.tool.toolId, arguments: args };
        if (vm.callToolForm.collectionToolId) {
          payload.collectionToolId = vm.callToolForm.collectionToolId;
        }
        vm.callToolForm.busy = true;
        return api('callTool', payload).then(function (response) {
          vm.callToolForm.result = typeof response === 'string' ? response : JSON.stringify(response, null, 2);
          vm.notify('success', 'Tool call complete', 'The tool returned a response.');
        }).finally(function () {
          vm.callToolForm.busy = false;
        });
      };

      vm.debugToolCurl = function (overrideArgs) {
        var args = overrideArgs;
        if (!args) {
          args = angular.copy(vm.callToolForm.argumentsModel || {});
        }
        vm.callToolForm.argumentsModel = angular.copy(args);
        vm.callToolForm.argumentsText = JSON.stringify(args, null, 2);
        var payload = {
          toolId: vm.callToolForm.tool.toolId,
          collectionToolId: vm.callToolForm.collectionToolId || '',
          arguments: args
        };
        vm.callToolForm.busy = true;
        return api('toolDebugCurl', payload).then(function (response) {
          vm.callToolForm.result = JSON.stringify(unwrapResult(response) || response, null, 2);
          vm.notify('success', 'Debug curl ready', 'Tool debug request generated successfully.');
        }).finally(function () {
          vm.callToolForm.busy = false;
        });
      };

      vm.startCollectionWizard = function () {
        vm.collectionWizard = defaultCollectionWizard();
        vm.collectionWizard.mode = 'create';
        vm.collectionWizard.modeLocked = true;
        if (!vm.mcps.length) {
          vm.listMcps();
        }
      };

      vm.editCollectionWizard = function () {
        if (!vm.collectionLookup.id) {
          vm.notify('warning', 'Collection id required', 'Load or select a collection before editing.');
          return;
        }

        vm.collectionWizard = defaultCollectionWizard();
        vm.collectionWizard.mode = 'update';
        vm.collectionWizard.modeLocked = true;
        vm.collectionWizard.collectionNameLocked = true;
        vm.collectionWizard.collectionId = vm.collectionLookup.id;
        vm.collectionWizard.collectionName = findCollectionName(vm.collectionLookup.id) || vm.collectionLookup.id;
        vm.collectionWizard.description = findCollectionDescription(vm.collectionLookup.id) || '';
        vm.collectionWizard.step = 2;

        vm.loadCollectionTools(vm.collectionLookup.id).then(function (tools) {
          var list = tools || [];
          vm.collectionWizard.availableTools = angular.copy(list);
          vm.collectionWizard.selected = {};
          list.forEach(function (tool) {
            vm.collectionWizard.selected[tool.toolId] = true;
          });
        });

        if (!vm.mcps.length) {
          vm.listMcps();
        }

        showModal('collectionWizardModal');
      };

      vm.loadWizardTools = function () {
        if (!vm.collectionWizard.mcpId) return;
        return vm.loadTools(vm.collectionWizard.mcpId).then(function (tools) {
          vm.collectionWizard.availableTools = tools || [];
        });
      };

      vm.filteredWizardTools = function () {
        var q = lower(vm.collectionWizard.toolSearch);
        return (vm.collectionWizard.availableTools || []).filter(function (tool) {
          return !q || [tool.name, tool.description, tool.toolId].some(function (value) {
            return lower(value).indexOf(q) >= 0;
          });
        });
      };

      vm.toggleAllWizardTools = function () {
        var tools = vm.filteredWizardTools();
        var allSelected = tools.length && tools.every(function (tool) { return vm.collectionWizard.selected[tool.toolId]; });
        tools.forEach(function (tool) {
          vm.collectionWizard.selected[tool.toolId] = !allSelected;
        });
      };

      vm.selectedWizardToolIds = function () {
        return Object.keys(vm.collectionWizard.selected).filter(function (toolId) {
          return vm.collectionWizard.selected[toolId];
        });
      };

      vm.selectedWizardTools = function () {
        var selected = vm.collectionWizard.selected;
        return (vm.collectionWizard.availableTools || []).filter(function (tool) {
          return selected[tool.toolId];
        });
      };

      vm.submitCollectionWizard = function () {
        var toolIds = vm.selectedWizardToolIds();
        if (!toolIds.length) {
          vm.notify('warning', 'No tools selected', 'Select at least one tool before applying the wizard.');
          return;
        }

        var collectionPromise;
        if (vm.collectionWizard.mode === 'create') {
          if (!vm.collectionWizard.collectionName) {
            vm.notify('warning', 'Collection name required', 'Enter a collection name to continue.');
            return;
          }
          collectionPromise = api('createToolCollection', {
            request: {
              collectionName: vm.collectionWizard.collectionName,
              description: vm.collectionWizard.description || '',
              enabled: vm.collectionWizard.enabled
            }
          }).then(function (response) {
            var result = unwrapResult(response);
            rememberCollection({
              collectionId: result.collectionId,
              collectionName: vm.collectionWizard.collectionName,
              description: vm.collectionWizard.description || ''
            });
            return result.collectionId;
          });
        } else {
          if (!vm.collectionWizard.collectionId) {
            vm.notify('warning', 'Collection id required', 'Paste the target collection id to update.');
            return;
          }
          collectionPromise = api('createToolCollection', {
            request: {
              collectionId: vm.collectionWizard.collectionId,
              collectionName: vm.collectionWizard.collectionName || vm.collectionWizard.collectionId,
              description: vm.collectionWizard.description || ''
            }
          }).then(function (response) {
            var result = unwrapResult(response);
            rememberCollection({
              collectionId: result.collectionId || vm.collectionWizard.collectionId,
              collectionName: vm.collectionWizard.collectionName || vm.collectionWizard.collectionId,
              description: vm.collectionWizard.description || ''
            });
            return result.collectionId || vm.collectionWizard.collectionId;
          });
        }

        return collectionPromise.then(function (collectionId) {
          return chain(toolIds, function (toolId) {
            return api('addToolToCollection', { collectionId: collectionId, toolId: toolId }, { quietErrors: true })
              .catch(function (err) {
                if (String(err && err.message || err).indexOf('already exists') >= 0) return null;
                throw err;
              });
          }).then(function () {
            vm.notify('success', 'Collection updated', toolIds.length + ' tool(s) are available in the collection.');
            vm.collectionLookup.id = collectionId;
            hideModal('collectionWizardModal');
            return vm.loadCollectionTools(collectionId).then(function () {
              return vm.listCollections();
            });
          });
        });
      };

      vm.loadCollectionTools = function (collectionId) {
        if (!collectionId) return;
        return api('listToolsByCollectionId', { collectionId: collectionId, keywords: [] }).then(function (response) {
          vm.collectionTools = asArray(unwrapResult(response));
          return vm.collectionTools;
        });
      };

      vm.removeToolFromCollection = function (collectionId, tool) {
        if (!collectionId || !tool) return;
        return api('removeToolFromCollection', {
          collectionId: collectionId,
          collectionToolId: tool.collectionToolId || ''
        }).then(function (response) {
          var result = unwrapResult(response);
          vm.notify('success', 'Tool removed', result.message || 'Tool removed from collection.');
          return vm.loadCollectionTools(collectionId);
        });
      };

      vm.toggleToolInCollection = function (collectionId, tool) {
        if (!collectionId || !tool) return;
        return api('enableDisableToolInCollection', {
          collectionId: collectionId,
          collectionToolId: tool.collectionToolId || '',
          enabled: !truthy(tool.enabled)
        }).then(function (response) {
          var result = unwrapResult(response);
          tool.enabled = !truthy(tool.enabled);
          vm.notify('success', 'Collection tool updated', result.message || 'Tool state updated in collection.');
        });
      };

      vm.openEditCollectionTool = function (tool) {
        if (!tool || !tool.collectionToolId) {
          vm.notify('warning', 'Collection tool id missing', 'Reload collection tools and try again.');
          return;
        }
        var requestId = ++vm.editCollectionToolSchemaRequestId;
        var initialEpoch = Date.now() + Math.floor(Math.random() * 1000);
        vm.forms.editCollectionTool = defaultEditCollectionToolForm();
        vm.forms.editCollectionTool.request.collectionToolId = tool.collectionToolId;
        vm.forms.editCollectionTool.request.alias = tool.alias || tool.name || '';
        vm.forms.editCollectionTool.request.description = tool.description || '';
        vm.forms.editCollectionTool.request.captureInput = truthy(tool.captureInput);
        vm.forms.editCollectionTool.request.captureOutput = truthy(tool.captureOutput);
        vm.forms.editCollectionTool.request.assertion = {
          success: angular.copy((tool.assertion && tool.assertion.success) || { KeyPath: '', value: '', ignoreCase: false }),
          failed: angular.copy((tool.assertion && tool.assertion.failed) || { KeyPath: '', value: '', ignoreCase: false })
        };
        var currentManagedPayload = angular.copy(tool.managedPayload || {});
        var fallbackSchema = buildFallbackSchema(defaultArguments(tool));
        vm.forms.editCollectionTool.managedPayloadEditor = {
          schema: fallbackSchema,
          model: hydrateModelFromSchema(fallbackSchema, currentManagedPayload),
          expanded: { root: true },
          visible: false,
          error: '',
          openEpoch: initialEpoch
        };
        showModal('editCollectionToolModal');

        $timeout(function () {
          if (!isCurrentEditCollectionToolRequest(requestId, tool.collectionToolId)) {
            return;
          }
          rebuildManagedPayloadFromModel('open-editcollectiontool-initial');
          vm.forms.editCollectionTool.managedPayloadEditor.visible = true;
        }, 0);

        api('getToolUsageDetails', {
          collectionToolId: tool.collectionToolId,
          toolId: tool.toolId || ''
        }, { quietErrors: true }).then(function (response) {
          if (!isCurrentEditCollectionToolRequest(requestId, tool.collectionToolId)) {
            return;
          }
          var details = unwrapResult(response);
          if (details.captureInput !== undefined) {
            vm.forms.editCollectionTool.request.captureInput = truthy(details.captureInput);
          }
          if (details.captureOutput !== undefined) {
            vm.forms.editCollectionTool.request.captureOutput = truthy(details.captureOutput);
          }
          if (details.assertion) {
            vm.forms.editCollectionTool.request.assertion = {
              success: angular.copy(details.assertion.success || { KeyPath: '', value: '', ignoreCase: false }),
              failed: angular.copy(details.assertion.failed || { KeyPath: '', value: '', ignoreCase: false })
            };
          }
          var schema = extractArgumentSchema(details);
          if (hasSchemaFields(schema)) {
            vm.forms.editCollectionTool.managedPayloadEditor.visible = false;
            vm.forms.editCollectionTool.managedPayloadEditor.schema = schema;
            vm.forms.editCollectionTool.managedPayloadEditor.model = hydrateModelFromSchema(schema, currentManagedPayload);
            vm.forms.editCollectionTool.managedPayloadEditor.expanded = { root: true };
            vm.forms.editCollectionTool.managedPayloadEditor.openEpoch = Date.now() + Math.floor(Math.random() * 1000);
            $timeout(function () {
              if (!isCurrentEditCollectionToolRequest(requestId, tool.collectionToolId)) {
                return;
              }
              rebuildManagedPayloadFromModel('open-editcollectiontool-schema-load');
              vm.forms.editCollectionTool.managedPayloadEditor.visible = true;
            }, 0);
            return;
          }

          if (!tool.toolId) {
            vm.forms.editCollectionTool.managedPayloadEditor.visible = false;
            vm.forms.editCollectionTool.managedPayloadEditor.schema = fallbackSchema;
            vm.forms.editCollectionTool.managedPayloadEditor.model = hydrateModelFromSchema(fallbackSchema, currentManagedPayload);
            vm.forms.editCollectionTool.managedPayloadEditor.expanded = { root: true };
            vm.forms.editCollectionTool.managedPayloadEditor.openEpoch = Date.now() + Math.floor(Math.random() * 1000);
            $timeout(function () {
              if (!isCurrentEditCollectionToolRequest(requestId, tool.collectionToolId)) {
                return;
              }
              rebuildManagedPayloadFromModel('open-editcollectiontool-fallback');
              vm.forms.editCollectionTool.managedPayloadEditor.visible = true;
            }, 0);
            return;
          }

          return api('getToolUsageDetails', { toolId: tool.toolId }, { quietErrors: true }).then(function (toolResponse) {
            if (!isCurrentEditCollectionToolRequest(requestId, tool.collectionToolId)) {
              return;
            }
            var toolDetails = unwrapResult(toolResponse);
            if (toolDetails.captureInput !== undefined) {
              vm.forms.editCollectionTool.request.captureInput = truthy(toolDetails.captureInput);
            }
            if (toolDetails.captureOutput !== undefined) {
              vm.forms.editCollectionTool.request.captureOutput = truthy(toolDetails.captureOutput);
            }
            if (toolDetails.assertion) {
              vm.forms.editCollectionTool.request.assertion = {
                success: angular.copy(toolDetails.assertion.success || { KeyPath: '', value: '', ignoreCase: false }),
                failed: angular.copy(toolDetails.assertion.failed || { KeyPath: '', value: '', ignoreCase: false })
              };
            }
            var toolSchema = extractArgumentSchema(toolDetails);
            var resolvedSchema = hasSchemaFields(toolSchema) ? toolSchema : fallbackSchema;
            vm.forms.editCollectionTool.managedPayloadEditor.visible = false;
            vm.forms.editCollectionTool.managedPayloadEditor.schema = resolvedSchema;
            vm.forms.editCollectionTool.managedPayloadEditor.model = hydrateModelFromSchema(resolvedSchema, currentManagedPayload);
            vm.forms.editCollectionTool.managedPayloadEditor.expanded = { root: true };
            vm.forms.editCollectionTool.managedPayloadEditor.openEpoch = Date.now() + Math.floor(Math.random() * 1000);
            $timeout(function () {
              if (!isCurrentEditCollectionToolRequest(requestId, tool.collectionToolId)) {
                return;
              }
              rebuildManagedPayloadFromModel('open-editcollectiontool-tool-schema-load');
              vm.forms.editCollectionTool.managedPayloadEditor.visible = true;
            }, 0);
          });
        }).catch(function () {
          if (!isCurrentEditCollectionToolRequest(requestId, tool.collectionToolId)) {
            return;
          }
          vm.forms.editCollectionTool.managedPayloadEditor.error = 'Schema not available from service. Loaded fallback argument schema.';
          vm.forms.editCollectionTool.managedPayloadEditor.visible = true;
        });
      };

      vm.editCollectionTool = function () {
        var payload = angular.copy(vm.forms.editCollectionTool);
        payload.request.managedPayload = stripEmptyValues((vm.forms.editCollectionTool.managedPayloadEditor || {}).model) || {};
        delete payload.managedPayloadEditor;
        return api('editToolInCollection', payload).then(function (response) {
          var result = unwrapResult(response);
          vm.notify('success', 'Collection tool updated', result.message || 'Tool mapping saved.');
          hideModal('editCollectionToolModal');
          return vm.loadCollectionTools(vm.collectionLookup.id);
        });
      };

      vm.openCloneCollectionTool = function (tool) {
        if (!tool || !tool.collectionToolId) {
          vm.notify('warning', 'Collection tool id missing', 'Reload collection tools and try again.');
          return;
        }
        vm.forms.cloneCollectionTool = defaultCloneCollectionToolForm();
        vm.forms.cloneCollectionTool.request.collectionToolId = tool.collectionToolId;
        vm.forms.cloneCollectionTool.request.newAlias = (tool.alias || tool.name || 'tool') + '-copy';
        vm.forms.cloneCollectionTool.request.description = tool.description || '';
        showModal('cloneCollectionToolModal');
      };

      vm.cloneCollectionTool = function () {
        return api('cloneToolInCollection', angular.copy(vm.forms.cloneCollectionTool)).then(function (response) {
          var result = unwrapResult(response);
          vm.notify('success', 'Collection tool cloned', result.message || 'Collection tool cloned successfully.');
          hideModal('cloneCollectionToolModal');
          return vm.loadCollectionTools(vm.collectionLookup.id);
        });
      };

      vm.editCollectionFromList = function (collection) {
        if (!collection || !collection.collectionId) return;
        vm.collectionLookup.id = collection.collectionId;
        vm.editCollectionWizard();
      };

      vm.cloneCollectionFromList = function (collection) {
        if (!collection || !collection.collectionId) return;
        vm.collectionLookup.id = collection.collectionId;
        vm.openCloneCollection();
      };

      vm.openCloneCollection = function () {
        if (!vm.collectionLookup.id) {
          vm.notify('warning', 'Collection id required', 'Select a collection to clone.');
          return;
        }
        vm.forms.cloneCollection = defaultCloneCollectionForm();
        vm.forms.cloneCollection.request.collectionId = vm.collectionLookup.id;
        vm.forms.cloneCollection.request.newCollectionName = (findCollectionName(vm.collectionLookup.id) || vm.collectionLookup.id) + ' Copy';
        vm.forms.cloneCollection.request.description = findCollectionDescription(vm.collectionLookup.id) || '';
        showModal('cloneCollectionModal');
      };

      vm.cloneCollection = function () {
        return api('cloneToolCollection', angular.copy(vm.forms.cloneCollection)).then(function (response) {
          var result = unwrapResult(response);
          vm.notify('success', 'Collection cloned', result.message || 'Collection cloned successfully.');
          hideModal('cloneCollectionModal');
          vm.collectionLookup.id = result.collectionId || vm.collectionLookup.id;
          return vm.refreshAll();
        });
      };

      vm.openExplorer = function (op) {
        vm.explorer.operation = op;
        vm.explorer.payloadText = '';
        vm.explorer.result = null;
        showModal('explorerModal');
      };

      vm.exportProductDatabase = function () {
        return api('exportMcpNestDatabase', {}).then(function (response) {
          var result = unwrapResult(response);
          vm.productManager.exportResult = result;
          if (result && result.tables) {
            vm.productManager.importPayloadText = JSON.stringify({ request: { tables: result.tables, includeDefaultTerminal: true, defaultTerminalRoot: '' } }, null, 2);
          }
          vm.notify('success', 'Export complete', (result && result.message) || 'MCP Nest database export completed.');
        });
      };

      vm.useExportForImport = function () {
        var result = vm.productManager.exportResult;
        if (!result || !result.tables) {
          vm.notify('warning', 'No export found', 'Run Export first to prefill import payload.');
          return;
        }
        vm.productManager.importPayloadText = JSON.stringify({ request: { tables: result.tables, includeDefaultTerminal: true, defaultTerminalRoot: '' } }, null, 2);
        vm.notify('info', 'Import payload prepared', 'Import request has been populated from latest export result.');
      };

      vm.importProductDatabase = function () {
        var payload;
        try {
          payload = JSON.parse(vm.productManager.importPayloadText || '{}');
        } catch (e) {
          vm.notify('warning', 'Invalid import JSON', e.message);
          return;
        }

        return api('importMcpNestDatabase', payload).then(function (response) {
          var result = unwrapResult(response);
          vm.productManager.importResult = result;
          vm.notify('success', 'Import complete', (result && result.message) || 'MCP Nest database import completed.');
          return vm.refreshAll();
        });
      };

      vm.recreateProductDatabase = function () {
        var payload = {
          request: {
            includeDefaultTerminal: truthy(vm.productManager.recreate.includeDefaultTerminal),
            defaultTerminalRoot: vm.productManager.recreate.defaultTerminalRoot || ''
          }
        };

        return api('recreateMcpNestDatabase', payload).then(function (response) {
          var result = unwrapResult(response);
          vm.productManager.recreate.result = result;
          vm.notify('success', 'Database recreated', (result && result.message) || 'MCP Nest database recreated.');
          return vm.refreshAll();
        });
      };

      vm.migrateProductDatabase = function () {
        var payload = {
          request: {
            includeDefaultTerminal: truthy(vm.productManager.migrate.includeDefaultTerminal),
            defaultTerminalRoot: vm.productManager.migrate.defaultTerminalRoot || ''
          }
        };

        return api('migrateMcpNestDatabase', payload).then(function (response) {
          var result = unwrapResult(response);
          vm.productManager.migrate.result = result;
          vm.notify('success', 'Migration complete', (result && result.message) || 'MCP Nest database migration completed.');
          return vm.refreshAll();
        });
      };

      vm.purgeToolLogs = function () {
        var retainDays = Number(vm.productManager.purge.retainDays);
        if (!Number.isFinite(retainDays) || retainDays < 0) {
          vm.notify('warning', 'Invalid retention', 'Retain days should be 0 or greater.');
          return;
        }
        return api('purgeToolCallLogs', { request: { retainDays: retainDays } }).then(function (response) {
          var result = unwrapResult(response);
          vm.productManager.purge.result = result;
          vm.notify('success', 'Logs purged', result.message || 'Tool call logs purged.');
        });
      };

      vm.runExplorer = function () {
        var payload;
        try {
          payload = JSON.parse(vm.explorer.payloadText || '{}');
        } catch (e) {
          vm.notify('danger', 'Invalid JSON', e.message);
          return;
        }
        return api(vm.explorer.operation.operationId, payload).then(function (response) {
          vm.explorer.result = response;
          vm.notify('success', 'Request complete', vm.explorer.operation.operationId + ' returned successfully.');
        });
      };

      vm.openDashboard = function () {
        vm.tab = 'dashboard';
        if (!vm.dashboard.stack.length) {
          vm.dashboard.stack.push({ level: 'overview', label: 'Overview', params: {} });
        }
        if (!vm.dashboard.current.data || (!vm.dashboard.current.data.totalTransactions && vm.dashboard.current.level === 'overview' && !vm.dashboard.current.loading)) {
          loadDashboardLevel(vm.dashboard.stack[vm.dashboard.stack.length - 1]);
        }
      };

      vm.setDashboardZoom = function (zoomLevel) {
        vm.dashboard.zoom.zoomLevel = zoomLevel;
        if (zoomLevel !== 'custom') {
          vm.dashboard.zoom.startDate = '';
          vm.dashboard.zoom.endDate = '';
        }
        reloadCurrentDashboardStack();
      };

      vm.applyDashboardZoom = function () {
        if (vm.dashboard.zoom.zoomLevel !== 'custom') return;
        if (!vm.dashboard.zoom.startDate) return;
        var start = new Date(vm.dashboard.zoom.startDate);
        var end = vm.dashboard.zoom.endDate ? new Date(vm.dashboard.zoom.endDate) : new Date();
        if (start > end) return;
        reloadCurrentDashboardStack();
      };

      vm.drillDashboard = function (targetLevel, item) {
        if (!item) return;
        var params = buildDashboardParams(targetLevel, item);
        var label = '';
        if (targetLevel === 'mcp') label = item.mcpAlias || item.mcpName || item.mcpId;
        else if (targetLevel === 'collection') label = item.collectionName || item.collectionId;
        else if (targetLevel === 'tool') label = item.alias || item.toolName || item.collectionToolId;
        if (targetLevel === 'tool') {
          vm.dashboard.toolLogStatus = 'all';
        }
        vm.dashboard.stack.push({ level: targetLevel, label: label, params: params, item: angular.copy(item) });
        loadDashboardLevel(vm.dashboard.stack[vm.dashboard.stack.length - 1]);
      };

      vm.popDashboard = function () {
        if (vm.dashboard.stack.length <= 1) return;
        vm.dashboard.stack.pop();
        loadDashboardLevel(vm.dashboard.stack[vm.dashboard.stack.length - 1]);
      };

      vm.popDashboardTo = function (index) {
        if (index < 0 || index >= vm.dashboard.stack.length) return;
        if (index === vm.dashboard.stack.length - 1) return;
        vm.dashboard.stack = vm.dashboard.stack.slice(0, index + 1);
        loadDashboardLevel(vm.dashboard.stack[vm.dashboard.stack.length - 1]);
      };

      vm.reloadDashboardCurrent = function () {
        if (!vm.dashboard.stack.length) return;
        loadDashboardLevel(vm.dashboard.stack[vm.dashboard.stack.length - 1]);
      };

      vm.setToolLogStatus = function (status) {
        if (vm.dashboard.toolLogStatus === status) return;
        vm.dashboard.toolLogStatus = status;
        var top = vm.dashboard.stack[vm.dashboard.stack.length - 1];
        if (top && top.level === 'tool') {
          loadDashboardLevel(top);
        }
      };

      vm.dashboardItemsWithTransactions = function (items) {
        return (items || []).filter(function (item) {
          return Number(item && item.totalTransactions || 0) > 0;
        });
      };

      vm.dashboardSelectedRangeLabel = function () {
        var zoom = vm.dashboard.zoom || {};
        if (zoom.zoomLevel === 'custom') {
          if (!zoom.startDate && !zoom.endDate) return 'custom range';
          if (zoom.startDate && zoom.endDate) return zoom.startDate + ' to ' + zoom.endDate;
          return zoom.startDate ? ('from ' + zoom.startDate) : ('up to ' + zoom.endDate);
        }
        if (zoom.zoomLevel === '1day') return 'last 1 day';
        if (zoom.zoomLevel === '1week') return 'last 1 week';
        if (zoom.zoomLevel === '1month') return 'last 1 month';
        return zoom.zoomLevel || 'selected range';
      };

      vm.dashboardNoDataNote = function () {
        return 'No transactions during the selected date range (' + vm.dashboardSelectedRangeLabel() + ').';
      };

      function reloadCurrentDashboardStack() {
        var top = vm.dashboard.stack[vm.dashboard.stack.length - 1];
        if (top) loadDashboardLevel(top);
      }

      function buildDashboardParams(level, item) {
        var params = {};
        if (level === 'mcp') params.mcpId = item.mcpId;
        else if (level === 'collection') params.collectionId = item.collectionId;
        else if (level === 'tool') {
          if (item.collectionToolId) params.collectionToolId = item.collectionToolId;
          else if (item.toolId) params.toolId = item.toolId;
        }
        return params;
      }

      function buildDashboardRequest(top) {
        var req = angular.extend({}, vm.dashboard.zoom, top.params || {});
        if (top.level === 'tool' && vm.dashboard.toolLogStatus && vm.dashboard.toolLogStatus !== 'all') {
          req.status = vm.dashboard.toolLogStatus;
        }
        if (req.zoomLevel !== 'custom') {
          delete req.startDate;
          delete req.endDate;
        } else {
          if (req.startDate) req.startDate = toIso(req.startDate);
          if (req.endDate) req.endDate = toIso(req.endDate);
          else delete req.endDate;
        }
        return req;
      }

      function toIso(value) {
        if (!value) return '';
        var d = new Date(value);
        if (isNaN(d.getTime())) return value;
        return d.toISOString();
      }

      function loadDashboardLevel(top) {
        if (!top) return;
        destroyDashboardCharts();
        vm.dashboard.current = {
          level: top.level,
          label: top.label,
          params: angular.copy(top.params || {}),
          data: {},
          loading: true,
          error: '',
          chartInstances: []
        };
        var requestId = ++vm.dashboard.chartRequestId;
        var request = { request: buildDashboardRequest(top) };
        return api('getDashboardStats', request, { quietErrors: true }).then(function (response) {
          if (requestId !== vm.dashboard.chartRequestId) return;
          var payload = unwrapResult(response) || {};
          vm.dashboard.current.data = payload;
          syncSidebarCounts(payload);
          vm.dashboard.current.loading = false;
          vm.dashboard.current.error = '';
          $timeout(function () {
            if (requestId !== vm.dashboard.chartRequestId) return;
            renderDashboardCharts(top);
          }, 0);
        }).catch(function (error) {
          if (requestId !== vm.dashboard.chartRequestId) return;
          vm.dashboard.current.loading = false;
          vm.dashboard.current.error = (error && error.message) || 'Unable to load dashboard data.';
        });
      }

      function destroyDashboardCharts() {
        var instances = (vm.dashboard.current && vm.dashboard.current.chartInstances) || [];
        instances.forEach(function (chart) {
          try { chart.destroy(); } catch (e) { /* ignore */ }
        });
        if (vm.dashboard.current) vm.dashboard.current.chartInstances = [];
      }

      function renderDashboardCharts(top) {
        if (typeof window.Chart === 'undefined') return;
        var data = vm.dashboard.current.data || {};
        var prefix = '';
        if (top.level === 'overview') prefix = '';
        else if (top.level === 'mcp') prefix = 'mcp-col-';
        else if (top.level === 'collection') prefix = 'collection-tool-';

        if (top.level === 'overview') {
          renderOverviewMcpCharts(vm.dashboardItemsWithTransactions(data.mcps || []));
          renderOverviewCollectionCharts(vm.dashboardItemsWithTransactions(data.collections || []));
        } else if (top.level === 'mcp') {
          renderItemCharts('mcp-col-', vm.dashboardItemsWithTransactions(data.collections || []));
          renderItemCharts('mcp-tool-', vm.dashboardItemsWithTransactions(data.tools || []));
        } else if (top.level === 'collection') {
          renderItemCharts(prefix, vm.dashboardItemsWithTransactions(data.tools || []));
        }
      }

      function renderOverviewMcpCharts(mcps) {
        mcps.forEach(function (mcp, index) {
          var canvasId = 'overview-mcp-' + index;
          renderNestedDonut(canvasId, mcp, mcp.mcpAlias || mcp.mcpName || mcp.mcpId, mcp.successCount, mcp.failureCount);
        });
      }

      function renderOverviewCollectionCharts(collections) {
        collections.forEach(function (col, index) {
          var canvasId = 'overview-col-' + index;
          renderNestedDonut(canvasId, col, col.collectionName || col.collectionId, col.successCount, col.failureCount);
        });
      }

      function renderItemCharts(idPrefix, items) {
        items.forEach(function (item, index) {
          var label = item.alias || item.collectionName || item.mcpAlias || item.toolName || ('item-' + index);
          var canvasId = idPrefix + index;
          renderNestedDonut(canvasId, item, label, item.successCount, item.failureCount);
        });
      }

      function renderNestedDonut(canvasId, item, label, successCount, failureCount) {
        var canvas = document.getElementById(canvasId);
        if (!canvas || typeof window.Chart === 'undefined') return;
        var safeSuccess = Number(successCount || 0);
        var safeFailure = Number(failureCount || 0);
        var total = safeSuccess + safeFailure;
        if (total <= 0) {
          renderEmptyChart(canvas, label);
          return;
        }
        var baseColor = colorFromLabel(label);
        var successColor = colorFromLabel(label, 65, 78);
        var failureColor = colorFromLabel(label, 15, 62);
        var ctx = canvas.getContext('2d');
        var chart = new window.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Success', 'Failure'],
            datasets: [{
              data: [safeSuccess, safeFailure],
              backgroundColor: [successColor, failureColor],
              borderColor: [baseColor, baseColor],
              borderWidth: 1.5,
              hoverOffset: 6,
              weight: 1,
              spacing: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(20, 22, 30, 0.94)',
                padding: 12,
                cornerRadius: 8,
                titleFont: { weight: '700', size: 13 },
                bodyFont: { size: 12 },
                callbacks: {
                  title: function (items) {
                    if (!items || !items.length) return label;
                    var pct = total > 0 ? ((items[0].parsed / total) * 100).toFixed(1) : '0';
                    return items[0].label + ' \u2014 ' + pct + '%';
                  },
                  label: function (context) {
                    var lines = [];
                    lines.push('Count: ' + context.parsed);
                    if (item.mcpAlias) lines.push('MCP: ' + item.mcpAlias);
                    if (item.mcpName && item.mcpName !== item.mcpAlias) lines.push('MCP name: ' + item.mcpName);
                    if (item.collectionName) lines.push('Collection: ' + item.collectionName);
                    if (item.alias) lines.push('Alias: ' + item.alias);
                    if (item.toolName && item.toolName !== item.alias) lines.push('Tool: ' + item.toolName);
                    if (item.description) lines.push('Description: ' + item.description);
                    lines.push('Total transactions: ' + (item.totalTransactions || total));
                    lines.push('Success: ' + (item.successCount || safeSuccess));
                    lines.push('Failures: ' + (item.failureCount || safeFailure));
                    if (item.transactionPercent !== undefined) lines.push('Share: ' + Number(item.transactionPercent).toFixed(1) + '%');
                    if (item.successPercent !== undefined) lines.push('Success rate: ' + Number(item.successPercent).toFixed(1) + '%');
                    if (item.failurePercent !== undefined) lines.push('Failure rate: ' + Number(item.failurePercent).toFixed(1) + '%');
                    return lines;
                  }
                }
              }
            },
            animation: { duration: 250 }
          }
        });
        vm.dashboard.current.chartInstances.push(chart);
      }

      function renderEmptyChart(canvas, label) {
        var ctx = canvas.getContext('2d');
        var chart = new window.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['No data'],
            datasets: [{
              data: [1],
              backgroundColor: ['rgba(120, 130, 150, 0.18)'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: { title: function () { return label; }, label: function () { return 'No transactions'; } }
              }
            },
            animation: { duration: 0 }
          }
        });
        vm.dashboard.current.chartInstances.push(chart);
      }

      function colorFromLabel(label, saturation, lightness) {
        var sat = saturation === undefined ? 62 : saturation;
        var light = lightness === undefined ? 56 : lightness;
        var hash = 0;
        var str = String(label == null ? '' : label);
        for (var i = 0; i < str.length; i++) {
          hash = (hash * 31 + str.charCodeAt(i)) | 0;
        }
        var hue = Math.abs(hash) % 360;
        return 'hsl(' + hue + ', ' + sat + '%, ' + light + '%)';
      }

      vm.openMcps = function (force) {
        vm.tab = 'mcps';
        vm.loadMcpCategories();
        return ensureMcpsLoaded(Boolean(force));
      };

      vm.reloadMcpsList = function () {
        return ensureMcpsLoaded(true);
      };

      vm.openCollections = function (force) {
        vm.tab = 'collections';
        return ensureCollectionsLoaded(Boolean(force));
      };

      vm.reloadCollectionsList = function () {
        return ensureCollectionsLoaded(true);
      };

      vm.refreshDashboard = function () {
        if (vm.dashboard.stack.length) {
          loadDashboardLevel(vm.dashboard.stack[vm.dashboard.stack.length - 1]);
        }
      };

      vm.openOAuthManager = function (force) {
        vm.tab = 'oauth';
        vm.loadOAuthCategories();
        force = Boolean(force);
        var loadSetups = force || !vm.loadedTabs.oauth;
        var loadMappings = force || !vm.loadedTabs.mappingProfiles;
        var setupPromise = loadSetups ? vm.listOAuthSetups() : $q.when(vm.oauth.setups || []);
        var mappingPromise = loadMappings ? vm.listMappingProfiles() : $q.when(vm.mappingProfiles.profiles || []);
        if (vm.oauth.activeTab === 'tokens' && (force || !vm.oauth.tokens.length) && !vm.oauth.tokensLoading) {
          vm.listOAuthTokens();
        }
        vm.loadedTabs.oauth = true;
        vm.loadedTabs.mappingProfiles = true;
        return $q.all([setupPromise, mappingPromise]);
      };

      vm.openInterceptors = function () {
        vm.tab = 'interceptors';
        vm.listInterceptors();
      };

      vm.listInterceptors = function () {
        vm.interceptors.loading = true;
        vm.interceptors.error = '';
        return api('getInterceptorApi', { request: {} }).then(function (response) {
          var result = unwrapResult(response);
          vm.interceptors.list = Array.isArray(result) ? result : [];
          vm.interceptors.loading = false;
        }).catch(function (error) {
          vm.interceptors.loading = false;
          vm.interceptors.error = (error && error.message) || 'Failed to load interceptors.';
        });
      };

      vm.filteredInterceptors = function () {
        var q = lower(vm.interceptors.filter);
        if (!q) return vm.interceptors.list;
        return vm.interceptors.filter(function (item) {
          return [item.apiId, item.direction, item.mcpToolId, item.apiText].some(function (v) {
            return lower(v).indexOf(q) >= 0;
          });
        });
      };

      vm.selectInterceptor = function (interceptor) {
        vm.interceptors.selected = interceptor;
      };

      vm.startAddInterceptor = function () {
        vm.interceptors.editMode = false;
        vm.interceptors.form = { apiId: '', mcpToolId: '', apiText: '', direction: 'input' };
        showModal('addInterceptorModal');
      };

      vm.editInterceptor = function (interceptor) {
        if (!interceptor) return;
        vm.interceptors.editMode = true;
        vm.interceptors.form = {
          apiId: interceptor.apiId || '',
          mcpToolId: interceptor.mcpToolId || '',
          apiText: interceptor.apiText || '',
          direction: interceptor.direction || 'input'
        };
        showModal('addInterceptorModal');
      };

      vm.saveInterceptor = function () {
        var payload = { request: angular.copy(vm.interceptors.form) };
        var operation = vm.interceptors.editMode ? 'updateInterceptorApi' : 'addInterceptorApi';
        return api(operation, payload).then(function (response) {
          var result = unwrapResult(response);
          vm.notify('success', vm.interceptors.editMode ? 'Interceptor updated' : 'Interceptor added', result.message || 'Interceptor saved successfully.');
          hideModal('addInterceptorModal');
          vm.listInterceptors();
        });
      };

      vm.deleteInterceptor = function (interceptor) {
        if (!interceptor || !interceptor.apiId) return;
        vm.showDeleteConfirm('Delete interceptor "' + interceptor.apiId + '"? This action cannot be undone.', function () {
          return api('deleteInterceptorApi', { request: { apiId: interceptor.apiId } }).then(function (response) {
            var result = unwrapResult(response);
            vm.notify('success', 'Interceptor deleted', result.message || 'Interceptor deleted successfully.');
            if (vm.interceptors.selected && vm.interceptors.selected.apiId === interceptor.apiId) {
              vm.interceptors.selected = null;
            }
            vm.listInterceptors();
          });
        });
      };

      vm.mergeDefaultOAuthCatalog = function () {
        return api('mergeDefaultOAuthCatalog', { request: {} }).then(function (response) {
          var result = unwrapResult(response) || {};
          vm.notify('success', 'OAuth catalog merged', result.message || 'Default OAuth catalog merged successfully.');
          return $q.all([vm.listOAuthSetups(), vm.listMcps(), vm.listMappingProfiles()]);
        });
      };

      vm.openMappingProfiles = function (force) {
        vm.tab = 'mappingProfiles';
        if (Boolean(force) || !vm.loadedTabs.mappingProfiles) {
          vm.loadedTabs.mappingProfiles = true;
          return vm.listMappingProfiles();
        }
        return $q.when(vm.mappingProfiles.profiles || []);
      };

      vm.setOAuthTab = function (tabId) {
        vm.oauth.activeTab = tabId;
        if (tabId === 'setups' && !vm.oauth.setups.length && !vm.oauth.setupsLoading) {
          vm.listOAuthSetups();
        }
      };

      vm.filteredOAuthSetups = function () {
        var q = lower(vm.oauth.filterKeyword);
        var list = vm.oauth.setups || [];
        if (vm.filters.oauthActive === 'active') {
          list = list.filter(function (s) { return truthy(s.ready); });
        } else if (vm.filters.oauthActive === 'inactive') {
          list = list.filter(function (s) { return !truthy(s.ready); });
        }
        if (!q) return list;
        return list.filter(function (setup) {
          var categories = vm.oauthSetupCategories(setup).join(' ');
          return [setup.uniqueName, setup.providerName, setup.appName, setup.baseEndpoint, setup.authorizeUrl, setup.redirectUri, setup.status, setup.mappingProfileId, setup.mappingProfileName, categories]
            .some(function (value) { return lower(value).indexOf(q) >= 0; });
        });
      };

      vm.filteredMappingProfiles = function () {
        var q = lower(vm.mappingProfiles.filterKeyword);
        if (!q) return vm.mappingProfiles.profiles;
        return vm.mappingProfiles.profiles.filter(function (profile) {
          return [
            vm.pickProfileField(profile, 'profileName'),
            vm.pickProfileField(profile, 'providerCode'),
            vm.pickProfileField(profile, 'description'),
            vm.pickProfileField(profile, 'status')
          ]
            .some(function (value) { return lower(value).indexOf(q) >= 0; });
        });
      };

      vm.selectMappingProfile = function (profile) {
        vm.mappingProfiles.selected = profile || null;
      };

      vm.pickProfileField = function (profile, field) {
        if (!profile) return '';
        var record = normalizeMappingProfileRecord(profile);
        if (record && record[field]) return record[field];
        return '';
      };

      vm.listMappingProfiles = function () {
        vm.mappingProfiles.loading = true;
        vm.mappingProfiles.error = '';
        return api('listOAuthMappingProfiles', { keywords: tokenize(vm.mappingProfiles.filterKeyword) }).then(function (response) {
          var result = unwrapResult(response);
          vm.mappingProfiles.profiles = extractMappingProfiles(result);
          if (!vm.mappingProfiles.selected && vm.mappingProfiles.profiles.length) {
            vm.mappingProfiles.selected = vm.mappingProfiles.profiles[0];
          } else if (vm.mappingProfiles.selected) {
            var selectedId = vm.pickProfileField(vm.mappingProfiles.selected, 'profileId') || vm.pickProfileField(vm.mappingProfiles.selected, 'profileName');
            vm.mappingProfiles.selected = vm.mappingProfiles.profiles.filter(function (profile) {
              return (vm.pickProfileField(profile, 'profileId') || vm.pickProfileField(profile, 'profileName')) === selectedId;
            })[0] || vm.mappingProfiles.profiles[0] || null;
          }
          vm.mappingProfiles.loading = false;
          recordOAuthResponse('listOAuthMappingProfiles', response);
        }).catch(function (error) {
          vm.mappingProfiles.loading = false;
          vm.mappingProfiles.error = (error && error.message) || 'Failed to load mapping profiles.';
        });
      };

      vm.openAddMappingProfile = function () {
        vm.mappingProfiles.form = defaultMappingProfileForm();
        vm.mappingProfiles.formMode = 'add';
        vm.mappingProfiles.formError = '';
        vm.mappingProfiles.formBusy = false;
        showModal('mappingProfileModal');
      };

      vm.openEditMappingProfile = function (profile) {
        var target = profile || vm.mappingProfiles.selected;
        if (!target) return;
        vm.mappingProfiles.selected = target;
        populateMappingProfileForm(target);
        vm.mappingProfiles.formMode = 'edit';
        vm.mappingProfiles.formError = '';
        vm.mappingProfiles.formBusy = false;
        showModal('mappingProfileModal');
        var profileId = vm.pickProfileField(target, 'profileId') || vm.pickProfileField(target, 'mappingProfileId');
        var profileName = vm.pickProfileField(target, 'profileName');
        if (profileId || profileName) {
          api('getOAuthMappingProfile', { request: { profileId: profileId, profileName: profileName } }, { quietErrors: true }).then(function (response) {
            var result = unwrapResult(response) || response;
            populateMappingProfileForm(extractSingleMappingProfile(result));
            vm.mappingProfiles.formMode = 'edit';
            recordOAuthResponse('getOAuthMappingProfile', response);
          }).catch(function () { /* keep list record */ });
        }
      };

      vm.saveMappingProfile = function () {
        if (vm.mappingProfiles.formBusy) return;
        var form = vm.mappingProfiles.form;
        if (!form.profileName || !form.providerCode) {
          vm.mappingProfiles.formError = 'Profile name and provider code are required.';
          return;
        }
        var payload;
        try {
          payload = buildMappingProfilePayload(form);
        } catch (e) {
          vm.mappingProfiles.formError = e.message || 'Invalid mapping JSON.';
          return;
        }
        var opId = vm.mappingProfiles.formMode === 'edit' ? 'editOAuthMappingProfile' : 'addOAuthMappingProfile';
        vm.mappingProfiles.formBusy = true;
        vm.mappingProfiles.formError = '';
        return api(opId, payload).then(function (response) {
          vm.mappingProfiles.formBusy = false;
          recordOAuthResponse(opId, response);
          var result = unwrapResult(response) || {};
          vm.notify('success', vm.mappingProfiles.formMode === 'edit' ? 'Mapping profile updated' : 'Mapping profile created',
            result.message || (form.profileName + ' saved.'));
          hideModal('mappingProfileModal');
          return vm.listMappingProfiles();
        }).catch(function (error) {
          vm.mappingProfiles.formBusy = false;
          vm.mappingProfiles.formError = (error && error.message) || 'Failed to save mapping profile.';
        });
      };

      vm.deleteMappingProfile = function (profile) {
        var profileId = vm.pickProfileField(profile, 'profileId') || vm.pickProfileField(profile, 'mappingProfileId') || vm.pickProfileField(profile, 'profileName');
        var name = vm.pickProfileField(profile, 'profileName') || profileId;
        if (!profileId) {
          vm.notify('warning', 'Missing profile id', 'Cannot delete this mapping profile.');
          return;
        }
        vm.showDeleteConfirm('Delete mapping profile "' + name + '"? This cannot be undone.', function () {
          return api('deleteOAuthMappingProfile', { request: { profileId: profileId, profileName: name } }).then(function (response) {
            recordOAuthResponse('deleteOAuthMappingProfile', response);
            var result = unwrapResult(response) || {};
            vm.notify('success', 'Mapping profile deleted', result.message || (name + ' removed.'));
            if (vm.mappingProfiles.selected === profile) vm.mappingProfiles.selected = null;
            return vm.listMappingProfiles();
          });
        });
      };

      vm.pickOAuthField = function (setup, field) {
        if (!setup) return '';
        if (setup[field]) return setup[field];
        if (setup.setup && setup.setup[field]) return setup.setup[field];
        return '';
      };

      vm.oauthSetupCategories = function (setup) {
        if (!setup) return [];
        if (Array.isArray(setup.categories)) return setup.categories;
        if (setup.setup && Array.isArray(setup.setup.categories)) return setup.setup.categories;
        return [];
      };

      vm.isOAuthSetupReady = function (setup) {
        if (!setup) return false;
        if (setup.ready !== undefined && setup.ready !== null) return truthy(setup.ready);
        if (setup.setup && setup.setup.ready !== undefined && setup.setup.ready !== null) return truthy(setup.setup.ready);
        if (setup.extraAuthParams && setup.extraAuthParams.ready !== undefined && setup.extraAuthParams.ready !== null) {
          return truthy(setup.extraAuthParams.ready);
        }
        return false;
      };

      vm.oauthTokenIdentity = function (token) {
        if (!token) return {};
        var info = token.tokenInformation || token.token_information || token.identity || token.information || {};
        info = parseMessageData(info) || {};
        return typeof info === 'object' ? info : {};
      };

      vm.trimOAuthEndpoint = function (url, baseEndpoint) {
        if (!url) return '';
        var value = String(url);
        var base = baseEndpoint ? String(baseEndpoint).replace(/\/+$/, '') : '';
        if (base && lower(value).indexOf(lower(base)) === 0) {
          value = value.substring(base.length);
        }
        return value.replace(/^\/+/, '');
      };

      vm.listOAuthSetups = function () {
        vm.oauth.setupsLoading = true;
        vm.oauth.setupsError = '';
        var payload = { keywords: tokenize(vm.oauth.filterKeyword) };
        if (vm.categoryFilter.selectedOAuthCategories.length) payload.categories = vm.categoryFilter.selectedOAuthCategories;
        return api('listOAuthSetups', payload).then(function (response) {
          var result = unwrapResult(response);
          vm.oauth.setups = asArray(result).map(normalizeOAuthSetupRecord);
          vm.oauth.setupsLoading = false;
          recordOAuthResponse('listOAuthSetups', response);
        }).catch(function (error) {
          vm.oauth.setupsLoading = false;
          vm.oauth.setupsError = (error && error.message) || 'Failed to load OAuth setups.';
        });
      };

      vm.openAddOAuthSetup = function () {
        vm.oauth.selectedSetup = null;
        var defaults = defaultOAuthSetupForm();
        defaults.baseEndpoint = buildOAuthBaseEndpoint();
        vm.oauth.form = defaults;
        vm.oauth.formMode = 'add';
        vm.oauth.formError = '';
        vm.oauth.savedAuthorizeUrl = '';
        vm.oauth.savedRedirectUri = '';
        vm.oauth.collapsed = { 'setup-details': false, endpoints: true, credentials: true, 'token-mapping': true, advanced: true };
        vm.oauthCategoryPicker.selected = [];
        vm.oauthCategoryPicker.newCategory = '';
        vm.loadOAuthFormCategories();
        if (!vm.mappingProfiles.profiles.length && !vm.mappingProfiles.loading) vm.listMappingProfiles();
        showModal('oauthEditModal');
      };

      function populateOAuthSetupForm(setup) {
        var setupRecord = (setup && setup.setup) || setup || {};
        var categories = normalizeCategories(setupRecord.categories || setup.categories || []);
        vm.oauth.form = {
          uniqueName: setupRecord.uniqueName || setup.uniqueName || '',
          providerName: setupRecord.providerName || setup.providerName || '',
          appName: setupRecord.appName || setup.appName || '',
          appLogo: setupRecord.appLogo || setup.appLogo || '',
          privacyPolicyUrl: setupRecord.privacyPolicyUrl || setup.privacyPolicyUrl || '',
          baseEndpoint: setupRecord.baseEndpoint || setup.baseEndpoint || '',
          wellKnownUrl: setupRecord.wellKnownUrl || setup.wellKnownUrl || '',
          clientId: setupRecord.clientId || setup.clientId || '',
          clientSecret: setupRecord.clientSecret || setup.clientSecret || '',
          authorizationUrl: setupRecord.authorizationUrl || setup.authorizationUrl || '',
          tokenUrl: setupRecord.tokenUrl || setup.tokenUrl || '',
          scopes: Array.isArray(setupRecord.scopes) ? setupRecord.scopes.join(' ') : (setupRecord.scopes || ''),
          grantTypes: Array.isArray(setupRecord.grantTypes) ? setupRecord.grantTypes.join(',') : (setupRecord.grantTypes || 'authorization_code'),
          status: setupRecord.status || setup.status || 'active',
          mappingProfileId: setupRecord.mappingProfileId || setup.mappingProfileId || setupRecord.mapping_profile_id || setup.mapping_profile_id || '',
          tokenUsage: setupRecord.tokenUsage ? JSON.stringify(setupRecord.tokenUsage, null, 2) : defaultTokenUsageText(),
          extraAuthParams: setupRecord.extraAuthParams ? JSON.stringify(setupRecord.extraAuthParams, null, 2) : '',
          categoriesText: categories.join(', ')
        };
        vm.oauth.savedAuthorizeUrl = setup && setup.authorizeUrl ? setup.authorizeUrl : '';
        vm.oauth.savedRedirectUri = setup && setup.redirectUri ? setup.redirectUri : '';
      }

      vm.selectOAuthSetup = function (setup) {
        if (!setup) return;
        vm.oauth.selectedSetup = setup;
        vm.oauth.viewSetup = setup;
        if (vm.oauth.tokenFilter) {
          vm.oauth.tokenFilter.uniqueName = vm.pickOAuthField(setup, 'uniqueName') || setup.uniqueName || '';
        }
        var selectedUniqueName = vm.pickOAuthField(setup, 'uniqueName') || setup.uniqueName || '';
        if (selectedUniqueName) {
          vm.getOAuthSetup(selectedUniqueName, { quietErrors: true }).then(function (fullSetup) {
            if (!fullSetup) return;
            var currentUniqueName = vm.oauth.selectedSetup && (vm.pickOAuthField(vm.oauth.selectedSetup, 'uniqueName') || vm.oauth.selectedSetup.uniqueName);
            if (currentUniqueName === selectedUniqueName) {
              vm.oauth.selectedSetup = fullSetup;
              vm.oauth.viewSetup = fullSetup;
              updateOAuthSetupInList(fullSetup);
            }
          }).catch(function () { /* keep list entry */ });
        }
        return vm.listOAuthTokens();
      };

      vm.getOAuthSetup = function (name, options) {
        options = options || {};
        var uniqueName = name || (vm.oauth.selectedSetup && (vm.pickOAuthField(vm.oauth.selectedSetup, 'uniqueName') || vm.oauth.selectedSetup.uniqueName));
        if (!uniqueName) return $q.when(null);
        var categories = normalizeCategories(options.categories || (vm.oauth.selectedSetup && vm.oauthSetupCategories(vm.oauth.selectedSetup)) || [], ['MCPNEST_MCP_OAUTH']);
        return api('getOAuthSetup', { request: { name: uniqueName, uniqueName: uniqueName, categories: categories } }, { quietErrors: Boolean(options.quietErrors) }).then(function (response) {
          var result = unwrapResult(response) || {};
          recordOAuthResponse('getOAuthSetup', response);
          var merged = normalizeOAuthSetupRecord(angular.extend({}, result, result.setup || {}));
          if (!merged.uniqueName) merged.uniqueName = uniqueName;
          return merged;
        });
      };

      vm.openEditOAuthSetup = function (setup) {
        var target = setup || vm.oauth.selectedSetup;
        if (!target) return;
        if (!vm.oauth.selectedSetup || (vm.oauth.selectedSetup.uniqueName || vm.oauth.selectedSetup.oauthId) !== (target.uniqueName || target.oauthId)) {
          vm.oauth.selectedSetup = target;
          vm.oauth.viewSetup = target;
        }
        populateOAuthSetupForm(target);
        var setupRecord = (target && target.setup) || target || {};
        var categories = normalizeCategories(setupRecord.categories || target.categories || []);
        vm.oauthCategoryPicker.selected = categories.slice();
        vm.oauthCategoryPicker.newCategory = '';
        vm.loadOAuthFormCategories();
        vm.oauth.formMode = 'edit';
        vm.oauth.formError = '';
        vm.oauth.formBusy = false;
        vm.oauth.collapsed = { 'setup-details': false, endpoints: true, credentials: true, 'token-mapping': true, advanced: true };
        if (!vm.mappingProfiles.profiles.length && !vm.mappingProfiles.loading) vm.listMappingProfiles();
        showModal('oauthEditModal');
      };

      vm.cancelOAuthEditModal = function () {
        hideModal('oauthEditModal');
      };

      vm.openAuthorizeOAuthSetup = function (setup) {
        var target = setup || vm.oauth.selectedSetup;
        if (target) {
          vm.oauth.testForm.name = target.uniqueName || target.name || '';
        }
        showModal('oauthAuthorizeModal');
      };

      vm.openOAuthCallback = function (setup) {
        var target = setup || vm.oauth.selectedSetup;
        if (target) {
          vm.oauth.callbackForm.name = target.uniqueName || target.name || '';
        }
        vm.oauth.callbackResult = null;
        showModal('oauthCallbackModal');
      };

      vm.clearSelectedSetupAndReloadTokens = function () {
        vm.oauth.selectedSetup = null;
        vm.oauth.viewSetup = null;
        if (vm.oauth.tokenFilter) vm.oauth.tokenFilter.uniqueName = '';
        return vm.listOAuthTokens();
      };

      vm.onOauthFlowComplete = function (result) {
        if (result && result.token) {
          vm.notify('success', 'Token issued', 'Token ' + (result.token.tokenId || '') + ' is now active.');
          return vm.listOAuthTokens();
        }
        return $q.when();
      };

      vm.toggleOAuthSection = function (key) {
        if (!vm.oauth.collapsed) vm.oauth.collapsed = {};
        vm.oauth.collapsed[key] = !vm.oauth.collapsed[key];
      };

      function showOauthProgress() {
        try {
          if ($scope.$$phase) {
            $scope.$evalAsync(function () {
              try {
                var el = document.getElementById('oauthProgressModal');
                if (!el || !$window.bootstrap) return;
                var inst = $window.bootstrap.Modal.getOrCreateInstance(el);
                inst.show();
              } catch (e) { /* ignore */ }
            });
          } else {
            try {
              var el = document.getElementById('oauthProgressModal');
              if (!el || !$window.bootstrap) return;
              var inst = $window.bootstrap.Modal.getOrCreateInstance(el);
              inst.show();
            } catch (e) { /* ignore */ }
          }
        } catch (e) { /* ignore */ }
      }

      function hideOauthProgress() {
        try {
          var el = document.getElementById('oauthProgressModal');
          if (!el) return;
          var inst = $window.bootstrap.Modal.getInstance(el);
          if (inst) inst.hide();
        } catch (e) { /* ignore */ }
      }

      function buildExpectedOrigin() {
        try {
          if (typeof $window === 'undefined') return '';
          var login = $window.localStorage && $window.localStorage.getItem('mcpManager.serverConfig');
          if (login) {
            try {
              var parsed = JSON.parse(login);
              if (parsed && parsed.protocol && parsed.host) {
                var port = parsed.port ? ':' + String(parsed.port).replace(/^:/, '') : '';
                return parsed.protocol + '://' + parsed.host + port;
              }
            } catch (e) { /* ignore */ }
          }
          return $window.location.protocol + '//' + $window.location.host;
        } catch (e) { return ''; }
      }

      function parseMessageData(data) {
        if (typeof data !== 'string') return data;
        var trimmed = data.trim();
        if (!trimmed) return data;
        if (trimmed.charAt(0) === '{' || trimmed.charAt(0) === '[') {
          try { return JSON.parse(trimmed); } catch (e) { return data; }
        }
        return data;
      }

      function onOauthMessage(event) {
        try {
          console.log('[oauth-message] received event from origin:', event && event.origin);
          var expected = authExpectedOrigin || buildExpectedOrigin();
          console.log('[oauth-message] expected origin:', expected);
          if (expected && event && event.origin && event.origin !== expected) {
            console.warn('[oauth-message] dropping message from untrusted origin:', event.origin);
            return;
          }
          var data = parseMessageData(event && event.data);
          console.log('[oauth-message] raw event.data:', JSON.stringify(data));
          if (data && (data.type === 'OAUTH_CALLBACK_DATA' || data.type === 'OAUTH_CALLBACK')) {
            console.log('[oauth-message] OAuth callback payload:', JSON.stringify(data));
            if (typeof $window.OAuthCallbackResponse === 'function') {
              $window.OAuthCallbackResponse(data);
            }
          } else {
            console.log('[oauth-message] message does not match OAuth callback type');
          }
        } catch (e) {
          console.error('[oauth-message] handler error:', e);
        }
      }

      try {
        authExpectedOrigin = buildExpectedOrigin();
      } catch (e) { authExpectedOrigin = ''; }

      try {
        $window.removeEventListener('message', onOauthMessage);
        $window.addEventListener('message', onOauthMessage);
      } catch (e) { /* ignore */ }

      vm.cancelOauthProgress = function () {
        if (authWindow && !authWindow.closed) {
          try { authWindow.close(); } catch (e) { /* ignore */ }
        }
        authWindow = null;
        hideOauthProgress();
        if (typeof $window !== 'undefined' && $window.bootstrap) {
          $window.bootstrap.Modal.getInstance(document.getElementById('oauthAuthorizeModal'));
          var inst = $window.bootstrap.Modal.getInstance(document.getElementById('oauthAuthorizeModal'));
          if (inst) inst.hide();
        }
        vm.notify('warning', 'Authorization cancelled', 'The OAuth flow was cancelled.');
      };

      function normalizeOAuthCallbackPayload(payload) {
        var parsed = parseMessageData(payload);
        var envelope = parsed || {};
        var body = envelope && envelope.type && Object.prototype.hasOwnProperty.call(envelope, 'data')
          ? envelope.data
          : envelope;
        body = parseMessageData(body) || {};
        var result = body && Object.prototype.hasOwnProperty.call(body, 'result') ? body.result : body;
        result = parseMessageData(result) || {};
        return {
          envelope: envelope,
          body: body,
          result: result,
          status: (body && body.status) || (result && result.status) || (envelope && envelope.status) || ''
        };
      }

      $window.OAuthCallbackResponse = function (payload) {
        if ($scope.$$phase) {
          tryFetchCallbackToken();
        } else {
          $scope.$apply(function () { tryFetchCallbackToken(); });
        }

        function tryFetchCallbackToken() {
          hideOauthProgress();
          try {
            if (typeof $window !== 'undefined' && $window.bootstrap) {
              var inst = $window.bootstrap.Modal.getInstance(document.getElementById('oauthAuthorizeModal'));
              if (inst) inst.hide();
            }
          } catch (e) { /* ignore */ }

          var callback = normalizeOAuthCallbackPayload(payload);
          var result = callback.result || {};
          vm.oauth.callbackResult = result;
          recordOAuthResponse('oauthCallback', callback.body || payload);
          if (result.uniqueName && vm.oauth.tokenFilter) {
            vm.oauth.tokenFilter.uniqueName = result.uniqueName;
          }
          var status = String(callback.status || '').toLowerCase();
          var isSuccess = result.success === true ||
            (result.success !== false && (status === 'success' || status === 'ok'));
          if (isSuccess) {
            vm.notify('success', 'Setup completed', result.message || 'OAuth setup completed successfully.');
          } else {
            var msg = (result && (result.message || result.error || result.errorMessage)) ||
              (callback.body && (callback.body.message || callback.body.error || callback.body.errorMessage)) ||
              'Unknown response from the authorization window.';
            vm.notify('danger', 'Authorization failed', String(msg));
          }
          if (authWindow && !authWindow.closed) {
            try { authWindow.close(); } catch (e) { /* ignore */ }
          }
          authWindow = null;
          if (isSuccess && (result.uniqueName || (vm.oauth.selectedSetup && vm.oauth.selectedSetup.uniqueName))) {
            return vm.listOAuthTokens();
          }
        }
      };

      vm.viewOAuthSetup = function (setup) {
        vm.selectOAuthSetup(setup);
      };

      vm.saveOAuthSetup = function () {
        if (vm.oauth.formBusy) return;
        var form = vm.oauth.form;
        if (!form.uniqueName || !form.baseEndpoint) {
          vm.oauth.formError = 'uniqueName and baseEndpoint are required.';
          return;
        }
        var opId = vm.oauth.formMode === 'edit' ? 'editOAuthSetup' : 'addOAuthSetup';
        var payload;
        try {
          payload = buildOAuthSetupPayload(form);
        } catch (e) {
          vm.oauth.formError = e.message || 'Invalid OAuth setup payload.';
          return;
        }
        vm.oauth.formBusy = true;
        vm.oauth.formError = '';
        return api(opId, payload).then(function (response) {
          vm.oauth.formBusy = false;
          recordOAuthResponse(opId, response);
          var result = unwrapResult(response) || {};
          var setupResult = result.setup || {};
          vm.oauth.savedAuthorizeUrl = setupResult.authorizeUrl || result.authorizeUrl || '';
          vm.oauth.savedRedirectUri = setupResult.redirectUri || result.redirectUri || '';
          vm.notify('success', vm.oauth.formMode === 'edit' ? 'OAuth setup updated' : 'OAuth setup created',
            result.message || (form.uniqueName + ' saved.'));
          return vm.listOAuthSetups().then(function () {
            var saved = vm.oauth.setups.find(function (s) {
              return (s.uniqueName || s.oauthId) === form.uniqueName;
            });
            if (saved) {
              vm.oauth.selectedSetup = saved;
              populateOAuthSetupForm(saved);
              if (vm.oauth.tokenFilter) vm.oauth.tokenFilter.uniqueName = saved.uniqueName || '';
            }
            hideModal('oauthEditModal');
          });
        }).catch(function (error) {
          vm.oauth.formBusy = false;
          vm.oauth.formError = (error && error.message) || 'Failed to save OAuth setup.';
        });
      };

      vm.deleteOAuthSetup = function (setup) {
        var target = setup || vm.oauth.selectedSetup;
        if (!target) return;
        var uniqueName = target.uniqueName || (target.setup && target.setup.uniqueName);
        if (!uniqueName) {
          vm.notify('warning', 'Missing uniqueName', 'Cannot delete setup without a uniqueName.');
          return;
        }
        vm.showDeleteConfirm('Delete OAuth setup "' + uniqueName + '"? This cannot be undone.', function () {
          var categories = normalizeCategories(vm.oauthSetupCategories(target), ['MCPNEST_MCP_OAUTH']);
          return api('deleteOAuthSetup', { request: { name: uniqueName, uniqueName: uniqueName, categories: categories } }).then(function (response) {
            recordOAuthResponse('deleteOAuthSetup', response);
            var result = unwrapResult(response) || {};
            vm.notify('success', 'Setup deleted', result.message || (uniqueName + ' removed.'));
            if (vm.oauth.selectedSetup &&
                (vm.oauth.selectedSetup.uniqueName || vm.oauth.selectedSetup.oauthId) === uniqueName) {
              vm.oauth.selectedSetup = null;
            }
            return vm.listOAuthSetups();
          });
        });
      };

      vm.runOAuthAuthorizationTest = function () {
        if (vm.oauth.testBusy) return;
        var f = vm.oauth.testForm;
        if (!f.name || !f.mcpId) {
          vm.notify('warning', 'Missing fields', 'name and mcpId are required for authorization test.');
          return;
        }
        vm.oauth.testBusy = true;
        var payload = { name: f.name, mcpId: f.mcpId };
        if (f.visibility) payload.visibility = f.visibility;
        return api('testOAuthAuthorization', payload).then(function (response) {
          vm.oauth.testBusy = false;
          vm.oauth.testResult = unwrapResult(response) || response;
          recordOAuthResponse('testOAuthAuthorization', response);
        }).catch(function (error) {
          vm.oauth.testBusy = false;
          vm.oauth.testResult = { error: (error && error.message) || 'Test failed' };
        });
      };

      function generateOtsuTokenKey() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var length = 9;
        var out = '';
        for (var i = 0; i < length; i++) {
          out += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return 'OTSU-' + out;
      }

      vm.startOAuthAuthorization = function (setup) {
        var f = vm.oauth.testForm;
        var name = f.name || (setup && (setup.uniqueName || (setup.setup && setup.setup.uniqueName))) || '';
        var mcpId = f.mcpId;
        if (!name || !mcpId) {
          vm.notify('warning', 'Missing fields', 'name and mcpId are required to start authorization.');
          return;
        }
        if (vm.oauth.testBusy) {
          vm.notify('warning', 'Authorization in progress', 'Please wait for the current request to finish.');
          return;
        }
        vm.oauth.testBusy = true;
        var deferred = $q.defer();
        api('getUserID', {}, { quietErrors: true }).then(function (userIdResp) {
          var userIdData = unwrapResult(userIdResp) || userIdResp || {};
          var userId = userIdData.userID || userIdData.userId || userIdData.user_id || '';
          if (!userId) throw new Error('Could not retrieve current user ID.');
          var tokenKey = generateOtsuTokenKey();
          return api('getOtsuToken', { userID: userId, token_key: tokenKey }, { quietErrors: true }).then(function (tokenResp) {
            var tokenValue = tokenResp;
            if (tokenResp && typeof tokenResp === 'object' && 'data' in tokenResp) {
              tokenValue = tokenResp.data;
            }
            if (tokenValue && typeof tokenValue === 'object' && tokenValue.token) {
              tokenValue = tokenValue.token;
            }
            var jwt = (tokenValue == null ? '' : String(tokenValue)).replace(/^["']|["']$/g, '').trim();
            if (!jwt) throw new Error('OTSU token was empty.');
            var state = 'access_token:' + jwt;
            var authorizePayload = { name: name, mcpId: mcpId, otsu: state };
            if (f.visibility) authorizePayload.visibility = f.visibility;
            return api('authorizeOAuth', authorizePayload).then(function (authResp) {
              recordOAuthResponse('authorizeOAuth', authResp);
              var authResult = unwrapResult(authResp) || {};
              var rawUrl = authResult.authorizeUrl;
              if (!rawUrl) throw new Error('Authorization response did not include authorizeUrl.');
              var separator = rawUrl.indexOf('?') >= 0 ? '&' : '?';
              var finalUrl = rawUrl + separator + 'otsu=' + encodeURIComponent(state);
              try { authExpectedOrigin = buildExpectedOrigin(); } catch (e) { /* ignore */ }
              vm.notify('success', 'Authorization started', 'Opening provider authorization in a new tab.');
              authWindow = window.open(finalUrl, '_blank', 'width=700,height=600,scrollbars=yes,resizable=yes');
              showOauthProgress();
              deferred.resolve(finalUrl);
            });
          });
        }).catch(function (error) {
          vm.notify('danger', 'Authorization failed', (error && error.message) || 'Could not prepare OTSU authorization URL.');
          deferred.reject(error);
        }).finally(function () {
          vm.oauth.testBusy = false;
        });
        return deferred.promise;
      };

      vm.startOAuthAuthorizationForMcp = function (mcp) {
        if (!mcp || !mcp.mcpId) {
          vm.notify('warning', 'Missing MCP', 'Cannot start OAuth authorization without an MCP id.');
          return;
        }
        var uniqueName = mcp.name || mcp.uniqueName || mcp.oauthUniqueName || mcp.alias || '';
        if (!uniqueName) {
          vm.notify('warning', 'Missing OAuth setup', 'Cannot start OAuth authorization without the OAuth setup name.');
          return;
        }
        vm.oauth.testForm.name = uniqueName;
        vm.oauth.testForm.mcpId = mcp.mcpId;
        return vm.startOAuthAuthorization({ uniqueName: uniqueName });
      };

      vm.runOAuthCallback = function () {
        if (vm.oauth.callbackBusy) return;
        var f = vm.oauth.callbackForm;
        if (!f.name || !f.code || !f.state) {
          vm.notify('warning', 'Missing fields', 'name, code, and state are all required.');
          return;
        }
        vm.oauth.callbackBusy = true;
        return api('oauthCallback', { name: f.name, code: f.code, state: f.state }).then(function (response) {
          vm.oauth.callbackBusy = false;
          vm.oauth.callbackResult = unwrapResult(response) || response;
          recordOAuthResponse('oauthCallback', response);
          var result = vm.oauth.callbackResult || {};
          if (result.success !== false) {
            vm.notify('success', 'OAuth callback', result.message || 'Callback processed.');
            return vm.listOAuthTokens();
          }
        }).catch(function (error) {
          vm.oauth.callbackBusy = false;
          vm.oauth.callbackResult = { error: (error && error.message) || 'Callback failed' };
        });
      };

      vm.listOAuthTokens = function () {
        vm.oauth.tokensLoading = true;
        vm.oauth.tokensError = '';
        var filter = vm.oauth.tokenFilter || {};
        var request = {};
        if (filter.mcpId) request.mcpId = filter.mcpId;
        if (filter.name) request.name = filter.name;
        if (filter.uniqueName) request.uniqueName = filter.uniqueName;
        if (filter.search) request.search = filter.search;
        var payload = Object.keys(request).length ? { request: request } : { request: {} };
        return api('listOAuthTokens', payload).then(function (response) {
          var result = unwrapResult(response);
          vm.oauth.tokens = asArray(result && (result.tokens || result.items || result.records) || result);
          vm.oauth.tokensLoading = false;
          recordOAuthResponse('listOAuthTokens', response);
        }).catch(function (error) {
          vm.oauth.tokensLoading = false;
          vm.oauth.tokensError = (error && error.message) || 'Failed to load OAuth tokens.';
        });
      };

      vm.deleteOAuthToken = function (token) {
        if (!token || !token.tokenId) return;
        vm.showDeleteConfirm('Delete OAuth token "' + token.tokenId + '"? This cannot be undone.', function () {
          return api('deleteOAuthToken', { request: { tokenId: token.tokenId } }).then(function (response) {
            recordOAuthResponse('deleteOAuthToken', response);
            var result = unwrapResult(response) || {};
            vm.notify('success', 'Token deleted', result.message || 'Token removed.');
            return vm.listOAuthTokens();
          });
        });
      };

      vm.openShowOAuthToken = function (token) {
        if (!token || !token.tokenId) {
          vm.notify('warning', 'Missing token', 'Token id is required to verify auth token details.');
          return;
        }
        vm.oauth.showAuthTokenBusy = true;
        vm.oauth.showAuthTokenResult = null;
        showModal('oauthShowTokenModal');
        var request = { tokenId: token.tokenId };
        if (token.mcpId) request.mcpId = token.mcpId;
        if (token.userId) request.userId = token.userId;
        return api('showAuthToken', { request: request }).then(function (response) {
          var result = normalizeShowAuthTokenResult(unwrapResult(response) || {});
          vm.oauth.showAuthTokenResult = result;
          recordOAuthResponse('showAuthToken', response);
        }).catch(function (error) {
          vm.oauth.showAuthTokenResult = { error: (error && error.message) || 'Failed to verify token.' };
        }).finally(function () {
          vm.oauth.showAuthTokenBusy = false;
        });
      };

      vm.changeOAuthTokenAccess = function (token, visibility) {
        if (!token || !token.tokenId || !visibility) return;
        return api('changeOAuthTokenAccess', { request: { tokenId: token.tokenId, visibility: visibility } }).then(function (response) {
          recordOAuthResponse('changeOAuthTokenAccess', response);
          var result = unwrapResult(response) || {};
          vm.notify('success', 'Token access updated', result.message || ('Token is now ' + visibility + '.'));
          return vm.listOAuthTokens();
        }).catch(function (error) {
          vm.notify('danger', 'Access update failed', (error && error.message) || 'Could not update token access.');
        });
      };

      vm.applyOAuthMappingProfile = function (target) {
        var request = {};
        if (target && target.tokenId) request.tokenId = target.tokenId;
        if (!request.tokenId && target) {
          request.name = target.uniqueName || target.name || (target.setup && target.setup.uniqueName) || '';
        }
        if (!request.tokenId && !request.name && vm.oauth.selectedSetup) {
          request.name = vm.oauth.selectedSetup.uniqueName || vm.oauth.selectedSetup.name || '';
        }
        if (!request.tokenId && !request.name) {
          vm.notify('warning', 'Missing target', 'Select a token or OAuth setup before regenerating token information.');
          return;
        }
        return api('applyOAuthMappingProfile', { request: request }).then(function (response) {
          recordOAuthResponse('applyOAuthMappingProfile', response);
          var result = unwrapResult(response) || {};
          vm.notify('success', 'Token information regenerated', result.message || 'Mapping profile applied.');
          return vm.listOAuthTokens();
        }).catch(function (error) {
          vm.notify('danger', 'Regeneration failed', (error && error.message) || 'Could not regenerate token information.');
        });
      };

      vm.notify = function (type, title, message) {
        var id = Date.now() + Math.random();
        var icon = {
          success: 'ph-check-circle',
          danger: 'ph-x-circle',
          warning: 'ph-warning',
          info: 'ph-info'
        }[type] || 'ph-info';
        vm.toasts.push({ id: id, type: type, title: title, message: message, icon: icon });
        $timeout(function () { vm.dismissToast(id); }, 5200);
      };

      vm.dismissToast = function (id) {
        vm.toasts = vm.toasts.filter(function (toast) { return toast.id !== id; });
      };

      function api(operationId, payload, options) {
        options = options || {};
        var op = findBy(vm.operations, 'operationId', operationId);
        if (!op) {
          return Promise.reject(new Error('Unknown operation: ' + operationId));
        }
        vm.loadingCount++;
        var method = operationId === 'editOAuthSetup' ? 'POST' : op.method;
        var config = {
          method: method,
          url: vm.baseUrl + op.path,
          headers: {
            Authorization: 'Bearer ' + vm.login.token,
            Accept: 'application/json'
          }
        };
        if (method === 'GET') {
          config.params = payload || {};
        } else {
          config.data = payload || {};
          config.headers['Content-Type'] = 'application/json';
        }
        return $http(config).then(function (response) {
          return response.data;
        }).catch(function (error) {
          var message = extractError(error);
          if (!options.quietErrors) {
            vm.notify('danger', 'Request failed', message);
          }
          throw new Error(message);
        }).finally(function () {
          vm.loadingCount = Math.max(0, vm.loadingCount - 1);
        });
      }

      function loadSwaggerOperations() {
        $http.get('MCPNest-swagger.json').then(function (response) {
          var swagger = response.data;
          vm.operations = Object.keys(swagger.paths || {}).map(function (path) {
            var methods = swagger.paths[path];
            var method = Object.keys(methods)[0].toUpperCase();
            var op = methods[method.toLowerCase()];
            if (op.operationId === 'editOAuthSetup') method = 'POST';
            return {
              operationId: op.operationId,
              method: method,
              path: path,
              schema: op.requestBody && op.requestBody.content && op.requestBody.content['application/json']
                ? op.requestBody.content['application/json'].schema
                : null,
              parameters: op.parameters || []
            };
          });
        }).catch(function () {
          vm.notify('warning', 'Swagger not loaded', 'Using the built-in MCP Nest operation list.');
        });
      }

      function defaultOperations() {
        return Object.keys(paths).map(function (operationId) {
          var method = operationId === 'getToolUsageDetails' || operationId === 'removeToolFromCollection' || operationId === 'getUserID' || operationId === 'getOtsuToken' || operationId === 'listOAuthMappingProfiles' ? 'GET' : 'POST';
          return {
            operationId: operationId,
            method: method,
            path: paths[operationId],
            schema: null,
            parameters: []
          };
        });
      }

      function restoreSession() {
        var token = sessionStorage.getItem('mcpManager.token');
        if (token) {
          vm.login.token = token;
          vm.baseUrl = buildBaseUrl();
          $timeout(function () {
            resetLazyData();
            vm.openDashboard();
          }, 250);
        }
      }

      function syncSidebarCounts(payload) {
        if (!payload || typeof payload !== 'object') return;
        if (payload.mcpCount !== undefined && payload.mcpCount !== null) vm.sidebarCounts.mcpCount = Number(payload.mcpCount);
        if (payload.collectionCount !== undefined && payload.collectionCount !== null) vm.sidebarCounts.collectionCount = Number(payload.collectionCount);
      }

      function resetLazyData() {
      vm.mcps = [];
      vm.mcpPagination = { total: 0, filtered: 0, returned: 0, offset: 0, limit: 20 };
        vm.collections = [];
        vm.collectionTools = [];
        vm.toolsByMcp = {};
        vm.selectedMcp = null;
        vm.collectionLookup.id = '';
        vm.oauth.setups = [];
        vm.oauth.tokens = [];
        vm.mappingProfiles.profiles = [];
        vm.loadedTabs = { mcps: false, collections: false, oauth: false, mappingProfiles: false };
        vm.sidebarCounts = { mcpCount: null, collectionCount: null };
      }

      function buildBaseUrl() {
        var host = String(vm.login.host || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
        var port = vm.login.port ? ':' + String(vm.login.port).replace(/^:/, '') : '';
        var tenant = String(vm.login.tenant || '').replace(/^\/+|\/+$/g, '');
        return vm.login.protocol + '://' + host + port + '/tenant/' + tenant;
      }

      function buildOAuthBaseEndpoint() {
        var base = buildBaseUrl();
        if (!base) return '';
        return base.replace(/\/+$/, '');
      }

      function fallbackCopy(text) {
        var input = document.createElement('textarea');
        input.value = text;
        input.setAttribute('readonly', 'readonly');
        input.style.position = 'fixed';
        input.style.top = '-9999px';
        document.body.appendChild(input);
        input.select();
        try {
          document.execCommand('copy');
          vm.notify('success', 'Copied', 'MCP endpoint copied to clipboard.');
        } catch (e) {
          vm.notify('warning', 'Copy failed', 'Copy manually from the endpoint field.');
        }
        document.body.removeChild(input);
      }

      function persistServerConfig() {
        localStorage.setItem(CONFIG_KEY, JSON.stringify({
          protocol: vm.login.protocol,
          host: vm.login.host,
          port: vm.login.port,
          tenant: vm.login.tenant
        }));
      }

      function rememberCollection(collection) {
        vm.recentCollections = [collection].concat(vm.recentCollections.filter(function (item) {
          return item.collectionId !== collection.collectionId;
        })).slice(0, 8);
        localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(vm.recentCollections));
      }

      function defaultMcpForm() {
        return {
          request: {
            mcpId: '',
            mcpAlias: '',
            endpointUrl: '',
            mcpName: '',
            description: '',
            endpointType: 'STANDARD',
            authType: 'NONE',
            enabled: true,
            authInfo: defaultMcpAuthInfo(),
            categories: ['MCPNEST_MCP']
          }
        };
      }

      function defaultMcpAuthInfo() {
        return {
          auth: {
            header: [],
            query: []
          }
        };
      }

      function defaultInternalTerminalForm() {
        return {
          request: {
            mcpId: '',
            toolId: '',
            mcpAlias: 'internal-terminal',
            endpointUrl: '',
            workingDirectory: '',
            mcpName: 'Internal Terminal',
            description: 'Internal terminal MCP',
            enabled: true,
            collectionId: '',
            collectionName: '',
            collectionDescription: '',
            toolDescription: 'Execute terminal commands'
          }
        };
      }

      function manualTemplate() {
        return {
          id: 'manual',
          name: 'Other / Manual MCP',
          category: 'Custom',
          icon: 'fa-sliders',
          description: 'Enter the MCP endpoint and authentication details manually.',
          endpointPlaceholder: 'https://mcp.example.com/api/v1/connect',
          endpointType: 'STANDARD',
          authType: 'NONE',
          authFields: []
        };
      }

      function formFromTemplate(template) {
        template = template || manualTemplate();
        var form = defaultMcpForm();
        form.templateValues = {};
        form.request.mcpAlias = template.mcpAlias || '';
        form.request.endpointUrl = template.endpointUrl || '';
        form.request.mcpName = template.mcpName || template.name || '';
        form.request.description = template.description || '';
        form.request.endpointType = template.endpointType || 'STANDARD';
        form.request.authType = template.authType === 'CUSTOM_HEADER' ? 'API_KEY' : (template.authType || 'NONE');
        form.request.categories = normalizeCategories(template.categories || form.request.categories || ['MCPNEST_MCP']);
        (template.authFields || []).forEach(function (field) {
          form.templateValues[field.key] = field.value || '';
          if (field.value && field.target) {
            setPath(form.request, field.target, field.value);
          }
        });
        return form;
      }

      function getAddMcpAuthInfoSchema() {
        var op = findBy(vm.operations, 'operationId', 'addMcpEndpoint');
        var schema = op && op.schema
          && op.schema.properties
          && op.schema.properties.request
          && op.schema.properties.request.properties
          && op.schema.properties.request.properties.authInfo;
        return normalizeSchema(schema || buildFallbackSchema(defaultMcpAuthInfo()));
      }

      function normalizeAuthInfo(rawAuthInfo, authType) {
        var raw = (rawAuthInfo && typeof rawAuthInfo === 'object') ? angular.copy(rawAuthInfo) : {};
        var normalized = { auth: { header: [], query: [] } };
        var sourceAuth = raw.auth && typeof raw.auth === 'object' ? raw.auth : {};

        if (Array.isArray(sourceAuth.header)) {
          sourceAuth.header.forEach(function (entry) {
            if (!entry || (!entry.key && !entry.value)) return;
            normalized.auth.header.push({ key: String(entry.key || ''), value: String(entry.value || '') });
          });
        }
        if (Array.isArray(sourceAuth.query)) {
          sourceAuth.query.forEach(function (entry) {
            if (!entry || (!entry.key && !entry.value)) return;
            normalized.auth.query.push({ key: String(entry.key || ''), value: String(entry.value || '') });
          });
        }

        var resolvedType = authType || sourceAuth.type || raw.authType || 'NONE';
        if (resolvedType === 'CUSTOM_HEADER') resolvedType = 'API_KEY';

        if (raw.bearerToken) {
          normalized.auth.header.push({ key: 'Authorization', value: 'Bearer ' + String(raw.bearerToken) });
        }

        var legacyApiKey = sourceAuth.config && sourceAuth.config.api_key ? sourceAuth.config.api_key : {};
        var legacyBasic = sourceAuth.config && sourceAuth.config.basic ? sourceAuth.config.basic : {};
        var legacyOidc = sourceAuth.config && sourceAuth.config.oidc ? sourceAuth.config.oidc : {};
        var legacyOidcTokens = legacyOidc.tokens || {};

        if (resolvedType === 'API_KEY') {
          var keyName = raw.headerName || legacyApiKey.header_name || 'x-api-key';
          var keyValue = raw.apiKey || raw.headerValue || legacyApiKey.key || '';
          var prefix = legacyApiKey.prefix ? String(legacyApiKey.prefix).trim() : '';
          if (keyValue) {
            normalized.auth.header.push({
              key: String(keyName || 'x-api-key'),
              value: prefix ? (prefix + ' ' + keyValue) : String(keyValue)
            });
          }
        }

        if (resolvedType === 'BASIC' && (legacyBasic.username || legacyBasic.password)) {
          try {
            if (typeof btoa === 'function') {
              var basicRaw = String(legacyBasic.username || '') + ':' + String(legacyBasic.password || '');
              normalized.auth.header.push({ key: 'Authorization', value: 'Basic ' + btoa(basicRaw) });
            }
          } catch (e) { /* ignore */ }
        }

        if (resolvedType === 'BEARER' && legacyOidcTokens.access_token) {
          normalized.auth.header.push({ key: 'Authorization', value: 'Bearer ' + String(legacyOidcTokens.access_token) });
        }

        normalized.auth.header = dedupeKeyValuePairs(normalized.auth.header);
        normalized.auth.query = dedupeKeyValuePairs(normalized.auth.query);
        return normalized;
      }

      function dedupeKeyValuePairs(list) {
        var seen = {};
        var out = [];
        (list || []).forEach(function (entry) {
          if (!entry || (!entry.key && !entry.value)) return;
          var key = String(entry.key || '');
          var value = String(entry.value || '');
          var signature = key + '\u0000' + value;
          if (seen[signature]) return;
          seen[signature] = true;
          out.push({ key: key, value: value });
        });
        return out;
      }

      function normalizeCategories(value, fallback) {
        var list = [];
        if (Array.isArray(value)) {
          list = value;
        } else if (typeof value === 'string') {
          list = value.split(/[\s,]+/);
        }
        var normalized = list.map(function (entry) {
          return String(entry || '').trim().toUpperCase();
        }).filter(Boolean).filter(function (entry) {
          return CATEGORIES.indexOf(entry) >= 0;
        });
        if (!normalized.length && Array.isArray(fallback) && fallback.length) {
          return normalizeCategories(fallback, []);
        }
        return unique(normalized);
      }

      function parseCategoryInput(value, fallback) {
        return normalizeCategories(value, fallback || []);
      }

      function normalizeMcpRecord(mcp) {
        var source = parseObjectSafe(mcp);
        var normalized = angular.copy(source || {});
        normalized.mcpId = firstPresent(source, ['mcpId', 'id', 'MCP_ID']);
        normalized.alias = firstPresent(source, ['alias', 'mcpAlias', 'mcp_alias', 'MCP_ALIAS']);
        normalized.name = firstPresent(source, ['name', 'mcpName', 'mcp_name', 'MCP_NAME']);
        normalized.endpoint = firstPresent(source, ['endpoint', 'endpointUrl', 'endpoint_url', 'ENDPOINT']);
        normalized.endpointType = firstPresent(source, ['endpointType', 'endpoint_type', 'ENDPOINT_TYPE']);
        normalized.authType = firstPresent(source, ['authType', 'auth_type', 'AUTH_TYPE']);
        normalized.description = firstPresent(source, ['description', 'DESCRIPTION']);
        normalized.enabled = firstPresent(source, ['enabled', 'ENABLED']);
        normalized.active = firstPresent(source, ['active', 'ACTIVE']);
        normalized.ready = firstPresent(source, ['ready', 'READY']);
        normalized.authInfo = parseObjectSafe(firstPresent(source, ['authInfo', 'auth_info', 'AUTH_INFO']));
        normalized.authInfo = normalizeAuthInfo(normalized.authInfo, normalized.authType);
        normalized.categories = Array.isArray(source.categories) ? source.categories : normalizeCategories(firstPresent(source, ['categories', 'CATEGORIES', 'category', 'CATEGORY']), []);
        return normalized;
      }

      function applyTemplateFields(payload, template) {
        if (!template) return;
        var values = payload.templateValues || {};
        delete payload.templateValues;
        (template.authFields || []).forEach(function (field) {
          var value = values[field.key];
          if (field.required && !value) {
            throw new Error(field.label + ' is required');
          }
          if (value && field.target && field.target !== 'endpointToken') {
            setPath(payload.request, field.target, value);
          }
        });
        payload.request.endpointUrl = interpolate(payload.request.endpointUrl, values);
      }

      function interpolate(text, values) {
        return String(text || '').replace(/\{([^}]+)\}/g, function (_, key) {
          return encodeURIComponent(values[key] || '');
        });
      }

      function setPath(target, path, value) {
        var parts = path.split('.');
        var cursor = target;
        for (var i = 0; i < parts.length - 1; i++) {
          cursor[parts[i]] = cursor[parts[i]] || {};
          cursor = cursor[parts[i]];
        }
        cursor[parts[parts.length - 1]] = value;
      }

      function unique(list) {
        return list.filter(function (item, index) {
          return item && list.indexOf(item) === index;
        });
      }

      function defaultCollectionWizard() {
        return {
          step: 1,
          mode: 'create',
          modeLocked: false,
          collectionName: '',
          collectionNameLocked: false,
          description: '',
          enabled: true,
          collectionId: '',
          mcpId: '',
          toolSearch: '',
          availableTools: [],
          selected: {}
        };
      }

      function isCurrentCallToolRequest(requestId, toolId) {
        return requestId === vm.callToolSchemaRequestId
          && vm.callToolForm
          && vm.callToolForm.tool
          && vm.callToolForm.tool.toolId === toolId;
      }

      function isCurrentEditCollectionToolRequest(requestId, collectionToolId) {
        return requestId === vm.editCollectionToolSchemaRequestId
          && vm.forms
          && vm.forms.editCollectionTool
          && vm.forms.editCollectionTool.request
          && vm.forms.editCollectionTool.request.collectionToolId === collectionToolId;
      }

      function defaultProductManagerState() {
        return {
          exportResult: null,
          importPayloadText: JSON.stringify({ request: { tables: {} } }, null, 2),
          importResult: null,
          recreate: {
            includeDefaultTerminal: true,
            defaultTerminalRoot: '',
            result: null
          },
          migrate: {
            includeDefaultTerminal: true,
            defaultTerminalRoot: '',
            result: null
          },
          purge: {
            retainDays: 30,
            result: null
          }
        };
      }

      function defaultCloneMcpForm() {
        return {
          request: {
            mcpId: '',
            newMcpAlias: '',
            endpointUrl: '',
            mcpName: '',
            description: '',
            endpointType: 'STANDARD',
            authType: 'NONE',
            authInfo: defaultMcpAuthInfo(),
            categories: ['MCPNEST_MCP'],
            enabled: true
          }
        };
      }

      function defaultCloneCollectionForm() {
        return {
          request: {
            collectionId: '',
            newCollectionName: '',
            description: '',
            enabled: true
          }
        };
      }

      function defaultEditCollectionToolForm() {
        return {
          request: {
            alias: '',
            description: '',
            managedPayload: {},
            collectionToolId: '',
            captureInput: false,
            captureOutput: false,
            assertion: {
              success: { KeyPath: '', value: '', ignoreCase: false },
              failed: { KeyPath: '', value: '', ignoreCase: false }
            }
          },
          managedPayloadEditor: {
            schema: { type: 'object', properties: {} },
            model: {},
            payloadText: '{}',
            expanded: { root: true },
            visible: false,
            error: '',
            openEpoch: 0
          }
        };
      }

      function defaultCloneCollectionToolForm() {
        return {
          request: {
            newAlias: '',
            description: '',
            collectionToolId: ''
          }
        };
      }

      function defaultOAuthSetupForm() {
        return {
          uniqueName: '',
          providerName: '',
          appName: '',
          appLogo: '',
          privacyPolicyUrl: '',
          baseEndpoint: '',
          wellKnownUrl: '',
          clientId: '',
          clientSecret: '',
          authorizationUrl: '',
          tokenUrl: '',
          scopes: '',
          grantTypes: 'authorization_code',
          status: 'active',
          mappingProfileId: '',
          tokenUsage: defaultTokenUsageText(),
          extraAuthParams: '',
          categoriesText: 'MCPNEST_MCP_OAUTH'
        };
      }

      function buildOAuthSetupPayload(form) {
        var inner = {};
        var fields = ['uniqueName', 'providerName', 'appName', 'appLogo', 'privacyPolicyUrl', 'baseEndpoint', 'wellKnownUrl', 'clientId', 'clientSecret', 'authorizationUrl', 'tokenUrl', 'status', 'mappingProfileId'];
        fields.forEach(function (field) {
          if (form[field]) inner[field] = String(form[field]).trim();
        });
        var scopesValue = String(form.scopes || '').trim();
        if (scopesValue) inner.scopes = scopesValue.split(/[\s,]+/).filter(Boolean);
        var grantsValue = String(form.grantTypes || '').trim();
        if (grantsValue) inner.grantTypes = grantsValue.split(/[\s,]+/).filter(Boolean);
        var extrasRaw = String(form.extraAuthParams || '').trim();
        if (extrasRaw) {
          try {
            var parsed = JSON.parse(extrasRaw);
            if (parsed && typeof parsed === 'object') inner.extraAuthParams = parsed;
          } catch (e) {
            inner.extraAuthParams = extrasRaw;
          }
        }
        var tokenUsageRaw = String(form.tokenUsage || '').trim();
        if (tokenUsageRaw) {
          try {
            inner.tokenUsage = JSON.parse(tokenUsageRaw);
          } catch (e) {
            throw new Error('Token usage must be valid JSON.');
          }
        }
        var categories = vm.oauthCategoryPicker.selected.length ? vm.oauthCategoryPicker.selected.slice() : parseCategoryInput(form.categoriesText, ['MCPNEST_MCP_OAUTH']);
        if (categories.length) inner.categories = categories;
        return { request: inner };
      }

      function normalizeOAuthSetupRecord(setup) {
        var item = angular.copy(setup || {});
        var nested = item.setup && typeof item.setup === 'object' ? item.setup : null;
        if (nested) {
          if (!item.uniqueName && nested.uniqueName) item.uniqueName = nested.uniqueName;
          if (!item.oauthId && nested.oauthId) item.oauthId = nested.oauthId;
        }
        if (item.ready === undefined || item.ready === null) {
          if (nested && nested.ready !== undefined && nested.ready !== null) {
            item.ready = nested.ready;
          } else if (item.extraAuthParams && item.extraAuthParams.ready !== undefined && item.extraAuthParams.ready !== null) {
            item.ready = item.extraAuthParams.ready;
          }
        }
        item.categories = normalizeCategories(item.categories || (nested && nested.categories) || []);
        if (nested) nested.categories = normalizeCategories(nested.categories || item.categories || []);
        return item;
      }

      function updateOAuthSetupInList(setup) {
        if (!setup || !vm.oauth || !Array.isArray(vm.oauth.setups)) return;
        var uniqueName = vm.pickOAuthField(setup, 'uniqueName') || setup.uniqueName;
        if (!uniqueName) return;
        for (var i = 0; i < vm.oauth.setups.length; i++) {
          var current = vm.oauth.setups[i];
          var currentUniqueName = vm.pickOAuthField(current, 'uniqueName') || current.uniqueName;
          if (currentUniqueName === uniqueName) {
            vm.oauth.setups[i] = normalizeOAuthSetupRecord(angular.extend({}, current, setup));
            return;
          }
        }
      }

      function normalizeShowAuthTokenResult(result) {
        var normalized = angular.copy(result || {});
        var auth = parseMessageData(normalized.auth) || {};
        var token = parseMessageData(normalized.token);
        var tokenInformation = parseMessageData(normalized.tokenInformation);
        normalized.auth = (auth && typeof auth === 'object') ? auth : {};
        normalized.token = token;
        normalized.tokenInformation = tokenInformation;
        return normalized;
      }

      function defaultTokenUsageText() {
        return JSON.stringify({
          sourcePath: '/access_token',
          mode: 'HEADER',
          key: 'Authorization',
          valueTemplate: 'Bearer ${token}'
        }, null, 2);
      }

      function defaultMappingProfileForm() {
        return {
          profileId: '',
          profileName: '',
          providerCode: '',
          description: '',
          status: 'enabled',
          mappingText: JSON.stringify({
            identitySource: 'ID_TOKEN',
            idTokenPath: '/id_token',
            subjectPath: '/sub',
            emailPath: '/email',
            emailVerifiedPath: '/email_verified',
            namePath: '/name',
            avatarPath: '/picture'
          }, null, 2)
        };
      }

      function populateMappingProfileForm(profile) {
        var record = normalizeMappingProfileRecord(extractSingleMappingProfile(profile));
        vm.mappingProfiles.form = {
          profileId: record.profileId || record.mappingProfileId || '',
          profileName: record.profileName || '',
          providerCode: record.providerCode || '',
          description: record.description || '',
          status: record.status || 'enabled',
          mappingText: JSON.stringify(record.mapping || {}, null, 2)
        };
      }

      function firstPresent(source, keys) {
        if (!source || typeof source !== 'object') return '';
        for (var i = 0; i < keys.length; i++) {
          if (source[keys[i]] !== undefined && source[keys[i]] !== null && source[keys[i]] !== '') {
            return source[keys[i]];
          }
        }
        return '';
      }

      function parseObjectSafe(value) {
        var parsed = parseMessageData(value);
        return parsed && typeof parsed === 'object' ? parsed : {};
      }

      function normalizeMappingProfileRecord(profile) {
        var source = parseObjectSafe(profile);
        source = parseObjectSafe(source.profile || source.mappingProfile || source.mapping_profile || source.record || source.item || source.data || source);
        var mapping = firstPresent(source, ['mapping', 'MAPPING', 'mappingJson', 'mapping_json', 'MAPPING_JSON', 'profileMapping', 'profile_mapping']);
        mapping = parseObjectSafe(mapping);
        return {
          profileId: firstPresent(source, ['profileId', 'mappingProfileId', 'id', 'uuid', 'profile_id', 'mapping_profile_id', 'PROFILE_ID', 'MAPPING_PROFILE_ID', 'ID', 'UUID']),
          mappingProfileId: firstPresent(source, ['mappingProfileId', 'profileId', 'mapping_profile_id', 'profile_id', 'MAPPING_PROFILE_ID', 'PROFILE_ID']),
          profileName: firstPresent(source, ['profileName', 'name', 'profile_name', 'mappingProfileName', 'mapping_profile_name', 'PROFILE_NAME', 'NAME', 'MAPPING_PROFILE_NAME']),
          providerCode: firstPresent(source, ['providerCode', 'provider', 'provider_code', 'PROVIDER_CODE', 'PROVIDER']),
          description: firstPresent(source, ['description', 'DESCRIPTION']),
          status: firstPresent(source, ['status', 'STATUS']) || 'enabled',
          createdAt: firstPresent(source, ['createdAt', 'created_at', 'CREATED_AT', 'createdDate', 'created_date']),
          updatedAt: firstPresent(source, ['updatedAt', 'updated_at', 'UPDATED_AT', 'updatedDate', 'updated_date']),
          mapping: mapping
        };
      }

      function extractSingleMappingProfile(value) {
        var profiles = extractMappingProfiles(value);
        return profiles.length ? profiles[0] : normalizeMappingProfileRecord(value);
      }

      function extractMappingProfiles(value) {
        var parsed = parseMessageData(value);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeMappingProfileRecord).filter(function (profile) {
            return profile.profileName || profile.profileId || profile.mappingProfileId || profile.providerCode;
          });
        }
        var source = parseObjectSafe(parsed);
        var candidates = [
          source.profiles,
          source.mappingProfiles,
          source.mappingProfileList,
          source.oauthMappingProfiles,
          source.items,
          source.records,
          source.rows,
          source.list,
          source.data,
          source.result,
          source.profile,
          source.mappingProfile
        ];
        for (var i = 0; i < candidates.length; i++) {
          var candidate = parseMessageData(candidates[i]);
          if (Array.isArray(candidate)) {
            return candidate.map(normalizeMappingProfileRecord).filter(function (profile) {
              return profile.profileName || profile.profileId || profile.mappingProfileId || profile.providerCode;
            });
          }
          if (candidate && typeof candidate === 'object' && candidate !== source) {
            var nested = extractMappingProfiles(candidate);
            if (nested.length) return nested;
          }
        }
        var single = normalizeMappingProfileRecord(source);
        return (single.profileName || single.profileId || single.mappingProfileId || single.providerCode) ? [single] : [];
      }

      function buildMappingProfilePayload(form) {
        var mapping = {};
        var mappingRaw = String(form.mappingText || '').trim();
        if (mappingRaw) {
          try {
            mapping = JSON.parse(mappingRaw);
          } catch (e) {
            throw new Error('Mapping must be valid JSON.');
          }
        }
        var request = {
          profileName: String(form.profileName || '').trim(),
          providerCode: String(form.providerCode || '').trim(),
          description: String(form.description || '').trim(),
          status: form.status || 'enabled',
          mapping: mapping
        };
        if (form.profileId) request.profileId = form.profileId;
        return { request: request };
      }

      function recordOAuthResponse(opId, response) {
        if (!vm.oauth.lastResponses) vm.oauth.lastResponses = {};
        vm.oauth.lastResponses[opId] = response;
      }

      function findCollectionName(collectionId) {
        var item = vm.collections.filter(function (entry) {
          return entry.collectionId === collectionId;
        })[0] || vm.recentCollections.filter(function (entry) {
          return entry.collectionId === collectionId;
        })[0];
        return item && item.collectionName;
      }

      function findCollectionDescription(collectionId) {
        var item = vm.collections.filter(function (entry) {
          return entry.collectionId === collectionId;
        })[0] || vm.recentCollections.filter(function (entry) {
          return entry.collectionId === collectionId;
        })[0];
        return item && item.description;
      }

      function samplePayload(operationId) {
        return {
          createToolCollection: { request: { collectionName: 'New collection', description: '', enabled: true } },
          addMcpEndpoint: defaultMcpForm(),
          addToolToCollection: { collectionId: '', toolId: '' },
          listToolsByMcpId: { mcpId: '', keywords: [] },
          listToolsByCollectionId: { collectionId: '', keywords: [] },
          listCollections: { keywords: [] },
          addInternalTerminalMcp: { request: defaultInternalTerminalForm().request },
          enableDisableToolInCollection: { collectionId: '', collectionToolId: '', enabled: true },
          getToolUsageDetails: { toolId: '' },
          toolDebugCurl: { toolId: '', collectionToolId: '', arguments: {} },
          listMcps: { keywords: [], offset: 0, limit: 100, active: true, categories: [] },
          callTool: { toolId: '', collectionToolId: '', arguments: {} },
          editToolInCollection: { request: { alias: '', description: '', managedPayload: {}, collectionToolId: '' } },
          cloneMcp: defaultCloneMcpForm(),
          cloneToolCollection: defaultCloneCollectionForm(),
          cloneToolInCollection: defaultCloneCollectionToolForm(),
          exportMcpNestDatabase: {},
          importMcpNestDatabase: { request: { tables: {}, includeDefaultTerminal: true, defaultTerminalRoot: '' } },
          recreateMcpNestDatabase: { request: { includeDefaultTerminal: true, defaultTerminalRoot: '' } },
          migrateMcpNestDatabase: { request: { includeDefaultTerminal: true, defaultTerminalRoot: '' } },
          purgeToolCallLogs: { request: { retainDays: 30 } },
          enableDisableMcpEndpoint: { mcpId: '', enabled: true },
          removeToolFromCollection: { collectionId: '', collectionToolId: '' },
          enableDisableTool: { toolId: '', enabled: true },
          getDashboardStats: { request: { zoomLevel: '1day' } },
          refreshMcpTools: { request: { mcpId: '', tools: [] } },
          listOAuthSetups: { keywords: [] },
          getOAuthSetup: { request: { name: '', uniqueName: '' } },
          addOAuthSetup: { request: { uniqueName: '', baseEndpoint: '', categories: ['MCPNEST_MCP_OAUTH'] } },
          editOAuthSetup: { request: { uniqueName: '', baseEndpoint: '', mappingProfileId: '', categories: ['MCPNEST_MCP_OAUTH'], tokenUsage: { sourcePath: '/access_token', mode: 'HEADER', key: 'Authorization', valueTemplate: 'Bearer ${token}' } } },
          deleteOAuthSetup: { request: { name: '', uniqueName: '', categories: ['MCPNEST_MCP_OAUTH'] } },
          authorizeOAuth: { name: '', mcpId: '', otsu: '' },
          testOAuthAuthorization: { name: '', mcpId: '' },
          oauthCallback: { name: '', code: '', state: '' },
          listOAuthTokens: { request: { mcpId: '', name: '', uniqueName: '' } },
          deleteOAuthToken: { request: { tokenId: '' } },
          showAuthToken: { request: { tokenId: '', mcpId: '', userId: '' } },
          addOAuthMappingProfile: buildMappingProfilePayload(defaultMappingProfileForm()),
          editOAuthMappingProfile: { request: { profileId: '', status: 'enabled', mapping: { identitySource: 'TOKEN_RESPONSE', subjectPath: '/account_id', emailPath: '/email', namePath: '/name' } } },
          getOAuthMappingProfile: { request: { profileId: '' } },
          deleteOAuthMappingProfile: { request: { profileId: '' } },
          listOAuthMappingProfiles: { keywords: [] },
          changeOAuthTokenAccess: { request: { tokenId: '', visibility: 'public' } },
          applyOAuthMappingProfile: { request: { mappingProfileId: '', name: '' } },
          mergeDefaultOAuthCatalog: { request: {} },
          getUserID: {},
          getOtsuToken: { userID: '', token_key: '' }
        }[operationId] || {};
      }

      function defaultArguments(tool) {
        return {};
      }

      function extractArgumentSchema(details) {
        if (!details || typeof details !== 'object') return null;

        var candidates = [
          details.argumentsSchema,
          details.argumentSchema,
          details.inputSchema,
          details.requestSchema,
          details.parametersSchema,
          details.schema,
          details.arguments && details.arguments.schema,
          details.input && details.input.schema
        ];

        for (var i = 0; i < candidates.length; i++) {
          var candidate = candidates[i];
          if (looksLikeSchema(candidate)) {
            return normalizeSchema(candidate);
          }
        }

        var discovered = findSchemaNode(details, 0, 5);
        return discovered ? normalizeSchema(discovered) : null;
      }

      function findSchemaNode(node, depth, maxDepth) {
        if (!node || typeof node !== 'object' || depth > maxDepth) return null;
        if (looksLikeSchema(node)) return node;

        var keys = Object.keys(node);
        for (var i = 0; i < keys.length; i++) {
          var nested = findSchemaNode(node[keys[i]], depth + 1, maxDepth);
          if (nested) return nested;
        }
        return null;
      }

      function looksLikeSchema(node) {
        if (!node || typeof node !== 'object' || Array.isArray(node)) return false;
        return Boolean(node.properties || node.items || node.oneOf || node.anyOf || node.allOf || node.$ref);
      }

      function hasSchemaFields(schema) {
        if (!schema || typeof schema !== 'object') return false;
        if (schema.type === 'array') return true;
        if (schema.items) return true;
        if (schema.oneOf || schema.anyOf || schema.allOf) return true;
        var props = schema.properties || {};
        return Object.keys(props).length > 0;
      }

      function normalizeSchema(schema) {
        var normalized = angular.copy(schema) || { type: 'object' };
        if (!normalized.type && normalized.properties) {
          normalized.type = 'object';
        }
        if (!normalized.type && !normalized.properties) {
          normalized.type = 'object';
          normalized.properties = {};
        }
        return normalized;
      }

      function buildFallbackSchema(sample) {
        sample = sample || {};
        var keys = Object.keys(sample);
        var properties = {};
        keys.forEach(function (key) {
          properties[key] = inferSchemaForValue(sample[key], key);
        });
        return { type: 'object', properties: properties };
      }

      function inferSchemaForValue(value, key) {
        if (Array.isArray(value)) {
          return { type: 'array', title: key, items: { type: 'string' } };
        }
        if (value && typeof value === 'object') {
          return buildFallbackSchema(value);
        }
        if (typeof value === 'number') {
          return { type: Number.isInteger(value) ? 'integer' : 'number', title: key };
        }
        if (typeof value === 'boolean') {
          return { type: 'boolean', title: key };
        }
        return { type: 'string', title: key };
      }

      function buildDefaultsFromSchema(schema) {
        var resolved = normalizeSchema(schema || {});
        return sampleFromSchema(resolved, 'value');
      }

      function hydrateModelFromSchema(schema, existing) {
        var normalized = normalizeSchema(schema || { type: 'object', properties: {} });
        var source = existing;

        if (normalized.type === 'object' || normalized.properties) {
          var objectSource = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
          var result = {};
          Object.keys(normalized.properties || {}).forEach(function (key) {
            result[key] = hydrateModelFromSchema(normalized.properties[key], objectSource[key]);
          });
          return result;
        }

        if (normalized.type === 'array') {
          var arraySource = Array.isArray(source) ? source : [];
          var itemSchema = normalizeSchema(normalized.items || { type: 'string' });
          if (!arraySource.length) return [];
          return arraySource.map(function (item) {
            return hydrateModelFromSchema(itemSchema, item);
          });
        }

        if (source !== undefined && source !== null) {
          return source;
        }

        if (normalized.default !== undefined) {
          return angular.copy(normalized.default);
        }

        return undefined;
      }

      function sampleFromSchema(schema, keyName) {
        if (!schema || typeof schema !== 'object') return undefined;

        if (schema.default !== undefined) {
          return angular.copy(schema.default);
        }

        var pick = (schema.oneOf && schema.oneOf[0]) || (schema.anyOf && schema.anyOf[0]) || (schema.allOf && schema.allOf[0]);
        if (pick) {
          return sampleFromSchema(pick, keyName);
        }

        if (schema.type === 'object' || schema.properties) {
          var obj = {};
          Object.keys(schema.properties || {}).forEach(function (name) {
            obj[name] = sampleFromSchema(schema.properties[name], name);
          });
          return obj;
        }

        if (schema.type === 'array') {
          return [];
        }

        return undefined;
      }

      function sampleString(keyName, format) {
        return '';
      }

      function emptyItemFromSchema(itemSchema) {
        var normalized = normalizeSchema(itemSchema || { type: 'string' });
        if (normalized.type === 'object' || normalized.properties) {
          var obj = {};
          Object.keys(normalized.properties || {}).forEach(function (name) {
            obj[name] = emptyItemFromSchema(normalized.properties[name]);
          });
          return obj;
        }
        if (normalized.type === 'array') {
          return [];
        }
        if (normalized.default !== undefined) {
          return angular.copy(normalized.default);
        }
        return undefined;
      }

      function mergeDefaults(primary, fallback) {
        if (!primary || typeof primary !== 'object' || Array.isArray(primary)) {
          return fallback || primary;
        }
        var merged = angular.copy(primary);
        Object.keys(fallback || {}).forEach(function (key) {
          if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
            merged[key] = angular.copy(fallback[key]);
          }
        });
        return merged;
      }

      function mergeSchemaValues(primary, fallback) {
        if (Array.isArray(primary)) {
          return primary.length ? angular.copy(primary) : (Array.isArray(fallback) ? angular.copy(fallback) : []);
        }

        if (!primary || typeof primary !== 'object') {
          return fallback !== undefined ? angular.copy(fallback) : angular.copy(primary);
        }

        var merged = angular.copy(primary);
        Object.keys(fallback || {}).forEach(function (key) {
          if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
            merged[key] = angular.copy(fallback[key]);
            return;
          }
          if (merged[key] && typeof merged[key] === 'object' && !Array.isArray(merged[key]) && fallback[key] && typeof fallback[key] === 'object' && !Array.isArray(fallback[key])) {
            merged[key] = mergeSchemaValues(merged[key], fallback[key]);
          }
        });
        return merged;
      }

      function safeSerialize(value) {
        try {
          return JSON.stringify(value || {});
        } catch (e) {
          vm.callToolForm.renderError = 'Unable to serialize payload from editor model.';
          return '';
        }
      }

      function stripEmptyValues(value) {
        if (Array.isArray(value)) {
          var cleanedArray = [];
          value.forEach(function (item) {
            var cleanedItem = stripEmptyValues(item);
            if (cleanedItem === undefined) return;
            if (cleanedItem && typeof cleanedItem === 'object' && !Array.isArray(cleanedItem)
                && Object.keys(cleanedItem).length === 0) {
              return;
            }
            if (Array.isArray(cleanedItem) && cleanedItem.length === 0) {
              return;
            }
            cleanedArray.push(cleanedItem);
          });
          return cleanedArray;
        }

        if (value && typeof value === 'object') {
          var cleanedObject = {};
          var hasValue = false;
          Object.keys(value).forEach(function (key) {
            var cleanedChild = stripEmptyValues(value[key]);
            if (cleanedChild === undefined) return;
            if (cleanedChild && typeof cleanedChild === 'object' && !Array.isArray(cleanedChild)
                && Object.keys(cleanedChild).length === 0) {
              return;
            }
            if (Array.isArray(cleanedChild) && cleanedChild.length === 0) {
              return;
            }
            cleanedObject[key] = cleanedChild;
            hasValue = true;
          });
          return hasValue ? cleanedObject : undefined;
        }

        if (value === null || value === undefined || value === '') {
          return undefined;
        }

        return value;
      }

      function setValueAtPath(target, path, value) {
        if (!target || !path) return;
        var normalizedPath = String(path || '').replace(/^root\.?/, '');
        if (!normalizedPath) return;

        var tokens = [];
        normalizedPath.replace(/([^[.\]]+)|\[(\d+)\]/g, function (_, key, index) {
          tokens.push(index !== undefined ? Number(index) : key);
          return _;
        });
        if (!tokens.length) return;

        var cursor = target;
        for (var i = 0; i < tokens.length - 1; i++) {
          var token = tokens[i];
          if (cursor[token] === undefined || cursor[token] === null) {
            cursor[token] = typeof tokens[i + 1] === 'number' ? [] : {};
          }
          cursor = cursor[token];
        }
        cursor[tokens[tokens.length - 1]] = value;
      }

      function prettyFromSerialized(serialized) {
        try {
          return JSON.stringify(JSON.parse(serialized || '{}'), null, 2);
        } catch (e) {
          return serialized || '{}';
        }
      }

      function reindexExpandedArray(path, removedIndex) {
        if (!path || !vm.callToolForm || !vm.callToolForm.expanded) return;
        vm.callToolForm.expanded = reindexExpandedArrayMap(vm.callToolForm.expanded, path, removedIndex);
      }

      function reindexExpandedArrayMap(sourceMap, path, removedIndex) {
        var next = {};
        Object.keys(sourceMap || {}).forEach(function (key) {
          if (key.indexOf(path + '[') !== 0) {
            next[key] = sourceMap[key];
            return;
          }

          var tail = key.slice(path.length);
          var match = tail.match(/^\[(\d+)\](.*)$/);
          if (!match) {
            next[key] = sourceMap[key];
            return;
          }

          var index = Number(match[1]);
          if (index === removedIndex) return;
          var adjusted = index > removedIndex ? index - 1 : index;
          var rebasedKey = path + '[' + adjusted + ']' + (match[2] || '');
          next[rebasedKey] = sourceMap[key];
        });
        return next;
      }

      function compactObject(value) {
        if (Array.isArray(value)) {
          return value.map(compactObject).filter(function (item) {
            return item !== undefined;
          });
        }

        if (!value || typeof value !== 'object') {
          if (value === '' || value === null || value === undefined) return undefined;
          return value;
        }

        var compacted = {};
        Object.keys(value).forEach(function (key) {
          var nested = compactObject(value[key]);
          if (nested !== undefined) {
            compacted[key] = nested;
          }
        });

        return Object.keys(compacted).length ? compacted : undefined;
      }

      function unwrapResult(response) {
        if (response && Object.prototype.hasOwnProperty.call(response, 'result')) {
          return response.result;
        }
        return response;
      }

      function extractError(error) {
        if (error && error.data) {
          if (error.data.error && error.data.error.error_detail) return error.data.error.error_detail;
          if (error.data.error) return typeof error.data.error === 'string' ? error.data.error : JSON.stringify(error.data.error);
          if (error.data.message) return error.data.message;
          if (typeof error.data === 'string') return error.data;
        }
        return error && error.status ? 'HTTP ' + error.status + ' ' + (error.statusText || '') : 'Unknown request error';
      }

      function tokenize(value) {
        if (!value) return [];
        return String(value).split(/[,\s]+/).map(function (item) { return item.trim(); }).filter(Boolean);
      }

      function asArray(value) {
        return Array.isArray(value) ? value : value ? [value] : [];
      }

      function lower(value) {
        return String(value || '').toLowerCase();
      }

      function truthy(value) {
        return value === true || String(value).toLowerCase() === 'true';
      }

      function findBy(list, key, value) {
        return (list || []).find(function (item) { return item[key] === value; });
      }

      function cleanEmpty(obj) {
        Object.keys(obj || {}).forEach(function (key) {
          if (obj[key] === '' || obj[key] == null) delete obj[key];
        });
      }

      function readJson(key, fallback) {
        try {
          return JSON.parse(localStorage.getItem(key)) || fallback;
        } catch (e) {
          return fallback;
        }
      }

      function chain(items, fn) {
        return items.reduce(function (promise, item) {
          return promise.then(function () { return fn(item); });
        }, $q.when());
      }

      function showModal(id) {
        var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
        modal.show();
      }

      function hideModal(id) {
        var el = document.getElementById(id);
        var modal = bootstrap.Modal.getInstance(el);
        if (modal) modal.hide();
      }
    }]);
})();
