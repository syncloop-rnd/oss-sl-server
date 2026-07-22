package packages.MCPNest.services.java;
import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
public final class getToolUsageDetails{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
String collectionToolId = dataPipeline.getString("collectionToolId");
String routeId = collectionToolId == null || collectionToolId.isBlank() ? dataPipeline.getString("toolId") : collectionToolId;
dataPipeline.put("result", MCPGateway.getToolUsageDetails(routeId));
dataPipeline.put("status", "success");
	}

}