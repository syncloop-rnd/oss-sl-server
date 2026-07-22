package packages.Awareness.dashboard.services.java.mcp;
import agents.core.tools.model.*;
import agents.core.tools.service.AgentToolsService;
import agents.core.tools.service.MCPService;
import agents.core.tools.service.ToolsRegistryService;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.RuntimePipeline;
import com.eka.middleware.template.SnippetException;

import java.util.UUID;
import java.util.Map;
public final class getOne{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{

            String UUID = dataPipeline.getString("uuid");
			if(UUID!=null){
              Map<String, Object> mcp = MCPService.getInstance().getAsMap(java.util.UUID.fromString(UUID));
              dataPipeline.put("mcp", mcp);
            }
        }catch(Exception e){
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            dataPipeline.put("status","failed");
            new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}

}