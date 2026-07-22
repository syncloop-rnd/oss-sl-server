package packages.middleware.pub.client.http;
import java.io.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import com.eka.middleware.pub.util.rest.Client;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.pub.util.auth.AWSHeaders;
import com.eka.middleware.pub.util.auth.aws.AWS4SignerForChunkedUpload;
import java.util.TreeMap;
import java.util.stream.*;
import java.net.URLEncoder;
import com.google.common.collect.Maps;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.io.IOUtils;

public final class request{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            String method = dataPipeline.getString("method");
            String url = dataPipeline.getString("url");

            Map<String, String> reqHeaders = filterParams(dataPipeline.getAsMap("headers"));
            Map<String, String> urlParameters = filterParams(dataPipeline.getAsMap("urlParameters"));
            Map<String, Map<String, String>> auth = dataPipeline.getAsMap("auth");
            Map<String, Object> formData = dataPipeline.getAsMap("formData");
            InputStream inputStream = (InputStream) dataPipeline.get("inputStream");
            String payload = dataPipeline.getString("payload");
            Boolean sslValidation = true;
            Map<String, Object> settings = dataPipeline.getAsMap("settings");

            if (null == settings) {
                settings = Maps.newHashMap();
            }

            if (null != settings.get("sslValidation")) {
                sslValidation = (Boolean) settings.get("sslValidation");
            }

            if (auth!=null && auth.get("awsSignature") != null) {

                String AccessKey = auth.get("awsSignature").get("AccessKey");
                String SecretKey = auth.get("awsSignature").get("SecretKey");
                String region = auth.get("awsSignature").get("region");
                String service = auth.get("awsSignature").get("service");
                byte[] payloadBytes = null;
                if (StringUtils.isNotBlank(payload)) {
                    payloadBytes = payload.getBytes();
                } else if (null != inputStream && null == payloadBytes) {
                    payloadBytes = IOUtils.toByteArray(inputStream);
                    inputStream = new ByteArrayInputStream(payloadBytes);
                    dataPipeline.put("inputStream", inputStream);
                }
                AWSHeaders.build(reqHeaders, method, urlParameters, url, AccessKey, SecretKey, region, service, payloadBytes);

            }

            Map<String, Object> response = Client.invoke(dataPipeline, url, method, formData, reqHeaders, payload, inputStream, urlParameters, settings, sslValidation);
  			if (null != response) {
              	dataPipeline.put("statusCode", response.get("statusCode"));
            	dataPipeline.put("respPayload", response.get("respPayload"));
            	dataPipeline.put("inputStream", response.get("inputStream"));
            	dataPipeline.put("respHeaders", response.get("respHeaders"));
            	dataPipeline.put("isSuccessful", true);
              
              
            }

        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("isSuccessful", false);
            new SnippetException(dataPipeline, "Snippet exception In request Service", new Exception(e));
        }
	}
/**
     * @param params
     * @return
     */
    private static Map<String, String> filterParams(Map<String, Object> params) {
        if (null == params) {
            return new HashMap<>();
        }
        return params.entrySet().stream().collect(Collectors.toMap(k -> k.getKey(), v -> v.getValue().toString()));
    }
}