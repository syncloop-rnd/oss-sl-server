package packages.Awareness.examples;
import agents.core.tools.model.*;
import agents.core.tools.service.AgentToolsService;
import agents.core.tools.service.MCPService;
import agents.core.tools.service.ToolsRegistryService;
import com.eka.middleware.service.DataPipeline;
import com.eka.middleware.service.RuntimePipeline;
import com.eka.middleware.template.SnippetException;
import agents.core.tools.repository.*;

import java.util.UUID;
public final class TestToolManager{
	public static final void main(DataPipeline dataPipeline) throws SnippetException{
try{

            MCP mcp = new MCP();
            mcp.setMcpName("Test Syncloop Echo");
            mcp.setDescription("Test Syncloop Echo");
            mcp.setMcpEndpoint("https://dev-api.syncloop.com/tenant/1769247236756695159/A/mcp");
            mcp.setAuthInfo("{\"auth\":{\"type\":\"API_KEY\",\"config\":{\"api_key\":{\"header_name\":\"Authorization\",\"key\":\"Bearer AgA5nw5zVt+cBLJCitODLDh0WgIkgvlY3MGmN+sw3t9P7emWFM7MkIPot/KByIgRozQdvOuNPvGH0ikrsw26febsuo9q2muuXFV2fJNq6LUiBBiCRo8Ci7eW6rJX5dhJOtiFsD6u5m2rPqWEU97ihoAFEHTe2T4Bo2f5+Nh/BLwl33CknCJvjOYZT3d5pRuRNWyNKTnlgwzaaMelJBoQaWT80+Ob+yJCMsBmahOA9JzeCoPFGu/qWFDlPXiBvoOdBf9fa1EFqXCbS2aNVk0ZqVK/zvNu1zQD4pLEnuYbNGv7+0npW9bivENqZrS0h8X3klIe1s0jw/TprxXWszDSuKglC8c7QXuzD0GiK0/1in+KukxXIqUjgQP/33bcqzoSok+dy9bs8SCQkU8boJab4YulF5yzzeXz+bXCoU85WdgguP0UOEzx4jUeDF0PUYeRPK6NobKBoo5yGq2EMn82c8+nkxl5O6ltITRa4+TW9zheRY6XJfYOx0yU7+dXQdzRRjT5Bt8c23th0uBgxUk99/ZuuPpFjWDeXA/f0MikeIF+2Ln0JWjDJK5llPkgQLuvJuZHkliEwGrl2uPH9/HHc8kbAb+JSFku4nzs73H7tu85nFmY7HDJZxSlfW/teLHeBnYCdfWmE2wYZKaJqz5abqjJt31RmEBw++AnZnWUJNs628Wak4tzCAWaf6R1JtKF8luchov2aI+Y9SKo0ZszhuoaNN1qqkJMsCDrA9IHEK4j6JZlVsE14LH7x38k6tNaDUxiC381o1oxkn6xBsgOSiNaoJTmGVdZJNAnknsLN1idCIaqkQiUrrD41hyg7Yuqw/dNcCZ7iC+8SKFv0SdqCCTrYWHRdvb68XB92aeyqhztFCmGSrL40KhoL2EAbth2+YXNMAnToYizpHww3oaJPc7DrTgTHDLxZen7zdTU6+Akaco2Ylbaw8smNPPqLHJpse+JUiKmXjbu9whCxvqpFPvM4XXMAAtj0csIdmxixEpVIf344hgI63LIOGL7KL9jk3u8lVByiPBB4Kd5iKLjRFSxXkOBSlYc8jp45LygvY+lfO5tLwg0l+k+qgcGOy5PR4v7SLosDAvga/zRhTIWpgEFyXK745MZNlhdZrKmBUAZRnhGbH+YbMPIRt4JX7Ew+mwnBZKh4q8/cpO9QnDNOewVrnL9uSuA8U7hWXIGBlwZRQEmB76rxtmD9LBE3GZjhFcEUJqQQUvoYESKn2lYFEynC3shu3ntdfW7y9AhzY1nuaxK5FS6gb29pDCCyKg4a5ASAyIPJDtLtJJDqyE=\",\"prefix\":null}}}}");
            mcp.setAuthType(ToolsRegistryAuthType.API_KEY);
            //new MCPService(dataPipeline).create(mcp);

            //new ToolsRegistryService(dataPipeline).importToolsFromMcp(UUID.fromString("4c9fdcf9-02bb-4d96-9b2e-14b898a046dc"));

            AgentTools agentTools = new AgentTools();
            agentTools.setAgentId(UUID.fromString("629cd71d-ae9e-4ae9-a891-687159c3052a"));
            agentTools.setToolId(UUID.fromString("48e2b72f-c5e0-455e-b71b-3a3dc9f32793"));
            agentTools.setDescription("Get Fine Number");
            agentTools.setStatus("ACTIVE");
            agentTools.setActive(true);
            agentTools.setAuthInfo("{\"auth\":{\"type\":\"API_KEY\",\"config\":{\"api_key\":{\"header_name\":\"Authorization\",\"key\":\"Bearer AgA5nw5zVt+cBLJCitODLDh0WgIkgvlY3MGmN+sw3t9P7emWFM7MkIPot/KByIgRozQdvOuNPvGH0ikrsw26febsuo9q2muuXFV2fJNq6LUiBBiCRo8Ci7eW6rJX5dhJOtiFsD6u5m2rPqWEU97ihoAFEHTe2T4Bo2f5+Nh/BLwl33CknCJvjOYZT3d5pRuRNWyNKTnlgwzaaMelJBoQaWT80+Ob+yJCMsBmahOA9JzeCoPFGu/qWFDlPXiBvoOdBf9fa1EFqXCbS2aNVk0ZqVK/zvNu1zQD4pLEnuYbNGv7+0npW9bivENqZrS0h8X3klIe1s0jw/TprxXWszDSuKglC8c7QXuzD0GiK0/1in+KukxXIqUjgQP/33bcqzoSok+dy9bs8SCQkU8boJab4YulF5yzzeXz+bXCoU85WdgguP0UOEzx4jUeDF0PUYeRPK6NobKBoo5yGq2EMn82c8+nkxl5O6ltITRa4+TW9zheRY6XJfYOx0yU7+dXQdzRRjT5Bt8c23th0uBgxUk99/ZuuPpFjWDeXA/f0MikeIF+2Ln0JWjDJK5llPkgQLuvJuZHkliEwGrl2uPH9/HHc8kbAb+JSFku4nzs73H7tu85nFmY7HDJZxSlfW/teLHeBnYCdfWmE2wYZKaJqz5abqjJt31RmEBw++AnZnWUJNs628Wak4tzCAWaf6R1JtKF8luchov2aI+Y9SKo0ZszhuoaNN1qqkJMsCDrA9IHEK4j6JZlVsE14LH7x38k6tNaDUxiC381o1oxkn6xBsgOSiNaoJTmGVdZJNAnknsLN1idCIaqkQiUrrD41hyg7Yuqw/dNcCZ7iC+8SKFv0SdqCCTrYWHRdvb68XB92aeyqhztFCmGSrL40KhoL2EAbth2+YXNMAnToYizpHww3oaJPc7DrTgTHDLxZen7zdTU6+Akaco2Ylbaw8smNPPqLHJpse+JUiKmXjbu9whCxvqpFPvM4XXMAAtj0csIdmxixEpVIf344hgI63LIOGL7KL9jk3u8lVByiPBB4Kd5iKLjRFSxXkOBSlYc8jp45LygvY+lfO5tLwg0l+k+qgcGOy5PR4v7SLosDAvga/zRhTIWpgEFyXK745MZNlhdZrKmBUAZRnhGbH+YbMPIRt4JX7Ew+mwnBZKh4q8/cpO9QnDNOewVrnL9uSuA8U7hWXIGBlwZRQEmB76rxtmD9LBE3GZjhFcEUJqQQUvoYESKn2lYFEynC3shu3ntdfW7y9AhzY1nuaxK5FS6gb29pDCCyKg4a5ASAyIPJDtLtJJDqyE=\",\"prefix\":null}}}}");
            agentTools.setAgentSchema("{\"type\":\"object\",\"properties\":{\"String\":{\"type\":\"string\",\"description\":\"\"},\"Integer\":{\"type\":\"integer\",\"description\":\"\"}}}");
            agentTools.setStaticPayload("{}");

           // new AgentToolsService(dataPipeline).create(agentTools);
            //new ToolsRegistryRepository(dataPipeline).dropTable();
			//new AgentToolsRepository(dataPipeline).dropTable();
  addSLAPITool();

        }catch(Exception e){
            e.printStackTrace();
            dataPipeline.clear();
            dataPipeline.put("error",e.getMessage());
            dataPipeline.put("status","failed");
            new SnippetException(dataPipeline,"Snippet exception", new Exception(e));
        }
	}
public static void addSLAPITool() {
        ToolsRegistry toolsRegistry = new ToolsRegistry();
        toolsRegistry.setFqn("packages.A.B.findSyncloopScore");
        toolsRegistry.setName("findSyncloopScore");
        toolsRegistry.setDescription("Find Syncloop score based on a initial number");
  		toolsRegistry.setAgentAccess(ToolsRegistryAgentAccess.PRIVATE);
        toolsRegistry.setActive(true);
        toolsRegistry.setStatus("ACTIVE");
        toolsRegistry.setSchema("{\n" +
                "        \"type\": \"object\",\n" +
                "        \"required\": [],\n" +
                "        \"properties\": {\n" +
                "            \"*payload\": {\n" +
                "                \"type\": \"object\",\n" +
                "                \"title\": \"*payload\",\n" +
                "                \"description\": \"\",\n" +
                "                \"required\": [],\n" +
                "                \"properties\": {\n" +
                "                    \"initial_number\": {\n" +
                "                        \"type\": \"integer\",\n" +
                "                        \"title\": \"initial_number\",\n" +
                "                        \"description\": \"\",\n" +
                "                        \"required\": [],\n" +
                "                        \"properties\": {}\n" +
                "                    }\n" +
                "                }\n" +
                "            }\n" +
                "        }\n" +
                "    }");
        toolsRegistry.setSource(ToolsRegistrySource.SL_API);
        toolsRegistry.setMcpId(null);
        toolsRegistry.setStaticPayload("{}");
        new ToolsRegistryService(RuntimePipeline.getRP().dataPipeLine).create(toolsRegistry);

        AgentTools agentTools = new AgentTools();
        agentTools.setAgentId(UUID.fromString("629cd71d-ae9e-4ae9-a891-687159c3052a"));
        agentTools.setToolId(toolsRegistry.getUuid());
        agentTools.setDescription(toolsRegistry.getDescription());
        agentTools.setStatus("ACTIVE");
        agentTools.setActive(true);
        agentTools.setAuthInfo("{}");
        agentTools.setAgentSchema(toolsRegistry.getSchema());
        agentTools.setStaticPayload("{}");

        new AgentToolsService(RuntimePipeline.getRP().dataPipeLine).create(agentTools);

    }
}