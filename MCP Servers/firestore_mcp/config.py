"""
Configuration management for Firestore MCP Server
"""

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Load environment variables
current_dir = Path(__file__).parent
dotenv_path = current_dir / ".env"
load_dotenv(dotenv_path=dotenv_path)

class FirestoreConfig:
    """Configuration class for Firestore MCP Server"""
    
    def __init__(self):
        # Google Cloud Configuration
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "medassureaiproject")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "global")
        self.firestore_database = os.getenv("FIRESTORE_DATABASE", "(default)")
        
        # Authentication
        self.credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        
        # Collections
        self.projects_collection = "testcase_projects"
        self.epics_collection = "epics"
        self.features_collection = "features"
        self.use_cases_collection = "use_cases"
        self.test_cases_collection = "test_cases"
        
        # MCP Server Configuration
        self.server_name = "firestore-test-management"
        self.server_version = "1.0.0"
        self.port = int(os.getenv("PORT", "8084"))
        
        # Logging
        self.log_level = os.getenv("LOG_LEVEL", "INFO")
        
    def validate(self) -> bool:
        """Validate required configuration"""
        if not self.project_id:
            raise ValueError("GOOGLE_CLOUD_PROJECT is required")
        
        return True

# Global config instance
config = FirestoreConfig()