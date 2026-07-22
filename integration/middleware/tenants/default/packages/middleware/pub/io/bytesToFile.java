package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.PropertyManager;
import java.io.File;
import java.io.OutputStream;
import java.io.FileOutputStream;
public final class bytesToFile{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  
  String filename = dataPipeline.getString("filename");
            byte[] bytes = (byte[])dataPipeline.get("bytes");
            //String syncLoopTmpdirectory = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "packages/middleware/dependency/tmp/";
            //File dFile = new File(null != System.getProperty("java.io.tmpdir") ? System.getProperty("java.io.tmpdir") : syncLoopTmpdirectory);
            
            filename = filename;
            File file = new File(filename);
  			if (!file.getParentFile().exists()) {
                file.getParentFile().mkdirs();
            }
            OutputStream os = new FileOutputStream(file);
            os.write(bytes);
            os.close();

            dataPipeline.put("file", file);
  
  } catch (Throwable e) {
  			e.printStackTrace();
			dataPipeline.clear();
			dataPipeline.put("error", e.getMessage());
			dataPipeline.setResponseStatus(500);
			dataPipeline.put("status", "Not Modified");
			new SnippetException(dataPipeline,"Failed while saving file", new Exception(e));
		}
	}

}