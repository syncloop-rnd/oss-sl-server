package packages.middleware.pub.io;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.io.InputStream;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

public final class streamToFile{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try (InputStream inputStream = (InputStream) dataPipeline.get("inputStream");) {
  System.out.println("asd==================>" + dataPipeline.get("inputStream"));
            String diskPath = dataPipeline.getString("diskPath");
  			Boolean createPath = dataPipeline.getAsBoolean("createParentPath");
  			if(createPath!=null && createPath){
            	new File(diskPath).getParentFile().mkdirs();
            }
            long bytesWritten = Files.copy(inputStream, Paths.get(diskPath), StandardCopyOption.REPLACE_EXISTING);
            dataPipeline.put("bytesWritten", bytesWritten);
        } catch (Exception e) {
  e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}

}