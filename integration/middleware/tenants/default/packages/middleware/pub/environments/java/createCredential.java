package packages.middleware.pub.environments.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.pub.entity.Credentials;
import com.eka.middleware.pub.entity.CredentialsType;
import com.eka.middleware.pub.service.CredentialsService;
import com.eka.middleware.pub.entity.CredentialsMeta;
import com.eka.middleware.pub.service.CredentialsMetaService;
import java.util.List;
import java.util.Map;
public final class createCredential{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            String name = dataPipeline.getString("name");
            String typeValue = dataPipeline.getString("type");
            String api_username = dataPipeline.getString("api_username");
            String api_password = dataPipeline.getString("api_password");
            
            Object metaObj = dataPipeline.get("meta");

            if (name == null || name.trim().isEmpty()) {
                throw new Exception("name is required");
            }

            if (typeValue == null || typeValue.trim().isEmpty()) {
                throw new Exception("type is required");
            }

            CredentialsType type;
            try {
                type = CredentialsType.valueOf(typeValue.trim().toUpperCase());
            } catch (Exception e) {
                throw new Exception("Invalid type. Allowed values: BASIC, AWS, BEARER");
            }

            if (metaObj != null && metaObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> metaList = (List<Map<String, Object>>) metaObj;
                
                for (Map<String, Object> metaItem : metaList) {
                    if (metaItem != null) {
                        String key = (String) metaItem.get("key");
                        String value = (String) metaItem.get("value");
                        
                        if (key == null || key.trim().isEmpty() || value == null || value.trim().isEmpty()) {
                            throw new Exception("All meta keys and values must be filled. Found an empty field.");
                        }
                    }
                }
            }

            if (api_username == null || api_username.trim().isEmpty()) {
                api_username = "N/A";
            }
            if (api_password == null || api_password.trim().isEmpty()) {
                api_password = "N/A";
            }

            Credentials credentials = new Credentials();
            credentials.setName(name);
            credentials.setType(type);
            credentials.setUsername(api_username);
            credentials.setPassword(api_password);

            CredentialsService service = new CredentialsService();
            Credentials createdCredentials = service.create(credentials);

            int metaRowsAdded = 0;
            
            if (metaObj != null && metaObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> metaList = (List<Map<String, Object>>) metaObj;
                CredentialsMetaService metaService = new CredentialsMetaService();
                
                for (Map<String, Object> metaItem : metaList) {
                    if (metaItem != null) {
                        String key = (String) metaItem.get("key");
                        String value = (String) metaItem.get("value");
                        
                        CredentialsMeta meta = new CredentialsMeta();
                        meta.setCredentialId(createdCredentials.getId());
                        meta.setObjectKey(key);
                        meta.setObjectValue(value);
                        
                        metaService.create(meta);
                        metaRowsAdded++;
                    }
                }
            }

            dataPipeline.put("id", createdCredentials.getId());
            dataPipeline.put("rows", 1);
            dataPipeline.put("meta_rows_added", metaRowsAdded);
            dataPipeline.put("success", true);
   
        } catch (Exception e) {

            dataPipeline.put("rows", 0);
            dataPipeline.put("success", false);
            dataPipeline.put("error", e.getMessage());

            throw new SnippetException(
                dataPipeline,
                e.getMessage(),
                e
            );
        }
	}

}