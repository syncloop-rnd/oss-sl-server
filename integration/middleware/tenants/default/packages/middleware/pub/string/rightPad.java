package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
public final class rightPad{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
		dataPipeline.appLog("OPERATION", "rightPad");
  		String text = dataPipeline.getString("text");
  		dataPipeline.appLog("TEXT", "Input Text: " + text);
  		String padString = dataPipeline.getString("padString");
  		dataPipeline.appLog("PAD_STRING", "Padding String: " + padString);
  		Integer length = dataPipeline.getAsInteger("length");
  		dataPipeline.appLog("LENGTH", "Total Length: " + length);
  			
  		dataPipeline.put("result",StringUtils.rightPad(text, length, padString) );
  		dataPipeline.appLog("RESULT", "Padded Text: " + StringUtils.rightPad(text, length, padString));
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}