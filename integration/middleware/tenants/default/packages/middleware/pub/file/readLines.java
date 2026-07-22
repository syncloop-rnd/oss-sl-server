package packages.middleware.pub.file;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.io.BufferedReader;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;
public final class readLines{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
		BufferedReader bufferedReader=(BufferedReader)dataPipeline.get("bufferedReader");
		Integer number=dataPipeline.getInteger("number");
        List<String> lines=new ArrayList<String>();
  		String regex=dataPipeline.getString("regex");
        Pattern ptrn = null;
  		if(regex!=null)
  			ptrn=Pattern.compile(regex);
  		if(ptrn!=null && number==-1){
  			final Pattern pattern=ptrn;
          	Stream<String> linesStream = bufferedReader.lines();
          	lines=linesStream.parallel().filter(a -> pattern.matcher(a).find()).collect(Collectors.toList());
        }else{
          String line=null;
          while(number-->0 && (line=bufferedReader.readLine())!=null){
            if(ptrn!=null){
              if(ptrn.matcher(line).find())
                lines.add(line);
            }else
              lines.add(line);
          }
        }
        if(lines.size()==0)
        	dataPipeline.put("lines",null);
  		else
        	dataPipeline.put("lines",lines.toArray(new String[lines.size()]));
  } catch (Exception e) {
  e.printStackTrace();
		dataPipeline.clear();
  		dataPipeline.put("error",e.getMessage());
    	throw new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
  }
	}

}