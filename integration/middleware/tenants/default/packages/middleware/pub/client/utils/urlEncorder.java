package packages.middleware.pub.client.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.net.URLEncoder;

public final class urlEncorder{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  
  	String simple_data = dataPipeline.getString("simple_data");
	dataPipeline.put("encoded_data", URLEncoder.encode(simple_data, "UTF-8"));
  
} catch (Exception e) {
  	dataPipeline.clear();
	dataPipeline.put("error", e.getMessage());
	new SnippetException(dataPipeline, "Sneppet exception", new Exception(e));
}
  
	}

}