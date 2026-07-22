package packages.middleware.pub.server.build.api;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.io.IOUtils;
import com.eka.middleware.service.PropertyManager;

import com.eka.middleware.service.ServiceUtils;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.*;
import java.util.zip.ZipOutputStream;
import org.apache.commons.io.FileUtils;
import com.eka.middleware.template.MultiPart;
public final class createBuild{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
            //byte[] body=dataPipeline.getBody();
            //String json=new String(body);
            //String contentType=((String[])dataPipeline.getHeaders().get("Content-Type"))[0];
  			dataPipeline.appLog("OPERATION", "createBuild");
            List<Map<String,String>> artifacts=dataPipeline.getAsList("*payload");
  			dataPipeline.appLog("ARTIFACTS_COUNT", String.valueOf(artifacts.size()));
            String buildName=dataPipeline.getString("buildName");
  			dataPipeline.appLog("EXTRACTED_BUILD_NAME", buildName);
            Boolean includeDependencies=("true".equals(dataPipeline.getString("includeDependencies")));
  			dataPipeline.appLog("INCLUDED_DEPENDENCIES", String.valueOf(includeDependencies));
            Boolean includeGlobalProperties=("true".equals(dataPipeline.getString("includeGlobalProperties")));
  			dataPipeline.appLog("INCLUDED_GLOBAL_PROPERTIES", String.valueOf(includeGlobalProperties));
            Boolean includeLocalProperties=("true".equals(dataPipeline.getString("includeLocalProperties")));
  			dataPipeline.appLog("INCLUDED_LOCAL_PROPERTIES", String.valueOf(includeLocalProperties));
            Boolean includeEndpoints=("true".equals(dataPipeline.getString("includeEndpoints")));
  			dataPipeline.appLog("INCLUDED_ENDPOINTS", String.valueOf(includeEndpoints));
  
