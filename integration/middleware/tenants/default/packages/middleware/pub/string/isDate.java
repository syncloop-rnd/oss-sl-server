package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.text.SimpleDateFormat;
import java.text.ParseException;
import java.util.Date;

public final class isDate{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		dataPipeline.appLog("OPERATION", "isDate");
		String input = dataPipeline.getString("input");
  		dataPipeline.appLog("INPUT", input);
  		String  pattern = dataPipeline.getString("pattern");
  		dataPipeline.appLog("PATTERN", pattern);
  		 try {
            SimpleDateFormat sdf = new SimpleDateFormat(pattern);
           	dataPipeline.appLog("SIMPLE_DATE_FORMAT", "Creating SimpleDateFormat with pattern: " + pattern);
        	Date date = sdf.parse(input);
           	dataPipeline.appLog("DATE_PARSE", "Parsing input using SimpleDateFormat");
           	dataPipeline.put("result",date!=null);
           	dataPipeline.appLog("RESULT", "Parsing result: " + String.valueOf(date!=null));
           
        } catch (ParseException e) {
           dataPipeline.put("result",false); 
           dataPipeline.appLog("RESULT_FAILED", "Date parsing failed, result: false");
        }
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }





	}

}