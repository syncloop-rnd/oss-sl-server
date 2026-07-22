package packages.Awareness.assistant.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
public final class get_action_details{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

    Object agentIdObj = dataPipeline.get("agentId");

    if (agentIdObj == null) {
        agentIdObj = dataPipeline.get("agentID");
    }

    if (agentIdObj == null) {
        agentIdObj = dataPipeline.get("AgentId");
    }

    if (agentIdObj == null) {
        agentIdObj = dataPipeline.get("AgentID");
    }

    if (agentIdObj == null || String.valueOf(agentIdObj).trim().isEmpty()) {
        dataPipeline.put("status", "failed");
        dataPipeline.put("error", "agentId is required");
        return;
    }

    String agentId = String.valueOf(agentIdObj).trim();

    DataPipeline tempPipeline = new DataPipeline(dataPipeline.rp, "", "");

    /*
     * IMPORTANT:
     * getByPaging internally expects apiServiceJson.
     * In your test case, apiServiceJson is coming as null,
     * so we are passing blank JSON instead of leaving it null.
     */
    Object apiServiceJson = dataPipeline.get("apiServiceJson");

    if (apiServiceJson != null && !String.valueOf(apiServiceJson).trim().isEmpty()) {
        tempPipeline.put("apiServiceJson", String.valueOf(apiServiceJson));
    } else {
        tempPipeline.put("apiServiceJson", "{}");
    }

    ServiceUtils.execute(
            "/Awareness/dashboard/services/api/agent_tools/getByPaging",
            tempPipeline
    );

    Map<String, Object> getByPagingResponse = tempPipeline.getMap();

    Object agentToolsObj = getByPagingResponse.get("agentTools");

    List<Map<String, Object>> actions = new ArrayList<>();

    if (agentToolsObj instanceof List) {

        List<?> agentTools = (List<?>) agentToolsObj;

        for (Object obj : agentTools) {

            if (!(obj instanceof Map)) {
                continue;
            }

            Map<String, Object> agentTool = (Map<String, Object>) obj;

            Object currentAgentIdObj = agentTool.get("AGENT_ID");

            if (currentAgentIdObj == null) {
                continue;
            }

            String currentAgentId = String.valueOf(currentAgentIdObj).trim();

            if (!agentId.equals(currentAgentId)) {
                continue;
            }

            Object toolRegistryObj = agentTool.get("tools_registry");

            if (!(toolRegistryObj instanceof Map)) {
                continue;
            }

            Map<String, Object> toolRegistry = (Map<String, Object>) toolRegistryObj;

            String name = toolRegistry.get("NAME") != null
                    ? String.valueOf(toolRegistry.get("NAME"))
                    : "";

            String schema = toolRegistry.get("SCHEMA") != null
                    ? String.valueOf(toolRegistry.get("SCHEMA"))
                    : "{}";

            Map<String, Object> actionObj = new HashMap<>();
            actionObj.put("action", name);
            actionObj.put("schema", schema);

            actions.add(actionObj);
        }
    }

    dataPipeline.put("status", "success");
    dataPipeline.put("agentId", agentId);
    dataPipeline.put("count", actions.size());
    dataPipeline.put("actions", actions);

} catch (Exception e) {

    e.printStackTrace();

    dataPipeline.put("status", "failed");
    dataPipeline.put("error", e.toString());
}
	}

}