import os
from pathlib import Path

import google.auth
from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.tools import agent_tool
from google.cloud import logging as google_cloud_logging

from test_generator_agent import test_generator_agent

# Load environment variables from .env file in root directory
root_dir = Path(__file__).parent.parent
dotenv_path = root_dir / ".env"
load_dotenv(dotenv_path=dotenv_path)

# Use default project from credentials if not in .env
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", "medassureaiproject")
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")

logging_client = google_cloud_logging.Client()
logger = logging_client.logger("enhance_testcase_agent")

test_generator_agent_tool = agent_tool.AgentTool(agent=test_generator_agent)

enhance_testcase_agent = Agent(
    name="enhance_testcase_agent",
    model="gemini-2.5-flash",
    instruction="You are a helpful AI assistant designed to provide accurate and useful information."    
)
