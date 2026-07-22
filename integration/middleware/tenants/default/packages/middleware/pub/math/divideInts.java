package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class divideInts{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		Integer firstNum = dataPipeline.getAsInteger("firstNum");
 	    Integer secondNum = dataPipeline.getAsInteger("secondNum");
  
		if (firstNum != null && secondNum != null && secondNum != 0) {
    	dataPipeline.put("result", firstNum / secondNum);
		} 	
} 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}