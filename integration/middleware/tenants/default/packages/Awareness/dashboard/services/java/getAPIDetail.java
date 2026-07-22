package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;

import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;
import java.io.File;
import java.io.FileInputStream;
import java.util.Base64;
import java.util.Map;
public final class getAPIDetail{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {

            String fqn = dataPipeline.getString("fqn");
            String inputJSONSchema = dataPipeline.getString("inputJSONSchema");
            String staticJsonPayload = dataPipeline.getString("staticJsonPayload");


            if (!fqn.startsWith("packages.") && StringUtils.isNotBlank(staticJsonPayload)) {
                String json = new String(Base64.getDecoder().decode(staticJsonPayload));
                Map<String, Object> map = ServiceUtils.jsonToMap(json);
                if (null == map) {
                    return ;
                }
                fqn = map.get("*fqn") + "";
            }

            String fqnPath = fqn;
            String packageDir = String.format("%spackages" + File.separator, PropertyManager.getPackagePath(dataPipeline.rp.getTenant()));
            fqnPath = fqnPath.replace("packages.", "").replace(".", File.separator);
            fqnPath = packageDir + fqnPath;

            File file = null;

            if (new File(fqnPath + ".api").exists()) {
                file = new File(fqnPath + ".api");

            } else if (new File(fqnPath + ".flow").exists()) {
                file = new File(fqnPath + ".flow");

            } else if (new File(fqnPath + ".service").exists()) {
                file = new File(fqnPath + ".service");
            } else {
                return ;
            }

            JsonReader reader = Json.createReader(new FileInputStream(file));
            JsonObject root = reader.readObject();

            if (root.containsKey("latest")) {
                JsonObject latest = root.getJsonObject("latest");
                if (latest.containsKey("api_info")) {
                    JsonObject apiInfo = latest.getJsonObject("api_info");
                    String title = apiInfo.containsKey("title") ? apiInfo.getString("title", "") : "";
                    String description = apiInfo.containsKey("description") ? apiInfo.getString("description", "") : "";

                    dataPipeline.put("name", title);
                    dataPipeline.put("description", description);
                    dataPipeline.put("id", fqn);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            throw new SnippetException(dataPipeline, "Snippet exception", e);
        }
	}

}