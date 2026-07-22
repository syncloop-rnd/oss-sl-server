package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;
public final class concate{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
			dataPipeline.appLog("OPERATION", "concate");
            String str1 = dataPipeline.getString("str1");
  			dataPipeline.appLog("STRING1", str1);
            String str2 = dataPipeline.getString("str2");
  			dataPipeline.appLog("STRING2", str2);

            dataPipeline.put("result", String.format("%s%s", str1, str2));
  			dataPipeline.appLog("COMPARISON_RESULT", "Comparison result: " + String.format("%s%s", str1, str2));

        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            new SnippetException(dataPipeline,"SnippetException exception", e);
        }
	}

}