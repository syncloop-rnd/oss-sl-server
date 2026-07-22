package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class NullOrWhiteSpc{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

try {
  		dataPipeline.appLog("OPERATION", "NullOrWhiteSpc");
		String text = dataPipeline.getString("text");
  		dataPipeline.appLog("TEXT", "Input Text: " + text);
  		boolean ifPresent  = (text != null) && !text.isEmpty() && !text.trim().isEmpty();
  
  		dataPipeline.put("result", ifPresent);
  		dataPipeline.appLog("RESULT", "Is Null or White Space: " + ifPresent);
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}