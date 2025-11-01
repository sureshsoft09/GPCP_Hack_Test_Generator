import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
  Collapse,
  Badge,
  ListItemButton,
} from '@mui/material';
import {
  Assessment as EpicIcon,
  Functions as FeatureIcon,
  Assignment as UseCaseIcon,
  CheckCircle as TestCaseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as RefactorIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Psychology as AIIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';

const EnhanceTestCase = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectHierarchy, setProjectHierarchy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedEpics, setExpandedEpics] = useState({});
  const [expandedFeatures, setExpandedFeatures] = useState({});
  const [expandedUseCases, setExpandedUseCases] = useState({});
  
  // AI Assistant Dialog State
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [currentArtifact, setCurrentArtifact] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [agentStatus, setAgentStatus] = useState(null);
  
  const { showNotification } = useNotification();

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      showNotification('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (event) => {
    setSelectedProject(event.target.value);
    setProjectHierarchy(null);
    // Reset expansion states
    setExpandedEpics({});
    setExpandedFeatures({});
    setExpandedUseCases({});
  };

  const analyzeTestCases = async () => {
    if (!selectedProject) return;
    
    try {
      setAnalyzing(true);
      const response = await api.get(`/api/projects/${selectedProject}/hierarchy`);
      setProjectHierarchy(response.data.hierarchy);
      showNotification('Test cases analyzed successfully', 'success');
    } catch (error) {
      console.error('Error analyzing test cases:', error);
      showNotification('Failed to analyze test cases', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRefactor = (artifact, type) => {
    setCurrentArtifact({ ...artifact, type });
    
    // Prefill context message
    const contextMessage = {
      role: 'system',
      content: `Analyzing ${type}: ${artifact.use_case_title || artifact.test_case_title || artifact.title}
      
ID: ${artifact.use_case_id || artifact.test_case_id}
Current Review Status: ${artifact.review_status || 'Pending'}
Comments: ${artifact.comments || 'No comments available'}

${type === 'use_case' ? 
  `Description: ${artifact.description || 'No description'}
  Acceptance Criteria: ${Array.isArray(artifact.acceptance_criteria) ? artifact.acceptance_criteria.join(', ') : artifact.acceptance_criteria || 'None'}` :
  `Test Type: ${artifact.test_type || 'Functional'}
  Preconditions: ${Array.isArray(artifact.preconditions) ? artifact.preconditions.join(', ') : artifact.preconditions || 'None'}
  Test Steps: ${Array.isArray(artifact.test_steps) ? artifact.test_steps.join(', ') : artifact.test_steps || 'None'}
  Expected Result: ${artifact.expected_result || 'None'}`}

Please provide enhancement suggestions or ask clarifying questions.`
    };
    
    setChatHistory([contextMessage]);
    setAiDialogOpen(true);
  };

  const sendMessage = async () => {
    if (!userMessage.trim() || sendingMessage) return;

    const newMessage = { role: 'user', content: userMessage };
    const updatedHistory = [...chatHistory, newMessage];
    setChatHistory(updatedHistory);
    setUserMessage('');
    setSendingMessage(true);

    try {
      const payload = {
        project_id: selectedProject,
        artifact_type: currentArtifact.type,
        artifact_id: currentArtifact.use_case_id || currentArtifact.test_case_id,
        artifact_details: currentArtifact,
        user_chat_history: updatedHistory.filter(msg => msg.role === 'user').map(msg => msg.content)
      };

      const response = await api.post('/api/enhance_testcase_agent', payload);
      const agentResponse = response.data;
      
      setAgentStatus(agentResponse);
      
      const assistantMessage = {
        role: 'assistant',
        content: Array.isArray(agentResponse.assistant_response) 
          ? agentResponse.assistant_response.join('\n') 
          : agentResponse.assistant_response
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);
      
      // If clarifications are completed and enhancement is ready
      if (agentResponse.status === 'clarifications_completed') {
        showNotification('Enhancement completed! Please refresh to see updates.', 'success');
        // Optionally refresh the hierarchy
        setTimeout(() => {
          analyzeTestCases();
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Failed to send message to AI assistant', 'error');
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };

  const toggleEpicExpansion = (epicId) => {
    setExpandedEpics(prev => ({ ...prev, [epicId]: !prev[epicId] }));
  };

  const toggleFeatureExpansion = (featureId) => {
    setExpandedFeatures(prev => ({ ...prev, [featureId]: !prev[featureId] }));
  };

  const toggleUseCaseExpansion = (useCaseId) => {
    setExpandedUseCases(prev => ({ ...prev, [useCaseId]: !prev[useCaseId] }));
  };

  const isNonApproved = (item) => {
    return item.review_status !== 'Approved';
  };

  const TestCaseItem = ({ testCase }) => (
    <ListItem
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        mb: 1,
        backgroundColor: '#fafafa',
      }}
    >
      <ListItemIcon>
        <TestCaseIcon color="success" />
      </ListItemIcon>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle2">
                {testCase.test_case_title || `Test Case ${testCase.test_case_id}`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={testCase.review_status || 'Pending'}
                size="small"
                color={testCase.review_status === 'Approved' ? 'success' : 'warning'}
              />
              {isNonApproved(testCase) && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RefactorIcon />}
                  onClick={() => handleRefactor(testCase, 'test_case')}
                  sx={{ color: '#667eea', borderColor: '#667eea' }}
                >
                  Refactor
                </Button>
              )}
            </Box>
          </Box>
        }
        secondary={
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Type: {testCase.test_type || 'Functional'}
            </Typography>
            {testCase.comments && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Comments: {testCase.comments}
              </Typography>
            )}
          </Box>
        }
      />
    </ListItem>
  );

  const UseCaseItem = ({ useCase }) => {
    const isExpanded = expandedUseCases[useCase.use_case_id];
    const testCases = useCase.test_cases || [];

    return (
      <Card sx={{ mb: 1, border: '1px solid #e0e0e0' }}>
        <ListItemButton onClick={() => toggleUseCaseExpansion(useCase.use_case_id)}>
          <ListItemIcon>
            <UseCaseIcon color="info" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {useCase.use_case_title || `Use Case ${useCase.use_case_id}`}
                  </Typography>
                  <Badge badgeContent={testCases.length} color="success" sx={{ ml: 1 }}>
                    <TestCaseIcon fontSize="small" />
                  </Badge>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={useCase.review_status || 'Pending'}
                    size="small"
                    color={useCase.review_status === 'Approved' ? 'success' : 'warning'}
                  />
                  {isNonApproved(useCase) && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RefactorIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefactor(useCase, 'use_case');
                      }}
                      sx={{ color: '#667eea', borderColor: '#667eea' }}
                    >
                      Refactor
                    </Button>
                  )}
                </Box>
              </Box>
            }
            secondary={useCase.description}
          />
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemButton>
        <Collapse in={isExpanded}>
          <Box sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Test Cases ({testCases.length})
            </Typography>
            {testCases.length > 0 ? (
              testCases.map((testCase) => (
                <TestCaseItem key={testCase.test_case_id} testCase={testCase} />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No test cases available
              </Typography>
            )}
          </Box>
        </Collapse>
      </Card>
    );
  };

  const FeatureItem = ({ feature }) => {
    const isExpanded = expandedFeatures[feature.feature_id];
    const useCases = feature.use_cases || [];

    return (
      <Card sx={{ mb: 1, border: '1px solid #d0d0d0' }}>
        <ListItemButton onClick={() => toggleFeatureExpansion(feature.feature_id)}>
          <ListItemIcon>
            <FeatureIcon color="warning" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {feature.feature_name || feature.title || `Feature ${feature.feature_id}`}
                </Typography>
                <Badge badgeContent={useCases.length} color="info" sx={{ ml: 1 }}>
                  <UseCaseIcon fontSize="small" />
                </Badge>
              </Box>
            }
            secondary={feature.description}
          />
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemButton>
        <Collapse in={isExpanded}>
          <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Use Cases ({useCases.length})
            </Typography>
            {useCases.length > 0 ? (
              useCases.map((useCase) => (
                <UseCaseItem key={useCase.use_case_id} useCase={useCase} />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No use cases available
              </Typography>
            )}
          </Box>
        </Collapse>
      </Card>
    );
  };

  const EpicItem = ({ epic }) => {
    const isExpanded = expandedEpics[epic.epic_id];
    const features = epic.features || [];

    return (
      <Card sx={{ mb: 2, border: '1px solid #c0c0c0' }}>
        <ListItemButton onClick={() => toggleEpicExpansion(epic.epic_id)}>
          <ListItemIcon>
            <EpicIcon color="secondary" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {epic.epic_name || epic.title || `Epic ${epic.epic_id}`}
                </Typography>
                <Badge badgeContent={features.length} color="warning" sx={{ ml: 1 }}>
                  <FeatureIcon fontSize="small" />
                </Badge>
              </Box>
            }
            secondary={epic.description}
          />
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemButton>
        <Collapse in={isExpanded}>
          <Box sx={{ p: 2, backgroundColor: '#f0f0f0' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Features ({features.length})
            </Typography>
            {features.length > 0 ? (
              features.map((feature) => (
                <FeatureItem key={feature.feature_id} feature={feature} />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No features available
              </Typography>
            )}
          </Box>
        </Collapse>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
          Enhance Test Cases
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadProjects}
          disabled={loading}
        >
          Refresh Projects
        </Button>
      </Box>

      {/* Project Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Select Project to Analyze
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <FormControl fullWidth>
              <InputLabel id="project-select-label">Choose Project</InputLabel>
              <Select
                labelId="project-select-label"
                value={selectedProject}
                label="Choose Project"
                onChange={handleProjectSelect}
                disabled={loading}
              >
                {projects.map((project) => (
                  <MenuItem key={project.project_id} value={project.project_id}>
                    {project.project_name} ({project.project_id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              onClick={analyzeTestCases}
              disabled={!selectedProject || analyzing}
              startIcon={analyzing ? <CircularProgress size={16} /> : <AIIcon />}
              sx={{ 
                backgroundColor: '#667eea',
                '&:hover': { backgroundColor: '#5a67d8' }
              }}
            >
              {analyzing ? 'Analyzing...' : 'Analyze Test Cases'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Test Cases Hierarchy */}
      {projectHierarchy && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Project Hierarchy - {projectHierarchy.project_name}
          </Typography>
          {projectHierarchy.epics && projectHierarchy.epics.length > 0 ? (
            projectHierarchy.epics.map((epic) => (
              <EpicItem key={epic.epic_id} epic={epic} />
            ))
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No epics found in this project.
            </Typography>
          )}
        </Paper>
      )}

      {/* AI Assistant Dialog */}
      <Dialog
        open={aiDialogOpen}
        onClose={() => setAiDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AIIcon sx={{ mr: 1, color: '#667eea' }} />
            AI Enhancement Assistant
          </Box>
          <IconButton onClick={() => setAiDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
          {/* Chat History */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            {chatHistory.map((message, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 1,
                  backgroundColor: message.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                  ml: message.role === 'user' ? 2 : 0,
                  mr: message.role === 'user' ? 0 : 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: message.role === 'user' ? '#1976d2' : '#666' }}>
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
              </Box>
            ))}
            {sendingMessage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>

          {/* Agent Status */}
          {agentStatus && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#f0f8ff', borderRadius: 1, border: '1px solid #1976d2' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                Status: {agentStatus.status}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {agentStatus.action_summary}
              </Typography>
            </Box>
          )}

          {/* Message Input */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Type your enhancement instructions or clarifications here..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={sendMessage}
              disabled={!userMessage.trim() || sendingMessage}
              sx={{ alignSelf: 'flex-end' }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default EnhanceTestCase;