import os
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Environment variables with Cloud Run friendly defaults
AGENTS_API_URL = os.getenv("AGENTS_API_URL", "http://localhost:8082/query")
TIMEOUT = float(os.getenv("AGENTS_API_TIMEOUT", "30"))
PORT = int(os.getenv("PORT", "8083"))  # Cloud Run sets PORT environment variable

app = FastAPI(
    title="MedAssure AI - Backend", 
    description="Backend API that forwards requests to the Agents API",
    version="1.0.0"
)

class PromptRequest(BaseModel):
    prompt: str
    metadata: Optional[dict] = None

class AgentResponse(BaseModel):
    response: str
    debug_info: Optional[str] = ""

async def call_agents_api(prompt: str) -> AgentResponse:
    payload = {"query": prompt}
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            r = await client.post(AGENTS_API_URL, json=payload)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Error contacting Agents API: {exc}")

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Agents API returned {r.status_code}: {r.text}")

    data = r.json()
    return AgentResponse(response=data.get("response", ""), debug_info=data.get("debug_info", ""))


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


@app.post("/clarification_chat", response_model=AgentResponse)
async def clarification_chat_with_agent(req: PromptRequest):
    """Ask follow-up or clarification questions to the agent."""
    prompt = f"Clarify or chat: {req.prompt}"
    return await call_agents_api(prompt)


@app.get("/health")
async def health():
    return {"status": "ok", "agents_api_url": AGENTS_API_URL}

@app.get("/")
async def root():
    """Root endpoint for Cloud Run health checks."""
    return {"message": "MedAssure AI Backend is running!", "status": "healthy"}

# Main execution for Cloud Run
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
