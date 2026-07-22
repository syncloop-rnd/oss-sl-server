package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.ConversationManager;
import java.util.*;
public final class deleteConversation{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
	String identifier = dataPipeline.getString("chatID");
  	ConversationManager.deleteConversation(identifier);
    dataPipeline.put("status","success");
  ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}