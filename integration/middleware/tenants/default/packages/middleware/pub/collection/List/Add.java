package packages.middleware.pub.collection.List;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
public final class Add{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
		List<Object> inputList=dataPipeline.getAsList("docList");
        if(inputList==null)
          inputList=new ArrayList();
        Object inputDoc=dataPipeline.get("addDoc");
  		if(inputDoc!=null)
            inputList.add(inputDoc);
        List<Object> addDocList=dataPipeline.getAsList("addDocList");
        if(addDocList!=null && addDocList.size()>0)
          inputList.addAll(addDocList);
  		dataPipeline.put("docList",inputList);
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception in addDoc service", new Exception(e));
  }
	}

}