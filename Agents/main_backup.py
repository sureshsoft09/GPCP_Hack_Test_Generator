from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

from master_agent.agent import root_agent

# Session and Runner
APP_NAME = "master_agent_app"
USER_ID="test_user"
SESSION_ID="test_session"

async def setup_session_and_runner():
    session_service = InMemorySessionService()
    session = await session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID) # type: ignore
    runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service)
    return session, runner

# Agent Interaction
async def call_agent_async(query):
    content = Content(role='user', parts=[Part(text=query)])
    _, runner = await setup_session_and_runner()
    events = runner.run_async(user_id=USER_ID, session_id=SESSION_ID, new_message=content)

    final_response_content = "Final response not yet received."
    
    async for event in events:
        if function_calls := event.get_function_calls():
            tool_name = function_calls[0].name
            print(f"_Using tool {tool_name}..._")
        elif event.actions and event.actions.transfer_to_agent:
            personality_name = event.actions.transfer_to_agent
            print(f"_Delegating to agent: {personality_name}..._")
        elif event.is_final_response() and event.content and event.content.parts:
            final_response_content = event.content.parts[0].text

        # For debugging, print the raw type and content to the console
        print(f"DEBUG: Full Event: {event}")
    
    print("## Final Message")
    print(final_response_content)
# Run the query
if __name__ == "__main__":
    import asyncio
    
    query = f"Generate sample email to wish Diwali celebration"
    asyncio.run(call_agent_async(query))
