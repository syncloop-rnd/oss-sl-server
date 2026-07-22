package packages.middleware.pub.collection.map;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
import java.util.List;
import java.util.HashMap;
import org.apache.commons.lang3.StringUtils;
import java.util.Date;
public final class Put{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
		String key = dataPipeline.getString("key");
        String textValue = dataPipeline.getString("textValue");
        Integer integerValue = dataPipeline.getInteger("integerValue");
        Double numberValue = dataPipeline.getAsNumber("numberValue");
        Map docValue = dataPipeline.getAsMap("docValue");
        Date dateValue = dataPipeline.getAsDate("dateValue");
        Boolean booleanValue = dataPipeline.getAsBoolean("booleanValue");
        Object objectArrayValue = dataPipeline.get("objectArrayValue");
        Object byteArrayValueObject = dataPipeline.get("byteArrayValue");
  		List<Map<String, Object>> docArrayValue = (List)dataPipeline.get("docArrayValue");
        byte[] byteArrayValue = null;
        if (null != byteArrayValueObject) {
            byteArrayValue = (byte[]) byteArrayValueObject;
        }
        Map<String,Object> map = dataPipeline.getAsMap("map");
        if (null == map) {
            map = new HashMap<>();
        }

        if (StringUtils.isNotBlank(textValue)) {
            map.put(key, textValue);
        } else if (null != integerValue) {
            map.put(key, integerValue);
        } else if (null != numberValue) {
            map.put(key, textValue);
        } else if (null != docValue) {
            map.put(key, docValue);
        } else if (null != dateValue) {
            map.put(key, dateValue);
        } else if (null != booleanValue) {
            map.put(key, booleanValue);
        } else if (null != objectArrayValue) {
            map.put(key, objectArrayValue);
        } else if (null != byteArrayValue) {
            map.put(key, byteArrayValue);
        } else if (null != docArrayValue) {
            map.put(key, docArrayValue);
        }
        dataPipeline.put("map", map);
} catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}