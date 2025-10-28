from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.memory import InMemoryMemoryService
from google.genai.types import Content, Part
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

from master_agent.agent import root_agent

# Session and Runner
APP_NAME = "master_agent_app"
USER_ID="test_user"
SESSION_ID="test_session"

# Global session and runner instances
global_session = None
global_runner = None

# Initialize FastAPI app
app = FastAPI(title="Master Agent API", description="API for Master Agent interactions")  

# Pydantic models for request/response
class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    response: str
    debug_info: str = ""

async def setup_session_and_runner():
    session_service = InMemorySessionService()
    memory_service = InMemoryMemoryService()
    session = await session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)  # type: ignore
    runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service, memory_service=memory_service)
    return session, runner

async def reset_session():
    """Reset the global session and runner - useful for debugging or manual resets"""
    global global_session, global_runner
    global_session = None
    global_runner = None
    print("Session and runner reset")

# Agent Interaction
async def call_agent_async(query, isnewproject: bool):
    global global_session, global_runner
    
    content = Content(role='user', parts=[Part(text=query)])

    # Only setup new session and runner if it's a new project or if they don't exist
    if isnewproject or global_session is None or global_runner is None:
        print(f"Creating new session and runner (isnewproject: {isnewproject})")
        global_session, global_runner = await setup_session_and_runner()
    else:
        print("Reusing existing session and runner")

    events = global_runner.run_async(user_id=USER_ID, session_id=SESSION_ID, new_message=content)

    final_response_content = "Final response not yet received."
    debug_events = []
    
    async for event in events:
        if function_calls := event.get_function_calls():
            tool_name = function_calls[0].name
            debug_info = f"_Using tool {tool_name}..._"
            print(debug_info)
            debug_events.append(debug_info)
        elif event.actions and event.actions.transfer_to_agent:
            personality_name = event.actions.transfer_to_agent
            debug_info = f"_Delegating to agent: {personality_name}..._"
            print(debug_info)
            debug_events.append(debug_info)
        elif event.is_final_response() and event.content and event.content.parts:
            final_response_content = event.content.parts[0].text

        # For debugging, print the raw type and content to the console
        print(f"DEBUG: Full Event: {event}")
    
    print("## Final Message")
    print(final_response_content)

    # Get the memory service from the runner to add session to memory
    completed_session = await global_runner.session_service.get_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)
    await global_runner.memory_service.add_session_to_memory(completed_session) #type: ignore

    return final_response_content, "\n".join(debug_events)

# FastAPI endpoints
@app.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest,isnewproject: bool = False):
    """
    Process a query through the master agent and return the response.
    """
    try:
        response, debug_info = await call_agent_async(request.query, isnewproject)
        return QueryResponse(response=response, debug_info=debug_info) #type:ignore
    except Exception as e:
        return QueryResponse(response=f"Error processing query: {str(e)}", debug_info="")    


@app.get("/")
async def root():
    """
    Health check endpoint.
    """
    return {"message": "Master Agent API is running!", "status": "healthy"}

@app.post("/reset-session")
async def reset_session_endpoint():
    """
    Reset the current session and memory - useful for starting fresh.
    """
    await reset_session()
    return {"message": "Session reset successfully", "status": "success"}

# Run the query (for testing when running directly)
if __name__ == "__main__":
    # Test query when running the file directly
    import asyncio
    
    # Uncomment the lines below to test with a sample query
    # query = "Generate sample email to wish Diwali celebration"
    # response, debug = asyncio.run(call_agent_async(query))
    # print(f"Response: {response}")
    
    # Start FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8082)
