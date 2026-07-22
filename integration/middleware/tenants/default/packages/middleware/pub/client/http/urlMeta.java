package packages.middleware.pub.client.http;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.google.common.net.InternetDomainName;
import java.net.URL;

public final class urlMeta{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  
  URL url = new URL(dataPipeline.getString("url"));
  
  InternetDomainName internetDomainName = InternetDomainName.from(url.getHost()).topPrivateDomain();
  dataPipeline.put("domain", internetDomainName.toString());
  dataPipeline.put("parts", InternetDomainName.from(url.getHost()).parts());
  dataPipeline.put("host", url.getHost());
  } catch (Exception e) {
      e.printStackTace();
			dataPipeline.clear();
			dataPipeline.put("error", e.getMessage());
			new SnippetException(dataPipeline, "Sneppet exception", new Exception(e));
		}
	}

}