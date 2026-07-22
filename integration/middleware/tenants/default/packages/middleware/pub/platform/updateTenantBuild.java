package packages.middleware.pub.platform;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.server.Build;
public final class updateTenantBuild{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{ 
  String version = dataPipeline.getString("version");
  Build.updateTenant(dataPipeline, version);
  dataPipeline.put("status", true);
  } catch (Exception e) {
      dataPipeline.clear();
      dataPipeline.put("error",e.getMessage());
      new SnippetException(dataPipeline,"Snippet exception", e);
  }
	}

}