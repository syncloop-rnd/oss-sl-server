package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.ArrayList;
import java.util.List;
import java.util.OptionalDouble;
public final class max{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        List<Number> numList = dataPipeline.getAsList("numList");

        if (numList != null) {
          OptionalDouble max = numList.stream()
            .mapToDouble(Number::doubleValue)
            .max();
          if (max.isPresent()) {
            dataPipeline.put("maxValue", max.getAsDouble());
          }

        } 
}
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}