package packages.Awareness.examples;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import agents.core.tools.service.AgentToolsService;
import com.beust.jcommander.internal.Sets;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.template.SnippetException;

import java.util.Set;
import java.util.UUID;
public final class Test{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

            Set<UUID> uuids = Sets.newHashSet();
            uuids.add(UUID.fromString("29e37d62-eff1-4f9e-95ee-7cb12b123c61"));

            new AgentToolsService(dataPipeline).linkManager(UUID.fromString("81834f59-d7a8-4485-b07e-8621cf3ecd62"), uuids);
        } catch (Exception e) {
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            dataPipeline.put("status","failed");
            new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}

}