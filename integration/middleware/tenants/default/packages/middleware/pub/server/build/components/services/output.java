package packages.middleware.pub.server.build.components.services;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
public final class output{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            final int[] counter = {1};

            String input = dataPipeline.getString("input");
            ObjectMapper mapper = new ObjectMapper();

            Object parsedObj = null;

            if (input != null && input.trim().length() > 0) {
                String trimmed = input.trim();

                if (trimmed.startsWith("[")) {
                    parsedObj = mapper.readValue(
                            trimmed,
                            mapper.getTypeFactory().constructCollectionType(List.class, Map.class)
                    );
                } else if (trimmed.startsWith("{")) {
                    parsedObj = mapper.readValue(trimmed, Map.class);
                }
            }

            List<Map<String, Object>> finalOutput = new ArrayList<>();

            if (parsedObj instanceof List) {
                List<Map<String, Object>> list = (List<Map<String, Object>>) parsedObj;
                for (Map<String, Object> item : list) {
                    iterate(item, finalOutput, counter, 0);
                }

            } else if (parsedObj instanceof Map) {
                Map<String, Object> rootMap = (Map<String, Object>) parsedObj;

                Object nested = null;
                if (rootMap.get("output") != null) {
                    nested = rootMap.get("output");
                } else if (rootMap.get("input") != null) {
                    nested = rootMap.get("input");
                }

                if (nested instanceof List) {
                    List<Map<String, Object>> list = (List<Map<String, Object>>) nested;
                    for (Map<String, Object> item : list) {
                        iterate(item, finalOutput, counter, 0);
                    }
                }
            }

            dataPipeline.put("output", finalOutput);

        } catch (Exception e) {
            throw new SnippetException(dataPipeline, e.getMessage(), e);
        }
	}
public static void iterate(Map<String, Object> map,
                               List<Map<String, Object>> outputObj,
                               int[] counter,
                               int level) {

        String text = firstNonBlank(map, "var", "text");
        if (text == null || text.trim().length() == 0 || "null".equalsIgnoreCase(text.trim())) {
            return;
        }

        String id = "j3_" + counter[0]++;

        Map<String, Object> element = new LinkedHashMap<>();
        element.put("id", id);
        element.put("text", text);

        Map<String, Object> li_attr = new LinkedHashMap<>();
        li_attr.put("id", id);
        element.put("li_attr", li_attr);

        Map<String, Object> a_attr = new LinkedHashMap<>();
        a_attr.put("href", "#");

        if (level == 0 && text.matches("\\*(2|4|5)\\d\\d")) {
            a_attr.put("id", id + "_anchor");
        }

        element.put("a_attr", a_attr);

        Map<String, Object> state = new LinkedHashMap<>();
        state.put("loaded", true);
        state.put("opened", false);
        state.put("selected", false);
        state.put("disabled", false);
        element.put("state", state);

        Map<String, Object> data = new LinkedHashMap<>();
        element.put("data", data);

        List<Map<String, Object>> childObj = new ArrayList<>();
        element.put("children", childObj);

        Object rawChildren = null;
        if (map.containsKey("child")) {
            rawChildren = map.get("child");
        } else if (map.containsKey("children")) {
            rawChildren = map.get("children");
        }

        if (rawChildren instanceof List) {
            List children = (List) rawChildren;
            for (Object child : children) {
                if (child instanceof Map) {
                    iterate((Map<String, Object>) child, childObj, counter, level + 1);
                }
            }
        }

        String type = firstNonBlank(map, "type");

        if (type == null || type.trim().length() == 0 || "null".equalsIgnoreCase(type.trim())) {
            if (text.matches("\\*(2|4|5)\\d\\d")) {
                type = "document";
            } else if (!childObj.isEmpty()) {
                type = "document";
            } else {
                type = "string";
            }
        }

        element.put("type", mapType(type));

        outputObj.add(element);
    }

    private static String firstNonBlank(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object value = map.get(key);
            if (value != null) {
                String s = String.valueOf(value);
                if (s.trim().length() > 0) {
                    return s;
                }
            }
        }
        return null;
    }

    private static String mapType(Object typeObj) {
        if (typeObj == null) return "string";

        String type = typeObj.toString().toLowerCase().trim();

        switch (type) {
            case "string": return "string";
            case "integer": return "integer";
            case "number": return "number";
            case "boolean": return "boolean";
            case "date": return "date";
            case "document": return "document";
            case "documentlist": return "documentList";
            case "stringlist": return "stringList";
            case "integerlist": return "integerList";
            case "numberlist": return "numberList";
            case "booleanlist": return "booleanList";
            case "datelist": return "dateList";
            case "byte": return "byte";
            case "bytelist": return "byteList";
            case "javaobject": return "javaObject";
            case "javaobjectlist": return "javaObjectList";
            default: return "string";
        }
    }
}