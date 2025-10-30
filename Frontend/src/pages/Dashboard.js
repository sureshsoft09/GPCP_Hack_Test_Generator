import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  LinearProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemButton,
  Collapse,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Folder as ProjectIcon,
  Assessment as EpicIcon,
  Functions as FeatureIcon,
  Assignment as UseCaseIcon,
  CheckCircle as TestCaseIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';
import ExportService from '../services/exportService';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [firestoreProjects, setFirestoreProjects] = useState([]);
  const [statistics, setStatistics] = useState({
    totalProjects: 0,
    totalTestCases: 0,
    completedTests: 0,
    pendingTests: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectHierarchy, setProjectHierarchy] = useState(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [modelExplanationDialog, setModelExplanationDialog] = useState({
    open: false,
    title: '',
    explanation: '',
    loading: false,
  });
  const [exportMenu, setExportMenu] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const { showNotification } = useNotification();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load both regular projects and Firestore projects
      const [projectsResponse, firestoreResponse, statsResponse, activityResponse] = await Promise.all([
        api.get('/projects').catch(() => ({ data: [] })),
        api.get('/api/projects').catch(() => ({ data: { projects: [] } })),
        api.get('/api/statistics').catch(() => ({ data: { statistics: {} } })),
        api.get('/analytics/recent-activity').catch(() => ({ data: [] })),
      ]);

      // Set regular projects
      const projectsData = projectsResponse.data;
      setProjects(Array.isArray(projectsData) ? projectsData : []);

      // Set Firestore projects
      const firestoreData = firestoreResponse.data.projects || [];
      setFirestoreProjects(Array.isArray(firestoreData) ? firestoreData : []);

      // Update statistics to include Firestore data
      const apiStats = statsResponse.data.statistics || {};
      const firestoreStats = {
        totalProjects: (projectsData?.length || 0) + (firestoreData?.length || 0),
        totalTestCases: apiStats.total_test_cases || (firestoreData || []).reduce((sum, project) => sum + (project.total_test_cases || 0), 0),
        totalEpics: apiStats.total_epics || 0,
        totalFeatures: apiStats.total_features || 0,
        totalUseCases: apiStats.total_use_cases || 0,
        completedTests: Math.floor((apiStats.total_test_cases || 0) * 0.8),
        pendingTests: Math.floor((apiStats.total_test_cases || 0) * 0.2),
      };
      
      setStatistics({ ...statsResponse.data, ...firestoreStats });
      setRecentActivity(activityResponse.data || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectHierarchy = async (projectId) => {
    try {
      setHierarchyLoading(true);
      const response = await api.get(`/api/projects/${projectId}/hierarchy`);
      setProjectHierarchy(response.data.hierarchy);
    } catch (error) {
      console.error('Error loading project hierarchy:', error);
      showNotification('Failed to load project details', 'error');
    } finally {
      setHierarchyLoading(false);
    }
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    loadProjectHierarchy(project.project_id);
  };

  const handleCloseProject = () => {
    setSelectedProject(null);
    setProjectHierarchy(null);
    setExpandedItems({});
  };

  const handleModelExplanation = async (itemType, itemId, itemTitle) => {
    if (!selectedProject) return;

    setModelExplanationDialog({
      open: true,
      title: itemTitle,
      explanation: '',
      loading: true,
    });

    try {
      const response = await api.get(`/api/projects/${selectedProject.project_id}/model-explanation`, {
        params: { item_type: itemType, item_id: itemId }
      });
      
      setModelExplanationDialog(prev => ({
        ...prev,
        explanation: response.data.explanation,
        loading: false,
      }));
    } catch (error) {
      console.error('Error loading model explanation:', error);
      setModelExplanationDialog(prev => ({
        ...prev,
        explanation: 'Failed to load explanation',
        loading: false,
      }));
    }
  };

  const handleExport = async (format) => {
    if (!selectedProject) return;

    try {
      setExportLoading(true);
      setExportMenu(null);
      
      // Get project data for export using the new API
      const response = await api.get(`/api/projects/${selectedProject.project_id}/export-data`);
      const exportData = response.data.project;
      
      // Use the existing frontend ExportService
      const exportService = new ExportService();
      await exportService.exportProject(exportData, format);
      
      showNotification(`Project exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Error exporting project:', error);
      showNotification('Failed to export project', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const StatCard = ({ title, value, subtitle, icon, color = '#667eea' }) => (
    <Card
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: color, mb: 1 }}>
              {value}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const ProjectCard = ({ project, isFirestore = false }) => (
    <Card
      sx={{
        mb: 2,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
        border: '1px solid rgba(102, 126, 234, 0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: isFirestore ? 'pointer' : 'default',
        '&:hover': {
          transform: isFirestore ? 'translateY(-2px)' : 'none',
          boxShadow: isFirestore ? '0 6px 20px rgba(102, 126, 234, 0.12)' : 'none',
        },
      }}
      onClick={() => isFirestore && handleProjectSelect(project)}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: '#667eea20', color: '#667eea', mr: 2 }}>
              <ProjectIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {project.project_name || project.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {project.description || 'No description available'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isFirestore && (
              <Chip
                label="Firestore"
                color="primary"
                size="small"
                variant="outlined"
              />
            )}
            <Chip
              label={project.status || 'Active'}
              color={project.status === 'Active' ? 'success' : 'default'}
              size="small"
            />
          </Box>
        </Box>

        {isFirestore ? (
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="#667eea">
                  {project.total_epics || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Epics
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="#667eea">
                  {project.total_test_cases || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Test Cases
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProjectSelect(project);
                  }}
                >
                  View Details
                </Button>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Test Cases Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {project.completedTests || 0} / {project.totalTests || 0}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={project.totalTests ? (project.completedTests / project.totalTests) * 100 : 0}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(102, 126, 234, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 4,
                  },
                }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="#667eea">
                    {project.epics || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Epics
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="#667eea">
                    {project.features || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Features
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="#667eea">
                    {project.useCases || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Use Cases
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="#667eea">
                    {project.testCases || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Test Cases
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );

  const HierarchyItem = ({ item, type, level = 0 }) => {
    // Handle both field naming conventions - backend uses epic_id, feature_id, etc., frontend expects id
    const getId = () => {
      switch (type) {
        case 'epic': return item.epic_id || item.id;
        case 'feature': return item.feature_id || item.id;
        case 'use_case': return item.use_case_id || item.id;
        case 'test_case': return item.test_case_id || item.id;
        default: return item.id;
      }
    };
    
    const itemId = `${type}-${getId()}`;
    const isExpanded = expandedItems[itemId];
    const hasChildren = 
      (type === 'epic' && item.features?.length > 0) ||
      (type === 'feature' && item.use_cases?.length > 0) ||
      (type === 'use_case' && item.test_cases?.length > 0);

    const getIcon = () => {
      switch (type) {
        case 'epic': return <EpicIcon />;
        case 'feature': return <FeatureIcon />;
        case 'use_case': return <UseCaseIcon />;
        case 'test_case': return <TestCaseIcon />;
        default: return null;
      }
    };

    const getChildCount = () => {
      switch (type) {
        case 'epic': return item.features?.length || 0;
        case 'feature': return item.use_cases?.length || 0;
        case 'use_case': return item.test_cases?.length || 0;
        default: return 0;
      }
    };

    return (
      <Box sx={{ ml: level * 2 }}>
        <ListItem
          sx={{
            border: '1px solid rgba(102, 126, 234, 0.1)',
            borderRadius: 1,
            mb: 1,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              bgcolor: 'rgba(102, 126, 234, 0.05)',
            },
          }}
        >
          <ListItemIcon>
            <Avatar
              sx={{
                bgcolor: `${level === 0 ? '#667eea' : level === 1 ? '#764ba2' : level === 2 ? '#4caf50' : '#ff9800'}20`,
                color: level === 0 ? '#667eea' : level === 1 ? '#764ba2' : level === 2 ? '#4caf50' : '#ff9800',
                width: 32,
                height: 32,
              }}
            >
              {getIcon()}
            </Avatar>
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {item.title}
                </Typography>
                {hasChildren && (
                  <Badge badgeContent={getChildCount()} color="primary" />
                )}
              </Box>
            }
            secondary={
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {item.description}
              </Typography>
            }
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {item.model_explanation && (
              <Tooltip title="View AI Model Explanation">
                <IconButton
                  size="small"
                  onClick={() => handleModelExplanation(type, getId(), item.title)}
                  sx={{ color: '#667eea' }}
                >
                  <InfoIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {hasChildren && (
              <IconButton
                size="small"
                onClick={() => toggleExpanded(itemId)}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Box>
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded}>
            <Box sx={{ ml: 1 }}>
              {type === 'epic' && item.features?.map((feature) => (
                <HierarchyItem
                  key={feature.feature_id || feature.id}
                  item={feature}
                  type="feature"
                  level={level + 1}
                />
              ))}
              {type === 'feature' && item.use_cases?.map((useCase) => (
                <HierarchyItem
                  key={useCase.use_case_id || useCase.id}
                  item={useCase}
                  type="use_case"
                  level={level + 1}
                />
              ))}
              {type === 'use_case' && item.test_cases?.map((testCase) => (
                <HierarchyItem
                  key={testCase.test_case_id || testCase.id}
                  item={testCase}
                  type="test_case"
                  level={level + 1}
                />
              ))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Loading Dashboard...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  // Show project hierarchy view when a project is selected
  if (selectedProject && projectHierarchy) {
    return (
      <Box>
        {/* Project Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
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
              {projectHierarchy.project_name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {projectHierarchy.description || 'Project test case hierarchy'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Export Menu */}
            <Button
              variant="contained"
              startIcon={exportLoading ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={(e) => setExportMenu(e.currentTarget)}
              disabled={exportLoading}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                },
              }}
            >
              Export
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={handleCloseProject}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>

        {/* Project Statistics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Epics"
              value={projectHierarchy.epics?.length || 0}
              subtitle="Project epics"
              icon={<EpicIcon />}
              color="#667eea"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Features"
              value={projectHierarchy.epics?.reduce((sum, epic) => sum + (epic.features?.length || 0), 0) || 0}
              subtitle="Feature count"
              icon={<FeatureIcon />}
              color="#764ba2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Use Cases"
              value={projectHierarchy.epics?.reduce((sum, epic) => 
                sum + epic.features?.reduce((fSum, feature) => fSum + (feature.use_cases?.length || 0), 0), 0) || 0}
              subtitle="Total use cases"
              icon={<UseCaseIcon />}
              color="#4caf50"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Test Cases"
              value={projectHierarchy.total_test_cases || 0}
              subtitle="Total test cases"
              icon={<TestCaseIcon />}
              color="#ff9800"
            />
          </Grid>
        </Grid>

        {/* Hierarchical Structure */}
        <Paper
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
            border: '1px solid rgba(102, 126, 234, 0.1)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Project Hierarchy: Epics → Features → Use Cases → Test Cases
          </Typography>

          {hierarchyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {projectHierarchy.epics?.map((epic) => (
                <HierarchyItem
                  key={epic.epic_id || epic.id}
                  item={epic}
                  type="epic"
                  level={0}
                />
              ))}
            </List>
          )}
        </Paper>

        {/* Export Menu */}
        <Menu
          anchorEl={exportMenu}
          open={Boolean(exportMenu)}
          onClose={() => setExportMenu(null)}
        >
          <MenuItem onClick={() => handleExport('pdf')}>
            Export as PDF
          </MenuItem>
          <MenuItem onClick={() => handleExport('word')}>
            Export as Word Document
          </MenuItem>
          <MenuItem onClick={() => handleExport('xml')}>
            Export as XML
          </MenuItem>
          <MenuItem onClick={() => handleExport('markdown')}>
            Export as Markdown
          </MenuItem>
        </Menu>

        {/* Model Explanation Dialog */}
        <Dialog
          open={modelExplanationDialog.open}
          onClose={() => setModelExplanationDialog({ ...modelExplanationDialog, open: false })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            AI Model Explanation: {modelExplanationDialog.title}
          </DialogTitle>
          <DialogContent>
            {modelExplanationDialog.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {modelExplanationDialog.explanation}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModelExplanationDialog({ ...modelExplanationDialog, open: false })}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Main dashboard view
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
          Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Overview of your healthcare test management projects
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Projects"
            value={statistics.totalProjects}
            subtitle="Active projects"
            icon={<ProjectIcon />}
            color="#667eea"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Test Cases"
            value={statistics.totalTestCases}
            subtitle="Total test cases"
            icon={<TestCaseIcon />}
            color="#764ba2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={statistics.completedTests}
            subtitle="Tests completed"
            icon={<TrendingUpIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={statistics.pendingTests}
            subtitle="Tests pending"
            icon={<WarningIcon />}
            color="#ff9800"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Projects Section */}
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
              border: '1px solid rgba(102, 126, 234, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                All Projects
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  },
                }}
              >
                New Project
              </Button>
            </Box>

            {(!Array.isArray(projects) || projects.length === 0) && (!Array.isArray(firestoreProjects) || firestoreProjects.length === 0) ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <ProjectIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No projects yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first project to start managing test cases
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                  }}
                >
                  Create Project
                </Button>
              </Box>
            ) : (
              <Box>
                {/* Firestore Projects */}
                {Array.isArray(firestoreProjects) && firestoreProjects.length > 0 && (
                  <>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                      Test Case Projects (with Hierarchy)
                    </Typography>
                    {firestoreProjects.map((project) => (
                      <ProjectCard key={project.project_id} project={project} isFirestore={true} />
                    ))}
                  </>
                )}

                {/* Regular Projects */}
                {Array.isArray(projects) && projects.length > 0 && (
                  <>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, mt: 3, color: '#764ba2' }}>
                      Requirement Projects
                    </Typography>
                    {projects.map((project) => (
                      <ProjectCard key={project.id} project={project} isFirestore={false} />
                    ))}
                  </>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
              border: '1px solid rgba(102, 126, 234, 0.1)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Recent Activity
            </Typography>

            {recentActivity.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  No recent activity
                </Typography>
              </Box>
            ) : (
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: '#667eea20', color: '#667eea', width: 32, height: 32 }}>
                          {activity.type === 'project' && <ProjectIcon sx={{ fontSize: 16 }} />}
                          {activity.type === 'epic' && <EpicIcon sx={{ fontSize: 16 }} />}
                          {activity.type === 'feature' && <FeatureIcon sx={{ fontSize: 16 }} />}
                          {activity.type === 'usecase' && <UseCaseIcon sx={{ fontSize: 16 }} />}
                          {activity.type === 'testcase' && <TestCaseIcon sx={{ fontSize: 16 }} />}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title || activity.description}
                        secondary={activity.timestamp}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: 500,
                        }}
                        secondaryTypographyProps={{
                          fontSize: '0.8rem',
                        }}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;