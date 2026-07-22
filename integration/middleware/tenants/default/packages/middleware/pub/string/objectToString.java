package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;

public final class objectToString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		dataPipeline.appLog("OPERATION", "objectToString");
		Object object = dataPipeline.getString("object");
  		dataPipeline.appLog("INPUT_OBJECT", "Object: " + object);
  		dataPipeline.put("result", object.toString());
  		dataPipeline.appLog("RESULT", "String representation of Object: " + object.toString());
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
  		dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}