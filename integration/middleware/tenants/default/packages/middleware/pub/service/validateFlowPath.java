package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
import java.io.File;
import com.eka.middleware.server.ServiceManager;
import com.eka.middleware.service.PropertyManager;

public final class validateFlowPath{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		dataPipeline.appLog("OPERATION", "validateFlowPath");
		String serviceFqn=dataPipeline.getString("serviceFqn");
        serviceFqn = StringUtils.replace(serviceFqn, ".", File.separator);
  		dataPipeline.appLog("SERVICE_FQN", serviceFqn);
        String packageDirectory= PropertyManager.getPackagePath(dataPipeline.rp.getTenant())  + serviceFqn + ".flow";
  		dataPipeline.appLog("PACKAGE_DIRECTORY", packageDirectory);
        File file=new File(packageDirectory );

        //dataPipeline.log("***********************************************\n"+list);
        if (!file.exists()) {
            packageDirectory= PropertyManager.getPackagePath(dataPipeline.rp.getTenant())  + serviceFqn + ".api";
            file=new File(packageDirectory );
          	dataPipeline.appLog("ALTERNATE_PACKAGE_DIRECTORY", packageDirectory);
        }
        dataPipeline.put("exist", file.exists());
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }



	}

}