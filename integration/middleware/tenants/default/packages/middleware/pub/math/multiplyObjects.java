package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.math.BigDecimal;
public final class multiplyObjects{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        Number firstNum = dataPipeline.getAsNumber("firstNum");
        Number secondNum = dataPipeline.getAsNumber("secondNum");

        if (firstNum != null && secondNum != null) {
          BigDecimal result = BigDecimal.valueOf(firstNum.doubleValue())
            .multiply(BigDecimal.valueOf(secondNum.doubleValue()));
          dataPipeline.put("result", result);
        }
}
catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}