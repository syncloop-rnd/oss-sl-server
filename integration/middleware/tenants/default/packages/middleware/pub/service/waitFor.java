package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.flow.FlowUtils;
public final class waitFor{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  	dataPipeline.appLog("OPERATION", "waitFor");
    Integer timeout=dataPipeline.getInteger("timeoutMS");
  	dataPipeline.appLog("TIMEOUT", String.valueOf(timeout));
    if(timeout==null)
      timeout=10000;
    String condition=dataPipeline.getString("condition");
  	dataPipeline.appLog("CONDITION", condition);
    Boolean waitOver=FlowUtils.evaluateCondition(condition, dataPipeline);
  	dataPipeline.appLog("WAIT_OVER", String.valueOf(waitOver));
    int sleep=500;
    while(!waitOver && timeout>sleep){
        Thread.sleep(500);
        sleep+=500;
        waitOver=FlowUtils.evaluateCondition(condition, dataPipeline);
      	dataPipeline.appLog("WAIT_OVER", waitOver.toString());
    }
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}