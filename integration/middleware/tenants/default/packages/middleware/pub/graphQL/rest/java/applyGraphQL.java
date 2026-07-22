package packages.middleware.pub.graphQL.rest.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
import graphql.API;
public final class applyGraphQL{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  String fqn=(String) dataPipeline.get("fqn");
  String gQuery=(String) dataPipeline.getAsString("gQuery");
  String rootName="";//(String) dataPipeline.get("rootName");
  Map<String,Object> data=(Map<String,Object>)dataPipeline.get("data");
  Map<String,Object> executionResult=new HashMap();
  Set<String> keys = data.keySet();    
  for (String key : keys) {
    rootName=key;
    break;
  }
  if(!fqn.endsWith(".main"))
    fqn=fqn+".main";
  if(gQuery==null){
    executionResult.put("rootObject",data.get(rootName));
    dataPipeline.put("executionResult",executionResult);
  }
  
  Map<String,Object> response=API.applyQuery(gQuery,fqn,dataPipeline,data,rootName);
 if(response!=null){
  	data=(Map<String,Object>)response.get("data");
    if(data!=null && data.get(rootName)!=null){
       executionResult.put("rootObject",data.get(rootName));
       dataPipeline.put("executionResult",executionResult);
    }
    else
       dataPipeline.put("executionResult",response);
  }
   } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
        }
	}

}