package packages.middleware.pub.server.build.components.services;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
import com.fasterxml.jackson.databind.ObjectMapper;
public final class transformer{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            String input = dataPipeline.getString("input");
            if (input == null || input.trim().isEmpty()) {
                return;
            }

            ObjectMapper mapper = new ObjectMapper();
            List<Map<String, Object>> list = mapper.readValue(
                    input,
                    mapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            
            List<Map<String, Object>> outputObj = new ArrayList<>();
            
            
            int[] counter = {1};
            
            for (Map<String, Object> item : list) {
                iterate(item, 0, outputObj, counter);
            }

            dataPipeline.put("map", outputObj);
            
        } catch (Exception e) {
          
            dataPipeline.put("error", e.getMessage());
        }
    
	}
public static void iterate(Map<String, Object> map, int level, List<Map<String, Object>> outputObj, int[] counter) {

    
        String id = "j1_" + (counter[0]++);

        Map<String, Object> element = new HashMap<>();

        element.put("id", id);
        element.put("text", map.getOrDefault("var", "Transformer"));
        element.put("type", map.getOrDefault("type", "transformer"));
        element.put("icon", null);

        Map<String, Object> li_attr = new HashMap<>();
        li_attr.put("id", id);
        element.put("li_attr", li_attr);

        Map<String, Object> a_attr = new HashMap<>();
        a_attr.put("href", "#");
        a_attr.put("id", id + "_anchor");
        element.put("a_attr", a_attr);

        Map<String, Object> state = new HashMap<>();
        state.put("loaded", true);
        state.put("opened", false);
        state.put("selected", false);
        state.put("disabled", false);
        element.put("state", state);

        Map<String, Object> data = new HashMap<>();
        
        data.put("guid", UUID.randomUUID().toString());
        data.put("columnType", "-1");
        data.put("createList", new ArrayList<>());
        data.put("dropList", new ArrayList<>());
        data.put("initiateList", new ArrayList<>());
        data.put("lines", new ArrayList<>());
        data.put("transformers", new ArrayList<>());

        if (map.containsKey("comment")) {
            data.put("fieldDescription", map.get("comment"));
        }
        if (map.containsKey("val")) {
            data.put("value", map.get("val"));
        }

        element.put("data", data);

        List<Map<String, Object>> childObj = new ArrayList<>();
        element.put("children", childObj);

        outputObj.add(element);

        if (map.containsKey("child")) {
            List<Map<String, Object>> children =
                    (List<Map<String, Object>>) map.get("child");

            for (Map<String, Object> child : children) {
                iterate(child, level + 1, childObj, counter);
            }
        }
    }

}