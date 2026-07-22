package packages.middleware.pub.util;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.pub.util.ApiServiceJsonSchema;
import com.eka.middleware.pub.util.jsonschema.JsonEntity;
import java.util.Map;
public final class SyncloopIOtoSchema{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
Map<String,Object> map = dataPipeline.getAsMap("*payload");
JsonEntity entity = ApiServiceJsonSchema.convert(map.get("json").toString());
dataPipeline.put("schema", entity);
	}

}