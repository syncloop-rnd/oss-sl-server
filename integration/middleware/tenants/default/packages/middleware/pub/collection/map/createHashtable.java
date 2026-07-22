package packages.middleware.pub.collection.map;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

import java.util.Hashtable;
import java.util.Map;
public final class createHashtable{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {
            
            Map<String, Object> map = new Hashtable<>();
            dataPipeline.put("hashtable", map);
            
        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}