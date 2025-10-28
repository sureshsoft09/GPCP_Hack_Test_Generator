"""
Firestore MCP Server for Test Case Management

This package provides an MCP (Model Context Protocol) server for interacting
with Google Cloud Firestore to manage test case projects, epics, features,
use cases, and test cases for healthcare software compliance.

Main components:
- models.py: Pydantic data models for test case structure
- firestore_client.py: Firestore database operations
- mcp_server.py: MCP server implementation with tools
- config.py: Configuration management
"""

__version__ = "1.0.0"
__author__ = "MedAssure AI Team"