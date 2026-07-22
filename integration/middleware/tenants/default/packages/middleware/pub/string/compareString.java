package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class compareString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
	try {
      		dataPipeline.appLog("OPERATION", "compareString");
            String str1 = dataPipeline.getString("str1");
      		dataPipeline.appLog("STRING1", str1);
            String str2 = dataPipeline.getString("str2");
      		dataPipeline.appLog("STRING2", str2);

            dataPipeline.put("result", compareStrings(str1, str2));
      		dataPipeline.appLog("COMPARISON_RESULT", "Comparison result: " + compareStrings(str1, str2));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
      		dataPipeline.appLog("ERROR", e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}
public static int compareStrings(String str1, String str2) {
  		if (str1.length() == str2.length()){
          return 0;
        }
  		else if(str1.length() < str2.length()){
          return -1;
        }
  		else{
          return 1;
   }
}
}