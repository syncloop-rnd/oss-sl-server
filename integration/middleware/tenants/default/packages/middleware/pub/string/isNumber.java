package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class isNumber{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

try {
  		dataPipeline.appLog("OPERATION", "isNumber");
		String text = dataPipeline.getString("text");
  		dataPipeline.appLog("TEXT", text);
  		boolean result;
  		
  		try{
          Float.parseFloat(text);
          result=true;
        }
  		catch (Exception e) {
			result = false;
		}
  		dataPipeline.put("result", result);
  		dataPipeline.appLog("RESULT", Boolean.toString(result));
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }

	}

}