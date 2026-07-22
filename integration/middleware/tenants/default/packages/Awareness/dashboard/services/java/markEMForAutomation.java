package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.EmbeddingModelManager;
public final class markEMForAutomation{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
String key = dataPipeline.getString("key");
EmbeddingModelManager.markForAutomation(key);
	}

}