package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.ChatMemoryManager;
public final class likeMessage{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
String message_id = dataPipeline.getString("message_id");
ChatMemoryManager.likeMessage(message_id);
	}

}