package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class compareStrings{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{

try {
		String string1 = dataPipeline.getString("string1");
  		String string2 = dataPipeline.getString("string2");
  
  		boolean equals = string1.equals(string2);
		String result = String.valueOf(equals);
          
  		dataPipeline.put("result",result);
  
  } catch (Exception e) {
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }


	}

}