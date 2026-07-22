package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import javax.json.Json;
import javax.json.JsonArray;
import javax.json.JsonArrayBuilder;
import javax.json.JsonObject;
import javax.json.JsonObjectBuilder;
import javax.json.JsonReader;
import javax.json.JsonValue;
import java.io.FileReader;
import java.io.IOException;
import java.io.StringReader;
public final class CleanServiceJSON{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	String servicePath=dataPipeline.getString("servicePath");
	FileReader fileReader =null;
	JsonReader jsonReader =null;
	try{
        fileReader = new FileReader(servicePath);
        jsonReader = Json.createReader(fileReader);
        JsonValue jsonValue = jsonReader.read();
        JsonValue updatedJsonValue = removeAttrIdRecursive(jsonValue);
        dataPipeline.put("cleanedServiceJSON",updatedJsonValue.toString());
    }catch(Exception e){
    }finally{
    	jsonReader.close();
      	try{
          fileReader.close();
        }catch(Exception e1){}
    }
	
	}
private static JsonValue removeAttrIdRecursive(JsonValue jsonValue) {
        switch (jsonValue.getValueType()) {
            case OBJECT:
                JsonObject jsonObject = jsonValue.asJsonObject();
                JsonObjectBuilder objectBuilder = Json.createObjectBuilder();

                for (String key : jsonObject.keySet()) {
                    if (   !key.equals("a_attr") 
                        && !key.equals("id")
                        && !key.equals("state")
                        && !key.equals("li_attr")
                        && !key.equals("lines")
                        && !key.equals("guid" )) {
                        objectBuilder.add(key, removeAttrIdRecursive(jsonObject.get(key)));
                    }
                }

                return objectBuilder.build();

            case ARRAY:
                JsonArray jsonArray = jsonValue.asJsonArray();
                JsonArrayBuilder arrayBuilder = Json.createArrayBuilder();

                for (JsonValue value : jsonArray) {
                    arrayBuilder.add(removeAttrIdRecursive(value));
                }

                return arrayBuilder.build();

            default:
                return jsonValue;
        }
    }
}