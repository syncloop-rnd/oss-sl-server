package packages.middleware.pub.platform;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.update.PluginInstaller;

public final class getPluginDetailByUUID{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try{
        String uuid = dataPipeline.getString("uuid");
    	dataPipeline.put("marketplace", com.eka.middleware.update.PluginInstaller.getPluginByUUID(uuid,dataPipeline));
 
    } 
	catch (Exception e) {
      dataPipeline.clear();
      dataPipeline.put("error",e.getMessage());
      new SnippetException(dataPipeline,"Snippet exception", e);
  	}
	}

}