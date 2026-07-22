package packages.Awareness.assistant.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import java.util.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import agents.core.tools.service.AgentToolsService;
import com.eka.middleware.template.SnippetException;
public final class list_available_actions{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

    DataPipeline tempPipeline =
            new DataPipeline(dataPipeline.rp, "", "");

    tempPipeline.put("page", 1);
    tempPipeline.put("pageSize", 100);

    ServiceUtils.execute(
    "packages.Awareness.dashboard.services.java.agent_tools.getByPaging",
    tempPipeline
);

    List<Map<String, Object>> agentTools =
            (List<Map<String, Object>>) tempPipeline.get("agentTools");

    List<Map<String, Object>> tools =
            new ArrayList<>();

    if (agentTools != null) {

        for (Map<String, Object> tool : agentTools) {

            Object registryObj =
                    tool.get("tools_registry");

            if (registryObj instanceof Map) {

                Map<String, Object> registry =
                        (Map<String, Object>) registryObj;

                Map<String, Object> item =
                        new HashMap<>();

                item.put(
                        "action",
                        registry.get("NAME")
                );

                item.put(
                        "description",
                        registry.get("DESCRIPTION")
                );

                tools.add(item);
            }
        }
    }

    dataPipeline.put("tools", tools);
    dataPipeline.put("status", "success");

} catch (Exception e) {

    e.printStackTrace();

    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("status", "failed");
}
	}

}