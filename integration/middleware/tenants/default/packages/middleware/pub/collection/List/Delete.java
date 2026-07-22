package packages.middleware.pub.collection.List;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class Delete{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
		List<Map<String,Object>> inputList=dataPipeline.getAsList("docList");
        if(inputList!=null){
          Map<String,Object> deleteDoc=dataPipeline.getAsMap("deleteDoc");
          inputList.remove(deleteDoc);
        }
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}