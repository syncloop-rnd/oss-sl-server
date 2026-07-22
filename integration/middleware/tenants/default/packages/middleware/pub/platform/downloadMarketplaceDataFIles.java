package packages.middleware.pub.platform;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.update.PluginInstaller;

public final class downloadMarketplaceDataFIles{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try{
    Boolean status = PluginInstaller.downloadLatestManifest(dataPipeline);
    dataPipeline.put("status", status);
    } 
	catch (Exception e) {
      dataPipeline.clear();
      dataPipeline.put("status", false);
      dataPipeline.put("error",e.getMessage());
      new SnippetException(dataPipeline,"Snippet exception", e);
  	}
	}

}