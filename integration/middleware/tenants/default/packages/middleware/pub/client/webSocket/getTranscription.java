package packages.middleware.pub.client.webSocket;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
public final class getTranscription{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			List<String> transcription=dataPipeline.getTranscription();
  			dataPipeline.put("transcription",transcription);
        } catch (Throwable e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            e.printStackTrace();
        }
	}

}