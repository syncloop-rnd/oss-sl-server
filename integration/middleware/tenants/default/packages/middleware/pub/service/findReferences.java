package packages.middleware.pub.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.server.ServiceManager;
import com.eka.middleware.service.PropertyManager;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.LinkedHashSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
public final class findReferences{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
            dataPipeline.appLog("OPERATION", "findReference");

            String serviceFqn = dataPipeline.getString("serviceFqn");
            dataPipeline.appLog("SERVICE_FQN", serviceFqn);

            List<String> searchTerms = buildSearchTerms(serviceFqn);
            dataPipeline.appLog("SEARCH_TERMS", searchTerms.toString());

            String packageDirectory = PropertyManager.getPackagePath(dataPipeline.rp.getTenant()) + "packages/";
            File dir = new File(packageDirectory);

            if (!dir.exists() || !dir.isDirectory()) {
                dataPipeline.put("status", "404");
                dataPipeline.put("message", "Package directory not found: " + packageDirectory);
                dataPipeline.setResponseStatus(404);
                return;
            }

            List<Map<String, Object>> tree = parseDirectory(dataPipeline, dir, searchTerms);

            dataPipeline.clear();
            dataPipeline.put("status", "200");
            dataPipeline.put("list", tree);
            dataPipeline.put("referencesNotFound", tree.isEmpty());
        } catch (Exception e) {
            dataPipeline.clear();
            dataPipeline.put("status", "500");
            dataPipeline.put("error", e.getMessage());
            dataPipeline.setResponseStatus(500);
            throw new SnippetException(dataPipeline, "Failed while finding reference", e);
        }
	}
	private static final Set<String> ALLOWED_TYPES = new LinkedHashSet<>(Arrays.asList(
            "service", "map", "doc", "flow", "api", "package", "root", "folder",
            "properties", "jar", "jdbc", "sql", "pem"
    ));

    private static final List<String> SEARCHABLE_EXTENSIONS = Arrays.asList(".flow", ".api", ".properties");

private static int searchStream(DataPipeline dataPipeline, File pathFile, List<String> searchTerms) throws Exception {
        int count = 0;
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new FileInputStream(pathFile), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (searchTerms.isEmpty() || containsAny(line, searchTerms)) {
                    count++;
                }
            }
        }
        return count;
    }

    private static List<Map<String, Object>> parseDirectory(DataPipeline dataPipeline, File dir, List<String> searchTerms) throws Exception {
        List<Map<String, Object>> references = new ArrayList<>();
        File[] list = dir.listFiles();

        if (list == null) {
            return references;
        }

        for (File file : list) {
            if (file.isDirectory()) {
                List<Map<String, Object>> children = parseDirectory(dataPipeline, file, searchTerms);

                if (!children.isEmpty() || searchTerms.isEmpty() || pathContainsAny(file, searchTerms)) {
                    Map<String, Object> node = new HashMap<>();
                    node.put("text", file.getName());
                    node.put("type", "folder");
                    node.put("children", children);
                    references.add(node);
                }
            } else if (isSearchableFile(file)) {
                int count = searchStream(dataPipeline, file, searchTerms);

                if (count > 0) {
                    String fileName = file.getName();
                    String fileType = fileName.substring(fileName.lastIndexOf(".") + 1);

                    if (ALLOWED_TYPES.contains(fileType)) {
                        Map<String, Object> node = new HashMap<>();
                        node.put("text", fileName + " : " + count + " times");
                        node.put("type", fileType);
                        references.add(node);
                    }
                }
            }
        }

        return references;
    }

    private static boolean isSearchableFile(File file) {
        for (String extension : SEARCHABLE_EXTENSIONS) {
            if (file.getName().endsWith(extension)) {
                return true;
            }
        }
        return false;
    }

    private static boolean pathContainsAny(File file, List<String> searchTerms) {
        String slashPath = file.getAbsolutePath().replace('\\', '/');
        String dotPath = slashPath.replace('/', '.');
        return containsAny(slashPath, searchTerms) || containsAny(dotPath, searchTerms);
    }

    private static boolean containsAny(String value, List<String> searchTerms) {
        if (value == null) {
            return false;
        }

        for (String term : searchTerms) {
            if (value.contains(term)) {
                return true;
            }
        }

        return false;
    }

    private static List<String> buildSearchTerms(String serviceFqn) {
        LinkedHashSet<String> terms = new LinkedHashSet<>();

        if (serviceFqn == null || serviceFqn.trim().isEmpty()) {
            return new ArrayList<>(terms);
        }

        String value = serviceFqn.trim();

        while (value.startsWith("/")) {
            value = value.substring(1);
        }

        value = value.replace('\\', '/').replace('/', '.');
        value = stripSuffix(value, ".main");
        value = stripSuffix(value, ".api");
        value = stripSuffix(value, ".flow");
        value = stripSuffix(value, ".properties");

        addVariants(terms, value);

        if (!value.startsWith("packages.")) {
            addVariants(terms, "packages." + value);
        } else {
            addVariants(terms, value.substring("packages.".length()));
        }

        return new ArrayList<>(terms);
    }

    private static void addVariants(Set<String> terms, String value) {
        if (value == null || value.trim().isEmpty()) {
            return;
        }

        String dotValue = value.trim();
        terms.add(dotValue);
        terms.add(dotValue.replace('.', '/'));
        terms.add(dotValue.replace('.', '\\'));
    }

    private static String stripSuffix(String value, String suffix) {
        if (value.endsWith(suffix)) {
            return value.substring(0, value.length() - suffix.length());
        }
        return value;
    }

}