package packages.middleware.pub.server.build.components.services;
import com.eka.middleware.service.DataPipeline;
import java.util.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class if_else{
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
            dataPipeline.put("error", e.toString());
        }
	}
public static void iterate(Map<String, Object> map, int level, List<Map<String, Object>> outputObj, int[] counter) {

    String id = "j1_" + (counter[0]++);
    String nodeType = String.valueOf(map.getOrDefault("type", "group"));

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

    
    if ("switch".equalsIgnoreCase(nodeType) || "ifelse".equalsIgnoreCase(nodeType)) {
        element.put("text", map.getOrDefault("var", "ifelse".equals(nodeType) ? "If-Else" : "Switch"));
        element.put("type", nodeType.toLowerCase());
        element.put("icon", null);
        a_attr.put("href", "javascript:void(0)");
        state.put("opened", true);
        state.put("hidden", false); 
        if (map.containsKey("comment")) data.put("fieldDescription", map.get("comment"));

    } else if ("case_node".equals(nodeType) || "condition_node".equals(nodeType)) {
        element.put("text", "case_node".equals(nodeType) ? "CASE" : "CONDITION");
        element.put("type", "group"); 
        element.put("icon", null);
        a_attr.put("href", "#");
        state.put("opened", false);
        
        String valKey = "case_node".equals(nodeType) ? "case" : "condition";
        data.put(valKey, map.getOrDefault(valKey, "#default"));
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
        data.put("value", map.getOrDefault("val", ""));
        if (map.containsKey("comment")) data.put("fieldDescription", map.get("comment"));

    } else { // Defaults to Group
        element.put("text", map.getOrDefault("var", "Group"));
        element.put("type", "group");
        element.put("icon", null);
        a_attr.put("href", "javascript:void(0)");
        state.put("opened", true);
        data.put("status", map.getOrDefault("status", "Enabled"));
        data.put("snapshot", map.getOrDefault("snapshot", "Disabled"));
        if (map.containsKey("comment")) data.put("fieldDescription", map.get("comment"));
    }

    element.put("a_attr", a_attr);
    element.put("state", state);
    element.put("data", data);

    List<Map<String, Object>> childObj = new ArrayList<>();
    element.put("children", childObj);
    outputObj.add(element);
    
    Object conditions = map.get("conditions");
    if (conditions instanceof List) {
        for (Object item : (List<?>) conditions) {
            if (item instanceof Map) {
                Map<String, Object> conditionMap = new HashMap<>((Map<String, Object>) item);
                // Set the type based on the parent
                conditionMap.put("type", "switch".equalsIgnoreCase(nodeType) ? "case_node" : "condition_node");
                iterate(conditionMap, level + 1, childObj, counter);
            }
        }
    } 
    
    Object child = map.get("child");
    if (child instanceof List) {
        for (Object item : (List<?>) child) {
            if (item instanceof Map) {
                iterate((Map<String, Object>) item, level + 1, childObj, counter);
            }
        }
    }
}
}