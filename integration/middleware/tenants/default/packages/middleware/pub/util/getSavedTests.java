package packages.middleware.pub.util;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import org.apache.commons.io.IOUtils;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.FileTime;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
public final class getSavedTests{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            dataPipeline.appLog("OPERATION", "getLogs");
            String resource=dataPipeline.getAsString("*pathParameters/resource");
            dataPipeline.appLog("EXTRACTED_RESOURCE", resource);
            String name=dataPipeline.getAsString("*pathParameters/id");
            dataPipeline.appLog("EXTRACTED_NAME", name);
            dataPipeline.clear();
            File file = null;
            if(name==null || name.equals("list")){
                file=new File(PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "/test_cases/" + resource);
                String files[]=file.list();
                dataPipeline.put("files",files);
                dataPipeline.appLog("OPERATION", "Listing files in snapshots folder");

                SimpleDateFormat df = new SimpleDateFormat("dd-MM-yyyy HH:mm");

                List<FileDispose> fileDispose = Arrays.stream(null == files ? new String[]{} : files).map(f -> new FileOp(new File(
                                String.format(PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "/test_cases/%s/%s", resource, f)
                        )))
                        .map(m -> {
                            try {
                                m.fileTime = Files.readAttributes(m.file.toPath(), BasicFileAttributes.class).creationTime();
                                return m;
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                            return null;
                        }).filter(f -> null != f).sorted(new Comparator<FileOp>() {
                            @Override
                            public int compare(FileOp o1, FileOp o2) {
                                return o2.fileTime.compareTo(o1.fileTime);
                            }
                        }).map(f -> new FileDispose(f.file.getName(), f.file.getName(), df.format(f.fileTime.toMillis()))).collect(Collectors.toList());

                dataPipeline.put("fileDispose", fileDispose);

            }else{
                if(!name.endsWith("caseName"))
                    name+=".json";
                dataPipeline.appLog("OPERATION", "List .snap files");
                file=new File(PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "/test_cases/" + resource + "/" + name);
                dataPipeline.setBody(file);
            }

        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error", e.getMessage());
            dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            dataPipeline.setResponseStatus(500);
            dataPipeline.put("status", "Not Modified");
            dataPipeline.appLog("SERVICE_STATUS","Not Modified");
            new SnippetException(dataPipeline, "Failed while saving file", new Exception(e));
        }
	}

static public class FileDispose {
        String key;
        String name;

        String time;

        FileDispose(String key, String name, String time) {
            this.key = key;
            this.name = name;
            this.time = time;
        }
        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getTime() {
            return time;
        }

        public void setTime(String time) {
            this.time = time;
        }
    }

    static public class FileOp {

        File file;
        FileTime fileTime;

        public FileOp(File file) {
            this.file = file;
        }
    }
}