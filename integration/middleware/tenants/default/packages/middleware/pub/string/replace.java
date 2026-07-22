package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class replace{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
		dataPipeline.appLog("OPERATION", "replace");
  		String text = dataPipeline.getString("text");
  		dataPipeline.appLog("TEXT", "Input Text: " + text);
  		String searchString = dataPipeline.getString("searchString");
  		dataPipeline.appLog("SEARCH_STRING", "Search String: " + searchString);
  		String replaceString = dataPipeline.getString("replaceString");
  		dataPipeline.appLog("REPLACE_STRING", "Replace String: " + replaceString);
  
  		dataPipeline.put("result",StringUtils.replaceAll(text,searchString,replaceString));
  		dataPipeline.appLog("RESULT", "Replaced Text: " + StringUtils.replaceAll(text,searchString,replaceString));
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}