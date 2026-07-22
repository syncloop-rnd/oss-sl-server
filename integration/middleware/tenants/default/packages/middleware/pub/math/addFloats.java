package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.math.BigDecimal;
import java.math.RoundingMode;
public final class addFloats{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
      Number firstNum = dataPipeline.getAsNumber("firstNum");
      Number secondNum = dataPipeline.getAsNumber("secondNum");
      Integer precision = dataPipeline.getAsInteger("precision");


      dataPipeline.put("sum",BigDecimal.valueOf(firstNum.doubleValue() + secondNum.doubleValue())
                       .setScale(precision, RoundingMode.HALF_UP).doubleValue());	
} 
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}