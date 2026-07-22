package packages.middleware.pub.server.build.components.services;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
import com.fasterxml.jackson.databind.ObjectMapper;
public final class switchCase{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            String input = dataPipeline.getString("input");
            if (input == null || input.trim().isEmpty()) {
                return;
            }

            ObjectMapper mapper = new ObjectMapper();
            
            Map<String, Object> item = mapper.readValue(input, Map.class);
            
            List<Map<String, Object>> outputObj = new ArrayList<>();
            
            int[] counter = {1};
            
            iterate(item, 0, outputObj, counter);

            dataPipeline.put("map", outputObj);
            
        } catch (Exception e) {
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("error_trace", Arrays.toString(e.getStackTrace()));
        }
	}
public static void iterate(Map<String, Object> map, int level, List<Map<String, Object>> outputObj, int[] counter) {

        String id = "j1_" + (counter[0]++);
        String nodeType = (String) map.getOrDefault("type", "group");

        Map<String, Object> element = new HashMap<>();
        element.put("id", id);
        
        Map<String, Object> li_attr = new HashMap<>();
        li_attr.put("id", id);
        element.put("li_attr", li_attr);

        Map<String, Object> a_attr = new HashMap<>();
        a_attr.put("id", id + "_anchor");

        Map<String, Object> state = new HashMap<>();
        state.put("loaded", true);
        state.put("disabled", false);
        state.put("selected", false);

        Map<String, Object> data = new HashMap<>();
        data.put("guid", UUID.randomUUID().toString());
        data.put("columnType", "-1");

        
        if ("switch".equalsIgnoreCase(nodeType)) {
            element.put("text", map.getOrDefault("var", "Switch"));
            element.put("type", "switch");
            element.put("icon", null);
            a_attr.put("href", "javascript:void(0)");
            
            state.put("opened", true);
            state.put("hidden", false); 
            
            if (map.containsKey("comment")) data.put("fieldDescription", map.get("comment"));

        } else if ("case_node".equals(nodeType)) {
            element.put("text", "CASE");
            element.put("type", "group"); 
            element.put("icon", null);
            a_attr.put("href", "#");
            
            state.put("opened", false);
            
            data.put("case", map.get("case"));
            if (map.containsKey("comment")) data.put("fieldDescription", map.get("comment"));

        } else if ("group".equalsIgnoreCase(nodeType)) {
            element.put("text", map.getOrDefault("var", "Group"));
            element.put("type", "group");
            element.put("icon", null);
            a_attr.put("href", "javascript:void(0)");
            state.put("opened", true);
            
            data.put("status", map.getOrDefault("status", "Enabled"));
            data.put("snapshot", map.getOrDefault("snapshot", "Disabled"));
            if (map.containsKey("comment")) data.put("fieldDescription", map.get("comment"));

        } else if ("transformer".equalsIgnoreCase(nodeType)) {
            element.put("text", map.getOrDefault("var", "Transformer"));
            element.put("type", "transformer");
            element.put("icon", null);
            a_attr.put("href", "#");
            state.put("opened", false);
            
            data.put("createList", new ArrayList<>());
            data.put("dropList", new ArrayList<>());
            data.put("initiateList", new ArrayList<>());
            data.put("lines", new ArrayList<>());
            data.put("transformers", new ArrayList<>());
            if (map.containsKey("val")) data.put("value", map.get("val"));
            if (map.containsKey("comment")) data.put("fieldDescription", map.get("comment"));
        }

        element.put("a_attr", a_attr);
        element.put("state", state);
        element.put("data", data);

        List<Map<String, Object>> childObj = new ArrayList<>();
        element.put("children", childObj);

        outputObj.add(element);

        
        if ("switch".equalsIgnoreCase(nodeType) && map.containsKey("conditions")) {
            List<Map<String, Object>> conditions = (List<Map<String, Object>>) map.get("conditions");
            for (Map<String, Object> condition : conditions) {
                condition.put("type", "case_node");
                iterate(condition, level + 1, childObj, counter);
            }
        } 
        else if (map.containsKey("child")) {
            List<Map<String, Object>> children = (List<Map<String, Object>>) map.get("child");
            for (Map<String, Object> child : children) {
                iterate(child, level + 1, childObj, counter);
            }
        }
    }
}