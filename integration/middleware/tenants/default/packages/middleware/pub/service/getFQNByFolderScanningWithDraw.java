package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.PropertyManager;
import java.io.File;
import java.io.FilenameFilter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
public final class getFQNByFolderScanningWithDraw{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
    Boolean fullScan = dataPipeline.getAsBoolean("fullScan");
        Integer start = dataPipeline.getInteger("start");
        Integer offset = dataPipeline.getInteger("offset");

        if (start <= 0) {
            dataPipeline.appLog("ERROR", "Start index cannot be negative.");
            start = 0;
        }
        if (offset <= 0) {
            dataPipeline.appLog("ERROR", "Offset must be greater than zero.");
            offset = 20;
        }


        dataPipeline.appLog("OPERATION", "getFQNByFolderScanning");
        String basePath = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + File.separator + "packages";
        dataPipeline.appLog("EXTRACTED_BASEPATH", basePath);
        List<Map> outputList = new ArrayList<Map>();
        dataPipeline.appLog("OUTPUT_LIST", "Created an output list");
        List<String> packageNames = new ArrayList<>();
        dataPipeline.appLog("PACKAGE_NAMES", "Created a list for package names");
        File baseFolder = new File(basePath);
        dataPipeline.appLog("EXTRACTED_BASE_FOLDER", baseFolder.getAbsolutePath());

        if (!baseFolder.exists() || !baseFolder.isDirectory()) {
            System.err.println("Invalid base folder path.");
            dataPipeline.appLog("ERROR", "Invalid base folder path.");
        }



        File[] subdirectories = baseFolder.listFiles(File::isDirectory);
        dataPipeline.appLog("FOUND_SUBDIRECTORIES"," Subdirectories found in the base folder.");

        if (subdirectories != null) {
            for (File subdirectory : subdirectories) {
                if (fullScan) {
                    collectApiFiles(subdirectory, packageNames, "packages." + subdirectory.getName(), true);
                    dataPipeline.appLog("FULL_SCAN_ENABLED", "Scanning all subdirectories without specific restraints");
                } else {
                    // Only scan the wrapper/api folder if fullScan is false
                    File apiFolder = new File(subdirectory, "wrapper" + File.separator + "api");
                    if (apiFolder.exists() && apiFolder.isDirectory()) {
                        collectApiFiles(apiFolder, packageNames, "packages." + subdirectory.getName() + ".wrapper.api", false);
                        dataPipeline.appLog("FOUND_API_FOLDER", "Found API folder in subdirectory");
                    }
                }
            }
        }
/*
for (String packageName : packageNames) {
    Map output = new HashMap();
    output.put("fqn", packageName);
    outputList.add(output);
}
*/

        if (start < packageNames.size()) {
            List<Map<String, String>> paginatedList = packageNames.stream()
                    .skip(start)
                    .limit(offset)
                    .map(packageName -> {
                        Map<String, String> output = new HashMap<>();
                        output.put("fqn", packageName);
                        return output;
                    })
                    .collect(Collectors.toList());
            outputList.addAll(paginatedList);

            dataPipeline.appLog("PAGINATION", "Records paginated from " + start + " to " + Math.min(start + offset, packageNames.size()));
        } else {
            dataPipeline.appLog("WARNING", "Start index exceeds the list size. No records to return.");
        }




        dataPipeline.appLog("STATUS", "Finished processing");
        dataPipeline.put("output", outputList);
		dataPipeline.put("total", packageNames.size());
        dataPipeline.appLog("OUTPUT_LIST", outputList.toString());

	}
    private static void collectApiFiles(File folder, List<String> packageNames, String packageName, boolean fullScan) {
        File[] files = folder.listFiles(new FilenameFilter() {
            @Override
            public boolean accept(File dir, String name) {
                return name.endsWith(".api") || name.endsWith(".flow");
            }
        });

        if (files != null && files.length > 0) {
            for (File file : files) {
                String fileNameWithoutExtension = file.getName().replace(".api", "").replace(".flow", "");
                packageNames.add(packageName + "." + fileNameWithoutExtension);
            }
        }

        File[] subdirectories = folder.listFiles(File::isDirectory);
        if (subdirectories != null) {
            for (File subdirectory : subdirectories) {
                collectApiFiles(subdirectory, packageNames, packageName + "." + subdirectory.getName(), fullScan);
            }
        }
    }

}