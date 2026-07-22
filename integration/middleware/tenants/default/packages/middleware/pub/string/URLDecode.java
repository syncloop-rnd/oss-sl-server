package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.net.URLDecoder;
import java.io.UnsupportedEncodingException;
public final class URLDecode{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
		dataPipeline.appLog("OPERATION", "URLDecode");
  		String text = dataPipeline.getString("text");
  		dataPipeline.appLog("TEXT", "Input Text: " + text);
  
  		  try {
            dataPipeline.put("result", URLDecoder.decode(text, "UTF-8"));
            dataPipeline.appLog("DECODED_URL", "Decoded URL: " + URLDecoder.decode(text, "UTF-8"));
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}