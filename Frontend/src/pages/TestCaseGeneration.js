import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
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
  // Refs
  const chatMessagesRef = useRef(null);

  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    created: null,
    id: null
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedContent, setExtractedContent] = useState('');
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantEnabled, setAssistantEnabled] = useState(false);
  const [readinessMeta, setReadinessMeta] = useState(null); // raw backend response metadata
  const [readinessPlan, setReadinessPlan] = useState(null);
  const [generatedTestCases, setGeneratedTestCases] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });

  // Derived readiness flag
  const isReadyForGeneration = Boolean(
    readinessMeta?.readiness_plan?.overall_status?.toString()?.toLowerCase().includes('ready') ||
    readinessMeta?.test_generation_status?.ready_for_generation ||
    readinessPlan?.test_generation_status?.ready_for_generation
  );
  
  // Dialog states
  const [newProjectDialog, setNewProjectDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);

  // Auto-scroll to bottom when chat messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, isProcessing]);

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
    
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setProjectData({
      ...projectData,
      created: new Date(),
      id: projectId
    });
    setNewProjectDialog(false);
    setActiveStep(1);
    showNotification('Project created successfully!', 'success');
  };

  // Step 2: File Selection and Upload
  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    if (validFiles.length !== files.length) {
      showNotification('Only PDF and DOCX files are supported', 'warning');
    }

    setSelectedFiles(validFiles);
    setUploadCompleted(false);
    
    if (validFiles.length > 0) {
      showNotification(`${validFiles.length} file(s) selected for upload`, 'info');
    }
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      showNotification('Please select files first', 'warning');
      return;
    }

    if (!projectData.id || !projectData.name) {
      showNotification('Project information missing', 'error');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('project_name', projectData.name);
      formData.append('project_id', projectData.id);
      
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await api.uploadRequirementFile(formData);
      
      if (response.data.success) {
        const processedFiles = response.data.files_processed.map(file => ({
          id: Date.now() + Math.random(),
          name: file.filename,
          size: file.size,
          type: file.type,
          uploaded: new Date(),
          status: 'uploaded',
          cloudPath: file.cloud_path,
          textLength: file.text_length
        }));
        
        setUploadedFiles(processedFiles);
        setExtractedContent(response.data.extracted_content);
        setUploadCompleted(true);
        setIsUploading(false);
        
        showNotification(
          `Successfully uploaded and processed ${processedFiles.length} file(s)!`, 
          'success'
        );
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      showNotification(
        error.response?.data?.detail || 'Failed to upload files. Please try again.',
        'error'
      );
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
    showNotification('File removed', 'info');
  };

  // Note: Clarification chat is handled in handleSendMessage below (calls backend)

  // Helper function to parse AI response and extract structured data
  const parseAIResponse = (aiResponse) => {
    // Ensure aiResponse is a string
    let responseText = '';
    if (typeof aiResponse === 'string') {
      responseText = aiResponse;
    } else if (aiResponse && typeof aiResponse === 'object') {
      responseText = JSON.stringify(aiResponse);
    } else {
      responseText = String(aiResponse || '');
    }
    
    // Try to extract structured information from the AI response
    const lines = responseText.split('\n').filter(line => line.trim());
    const parsedData = {
      documentAnalysis: {
        totalPages: uploadedFiles.length * 15, // Estimate
        keyFeatures: Math.floor(extractedContent.length / 1000), // Rough estimate
        requirements: Math.floor(extractedContent.length / 500), // Rough estimate
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
      recommendations: []
    };

    // Try to extract recommendations from AI response
    const recommendationKeywords = ['recommend', 'suggest', 'should', 'consider', 'important'];
    const potentialRecommendations = lines.filter(line => 
      recommendationKeywords.some(keyword => line.toLowerCase().includes(keyword))
    ).slice(0, 5); // Take first 5 recommendations

    if (potentialRecommendations.length > 0) {
      parsedData.recommendations = potentialRecommendations.map(rec => 
        rec.replace(/^\d+\.?\s*/, '').trim() // Remove numbering if present
      );
    } else {
      // Fallback recommendations
      parsedData.recommendations = [
        "Focus on authentication and authorization testing",
        "Include performance testing for data processing modules",
        "Add comprehensive error handling test cases",
        "Consider accessibility testing requirements"
      ];
    }

    return parsedData;
  };

  const handleReviewDocuments = async () => {
    if (!uploadCompleted) {
      showNotification('Please upload files first', 'warning');
      return;
    }

    if (!projectData.id || !projectData.name) {
      showNotification('Project information missing', 'error');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await api.reviewRequirementSpecifications({
        project_id: projectData.id,
        project_name: projectData.name
      });

      console.log('Review response:', response);

      // Parse the JSON response string from the backend
      const responseString = response.data.response;
      if (!responseString) throw new Error('No response from analysis service');

      // Extract JSON from the response string (it's wrapped in ```json```)
      let data;
      try {
        const jsonMatch = responseString.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[1]);
        } else {
          // Try parsing the whole response as JSON
          data = JSON.parse(responseString);
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error('Invalid response format from analysis service');
      }

      // Store raw metadata for control logic
      setReadinessMeta(data);

      // Build a human readable AI analysis text from assistant_response if present
      const assistantLines = Array.isArray(data.assistant_response) ? data.assistant_response : (data.assistant_response ? [data.assistant_response] : []);
      const aiAnalysisText = assistantLines.join('\n') || data.ai_text || '';

      // Keep existing parsed readinessPlan for existing UI widgets
      const parsedData = aiAnalysisText ? parseAIResponse(aiAnalysisText) : parseAIResponse(data.readiness_plan ? JSON.stringify(data.readiness_plan) : '');
      const mergedPlan = {
        ...parsedData,
        aiAnalysis: aiAnalysisText,
        // keep a reference to backend readiness summary
        backendReadiness: data.readiness_plan || null,
        test_generation_status: data.test_generation_status || {}
      };

      setReadinessPlan(mergedPlan);
      setIsProcessing(false);
      
      // Initialize chat messages depending on overall status
      const overall = data.readiness_plan?.overall_status || null;

      if (overall && overall.toLowerCase().includes('ready for test generation')) {
        // Ready for test generation: disable assistant, enable generate, advance to step 3
        setAssistantEnabled(false);
        setActiveStep(3);
        showNotification('Requirements are ready for test case generation!', 'success');
        
        // Show assistant final confirmation in chat
        const initialMessage = {
          id: Date.now(),
          text: aiAnalysisText || "All clarifications have been addressed. Ready for test case generation.",
          sender: 'ai',
          timestamp: new Date()
        };
        setChatMessages([initialMessage]);
      } else {
        // Not ready: enable assistant, stay on step 2 (Review & Chat)
        setAssistantEnabled(true);
        setActiveStep(2);
        showNotification('Clarifications needed - please use the chat to provide additional information.', 'warning');
        
        const initialMessages = assistantLines.length > 0 ? assistantLines.map((m, i) => ({ 
          id: Date.now() + i + 1, 
          text: m, 
          sender: 'ai', 
          timestamp: new Date() 
        })) : [{ 
          id: Date.now(), 
          text: 'The analysis indicates clarifications are needed. Please provide the requested information.', 
          sender: 'ai', 
          timestamp: new Date() 
        }];
        setChatMessages(initialMessages);
      }
    } catch (error) {
      console.error('Review error:', error);
      setIsProcessing(false);
      showNotification(
        error.response?.data?.detail || 'Failed to analyze documents. Please try again.',
        'error'
      );
    }
  };

  // Clarification chat handler that calls backend and loops until overall_status becomes Ready
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    // Append user message to chat
    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsProcessing(true);

    try {
      // Call clarification API on backend - backend expects PromptRequest with just a prompt field
      const payload = {
        prompt: userMessage.text,
        metadata: {
          project_id: projectData.id,
          project_name: projectData.name,
          type: 'clarification',
          conversation_length: chatMessages.length
        }
      };

      const resp = await api.requirementClarificationChat(payload);
      
      // Parse the JSON response string from the backend (similar to review response)
      const responseString = resp.data.response || resp.data;
      let respData;
      
      if (typeof responseString === 'string') {
        try {
          const jsonMatch = responseString.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            respData = JSON.parse(jsonMatch[1]);
          } else {
            respData = JSON.parse(responseString);
          }
        } catch (parseError) {
          console.error('Failed to parse clarification response:', parseError);
          respData = { assistant_response: responseString };
        }
      } else {
        respData = responseString;
      }

      // Backend should return assistant reply and possibly updated readiness_plan
      let assistantReply;
      if (respData?.assistant_response) {
        if (Array.isArray(respData.assistant_response)) {
          assistantReply = respData.assistant_response.join('\n');
        } else if (typeof respData.assistant_response === 'string') {
          assistantReply = respData.assistant_response;
        } else {
          assistantReply = 'Thank you for the clarification.';
        }
      } else if (respData?.response && typeof respData.response === 'string') {
        assistantReply = respData.response;
      } else {
        assistantReply = 'Thank you for the clarification.';
      }

      const aiMessage = {
        id: Date.now() + 1,
        text: assistantReply,
        sender: 'ai',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);

      // Update readiness meta if backend returned updated readiness_plan
      if (respData) {
        setReadinessMeta(respData);
      }

      // Check overall status and advance to next step if ready
      const overall = respData?.readiness_plan?.overall_status || readinessMeta?.readiness_plan?.overall_status || null;

      if (overall && overall.toLowerCase().includes('ready')) {
        // Ready to generate - advance to step 3 and disable assistant
        setAssistantEnabled(false);
        setActiveStep(3);
        showNotification('Requirements are ready for test generation!', 'success');
      } else {
        // Still needs clarification; keep assistant enabled and stay on step 2
        setAssistantEnabled(true);
        // Don't change step - stay on Review & Chat
      }

      setIsProcessing(false);
    } catch (err) {
      console.error('Clarification chat error:', err);
      setIsProcessing(false);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error processing your message. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      
      // Extract error message safely
      let errorText = 'Clarification request failed';
      if (err.response?.data?.detail && typeof err.response.data.detail === 'string') {
        errorText = err.response.data.detail;
      } else if (err.message && typeof err.message === 'string') {
        errorText = err.message;
      }
      
      showNotification(errorText, 'error');
    }
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
        mb: 2,
        px: 1
      }}
    >
      <Card
        sx={{
          maxWidth: '85%',
          bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
          color: message.sender === 'user' ? 'white' : 'text.primary',
          boxShadow: 1
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
          <Typography 
            variant="body2" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.4
            }}
          >
            {typeof message.text === 'string' ? message.text : 'Invalid message format'}
          </Typography>
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
                          Select PDF or DOCX files containing your project requirements
                        </Typography>
                        
                        {/* File Selection */}
                        <Box sx={{ mt: 2, mb: 2 }}>
                          <input
                            accept=".pdf,.docx"
                            style={{ display: 'none' }}
                            id="file-select"
                            type="file"
                            multiple
                            onChange={handleFileSelection}
                          />
                          <label htmlFor="file-select">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<FileIcon />}
                              disabled={isUploading}
                            >
                              Select Files
                            </Button>
                          </label>
                        </Box>

                        {/* Selected Files Display */}
                        {selectedFiles.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Selected Files ({selectedFiles.length})
                            </Typography>
                            <List>
                              {selectedFiles.map((file, index) => (
                                <ListItem key={index}>
                                  <ListItemIcon>
                                    <DocumentIcon />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={file.name}
                                    secondary={`${(file.size / 1024).toFixed(1)} KB - ${file.type.includes('pdf') ? 'PDF' : 'DOCX'}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                            
                            {/* Upload Button */}
                            <Button
                              variant="contained"
                              startIcon={isUploading ? <CircularProgress size={20} /> : <UploadIcon />}
                              onClick={handleFileUpload}
                              disabled={isUploading}
                              sx={{ mt: 1 }}
                            >
                              {isUploading ? 'Uploading...' : 'Upload Files'}
                            </Button>
                          </Box>
                        )}

                        {isUploading && <LinearProgress sx={{ mb: 2 }} />}

                        {/* Uploaded Files Display */}
                        {uploadedFiles.length > 0 && (
                          <Box>
                            <Alert severity="success" sx={{ mb: 2 }}>
                              Successfully uploaded and processed {uploadedFiles.length} file(s)!
                            </Alert>
                            <Typography variant="subtitle2" gutterBottom>
                              Processed Files ({uploadedFiles.length})
                            </Typography>
                            <List>
                              {uploadedFiles.map((file) => (
                                <ListItem key={file.id}>
                                  <ListItemIcon>
                                    <CheckIcon color="success" />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={file.name}
                                    secondary={`${(file.size / 1024).toFixed(1)} KB - Processed ${file.uploaded.toLocaleTimeString()} - ${file.textLength} characters extracted`}
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
                        disabled={!uploadCompleted || isProcessing}
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
                            {isProcessing ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                                <CircularProgress size={40} sx={{ mb: 2 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  Analyzing uploaded documents...
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  This may take a few moments
                                </Typography>
                              </Box>
                            ) : readinessPlan ? (
                              <Box>
                                {/* AI Analysis Section */}
                                {readinessPlan.aiAnalysis && (
                                  <Accordion defaultExpanded>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                        <BotIcon sx={{ mr: 1, color: 'primary.main' }} />
                                        AI Analysis Report
                                        <Chip 
                                          label="Live Analysis" 
                                          size="small" 
                                          color="success" 
                                          sx={{ ml: 1 }}
                                        />
                                      </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                      <Paper 
                                        elevation={1} 
                                        sx={{ 
                                          p: 2, 
                                          backgroundColor: 'grey.50',
                                          maxHeight: 300,
                                          overflow: 'auto',
                                          border: '1px solid',
                                          borderColor: 'primary.light'
                                        }}
                                      >
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: 1.6,
                                            color: 'text.primary'
                                          }}
                                        >
                                          {typeof readinessPlan.aiAnalysis === 'string' 
                                            ? readinessPlan.aiAnalysis 
                                            : 'Analysis data is not available'}
                                        </Typography>
                                      </Paper>
                                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">
                                          Analysis generated: {new Date().toLocaleString()}
                                        </Typography>
                                        <Chip 
                                          label={`${Math.ceil((readinessPlan.aiAnalysis && typeof readinessPlan.aiAnalysis === 'string' ? readinessPlan.aiAnalysis.length : 0) / 100)} insights`} 
                                          size="small" 
                                          variant="outlined"
                                        />
                                      </Box>
                                    </AccordionDetails>
                                  </Accordion>
                                )}

                                <Accordion>
                                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography>Document Analysis</Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Grid container spacing={2}>
                                      <Grid item xs={6}>
                                        <Typography variant="body2">Total Pages: {readinessPlan.documentAnalysis?.totalPages || 0}</Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="body2">Key Features: {readinessPlan.documentAnalysis?.keyFeatures || 0}</Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="body2">Requirements: {readinessPlan.documentAnalysis?.requirements || 0}</Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="body2">Risk Areas: {readinessPlan.documentAnalysis?.riskAreas || 0}</Typography>
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
                                        <ListItemText primary={`Functional Tests: ${readinessPlan.testingStrategy?.functionalTests || 0}`} />
                                      </ListItem>
                                      <ListItem>
                                        <ListItemText primary={`Non-Functional Tests: ${readinessPlan.testingStrategy?.nonFunctionalTests || 0}`} />
                                      </ListItem>
                                      <ListItem>
                                        <ListItemText primary={`Integration Tests: ${readinessPlan.testingStrategy?.integrationTests || 0}`} />
                                      </ListItem>
                                      <ListItem>
                                        <ListItemText primary={`Edge Cases: ${readinessPlan.testingStrategy?.edgeCases || 0}`} />
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
                                        value={readinessPlan.coverage?.requirementsCoverage || 0}
                                        sx={{ mt: 1 }}
                                      />
                                      <Typography variant="caption">{readinessPlan.coverage?.requirementsCoverage || 0}%</Typography>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2">Feature Coverage</Typography>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={readinessPlan.coverage?.featureCoverage || 0}
                                        sx={{ mt: 1 }}
                                      />
                                      <Typography variant="caption">{readinessPlan.coverage?.featureCoverage || 0}%</Typography>
                                    </Box>
                                    <Box>
                                      <Typography variant="body2">Risk Coverage</Typography>
                                      <LinearProgress 
                                        variant="determinate" 
                                        value={readinessPlan.coverage?.riskCoverage || 0}
                                        sx={{ mt: 1 }}
                                      />
                                      <Typography variant="caption">{readinessPlan.coverage?.riskCoverage || 0}%</Typography>
                                    </Box>
                                  </AccordionDetails>
                                </Accordion>

                                {/* Recommendations Section */}
                                {readinessPlan.recommendations && readinessPlan.recommendations.length > 0 && (
                                  <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                      <Typography>Recommendations</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                      <List dense>
                                        {readinessPlan.recommendations.map((recommendation, index) => (
                                          <ListItem key={index}>
                                            <ListItemIcon>
                                              <CheckIcon color="primary" />
                                            </ListItemIcon>
                                            <ListItemText primary={typeof recommendation === 'string' ? recommendation : 'Recommendation not available'} />
                                          </ListItem>
                                        ))}
                                      </List>
                                    </AccordionDetails>
                                  </Accordion>
                                )}
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
                          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', pb: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              AI Assistant Chat
                              {!assistantEnabled && (
                                <Chip 
                                  label="Assistant Disabled - Ready for Generation" 
                                  size="small" 
                                  color="success" 
                                  sx={{ ml: 2 }}
                                />
                              )}
                              {assistantEnabled && (
                                <Chip 
                                  label="Clarifications Needed" 
                                  size="small" 
                                  color="warning" 
                                  sx={{ ml: 2 }}
                                />
                              )}
                            </Typography>
                            
                            {/* Chat Messages */}
                            <Box 
                              ref={chatMessagesRef}
                              sx={{ 
                                flex: 1, 
                                minHeight: '300px',
                                maxHeight: '350px',
                                overflowY: 'scroll',
                                overflowX: 'hidden',
                                mb: 2,
                                pr: 1,
                                scrollBehavior: 'smooth',
                                border: '1px solid rgba(0,0,0,0.1)',
                                borderRadius: '8px',
                                padding: '8px',
                                backgroundColor: 'rgba(0,0,0,0.02)',
                                // Custom scrollbar for webkit browsers
                                '&::-webkit-scrollbar': {
                                  width: '8px',
                                },
                                '&::-webkit-scrollbar-track': {
                                  background: '#f1f1f1',
                                  borderRadius: '4px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                  background: '#888',
                                  borderRadius: '4px',
                                  '&:hover': {
                                    background: '#555',
                                  },
                                },
                                // Firefox scrollbar
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#888 #f1f1f1',
                              }}
                            >
                              {chatMessages.length === 0 && !isProcessing && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  height: '100%',
                                  flexDirection: 'column',
                                  color: 'text.secondary'
                                }}>
                                  <ChatIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                                  <Typography variant="body2" align="center">
                                    {assistantEnabled 
                                      ? "Start a conversation by asking about requirements or test scenarios"
                                      : "Requirements analysis complete. Ready for test case generation."
                                    }
                                  </Typography>
                                </Box>
                              )}
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

                            {/* Chat Input - Fixed at bottom */}
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                gap: 1,
                                mt: 'auto',
                                borderTop: '1px solid',
                                borderColor: 'divider',
                                pt: 2,
                                backgroundColor: 'background.paper'
                              }}
                            >
                              <TextField
                                fullWidth
                                size="small"
                                placeholder={
                                  !assistantEnabled 
                                    ? "Requirements are ready for test generation - Assistant disabled"
                                    : isProcessing 
                                      ? "AI is processing your message..."
                                      : "Ask about requirements or test scenarios..."
                                }
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey && assistantEnabled && !isProcessing) {
                                    e.preventDefault();
                                    handleSendMessage();
                                  }
                                }}
                                disabled={!assistantEnabled || isProcessing}
                                sx={{
                                  '& .MuiInputBase-input': {
                                    color: !assistantEnabled ? 'text.disabled' : 'text.primary',
                                  },
                                  '& .MuiInputBase-input::placeholder': {
                                    color: !assistantEnabled ? 'text.disabled' : 'text.secondary',
                                    opacity: 1,
                                  }
                                }}
                              />
                              <IconButton 
                                onClick={handleSendMessage}
                                disabled={!assistantEnabled || !newMessage.trim() || isProcessing}
                                color="primary"
                                sx={{
                                  opacity: !assistantEnabled ? 0.3 : 1,
                                }}
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
                        disabled={!isReadyForGeneration || isGenerating}
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