package packages.middleware.pub.file;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.Properties;
import java.io.InputStream;
import com.eka.middleware.service.PropertyManager;
import java.nio.charset.StandardCharsets;
import org.apache.commons.io.IOUtils;
import java.nio.charset.StandardCharsets;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Date;
import java.util.Properties;
import java.util.stream.Collectors;

public final class ServerPropertiesReader{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
        String filePath = PropertyManager.getConfigFolderPath()+"server.properties";
        dataPipeline.put("keyValueFormat", IOUtils.toString(new FileInputStream(filePath), StandardCharsets.UTF_8));
        Properties props = PropertyManager.getServerProperties("server.properties");
        dataPipeline.put("Jsonformat",props);
        saveFile(dataPipeline,filePath);
      
} catch (Exception e) {
        dataPipeline.clear();
        dataPipeline.put("error", e.getMessage());
        throw new SnippetException(dataPipeline, "Snippet exception", new Exception(e));
}

	}
public static void saveFile(DataPipeline dataPipeline, String filePath) throws SnippetException {
    dataPipeline.put("Location", filePath);
    try {
        File file = new File(filePath);
        if (!file.exists()) {
            file.getParentFile().mkdirs();
            file.createNewFile();
        }
        if (filePath.endsWith(".properties")) {
            Properties props = new Properties();
            try (FileInputStream fis = new FileInputStream(file)) {
                props.load(new InputStreamReader(fis, StandardCharsets.UTF_8));
            }
            String key = dataPipeline.getString("key");
            String value = dataPipeline.getString("value");

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(dataPipeline.getBody())));
                 BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {
                String line;
                boolean keyExists = false;
                while ((line = reader.readLine()) != null) {
                    if (line.startsWith("# ")) {
                        String existingKey = line.substring(2);
                        if (existingKey.equals(key)) {
                            keyExists = true;
                            writer.write(line);
                            writer.newLine();
                            continue;
                        }
                    }
                    writer.write(line);
                    writer.newLine();
                }
                if (!keyExists) {
                    writer.write(key + "=" + value);
                    writer.newLine();
                }
            }

        } else {
            java.nio.file.Files.write(file.toPath(), dataPipeline.getBody());
        }
        dataPipeline.put("status", "Saved");
    } catch (IOException e) {
        e.printStackTrace();
        dataPipeline.put("status", "Failed");
        throw new SnippetException(dataPipeline, "Failed while saving file", e);
    }
}

}