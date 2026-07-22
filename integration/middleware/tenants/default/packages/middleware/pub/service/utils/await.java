package packages.middleware.pub.service.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
public final class await{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
List<Map<String, Object>> futureList=dataPipeline.await(10000);
//dataPipeline.log(futureList.toString());
dataPipeline.put("futureDocList",futureList);
	}

}