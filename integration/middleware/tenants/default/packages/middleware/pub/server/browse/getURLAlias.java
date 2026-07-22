package packages.middleware.pub.server.browse;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException; 
public final class getURLAlias{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  	dataPipeline.appLog("OPERATION", "getURLAlias");
	String fqn=dataPipeline.getString("fqn");
  	dataPipeline.appLog("EXTRACTED_FQN", fqn);
	String alias=ServiceUtils.getURLAlias(fqn,dataPipeline.rp.getTenant());
  	dataPipeline.appLog("EXTRACTED_ALIAS_URL",alias);
	dataPipeline.clear();
	if(alias==null){
		dataPipeline.put("status",404);
		dataPipeline.put("msg","Not found");
      	dataPipeline.appLog("ALIAS_STATUS","Not found");
	}else{
		dataPipeline.put("alias",alias);
      	dataPipeline.appLog("ALIAS_STATUS","Alias set");
	}
  	dataPipeline.appLog("SUCCESSFULL", "Retrieved URL alias successfully");
}catch(Throwable e){
	dataPipeline.clear();
	dataPipeline.put("status",500);
	dataPipeline.put("msg",e.getMessage());
	dataPipeline.logException(e);
  	dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
}
	}

}