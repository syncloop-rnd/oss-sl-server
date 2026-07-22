package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
public final class addFloatList{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        List<Number> listOfNum = dataPipeline.getAsList("listOfNum");
        double sum = listOfNum.stream()
          .mapToDouble(Number::doubleValue)
          .sum();
        dataPipeline.put("num", sum);
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}