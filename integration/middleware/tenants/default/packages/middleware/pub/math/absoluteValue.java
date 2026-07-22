package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class absoluteValue{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		Integer number = dataPipeline.getAsInteger("number");
  
  		dataPipeline.put("absoluteNum", Math.abs(number));
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}