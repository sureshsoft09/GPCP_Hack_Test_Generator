import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Tune as EnhanceIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as TestCaseIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  TrendingUp as ImprovementIcon,
  Security as SecurityIcon,
  Speed as PerformanceIcon,
  Accessibility as AccessibilityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AutoAwesome as AIIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';

const EnhanceTestCases = () => {
  const [selectedProject, setSelectedProject] = useState('');
  const [testCases, setTestCases] = useState([]);
  const [filteredTestCases, setFilteredTestCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [enhancementSuggestions, setEnhancementSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkEnhanceOptions, setBulkEnhanceOptions] = useState({
    security: true,
    performance: true,
    accessibility: true,
    compliance: true,
  });
  const { showNotification } = useNotification();

  const enhancementTypes = [
    { key: 'security', label: 'Security Enhancement', icon: <SecurityIcon />, color: '#f44336' },
    { key: 'performance', label: 'Performance Testing', icon: <PerformanceIcon />, color: '#ff9800' },
    { key: 'accessibility', label: 'Accessibility Compliance', icon: <AccessibilityIcon />, color: '#2196f3' },
    { key: 'coverage', label: 'Coverage Improvement', icon: <ImprovementIcon />, color: '#4caf50' },
  ];

  useEffect(() => {
    if (selectedProject) {
      loadTestCases();
    }
  }, [selectedProject]);

  useEffect(() => {
    filterTestCases();
  }, [testCases, searchTerm, selectedTab]);

  const loadTestCases = async () => {
    try {
      const response = await api.get(`/projects/${selectedProject}/test-cases`);
      setTestCases(response.data || []);
    } catch (error) {
      console.error('Error loading test cases:', error);
      showNotification('Failed to load test cases', 'error');
    }
  };

  const filterTestCases = () => {
    let filtered = testCases;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(tc =>
        tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tab (enhancement type)
    if (selectedTab > 0) {
      const enhancementType = enhancementTypes[selectedTab - 1]?.key;
      filtered = filtered.filter(tc =>
        tc.enhancementNeeded?.includes(enhancementType)
      );
    }

    setFilteredTestCases(filtered);
  };

  const analyzeTestCases = async () => {
    if (!selectedProject) {
      showNotification('Please select a project first', 'warning');
      return;
    }

    try {
      setIsAnalyzing(true);
      const response = await api.post(`/analyze-test-cases`, {
        project_id: selectedProject,
        enhancement_types: Object.keys(bulkEnhanceOptions).filter(key => bulkEnhanceOptions[key]),
      });

      setEnhancementSuggestions(response.data.suggestions || []);
      
      // Update test cases with enhancement flags
      const updatedTestCases = testCases.map(tc => {
        const suggestion = response.data.suggestions.find(s => s.testCaseId === tc.id);
        return suggestion ? { ...tc, ...suggestion } : tc;
      });
      
      setTestCases(updatedTestCases);
      showNotification('Analysis completed successfully!', 'success');
    } catch (error) {
      console.error('Error analyzing test cases:', error);
      showNotification('Failed to analyze test cases', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const enhanceTestCase = async (testCaseId, enhancementType) => {
    try {
      const response = await api.post(`/enhance-test-case`, {
        test_case_id: testCaseId,
        enhancement_type: enhancementType,
      });

      // Update the test case in the list
      setTestCases(prev => prev.map(tc =>
        tc.id === testCaseId ? { ...tc, ...response.data.enhancedTestCase } : tc
      ));

      showNotification(`Test case enhanced with ${enhancementType} improvements`, 'success');
    } catch (error) {
      console.error('Error enhancing test case:', error);
      showNotification('Failed to enhance test case', 'error');
    }
  };

  const saveTestCase = async (testCase) => {
    try {
      const response = await api.put(`/test-cases/${testCase.id}`, testCase);
      
      setTestCases(prev => prev.map(tc =>
        tc.id === testCase.id ? response.data : tc
      ));

      setEditDialogOpen(false);
      setEditingTestCase(null);
      showNotification('Test case updated successfully', 'success');
    } catch (error) {
      console.error('Error saving test case:', error);
      showNotification('Failed to save test case', 'error');
    }
  };

  const TestCaseCard = ({ testCase }) => {
    const hasEnhancements = testCase.enhancementNeeded?.length > 0;
    const severity = testCase.enhancementSeverity || 'medium';

    return (
      <Card
        sx={{
          mb: 2,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
          border: hasEnhancements
            ? `2px solid ${severity === 'high' ? '#f44336' : severity === 'medium' ? '#ff9800' : '#4caf50'}`
            : '1px solid rgba(102, 126, 234, 0.1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.12)',
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {testCase.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {testCase.description}
              </Typography>
              
              {/* Enhancement Chips */}
              {hasEnhancements && (
                <Box sx={{ mb: 2 }}>
                  {testCase.enhancementNeeded.map((enhancement) => {
                    const type = enhancementTypes.find(t => t.key === enhancement);
                    return (
                      <Chip
                        key={enhancement}
                        label={type?.label || enhancement}
                        icon={type?.icon}
                        size="small"
                        sx={{
                          mr: 1,
                          mb: 1,
                          backgroundColor: `${type?.color}20`,
                          color: type?.color,
                          '& .MuiChip-icon': { color: type?.color },
                        }}
                      />
                    );
                  })}
                </Box>
              )}

              {/* Enhancement Suggestions */}
              {testCase.suggestions && (
                <Alert 
                  severity={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info'} 
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">
                    <strong>AI Suggestions:</strong> {testCase.suggestions}
                  </Typography>
                </Alert>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
              <IconButton
                onClick={() => {
                  setEditingTestCase(testCase);
                  setEditDialogOpen(true);
                }}
                color="primary"
                size="small"
              >
                <EditIcon />
              </IconButton>
              
              {hasEnhancements && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AIIcon />}
                  onClick={() => enhanceTestCase(testCase.id, testCase.enhancementNeeded[0])}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
                >
                  Enhance
                </Button>
              )}
            </Box>
          </Box>

          {/* Test Case Details */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Test Case Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Priority:</strong> {testCase.priority}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Type:</strong> {testCase.type}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Preconditions:</strong> {testCase.preconditions}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Expected Result:</strong> {testCase.expectedResult}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  const EditTestCaseDialog = () => {
    const [editedTestCase, setEditedTestCase] = useState(editingTestCase);

    useEffect(() => {
      setEditedTestCase(editingTestCase);
    }, [editingTestCase]);

    if (!editedTestCase) return null;

    return (
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Test Case</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={editedTestCase.title || ''}
              onChange={(e) => setEditedTestCase(prev => ({ ...prev, title: e.target.value }))}
              sx={{ mb: 3 }}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={editedTestCase.description || ''}
              onChange={(e) => setEditedTestCase(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 3 }}
            />

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={editedTestCase.priority || 'medium'}
                    onChange={(e) => setEditedTestCase(prev => ({ ...prev, priority: e.target.value }))}
                    label="Priority"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={editedTestCase.type || 'functional'}
                    onChange={(e) => setEditedTestCase(prev => ({ ...prev, type: e.target.value }))}
                    label="Type"
                  >
                    <MenuItem value="functional">Functional</MenuItem>
                    <MenuItem value="usability">Usability</MenuItem>
                    <MenuItem value="performance">Performance</MenuItem>
                    <MenuItem value="security">Security</MenuItem>
                    <MenuItem value="integration">Integration</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Preconditions"
              multiline
              rows={2}
              value={editedTestCase.preconditions || ''}
              onChange={(e) => setEditedTestCase(prev => ({ ...prev, preconditions: e.target.value }))}
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              label="Expected Result"
              multiline
              rows={2}
              value={editedTestCase.expectedResult || ''}
              onChange={(e) => setEditedTestCase(prev => ({ ...prev, expectedResult: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => saveTestCase(editedTestCase)}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
              },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Enhance Test Cases
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Analyze and improve existing test cases with AI-powered suggestions
        </Typography>
      </Box>

      {/* Controls */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                label="Select Project"
              >
                <MenuItem value="project1">MedDevice Pro v2.0</MenuItem>
                <MenuItem value="project2">CardioMonitor System</MenuItem>
                <MenuItem value="project3">DiagnosticHub Platform</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search test cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              startIcon={<AIIcon />}
              onClick={analyzeTestCases}
              disabled={isAnalyzing || !selectedProject}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Test Cases'}
            </Button>
          </Grid>
        </Grid>

        {isAnalyzing && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              sx={{
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                },
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              AI is analyzing test cases for potential improvements...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Enhancement Options */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Enhancement Options
        </Typography>
        <Grid container spacing={2}>
          {enhancementTypes.map((type) => (
            <Grid item xs={12} sm={6} md={3} key={type.key}>
              <Card
                onClick={() => setBulkEnhanceOptions(prev => ({
                  ...prev,
                  [type.key]: !prev[type.key]
                }))}
                sx={{
                  cursor: 'pointer',
                  border: bulkEnhanceOptions[type.key]
                    ? `2px solid ${type.color}`
                    : '1px solid rgba(102, 126, 234, 0.1)',
                  backgroundColor: bulkEnhanceOptions[type.key]
                    ? `${type.color}10`
                    : 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.12)',
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: `${type.color}20`,
                      color: type.color,
                      mx: 'auto',
                      mb: 1,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {type.icon}
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {type.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Test Cases */}
      <Paper
        sx={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
        }}
      >
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="All Test Cases" />
            {enhancementTypes.map((type) => (
              <Tab key={type.key} label={type.label} />
            ))}
          </Tabs>
        </Box>

        {/* Test Cases List */}
        <Box sx={{ p: 3 }}>
          {filteredTestCases.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <TestCaseIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                {selectedProject ? 'No test cases found' : 'Select a project to view test cases'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'Try adjusting your search criteria' : 'Upload documents and generate test cases first'}
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {filteredTestCases.length} Test Case{filteredTestCases.length !== 1 ? 's' : ''} Found
              </Typography>
              {filteredTestCases.map((testCase) => (
                <TestCaseCard key={testCase.id} testCase={testCase} />
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Edit Dialog */}
      <EditTestCaseDialog />
    </Box>
  );
};

export default EnhanceTestCases;