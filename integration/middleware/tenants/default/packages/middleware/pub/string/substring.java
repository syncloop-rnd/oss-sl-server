package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class substring{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		dataPipeline.appLog("OPERATION", "subString");
		String string = dataPipeline.getString("string");
  		dataPipeline.appLog("INPUT_STRING", "Input String: " + string);
  		Integer start = dataPipeline.getAsInteger("start");
  		dataPipeline.appLog("START_INDEX", "Start Index: " + start);
  		Integer end = dataPipeline.getAsInteger("end");
  		dataPipeline.appLog("END_INDEX", "End Index: " + end);
  
  		dataPipeline.put("value", StringUtils.substring(string, start, end));
  		dataPipeline.appLog("RESULT", "Substring Result: " + StringUtils.substring(string, start, end));
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}