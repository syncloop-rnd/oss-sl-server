package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.PropertyManager;
import com.eka.middleware.template.SnippetException;

import java.io.File;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
public final class DeleteSnapshot{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
  			dataPipeline.appLog("OPERATION", "deleteSnapshots");
  
            String fqn = dataPipeline.getAsString("fqn");
            String snapFolder = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "snapshots/" + fqn + ".main@0";
            List<String> snap = dataPipeline.getAsList("snaps");
            Set<String> snaps = snap.stream().collect(Collectors.toSet());
            File directory = new File(snapFolder);
            boolean status = false;
            if (directory.exists() && directory.isDirectory()){
                File[] files = directory.listFiles();
                for (File file : files) {
                    if (snaps.contains(file.getName())) {
                        if (file.delete()) {
                            status = true;
                          	dataPipeline.appLog("SNAPSHOT_DELETED", "Deleted snapshot: " + file.getName());
                        }
                    }
                }
            }
  		  if (!status) {
              dataPipeline.setResponseStatus(404);
              dataPipeline.put("status","404");
              dataPipeline.put("error","No snapshots found to delete.");
          }else{
            dataPipeline.put("status", "200");
            dataPipeline.put("message","Snapshots deleted successfully.");
           }
          
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("status", "500");
            dataPipeline.put("error", e.getMessage());
            dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
            dataPipeline.setResponseStatus(500);
            throw new SnippetException(dataPipeline,"Snippet exception", e);
        }
	}

}