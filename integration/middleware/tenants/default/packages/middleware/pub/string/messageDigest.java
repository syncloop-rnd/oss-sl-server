package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.codec.digest.DigestUtils;
import java.security.MessageDigest;
public final class messageDigest{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
			dataPipeline.appLog("OPERATION", "messageDigest");
            String algorithm = dataPipeline.getString("algorithm");
  			dataPipeline.appLog("ALGORITHM", "Digest Algorithm: " + algorithm);
            byte[] unDigestedContent = (byte[])dataPipeline.get("unDigestedContent");
  			dataPipeline.appLog("UNDIGESTED_CONTENT", "Length of Undigested Content: " + unDigestedContent.length + " bytes");
            dataPipeline.put("content", DigestUtils.digest(MessageDigest.getInstance(algorithm), unDigestedContent));
  			dataPipeline.appLog("RESULT", "Digest Result: " + DigestUtils.digest(MessageDigest.getInstance(algorithm), unDigestedContent));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}