package packages.middleware.pub.client.http;
import com.eka.middleware.pub.util.rest.Client;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
public final class clientHttp{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {
      	String method = dataPipeline.getString("method");

            String url = dataPipeline.getString("url");
            String reqPayload = dataPipeline.getString("reqPayload");
            Map<String, Object> formData = dataPipeline.getAsMap("formData");
            Map<String, Object> queryParameters = dataPipeline.getAsMap("queryParameters");
            Map<String, String> reqHeaders = dataPipeline.getAsMap("headers");

            String form = queryParameters.entrySet()
                    .stream()
                    .flatMap(e -> {

                        List<String> list = new ArrayList<>();
                        if (e.getValue() instanceof Collection) {

                            ArrayList<?> arrayList = (ArrayList<?>) e.getValue();

                            list.addAll(arrayList.stream().map(m -> e.getKey() + "=" + URLEncoder.encode(m.toString(), StandardCharsets.UTF_8)).
                                    map(m -> m.toString()).collect(Collectors.toList()));

                        } else {
                            list.add(e.getKey() + "=" + URLEncoder.encode((String) e.getValue(), StandardCharsets.UTF_8));
                        }
                        return list.stream();
                    })
                    .collect(Collectors.joining("&"));

            Map<String, Object> response = Client.invoke(String.format("%s?%s", url, form), method, formData, reqHeaders, reqPayload, true);
            dataPipeline.put("statusCode", response.get("statusCode"));
            dataPipeline.put("respPayload", response.get("respPayload"));
            dataPipeline.put("respHeaders", response.get("respHeaders"));
      
  	} catch (Exception e) {
		dataPipeline.clear();
		dataPipeline.put("error", e.getMessage());
		new SnippetException(dataPipeline, "Sneppet exception", new Exception(e));
	}
	}

}