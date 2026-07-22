package packages.Awareness.dashboard.services.java.tree;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.core.teams.service.TeamsService;
import agents.manager.AgentManager;
import agents.manager.ChatLanguageModelManager;
import agents.manager.FunctionManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
public final class getAppActorsAndToolsById{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            String appId = trimToNull(dataPipeline.getString("appId"));
            if (appId == null) {
                throw new IllegalArgumentException("appId is required");
            }

            Map<String, Object> appMeta = getLegacyAppMeta(dataPipeline, appId);
            List<Map<String, Object>> teams = getTeamsByAppId(dataPipeline, appId);
            List<Map<String, Object>> allAgents = listAgents(dataPipeline);
            List<Map<String, Object>> allTools = listTools(dataPipeline);
            List<Map<String, Object>> llms = listModels(dataPipeline);

            Map<String, Map<String, Object>> agentsById = indexByIdentifier(allAgents);
            Map<String, Map<String, Object>> modelMap = indexByLlmKey(llms);
            Map<String, List<Map<String, Object>>> toolsByIdentifier = groupToolsByIdentifier(
                    enrichToolsWithApi(allTools, dataPipeline)
            );

            List<Map<String, Object>> businessTeams = new ArrayList<>();

            for (Map<String, Object> team : teams) {
                if (team == null) {
                    continue;
                }

                Map<String, Object> teamDoc = new LinkedHashMap<>();
                teamDoc.put("name", stringValue(team.get("NAME")));
                teamDoc.put("id", firstNonBlank(team.get("TEAM_ID"), team.get("UUID")));
                teamDoc.put("description", base64(stringValue(team.get("REQUIREMENT"))));

                List<Map<String, Object>> businessAgents = new ArrayList<>();
                for (String agentId : extractAgentIds(team.get("AGENT_IDS"))) {
                    Map<String, Object> sourceAgent = agentsById.get(agentId);

                    Map<String, Object> agentDoc = new LinkedHashMap<>();
                    agentDoc.put("identifier", agentId);
                    agentDoc.put("name", sourceAgent == null ? null : sourceAgent.get("name"));
                    agentDoc.put("title", sourceAgent == null ? null : sourceAgent.get("title"));
                    agentDoc.put("description", sourceAgent == null ? null : sourceAgent.get("roleDescription"));
                    agentDoc.put("LLMkey", sourceAgent == null ? null : sourceAgent.get("LLMkey"));

                    String llmKey = sourceAgent == null ? null : trimToNull(stringValue(sourceAgent.get("LLMkey")));
                    agentDoc.put("model", llmKey == null ? null : modelMap.get(llmKey));

                    List<Map<String, Object>> agentTools = toolsByIdentifier.get(agentId);
                    agentDoc.put("tools", agentTools == null ? new ArrayList<>() : copyList(agentTools));

                    businessAgents.add(agentDoc);
                }

                teamDoc.put("business_agents", businessAgents);
                businessTeams.add(teamDoc);
            }

            Map<String, Object> template = new LinkedHashMap<>();
            template.put("name", appMeta.get("name"));
            template.put("description", appMeta.get("description"));
            template.put("id", appMeta.get("id"));
            template.put("business_teams", businessTeams);

            dataPipeline.clear();
            dataPipeline.put("template", template);
            dataPipeline.put("status", "success");

        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            throw new SnippetException(dataPipeline, "Snippet exception", e);
        }
	}
