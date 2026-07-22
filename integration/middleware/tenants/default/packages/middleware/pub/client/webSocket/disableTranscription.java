package packages.middleware.pub.client.webSocket;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class disableTranscription{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.setEnableTranscription(false);
        } catch (Throwable e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            e.printStackTrace();
        }
	}

}