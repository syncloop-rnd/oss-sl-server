package packages.middleware.pub.server.build.components.services;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
public final class input{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  
  String input = dataPipeline.getString("input");
//Map<String,Object> map = ServiceUtils.jsonToMap(input);

ObjectMapper mapper = new ObjectMapper();
List<Map> list = mapper.readValue(
        input,
        mapper.getTypeFactory().constructCollectionType(List.class, Map.class));
  
List<Map> outputObj = new ArrayList<>();
  
for (Map<String, Object> item : list) {
    JsonTreeBuilder.iterate(item, 0, outputObj);
}

dataPipeline.put("map", outputObj);
  
} catch (Exception e) {
  
}

	}
public class JsonTreeBuilder {

    static int counter = 1;

    public static void iterate(Map<String, Object> map, int level, List<Map> outputObj) {

        String id = "j2_" + counter++;

        Map<String, Object> element = new HashMap<>();

        element.put("id", id);
        element.put("text", map.get("var"));
        element.put("type", map.get("type"));

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

        if (map.containsKey("comment")) {
            data.put("fieldDescription", map.get("comment"));
        }

        data.put("isRequiredField", true);

        if (!map.containsKey("child")) {
            data.put("value", "<" + map.get("type") + ">");
        }

        element.put("data", data);

        List<Map> childObj = new ArrayList<>();
        element.put("children", childObj);

        outputObj.add(element);

        if (map.containsKey("child")) {
            List<Map<String, Object>> children =
                    (List<Map<String, Object>>) map.get("child");

            for (Map<String, Object> child : children) {
                iterate(child, level + 1, childObj);
            }
        }
    }
}
}