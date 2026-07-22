package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.ConversationManager;
import java.util.*;
public final class addConversation{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{

    String chatID = dataPipeline.getString("chatID");
	String userID = dataPipeline.getString("userID");
  //Get Conversation to check if any conversation exists for the chatID
  	Map<String,Object> data=ConversationManager.getConversation(chatID);

  	if (data == null) {
        data = dataPipeline.getAsMap("data");

        String chatSubject = (String) data.get("subject");

        if (chatSubject == null || chatSubject.trim().isEmpty()) {
            chatSubject = "New Chat";
        }

        if (chatSubject.length() > 50) {
            chatSubject = chatSubject.substring(0, 50);
        }


        data.put("subject", chatSubject);
    }

      // Now add conversation to create history
  		ConversationManager.addConversation(chatID,userID,data);
    
	dataPipeline.put("status","success");
  }catch(Exception e){

    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}