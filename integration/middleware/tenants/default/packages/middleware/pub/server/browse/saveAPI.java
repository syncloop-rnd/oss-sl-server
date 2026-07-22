package packages.middleware.pub.server.browse;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Base64;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.List;
import org.apache.commons.io.FileUtils;
import com.eka.middleware.service.PropertyManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException; 
import com.eka.middleware.auth.AuthAccount;
import java.net.URL;

import com.eka.middleware.server.MiddlewareServer;
import com.eka.middleware.auth.ResourceAuthenticator;
public final class saveAPI{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
		
            Boolean reBuild=dataPipeline.getAsBoolean("reBuildAll");
  			dataPipeline.appLog("OPERATION", "saveAPI");
            if(reBuild!=null && reBuild==true){
                String location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant());
                File file = new File(location);
              	dataPipeline.appLog("REBUILD_PROCESS", "Starting the rebuild process...");
                reBuildAll(dataPipeline, file,file.toURI().toString());
            }else{
                //System.out.println("**********************"+dataPipeline.getUrlPath());
                String location = dataPipeline.getUrlPath().split("POST/api/")[1];
                //System.out.println("++++++++++++++++++++++++++++++++++++"+location);
                String split[] = location.split(Pattern.quote("."));
                String ext = split[split.length - 1];
              	ServiceUtils.expireServiceCache("packages.middleware.pub.server.browse.getPackagesAsTree");
                String flowRef=location;
                location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant())
                        + location;
                dataPipeline.clear();
                dataPipeline.put("Location", location);
              	dataPipeline.appLog("API_LOCATION", location);
                File file = new File(location);
              
              	//com.eka.middleware.service.SafeFileUtil.checkNoSymlink(location);

                AuthAccount authAccount = dataPipeline.getCurrentRuntimeAccount();
                String loggedInUserId = authAccount.getUserId();
              	dataPipeline.appLog("LOGGED_IN_USER_ID", loggedInUserId);
                String lockedByUser = null;
                boolean canUpdate=false;
                if(!file.exists()) {
                    file.getParentFile().mkdirs();
                    file.createNewFile();
                  	dataPipeline.appLog("NEW_API_CREATED", file.getName());
                    canUpdate=true;
                }else{
                    lockedByUser = getLockedByUser(file);

                    canUpdate=(lockedByUser!=null && lockedByUser.equals(loggedInUserId));
                }

                if(canUpdate){
                    String json = new String(dataPipeline.getBody());
                    Map<String, Object> jsonMap = ServiceUtils.jsonToMap(json);
                    Map<String, Object> version=(Map<String, Object>)jsonMap.get("latest");
                    version.put("lockedByUser",loggedInUserId);
                  	dataPipeline.appLog("RESOURCE_LOCKED_BY_CURRENT_USER",lockedByUser);
                    java.nio.file.Files.write(file.toPath(), ServiceUtils.toPrettyJson(jsonMap).getBytes());
                    //System.out.println("++++++++++++++++++++++++++++++++++++"+loggedInUserId);
                  	generateJavaClass(file,flowRef,dataPipeline);
                    dataPipeline.clear();
                    dataPipeline.put("status", "200");
                    dataPipeline.put("message", "API saved successfully.");
                    dataPipeline.appLog("JAVA_CLASS_SAVED_FOR_API", file.getName());
					ResourceAuthenticator.resetPermission("resource");
                }else {
                    dataPipeline.clear();
                    dataPipeline.setResponseStatus(409); // Conflict
                    dataPipeline.put("status", "409");

                    if (lockedByUser != null) {
                        dataPipeline.put("error", "Resource is locked by another user ('" + lockedByUser + "').");
                        dataPipeline.appLog("RESOURCE_LOCKED_BY_ANOTHER_USER", lockedByUser);
                    } else {
                        dataPipeline.put("error", "Please lock the resource first.");
                        dataPipeline.appLog("RESOURCE_NOT_LOCKED", "Please lock the resource first.");
                    }
                }
			/*java.nio.file.Files.write(file.toPath(), dataPipeline.getBody());
			System.out.println("++++++++++++++++++++++++++++++++++++"+location);
			dataPipeline.clear();
  			generateJavaClass(file,flowRef,dataPipeline);
			dataPipeline.put("status", "Saved");
  			*/
                //dataPipeline.log(fullCode);
            }
        } catch (Throwable e) {
  			e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("status", "500");
            dataPipeline.put("error", e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.appLog("SAVE_API_ERROR", e.getMessage());
            new SnippetException(dataPipeline,"Failed while saving file", new Exception(e));	
        }
	}


