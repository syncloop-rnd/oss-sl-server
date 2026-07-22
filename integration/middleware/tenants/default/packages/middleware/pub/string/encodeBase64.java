package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
public final class encodeBase64{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "encodebase64");
  			String input = dataPipeline.getString("input");
  			dataPipeline.appLog("INPUT", input);
            byte[] bytesContent = (byte[]) dataPipeline.get("bytesContent");
  			dataPipeline.appLog("BYTE_CONTENT", String.valueOf(bytesContent));
            if (null != bytesContent) {
                dataPipeline.put("encoded_output", new String(Base64.getEncoder().encode(bytesContent)));
              	dataPipeline.appLog("ENCODED_OUTPUT", new String(Base64.getEncoder().encode(bytesContent)));
            } else {
                dataPipeline.put("encoded_output", new String(Base64.getEncoder().encode(input.getBytes(StandardCharsets.UTF_8))));
              	dataPipeline.appLog("ENCODED_OUTPUT", new String(Base64.getEncoder().encode(input.getBytes(StandardCharsets.UTF_8))));
            }
  
} catch (Exception e) {
  throw new SnippetException(dataPipeline, "packages.middleware.pub.string.patternQuote" , e);
}
	}

}