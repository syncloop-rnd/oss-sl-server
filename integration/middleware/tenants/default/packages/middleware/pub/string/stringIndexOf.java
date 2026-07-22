package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class stringIndexOf{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

try {
            dataPipeline.appLog("OPERATION", "stringindexOf");
  			String text = dataPipeline.getString("text");
  			dataPipeline.appLog("TEXT", "Input Text: " + text);
            String subString = dataPipeline.getString("subString");
  			dataPipeline.appLog("SUBSTRING", "Substring: " + subString);
            Integer indexOfSubSt = text.indexOf(subString);
			
            dataPipeline.put("index", indexOfSubSt);
  			dataPipeline.appLog("RESULT", "Index of Substring: " + indexOfSubSt);

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
            throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}

}