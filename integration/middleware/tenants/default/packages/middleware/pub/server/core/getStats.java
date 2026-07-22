package packages.middleware.pub.server.core;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.ServiceUtils;
import com.eka.middleware.template.SnippetException;
import com.eka.middleware.system.Telemetry;
import java.util.HashMap;
import java.util.Map;
import com.eka.middleware.distributed.offHeap.IgNode;
public final class getStats{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
boolean resetBaseline=dataPipeline.getAsBoolean("resetBaseline");
Map<String, Object> all = Telemetry.snapshotAll(resetBaseline);
all.put("NODENAME",IgNode.getNODENAME());
dataPipeline.put("stats",all);
	}

}