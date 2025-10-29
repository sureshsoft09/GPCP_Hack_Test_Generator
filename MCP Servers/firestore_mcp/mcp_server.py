"""
MCP Server for Firestore Test Case Management

This module provides MCP (Model Context Protocol) tools for agents to interact
with the Firestore test case management system.
"""

import json
import logging
from typing import Dict, Any, List, Optional, Union
import asyncio
from aiohttp import web, web_request, web_response
import aiohttp_cors

# MCP Server implementation with HTTP interface
class MCPServer:
    """MCP Server for Firestore operations with HTTP interface"""
    
    def __init__(self, name: str, port: int = 8084):
        self.name = name
        self.port = port
        self.tools = {}
        self.app = web.Application()
        self.setup_routes()
        self.setup_cors()
    
    def setup_routes(self):
        """Setup HTTP routes for MCP tools"""
        self.app.router.add_get('/', self.health_check)
        self.app.router.add_get('/tools', self.list_tools)
        self.app.router.add_post('/tools/{tool_name}', self.execute_tool)
    
    def setup_cors(self):
        """Setup CORS for cross-origin requests"""
        cors = aiohttp_cors.setup(self.app, defaults={
            "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
                allow_methods="*"
            )
        })
        
        # Add CORS to all routes
        for route in list(self.app.router.routes()):
            cors.add(route)
    
    async def health_check(self, request: web_request.Request) -> web_response.Response:
        """Health check endpoint"""
        return web.json_response({
            "status": "healthy",
            "server": self.name,
            "tools_count": len(self.tools)
        })
    
    async def list_tools(self, request: web_request.Request) -> web_response.Response:
        """List available tools"""
        tool_list = [{"name": name, "description": func.__doc__ or "No description"} 
                    for name, func in self.tools.items()]
        return web.json_response({"tools": tool_list})
    
    async def execute_tool(self, request: web_request.Request) -> web_response.Response:
        """Execute a specific tool"""
        tool_name = request.match_info['tool_name']
        
        if tool_name not in self.tools:
            return web.json_response(
                {"error": f"Tool '{tool_name}' not found"}, 
                status=404
            )
        
        try:
            # Get request data
            if request.content_type == 'application/json':
                data = await request.json()
            else:
                data = {}
            
            # Execute the tool
            result = await self.tools[tool_name](**data)
            return web.json_response({"result": result})
            
        except Exception as e:
            logging.error(f"Error executing tool {tool_name}: {e}")
            return web.json_response(
                {"error": str(e)}, 
                status=500
            )
    
    def tool(self, name: str):
        """Decorator to register tools"""
        def decorator(func):
            self.tools[name] = func
            return func
        return decorator
    
    async def run(self):
        """Run the HTTP server"""
        print(f"Starting MCP Server {self.name} on port {self.port}")
        print(f"Available tools: {len(self.tools)}")
        print(f"Health check: http://localhost:{self.port}/")
        print(f"Tools list: http://localhost:{self.port}/tools")
        
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        print(f"MCP Server {self.name} is running on http://localhost:{self.port}")
        
        # Keep the server running
        try:
            await asyncio.Future()  # Run forever
        except KeyboardInterrupt:
            print(f"Shutting down MCP Server {self.name}")
        finally:
            await runner.cleanup()

from firestore_client import FirestoreClient
from models import (
    CreateProjectRequest, UpdateProjectRequest, SearchFilter,
    Project, Epic, Feature, UseCase, TestCase,
    JiraStatus, ProjectStatus, TestType, RiskLevel
)
from config import config

logger = logging.getLogger(__name__)

