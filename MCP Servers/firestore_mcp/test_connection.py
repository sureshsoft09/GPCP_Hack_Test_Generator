"""
Test Firestore connection and basic functionality
"""

import asyncio
import os
from pathlib import Path
from google.cloud import firestore
from dotenv import load_dotenv

# Load environment variables from local .env file
env_file = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_file)

async def test_firestore_connection():
    """Test basic Firestore connection"""
    try:
        print("🔗 Testing Firestore connection...")
        
        # Initialize Firestore client
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "medassureaiproject")
        database_id = os.getenv("FIRESTORE_DATABASE", "(default)")
        print(f"📋 Project ID: {project_id}")
        print(f"🗄️  Database ID: {database_id}")
        
        # Check if credentials are set
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if credentials_path:
            print(f"🔑 Credentials path: {credentials_path}")
        else:
            print("⚠️  GOOGLE_APPLICATION_CREDENTIALS not set - using default credentials")
        
        # Create Firestore client
        client = firestore.Client(project=project_id, database=database_id)
        
        # Test basic operation - list collections
        collections = client.collections()
        print("📂 Available collections:")
        for collection in collections:
            print(f"  - {collection.id}")
        
        # Test write operation
        print("\n✍️  Testing write operation...")
        test_doc_ref = client.collection("test_connection").document("connection_test")
        test_doc_ref.set({
            "test": True,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "message": "MCP Server connection test"
        })
        print("✅ Write operation successful")
        
        # Test read operation
        print("📖 Testing read operation...")
        doc = test_doc_ref.get()
        if doc.exists:
            print(f"✅ Read operation successful: {doc.to_dict()}")
        else:
            print("❌ Document not found")
        
        # Clean up test document
        test_doc_ref.delete()
        print("🧹 Test document cleaned up")
        
        print("\n🎉 Firestore connection test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Firestore connection failed: {e}")
        print("\n🔧 Troubleshooting steps:")
        print("1. Ensure GOOGLE_APPLICATION_CREDENTIALS is set to your service account key file")
        print("2. Verify the service account has 'Cloud Datastore User' role")
        print("3. Check that the project ID is correct")
        print("4. Ensure Firestore is enabled in your Google Cloud project")
        return False

if __name__ == "__main__":
    asyncio.run(test_firestore_connection())