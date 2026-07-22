package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.service.PropertyManager;
import java.io.File;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
public final class DeleteTest{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    dataPipeline.appLog("OPERATION", "deleteTestCases");

    String fqn = dataPipeline.getAsString("fqn");
    String testFolder = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "test_cases/" + fqn;
    List<String> testList = dataPipeline.getAsList("test");

    File directory = new File(testFolder);
    boolean status = false;

    if (directory.exists() && directory.isDirectory()) {
        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (testList.contains(file.getName())) {
                    if (file.delete()) {
                        status = true;
                        dataPipeline.appLog("TEST_CASE_DELETED", "Deleted test case: " + file.getName());
                    } else {
                        status = false;
                        dataPipeline.appLog("DELETE_FAILED", "Failed to delete test case: " + file.getName());
                    }
                }
            }
        }
    } else {
        dataPipeline.appLog("DIRECTORY_NOT_FOUND", "Test cases directory does not exist: " + testFolder);
        dataPipeline.put("status", "404");
        dataPipeline.put("message", "Test cases directory not found.");
        dataPipeline.setResponseStatus(404);
        return;
    }

    dataPipeline.put("status", status ? "200" : "404");
    dataPipeline.put("message", status ? "Test cases deleted successfully." : "No matching test cases found to delete.");

    if (!status) {
        dataPipeline.setResponseStatus(404); 
    }
} catch (Exception e) {
    dataPipeline.clear();
    dataPipeline.put("status", "500");
    dataPipeline.put("error", e.getMessage());
    dataPipeline.appLog("SERVICE_ERROR", e.getMessage());
    dataPipeline.setResponseStatus(500);
    throw new SnippetException(dataPipeline, "Failed while deleting test cases", e);
}

	}

}