package packages.middleware.pub.server.browse;
import java.io.File;
import java.util.regex.Pattern;
import java.sql.Connection;
import graphql.schema.database.generator.*;
import graphql.schema.*;
import java.util.*;
import java.nio.file.Paths;

import com.eka.middleware.adapter.SQL;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.PropertyManager;
import graphql.schema.GraphQLSchema;
public final class saveFile{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            System.out.println("**********************"+dataPipeline.getUrlPath());
  			dataPipeline.appLog("SAVING_FILE_START", "SAVING A FILE - URL Path: " + dataPipeline.getUrlPath());
  			dataPipeline.appLog("OPERATION", "saveFile");
            String location = dataPipeline.getString("fileLocation");
            if (null == location) {
                location = dataPipeline.getUrlPath().split("POST/files/")[1];
            }
            System.out.println("++++++++++++++++++++++++++++++++++++"+location);
  			dataPipeline.appLog("FILE_LOCATION", location);
            String split[] = location.split(Pattern.quote("."));
            String ext = split[split.length - 1];
            location = PropertyManager.getPackagePath(dataPipeline.rp.getTenant())
                    + location;
            dataPipeline.clear();
            dataPipeline.put("Location", location);
            File file = new File(location);
            //System.out.println("Saving "+location);
            if(!file.exists()) {
              	dataPipeline.appLog("NEW_FILE_CREATION",location);
                file.getParentFile().mkdirs();
                file.createNewFile();
            }
            if(location.endsWith(".properties")){
              	dataPipeline.appLog("SAVING_PROPERTIES_FILE", "File ends with '.properties' ");

                byte[] body = (byte[])dataPipeline.get("body");
                if (null != body) {
                    dataPipeline.saveProperties(location,body);
                } else {
                    dataPipeline.saveProperties(location,dataPipeline.getBody());
                }
            } else if(location.endsWith(".jdbc")){
              	com.eka.middleware.service.SafeFileUtil.checkNoSymlink(location);
  				dataPipeline.appLog("SAVING_JDBC_FILE", "File ends with '.jdbc' ");
                dataPipeline.saveJdbc(dataPipeline,file.toPath());
                String JDBC = dataPipeline.getUrlPath().replaceAll("POST/files/", "");
                String pPath=PropertyManager.getPackagePath(dataPipeline.rp.getTenant());
                String connectionPropFile=pPath + JDBC;
                Connection myCon = SQL.getConnection(JDBC.replace("packages", "").replace(".jdbc", ""), dataPipeline);
              
              String assistantAssistant = ServiceUtils.getKeyConnection(connectionPropFile, "middleware.syncloop.enable.assistant");
                String graphqlSchema = ServiceUtils.getKeyConnection(connectionPropFile, "middleware.syncloop.enable.graphql-schema");

              //dataPipeline.rp.getExecutor().submit(() -> {
              	dataPipeline.appLog("CREATING_SCHEMA", "Asynchronously creating schema for JDBC file: " + JDBC);
                		DBSchemaGeneratorV2 dbSchemaGeneratorV2 = new DBSchemaGeneratorV2();
                		if (Boolean.valueOf(graphqlSchema)) {
                          dbSchemaGeneratorV2.createSchema(myCon, connectionPropFile);
                        }
                        
                      try {
                      if (Boolean.valueOf(assistantAssistant)) {
                        String schema = dbSchemaGeneratorV2.getQuery().toString();
                       String assistantId = ServiceUtils.getKeyConnection(connectionPropFile, "middleware.syncloop.gpt.assistant.sqlservice.id");
                        
                       HashMap<String, Object> instructionsMap = new HashMap<>();
                       instructionsMap.put("instructions", "All requests come for generate sql statements and map input & output variables. database Scheme will also be provided.          Allowed data types for input & output       string   integer   number   boolean   date      Follow the database version : MySQL 8+      response JSON structure.      {       \"success\": //this is a required field & value is boolean if nothing will found set false or set true if anything founds       \"no_query\": {} // add all non resolved parameters in it       \"match_score\": //this is a required field & put the score in precentage how much        \"input\": //This is a required string field which has all input parameters to query in the KEY-Value pair format separated by '|' operator & another KEY-VALUE pair is separated by '#' character like  'PARAMETER_NAME_1|DATA_TYPE#PARAMETER_NAME_2|DATA_TYPE'       \"output\": //This is a required string field which has all output parameters from query in the KEY-Value pair format separated by '|' operator & another KEY-VALUE pair is separated by '#' character like  'PARAMETER_NAME_1|DATA_TYPE#PARAMETER_NAME_2|DATA_TYPE'. The sequence of parameters should be exactly same the parameters in the query for SELECT statement.       \"sql\": //This is a required field which has actual SQL query & for input variables should be mapped with bracket in single quotes i.e. '{PARAMETER_NAME_1}' & for null Just use NULL.        }      Sample Expecting response    {     \"success\": true,     \"no_query\": {},     \"match_score\": 100,     \"input\": 'startDate|date#endDate|date',     \"output\": 'id|integer#name|string#status|boolean',     \"sql\": \"SELECT O.id, O.name, O.status FROM ORDERS O WHERE O.ORDERED_ON BETWEEN '{startDate}' AND '{endDate}'\"   }      * Respond only expected JSON as output. This is database structure " + schema);
                       instructionsMap.put("name", String.format("Syncloop SQL Assistant - Connector[%s]", 
                                                                 Paths.get(connectionPropFile).getFileName().toString()));
                       instructionsMap.put("model", "gpt-4-turbo");
                       
                       HashMap<String, Object> jsonObj = new HashMap<>();
                        jsonObj.put("type", "json_object");
                        
                       instructionsMap.put("response_format", jsonObj);
                        
                       dataPipeline.putGlobal("assistant_id", assistantId);
                       dataPipeline.putGlobal("*payload", instructionsMap);
                       dataPipeline.apply("packages.middleware.pub.syncloopGPT.create_assistant");
                       Map<String, Object> response = (Map<String, Object>) dataPipeline.get("response");

                      assistantId = (String) response.get("id");
                      ServiceUtils.saveOrUpdateKeyInConnection(connectionPropFile, "middleware.syncloop.gpt.assistant.sqlservice.id", assistantId);
                        
                      }
                      } catch (Throwable e) {
                         dataPipeline.put("error", e.getMessage());
                         e.printStackTrace();
                      }
             // });
              
                

            }else{
                java.nio.file.Files.write(file.toPath(), dataPipeline.getBody());
			}
            //System.out.println("++++++++++++++++++++++++++++++++++++"+location);
  			dataPipeline.appLog("FILE_SAVED_AT_LOCATION",location);
            dataPipeline.clear();
            dataPipeline.put("status", "Saved");
  			ServiceUtils.expireServiceCache("packages.middleware.pub.server.browse.getPackagesAsTree");

        } catch (Throwable e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
          	dataPipeline.appLog("FILE_SAVING_ERROR",e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.put("status", "Not Modified");
            new SnippetException(dataPipeline,"Failed while saving file", new Exception(e));
        }
	}


}