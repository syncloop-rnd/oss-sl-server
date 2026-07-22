package packages.middleware.pub.collection.map;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;

public final class HashMap{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            
            java.util.Map map = new java.util.HashMap();
            dataPipeline.put("hashmap", map);
            
        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}