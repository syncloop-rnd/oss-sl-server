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
import java.util.Base64;

import com.eka.middleware.server.MiddlewareServer;
public final class saveSql{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try { 
			//System.out.println("**********************"+dataPipeline.getUrlPath());
  			dataPipeline.appLog("OPERATION", "saveSql");
			String location = dataPipeline.getUrlPath().split("POST/sql/")[1];
  			dataPipeline.appLog("EXTRACTED_LOCATION_FROM_URL",location);
			//System.out.println("++++++++++++++++++++++++++++++++++++"+location);
			String split[] = location.split(Pattern.quote("."));
			String ext = split[split.length - 1];
  			String flowRef=location;
			location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant())
					+ location;
			dataPipeline.clear();
  			dataPipeline.appLog("LOCATION", location);
			dataPipeline.put("Location", location);
			File file = new File(location);
  			com.eka.middleware.service.SafeFileUtil.checkNoSymlink(location);
  			AuthAccount authAccount = dataPipeline.getCurrentRuntimeAccount();
			String loggedInUserId = authAccount.getUserId();
			String lockedByUser = null;
			boolean canUpdate=false;
			if(!file.exists()) {
				file.getParentFile().mkdirs();
				file.createNewFile();
              	dataPipeline.appLog("SQL_FILE_CREATED",location);
				canUpdate=true;
			}else{
				lockedByUser = getLocakedByUser(file);
				
				canUpdate=(lockedByUser!=null && lockedByUser.equals(loggedInUserId));
			}
			
			if(canUpdate){
				String json = new String(dataPipeline.getBody());
                //System.out.println("***********"+json);
				Map<String, Object> jsonMap = ServiceUtils.jsonToMap(json);
              	
              	String sqlCode = jsonMap.get("sql").toString();
				byte[] decodedBytes = Base64.getDecoder().decode(sqlCode);
				String decodedString = new String(decodedBytes);
				decodedString = decodedString.trim(); 
				if (!decodedString.endsWith(";")) {
					decodedString += ";";
				}
				//System.out.println("decodedString " + decodedString);
				String encodedString = Base64.getEncoder().encodeToString(decodedString.getBytes());
				jsonMap.put("sql", encodedString); 
              
				jsonMap.put("lockedByUser",loggedInUserId);
              	dataPipeline.appLog("RESOURCE_LOCKED_BY_CURRENT_USER",lockedByUser);
				java.nio.file.Files.write(file.toPath(), ServiceUtils.toPrettyJson(jsonMap).getBytes());
				//System.out.println("++++++++++++++++++++++++++++++++++++"+loggedInUserId);
				generateJavaClass(file,flowRef,dataPipeline);
				dataPipeline.clear();
                dataPipeline.put("status", "200");
                dataPipeline.put("message", "SQL file saved successfully.");
                dataPipeline.appLog("SQL_FILE_SAVED", file.getName());

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
			/*java.nio.file.Files.write(file.toPath(), dataPipeline.getBody());
			System.out.println("++++++++++++++++++++++++++++++++++++"+location);
			dataPipeline.clear();
  			generateJavaClass(file,flowRef,dataPipeline);
			dataPipeline.put("status", "Saved");
  			*/
  			//dataPipeline.log(fullCode);
  			ServiceUtils.expireServiceCache("packages.middleware.pub.server.browse.getPackagesAsTree");
		} catch (Throwable e) {
			dataPipeline.clear();
            dataPipeline.put("status", "500");
            dataPipeline.put("error", e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.appLog("SAVE_SQL_ERROR", e.getMessage());
			new SnippetException(dataPipeline,"Failed while saving file", new Exception(e));
		}
	}
public static void generateJavaClass(File file,String flowRef, DataPipeline dataPipeline)throws Exception {
  	dataPipeline.appLog("GENERATING_JAVA_CLASS_FOR_SQL",file.getName());
	String sqlJavaTemplatePath=MiddlewareServer.getConfigFolderPath()+"sqlJava.template";
    //System.out.println("sqlJavaTemplatePath: "+sqlJavaTemplatePath);
  	String className=file.getName().replace(".sql", "");
  	dataPipeline.appLog("CLASS_NAME", className);
  	//URL url = new URL(sqlJavaTemplatePath);
  	String fullCode="";
  	String pkg=flowRef.replace("/"+file.getName(),"").replace("/",".");
  	dataPipeline.appLog("PKG", pkg);
	List<String> lines = FileUtils.readLines(new File(sqlJavaTemplatePath), "UTF-8");
  	dataPipeline.appLog("LINES", lines.toString());
    for (String line: lines) {
      String codeLine=(line.replace("#flowRef",flowRef).replace("#package",pkg).replace("#className",className));
      fullCode+=codeLine+"\n";
      //dataPipeline.log("\n");
      //dataPipeline.log(codeLine);
    }
  	dataPipeline.log("\n");
  	//return fullCode;
  		
		//System.out.println("@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
		//String fullCode="";//pkg+"\n"+imports+"\n"+classDef+"\n"+mainDef+"\n"+mainFunc+"\n"+mainDefClose+"\n"+classDefClose;
		//System.out.println(fullCode);
		//System.out.println(className+".service");
		String javaFilePath=file.getAbsolutePath().replace(className+".sql", className+".java");
  		dataPipeline.appLog("JAVA_FILE_PATH", javaFilePath);
		File javaFile=new File(javaFilePath);
		if (!javaFile.exists()) {
			javaFile.createNewFile();
          	dataPipeline.appLog("NEW_FILE_CREATION", "File not exist. Creating new file.");
		}
		//System.out.println(javaFilePath);
		FileOutputStream fos = new FileOutputStream(javaFile);
		fos.write(fullCode.getBytes());
		fos.flush();
		fos.close();
		String fqn=pkg.replace("package ", "").replace(";","")+"."+className+".main";
  		dataPipeline.appLog("FQN", fqn);
  		//dataPipeline.log("fqn: "+fqn);
		ServiceUtils.compileJavaCode(fqn, dataPipeline);
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