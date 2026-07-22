package packages.middleware.pub.server.browse;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Base64;
import java.util.Map;
import java.util.regex.Pattern;
import com.eka.middleware.service.PropertyManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException; 
import com.eka.middleware.auth.AuthAccount;

public final class saveService{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {
			//System.out.println("**********************"+dataPipeline.getUrlPath());
      		dataPipeline.appLog("OPERATION", "saveService");
			String location = dataPipeline.getUrlPath().split("POST/service/")[1];
      		dataPipeline.appLog("EXTRACTED_LOCATION_FROM_URL", location);
			//System.out.println("++++++++++++++++++++++++++++++++++++"+location);
			String split[] = location.split(Pattern.quote("."));
			String ext = split[split.length - 1];
			location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant())
					+ location;
			dataPipeline.clear();
			dataPipeline.put("Location", location);
      		dataPipeline.appLog("LOCATION", location);
			File file = new File(location);
      		//com.eka.middleware.service.SafeFileUtil.checkNoSymlink(location);
			AuthAccount authAccount = dataPipeline.getCurrentRuntimeAccount();
			String loggedInUserId = authAccount.getUserId();
			String lockedByUser = null;
			boolean canUpdate=false;
			if(!file.exists()) {
				file.getParentFile().mkdirs();
				file.createNewFile();
              	dataPipeline.appLog("SERVICE_FILE_CREATED", location);
				canUpdate=true;
			}else{
				lockedByUser = getLocakedByUser(file);
				canUpdate=(lockedByUser!=null && lockedByUser.equals(loggedInUserId));
			}
			
			if(canUpdate){
				String json = new String(dataPipeline.getBody());
                //System.out.println("***********"+json);
				Map<String, Object> jsonMap = ServiceUtils.jsonToMap(json);
				jsonMap.put("lockedByUser",loggedInUserId);
              	dataPipeline.appLog("RESOURCE_LOCKED_BY_CURRENT_USER",lockedByUser);
				java.nio.file.Files.write(file.toPath(), ServiceUtils.toPrettyJson(jsonMap).getBytes());
				//System.out.println("++++++++++++++++++++++++++++++++++++"+loggedInUserId);
				generateJavaClass(file,dataPipeline);
				dataPipeline.clear();
                dataPipeline.put("status", "200");
                dataPipeline.put("message", "Service saved successfully.");
                dataPipeline.appLog("JAVA_SERVICE_SAVED", file.getName());

			}else{
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
		} catch (Throwable e) {
			dataPipeline.clear();
			dataPipeline.put("status", "500");
            dataPipeline.put("error", e.getMessage());
            dataPipeline.appLog("SAVE_SERVICE_ERROR", e.getMessage());
			//dataPipeline.logException(e);
			dataPipeline.setResponseStatus(500);
			// throw e;
		}
	}
private static ObjectMapper om=new ObjectMapper();
	public static void generateJavaClass(File file,DataPipeline dataPipeline)throws Exception {
      	dataPipeline.appLog("GENERATING_JAVA_CLASS_OR_SERVICE_FILE",file.getName());
		byte[] data = ServiceUtils.readAllBytes(file);
		String json = new String(data);
		Map<String, Object> jsonMap = ServiceUtils.jsonToMap(json);
		
		String pkg=jsonMap.get("package").toString();
		pkg=new String(Base64.getDecoder().decode(pkg));
      	dataPipeline.appLog("EXTRACTED_PACKAGE_NAME", pkg);
		
		String imports=jsonMap.get("imports").toString();
		imports=new String(Base64.getDecoder().decode(imports));
		
		String className=file.getName().replace(".service", "");
		
		String classDef="public final class "+className+"{";
		
		String mainDef="	public static final void main(DataPipeline dataPipeline) throws SnippetException{";
		
		String mainFunc=jsonMap.get("main").toString();
		mainFunc=new String(Base64.getDecoder().decode(mainFunc));
		
		String mainDefClose="	}";
		
		String staticWorkspace=jsonMap.get("staticWorkspace").toString();
		if(staticWorkspace!=null && staticWorkspace.trim().length()>0)
			staticWorkspace=new String(Base64.getDecoder().decode(staticWorkspace));
		else
			staticWorkspace="";
		
		String classDefClose="}";
		
		//System.out.println("@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
		String fullCode=pkg+"\n"+imports+"\n"+classDef+"\n"+mainDef+"\n"+mainFunc+"\n"+mainDefClose+"\n"+staticWorkspace+"\n"+classDefClose;
      	dataPipeline.appLog("WRITING_JAVA_CLASS_TO_FILE", file.getName());
		//System.out.println(fullCode);
		//System.out.println(className+".service");
		String javaFilePath=file.getAbsolutePath().replace(className+".service", className+".java");
		File javaFile=new File(javaFilePath);
		if (!javaFile.exists()) {
			javaFile.createNewFile();
          	dataPipeline.appLog("JAVA_CLASS_FILE_CREATED",javaFilePath);
		}
		System.out.println(javaFilePath);
		FileOutputStream fos = new FileOutputStream(javaFile);
		fos.write(fullCode.getBytes());
		fos.flush();
		fos.close();
		String fqn=pkg.replace("package ", "").replace(";","")+"."+className+".main";
		ServiceUtils.compileJavaCode(fqn, dataPipeline);
      	dataPipeline.appLog("COMPILED_JAVA_CODE_FOR_CLASS", className);
	}
	
	public static String getLocakedByUser(File file)throws Exception{
		byte[] data = ServiceUtils.readAllBytes(file);
		String json = new String(data);
		Map<String, Object> jsonMap = ServiceUtils.jsonToMap(json);
		if(jsonMap !=null && jsonMap.get("lockedByUser")==null)
			return null;
		return jsonMap.get("lockedByUser").toString();
	}
}