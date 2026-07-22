package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.*;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class initialize{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String tn=dataPipeline.rp.getTenant().getName();
    EmbeddingModelManager.load(tn);
    ChatLanguageModelManager.load(tn);
	//RAGManager.load(tn);
	KnowledgeBaseManager.load(tn);
	AgentManager.load(tn);
    ConversationManager.load(tn);
    ServiceUtils.reloadCurrentTenantJars();
    
  }catch(Exception e){
    e.printStackTrace();
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}