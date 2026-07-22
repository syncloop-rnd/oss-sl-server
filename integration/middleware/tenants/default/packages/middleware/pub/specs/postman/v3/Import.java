package packages.middleware.pub.specs.postman.v3;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.pub.util.ImportSwagger.*;
import com.eka.middleware.pub.util.postman.PostmanCollection;
import com.eka.middleware.pub.util.ImportPostmanV2;
import java.util.List;
import java.util.Map;
import com.nimbusds.jose.shaded.gson.Gson;
import io.swagger.v3.core.util.Json;
import java.io.FileReader;
import com.eka.middleware.service.PropertyManager;
import com.fasterxml.jackson.databind.ObjectMapper;
public final class Import{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            String content = dataPipeline.getAsString("content");
            boolean client = dataPipeline.getAsBoolean("generateClient");
            boolean serverStub = dataPipeline.getAsBoolean("generateServerStub");
            String packageName = dataPipeline.getString("packageName");

            PostmanCollection postmanCollection = new Gson().fromJson(content, PostmanCollection.class);

            if (client) {
                List<String> clientServices = ImportPostmanV2.createFlowServicesClient(PropertyManager.getPackagePath(dataPipeline.rp.getTenant()),
                        "", packageName, postmanCollection.getItem(),postmanCollection, dataPipeline);
                dataPipeline.put("clientServices", clientServices);
            }


            if (serverStub) {
                List<String> serverServices = ImportPostmanV2.createFlowServices(PropertyManager.getPackagePath(dataPipeline.rp.getTenant()),
                        "", packageName, postmanCollection.getItem(), postmanCollection, client, dataPipeline);
                dataPipeline.put("serverServices", serverServices);
            }
  

        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
        }
	}

}