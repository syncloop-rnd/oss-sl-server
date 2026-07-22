package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringEscapeUtils;
public final class HTMLDecode{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		dataPipeline.appLog("OPERATION", "HTMLDecode");
		String text = dataPipeline.getString("text");
  		dataPipeline.appLog("HTML_TEXT", text);
  		dataPipeline.put("result", StringEscapeUtils.unescapeHtml4(text));
  		dataPipeline.appLog("DECODE_COMPLETE", "HTML decoding complete. " + StringEscapeUtils.unescapeHtml4(text));
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}