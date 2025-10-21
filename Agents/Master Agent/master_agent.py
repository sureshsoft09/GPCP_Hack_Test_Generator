import os
import sys
import json
import tempfile
from dotenv import load_dotenv
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from fastapi import FastAPI, HTTPException, Request
import uvicorn
import google.cloud.aiplatform as aiplatform

print("[STARTUP] Starting Master Agent...", flush=True)

load_dotenv()

# Handle credentials from Secret Manager
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
if GOOGLE_APPLICATION_CREDENTIALS:
    try:
        # If it's JSON content (from Secret Manager), write it to a temporary file
        credentials_data = json.loads(GOOGLE_APPLICATION_CREDENTIALS)
        # Create a temporary file for the credentials
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as temp_file:
            json.dump(credentials_data, temp_file)
            temp_creds_path = temp_file.name
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = temp_creds_path
        print(f"[STARTUP] Created credentials file: {temp_creds_path}", flush=True)
    except json.JSONDecodeError:
        # If it's already a file path, use it directly
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = GOOGLE_APPLICATION_CREDENTIALS
        print(f"[STARTUP] Using credentials file: {GOOGLE_APPLICATION_CREDENTIALS}", flush=True)

PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION")
MODEL_ID = os.getenv("Vertex_AI_MODEL_Name")

print(f"[STARTUP] PROJECT: {PROJECT}, LOCATION: {LOCATION}, MODEL: {MODEL_ID}", flush=True)

if not PROJECT or not LOCATION or not MODEL_ID:
    print("[ERROR] Missing required environment variables!", flush=True)
    raise ValueError("Missing required environment variables")

os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'true'
os.environ['GOOGLE_CLOUD_PROJECT'] = PROJECT
os.environ['GOOGLE_CLOUD_LOCATION'] = LOCATION

print("[STARTUP] Initializing Vertex AI...", flush=True)
aiplatform.init(project=PROJECT, location=LOCATION)

print("[STARTUP] Creating agent...", flush=True)
agent = LlmAgent(
    name="master_agent",
    model=MODEL_ID,
    instruction="You are a helpful AI assistant. Answer questions directly and clearly.",
    tools=[]
)

session_service = InMemorySessionService()
runner = Runner(app_name="MasterAgent", agent=agent, session_service=session_service)
app = FastAPI(title="Master Agent")

print("[STARTUP] FastAPI app ready", flush=True)

@app.get("/")
async def health_check():
    return {"status": "ok", "agent": "running"}

@app.post("/")
async def run_agent(request: Request):
    body = await request.json()
    prompt = body.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="Missing prompt")
    
    try:
        user_id = "default_user"
        session_id = "default_session"
        session = runner.session_service.get_session(
            app_name="MasterAgent",
            user_id=user_id,
            session_id=session_id
        )
        if not session:
            session = runner.session_service.create_session(
                app_name="MasterAgent",
                user_id=user_id,
                session_id=session_id
            )
        
        new_message = types.Content(parts=[types.Part(text=prompt)])
        reply_parts = []
        async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=new_message):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        reply_parts.append(part.text)
        
        response = "".join(reply_parts)
        return {"reply": response, "status": "success"}
    except Exception as e:
        print(f"[ERROR] {e}", flush=True)
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    print(f"[STARTUP] Starting server on 0.0.0.0:{port}", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=port)
