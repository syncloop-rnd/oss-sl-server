package packages.middleware.pub.server.build.components.services;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class foreach{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

    String inputList = dataPipeline.getString("inputList");

    if (inputList == null || inputList.trim().isEmpty()) {
        inputList = dataPipeline.getString("input list");
    }

    if (inputList == null || inputList.trim().isEmpty()) {
        inputList = dataPipeline.getString("input");
    }


    String outputList = dataPipeline.getString("outputList");

    if (outputList == null || outputList.trim().isEmpty()) {
        outputList = dataPipeline.getString("output list");
    }

    if (outputList == null || outputList.trim().isEmpty()) {
        outputList = dataPipeline.getString("output");
    }


    String comment = dataPipeline.getString("comment");


    java.util.List<java.util.Map<String, Object>> outputObj =
            new java.util.ArrayList<java.util.Map<String, Object>>();


    String id = "j1_1";


    java.util.Map<String, Object> element =
            new java.util.LinkedHashMap<String, Object>();


    element.put("id", id);
    element.put("text", "Foreach");
    element.put("icon", null);


    java.util.Map<String, Object> liAttr =
            new java.util.LinkedHashMap<String, Object>();

    liAttr.put("id", id);
    element.put("li_attr", liAttr);


    java.util.Map<String, Object> aAttr =
            new java.util.LinkedHashMap<String, Object>();

    aAttr.put("href", "javascript:void(0)");
    aAttr.put("id", id + "_anchor");
    element.put("a_attr", aAttr);


    java.util.Map<String, Object> state =
            new java.util.LinkedHashMap<String, Object>();

    state.put("loaded", true);
    state.put("opened", false);
    state.put("selected", false);
    state.put("disabled", false);
    state.put("hidden", false);

    element.put("state", state);


    java.util.Map<String, Object> data =
            new java.util.LinkedHashMap<String, Object>();

    data.put("guid", java.util.UUID.randomUUID().toString());
    data.put("indexVar", "*index0");
    data.put("columnType", "-1");


    if (inputList != null && !inputList.trim().isEmpty()) {
        data.put("inputList", inputList);
    }

    if (outputList != null && !outputList.trim().isEmpty()) {
        data.put("outputList", outputList);
    }

    if (comment != null && !comment.trim().isEmpty()) {
        data.put("fieldDescription", comment);
    }

    element.put("data", data);


    java.util.List<java.util.Map<String, Object>> children =
            new java.util.ArrayList<java.util.Map<String, Object>>();

    element.put("children", children);


    element.put("type", "foreach");


    outputObj.add(element);


    dataPipeline.put("map", outputObj);


} catch (Exception e) {

    dataPipeline.put("error", e.getMessage());
    dataPipeline.put("error_trace", java.util.Arrays.toString(e.getStackTrace()));

}
	}

}