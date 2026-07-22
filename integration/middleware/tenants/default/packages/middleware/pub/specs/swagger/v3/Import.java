package packages.middleware.pub.specs.swagger.v3;
import com.eka.middleware.pub.util.ImportSwagger;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
import com.eka.middleware.service.ServiceUtils;
public final class Import{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
			dataPipeline.appLog("OPERATION", "Import");
            byte[] content = (byte[])dataPipeline.get("content");
  			dataPipeline.appLog("CONTENT", "Content: " + content);
            boolean client = dataPipeline.getAsBoolean("generateClient");
  			dataPipeline.appLog("GENERATE_CLIENT", "Generate Client: " + client);
            boolean serverStub = dataPipeline.getAsBoolean("generateServerStub");
  			dataPipeline.appLog("GENERATE_SERVER_STUB", "Generate Server Stub: " + serverStub);
            String packageName = dataPipeline.getString("packageName");
  			dataPipeline.appLog("PACKAGE_NAME", "Package Name: " + packageName);

            String location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "packages/" + packageName + "/client";
  			dataPipeline.appLog("CLIENT_LOCATION", location);

            if (client) {
                Map<String, String> clientServices = ImportSwagger.asClientLib(location, content, dataPipeline);
                dataPipeline.put("clientServices", clientServices);
              	dataPipeline.appLog("SERVICES_CREATED", clientServices + " : Client services created successfully.");
            }
  
  			location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "packages/" + packageName + "/server";
			dataPipeline.appLog("SERVER_LOCATION", location);

            if (serverStub) {
                Map<String, String> serverServices = ImportSwagger.asServerStub(location, content,dataPipeline,client,packageName);
                dataPipeline.put("serverServices", serverServices);
              	dataPipeline.appLog("SERVICES_CREATED", serverServices + " : Client services created successfully.");
            }
  			ServiceUtils.expireServiceCache("packages.middleware.pub.server.browse.getPackagesAsTree");

        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
        }
	}

}