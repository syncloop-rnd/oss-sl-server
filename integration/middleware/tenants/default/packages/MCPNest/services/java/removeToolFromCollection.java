package packages.MCPNest.services.java;
import mcpnest.core.tools.api.MCPGateway;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
public final class removeToolFromCollection{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.put("result", MCPGateway.removeToolFromCollection(dataPipeline.getString("collectionId"), dataPipeline.getString("collectionToolId")));
dataPipeline.put("status", "success");
	}

}