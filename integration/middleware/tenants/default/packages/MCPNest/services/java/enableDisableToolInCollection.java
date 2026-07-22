package packages.MCPNest.services.java;
import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
public final class enableDisableToolInCollection{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.put("result", MCPGateway.enableDisableToolInCollection(dataPipeline.getString("collectionId"), dataPipeline.getString("collectionToolId"), dataPipeline.getAsBoolean("enabled")));
dataPipeline.put("status", "success");
	}

}