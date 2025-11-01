# MCP Servers Cloud Run Deployment

This repository contains two MCP (Model Context Protocol) servers that can be deployed to Google Cloud Run:

1. **Firestore MCP Server** - Handles Firestore database operations
2. **JIRA MCP Server** - Handles JIRA integration operations

## Prerequisites

1. **Google Cloud CLI** installed and authenticated
2. **Docker** installed (optional - Cloud Build will handle this)
3. **Google Cloud Project** with billing enabled
4. **Required permissions** to deploy to Cloud Run

## Quick Setup

### 1. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud auth application-default login
```

### 2. Set your project ID

Edit the deployment scripts and replace `your-gcp-project-id` with your actual Google Cloud Project ID:

- `firestore_mcp/deploy.sh` (or `deploy.ps1` for Windows)
- `jira_mcp/deploy.sh` (or `deploy.ps1` for Windows)

## Deployment

### Firestore MCP Server

```bash
cd firestore_mcp
chmod +x deploy.sh
./deploy.sh
```

**Windows PowerShell:**
```powershell
cd firestore_mcp
.\deploy.ps1
```

### JIRA MCP Server

```bash
cd jira_mcp
chmod +x deploy.sh
./deploy.sh
```

**Windows PowerShell:**
```powershell
cd jira_mcp
.\deploy.ps1
```

## Configuration

### Firestore MCP Server

The Firestore MCP server requires:
- Service account with Firestore permissions (automatically created by deployment script)
- Google Cloud Project with Firestore enabled

### JIRA MCP Server

After deployment, configure JIRA environment variables:

```bash
gcloud run services update jira-mcp-server --region=europe-west1 \
  --set-env-vars="JIRA_BASE_URL=https://your-company.atlassian.net,JIRA_EMAIL=your-email@company.com,JIRA_API_TOKEN=your-api-token,JIRA_PROJECT_KEY=YOUR-PROJECT"
```

## Service URLs

After successful deployment, your services will be available at:

- **Firestore MCP**: `https://firestore-mcp-server-europe-west1-YOUR-PROJECT-ID.a.run.app`
- **JIRA MCP**: `https://jira-mcp-server-europe-west1-YOUR-PROJECT-ID.a.run.app`

## Security

Both services are deployed with:
- **No public access** (`--no-allow-unauthenticated`)
- **Service account authentication** required
- **IAM-based access control**

To access these services, clients must:
1. Have appropriate IAM permissions
2. Include authentication headers in requests

## Monitoring

Monitor your services using:

```bash
# View service details
gcloud run services describe firestore-mcp-server --region=europe-west1
gcloud run services describe jira-mcp-server --region=europe-west1

# View logs
gcloud logs read --filter="resource.type=cloud_run_revision" --limit=50
```

## Updating Services

To update a deployed service:

1. Make your code changes
2. Run the deployment script again
3. Cloud Run will automatically deploy the new version

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure you have Cloud Run Admin and IAM Admin roles
2. **Build Fails**: Check that all dependencies are listed in requirements.txt
3. **Service Unreachable**: Verify the service account has necessary permissions

### Debug Commands

```bash
# Check service status
gcloud run services list --region=europe-west1

# View service logs
gcloud logs tail "projects/YOUR-PROJECT-ID/logs/run.googleapis.com"

# Test local deployment (optional)
docker build -t test-mcp .
docker run -p 8080:8080 test-mcp
```

## Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Build and deploy firestore MCP
cd firestore_mcp
gcloud run deploy firestore-mcp-server \
    --service-account=mcp-server-sa@YOUR-PROJECT-ID.iam.gserviceaccount.com \
    --no-allow-unauthenticated \
    --region=europe-west1 \
    --source=. \
    --labels=dev-tutorial=codelab-mcp,service=firestore-mcp

# Build and deploy JIRA MCP
cd ../jira_mcp
gcloud run deploy jira-mcp-server \
    --service-account=mcp-server-sa@YOUR-PROJECT-ID.iam.gserviceaccount.com \
    --no-allow-unauthenticated \
    --region=europe-west1 \
    --source=. \
    --labels=dev-tutorial=codelab-mcp,service=jira-mcp
```

## Cost Optimization

Cloud Run pricing is based on:
- **CPU and memory allocation**
- **Number of requests**
- **Execution time**

The deployment scripts are configured for cost efficiency:
- `min-instances=0` (scale to zero when not in use)
- `memory=512Mi` (sufficient for most MCP operations)
- `cpu=1` (adequate performance)

## Support

For issues related to:
- **Google Cloud Run**: Check [Cloud Run Documentation](https://cloud.google.com/run/docs)
- **MCP Protocol**: Check [MCP Documentation](https://modelcontextprotocol.io/)
- **This deployment**: Create an issue in this repository