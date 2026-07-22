package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class bytesToString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try {	
      dataPipeline.appLog("OPERATION", "byteToString");
      byte[] bytes = (byte[]) dataPipeline.get("bytes");
      dataPipeline.appLog("CONVERSION_COMPLETE", "Byte array successfully converted to String");
      dataPipeline.put("text", new String(bytes));
      dataPipeline.appLog("TEXT", new String(bytes));

  } catch (Exception e) {
      dataPipeline.clear();
      dataPipeline.put("error",e.getMessage());
      dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
      new SnippetException(dataPipeline,"Snippet exception", e);
  }

	}

}