package packages.Awareness.assistant.service;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
public final class execute_action{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try {

    String agentId =
            dataPipeline.getString("agentId");

    String action =
            dataPipeline.getString("action");

    Object arguments =
           
            dataPipeline.get("arguments");

   String result =
        agents.core.agent.Tool.executeAction(
                agentId,
                action,
                null
        );

    dataPipeline.put(
            "result",
            result
    );
  

    dataPipeline.put(
            "status",
            "success"
    );

} catch (Exception e) {

    e.printStackTrace();

    dataPipeline.put(
            "error",
            e.getMessage()
    );

    dataPipeline.put(
            "status",
            "failed"
    );
}
	}

}