package packages.middleware.pub.specs.postman.v3;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.PropertyManager;
import java.io.File;
public final class FileRenamer{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            String input = dataPipeline.getString("input");
            String packagePath = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "packages/";

            String cleanedInput = input.trim().replaceAll("[\\[\\]-]", "_").replaceAll(" ", "_");

            String uniqueName = getUniqueFileName(packagePath, cleanedInput);
            dataPipeline.put("output", uniqueName);
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            new SnippetException(dataPipeline, "SnippetException exception", e);
        }
	}
private static String getUniqueFileName(String path, String baseName) {
        int count = 1;
        String fileName = baseName;

        File file = new File(path + fileName);
        if (!file.exists()) {
            return fileName;
        }

        int lastIndex = fileName.lastIndexOf('_');
        if (lastIndex != -1) {
            String lastPart = fileName.substring(lastIndex + 1);
            try {
                count = Integer.parseInt(lastPart);
                count++;
                fileName = fileName.substring(0, lastIndex + 1) + count;
            } catch (NumberFormatException ex) {
                System.err.println("Warning: Invalid integer suffix encountered. Defaulting to increment by 1. --> OPERATION : FileRenamer");
  
            }
        } else {
            fileName = fileName + "_1";
        }
        while (true) {
            file = new File(path + fileName);
            if (!file.exists()) {
                return fileName;
            }
            count++;
            fileName = baseName + "_" + count;
        }
    }
}