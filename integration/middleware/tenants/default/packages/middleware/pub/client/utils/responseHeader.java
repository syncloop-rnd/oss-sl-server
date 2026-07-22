package packages.middleware.pub.client.utils;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.lang3.StringUtils;
import io.undertow.util.Headers;
import java.util.Map;
import io.undertow.util.HttpString;

public final class responseHeader{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
 String statusCode = dataPipeline.getString("statusCode");
Map<String, String> reqHeaders = dataPipeline.getAsMap("headers");
if (StringUtils.isNotBlank(statusCode)) {
  dataPipeline.setResponseStatus(Integer.parseInt(statusCode));
}

  
if (null != reqHeaders && dataPipeline.rp.isExchangeInitialized()) {
                for(Map.Entry<String, String> m : reqHeaders.entrySet()) {
                    dataPipeline.rp.getExchange().getResponseHeaders().put(new HttpString(m.getKey()), m.getValue());
                }

            }
  
} catch (Throwable e) {
	dataPipeline.clear();
	dataPipeline.put("error", e.getMessage());
	e.printStackTrace();
}
  

	}

}