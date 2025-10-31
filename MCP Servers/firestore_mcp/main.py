import asyncio
import logging
import os
from typing import List, Dict, Any, Optional

from fastmcp import FastMCP

from typing import Any
import httpx
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize FastMCP server
mcp = FastMCP("firestore")

# Import all modules for tools
from firestore_client import FirestoreClient

# Initialize Firestore client
firestore_client = FirestoreClient()


@mcp.tool()
async def create_project(
    project_name: str,
    description: str = "",
    compliance_frameworks: List[str] = [],
    jira_project_key: str = "",
    created_by: str = ""
) -> Dict[str, Any]:
    """Create a new test case project."""
    try:
        # Create project request with proper validation
        project_data = {
            "project_name": project_name,
            "description": description or "",
            "compliance_frameworks": compliance_frameworks,
            "jira_project_key": jira_project_key or "",
            "status": "Active",
            "created_by": created_by or "system"
        }
        
        project_id = firestore_client.create_project(project_data)
        
        return {
            "success": True,
            "project_id": project_id,
            "message": f"Project '{project_name}' created successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    asyncio.run(
        mcp.run_async(
            transport="streamable-http",
            host="0.0.0.0",
            port=port,
        )
    )
