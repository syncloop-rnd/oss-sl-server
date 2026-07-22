package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Base64;
import java.nio.charset.StandardCharsets;

public final class decodeBase64{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  dataPipeline.appLog("OPERATION", "decodeBase64");
  String input = dataPipeline.getString("input");
  dataPipeline.appLog("INPUT", input);
  //dataPipeline.put("decoded_output", new String(Base64.getDecoder().decode(input.getBytes(StandardCharsets.UTF_8))));
  //dataPipeline.appLog("DECODING_COMPLETE", "Decoded output: " + new String(Base64.getDecoder().decode(input.getBytes(StandardCharsets.UTF_8))));
 dataPipeline.put("decoded_output",input);
} catch (Exception e) {
  e.printStackTrace();
  throw new SnippetException(dataPipeline, "packages.middleware.pub.string.patternQuote" , e);
}
	}

}