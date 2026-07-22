package packages.middleware.pub.json;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.Map;
import org.apache.commons.lang3.StringUtils;
public final class fromJson{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{
            String jsonString = dataPipeline.getString("jsonString");
            String rootName = dataPipeline.getString("rootName");
            if (StringUtils.isBlank(rootName)) {
                rootName = "jsonDoc";
            }
            Map<String,Object> map = ServiceUtils.jsonToMap("{\"" + rootName + "\":"+jsonString+"}");
            dataPipeline.put("output",map);
        }catch(Exception e){
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}

}