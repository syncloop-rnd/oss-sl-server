package packages.middleware.pub.server.browse;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils; 
import com.eka.middleware.template.SnippetException;
public final class registerURLAlias{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
String resp=null;
	try{
      	dataPipeline.appLog("OPERATION", "registerURLAlias");
		String fqn=dataPipeline.getString("fqn");
      	dataPipeline.appLog("EXTRACTED_FQN",fqn);
		String alias=dataPipeline.getString("alias");
      	dataPipeline.appLog("EXTRACTED_ALIAS",alias);
		resp=ServiceUtils.registerURLAlias(fqn,alias,dataPipeline);
		//dataPipeline.clear();
		dataPipeline.put("status",200);
		dataPipeline.put("msg",resp);
      	dataPipeline.appLog("SUCCESSFUL", "Get register URL Alias successfully");
      	
	}catch(Exception e){
		dataPipeline.clear();
      	dataPipeline.put("error", e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
		dataPipeline.put("status",500);
		if(resp==null)
			resp=e.getMessage();
		dataPipeline.put("msg",resp);
      	dataPipeline.appLog("MESSAGE",resp);
	}
	}

}