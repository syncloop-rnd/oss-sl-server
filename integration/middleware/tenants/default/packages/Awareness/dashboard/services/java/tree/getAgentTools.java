package packages.Awareness.dashboard.services.java.tree;
import agents.core.tools.model.AgentTools;
import agents.core.tools.model.ToolsRegistry;
import agents.core.tools.service.AgentToolsService;
import agents.core.tools.service.ToolsRegistryService;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
public final class getAgentTools{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            Set<String> targetIdentifiers = collectTargetIdentifiers(dataPipeline);
            if (targetIdentifiers.isEmpty()) {
                throw new IllegalArgumentException("MANAGER_ID or AGENT_IDS is required");
            }

            AgentToolsService agentToolsService = new AgentToolsService(dataPipeline);
            ToolsRegistryService toolsRegistryService = new ToolsRegistryService(dataPipeline);

            List<Map<String, Object>> tools = new ArrayList<>();
            Set<String> seen = new LinkedHashSet<>();

            for (String targetIdentifier : targetIdentifiers) {
                UUID agentId = toUuid(targetIdentifier);
                if (agentId == null) {
                    continue;
                }

                List<AgentTools> agentTools = agentToolsService.listByAgentId(agentId);
                for (AgentTools agentTool : agentTools) {
                    if (agentTool == null || !agentTool.isActive()) {
                        continue;
                    }

                    String rowId = firstNonBlank(
                            agentTool.getUuid(),
                            agentTool.getToolId(),
                            targetIdentifier
                    );

                    if (!seen.add(rowId)) {
                        continue;
                    }

                    ToolsRegistry registry = null;
                    if (agentTool.getToolId() != null) {
                        registry = toolsRegistryService.get(agentTool.getToolId());
                    }

                    String visibleName = firstNonBlank(
                            registry == null ? null : registry.getName(),
                            registry == null ? null : registry.getFqn(),
                            rowId
                    );

                    String rawDescription = firstNonBlank(
                            agentTool.getDescription(),
                            registry == null ? null : registry.getDescription(),
                            ""
                    );

                    String rawStaticPayload = firstNonBlank(
                            agentTool.getStaticPayload(),
                            registry == null ? null : registry.getStaticPayload(),
                            "{}"
                    );

                    String rawSchema = firstNonBlank(
                            agentTool.getAgentSchema(),
                            registry == null ? null : registry.getSchema(),
                            "{}"
                    );

                    Map<String, Object> tool = new LinkedHashMap<>();
                    tool.put("id", rowId);
                    tool.put("identifier", targetIdentifier);
                    tool.put("fqn", visibleName);
                    tool.put("description", encodeBase64(rawDescription));
                    tool.put("staticJsonPayload", encodeBase64(rawStaticPayload));
                    tool.put("api", resolveApiDetail(
                            dataPipeline,
                            registry,
                            visibleName,
                            rawDescription,
                            rawSchema,
                            rawStaticPayload
                    ));

                    tools.add(tool);
                }
            }

            dataPipeline.clear();
            dataPipeline.put("tools", tools);
            dataPipeline.put("count", tools.size());
            dataPipeline.put("status", "success");

        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            throw new SnippetException(dataPipeline, "Snippet exception", e);
        }
	}
private static Map<String, Object> resolveApiDetail(
            DataPipeline dataPipeline,
            ToolsRegistry registry,
            String visibleName,
            String rawDescription,
            String rawSchema,
            String rawStaticPayload
    ) {
        Map<String, Object> api = new LinkedHashMap<>();

        String executionFqn = registry == null ? null : trimToNull(registry.getFqn());
        String displayName = firstNonBlank(
                registry == null ? null : registry.getName(),
                visibleName,
                executionFqn
        );
        String description = firstNonBlank(
                registry == null ? null : registry.getDescription(),
                rawDescription,
                ""
        );

        api.put("id", executionFqn == null ? displayName : executionFqn);
        api.put("name", displayName);
        api.put("description", encodeBase64(description));

        if (executionFqn == null) {
            return api;
        }

        try {
            dataPipeline.put("fqn", executionFqn);
            dataPipeline.put("inputJSONSchema", rawSchema == null ? "" : rawSchema);
            dataPipeline.put("staticJsonPayload", encodeBase64(rawStaticPayload == null ? "{}" : rawStaticPayload));

            dataPipeline.apply("packages.Awareness.dashboard.services.java.getAPIDetail");

            String apiId = firstNonBlank(dataPipeline.get("id"), executionFqn);
            String apiName = firstNonBlank(dataPipeline.get("name"), displayName, executionFqn);
            String apiDescription = firstNonBlank(
                    dataPipeline.get("description"),
                    registry == null ? null : registry.getDescription(),
                    rawDescription,
                    ""
            );

            api.put("id", apiId);
            api.put("name", apiName);
            api.put("description", encodeBase64(apiDescription));
        } catch (Exception ignored) {
            // Keep fallback api info
        }

        return api;
    }

    private static Set<String> collectTargetIdentifiers(DataPipeline dataPipeline) {
        Set<String> ids = new LinkedHashSet<>();

        addIfPresent(ids, dataPipeline.get("identifier"));
        addIfPresent(ids, dataPipeline.get("MANAGER_ID"));
        collectIdList(ids, dataPipeline.get("AGENT_IDS"));

        Object businessTeams = dataPipeline.get("business_teams");
        if (businessTeams == null) {
            Object template = dataPipeline.get("template");
            if (template instanceof Map<?, ?>) {
                businessTeams = ((Map<?, ?>) template).get("business_teams");
            }
        }

        collectFromNestedTeams(ids, businessTeams);
        return ids;
    }

    @SuppressWarnings("unchecked")
    private static void collectFromNestedTeams(Set<String> ids, Object value) {
        if (value == null) {
            return;
        }

        if (value instanceof Map<?, ?>) {
            Map<String, Object> row = (Map<String, Object>) value;
            addIfPresent(ids, row.get("MANAGER_ID"));
            collectIdList(ids, row.get("AGENT_IDS"));
            return;
        }

        if (value instanceof List<?>) {
            for (Object item : (List<?>) value) {
                collectFromNestedTeams(ids, item);
            }
        }
    }

    private static void collectIdList(Set<String> ids, Object value) {
        if (value instanceof List<?>) {
            for (Object item : (List<?>) value) {
                addIfPresent(ids, item);
            }
        } else {
            addIfPresent(ids, value);
        }
    }

    private static void addIfPresent(Set<String> ids, Object value) {
        String text = trimToNull(stringValue(value));
        if (text != null) {
            ids.add(text);
        }
    }

    private static UUID toUuid(String value) {
        try {
            return value == null ? null : UUID.fromString(value);
        } catch (Exception e) {
            return null;
        }
    }

    private static String encodeBase64(String value) {
        if (value == null) {
            value = "";
        }
        return Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String firstNonBlank(Object... values) {
        if (values == null) {
            return null;
        }

        for (Object value : values) {
            String text = trimToNull(stringValue(value));
            if (text != null) {
                return text;
            }
        }
        return null;
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
}