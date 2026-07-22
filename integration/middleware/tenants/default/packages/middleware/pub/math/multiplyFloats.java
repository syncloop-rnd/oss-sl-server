package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.math.BigDecimal;
import java.math.RoundingMode;
public final class multiplyFloats{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        Number firstNum = dataPipeline.getAsNumber("firstNum");
        Number secondNum = dataPipeline.getAsNumber("secondNum");
        Integer precision = dataPipeline.getAsInteger("precision");

        double product = firstNum.doubleValue() * secondNum.doubleValue();

        if (precision != null) {
          BigDecimal rounded = BigDecimal.valueOf(product).setScale(precision, RoundingMode.HALF_UP);
          product = rounded.doubleValue();
          dataPipeline.put("result",product);
        }
} 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}