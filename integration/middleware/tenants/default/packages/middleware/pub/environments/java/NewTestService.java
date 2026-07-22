package packages.middleware.pub.environments.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.pub.service.CredentialsService;
import com.eka.middleware.pub.service.CredentialsMetaService;
import com.eka.middleware.pub.entity.Credentials;

public final class NewTestService{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

    String credentialIdStr = dataPipeline.getString("credentialId");
    if (credentialIdStr == null || credentialIdStr.trim().isEmpty()) {     
        throw new Exception("credentialId is required");
    }

    Long credentialId = Long.parseLong(credentialIdStr.trim());
    String name = dataPipeline.getString("name");

    String username = dataPipeline.getString("username");
    if (username == null || username.trim().isEmpty()) {
        username = "-";
    }

    String password = dataPipeline.getString("password");
    if (password == null || password.trim().isEmpty()) {
        password = "-";
    }

    String type = dataPipeline.getString("type");
    Object metadataObj = dataPipeline.get("metadata");

    CredentialsService credentialsService = new CredentialsService();

    CredentialsMetaService metaService = new CredentialsMetaService();

    Credentials existing = credentialsService.getById(credentialId);

    if (existing == null) {
        throw new Exception("Credential not found for id: " + credentialId);
    }

    if (name == null || name.trim().isEmpty()) {
        name = existing.getName();
    }

    if (username == null || username.trim().isEmpty()) {
        username = existing.getUsername();
    }

    if (password == null || password.trim().isEmpty()) {
        password = existing.getPassword();
    }

    String typeValue;

    if (type != null && !type.trim().isEmpty()) {
        typeValue = type.trim().toUpperCase();
    } else if (existing.getType() != null) {
        typeValue = existing.getType().name();
    } else {
        throw new Exception("type is required");
    }

    existing.setName(name.trim());
    existing.setUsername(username.trim());
    existing.setPassword(password.trim());
    existing.setType(
            com.eka.middleware.pub.entity.CredentialsType.valueOf(typeValue)
    );

    com.eka.middleware.pub.entity.Credentials updated =
            credentialsService.update(existing);

    int metaRowsUpdated = 0;

    /*
     * Clear old metadata first.
     * This avoids duplicate rows in CREDENTIALS_META for the same credentialId/objectKey.
     */
    metaRowsUpdated = metaService.deleteByCredentialId(credentialId);

    /*
     * BASIC does not require metadata.
     * For AWS / BEARER / other non-BASIC types, insert fresh metadata rows.
     *
     * Expected metadata format:
     *
     * metadata = [
     *   {
     *     "ob_key": "client_sec",
     *     "ob_val": "secret123"
     *   },
     *   {
     *     "ob_key": "client_ID",
     *     "ob_val": "client123"
     *   },
     *   {
     *     "ob_key": "URL",
     *     "ob_val": "https://example.com/"
     *   }
     * ]
     */
    if (!"BASIC".equalsIgnoreCase(typeValue)) {

        if (metadataObj != null && metadataObj instanceof java.util.List) {

            java.util.List<?> metadataList =
                    (java.util.List<?>) metadataObj;

            for (Object itemObj : metadataList) {

                if (itemObj == null || !(itemObj instanceof java.util.Map)) {
                    continue;
                }

                java.util.Map<?, ?> item =
                        (java.util.Map<?, ?>) itemObj;

                Object keyObj = item.get("ob_key");
                Object valueObj = item.get("ob_val");

                if (valueObj == null) {
                    valueObj = item.get("ob_value");
                }

                if (keyObj == null || valueObj == null) {
                    continue;
                }

                String key = keyObj.toString().trim();
                String value = valueObj.toString().trim();

                if (key.isEmpty() || value.isEmpty()) {
                    continue;
                }

                com.eka.middleware.pub.entity.CredentialsMeta newMeta =
                        new com.eka.middleware.pub.entity.CredentialsMeta();

                newMeta.setCredentialId(credentialId);
                newMeta.setObjectKey(key);
                newMeta.setObjectValue(value);

                metaService.create(newMeta);

                metaRowsUpdated++;
            }
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