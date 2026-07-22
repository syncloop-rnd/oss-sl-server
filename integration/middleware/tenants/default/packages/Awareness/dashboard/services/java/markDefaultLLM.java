package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.ChatLanguageModelManager;
public final class markDefaultLLM{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
String LLMKey = dataPipeline.getString("LLMKey");

ChatLanguageModelManager.updateDefaultLLM(LLMKey);
	}

}