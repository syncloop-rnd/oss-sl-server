package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class stringConcat{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

try {
  		dataPipeline.appLog("OPERATION", "stringsConcate");
		String firstString = dataPipeline.getString("firstString");
  		dataPipeline.appLog("FIRST_STRING", "First String: " + firstString);
  		String secondString = dataPipeline.getString("secondString");
  		dataPipeline.appLog("SECOND_STRING", "Second String: " + secondString);
  
  		String result = firstString.concat(secondString);
          
  		dataPipeline.put("result",result);
  		dataPipeline.appLog("RESULT", "Concatenated Result: " + result);
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}