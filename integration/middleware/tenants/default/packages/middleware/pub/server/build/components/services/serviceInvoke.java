package packages.middleware.pub.server.build.components.services;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
import com.fasterxml.jackson.databind.ObjectMapper;
public final class serviceInvoke{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {
            String input = dataPipeline.getString("input");
            if (input == null || input.trim().isEmpty()) {
                return;
            }

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> rootInput = mapper.readValue(input, Map.class);
            
            List<Map<String, Object>> outputObj = new ArrayList<>();
            int[] counter = {1};
            
            String id = "j1_" + (counter[0]++);
            String fqn = (String) rootInput.getOrDefault("fqn", "");

            Map<String, Object> element = new HashMap<>();
            element.put("id", id);
            element.put("text", "Invoke");
            element.put("type", "invoke");

            Map<String, Object> li_attr = new HashMap<>();
            li_attr.put("id", id);
            element.put("li_attr", li_attr);

            Map<String, Object> a_attr = new HashMap<>();
            a_attr.put("href", "javascript:void(0)");
            a_attr.put("id", id + "_anchor");
            element.put("a_attr", a_attr);

            Map<String, Object> state = new HashMap<>();
            state.put("loaded", true);
            state.put("opened", false);
            state.put("selected", true);
            state.put("disabled", false);
            state.put("hidden", false);
            element.put("state", state);

            Map<String, Object> data = new HashMap<>();
            data.put("guid", UUID.randomUUID().toString());
            data.put("columnType", "-1");
            data.put("fqn", fqn);
            data.put("serviceType", "service");
            data.put("dropList", new ArrayList<>());
            data.put("createList", new ArrayList<>());
            data.put("initiateList", new ArrayList<>());

            List<Map<String, Object>> transformers = new ArrayList<>();
            List<Map<String, Object>> lines = new ArrayList<>();

            if (rootInput.containsKey("input")) {
                List<Map<String, Object>> inputMappings = (List<Map<String, Object>>) rootInput.get("input");
                for (Map<String, Object> map : inputMappings) {
                    addMapping(transformers, lines, map, "in");
                }
            }

            if (rootInput.containsKey("output")) {
                List<Map<String, Object>> outputMappings = (List<Map<String, Object>>) rootInput.get("output");
                for (Map<String, Object> map : outputMappings) {
                    addMapping(transformers, lines, map, "out");
                }
            }

            data.put("transformers", transformers);
            data.put("lines", lines);
            element.put("data", data);
            element.put("children", new ArrayList<>());

            outputObj.add(element);
            dataPipeline.put("map", outputObj);
            
        } catch (Exception e) {
            dataPipeline.put("error", e.toString());
        }
	}
private static void addMapping(List<Map<String, Object>> transformers, List<Map<String, Object>> lines, Map<String, Object> map, String direction) {
        String localPath = (String) map.getOrDefault("local_var_path", "");
        String localTypePath = (String) map.getOrDefault("local_var_type_path", "string");
        String servicePath = (String) map.getOrDefault("service_var_path", "");
        String serviceTypePath = (String) map.getOrDefault("service_var_type_path", "string");

        Map<String, Object> trans = new HashMap<>();
        trans.put("op", "copy");
        trans.put("direction", direction);
        
        if (direction.equals("in")) {
            trans.put("from", "/" + localPath);
            trans.put("to", "/" + servicePath);
            trans.put("inTypePath", localTypePath);
            trans.put("outTypePath", serviceTypePath);
        } else {
            trans.put("from", "/" + servicePath);
            trans.put("to", "/" + localPath);
            trans.put("inTypePath", serviceTypePath);
            trans.put("outTypePath", localTypePath);
        }
        transformers.add(trans);

        Map<String, Object> line = new HashMap<>();
        line.put("direction", direction);
        line.put("op", "copy");
        line.put("line", 0);
        line.put("dashedLine", false);

        if (direction.equals("in")) {
            line.put("inputPath", localPath);
            line.put("outputPath", servicePath);
            line.put("INPath", localPath);
            line.put("OUTPath", servicePath);
            line.put("inpJsTree", "#launching_arrow_jsTree");
            line.put("outpJsTree", "#landing_arrow_jsTree_function");
            line.put("inTypePath", localTypePath);
            line.put("outTypePath", serviceTypePath);
            line.put("inType", getTypeFromPath(localTypePath));
            line.put("outType", getTypeFromPath(serviceTypePath));
        } else {
            line.put("inputPath", servicePath);
            line.put("outputPath", localPath);
            line.put("INPath", servicePath);
            line.put("OUTPath", localPath);
            line.put("inpJsTree", "#launching_arrow_jsTree_function");
            line.put("outpJsTree", "#landing_arrow_jsTree");
            line.put("inTypePath", serviceTypePath);
            line.put("outTypePath", localTypePath);
            line.put("inType", getTypeFromPath(serviceTypePath));
            line.put("outType", getTypeFromPath(localTypePath));
        }
        lines.add(line);
    }

    private static String getTypeFromPath(String path) {
        if (path == null) return "string";
        String[] parts = path.split("/");
        return parts[parts.length - 1];
    }
}