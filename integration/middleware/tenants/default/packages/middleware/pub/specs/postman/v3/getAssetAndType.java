package packages.middleware.pub.specs.postman.v3;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.PropertyManager;
import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public final class getAssetAndType{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

		String packagePath = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "packages/";
		String folderName = dataPipeline.getString("folderName");

        List<Map<String, String>> serviceDetails = findServices(packagePath, folderName);
        dataPipeline.put("serviceDetails",serviceDetails);
	}
private static List<Map<String, String>> findServices(String baseFolderPath, String folderName) {
    List<Map<String, String>> result = new ArrayList<>();
    findServicesRecursive(baseFolderPath, folderName, result);
    return result;
}

private static void findServicesRecursive(String basePath, String folderName, List<Map<String, String>> result) {
    File currentFolder = new File(basePath, folderName);
    File[] files = currentFolder.listFiles();

    if (files != null) {
        for (File file : files) {
            if (file.isDirectory()) {
                findServicesRecursive(basePath, folderName + "/" + file.getName(), result);
            } else {
                String fileName = file.getName();
                if (fileName.endsWith(".api") || fileName.endsWith(".properties")) {
                    String relativePath = file.getPath().substring(basePath.length());
                    String asset = "packages/" + relativePath.replace(File.separator, "/");
                    asset = asset.substring(0, asset.lastIndexOf('.'));
                    String type = fileName.substring(fileName.lastIndexOf('.') + 1);

                    Map<String, String> map = new HashMap<>();
                    map.put("asset", asset);
                    map.put("type", type);
                    result.add(map);
                }
            }
        }
    }
}
}