package packages.middleware.pub.environments.adapter.services.DML;

import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.adapter.SqlResolver;
import java.io.File;
import java.io.FileInputStream;
import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonObject;
import javax.json.JsonValue;
import java.util.Properties;
import com.eka.middleware.service.PropertyManager;

public final class insertVpcSubnet {

	static JsonObject mainSqlJsonObject=null;
	static final String syncBlock=new String("sync");
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
		try{
		  if(mainSqlJsonObject==null)
			synchronized(syncBlock){
			  String location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant());
			  String flowRef = location+"packages/middleware/pub/environments/adapter/services/DML/insertVpcSubnet.sql";
			  if(mainSqlJsonObject==null)
				  mainSqlJsonObject = Json.createReader(new FileInputStream(new File(flowRef))).readObject();
			}
		  Properties myProps=dataPipeline.getMyProperties();
		  dataPipeline.put("sqlLocalProperties",myProps);
		  SqlResolver.execute(dataPipeline,mainSqlJsonObject);
		}catch(Throwable e) {
			dataPipeline.clear();
			dataPipeline.put("error", e.getMessage());
			//dataPipeline.setResponseStatus(500);
			dataPipeline.put("status", "SQL Service error");
			new SnippetException(dataPipeline,"Failed to execute insertVpcSubnet", new Exception(e));
		}
	}
}
