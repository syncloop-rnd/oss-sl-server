package packages.middleware.pub.platform;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.update.PluginInstaller;
import java.util.Map;
public final class checkPluginStatus{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
    String unique_id = dataPipeline.getString("unique_id");
    Number latest_version_number = dataPipeline.getAsNumber("latest_version_number");
    String response = PluginInstaller.checkPluginStatus(unique_id, latest_version_number, dataPipeline);
    dataPipeline.put("response", response);
  } catch (Exception e) {
      dataPipeline.clear();
      dataPipeline.put("status", false);
      dataPipeline.put("error",e.getMessage());
      new SnippetException(dataPipeline,"Snippet exception", e);
  }
	}

}