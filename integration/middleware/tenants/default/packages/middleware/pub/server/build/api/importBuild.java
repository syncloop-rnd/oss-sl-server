package packages.middleware.pub.server.build.api;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.RuntimePipeline;

import java.io.*;

import org.apache.commons.io.IOUtils;

import java.util.*;
import java.io.FileOutputStream;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import java.util.zip.ZipEntry;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.heap.CacheManager;
public final class importBuild{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  String token = dataPipeline.getAsString("token");
        new Thread(() -> {
            try {
                runImportService(dataPipeline, token);
            } catch (SnippetException e) {
                e.printStackTrace();
            }
        }).start();

        dataPipeline.put("status", "202");
        dataPipeline.put("message", "Import started in background.");
	}
public static void runImportService(DataPipeline dataPipeline, String token) throws SnippetException {
        Map<String, Object> cache = CacheManager.getCacheAsMap(dataPipeline.rp.getTenant());
        Map<String, Object> status = new HashMap<>();
        status.put("status", "IN_PROGRESS");
        status.put("message", "Import started");
        status.put("percent", 0);
        status.put("timestamp", System.currentTimeMillis());
        status.put("logs", new ArrayList<>(List.of("Starting import...")));
        status.put("importedData", "NA");
        cache.put("POLL_IMPORT_" + token, status);
        //dataPipeline.put("importBuildToken", token);
        try {
            dataPipeline.appLog("OPERATION", "importBuild");
            updateImportStatus(cache, token, "Saving uploaded file", 10);
            //Thread.sleep(9000);
            //String folder=dataPipeline.getString("dest");
            String packagePath = PropertyManager.getPackagePath(dataPipeline.rp.getTenant());
            dataPipeline.appLog("EXTRACTED_PACKAGE_PATH", packagePath);
            String buildsDirPath = packagePath + "builds/import/";
            dataPipeline.appLog("EXTRACTED_BUILDS_DIRECTORY_PATH", buildsDirPath);
            InputStream is = dataPipeline.getFile("file");
            String fileName = dataPipeline.getFileName("file");
            dataPipeline.appLog("IMPORT_FILE_NAME", fileName);
            String location = buildsDirPath + fileName;
            dataPipeline.appLog("EXTRACTED_IMPORT_LOCATION", location);
            File dir = new File(buildsDirPath);
            if (!dir.exists())
                dir.mkdirs();
            dataPipeline.appLog("DIRECTORY_CREATED", "Directory has been created");
            FileOutputStream fos = new FileOutputStream(new File(location));
            IOUtils.copy(is, fos);
            fos.flush();
            fos.close();
            dataPipeline.clear();
            dataPipeline.appLog("IMPORT_FILE_SAVED", "Saved import file to location: " + location);
            //Backup packages
            updateImportStatus(cache, token, "Creating restore point", 25);
//            Thread.sleep(9000);
            createRestorePoint(fileName, dataPipeline);
            dataPipeline.appLog("BACKUP_CREATED", fileName);
            //Unzip and deploy
            updateImportStatus(cache, token, "Unzipping and deploying", 60);
//            Thread.sleep(9000);

            unzip(location, packagePath, token, dataPipeline);
            dataPipeline.appLog("UNZIP_AND_DEPLOY", fileName);
            //import URLaliases
            updateImportStatus(cache, token, "Importing URL Aliases", 80);
            String UrlAliasFilepath = packagePath + (("URLAlias_" + fileName + "#").replace(".zip#", ".properties"));
            Boolean importSuccessful = importURLAliases(UrlAliasFilepath, dataPipeline);
            if (importSuccessful) {
                Map<String, Object> pollImportMap = (Map<String, Object>) cache.get("POLL_IMPORT_" + token);
                if (pollImportMap == null) {
                    pollImportMap = new HashMap<>();
                }
                pollImportMap.put("status", "COMPLETED_SUCCESS");
                pollImportMap.put("message", "Build imported and saved successfully.");
                pollImportMap.put("percent", 100);
                pollImportMap.put("timestamp", System.currentTimeMillis());

                cache.put("POLL_IMPORT_" + token, pollImportMap);  // update

                Map<String, Object> chache = CacheManager.getCacheAsMap(dataPipeline.rp.getTenant());
                chache.put("ekamw.promote.runtime.service.reload", true);

                dataPipeline.put("status", "200");
                dataPipeline.put("message", "Build imported and saved successfully.");
                dataPipeline.put("token", "POLL_IMPORT_" + token);
                dataPipeline.appLog("SERVICE_STATUS", "Build imported and saved.");

            } else {
                Map<String, Object> pollImportMap = (Map<String, Object>) cache.get("POLL_IMPORT_" + token);
                if (pollImportMap == null) {
                    pollImportMap = new HashMap<>();
                }
                pollImportMap.put("status", "COMPLETED_ERROR");
                pollImportMap.put("message", "URL alias import failed.");
                pollImportMap.put("percent", 90);
                pollImportMap.put("timestamp", System.currentTimeMillis());

                cache.put("POLL_IMPORT_" + token, pollImportMap);

                dataPipeline.put("status", "500");
                dataPipeline.put("error", "URL alias import failed.");
                dataPipeline.setResponseStatus(500);
                dataPipeline.appLog("SERVICE_STATUS", "Build import failed during URL alias import.");
            }
          	ServiceUtils.expireServiceCache("packages.middleware.pub.server.browse.getPackagesAsTree");
        } catch (Exception e) {
            Map<String, Object> err_cache = CacheManager.getCacheAsMap(dataPipeline.rp.getTenant());
            Map<String, Object> pollImportMap = (Map<String, Object>) err_cache.get("POLL_IMPORT_" + token);
            if (pollImportMap == null) {
                pollImportMap = new HashMap<>();
            }
            pollImportMap.put("status", "COMPLETED_ERROR");
            pollImportMap.put("message", e.getMessage());
            pollImportMap.put("percent", 0);
            pollImportMap.put("timestamp", System.currentTimeMillis());

            err_cache.put("POLL_IMPORT_" + token, pollImportMap);

            dataPipeline.clear();
            dataPipeline.put("status", "500");
            dataPipeline.put("error", e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            new SnippetException(dataPipeline, "Failed while importing build", new Exception(e));
        }
    }

    private static final Set<String> MAIN_FILE_EXTENSIONS = Set.of("flow", "api", "service", "sql", "java", "class");
    private static final Set<String> OTHER_FILE_EXTENSIONS = Set.of("map", "doc", "package", "root", "properties", "jar", "jdbc", "pem");

    private static final Set<String> RESERVED_KEYWORDS = Set.of(
            "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class",
            "continue", "default", "do", "double", "else", "enum", "extends", "final", "finally",
            "float", "for", "if", "implements", "import", "instanceof", "int", "interface", "long",
            "native", "new", "null", "package", "private", "protected", "public", "return", "short",
            "static", "strictfp", "super", "switch", "synchronized", "this", "throw", "throws",
            "transient", "try", "void", "volatile", "while"
    );

    private static void updateImportStatus(Map<String, Object> cache, String token, String message, int percent) {
        Map<String, Object> status = (Map<String, Object>) cache.get("POLL_IMPORT_" + token);
        status.put("message", message);
        status.put("percent", percent);
        status.put("timestamp", System.currentTimeMillis());
        List<String> logs = (List<String>) status.get("logs");
        if (logs != null) logs.add(message);
        cache.put("POLL_IMPORT_" + token, status);
    }

    private static boolean importURLAliases(String UrlAliasFilepath, DataPipeline dp) throws Exception {
        Boolean importSuccessful = true;
        Properties prop = new Properties();
        File file = new File(UrlAliasFilepath);
        if (!file.exists()) {
            dp.put("msg", "Alias file not found. Path: " + UrlAliasFilepath);
            dp.appLog("ALIAS_FILE_NOT_FOUND", UrlAliasFilepath);
            return true;
        }
        FileInputStream aliasFIS = new FileInputStream(file);
        prop.load(aliasFIS);
        prop.forEach((k, v) -> {
            //if(dp.getString("error")==null){
            String key = (String) k;
            String value = (String) v;
            dp.map("fqn", value);
            dp.map("alias", key);
            try {
                dp.apply("packages.middleware.pub.server.browse.registerURLAlias");
                String msg = dp.getString("msg");
                if (!"Saved".equals(msg))
                    dp.put("error", msg);

            } catch (Exception e) {
                dp.put("error", e.getMessage());
                dp.appLog("REGISTER_ALIAS_ERROR", e.getMessage());
            }
            dp.drop("fqn");
            dp.drop("alias");
            // }
        });
        aliasFIS.close();
        if (dp.getString("error") != null)
            importSuccessful = false;
        dp.appLog("IMPORT_STATUS", "importBuild was not successful.");
        file.delete();
        dp.appLog("IMPORT_STATUS", "importBuild was successful");
        return importSuccessful;
    }


    private static void unzip(String zipFilePath, String destDir, String token, DataPipeline dp) throws Exception {
        File dir = new File(destDir);
        String unZippedFolderPath = null;
        // create output directory if it doesn't exist
        if (!dir.exists()) dir.mkdirs();
        dp.appLog("NEW_DIRECTORY_CREATED", destDir);
        FileInputStream fis;
        dp.appLog("UNZIP_PROCESS", "Starting the unzipping process.");
        // buffer for read and write data to file

        List<Map<String, Object>> tree = new ArrayList<>();
        List<Map<String, Object>> invalidTree = new ArrayList<>();
        boolean hasInvalidFiles = false;
        boolean isInvalidRootValueSet = false;
        String invalidRoot = null;

        fis = new FileInputStream(zipFilePath);
        ZipInputStream zis = new ZipInputStream(fis);
        ZipEntry ze = zis.getNextEntry();
        while (ze != null) {
            String fileName = ze.getName();
            dp.appLog("ZIPPED_ENTRY_PROCESS", "Processing zipped entry");

            if (unZippedFolderPath == null) {
                unZippedFolderPath = fileName;

                // Check if ZIP filename matches first folder
                String zipNameOnly = new File(zipFilePath).getName();
                if (zipNameOnly.toLowerCase().endsWith(".zip")) {
                    zipNameOnly = zipNameOnly.substring(0, zipNameOnly.length() - 4);
                }

                String topFolder = fileName.split("/")[0];
                if (!zipNameOnly.equals(topFolder)) {
                    throw new Exception("Invalid Import File. Please upload a valid Syncloop export package.");
                }
            } else {
                dp.log("Zipped entry " + fileName);
                dp.appLog("ZIPPED_ENTRY", fileName);
                fileName = ("#$" + fileName).replace("#$" + unZippedFolderPath, "");
                if (fileName == null || fileName.trim().isEmpty()) {
                    ze = zis.getNextEntry();
                    continue;
                }
                dp.appLog("PROCESSED_FILE_NAME", fileName);
                File newFile = new File(destDir + File.separator + fileName);
                new File(newFile.getParent()).mkdirs();

                String extension = getExtension(fileName);
                if (extension == null || extension.trim().isEmpty()) {
                    dp.appLog("SKIPPED_EMPTY_EXTENSION", "Skipped file with no extension: " + fileName);
                    ze = zis.getNextEntry();
                    continue;
                }
                // if (MAIN_FILE_EXTENSIONS.contains(extension) || OTHER_FILE_EXTENSIONS.contains(extension)) {

                String fileOnly = getFileOnlyName(fileName);
                String[] folders = getFolders(fileName);

                boolean isMainFile = MAIN_FILE_EXTENSIONS.contains(extension);
//                boolean firstIsPackages = folders.length > 0 && "packages".equals(folders[0]);
                boolean insideRootFolder = true;
                boolean foldersValid = areFoldersValid(folders, dp);
                boolean nameValid = !isMainFile || isValidFileName(fileOnly, dp); // Only validate name for main files
                if (!insideRootFolder && folders.length > 1 && !folders[0].matches("^[#.$~_].*") && !isInvalidRootValueSet) {
                    invalidRoot = folders[0];
                }
              
              	boolean isGuiFolder = fileName.startsWith("gui/") || fileName.contains("/gui/");

                if (isGuiFolder) {
                    dp.appLog("GUI_IMPORT", "Including GUI file: " + fileName);
                    File newGuiFile = new File(destDir + File.separator + fileName);
                    new File(newGuiFile.getParent()).mkdirs();
                    if (!ze.isDirectory()) {
                        writeZipEntryToFile(zis, newGuiFile);
                    } else {
                        newGuiFile.mkdirs();
                    }
                    ze = zis.getNextEntry();
                    continue; // Skip other checks, we've handled GUI files
                }


                if (!insideRootFolder || !foldersValid || !nameValid) {
                    Map<String, Object> invalidFileMap = createFileMap(fileName, extension);
                    hasInvalidFiles = true;
                    if (invalidFileMap != null) {
                        addItemToMap(destDir, fileName, invalidFileMap, invalidTree, !insideRootFolder);
                    }
                } else {
                    Map<String, Object> fileMap = createFileMap(fileName, extension);
                    if (fileMap != null) {
                        addItemToMap(destDir, fileName, fileMap, tree, insideRootFolder);
                    }
                  	String fqn = fileName.replace("/", ".").replace("." + extension, "");

                    if (!ServiceUtils.canImport(fqn, dp)) {
                        dp.appLog("IMPORT_SKIPPED","Skipping import for FQN (canImport=false): " + fqn);

                        hasInvalidFiles = true;

                        Map<String, Object> invalidFileMap = createFileMap(fileName, extension);
                        if (invalidFileMap != null) {
                            addItemToMap(destDir, fileName, invalidFileMap, invalidTree, insideRootFolder);
                        }

                        ze = zis.getNextEntry();
                        continue; 
                    }

                    // Only write if it's a file
                    if (!ze.isDirectory()) {
                        writeZipEntryToFile(zis, newFile);
                    } else {
                        newFile.mkdirs();
                    }
                }
                // }
            }
            // close this ZipEntry
            zis.closeEntry();
            ze = zis.getNextEntry();
        }
        // close last ZipEntry
        zis.closeEntry();
        zis.close();
        fis.close();

        Map<String, Object> unzipInfo = new HashMap<>();
        unzipInfo.put("list", tree);
        unzipInfo.put("invalidList", invalidTree);
        unzipInfo.put("hasInvalidFiles", hasInvalidFiles);
        unzipInfo.put("invalidRoot", invalidRoot);

        Map<String, Object> cache = CacheManager.getCacheAsMap(dp.rp.getTenant());
        Map<String, Object> pollImportStatus = new HashMap<>();
        pollImportStatus.put("status", "Unzipped");
        pollImportStatus.put("message", "File unzipped.");
        pollImportStatus.put("percent", 70);
        pollImportStatus.put("timestamp", System.currentTimeMillis());
        pollImportStatus.put("importedData", unzipInfo);

        cache.put("POLL_IMPORT_" + token, pollImportStatus);


    }


    private static void createRestorePoint(String buildName, DataPipeline dataPipeline) throws Exception {
        String packagePath = PropertyManager.getPackagePath(dataPipeline.rp.getTenant());
        dataPipeline.appLog("EXTRACTED_PACKAGE_PATH", packagePath);
        String bkpDirPath = packagePath + "builds/backup/";
        dataPipeline.appLog("BACKUP_DIRECTORY_PATH", bkpDirPath);
        File dir = new File(bkpDirPath);
        String timeStmp = System.currentTimeMillis() + "";
        dataPipeline.appLog("TIME_STAMP", timeStmp);
        if (!dir.exists())
            dir.mkdirs();
        dataPipeline.appLog("BACKUP_DIRECTORY_CREATED", bkpDirPath);
        FileOutputStream fos = new FileOutputStream(bkpDirPath + timeStmp + "_packages_" + buildName);
        ZipOutputStream zipOut = new ZipOutputStream(fos);
        File fileToZip = new File(packagePath + "packages/");
        ServiceUtils.zipFile(fileToZip, fileToZip.getName(), zipOut);
        zipOut.flush();
        zipOut.close();
        fos.flush();
        fos.close();
        //dataPipeline.log(fileToZip.getAbsolutePath());
        //FileUtils.deleteDirectory(fileToZip);
    }

    private static void addItemToMap(String destDir,
                                     String fileName,
                                     Map<String, Object> fileMap,
                                     List<Map<String, Object>> tree,
                                     boolean insideValidatedRoot) {
        String[] folders = fileName.split("/");
        if (folders.length == 0) return;

        List<Map<String, Object>> currentChildren = tree;

        for (int i = 0; i < folders.length - 1; i++) {
            String folderName = folders[i];

            // Exclude typical system entries
            if (folderName.matches("^[#.$~_].*")) return;

            Map<String, Object> folderMap = null;

            for (Map<String, Object> child : currentChildren) {
                Object text = child.get("text");
                Object type = child.get("type");
                if (folderName.equals(text) && "folder".equals(type)) {
                    folderMap = child;
                    break;
                }
            }

            if (folderMap == null) {
                folderMap = new HashMap<>();
                folderMap.put("text", folderName);
                folderMap.put("type", "folder");
                folderMap.put("children", new ArrayList<Map<String, Object>>());
                currentChildren.add(folderMap);
            }

            Object childrenObj = folderMap.get("children");
            if (!(childrenObj instanceof List)) {
                List<Map<String, Object>> newChildren = new ArrayList<>();
                folderMap.put("children", newChildren);
                currentChildren = newChildren;
            } else {
                currentChildren = (List<Map<String, Object>>) childrenObj;
            }
        }

        String itemName = fileName.substring(fileName.lastIndexOf("/") + 1);
        if (!itemName.startsWith("URLAlias")) {
            itemName = itemName.contains(".") ? itemName.substring(0, itemName.lastIndexOf(".")) : itemName;
            fileMap.put("text", itemName);
            currentChildren.add(fileMap);
        }
    }

    private static String getFileOnlyName(String filePath) {
        String fileOnly = filePath.substring(filePath.lastIndexOf('/') + 1);
        int dotIndex = fileOnly.lastIndexOf('.');
        return (dotIndex > 0) ? fileOnly.substring(0, dotIndex) : fileOnly;
    }

    private static String getExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return (dotIndex != -1) ? fileName.substring(dotIndex + 1) : "";
    }

    private static String[] getFolders(String filePath) {
        String[] parts = filePath.split("/");
        return Arrays.copyOf(parts, parts.length - 1); // exclude the file name
    }

    private static boolean areFoldersValid(String[] folders, DataPipeline dp) {
        for (int i = 1; i < folders.length; i++) { // skip first ("packages")
            if (RESERVED_KEYWORDS.contains(folders[i])) {
                dp.appLog("INVALID_FOLDER_NAME", "Reserved keyword used in folder path: " + folders[i]);
                return false;
            }
        }
        return true;
    }

    private static Map<String, Object> createFileMap(String fileName, String type) {
        if (fileName == null || fileName.trim().isEmpty()) return null;
        if (type == null || type.trim().isEmpty()) return null;

        Map<String, Object> map = new HashMap<>();
        map.put("text", fileName);
        map.put("type", type);
        return map;
    }


    private static void writeZipEntryToFile(ZipInputStream zis, File newFile) throws IOException {
        byte[] buffer = new byte[1024];
        try (FileOutputStream fos = new FileOutputStream(newFile)) {
            int len;
            while ((len = zis.read(buffer)) > 0) {
                fos.write(buffer, 0, len);
            }
        }
    }

    private static boolean isValidFileName(String fileName, DataPipeline dp) {
        if (RESERVED_KEYWORDS.contains(fileName)) {
            dp.appLog("INVALID_FILE_NAME", "Reserved keyword used in file name: " + fileName);
            return false;
        }
        if (fileName.length() > 100) {
            dp.appLog("INVALID_FILE_NAME", "File name exceeds 100 characters: " + fileName);
            return false;
        }
        if (Character.isDigit(fileName.charAt(0))) {
            dp.appLog("INVALID_FILE_NAME", "File name starts with a number: " + fileName);
            return false;
        }
        if (!fileName.matches("^[a-zA-Z]+[A-Za-z0-9_]*$")) {
            dp.appLog("INVALID_FILE_NAME", "File name contains invalid characters: " + fileName);
            return false;
        }
        return true;
    }
}