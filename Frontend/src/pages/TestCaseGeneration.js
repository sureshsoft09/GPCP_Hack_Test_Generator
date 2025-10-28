import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Chip,
  Grid,
  Divider,
  Alert,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Badge,
  Stack,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Chat as ChatIcon,
  PlaylistAddCheck as TestCaseIcon,
  GetApp as ExportIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Folder as FolderIcon,
  InsertDriveFile as DocumentIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  SmartToy as BotIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { TreeView, TreeItem } from '@mui/x-tree-view';

const TestCaseGeneration = () => {
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    created: null
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [readinessPlan, setReadinessPlan] = useState(null);
  const [generatedTestCases, setGeneratedTestCases] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });
  
  // Dialog states
  const [newProjectDialog, setNewProjectDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);

  // Step definitions
  const steps = [
    {
      label: 'Create New Project',
      description: 'Set up your test case generation project'
    },
    {
      label: 'Upload Requirements',
      description: 'Upload PDF or DOCX requirement documents'
    },
    {
      label: 'Review & Chat',
      description: 'Review documents and clarify requirements through chat'
    },
    {
      label: 'Generate Test Cases',
      description: 'Automatically generate comprehensive test cases'
    },
    {
      label: 'Export Results',
      description: 'Download test cases in your preferred format'
    }
  ];

  // Notification helper
  const showNotification = (message, type = 'info') => {
    setNotification({ open: true, message, type });
    setTimeout(() => {
      setNotification({ open: false, message: '', type: 'info' });
    }, 5000);
  };

  // Step 1: Create New Project
  const handleCreateProject = () => {
    if (!projectData.name.trim()) {
      showNotification('Please enter a project name', 'error');
      return;
    }
    
    setProjectData({
      ...projectData,
      created: new Date()
    });
    setNewProjectDialog(false);
    setActiveStep(1);
    showNotification('Project created successfully!', 'success');
  };

  // Step 2: File Upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    if (validFiles.length !== files.length) {
      showNotification('Only PDF and DOCX files are supported', 'warning');
    }

    setIsUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      const newFiles = validFiles.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploaded: new Date(),
        status: 'uploaded'
      }));
      
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      setIsUploading(false);
      showNotification(`${newFiles.length} file(s) uploaded successfully!`, 'success');
      
      if (newFiles.length > 0) {
        setActiveStep(2);
      }
    }, 2000);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
    showNotification('File removed', 'info');
  };

  // Step 3: Chat Interface
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages([...chatMessages, userMessage]);
    setNewMessage('');
    setIsProcessing(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: generateAIResponse(newMessage),
        sender: 'ai',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1500);
  };

  const generateAIResponse = (userInput) => {
    const responses = [
      "I've analyzed your requirement document. The functionality appears to be well-defined. Would you like me to clarify any specific test scenarios?",
      "Based on the uploaded documents, I can see several key features that need testing. Let me break down the critical test areas for you.",
      "The requirements look comprehensive. I've identified potential edge cases that should be included in the test suite. Shall we proceed with test case generation?",
      "I notice some areas where additional test coverage might be beneficial. Would you like me to suggest additional test scenarios?",
      "The document structure is clear. I'm ready to generate test cases covering functional, non-functional, and edge case scenarios."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleReviewDocuments = async () => {
    setIsProcessing(true);
    
    // Simulate document analysis
    setTimeout(() => {
      const mockReadinessPlan = {
        documentAnalysis: {
          totalPages: 45,
          keyFeatures: 12,
          requirements: 28,
          riskAreas: 3
        },
        testingStrategy: {
          functionalTests: 85,
          nonFunctionalTests: 25,
          integrationTests: 15,
          edgeCases: 20
        },
        coverage: {
          requirementsCoverage: 95,
          featureCoverage: 88,
          riskCoverage: 100
        },
        recommendations: [
          "Focus on authentication and authorization testing",
          "Include performance testing for data processing modules",
          "Add comprehensive error handling test cases",
          "Consider accessibility testing requirements"
        ]
      };
      
      setReadinessPlan(mockReadinessPlan);
      setIsProcessing(false);
      setActiveStep(3);
      showNotification('Document analysis completed!', 'success');
      
      // Add initial AI message
      const initialMessage = {
        id: Date.now(),
        text: "I've completed the analysis of your requirement documents. The readiness plan shows good coverage potential. Feel free to ask any questions about the requirements or testing strategy.",
        sender: 'ai',
        timestamp: new Date()
      };
      setChatMessages([initialMessage]);
    }, 3000);
  };

  // Step 4: Generate Test Cases
  const handleGenerateTestCases = async () => {
    setIsGenerating(true);
    
    // Simulate test case generation
    setTimeout(() => {
      const mockTestCases = [
        {
          id: 'tc-001',
          category: 'Authentication',
          title: 'User Login Validation',
          priority: 'High',
          status: 'Generated',
          children: [
            {
              id: 'tc-001-01',
              title: 'Valid credentials login',
              steps: ['Navigate to login page', 'Enter valid username', 'Enter valid password', 'Click login button'],
              expected: 'User should be redirected to dashboard',
              priority: 'High'
            },
            {
              id: 'tc-001-02',
              title: 'Invalid credentials login',
              steps: ['Navigate to login page', 'Enter invalid username', 'Enter invalid password', 'Click login button'],
              expected: 'Error message should be displayed',
              priority: 'High'
            }
          ]
        },
        {
          id: 'tc-002',
          category: 'Data Processing',
          title: 'File Upload and Processing',
          priority: 'Medium',
          status: 'Generated',
          children: [
            {
              id: 'tc-002-01',
              title: 'Valid file upload',
              steps: ['Navigate to upload page', 'Select valid file', 'Click upload button'],
              expected: 'File should be uploaded and processed successfully',
              priority: 'Medium'
            },
            {
              id: 'tc-002-02',
              title: 'Invalid file type upload',
              steps: ['Navigate to upload page', 'Select invalid file type', 'Click upload button'],
              expected: 'Error message for unsupported file type',
              priority: 'Medium'
            }
          ]
        },
        {
          id: 'tc-003',
          category: 'Performance',
          title: 'System Performance Tests',
          priority: 'Medium',
          status: 'Generated',
          children: [
            {
              id: 'tc-003-01',
              title: 'Load testing with 100 concurrent users',
              steps: ['Setup load testing environment', 'Configure 100 virtual users', 'Execute load test'],
              expected: 'System should handle load with <2s response time',
              priority: 'Medium'
            }
          ]
        }
      ];
      
      setGeneratedTestCases(mockTestCases);
      setIsGenerating(false);
      setActiveStep(4);
      showNotification('Test cases generated successfully!', 'success');
    }, 4000);
  };

  // Step 5: Export Test Cases
  const handleExportTestCases = async () => {
    if (generatedTestCases.length === 0) {
      showNotification('No test cases to export', 'warning');
      return;
    }

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create export data
      const exportData = {
        project: projectData,
        testCases: generatedTestCases,
        generatedAt: new Date(),
        format: exportFormat
      };
      
      // Create downloadable content
      const content = JSON.stringify(exportData, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectData.name}_test_cases.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportDialog(false);
      showNotification(`Test cases exported as ${exportFormat.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export test cases', 'error');
    }
  };

  // Chat Message Component
  const ChatMessage = ({ message }) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
        mb: 2
      }}
    >
      <Card
        sx={{
          maxWidth: '70%',
          bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
          color: message.sender === 'user' ? 'white' : 'text.primary'
        }}
      >
        <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                mr: 1,
                bgcolor: message.sender === 'user' ? 'primary.dark' : 'secondary.main'
              }}
            >
              {message.sender === 'user' ? <PersonIcon /> : <BotIcon />}
            </Avatar>
            <Typography variant="caption">
              {message.sender === 'user' ? 'You' : 'AI Assistant'}
            </Typography>
          </Box>
          <Typography variant="body2">{message.text}</Typography>
        </CardContent>
      </Card>
    </Box>
  );

  // Test Case Tree Component
  const TestCaseTree = ({ testCases }) => (
    <TreeView
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<FolderIcon />}
      sx={{ height: 400, flexGrow: 1, maxWidth: '100%', overflowY: 'auto' }}
    >
      {testCases.map((category) => (
        <TreeItem
          key={category.id}
          nodeId={category.id}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
              <Typography variant="subtitle2">{category.title}</Typography>
              <Chip
                label={category.priority}
                size="small"
                color={category.priority === 'High' ? 'error' : 'default'}
                sx={{ ml: 1 }}
              />
            </Box>
          }
        >
          {category.children?.map((testCase) => (
            <TreeItem
              key={testCase.id}
              nodeId={testCase.id}
              label={
                <Box sx={{ py: 0.5 }}>
                  <Typography variant="body2">{testCase.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {testCase.steps?.length || 0} steps
                  </Typography>
                </Box>
              }
            />
          ))}
        </TreeItem>
      ))}
    </TreeView>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Test Case Generation
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Generate comprehensive test cases from your requirement documents
        </Typography>
      </Box>

      {/* Notification */}
      {notification.open && (
        <Alert 
          severity={notification.type} 
          sx={{ mb: 3 }}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          {notification.message}
        </Alert>
      )}

      {/* Main Stepper */}
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="h6">{step.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
              <StepContent>
                {/* Step 1: Create New Project */}
                {index === 0 && (
                  <Box sx={{ py: 2 }}>
                    {!projectData.created ? (
                      <Card sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Create New Project
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setNewProjectDialog(true)}
                          >
                            Create New Project
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Project: {projectData.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {projectData.description}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Created: {projectData.created.toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(1)}
                      disabled={!projectData.created}
                    >
                      Continue
                    </Button>
                  </Box>
                )}

                {/* Step 2: Upload Requirements */}
                {index === 1 && (
                  <Box sx={{ py: 2 }}>
                    <Card sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Upload Requirement Documents
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Upload PDF or DOCX files containing your project requirements
                        </Typography>
                        
                        <Box sx={{ mt: 2, mb: 2 }}>
                          <input
                            accept=".pdf,.docx"
                            style={{ display: 'none' }}
                            id="file-upload"
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                          />
                          <label htmlFor="file-upload">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<UploadIcon />}
                              disabled={isUploading}
                            >
                              {isUploading ? 'Uploading...' : 'Upload Files'}
                            </Button>
                          </label>
                        </Box>

                        {isUploading && <LinearProgress sx={{ mb: 2 }} />}

                        {uploadedFiles.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Uploaded Files ({uploadedFiles.length})
                            </Typography>
                            <List>
                              {uploadedFiles.map((file) => (
                                <ListItem key={file.id}>
                                  <ListItemIcon>
                                    <DocumentIcon />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={file.name}
                                    secondary={`${(file.size / 1024).toFixed(1)} KB - Uploaded ${file.uploaded.toLocaleTimeString()}`}
                                  />
                                  <IconButton onClick={() => removeFile(file.id)}>
                                    <DeleteIcon />
                                  </IconButton>
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Stack direction="row" spacing={2}>
                      <Button onClick={() => setActiveStep(0)}>
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleReviewDocuments}
                        disabled={uploadedFiles.length === 0 || isProcessing}
                        startIcon={isProcessing ? <CircularProgress size={20} /> : <ChatIcon />}
                      >
                        {isProcessing ? 'Analyzing...' : 'Review Documents'}
                      </Button>
                    </Stack>
                  </Box>
                )}

                {/* Step 3: Review & Chat */}
                {index === 2 && (
                  <Box sx={{ py: 2 }}>
                    <Grid container spacing={3}>
                      {/* Readiness Plan */}
                      <Grid item xs={12} md={6}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Readiness Plan
                            </Typography>
                            {readinessPlan ? (
                              <Box>
                                <Accordion>
                                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography>Document Analysis</Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Grid container spacing={2}>
                                      <Grid item xs={6}>
                                        <Typography variant="body2">Total Pages: {readinessPlan.documentAnalysis.totalPages}</Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="body2">Key Features: {readinessPlan.documentAnalysis.keyFeatures}</Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="body2">Requirements: {readinessPlan.documentAnalysis.requirements}</Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="body2">Risk Areas: {readinessPlan.documentAnalysis.riskAreas}</Typography>
                                      </Grid>
                                    </Grid>
                                  </AccordionDetails>
                                </Accordion>

                                <Accordion>
                                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography>Testing Strategy</Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <List dense>
                                      <ListItem>
                                        <ListItemText primary={`Functional Tests: ${readinessPlan.testingStrategy.functionalTests}`} />
                                      </ListItem>
                                      <ListItem>
                                        <ListItemText primary={`Non-Functional Tests: ${readinessPlan.testingStrategy.nonFunctionalTests}`} />
                                      </ListItem>
                                      <ListItem>
                                        <ListItemText primary={`Integration Tests: ${readinessPlan.testingStrategy.integrationTests}`} />
                                      </ListItem>
                                      <ListItem>
                                        <ListItemText primary={`Edge Cases: ${readinessPlan.testingStrategy.edgeCases}`} />
                                      </ListItem>
                                    </List>
                                  </AccordionDetails>
                                </Accordion>

                                <Accordion>
                                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography>Coverage Analysis</Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2">Requirements Coverage</Typography>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={readinessPlan.coverage.requirementsCoverage}
                                        sx={{ mt: 1 }}
                                      />
                                      <Typography variant="caption">{readinessPlan.coverage.requirementsCoverage}%</Typography>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2">Feature Coverage</Typography>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={readinessPlan.coverage.featureCoverage}
                                        sx={{ mt: 1 }}
                                      />
                                      <Typography variant="caption">{readinessPlan.coverage.featureCoverage}%</Typography>
                                    </Box>
                                    <Box>
                                      <Typography variant="body2">Risk Coverage</Typography>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={readinessPlan.coverage.riskCoverage}
                                        sx={{ mt: 1 }}
                                      />
                                      <Typography variant="caption">{readinessPlan.coverage.riskCoverage}%</Typography>
                                    </Box>
                                  </AccordionDetails>
                                </Accordion>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Upload documents to see readiness plan
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Chat Interface */}
                      <Grid item xs={12} md={6}>
                        <Card sx={{ height: 500, display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" gutterBottom>
                              AI Assistant Chat
                            </Typography>
                            
                            {/* Chat Messages */}
                            <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
                              {chatMessages.map((message) => (
                                <ChatMessage key={message.id} message={message} />
                              ))}
                              {isProcessing && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                                  <Card sx={{ bgcolor: 'grey.100' }}>
                                    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <CircularProgress size={16} sx={{ mr: 1 }} />
                                        <Typography variant="body2">AI is typing...</Typography>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                </Box>
                              )}
                            </Box>

                            {/* Chat Input */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Ask about requirements or test scenarios..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                  }
                                }}
                                disabled={isProcessing}
                              />
                              <IconButton 
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || isProcessing}
                                color="primary"
                              >
                                <SendIcon />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                      <Button onClick={() => setActiveStep(1)}>
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleGenerateTestCases}
                        disabled={!readinessPlan || isGenerating}
                        startIcon={isGenerating ? <CircularProgress size={20} /> : <TestCaseIcon />}
                      >
                        {isGenerating ? 'Generating...' : 'Generate Test Cases'}
                      </Button>
                    </Stack>
                  </Box>
                )}

                {/* Step 4: Generate Test Cases */}
                {index === 3 && (
                  <Box sx={{ py: 2 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Generated Test Cases
                        </Typography>
                        
                        {generatedTestCases.length > 0 ? (
                          <Box>
                            <Box sx={{ mb: 2 }}>
                              <Chip 
                                label={`${generatedTestCases.length} Test Categories`} 
                                color="primary" 
                                sx={{ mr: 1 }}
                              />
                              <Chip 
                                label={`${generatedTestCases.reduce((acc, cat) => acc + (cat.children?.length || 0), 0)} Total Test Cases`}
                                color="secondary"
                              />
                            </Box>
                            
                            <TestCaseTree testCases={generatedTestCases} />
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No test cases generated yet
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>

                    <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                      <Button onClick={() => setActiveStep(2)}>
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => setActiveStep(4)}
                        disabled={generatedTestCases.length === 0}
                      >
                        Continue to Export
                      </Button>
                    </Stack>
                  </Box>
                )}

                {/* Step 5: Export Results */}
                {index === 4 && (
                  <Box sx={{ py: 2 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Export Test Cases
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Download your generated test cases in your preferred format
                        </Typography>

                        <Box sx={{ mt: 3 }}>
                          <Button
                            variant="contained"
                            startIcon={<ExportIcon />}
                            onClick={() => setExportDialog(true)}
                            disabled={generatedTestCases.length === 0}
                          >
                            Export Test Cases
                          </Button>
                        </Box>

                        {generatedTestCases.length > 0 && (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Export Summary:
                            </Typography>
                            <List dense>
                              <ListItem>
                                <ListItemText primary={`Project: ${projectData.name}`} />
                              </ListItem>
                              <ListItem>
                                <ListItemText primary={`Test Categories: ${generatedTestCases.length}`} />
                              </ListItem>
                              <ListItem>
                                <ListItemText primary={`Total Test Cases: ${generatedTestCases.reduce((acc, cat) => acc + (cat.children?.length || 0), 0)}`} />
                              </ListItem>
                              <ListItem>
                                <ListItemText primary={`Files Processed: ${uploadedFiles.length}`} />
                              </ListItem>
                            </List>
                          </Box>
                        )}
                      </CardContent>
                    </Card>

                    <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                      <Button onClick={() => setActiveStep(3)}>
                        Back
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setActiveStep(0)}
                      >
                        Start New Project
                      </Button>
                    </Stack>
                  </Box>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* New Project Dialog */}
      <Dialog open={newProjectDialog} onClose={() => setNewProjectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={projectData.name}
            onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={projectData.description}
            onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewProjectDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Test Cases</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={exportFormat}
              label="Export Format"
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <MenuItem value="pdf">PDF Document</MenuItem>
              <MenuItem value="excel">Excel Spreadsheet</MenuItem>
              <MenuItem value="json">JSON Format</MenuItem>
              <MenuItem value="csv">CSV Format</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            The export will include all generated test cases with detailed steps, expected results, and metadata.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button onClick={handleExportTestCases} variant="contained" startIcon={<DownloadIcon />}>
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TestCaseGeneration;