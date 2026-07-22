package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.PropertyManager;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;


public final class findExportReferences{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    dataPipeline.appLog("OPERATION", "findReference");
    String serviceFqn = dataPipeline.getString("serviceFqn");
    dataPipeline.appLog("SERVICE_FQN", serviceFqn);

    String packageDirectory = PropertyManager.getPackagePath(dataPipeline.rp.getTenant());
    if (!packageDirectory.endsWith("/")) {
        packageDirectory += "/";
    }
    dataPipeline.appLog("EXTRACTED_PACKAGE_DIRECTORY", packageDirectory);

    File filePath = new File(packageDirectory + serviceFqn + ".api");

    dataPipeline.appLog("FILE_PATH", filePath.getAbsolutePath());

    if (!filePath.exists()) {
        dataPipeline.put("status", "404");
        dataPipeline.put("message", "File not found: " + filePath.getAbsolutePath());
        dataPipeline.setResponseStatus(404); 
        dataPipeline.appLog("FILE_NOT_FOUND", filePath.getAbsolutePath());
        return;
    }

    List<Map<String, Object>> result = new ArrayList<>();
    Set<String> processedKeys = new HashSet<>();

    Map<String, Object> mainService = new HashMap<>();
    String mainKey = serviceFqn.hashCode() + "_api"; 
    if (!processedKeys.contains(mainKey)) {
        mainService.put("id", serviceFqn.hashCode());
        mainService.put("name", serviceFqn);
        mainService.put("type", "api");
        mainService.put("children", new ArrayList<>());
        result.add(mainService);
        processedKeys.add(mainKey);
    }

    List<Map<String, Object>> parsedData = parseApiFile(filePath, packageDirectory, result, processedKeys);

    dataPipeline.clear();
    dataPipeline.put("list", parsedData);
  	dataPipeline.put("status", "200");
    dataPipeline.appLog("TREE", parsedData.toString());
} catch (Exception e) {
    dataPipeline.clear();
  	dataPipeline.put("status", "500");
    dataPipeline.put("error", e.getMessage());
    dataPipeline.setResponseStatus(500);
    dataPipeline.put("error", e.getMessage());
    dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    throw new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}

	}
public static List<Map<String, Object>> parseApiFile(
        File apiFile,
        String packageDirectory,
        List<Map<String, Object>> result,
        Set<String> processedKeys) throws Exception {

    ObjectMapper objectMapper = new ObjectMapper();
    JsonNode rootNode = objectMapper.readTree(apiFile);
    JsonNode latestNode = rootNode.path("latest");
    JsonNode apiArray = latestNode.path("api");

    for (JsonNode apiItem : apiArray) {
        String fqn = apiItem.path("data").path("fqn").asText();
        String serviceType = apiItem.path("data").path("serviceType").asText();

        if (fqn == null || fqn.isEmpty() || serviceType == null || serviceType.isEmpty()) {
            continue; // Skip invalid nodes
        }

        String key = fqn.hashCode() + "_" + serviceType;

        // Skip duplicates
        if (processedKeys.contains(key)) {
            continue;
        }

        Map<String, Object> node = new HashMap<>();
        node.put("id", fqn.hashCode());
        node.put("name", fqn);
        node.put("type", serviceType);
        node.put("children", new ArrayList<>());

        if ("api".equalsIgnoreCase(serviceType)) {
            File childFile = new File(packageDirectory + fqn + ".api");
            if (childFile.exists()) {
                List<Map<String, Object>> childNodes = parseApiFile(childFile, packageDirectory, new ArrayList<>(), processedKeys);
                node.put("children", childNodes);
            }
        }

        result.add(node);
        processedKeys.add(key);
    }

    return result;
}

}