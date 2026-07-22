package packages.middleware.pub.service.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
public final class execute{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  	dataPipeline.appLog("OPERATION", "execute");
    long startTime=System.currentTimeMillis();
	String fqn=dataPipeline.getAsString("*pathParameters/fqn");
    String rootField=dataPipeline.getAsString("*pathParameters/rootXPath");
  	if(rootField==null)
      rootField="*200";
  	dataPipeline.appLog("EXTRACTED_FQN", fqn);
    dataPipeline.clear();
    dataPipeline.apply(fqn);
    Map map=(Map)dataPipeline.get(rootField);
    String response=null;
    if(map!=null){
    	response=ServiceUtils.toJson(map);
        dataPipeline.appLog("RESPONSE", response);
      	dataPipeline.put("response",(System.lineSeparator()+response));
    }
    long endTime=System.currentTimeMillis();
    String timeTaken=""+(endTime-startTime);
    dataPipeline.put("duration",timeTaken);
  	dataPipeline.appLog("DURATION", timeTaken);
	//ServiceUtils.execute(fqn,dataPipeline);
    //dataPipeline.put("msg","Success");
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error","Error: "+e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
        e.printStackTrace();
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}