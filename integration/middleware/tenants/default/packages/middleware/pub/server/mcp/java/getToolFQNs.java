package packages.middleware.pub.server.mcp.java;
import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.*;

import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.template.SnippetException;
import java.util.stream.Collectors;
public final class getToolFQNs{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            dataPipeline.appLog("OPERATION", "getToolsFQNs");
            String packageName=dataPipeline.getString("packageName");
            String prefix="packages.";
            if(packageName!=null && packageName.trim().length()>0){
                prefix+=packageName+".";
            }else
                packageName="";
            String packageDir = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) +"packages/"+packageName;
            dataPipeline.appLog("EXTRACTED_PACKAGE_DIRECTORY",packageDir);
            File file = new File(packageDir);

            List<String> FQNs=listApiFilesAsClasses(file,prefix);
            dataPipeline.clear();
            if(FQNs!=null && FQNs.size()>0)
                dataPipeline.put("tools", FQNs);
            dataPipeline.put("status", "success");
            dataPipeline.appLog("SUCCESSFUL", "Tools extracted successfully");
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.put("status", "failed");
            dataPipeline.appLog("SERVICE_ERROR", "An error occurred: " + e.getMessage());
        }
	}

    public static List<String> listApiFilesAsClasses(File rootFolder,String prefix) {
        List<String> apiClasses = new ArrayList<>();
        
        if (rootFolder == null || !rootFolder.exists() || !rootFolder.isDirectory()) {
            return apiClasses;
        }
        
        String rootPath = rootFolder.getAbsolutePath();
        searchApiFiles(rootFolder, rootPath, apiClasses,prefix);
        
        return apiClasses;
    }
    
    private static void searchApiFiles(File currentDir, String rootPath, List<String> apiClasses,String prefix) {
        File[] files = currentDir.listFiles();
        
        if (files == null) {
            return;
        }
        
        for (File file : files) {
            if (file.isDirectory()) {
                // Recursively search subdirectories
                searchApiFiles(file, rootPath, apiClasses, prefix);
            } else if (file.isFile() && file.getName().endsWith(".api")) {
                // Convert file path to Java class notation
                String className = convertToClassName(file, rootPath);
                if (className != null && className.toLowerCase().contains("mcp.tools.")) {
                    apiClasses.add(prefix+className);
                }
            }
        }
    }

    private static String convertToClassName(File file, String rootPath) {
        String absolutePath = file.getAbsolutePath();
        
        // Remove root path and file extension
        if (!absolutePath.startsWith(rootPath)) {
            return null;
        }
        
        String relativePath = absolutePath.substring(rootPath.length());
        
        // Remove leading file separator if present
        if (relativePath.startsWith(File.separator)) {
            relativePath = relativePath.substring(1);
        }
        
        // Remove .api extension
        if (relativePath.endsWith(".api")) {
            relativePath = relativePath.substring(0, relativePath.length() - 4);
        }
        
        // Replace file separators with dots
        String className = relativePath.replace(File.separator, ".");
        
        return className;
    }
}