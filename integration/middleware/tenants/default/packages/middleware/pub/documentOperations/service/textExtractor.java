package packages.middleware.pub.documentOperations.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.pub.util.document.TextExtractor;
import java.io.IOException; 
public final class textExtractor{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    String inputPath = dataPipeline.getString("inputPath");
    String outputPath = dataPipeline.getString("outputPath");
    
    String finalOutputPath = (outputPath != null && !outputPath.trim().isEmpty())
            ? outputPath
            : inputPath.replaceAll("\\.[^.]+$", "") + ".txt";
    
    String extractedText = TextExtractor.extractText(inputPath);
    TextExtractor.writeToFile(extractedText, finalOutputPath);
    
    dataPipeline.put("status", "success");
} catch (IOException e) {
    dataPipeline.put("status", "failed");
    e.printStackTrace();
}

	}

}