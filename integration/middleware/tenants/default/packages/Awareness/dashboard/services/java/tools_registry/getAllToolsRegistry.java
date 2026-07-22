package packages.Awareness.dashboard.services.java.tools_registry;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
public final class getAllToolsRegistry{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
Map<String, Object> map = agents.core.tools.service.ToolsRegistryService.getInstance().getAllWithMcp();
dataPipeline.put("tools_registry", map.get("records"));
	}

}