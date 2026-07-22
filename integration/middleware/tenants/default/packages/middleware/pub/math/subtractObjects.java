package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class subtractObjects{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        Number firstNum = dataPipeline.getAsNumber("firstNum");
        Number secondNum = dataPipeline.getAsNumber("secondNum");

        double value1 = firstNum.doubleValue();
        double value2 = secondNum.doubleValue();

        dataPipeline.put("result",value1 - value2);
}

catch (Exception e) {
        dataPipeline.clear();
        dataPipeline.put("error",e.getMessage());
        throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}