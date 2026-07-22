package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.ArrayList;
import java.util.List;
public final class multiplyIntList{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        List<Number> numList = dataPipeline.getAsList("numList");
        double product = numList.stream().mapToDouble(Number::doubleValue).reduce(1, (a, b) -> a * b);
        dataPipeline.put("result", product);
} 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}