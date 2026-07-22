package packages.middleware.pub.platform;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.update.PluginInstaller;
public final class deletePlugin{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  	String token = dataPipeline.getAsString("token");
    String unique_id = dataPipeline.getAsString("unique_id");
  
  	new Thread(() -> {
      try {
		PluginInstaller.deletePlugin(unique_id,token,dataPipeline);
      } catch (Exception e) {
        dataPipeline.clear();
        e.printStackTrace();
        new SnippetException(dataPipeline,"Snippet exception", e);
      }
    }).start();

    dataPipeline.put("status", "202");
    dataPipeline.put("message", "Plugin Deletion Process started in background.");

	}

}