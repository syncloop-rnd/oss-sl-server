package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class addInts{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		Integer firstInt = dataPipeline.getAsInteger("firstInt");
 	    Integer secondInt = dataPipeline.getAsInteger("secondInt");
		dataPipeline.put("sum", firstInt+secondInt);	
} 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}