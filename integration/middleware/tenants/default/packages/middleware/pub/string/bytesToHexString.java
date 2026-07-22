package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class bytesToHexString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "byteToHexString");
            byte[] byteContent = (byte[]) dataPipeline.get("byteContent");
			dataPipeline.appLog("BYTE_CONTENT", "Retrieved byte content from dataPipeline "+ String.valueOf(byteContent));

            StringBuilder hexString = new StringBuilder();
            for (int i=0;i<byteContent.length;i++) {
                String hex=Integer.toHexString(0xff & byteContent[i]);
                if(hex.length()==1) {
                    hexString.append('0');
                  	dataPipeline.appLog("HEX_PADDED", "Padded hex value for byte");
                }
                hexString.append(hex);
              	dataPipeline.appLog("HEX_CONVERSION", "Byte " + i + " as Hex: " + hex);
            }

            dataPipeline.put("text", hexString.toString());
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}