package packages.Awareness.dashboard.services.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.manager.RAGManager;
public final class createRAG{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
  try{
    String identifier = dataPipeline.getString("identifier");//"https://api.groq.com/openai/v1";
	String directory = dataPipeline.getString("directory");
    String fileNamePattern = dataPipeline.getString("fileNamePattern");
    String ragID = dataPipeline.getString("ragID");
    String ragName = dataPipeline.getString("ragName");
    String EMKey = dataPipeline.getString("EMKey");
	RAGManager.addRAGText(ragID, directory,fileNamePattern, identifier, ragName, null, EMKey);
    //RAGManager.persistNow(dataPipeline.rp.getTenant().getName());
	dataPipeline.put("status","success");
    ServiceUtils.expireServiceCache("packages.Awareness.dashboard.services.api.exportAll");
  }catch(Exception e){
    dataPipeline.clear();
    dataPipeline.put("error",e.getMessage());
    dataPipeline.put("status","failed");
    e.printStackTrace();
    //new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}