public static void generateJavaClass(File file,String flowRef, DataPipeline dataPipeline)throws Exception {
  		dataPipeline.appLog("GENERATING_JAVA_CLASS_FOR_API",file.getName());
        String flowJavaTemplatePath=MiddlewareServer.getConfigFolderPath()+"apiJava.template";
        //System.out.println("flowJavaTemplatePath: "+flowJavaTemplatePath);
        String className=file.getName().replace(".api", "");
        //URL url = new URL(flowJavaTemplatePath);
        String fullCode="";
        String pkg=flowRef.replace("/"+file.getName(),"").replace("/",".");
        List<String> lines = FileUtils.readLines(new File(flowJavaTemplatePath), "UTF-8");
        for (String line: lines) {
            String codeLine=(line.replace("#flowRef",flowRef).replace("#package",pkg).replace("#className",className));
            fullCode+=codeLine+"\n";
            //dataPipeline.log("\n");
            //dataPipeline.log(codeLine);
        }
        //dataPipeline.log("\n");
        //return fullCode;

        //System.out.println("@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
        //String fullCode="";//pkg+"\n"+imports+"\n"+classDef+"\n"+mainDef+"\n"+mainFunc+"\n"+mainDefClose+"\n"+classDefClose;
        //System.out.println(fullCode);
        //System.out.println(className+".service");
        String javaFilePath=file.getAbsolutePath().replace(className+".api", className+".java");
        File javaFile=new File(javaFilePath);
        if (!javaFile.exists()) {
            javaFile.createNewFile();
        }
        //System.out.println(javaFilePath);
        FileOutputStream fos = new FileOutputStream(javaFile);
        fos.write(fullCode.getBytes());
        fos.flush();
        fos.close();
        String fqn=pkg.replace("package ", "").replace(";","")+"."+className+".main";
        //dataPipeline.log("fqn: "+fqn);
        ServiceUtils.compileJavaCode(fqn, dataPipeline);
    }

    private static void reBuildAll(DataPipeline dp, File dir, String packagePath)throws Exception{
      	dp.appLog("REBUILDING_DIRECTORY", dir.getAbsolutePath());
        File files[]= dir.listFiles();
        for (File file : files) {
            if(file.isDirectory()) {
                reBuildAll(dp, file,packagePath);
            }else if(file.getName().toLowerCase().endsWith(".api")) {
                String path=file.toURI().toString();
                String flowRef=path.replace(packagePath,"");
                dp.log(flowRef);
                generateJavaClass(file,flowRef,dp);
            }
        }
        //generateJavaClass(file,flowRef,dataPipeline);
      	dp.appLog("REBUILD_PROCESS_COMPLETED", "Rebuilding process for directory completed.");
    }

    public static String getLockedByUser(File file)throws Exception{
        byte[] data = ServiceUtils.readAllBytes(file);
        String json = new String(data);
        Map<String, Object> jsonMap = ServiceUtils.jsonToMap(json);
        Map<String, Object> version=(Map<String, Object>)jsonMap.get("latest");
        if(version !=null && version.get("lockedByUser")==null)
            return null;
        return version.get("lockedByUser").toString();
    }

}