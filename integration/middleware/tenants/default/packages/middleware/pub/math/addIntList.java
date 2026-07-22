package packages.middleware.pub.math;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.ArrayList;
import java.util.List;
public final class addIntList{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  		List<Integer> numList = dataPipeline.getAsList("numList");
  		if (numList != null) {
			int sum = numList.stream().mapToInt(Integer::intValue).sum();
			dataPipeline.put("sumOfList", sum);
		}

  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}