            String packagePath=PropertyManager.getPackagePath(dataPipeline.rp.getTenant());
  			dataPipeline.appLog("EXTRACTED_PACKAGE_PATH", packagePath);
            String buildsDirPath=packagePath+"builds/export/";
  			dataPipeline.appLog("BUILDS_DIRECTORY_PATH", buildsDirPath);
            String newBuildPath=buildsDirPath+buildName+"/";
  			dataPipeline.appLog("NEW_BUILD_PATH", newBuildPath);
            File newBuild=new File(newBuildPath);
  			dataPipeline.appLog("NEW_BUILD_EXISTS", String.valueOf(newBuild.exists()));
            Properties prop=new Properties();
  			dataPipeline.appLog("PROPERTIES_CREATED", "New Properties object created");
            if(newBuild.exists()){
                dataPipeline.put("msg","build already exists with the name '"+buildName+"'. Please try another name.");
  				dataPipeline.appLog("BUILD_DIRECTORY_CHECK", "Build directory already exist: " + buildName);
            }
            else{
                newBuild.mkdirs();
              	dataPipeline.appLog("BUILD_DIRECTORY_CHECK", "Build directory created: " + newBuildPath);
              
                for (Map<String,String> artifact : artifacts) {
                    File deployableAsset=new File(packagePath+artifact.get("asset")+"."+artifact.get("type"));
                    File deployableAssetJava=new File(packagePath+artifact.get("asset")+".java");
                    File deployableClass=new File(packagePath+artifact.get("asset")+".class");
                    File deployableGPAsset=null;//new File(packagePath+artifact.get("asset")+"."+artifact.get("type"));
                    File deployableLPAsset=null;//new File(packagePath+artifact.get("asset")+".java");
                  	dataPipeline.appLog("ARTIFACT_PROCESSING", "Processing artifact");

                    if(includeGlobalProperties) {
                        //deployableGPAsset=new File(packagePath+artifact.get("asset")+"."+artifact.get("type"));
                    }

                    // if(includeEndpoints!=null && includeEndpoints){
                    String fqn=artifact.get("asset").replace("/",".")+".main";
                    dataPipeline.map("fqn",fqn);
                  	dataPipeline.appLog("MAPPING_FQN", "Mapped 'fqn'");
                    dataPipeline.apply("packages.middleware.pub.server.browse.getURLAlias");
                    String alias=dataPipeline.getString("alias");
                  	dataPipeline.appLog("EXTRACTED_URL_ALIAS", "Obtained 'alias': " + alias);
                    dataPipeline.drop("alias");
                    dataPipeline.drop("fqn");
                    if(alias!=null)
                        prop.put(alias,fqn);
                  System.out.println(prop);
                    //  }
                    if(deployableAsset.exists() && deployableAsset.isFile()){
                        File toFile=new File(newBuildPath+artifact.get("asset")+"."+artifact.get("type"));
                        toFile.getParentFile().mkdirs();
                        toFile.createNewFile();
                        FileInputStream from=new FileInputStream(deployableAsset);
                        FileOutputStream to=new FileOutputStream(toFile);
                        IOUtils.copy(from, to);
                      	dataPipeline.appLog("FILE_COPY", "Copied " + deployableAsset.getName() + " to " + toFile.getName());
                        to.flush();
                        to.close();
                        from.close();

                        if(deployableAssetJava.exists()) {
                            toFile=new File(newBuildPath+artifact.get("asset")+".java");
                            toFile.getParentFile().mkdirs();
                            toFile.createNewFile();
                            from=new FileInputStream(deployableAssetJava);
                            to=new FileOutputStream(toFile);
                            IOUtils.copy(from, to);
                          	dataPipeline.appLog("FILE_COPY", "Copied " + deployableAsset.getName() + " to " + toFile.getName());
                            to.flush();
                            to.close();
                            from.close();
                        }
                        if(deployableClass.exists()) {
                            toFile=new File(newBuildPath+artifact.get("asset")+".class");
                            toFile.getParentFile().mkdirs();
                            toFile.createNewFile();
                            from=new FileInputStream(deployableClass);
                            to=new FileOutputStream(toFile);
                            IOUtils.copy(from, to);
                          	dataPipeline.appLog("FILE_COPY", "Copied " + deployableAsset.getName() + " to " + toFile.getName());
                            to.flush();
                            to.close();
                            from.close();
                        }
                    }
                }
                //Add urlAliased to deploymentset
                if(prop.size()>0){
                    File deployableURLAlias=new File(newBuildPath+"URLAlias_"+buildName+".properties");
                  	dataPipeline.appLog("EXTRACTED_DEPLOYABLE_URL_ALIAS",deployableURLAlias.getAbsolutePath());
                    deployableURLAlias.createNewFile();
                    FileOutputStream urlAliasFos=new FileOutputStream(deployableURLAlias);
                    prop.store(urlAliasFos, "Deployable urls added to build:"+buildName);
                  	dataPipeline.appLog("URL_ALIAS_CREATED", "Deployable URL Alias file has been created for build");
                    urlAliasFos.flush();
                    urlAliasFos.close();
                }
                //String sourceFile = "zipTest";
                FileOutputStream fos = new FileOutputStream(buildsDirPath+buildName+".zip");
                ZipOutputStream zipOut = new ZipOutputStream(fos);
                File fileToZip = new File(newBuildPath);
                ServiceUtils.zipFile(fileToZip, fileToZip.getName(), zipOut);
                zipOut.flush();
                zipOut.close();
                fos.flush();
                fos.close();
              	dataPipeline.appLog("ZIP_CREATED", "ZIP file has been created for build");
				dataPipeline.appLog("ZIP_PATH", buildsDirPath+buildName + ".zip");
                //dataPipeline.log(fileToZip.getAbsolutePath());
                FileUtils.deleteDirectory(fileToZip);
              	dataPipeline.appLog("DIRECTORY_DELETED", "Successfully deleted the directory: " + fileToZip.getAbsolutePath());
                //new MultiPart(dataPipeline, new File(buildsDirPath+buildName+".zip"));
                dataPipeline.clear();
                dataPipeline.put("url","/files/builds/export/"+buildName+".zip");
                dataPipeline.put("path",buildsDirPath+buildName+".zip");
                dataPipeline.put("status","200");
                dataPipeline.put("msg","Success");
              	dataPipeline.appLog("STATUS", "Operation completed successfully");
            }
            //dataPipeline.clear();

        }catch(Exception e){
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
  			dataPipeline.appLog("SERVICE_ERROR",e.getMessage());
            dataPipeline.setResponseStatus(500);
  			dataPipeline.put("status","500");
            new SnippetException(dataPipeline,"Failed while creating build", new Exception(e));
        }
	}

}