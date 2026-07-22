package packages.Awareness.examples;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
public final class Test2{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
Map<String, Object> map = agents.core.tools.repository.AgentToolsRepository.getInstance().getAllWithToolsRegistryAndMcp();
dataPipeline.put("map", map);
	}

}