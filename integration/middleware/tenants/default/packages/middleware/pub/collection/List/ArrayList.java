package packages.middleware.pub.collection.List;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.*;
public final class ArrayList{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            java.util.ArrayList<Object> arrayList = new java.util.ArrayList<Object>();
            dataPipeline.put("arrayList", arrayList);
            
        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}