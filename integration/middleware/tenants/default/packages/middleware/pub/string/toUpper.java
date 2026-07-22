package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class toUpper{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
		dataPipeline.appLog("OPERATION", "toUpper");
  		String text = dataPipeline.getString("text");
  		dataPipeline.appLog("TEXT", "Input Text: " + text);
  		dataPipeline.put("result", text.toUpperCase());
  		dataPipeline.appLog("RESULT", "Uppercase Text: " + text.toUpperCase());
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}