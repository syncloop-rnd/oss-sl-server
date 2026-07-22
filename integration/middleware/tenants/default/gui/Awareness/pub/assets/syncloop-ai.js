const API = window.ENV.API_BASE_URL + "/tenant/" + localStorage.getItem("tenant");

const SYNCLOOP_AI = {

    CORE: {
        initialize: function() {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.initialize.main?_ts=' + new Date().getTime(),
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {

                },
                error: function(xhr, status, error) {

                }
            });
        },

        exportAll: function(success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.exportAll.main?_ts=' + new Date().getTime(),
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        }
    },
    CONVERSATIONS: {
        findAll: function(success, errorFun) {
            $.ajax({
                url: API + '/awareness/list/conversations?_ts=' + new Date().getTime(),
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        likeMessage: function(messageId, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.assistant.api.likeMessage.main?message_id=' + messageId,
                method: 'PATCH',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        unlikeMessage: function(messageId, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.assistant.api.unlikeMessage.main?message_id=' + messageId,
                method: 'PATCH',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        delete: function(chatId, success, errorFun) {
            $.ajax({
                url: API + '/awareness/conversation?chatID=' + chatId,
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        clearChatHistory: function(agentId, chatIds, success, errorFun) {
            $.ajax({
                url: API + '/team/clearHistory',
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    agentId: agentId,
                    identifiers: chatIds
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        getChatHistory: function(agentId, chatId, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.assistant.api.getChatHistory.main?chatID=' + chatId + "&agentID=" + agentId,
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },
        downloadChatHistory: function(agentId, chatId) {
            $.ajax({
                url: API + '/packages.Awareness.assistant.api.getChatHistory.main?chatID=' + chatId + "&agentID=" + agentId,
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {

                    var list = [];

                    for (var i = 0; i < response.chatHistory.length; i++) {
                        list.push({
                            text: response.chatHistory[i].prompt,
                            user: 'User',
                            uuid: response.chatHistory[i].uuid
                        });

                        list.push({
                            liked: response.chatHistory[i].liked,
                            unliked: response.chatHistory[i].unliked,
                            text: response.chatHistory[i].response,
                            user: 'Agent',
                            uuid: response.chatHistory[i].uuid
                        });
                    }

                    let data = "";
                    for (let i = 0; i < list.length; i++) {
                        data += list[i].user + ": " + list[i].text + "\n";
                    }

                    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
                    const blob = new Blob([text], {
                        type: "text/plain"
                    });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "TeamChat";
                    document.body.appendChild(link); // Required for Firefox
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        }
    },

    RAG: {

        upsertRAG: function(ragName, ragID, identifier, directory, fileNamePattern, EMKey, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.createRAG.main?_ts=' + new Date().getTime(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    ragName: ragName,
                    ragID: ragID,
                    identifier: identifier,
                    directory: directory,
                    fileNamePattern: fileNamePattern,
                    EMKey: EMKey,
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        deleteRAG: function(id, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.deleteRAG.main?identifier=' + id,
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        }

    },

    KB: {

        upsertKB: function(kbID, name, description, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.saveKB.main?_ts=' + new Date().getTime(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    ragID: kbID,
                    name: name,
                    description: description
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        deleteKB: function(kbID, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.deleteKB.main?ragID=' + kbID,
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        }

    },

    LLM: {
        upsertLLM: function(LLMkey, name, description, provider, maxTokens, llmUrl, apiKey, modelName,
                            temperature, topP, enableParallelToolCalls, displayName, sstc, llmVerificationType, properties, success, errorFun) {

            return $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.createLLMSpec.main?_ts=' + new Date().getTime(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    LLMKey: LLMkey,
                    name: name,
                    description:description,
                    provider: provider,
                    maxTokens: maxTokens,
                    llmUrl: llmUrl,
                    apiKey: apiKey,
                    modelName: modelName,
                    temperature: temperature,
                    topP: topP,
                    enableParallelToolCalls: enableParallelToolCalls,
                    displayName: displayName,
                    sstc: sstc,
                    llmVerificationType: llmVerificationType,
                    properties: properties
                }),
                success: function(response) {
                    if (typeof success === 'function') {
                        success(response);
                    } else {
                        console.log("LLM saved successfully:", response);
                    }
                },
                error: function(xhr, status, error) {
                    if (typeof errorFun === 'function') {
                        errorFun(xhr, status, error);
                    } else {
                        console.error("LLM save failed:", status, error, xhr);
                    }
                }
            });
        },

        deleteLLM: function(LLMkey, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.deleteLLMSpec.main?LLMKey=' + LLMkey,
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    if (response && typeof response.status === 'string' && response.status.toLowerCase() === 'failed') {
                        if (typeof errorFun === 'function') {
                            errorFun({ responseJSON: response, responseText: response.error || '' }, 'error', response.error || 'Could not delete LLM.');
                        }
                        return;
                    }
                    if (typeof success === 'function') {
                        success(response);
                    }
                },
                error: function(xhr, status, error) {
                    if (typeof errorFun === 'function') {
                        errorFun(xhr, status, error);
                    }
                }
            });
        }
    },


    TOOLS: {
        upsertTool: function(agentID, fqn, staticPayload, inputJSONSchema, functionDescription, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.addTool.main?_ts=' + new Date().getTime(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    agentID: agentID,
                    fqn: fqn,
                    staticPayload: staticPayload,
                    inputJSONSchema: inputJSONSchema,
                    functionDescription: functionDescription
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },
        deleteTool: function(identifier, fqn, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.deleteTool.main?identifier=' + identifier + "&fqn=" + fqn,
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        }
    },

    AGENT_TOOL: {

        deleteAgentTool: function (uuid, successFallback, errorFallback) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.agent_tools.delete.main?_ts=' + Date.now() +
                    "&uuid=" + uuid,
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                success: function(response) {
                    successFallback(response);
                },
                error: function(xhr, status, error) {
                    errorFallback(xhr, status, error);
                }
            });
        },

        updateAuthInfo: function(id, authInfo, validate, successFallback, errorFallback) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.agent_tools.updateAuthInfo.main?_ts=' + Date.now(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    id: id,
                    authInfo: authInfo,
                    validate: !!validate
                }),
                success: function(response) {
                    successFallback(response);
                },
                error: function(xhr, status, error) {
                    errorFallback(xhr, status, error);
                }
            });
        }

    },

    AGENTS: {
        upsertAgent: function(agentID, title, agentName, description, LLMKey, icon, allowWebSearch, successOrProps, errorOrSuccess, maybeError) {
            let props = {};
            let success;
            let errorFun;

            if (typeof successOrProps === 'function') {
                // OLD style: no props
                success = successOrProps;
                errorFun = errorOrSuccess;
            } else {
                // NEW style: props included
                props = successOrProps || {};
                success = errorOrSuccess;
                errorFun = maybeError;
            }

            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.createAgent.main?_ts=' + Date.now(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    agentID: agentID,
                    title: title,
                    agentName: agentName,
                    description: description,
                    LLMKey: LLMKey,
                    icon: icon,
                    webSearch: allowWebSearch,
                    props: props
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },
        deleteAgent: function(agentID, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.deleteAgent.main?agentID=' + agentID,
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },
        addWrapperService: function(agentId, agentName, agentDescription, consumerGroups, isPublic, wrapperService, success, error) {

            if (null == wrapperService) {
                wrapperService = WRAPPER_SERVICE_JSON;
                wrapperService.latest.api[0].children[0].children[0].data.createList = [];

                wrapperService.latest.api[0].children[0].children[0].data.createList.push({
                    path: "agentId",
                    value: agentId,
                    id: generateUUID(),
                    typePath: 'string'
                });

                wrapperService.latest.api[0].children[0].children[0].data.createList.push({
                    path: "agentName",
                    value: agentName,
                    id: generateUUID(),
                    typePath: 'string'
                });
            }

            let serviceName = "_" + agentId.replaceAll("-", "_");

            let wrapperConsumers = wrapperService['consumers'].split(",");

            if (null != consumerGroups) {
                wrapperConsumers.push(...[consumerGroups]);
            }

            if (isPublic) {
                wrapperConsumers.push("guest");
            } else {
                wrapperConsumers = wrapperConsumers.filter(item => item !== "guest");
            }

            wrapperConsumers = [...new Set(wrapperConsumers.filter(item => item !== ""))];

            wrapperService['latest']['api_info']['title'] = agentName;
            wrapperService['latest']['api_info']['description'] = agentDescription;
            wrapperService['consumers'] = wrapperConsumers + "";

            $.ajax({
                url: API + '/api/packages/ConsumerAgents/wrapper/api/agents/' + serviceName + '.api',
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(wrapperService),
                success: function(response) {
                    if (typeof success === "function") success(response);
                },
                error: function(xhr, status, err) {
                    if (typeof error === "function") error(xhr, status, err);
                }
            });

            let alias = 'POST/packages.ConsumerAgents.wrapper.api.agents.' + serviceName + '.main/{action}';

            if (isPublic) {
                alias = 'POST/public/packages.ConsumerAgents.wrapper.api.agents.' + serviceName + '.main/{action}';
            }

            $.ajax({
                url: API + '/alias?fqn=packages.ConsumerAgents.wrapper.api.agents.' + serviceName +
                    '.main&alias=' + encodeURI(alias),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {

                },
                error: function(xhr, status, error) {

                }
            });

        }
    },
    SFS: {
        getFileList: function(path, success, errorFun) {
            $.ajax({
                url: API + '/packages.FileManager.dashboard.services.api.listFiles.main?path=' + path + '&_ts=' + new Date().getTime(),
                method: 'GET',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        }
    },
    APPS: {
        fetchApps: function(success, errorFun) {
            SYNCLOOP_AI.CORE.exportAll(success, errorFun);
        },
        upsertApp: function(id, name, description, llmKey, appLink,
                            success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.apps.upsertApp.main',
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    appId: id,
                    name: name,
                    description: description,
                    llmKey: llmKey,
                    appLink: appLink
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },
        deleteApp: function(id, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.apps.deleteApp.main?appId=' + id,
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        }
    },

    TEAMS: {
        findAllTeams: function(success, errorFun) {
            SYNCLOOP_AI.CORE.exportAll(success, errorFun);
        },

        upsertTeam: function(teamID, name, requirement, appId, managerId, agents, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.teams.upsertTeam.main?_ts=' + new Date().getTime(),
                method: 'PUT',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    teamID: teamID,
                    name: name,
                    requirement: requirement,
                    appId: appId,
                    managerId: managerId,
                    agents: agents
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        addTeam: function(teamID, name, requirement, appId, managerId, agents, success, errorFun) {
            // Deprecated: use upsertTeam.
            SYNCLOOP_AI.TEAMS.upsertTeam(teamID, name, requirement, appId, managerId, agents, success, errorFun);
        },

        updateTeam: function(id, name, requirement, appId, managerId, agents, success, errorFun) {
            // Deprecated: use upsertTeam.
            SYNCLOOP_AI.TEAMS.upsertTeam(id, name, requirement, appId, managerId, agents, success, errorFun);
        },

        addAgentInTeam: function(teamID, agentId, success, errorFun) {
            $.ajax({
                url: API + '/packages.syncloopai.dashboard.services.api.teams.addAgentInTeam.main?_ts=' + new Date().getTime(),
                method: 'PATCH',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    TEAM_ID: teamID,
                    AGENT_ID: agentId
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        deleteTeam: function(id, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.teams.deleteTeam.main?teamID=' + id,
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },
    },

    TOOLS_REGISTRY: {
        // 1. Upsert (Create or Update) the full Tool Registry entry
        updateRegistry: function(UUID, NAME, DESCRIPTION, FQN, SCHEMA, STATIC_PAYLOAD, AGENT_ACCESS, STATUS, SOURCE, MCP_ID, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.tools_registry.save.main?_ts=' + new Date().getTime(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    uuid: UUID,
                    fqn: FQN,
                    name: NAME,
                    description: DESCRIPTION,
                    schema: JSON.stringify(SCHEMA),
                    staticPayload: STATIC_PAYLOAD,
                    agentAccess: AGENT_ACCESS || "PRIVATE",
                    status: STATUS || "ACTIVE",
                    source: SOURCE || "SL_API",
                    active: true,
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        // 2. Add/Update just the Schema
        updateSchema: function(UUID, SCHEMA, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.tools_registry.updateSchemaByUuid.main?_ts=' + new Date().getTime(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({

                    schema: SCHEMA,
                    uuid: UUID

                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        // 3. Add/Update just the Static Payload
        updateStaticPayload: function(UUID, STATIC_PAYLOAD, success, errorFun) {
            $.ajax({
                // Removed the ?uuid= from the URL and added a timestamp to prevent caching
                url: API + '/packages.Awareness.dashboard.services.api.tools_registry.updateStaticPayloadByUuid.main?_ts=' + new Date().getTime(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',

                data: JSON.stringify({

                    staticPayload: STATIC_PAYLOAD, // Matches exactly with the screenshot
                    uuid: UUID // Matches exactly with the screenshot

                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        // 4. Delete the Tool Registry

        deleteRegistry: function(UUID, deleteTools, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.tools_registry.delete.main?uuid='
                    + UUID + '&deleteTools=' + deleteTools,
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },
        saveRegistry: function(name, description, fqn, schema, staticPayload, agentAccess, status, source, mcpId, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.tools_registry.save.main?_ts=' + new Date().getTime(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    name: name,
                    description: description,
                    source: source || "SL_API",
                    fqn: fqn,
                    schema: typeof schema === "string" ? schema : JSON.stringify(schema || {}),
                    staticPayload: typeof staticPayload === "string" ? staticPayload : JSON.stringify(staticPayload || {}),
                    status: status || "ACTIVE",
                    agentAccess: agentAccess || "PRIVATE",
                    mcpId: mcpId || null
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        }

    },

    MCP: {
        add: function(mcpEndpoint, mcpName, authType, authInfo, description, allowedTools, saveWithoutTools, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.mcp.save.main?_ts=' + new Date().getTime(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    mcpEndpoint: mcpEndpoint,
                    mcpName: mcpName,
                    authType: authType,
                    authInfo: JSON.stringify(authInfo),
                    description: description,
                    allowedTools: allowedTools || [],
                    saveWithoutTools: saveWithoutTools || false
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        edit: function(id, mcpEndpoint, mcpName, authType, authInfo, description, allowedTools, saveWithoutTools, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.mcp.save.main?_ts=' + new Date().getTime(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    id: id,
                    mcpEndpoint: mcpEndpoint,
                    mcpName: mcpName,
                    authType: authType,
                    authInfo: JSON.stringify(authInfo),
                    description: description,
                    allowedTools: allowedTools || [],
                    saveWithoutTools: saveWithoutTools || false
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        listMCPTools: function(mcpName, mcpEndpoint, authType, authInfo, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.mcp.MCPTools.main?_ts=' + new Date().getTime(),
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    mcpName: mcpName,
                    mcpEndpoint: mcpEndpoint,
                    authType: authType,
                    authInfo: JSON.stringify(authInfo)
                }),
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        },

        delete: function(id, deleteTools, success, errorFun) {
            $.ajax({
                url: API + '/packages.Awareness.dashboard.services.api.mcp.delete.main?id='
                    + encodeURIComponent(id) + '&deleteTools=' + deleteTools,
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("AuthToken")}`
                },
                success: function(response) {
                    success(response);
                },
                error: function(xhr, status, error) {
                    errorFun(xhr, status, error);
                }
            });
        }
    }


}

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
