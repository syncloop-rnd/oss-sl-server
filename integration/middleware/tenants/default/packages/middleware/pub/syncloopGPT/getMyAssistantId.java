package packages.middleware.pub.syncloopGPT;
import com.eka.middleware.pub.util.rest.Client;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.template.Tenant;
import com.google.common.collect.Maps;
import com.nimbusds.jose.shaded.gson.Gson;
import org.apache.commons.lang3.StringUtils;

import java.io.File;
import java.io.FileInputStream;
import java.util.Map;
import java.util.Properties;
public final class getMyAssistantId{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
		String file = dataPipeline.getString("file");
        String[] fileParts = StringUtils.split(file, "/");
        String propFile = file.replace("/", ".");

        Properties jdbcProperties = new Properties();
        String pPath = PropertyManager.getPackagePath(dataPipeline.rp.getTenant());
        String connectionPropFile =
                String.format("%s%s/%s/dependency/config/%s.properties", pPath, fileParts[0], fileParts[1], propFile );

		
        try {

            try (FileInputStream fis = new FileInputStream(new File(connectionPropFile))) {
                jdbcProperties.load(fis);
            }

            String jdbcFile = jdbcProperties.getProperty("JDBC");
            String connectionFile = String.format("%s/packages/%s.jdbc", pPath, jdbcFile);
            String assistanceId = ServiceUtils.getKeyConnection(connectionFile, "middleware.syncloop.gpt.assistant.sqlservice.id");


            connectionFile = String.format("%s/packages/middleware/dependency/config/package.properties", pPath, jdbcFile);
            String chatgptToken = ServiceUtils.getKeyConnection(connectionFile, "chatgptToken");

            Map<String, String> headers = Maps.newHashMap();
            headers.put("Content-Type", "application/json");
            headers.put("OpenAI-Beta", "assistants=v2");
            headers.put("Authorization", "Bearer " + chatgptToken);

            Map<String, Object> map = Client.invoke(dataPipeline, "https://api.openai.com/v1/assistants/" + assistanceId, 
                                                    "GET", Maps.newHashMap(), headers, null, null,Maps.newHashMap(), Maps.newHashMap(),  false);

         
          
            dataPipeline.put("response", new Gson().fromJson(map.get("respPayload") + "", Map.class));

        } catch (Exception e) {
            e.printStackTrace();
          
        }
	}

}