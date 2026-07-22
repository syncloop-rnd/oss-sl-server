package packages.middleware.pub.string;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class maskString{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
    dataPipeline.appLog("OPERATION", "maskString");
    String confidential_string = dataPipeline.getString("confidential_string");
    dataPipeline.appLog("CONFIDENTIAL_STRING", "Confidential String: " + confidential_string);
    if (confidential_string.length() == 0) {
      dataPipeline.put("secured_string", "xxx");
      dataPipeline.appLog("RESULT", "String is empty, secured string: xxx");
      return ;
    }
    if (confidential_string.length() > 3) {
      StringBuilder sb = new StringBuilder();
            for (int i = 0 ; i < confidential_string.length() ; i++) {
                sb.append("*");
                dataPipeline.appLog("APPEND_STAR", "Appending '*' to string: " + sb.toString());
            }

        dataPipeline.put("secured_string", confidential_string.substring(0 , 3) + sb);
        dataPipeline.appLog("RESULT", "Secured string: " + confidential_string.substring(0 , 3) + sb);
    } else {
        dataPipeline.put("secured_string", confidential_string);
        dataPipeline.appLog("RESULT", "Secured string: " + confidential_string);
    }

	}

}