class FirestoreMCPServer:
    """MCP Server for Firestore operations"""
    
    def __init__(self):
        self.server = MCPServer(config.server_name, config.port)
        self.firestore_client = FirestoreClient()
        self._register_tools()
    
    def _register_tools(self):
        """Register all MCP tools"""
        
        # ================================
        # PROJECT MANAGEMENT TOOLS
        # ================================
        
        @self.server.tool("create_project")
        async def create_project(
            project_name: str,
            description: str = "",
            compliance_frameworks: Optional[List[str]] = None,
            jira_project_key: str = "",
            created_by: str = ""
        ) -> Dict[str, Any]:
            """
            Create a new test case project
            
            Args:
                project_name: Name of the project
                description: Project description
                compliance_frameworks: List of compliance frameworks (FDA, IEC 62304, etc.)
                jira_project_key: Jira project key for integration
                created_by: User who created the project
            
            Returns:
                Created project data
            """
            try:
                request = CreateProjectRequest(
                    project_name=project_name,
                    description=description or None,
                    compliance_frameworks=compliance_frameworks or [],
                    jira_project_key=jira_project_key or None
                )
                
                project = await self.firestore_client.create_project(request, created_by or None)
                
                return {
                    "success": True,
                    "project": project.dict(),
                    "message": f"Project '{project_name}' created successfully"
                }
                
            except Exception as e:
                logger.error(f"Error creating project: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to create project"
                }
        
        @self.server.tool("get_project")
        async def get_project(project_id: str) -> Dict[str, Any]:
            """
            Get project by ID
            
            Args:
                project_id: Unique project identifier
            
            Returns:
                Project data or error
            """
            try:
                project = await self.firestore_client.get_project(project_id)
                
                if project:
                    return {
                        "success": True,
                        "project": project.dict(),
                        "message": "Project retrieved successfully"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Project not found",
                        "message": f"Project {project_id} does not exist"
                    }
                    
            except Exception as e:
                logger.error(f"Error getting project: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to retrieve project"
                }
        
        @self.server.tool("list_projects")
        async def list_projects(
            status: str = "",
            compliance_framework: str = "",
            text_search: str = "",
            limit: int = 100
        ) -> Dict[str, Any]:
            """
            List projects with optional filtering
            
            Args:
                status: Filter by project status (Active, Completed, On Hold, Archived)
                compliance_framework: Filter by compliance framework
                text_search: Search in project name and description
                limit: Maximum number of results
            
            Returns:
                List of project summaries
            """
            try:
                filters = SearchFilter()
                if status:
                    filters.status = ProjectStatus(status)
                if compliance_framework:
                    filters.compliance_framework = compliance_framework
                if text_search:
                    filters.text_search = text_search
                
                projects = await self.firestore_client.list_projects(filters, limit)
                
                return {
                    "success": True,
                    "projects": [project.dict() for project in projects],
                    "count": len(projects),
                    "message": f"Retrieved {len(projects)} projects"
                }
                
            except Exception as e:
                logger.error(f"Error listing projects: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to list projects"
                }
        
        @self.server.tool("update_project")
        async def update_project(
            project_id: str,
            project_name: str = "",
            description: str = "",
            status: str = "",
            compliance_frameworks: Optional[List[str]] = None,
            updated_by: str = ""
        ) -> Dict[str, Any]:
            """
            Update an existing project
            
            Args:
                project_id: Project identifier
                project_name: New project name
                description: New description
                status: New status
                compliance_frameworks: Updated compliance frameworks
                updated_by: User making the update
            
            Returns:
                Updated project data
            """
            try:
                request = UpdateProjectRequest(
                    project_name=project_name if project_name else None,
                    description=description if description else None,
                    status=ProjectStatus(status) if status else None,
                    compliance_frameworks=compliance_frameworks
                )
                
                project = await self.firestore_client.update_project(project_id, request, updated_by or None)
                
                if project:
                    return {
                        "success": True,
                        "project": project.dict(),
                        "message": "Project updated successfully"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Project not found",
                        "message": f"Project {project_id} does not exist"
                    }
                    
            except Exception as e:
                logger.error(f"Error updating project: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to update project"
                }
        
        @self.server.tool("delete_project")
        async def delete_project(project_id: str) -> Dict[str, Any]:
            """
            Delete a project
            
            Args:
                project_id: Project identifier
            
            Returns:
                Success or error message
            """
            try:
                success = await self.firestore_client.delete_project(project_id)
                
                if success:
                    return {
                        "success": True,
                        "message": f"Project {project_id} deleted successfully"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Project not found",
                        "message": f"Project {project_id} does not exist"
                    }
                    
            except Exception as e:
                logger.error(f"Error deleting project: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to delete project"
                }
        
        # ================================
        # BULK IMPORT TOOLS
        # ================================
        
        @self.server.tool("import_test_structure")
        async def import_test_structure(
            project_id: str,
            test_structure: str
        ) -> Dict[str, Any]:
            """
            Import complete test structure from agent-generated data
            
            Args:
                project_id: Target project ID
                test_structure: JSON string containing epics, features, use cases, and test cases
            
            Returns:
                Import results with success/error counts
            """
            try:
                # Parse the test structure
                structure_data = json.loads(test_structure)
                
                # Validate required fields
                if 'epics' not in structure_data:
                    return {
                        "success": False,
                        "error": "Invalid structure: 'epics' field is required",
                        "message": "Test structure must contain epics array"
                    }
                
                # Perform bulk import
                result = await self.firestore_client.bulk_create_from_structure(project_id, structure_data)
                
                return {
                    "success": result.error_count == 0,
                    "import_result": result.dict(),
                    "message": f"Import completed: {result.success_count} created, {result.error_count} errors"
                }
                
            except json.JSONDecodeError as e:
                return {
                    "success": False,
                    "error": f"Invalid JSON: {str(e)}",
                    "message": "Test structure must be valid JSON"
                }
            except Exception as e:
                logger.error(f"Error importing test structure: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to import test structure"
                }
        
        # ================================
        # EPIC MANAGEMENT TOOLS
        # ================================
        
        @self.server.tool("add_epic")
        async def add_epic(
            project_id: str,
            epic_name: str,
            description: str = "",
            epic_id: str = ""
        ) -> Dict[str, Any]:
            """
            Add an epic to a project
            
            Args:
                project_id: Project identifier
                epic_name: Epic name
                description: Epic description
                epic_id: Custom epic ID (auto-generated if not provided)
            
            Returns:
                Success status and epic details
            """
            try:
                epic = Epic(
                    epic_id=epic_id or "",
                    epic_name=epic_name,
                    description=description or None,
                    jira_epic_key=None,
                    jira_status=JiraStatus.NOT_PUSHED,
                    jira_pushed_at=None,
                    jira_pushed_by=None,
                    created_by=None
                )
                
                success = await self.firestore_client.add_epic_to_project(project_id, epic)
                
                if success:
                    return {
                        "success": True,
                        "epic": epic.dict(),
                        "message": f"Epic '{epic_name}' added successfully"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Project not found",
                        "message": f"Project {project_id} does not exist"
                    }
                    
            except Exception as e:
                logger.error(f"Error adding epic: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to add epic"
                }
        
        @self.server.tool("update_epic_jira_status")
        async def update_epic_jira_status(
            project_id: str,
            epic_id: str,
            jira_status: str,
            jira_key: str = ""
        ) -> Dict[str, Any]:
            """
            Update Jira synchronization status for an epic
            
            Args:
                project_id: Project identifier
                epic_id: Epic identifier
                jira_status: New Jira status (Not Pushed, Pushed, Synced, Failed, Pending)
                jira_key: Jira epic key
            
            Returns:
                Success status
            """
            try:
                jira_status_enum = JiraStatus(jira_status)
                success = await self.firestore_client.update_epic_jira_status(
                    project_id, epic_id, jira_status_enum, jira_key or None
                )
                
                if success:
                    return {
                        "success": True,
                        "message": f"Epic Jira status updated to {jira_status}"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Epic or project not found",
                        "message": f"Epic {epic_id} not found in project {project_id}"
                    }
                    
            except ValueError as e:
                return {
                    "success": False,
                    "error": f"Invalid Jira status: {jira_status}",
                    "message": "Valid statuses: Not Pushed, Pushed, Synced, Failed, Pending"
                }
            except Exception as e:
                logger.error(f"Error updating epic Jira status: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to update epic Jira status"
                }
        
        # ================================
        # SEARCH AND ANALYTICS TOOLS
        # ================================
        
        @self.server.tool("search_test_cases")
        async def search_test_cases(
            project_id: str,
            search_term: str
        ) -> Dict[str, Any]:
            """
            Search for test cases within a project
            
            Args:
                project_id: Project identifier
                search_term: Search term for test case titles, IDs, or descriptions
            
            Returns:
                List of matching test cases with context
            """
            try:
                results = await self.firestore_client.search_test_cases(project_id, search_term)
                
                return {
                    "success": True,
                    "results": results,
                    "count": len(results),
                    "message": f"Found {len(results)} test cases matching '{search_term}'"
                }
                
            except Exception as e:
                logger.error(f"Error searching test cases: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to search test cases"
                }
        
        @self.server.tool("get_project_statistics")
        async def get_project_statistics(project_id: str) -> Dict[str, Any]:
            """
            Get detailed statistics and analytics for a project
            
            Args:
                project_id: Project identifier
            
            Returns:
                Project statistics including counts, Jira sync status, compliance coverage
            """
            try:
                stats = await self.firestore_client.get_project_statistics(project_id)
                
                if stats:
                    return {
                        "success": True,
                        "statistics": stats,
                        "message": "Project statistics retrieved successfully"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Project not found",
                        "message": f"Project {project_id} does not exist"
                    }
                    
            except Exception as e:
                logger.error(f"Error getting project statistics: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to get project statistics"
                }
        
        # ================================
        # FEATURE AND USE CASE TOOLS
        # ================================
        
        @self.server.tool("add_feature")
        async def add_feature(
            project_id: str,
            epic_id: str,
            feature_name: str,
            description: str = "",
            feature_id: str = ""
        ) -> Dict[str, Any]:
            """
            Add a feature to an epic
            
            Args:
                project_id: Project identifier
                epic_id: Epic identifier
                feature_name: Feature name
                description: Feature description
                feature_id: Custom feature ID (auto-generated if not provided)
            
            Returns:
                Success status and feature details
            """
            try:
                feature = Feature(
                    feature_id=feature_id or "",
                    feature_name=feature_name,
                    description=description or None,
                    jira_component=None,
                    jira_status=JiraStatus.NOT_PUSHED,
                    created_by=None
                )
                
                success = await self.firestore_client.add_feature_to_epic(project_id, epic_id, feature)
                
                if success:
                    return {
                        "success": True,
                        "feature": feature.dict(),
                        "message": f"Feature '{feature_name}' added successfully"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Project or epic not found",
                        "message": f"Epic {epic_id} not found in project {project_id}"
                    }
                    
            except Exception as e:
                logger.error(f"Error adding feature: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to add feature"
                }
        
        @self.server.tool("add_use_case")
        async def add_use_case(
            project_id: str,
            epic_id: str,
            feature_id: str,
            title: str,
            description: str,
            test_scenarios_outline: List[str] = [],
            compliance_mapping: List[str] = [],
            use_case_id: str = ""
        ) -> Dict[str, Any]:
            """
            Add a use case to a feature
            
            Args:
                project_id: Project identifier
                epic_id: Epic identifier
                feature_id: Feature identifier
                title: Use case title
                description: Use case description
                test_scenarios_outline: List of test scenarios
                compliance_mapping: List of compliance references
                use_case_id: Custom use case ID (auto-generated if not provided)
            
            Returns:
                Success status and use case details
            """
            try:
                use_case = UseCase(
                    use_case_id=use_case_id or "",
                    title=title,
                    description=description,
                    test_scenarios_outline=test_scenarios_outline or [],
                    compliance_mapping=compliance_mapping or [],
                    risk_level=RiskLevel.MEDIUM,
                    jira_epic_key=None,
                    jira_status=JiraStatus.NOT_PUSHED,
                    created_by=None
                )
                
                success = await self.firestore_client.add_use_case_to_feature(
                    project_id, epic_id, feature_id, use_case
                )
                
                if success:
                    return {
                        "success": True,
                        "use_case": use_case.dict(),
                        "message": f"Use case '{title}' added successfully"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Project, epic, or feature not found",
                        "message": f"Feature {feature_id} not found"
                    }
                    
            except Exception as e:
                logger.error(f"Error adding use case: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to add use case"
                }
        
        @self.server.tool("add_test_case")
        async def add_test_case(
            project_id: str,
            epic_id: str,
            feature_id: str,
            use_case_id: str,
            title: str,
            preconditions: List[str],
            test_steps: List[str],
            expected_result: str,
            test_type: str = "Functional",
            compliance_mapping: List[str] = [],
            test_case_id: str = ""
        ) -> Dict[str, Any]:
            """
            Add a test case to a use case
            
            Args:
                project_id: Project identifier
                epic_id: Epic identifier
                feature_id: Feature identifier
                use_case_id: Use case identifier
                title: Test case title
                preconditions: List of preconditions
                test_steps: List of test steps
                expected_result: Expected result
                test_type: Type of test (Functional, API, Integration, etc.)
                compliance_mapping: List of compliance references
                test_case_id: Custom test case ID (auto-generated if not provided)
            
            Returns:
                Success status and test case details
            """
            try:
                test_case = TestCase(
                    test_case_id=test_case_id or "",
                    title=title,
                    description=None,
                    preconditions=preconditions or [],
                    test_steps=test_steps,
                    expected_result=expected_result,
                    test_type=TestType(test_type) if test_type else TestType.FUNCTIONAL,
                    compliance_mapping=compliance_mapping or [],
                    risk_level=RiskLevel.MEDIUM,
                    traceability_id=None,
                    execution_status="Not Executed",
                    last_executed=None,
                    executed_by=None,
                    execution_notes=None,
                    jira_issue_key=None,
                    jira_status=JiraStatus.NOT_PUSHED,
                    created_by=None
                )
                
                success = await self.firestore_client.add_test_case_to_use_case(
                    project_id, epic_id, feature_id, use_case_id, test_case
                )
                
                if success:
                    return {
                        "success": True,
                        "test_case": test_case.dict(),
                        "message": f"Test case '{title}' added successfully"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Project, epic, feature, or use case not found",
                        "message": f"Use case {use_case_id} not found"
                    }
                    
            except ValueError as e:
                return {
                    "success": False,
                    "error": f"Invalid test type: {test_type}",
                    "message": "Valid types: Functional, API, Integration, Regression, Security, Performance, Usability"
                }
            except Exception as e:
                logger.error(f"Error adding test case: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "message": "Failed to add test case"
                }
    
    def get_server(self) -> MCPServer:
        """Get the MCP server instance"""
        return self.server


# Create server instance
mcp_server = FirestoreMCPServer()
server = mcp_server.get_server()