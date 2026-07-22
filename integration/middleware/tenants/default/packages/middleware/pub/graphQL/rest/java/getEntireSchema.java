package packages.middleware.pub.graphQL.rest.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import graphql.API;
public final class getEntireSchema{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
  String fqn=(String) dataPipeline.get("fqn");
  String query=(String) dataPipeline.get("query");
  String schema=API.introspection(fqn,dataPipeline,query);
  dataPipeline.put("gqlSchema",schema);
  } catch (Exception e) {
     e.printStackTrace();
     dataPipeline.clear();
     dataPipeline.put("error", e.getMessage());
     new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
  }
	}

}