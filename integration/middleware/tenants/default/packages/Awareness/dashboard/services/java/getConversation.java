package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.ConversationManager;
import java.util.*;
public final class getConversation{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{

    String chatID = dataPipeline.getString("chatID");
  	Map<String,Object> data=ConversationManager.getConversation(chatID);
  	if (null != data) {
      dataPipeline.put("conversation", data);
    }else{
      	System.out.println("******** Conversation - NOT FOUND ********");
    }

  	dataPipeline.put("status","success");
    
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    //new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}