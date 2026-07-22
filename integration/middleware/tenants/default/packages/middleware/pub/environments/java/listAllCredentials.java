package packages.middleware.pub.environments.java;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.pub.entity.Credentials;
import com.eka.middleware.pub.entity.CredentialsType;
import com.eka.middleware.pub.entity.CredentialsMeta;
import com.eka.middleware.pub.service.CredentialsService;
import com.eka.middleware.pub.service.CredentialsMetaService;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;			
public final class listAllCredentials{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

    CredentialsService credService =
            new CredentialsService();

    CredentialsMetaService metaService =
            new CredentialsMetaService();

    List<Credentials> allCreds =
            credService.list(1, 1000);

   

    List<Map<String, Object>> resultList =
            new ArrayList<>();

    for (Credentials cred : allCreds) {

        Map<String, Object> credMap =
                new HashMap<>();

        credMap.put("id", cred.getId());
        credMap.put("name", cred.getName());

        String typeStr =
                cred.getType() != null
                        ? cred.getType().name()
                        : "UNKNOWN";

        credMap.put("type", typeStr);

        credMap.put("api_username", cred.getUsername());

        credMap.put("api_password", cred.getPassword());

        List<CredentialsMeta> metas =
                metaService.listByCredentialId(
                        cred.getId()
                );

        if (metas != null && !metas.isEmpty()) {

            Map<String, String> metaMap =
                    new HashMap<>();

            for (CredentialsMeta meta : metas) {

                metaMap.put(
                        meta.getObjectKey(),
                        meta.getObjectValue()
                );
            }

            credMap.put("meta", metaMap);
        }

        resultList.add(credMap);
    }

    dataPipeline.put("credentialsList", resultList);

    dataPipeline.put("total_rows", resultList.size());

    dataPipeline.put("success", true);

} catch (Exception e) {

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