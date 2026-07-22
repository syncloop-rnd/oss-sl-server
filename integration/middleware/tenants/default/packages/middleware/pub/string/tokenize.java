package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Arrays;
import java.util.List;
public final class tokenize{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		dataPipeline.appLog("OPERATION", "tokenize");
		String text = dataPipeline.getString("text");
  		dataPipeline.appLog("INPUT_TEXT", "Input Text: " + text);
  		String delimiterChar = dataPipeline.getString("delimiterChar");
  		dataPipeline.appLog("DELIMITER", "Delimiter Character: " + delimiterChar);
  		String[] tokens = text.split(delimiterChar);
  		dataPipeline.appLog("TOKENS", "Tokens: " + tokens);
  		List<String> tokenList = Arrays.asList(tokens);
  
  		dataPipeline.put("result", tokenList);
  		dataPipeline.appLog("RESULT", tokenList.toString());
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}