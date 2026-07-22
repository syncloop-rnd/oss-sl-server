package packages.middleware.pub.server.browse;
import java.util.*;
import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.concurrent.ConcurrentLinkedQueue;

import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.template.SnippetException;
import static com.eka.middleware.service.ServiceUtils.getURLAlias;
import com.eka.middleware.service.RuntimePipeline;

public final class getPackagesAsTree{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            dataPipeline.appLog("OPERATION", "getPackagesAsTree");
            String packageDir = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) +"packages/";
            dataPipeline.appLog("EXTRACTED_PACKAGE_DIRECTORY",packageDir);
            File file = new File(packageDir);
  			ConcurrentLinkedQueue<Map<String, Object>> children = new ConcurrentLinkedQueue<Map<String, Object>>();
            File[] fileList = file.listFiles();
            if (fileList != null) {
              	RuntimePipeline.getExecutor().submit(() -> {
                
                });
                java.util.stream.Stream.of(fileList)
                    .parallel() // Enable parallel processing
                    .forEach(fyle -> {
                        Map<String, Object> childMap = getTreeMap(fyle, "package", "", dataPipeline);
                        if (childMap != null) {
                            children.add(childMap);
                            dataPipeline.appLog("CHILD_ADDED", "Added child to the list");
                        }
                    });
            }

            // If you need the result as a List, you can convert it:
            List<Map<String, Object>> childrenList = new ArrayList<>(children);

            dataPipeline.appLog("CHILDREN_PROCESSED", "Total children in the list : " + children.size());
            dataPipeline.clear();
            dataPipeline.put("text", "packages");
            dataPipeline.put("type", "root");
            dataPipeline.put("children", children);
            dataPipeline.appLog("SUCCESSFUL", "Get Packages as a tree successfully");
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("response", e.getStackTrace());
            dataPipeline.appLog("SERVICE_ERROR", "An error occurred: " + e.getMessage());
        }
	}
private static Map<String, Object> getTreeMap(File file, String type, String parentFqn, DataPipeline dataPipeline){
        Map<String, Object> map = new HashMap<String, Object>();
        String allowedTypes = "service,map,doc,api,flow,package,root,folder,properties,jar,jdbc,sql,pem,graphql,txt,csv,crt";
        int indx = file.getName().lastIndexOf(".") + 1;
        String fileType = file.getName().substring(indx);
        String nameWithoutExt = file.getName().replace("." + fileType, "");
		String currentFqn = parentFqn.isEmpty() ? "packages." + nameWithoutExt : parentFqn + "." + nameWithoutExt;


        if (file.getName().equals("build") && !file.isDirectory()) {
            return null;
        }

        map.put("text", file.getName().replace("." + fileType, ""));

        if (file.isDirectory()) {
            map.put("type", type);
            List<Map<String, Object>> children = new ArrayList<>();
            File[] fileList = file.listFiles();
            if (fileList != null) {
                for (File fyle : fileList) {
                    int indx2 = fyle.getName().lastIndexOf(".") + 1;
                    String fileType2 = (indx2 > 0 && indx2 < fyle.getName().length()) ? fyle.getName().substring(indx2) : "";
                    if (allowedTypes.contains(fileType2) || fyle.isDirectory()) {
                        Map<String, Object> childMap = getTreeMap(fyle, "folder", currentFqn, dataPipeline);
                        if (childMap != null) {
                            children.add(childMap);
                        }
                    }
                }
            }
            map.put("children", children);
        } else {
            if (indx != 0 && allowedTypes.contains(fileType)) {
                map.put("type", fileType);

                Set<String> parseJsonTypes = new HashSet<>(Arrays.asList("api", "flow"));
                if (parseJsonTypes.contains(fileType)) {

                    try (InputStream fis = new FileInputStream(file);
                         JsonReader reader = Json.createReader(fis)) {

                        JsonObject root = reader.readObject();
                        if (root.containsKey("latest")) {
                            JsonObject latest = root.getJsonObject("latest");
                            if (latest.containsKey("api_info")) {
                                JsonObject apiInfo = latest.getJsonObject("api_info");
                                String title = apiInfo.containsKey("title") ? apiInfo.getString("title", "") : "";
                                String description = apiInfo.containsKey("description") ? apiInfo.getString("description", "") : "";
                                map.put("title", title);
                                map.put("description", description);
                            }
                        }
                    } catch (Exception e) {
                        map.put("title", "");
                        map.put("description", "");
                    }
                }
            }
        }

        try {
            map.put("fqn", currentFqn);

            Set<String> aliasTypes = new HashSet<>(Arrays.asList("api", "sql", "flow", "service"));
            if (aliasTypes.contains(fileType)) {
               String alias = getURLAlias(currentFqn + ".main", dataPipeline.rp.getTenant());
                map.put("alias", alias);
            }
          
        } catch (Exception e) {
        }

        return map;
    }
}