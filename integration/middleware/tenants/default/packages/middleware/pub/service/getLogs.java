package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.template.SnippetException;

import java.io.File;
import java.nio.file.attribute.FileTime;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.Files;
public final class getLogs{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
dataPipeline.appLog("OPERATION", "getLogs");
        String resource=dataPipeline.getAsString("*pathParameters/resource");
        dataPipeline.appLog("EXTRACTED_RESOURCE", resource);
        String name=dataPipeline.getAsString("*pathParameters/id");
        dataPipeline.appLog("EXTRACTED_NAME", name);
        dataPipeline.clear();
        File file = null;
        if(name==null || name.equals("list")){
            file=new File(PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "/snapshots/" + resource + "@0");
            String files[]=file.list();
            if (null == files) {
                files = new String[]{};
            }
            dataPipeline.put("files",files);
            dataPipeline.appLog("OPERATION", "Listing files in snapshots folder");

            SimpleDateFormat df = new SimpleDateFormat("dd-MM-yyyy HH:mm");

            List<FileDispose> fileDispose = Arrays.stream(files).map(f -> new FileOp(new File(
                            String.format(PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "/snapshots/%s@0/%s", resource, f)
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
            if(!name.endsWith("snap"))
                name+=".snap";
            dataPipeline.appLog("OPERATION", "List .snap files");
            file=new File(PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "/snapshots/" + resource + "@0/" + name);
            dataPipeline.setBody(file);
        }
	}
 static class FileDispose {
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
    
    static class FileOp {

         File file;
         FileTime fileTime;

        public FileOp(File file) {
            this.file = file;
        }
    }
}