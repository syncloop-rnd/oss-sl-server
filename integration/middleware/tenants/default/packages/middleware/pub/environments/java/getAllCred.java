package packages.middleware.pub.environments.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import com.eka.middleware.pub.entity.Credentials;
import com.eka.middleware.pub.entity.CredentialsMeta;
import com.eka.middleware.pub.service.CredentialsService;
import com.eka.middleware.pub.service.CredentialsMetaService;
public final class getAllCred{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {
    // 1. Retrieve and validate the credentialId from the pipeline
    String credentialIdStr = dataPipeline.getString("credentialId");
    if (credentialIdStr == null || credentialIdStr.trim().isEmpty()) {     
        throw new Exception("credentialId is required");
    }

    Long credentialId = Long.parseLong(credentialIdStr.trim());

    // 2. Initialize the required services
    com.eka.middleware.pub.service.CredentialsService credentialsService = 
            new com.eka.middleware.pub.service.CredentialsService();
    
    com.eka.middleware.pub.service.CredentialsMetaService metaService = 
            new com.eka.middleware.pub.service.CredentialsMetaService();

    // 3. Fetch the base credential record
    com.eka.middleware.pub.entity.Credentials credential = credentialsService.getById(credentialId);

    if (credential == null) {
        throw new Exception("Credential not found for id: " + credentialId);
    }

    // 4. Fetch the associated metadata
    java.util.List<com.eka.middleware.pub.entity.CredentialsMeta> metaRecords = 
            metaService.listByCredentialId(credentialId);

    // 5. Format the metadata into a list of maps (matching the update structure)
    java.util.List<java.util.Map<String, Object>> metadataOutput = new java.util.ArrayList<>();
    
    if (metaRecords != null && !metaRecords.isEmpty()) {
        for (com.eka.middleware.pub.entity.CredentialsMeta meta : metaRecords) {
            java.util.Map<String, Object> metaMap = new java.util.HashMap<>();
            metaMap.put("ob_key", meta.getObjectKey());
            metaMap.put("ob_val", meta.getObjectValue());
            // Optional: Include the meta ID if you ever need to reference it
            // metaMap.put("metaId", meta.getId()); 
            metadataOutput.add(metaMap);
        }
    }

    // 6. Inject the results back into the Data Pipeline
    dataPipeline.put("status", true);
    dataPipeline.put("message", "Credential retrieved successfully");
    
    // Core credential fields
    dataPipeline.put("id", credential.getId());
    dataPipeline.put("name", credential.getName());
    dataPipeline.put("username", credential.getUsername());
    dataPipeline.put("password", credential.getPassword());
    
    if (credential.getType() != null) {
        dataPipeline.put("type", credential.getType().name());
    } else {
        dataPipeline.put("type", null);
    }
    
    // Metadata list
    dataPipeline.put("metadata", metadataOutput);

} catch (Exception e) {
    // Handle exceptions safely and log to pipeline
    dataPipeline.put("status", false);
    dataPipeline.put("message", e.getMessage());

    throw new com.eka.middleware.template.SnippetException(
            dataPipeline,
            e.getMessage(),
            e);
}
	}

}