#!/usr/bin/env python3
"""
Firestore MCP Server Entry Point

This script starts the MCP server for Firestore test case management.
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add the package to Python path
sys.path.append(str(Path(__file__).parent))

from mcp_server import server
from config import config

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

async def main():
    """Main entry point"""
    try:
        # Validate configuration
        config.validate()
        
        logger.info(f"Starting Firestore MCP Server - {config.server_name} v{config.server_version}")
        logger.info(f"Project: {config.project_id}")
        logger.info(f"Database: {config.firestore_database}")
        
        # Start the server
        await server.run()
        
    except Exception as e:
        logger.error(f"Failed to start MCP server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())