private static Map<String, Object> getLegacyAppMeta(DataPipeline dataPipeline, String appId) {
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("id", appId);
        meta.put("name", null);
        meta.put("description", null);

        try {
            dataPipeline.put("appId", appId);
            dataPipeline.apply("packages.syncloopai.dashboard.services.api.apps.getApp");

            meta.put("id", firstNonBlank(dataPipeline.get("APP_ID"), dataPipeline.get("UUID"), appId));
            meta.put("name", stringValue(dataPipeline.get("NAME")));
            meta.put("description", stringValue(dataPipeline.get("DESCRIPTION")));
        } catch (Exception ignored) {
            meta.put("id", appId);
        }

        return meta;
    }

    private static List<Map<String, Object>> getTeamsByAppId(DataPipeline dataPipeline, String appId) throws SnippetException {
        dataPipeline.put("appId", appId);
        dataPipeline.apply("packages.Awareness.dashboard.services.api.teams.getTeamsByAppId");
        return asListOfMaps(dataPipeline.get("teams"));
    }

    private static List<Map<String, Object>> listAgents(DataPipeline dataPipeline) throws SnippetException {
        dataPipeline.apply("packages.Awareness.dashboard.services.api.listAgents");
        return asListOfMaps(dataPipeline.get("Agents"));
    }

    private static List<Map<String, Object>> listTools(DataPipeline dataPipeline) throws SnippetException {
        dataPipeline.apply("packages.Awareness.dashboard.services.api.listTools");
        return asListOfMaps(dataPipeline.get("Tools"));
    }

    private static List<Map<String, Object>> listModels(DataPipeline dataPipeline) throws SnippetException {
        dataPipeline.apply("packages.Awareness.dashboard.services.api.listModels");
        return asListOfMaps(dataPipeline.get("LLMs"));
    }

    private static List<Map<String, Object>> enrichToolsWithApi(List<Map<String, Object>> tools, DataPipeline dataPipeline) throws SnippetException {
        if (tools == null || tools.isEmpty()) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> enriched = new ArrayList<>();

        for (Map<String, Object> tool : tools) {
            if (tool == null) {
                continue;
            }

            String identifier = trimToNull(stringValue(tool.get("identifier")));
            if (identifier == null) {
                continue;
            }

            String fqn = trimToNull(stringValue(tool.get("fqn")));
            String inputJSONSchema = stringValue(tool.get("inputJSONSchema"));
            String functionDescription = stringValue(tool.get("functionDescription"));
            String staticJsonPayload = stringValue(tool.get("staticJsonPayload"));

            Map<String, Object> toolDoc = new LinkedHashMap<>();
            toolDoc.put("identifier", identifier);
            toolDoc.put("fqn", fqn);
            toolDoc.put("inputJSONSchema", inputJSONSchema);
            toolDoc.put("functionDescription", functionDescription);
            toolDoc.put("staticJsonPayload", staticJsonPayload);

            Map<String, Object> api = new LinkedHashMap<>();
            api.put("id", null);
            api.put("name", null);
            api.put("description", null);

            if (fqn != null) {
                dataPipeline.put("id", null);
                dataPipeline.put("name", null);
                dataPipeline.put("description", null);
                dataPipeline.put("fqn", fqn);
                dataPipeline.put("inputJSONSchema", inputJSONSchema);
                dataPipeline.put("staticJsonPayload", staticJsonPayload);

                dataPipeline.apply("packages.Awareness.dashboard.services.java.getAPIDetail");

                api.put("id", dataPipeline.get("id"));
                api.put("name", dataPipeline.get("name"));
                api.put("description", dataPipeline.get("description"));
            }

            toolDoc.put("api", api);
            enriched.add(toolDoc);
        }

        return enriched;
    }

    private static Map<String, List<Map<String, Object>>> groupToolsByIdentifier(List<Map<String, Object>> tools) {
        Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
        if (tools == null) {
            return grouped;
        }

        for (Map<String, Object> tool : tools) {
            if (tool == null) {
                continue;
            }

            String identifier = trimToNull(stringValue(tool.get("identifier")));
            if (identifier == null) {
                continue;
            }

            grouped.computeIfAbsent(identifier, k -> new ArrayList<>()).add(new LinkedHashMap<>(tool));
        }

        return grouped;
    }

    private static Map<String, Map<String, Object>> indexByIdentifier(List<Map<String, Object>> rows) {
        Map<String, Map<String, Object>> indexed = new LinkedHashMap<>();
        if (rows == null) {
            return indexed;
        }

        for (Map<String, Object> row : rows) {
            if (row == null) {
                continue;
            }

            String identifier = trimToNull(stringValue(row.get("identifier")));
            if (identifier != null) {
                indexed.put(identifier, row);
            }
        }

        return indexed;
    }

    private static Map<String, Map<String, Object>> indexByLlmKey(List<Map<String, Object>> rows) {
        Map<String, Map<String, Object>> indexed = new LinkedHashMap<>();
        if (rows == null) {
            return indexed;
        }

        for (Map<String, Object> row : rows) {
            if (row == null) {
                continue;
            }

            String llmKey = trimToNull(firstNonBlank(row.get("LLMkey"), row.get("LLMKey")));
            if (llmKey != null) {
                indexed.put(llmKey, row);
            }
        }

        return indexed;
    }

    private static List<String> extractAgentIds(Object rawAgentIds) {
        if (!(rawAgentIds instanceof List<?>)) {
            return Collections.emptyList();
        }

        Set<String> ids = new LinkedHashSet<>();
        for (Object item : (List<?>) rawAgentIds) {
            String value = trimToNull(stringValue(item));
            if (value != null) {
                ids.add(value);
            }
        }
        return new ArrayList<>(ids);
    }

    private static String base64(String value) {
        if (value == null) {
            value = "";
        }
        return Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String firstNonBlank(Object first, Object second) {
        String a = trimToNull(stringValue(first));
        if (a != null) {
            return a;
        }
        return trimToNull(stringValue(second));
    }

    private static String firstNonBlank(Object first, Object second, Object third) {
        String a = trimToNull(stringValue(first));
        if (a != null) {
            return a;
        }
        String b = trimToNull(stringValue(second));
        if (b != null) {
            return b;
        }
        return trimToNull(stringValue(third));
    }

    private static String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> asListOfMaps(Object value) {
        if (!(value instanceof List<?>)) {
            return Collections.emptyList();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : (List<?>) value) {
            if (item instanceof Map<?, ?>) {
                result.add((Map<String, Object>) item);
            }
        }
        return result;
    }

    private static List<Map<String, Object>> copyList(List<Map<String, Object>> source) {
        List<Map<String, Object>> copy = new ArrayList<>();
        for (Map<String, Object> item : source) {
            copy.add(new LinkedHashMap<>(item));
        }
        return copy;
    }
}