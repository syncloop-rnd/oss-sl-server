package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.math.BigDecimal;
public final class roundNumber{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        Number num = dataPipeline.getAsNumber("num");
        Integer numberOfDigits = dataPipeline.getAsInteger("numberOfDigits");

        double value = num.doubleValue();
        BigDecimal bd = new BigDecimal(value);	

        dataPipeline.put("roundedNumber",bd.setScale(numberOfDigits, BigDecimal.ROUND_HALF_UP));
}
catch (Exception e) {
        dataPipeline.clear();
        dataPipeline.put("error",e.getMessage());
        throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}