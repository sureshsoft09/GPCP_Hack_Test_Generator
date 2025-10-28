"""
Pydantic data models for Test Case Management System

These models define the structure for storing test case data in Firestore
with proper validation and compliance tracking.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum

from pydantic import BaseModel, Field, validator


class TestType(str, Enum):
    """Test case types"""
    FUNCTIONAL = "Functional"
    API = "API"
    INTEGRATION = "Integration"
    REGRESSION = "Regression"
    SECURITY = "Security"
    PERFORMANCE = "Performance"
    USABILITY = "Usability"


class RiskLevel(str, Enum):
    """Risk classification levels"""
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class ProjectStatus(str, Enum):
    """Project status options"""
    ACTIVE = "Active"
    COMPLETED = "Completed"
    ON_HOLD = "On Hold"
    ARCHIVED = "Archived"


class JiraStatus(str, Enum):
    """Jira synchronization status"""
    NOT_PUSHED = "Not Pushed"
    PUSHED = "Pushed"
    SYNCED = "Synced"
    FAILED = "Failed"
    PENDING = "Pending"


class TestCase(BaseModel):
    """Individual test case model"""
    test_case_id: str = Field(..., description="Unique test case identifier")
    title: str = Field(..., description="Test case title")
    description: Optional[str] = Field(None, description="Detailed description")
    preconditions: List[str] = Field(default_factory=list, description="Prerequisites for the test")
    test_steps: List[str] = Field(..., description="Step-by-step test execution")
    expected_result: str = Field(..., description="Expected outcome")
    test_type: TestType = Field(TestType.FUNCTIONAL, description="Type of test")
    compliance_mapping: List[str] = Field(default_factory=list, description="Compliance standards mapping")
    risk_level: RiskLevel = Field(RiskLevel.MEDIUM, description="Risk classification")
    traceability_id: Optional[str] = Field(None, description="Traceability identifier")
    
    # Execution tracking
    execution_status: str = Field("Not Executed", description="Current execution status")
    last_executed: Optional[datetime] = Field(None, description="Last execution timestamp")
    executed_by: Optional[str] = Field(None, description="Who executed the test")
    execution_notes: Optional[str] = Field(None, description="Execution notes")
    
    # Jira integration
    jira_issue_key: Optional[str] = Field(None, description="Jira issue key if synced")
    jira_status: JiraStatus = Field(JiraStatus.NOT_PUSHED, description="Jira sync status")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = Field(None, description="Creator user ID")


class UseCase(BaseModel):
    """Use case model containing test cases"""
    use_case_id: str = Field(..., description="Unique use case identifier")
    title: str = Field(..., description="Use case title")
    description: str = Field(..., description="Detailed use case description")
    test_scenarios_outline: List[str] = Field(default_factory=list, description="High-level test scenarios")
    compliance_mapping: List[str] = Field(default_factory=list, description="Compliance standards mapping")
    risk_level: RiskLevel = Field(RiskLevel.MEDIUM, description="Risk classification")
    
    # Related test cases
    test_cases: List[TestCase] = Field(default_factory=list, description="Associated test cases")
    
    # Jira integration
    jira_epic_key: Optional[str] = Field(None, description="Jira epic key if synced")
    jira_status: JiraStatus = Field(JiraStatus.NOT_PUSHED, description="Jira sync status")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = Field(None, description="Creator user ID")


class Feature(BaseModel):
    """Feature model containing use cases"""
    feature_id: str = Field(..., description="Unique feature identifier")
    feature_name: str = Field(..., description="Feature name")
    description: Optional[str] = Field(None, description="Feature description")
    
    # Related use cases
    use_cases: List[UseCase] = Field(default_factory=list, description="Associated use cases")
    
    # Jira integration
    jira_component: Optional[str] = Field(None, description="Jira component if synced")
    jira_status: JiraStatus = Field(JiraStatus.NOT_PUSHED, description="Jira sync status")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = Field(None, description="Creator user ID")


class Epic(BaseModel):
    """Epic model containing features"""
    epic_id: str = Field(..., description="Unique epic identifier")
    epic_name: str = Field(..., description="Epic name")
    description: Optional[str] = Field(None, description="Epic description")
    
    # Related features
    features: List[Feature] = Field(default_factory=list, description="Associated features")
    
    # Jira integration
    jira_epic_key: Optional[str] = Field(None, description="Jira epic key if synced")
    jira_status: JiraStatus = Field(JiraStatus.NOT_PUSHED, description="Jira sync status")
    jira_pushed_at: Optional[datetime] = Field(None, description="When pushed to Jira")
    jira_pushed_by: Optional[str] = Field(None, description="Who pushed to Jira")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = Field(None, description="Creator user ID")


class Project(BaseModel):
    """Main project model"""
    project_id: str = Field(..., description="Unique project identifier")
    project_name: str = Field(..., description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    
    # Project metadata
    status: ProjectStatus = Field(ProjectStatus.ACTIVE, description="Project status")
    compliance_frameworks: List[str] = Field(default_factory=list, description="Applicable compliance frameworks")
    
    # Related epics
    epics: List[Epic] = Field(default_factory=list, description="Project epics")
    
    # Coverage summary
    coverage_summary: Optional[str] = Field(None, description="Test coverage summary")
    
    # Jira integration
    jira_project_key: Optional[str] = Field(None, description="Jira project key")
    jira_project_url: Optional[str] = Field(None, description="Jira project URL")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = Field(None, description="Creator user ID")
    
    @validator('epics', pre=True)
    def update_timestamps(cls, v):
        """Update timestamps when epics are modified"""
        return v


class ProjectSummary(BaseModel):
    """Lightweight project summary for listing"""
    project_id: str
    project_name: str
    status: ProjectStatus
    epic_count: int = 0
    feature_count: int = 0
    use_case_count: int = 0
    test_case_count: int = 0
    created_at: datetime
    updated_at: datetime


class CreateProjectRequest(BaseModel):
    """Request model for creating a new project"""
    project_name: str = Field(..., description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    compliance_frameworks: List[str] = Field(default_factory=list, description="Compliance frameworks")
    jira_project_key: Optional[str] = Field(None, description="Jira project key")


class UpdateProjectRequest(BaseModel):
    """Request model for updating a project"""
    project_name: Optional[str] = Field(None, description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    status: Optional[ProjectStatus] = Field(None, description="Project status")
    compliance_frameworks: Optional[List[str]] = Field(None, description="Compliance frameworks")


class SearchFilter(BaseModel):
    """Search and filter parameters"""
    status: Optional[ProjectStatus] = None
    compliance_framework: Optional[str] = None
    jira_status: Optional[JiraStatus] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    text_search: Optional[str] = None


class BulkOperationResult(BaseModel):
    """Result of bulk operations"""
    success_count: int = 0
    error_count: int = 0
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    processed_ids: List[str] = Field(default_factory=list)