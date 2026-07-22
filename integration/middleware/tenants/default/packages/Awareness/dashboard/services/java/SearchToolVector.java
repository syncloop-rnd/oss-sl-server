package packages.Awareness.dashboard.services.java;
import java.util.List;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.core.tools.service.ToolsRegistryService;
import agents.core.tools.model.ToolsRegistry;
public final class SearchToolVector{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{		
  			
  			ToolsRegistryService toolsRegistryService = new ToolsRegistryService(dataPipeline);
            List<ToolsRegistry> toolsRegistry = toolsRegistryService.searchToolQdrant(dataPipeline.getString("searchText"));
  			dataPipeline.put("Tool_Registry", toolsRegistry);
            dataPipeline.put("status", "success");
   }catch(Exception e){
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            dataPipeline.put("status","failed");
			new SnippetException(dataPipeline,"This is a Snippet exception", new Exception(e));
        }

	}

}