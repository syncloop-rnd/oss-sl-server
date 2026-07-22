package packages.middleware.pub.environments.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.pub.service.CredentialsService;
import com.eka.middleware.pub.service.CredentialsMetaService;
import com.eka.middleware.pub.entity.Credentials;
import com.eka.middleware.pub.entity.CredentialsMeta;
import com.eka.middleware.pub.entity.CredentialsType;
public final class updateCredential{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

    String credentialIdStr = dataPipeline.getString("credentialId");

    if (credentialIdStr == null || credentialIdStr.trim().isEmpty()) {
        throw new Exception("credentialId is required");
    }

    Long credentialId = Long.parseLong(credentialIdStr.trim());

    String name = dataPipeline.getString("name");
    if (name == null || name.trim().isEmpty()) {
        throw new Exception("name is required");
    }

    String username = dataPipeline.getString("username");
    if (username == null || username.trim().isEmpty()) {
        username = "-";
    }

    String password = dataPipeline.getString("password");
    if (password == null || password.trim().isEmpty()) {
        password = "-";
    }

    String typeValue = dataPipeline.getString("type");
    if (typeValue == null || typeValue.trim().isEmpty()) {
        throw new Exception("type is required");
    }

    CredentialsType type;

 try {
    type = CredentialsType.valueOf(typeValue.trim().toUpperCase());
} 
  catch (Exception e) {
    throw new Exception("Invalid type. Allowed values: BASIC, AWS, BEARER, API KEY");
}

Object metadataObj = dataPipeline.get("metadata");
  
CredentialsService credentialsService = new CredentialsService();
CredentialsMetaService metaService = new CredentialsMetaService();
Credentials existing = credentialsService.getById(credentialId);

if (existing == null) {
        throw new Exception("Credential not found for id: " + credentialId);
    }

    /*
     * Validate metadata before doing any DB update/delete.
     * This prevents partial update. If any ob_key / ob_val is blank,
     * old metadata remains unchanged and no new metadata is inserted.
     */
 java.util.List<java.util.Map<String, String>> validatedMetadataList =
            new java.util.ArrayList<java.util.Map<String, String>>();

    if (!"BASIC".equalsIgnoreCase(typeValue.trim())) {

        if (metadataObj != null && metadataObj instanceof java.util.List) {

            java.util.List<?> metadataList =
                    (java.util.List<?>) metadataObj;

            int index = 0;

            for (Object itemObj : metadataList) {

                index++;

                if (itemObj == null || !(itemObj instanceof java.util.Map)) {
                    throw new Exception("Invalid metadata item at position " + index);
                }

                java.util.Map<?, ?> item =
                        (java.util.Map<?, ?>) itemObj;

                Object keyObj = item.get("ob_key");
                Object valueObj = item.get("ob_val");

                if (valueObj == null) {
                    valueObj = item.get("ob_value");
                }

                if (keyObj == null || keyObj.toString().trim().isEmpty()) {
                    throw new Exception("ob_key cannot be empty at metadata position " + index);
                }

                if (valueObj == null || valueObj.toString().trim().isEmpty()) {
                    throw new Exception("ob_val cannot be empty at metadata position " + index);
                }

                java.util.Map<String, String> validItem =
                        new java.util.HashMap<String, String>();

                validItem.put("ob_key", keyObj.toString().trim());
                validItem.put("ob_val", valueObj.toString().trim());

                validatedMetadataList.add(validItem);
            }
        }
    }

    /*
     * DB update starts only after all validations are successful.
     */
    existing.setName(name.trim());
    existing.setUsername(username.trim());
    existing.setPassword(password.trim());
    existing.setType(type);

Credentials updated = credentialsService.update(existing);
int metaRowsUpdated = 0;

    /*
     * Delete old metadata only after metadata validation has passed.
     */
    metaRowsUpdated = metaService.deleteByCredentialId(credentialId);

    /*
     * BASIC does not require metadata.
     * For AWS / BEARER, insert fresh metadata rows.
     */
    if (!"BASIC".equalsIgnoreCase(typeValue.trim())) {

        for (java.util.Map<String, String> item : validatedMetadataList) {

 			CredentialsMeta newMeta = new CredentialsMeta();

            newMeta.setCredentialId(credentialId);
            newMeta.setObjectKey(item.get("ob_key"));
            newMeta.setObjectValue(item.get("ob_val"));

            metaService.create(newMeta);

            metaRowsUpdated++;
        }
    }

    dataPipeline.put("status", true);
    dataPipeline.put("credentialId", updated.getId());
    dataPipeline.put("message", "Credential updated successfully");
    dataPipeline.put("metaRowsUpdated", metaRowsUpdated);

} catch (Exception e) {

    dataPipeline.put("status", false);
    dataPipeline.put("message", e.getMessage());

    throw new com.eka.middleware.template.SnippetException(
            dataPipeline,
            e.getMessage(),
            e);
}
	}

}