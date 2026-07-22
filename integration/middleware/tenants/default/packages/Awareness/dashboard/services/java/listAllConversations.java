package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.ConversationManager;
import java.util.*;
public final class listAllConversations{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
	String userID = dataPipeline.getString("userID");
  	List<Map<String,Object>> conv=ConversationManager.getConversations(userID);
	dataPipeline.put("conversations",conv);
    dataPipeline.put("status","success");
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}