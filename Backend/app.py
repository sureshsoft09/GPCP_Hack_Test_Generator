import os
import uuid
import tempfile
from typing import Optional, List
import json
from datetime import datetime

import httpx
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Import our custom services
from upload_and_extract_service import upload_extract_service
from content_storage_service import content_storage_service

load_dotenv()

# Environment variables with Cloud Run friendly defaults
AGENTS_API_URL = os.getenv("AGENTS_API_URL", "http://localhost:8082/query")
TIMEOUT = float(os.getenv("AGENTS_API_TIMEOUT", "30"))
PORT = int(os.getenv("PORT", "8083"))  # Cloud Run sets PORT environment variable
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"

app = FastAPI(
    title="MedAssure AI - Backend", 
    description="Backend API that forwards requests to the Agents API",
    version="1.0.0",
    debug=DEBUG
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str
    metadata: Optional[dict] = None

class ReviewRequest(BaseModel):
    project_id: str
    project_name: str
    extracted_content: Optional[str] = None

class UploadResponse(BaseModel):
    success: bool
    message: str
    project_id: str
    files_processed: List[dict]
    extracted_content: str

class AgentResponse(BaseModel):
    response: str
    debug_info: Optional[str] = ""

async def call_agents_api(prompt: str,isnewproject:bool = False) -> AgentResponse:
    payload = {"query": prompt, "newproject": isnewproject}
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            r = await client.post(AGENTS_API_URL, json=payload)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Error contacting Agents API: {exc}")

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Agents API returned {r.status_code}: {r.text}")

    data = r.json()
    return AgentResponse(response=data.get("response", ""), debug_info=data.get("debug_info", ""))

@app.post("/upload_requirement_file", response_model=UploadResponse)
async def upload_requirement_file(
    project_name: str = Form(...),
    project_id: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """Upload requirement files, extract text, and store in cloud storage."""
    
    try:
        # Process files using the upload service
        result = await upload_extract_service.process_files(files, project_name, project_id)
        
        # Store the extracted content using the storage service
        content_storage_service.store_content(
            project_name=project_name,
            project_id=project_id,
            extracted_content=result["extracted_content"],
            processed_files=result["processed_files"]
        )
        
        if DEBUG:
            print(f"Processed {result['total_files']} files for project {project_name} ({project_id})")
        
        return UploadResponse(
            success=True,
            message=f"Successfully processed {result['total_files']} files",
            project_id=project_id,
            files_processed=result["processed_files"],
            extracted_content=result["extracted_content"]
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        if DEBUG:
            print(f"Unexpected error in upload: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error during file processing: {str(e)}"
        )

@app.post("/review_requirement_specifications", response_model=AgentResponse)
async def review_requirement_specifications(req: ReviewRequest):
    """Review requirement specifications using the agent with extracted content."""
    
    # Retrieve stored extracted content using the storage service
    stored_data = content_storage_service.get_content(req.project_name, req.project_id)
    
    if not stored_data:
        raise HTTPException(
            status_code=404, 
            detail=f"No extracted content found for project {req.project_name} (ID: {req.project_id}). Please upload files first."
        )
    
    extracted_content = stored_data.get("extracted_content", "")
    if not extracted_content:
        raise HTTPException(
            status_code=400, 
            detail="No text content was extracted from the uploaded files."
        )
    
    if DEBUG:
        print(f"Processing review for project {req.project_name} with {len(extracted_content)} characters of content")
    
    # Build a comprehensive prompt for the agent
    prompt = f"""
Please review and analyze the following requirement specifications for project '{req.project_name}':

EXTRACTED CONTENT:
{extracted_content}

"""
    
    # Update the stored data with review timestamp using the storage service
    content_storage_service.update_review_timestamp(req.project_name, req.project_id)
    
    return await call_agents_api(prompt,True)

@app.post("/generate_test_cases", response_model=AgentResponse)
async def generate_test_cases(req: PromptRequest):
    """Generate test cases using the agent."""
    # build a helpful prompt for the agent
    prompt = f"Generate test cases for: {req.prompt}"
    return await call_agents_api(prompt)


@app.post("/enhance_test_cases", response_model=AgentResponse)
async def enhance_test_cases(req: PromptRequest):
    """Enhance existing test cases."""
    prompt = f"Enhance these test cases: {req.prompt}"
    return await call_agents_api(prompt)


@app.post("/migration_test_cases", response_model=AgentResponse)
async def migration_test_cases(req: PromptRequest):
    """Produce migration-specific test cases or guidance."""
    prompt = f"Generate migration test cases for: {req.prompt}"
    return await call_agents_api(prompt)


@app.post("/requirement_clarification_chat", response_model=AgentResponse)
async def req_clarification_chat_with_agent(req: PromptRequest):
    """
    Handles clarification or follow-up conversation with the master_agent.
    This endpoint passes user responses or confirmations (e.g., clarification answers, 
    'use as complete', 'consider final') to the master_agent, which routes them to 
    requirement_reviewer_agent for contextual update.
    """
    prompt = f"""
    This is a clarification continuation request from the user for requirement review.
    The user has provided additional information or confirmation regarding previously
    identified ambiguous or missing requirements.

    Context:
    - Type: Clarification Interaction
    - Intent: Resolve pending ambiguities, provide clarification, or confirm requirements as complete.
    - User message: {req.prompt}

    The master_agent should:
    1. Identify that this is a clarification-related message.
    2. Route the content to `requirement_reviewer_agent` for processing.
    3. Include this clarification text as `user_responses` to update pending items.
    4. Return the updated review summary, assistant_response (if new clarifications remain),
       and readiness_plan status.
    """
    return await call_agents_api(prompt)


@app.get("/projects")
async def get_all_projects():
    """Get all stored projects for dashboard."""
    try:
        # Get all projects from storage service
        storage_stats = content_storage_service.get_storage_stats()
        all_projects = content_storage_service.get_all_projects()
        
        # Format projects for dashboard
        projects = []
        for project_key, project_data in all_projects.items():
            project_name, project_id = project_key.split('_', 1)
            projects.append({
                "id": project_id,
                "name": project_name,
                "created_at": project_data.get('created_at'),
                "last_updated": project_data.get('last_updated'),
                "files_count": len(project_data.get('files', [])),
                "content_length": len(project_data.get('extracted_content', '')),
                "status": "active"
            })
        
        return {"projects": projects, "total": len(projects)}
    except Exception as e:
        return {"projects": [], "total": 0}

@app.get("/analytics/overview")
async def get_analytics_overview():
    """Get analytics overview for dashboard."""
    try:
        storage_stats = content_storage_service.get_storage_stats()
        
        return {
            "totalProjects": storage_stats.get("total_projects", 0),
            "totalTestCases": storage_stats.get("total_projects", 0) * 25,  # Estimate
            "completedTests": storage_stats.get("total_projects", 0) * 20,  # Estimate
            "pendingTests": storage_stats.get("total_projects", 0) * 5,     # Estimate
        }
    except Exception as e:
        return {
            "totalProjects": 0,
            "totalTestCases": 0,
            "completedTests": 0,
            "pendingTests": 0,
        }

@app.get("/analytics/recent-activity")
async def get_recent_activity():
    """Get recent activity for dashboard."""
    try:
        all_projects = content_storage_service.get_all_projects()
        activities = []
        
        for project_key, project_data in all_projects.items():
            project_name, project_id = project_key.split('_', 1)
            
            # Add file upload activity
            for file_info in project_data.get('files', []):
                activities.append({
                    "id": f"upload_{project_id}_{len(activities)}",
                    "type": "upload",
                    "description": f"Uploaded {file_info.get('filename', 'file')} to {project_name}",
                    "timestamp": project_data.get('created_at', datetime.now().isoformat()),
                    "project": project_name
                })
            
            # Add review activity if reviewed
            if project_data.get('last_reviewed'):
                activities.append({
                    "id": f"review_{project_id}",
                    "type": "review",
                    "description": f"Reviewed requirements for {project_name}",
                    "timestamp": project_data.get('last_reviewed'),
                    "project": project_name
                })
        
        # Sort by timestamp, most recent first
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return activities[:10]  # Return last 10 activities
    except Exception as e:
        return []

@app.get("/project/{project_id}")
async def get_project_info(project_id: str):
    """Get stored project information."""
    matching_projects = content_storage_service.get_projects_by_id(project_id)
    
    if not matching_projects:
        raise HTTPException(status_code=404, detail=f"Project with ID {project_id} not found")
    
    return {"projects": matching_projects}

@app.get("/health")
async def health():
    storage_stats = content_storage_service.get_storage_stats()
    service_config = upload_extract_service
    
    return {
        "status": "ok", 
        "agents_api_url": AGENTS_API_URL,
        "environment": ENVIRONMENT,
        "debug": DEBUG,
        "google_cloud_bucket": service_config.google_cloud_bucket,
        "max_file_size_mb": service_config.max_file_size / 1024 / 1024,
        "allowed_file_types": service_config.allowed_file_types,
        "stored_projects": storage_stats["total_projects"],
        "total_files": storage_stats["total_files"],
        "total_content_length": storage_stats["total_content_length"]
    }

@app.get("/")
async def root():
    """Root endpoint for Cloud Run health checks."""
    return {"message": "MedAssure AI Backend is running!", "status": "healthy"}

# Main execution for Cloud Run
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
