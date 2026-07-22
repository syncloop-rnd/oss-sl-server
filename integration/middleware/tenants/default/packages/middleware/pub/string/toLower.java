package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class toLower{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
		dataPipeline.appLog("OPERATION", "toLower");
  		String text = dataPipeline.getString("text");
  		dataPipeline.appLog("INPUT_TEXT", "Input Text: " + text);
  		dataPipeline.put("result", text.toLowerCase());
  		dataPipeline.appLog("RESULT", "Lowercased Text: " + text.toLowerCase());
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}