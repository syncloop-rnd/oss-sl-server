package packages.middleware.pub.date;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class currentNanoTime{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        long currentTime = System.nanoTime();
  		dataPipeline.put("nanoTime",currentTime);
      } 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}