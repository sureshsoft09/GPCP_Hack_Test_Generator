import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as ReportIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';

const AnalyticsReport = () => {
  const [selectedProject, setSelectedProject] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const colors = ['#667eea', '#764ba2', '#4caf50', '#f44336', '#ff9800', '#2196f3', '#9c27b0', '#00bcd4'];

  useEffect(() => {
    if (selectedProject) {
      loadAnalyticsData();
    }
  }, [selectedProject, dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analytics/project/${selectedProject}`, {
        params: { date_range: dateRange }
      });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      showNotification('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const response = await api.post(`/analytics/generate-report`, {
        project_id: selectedProject,
        date_range: dateRange,
      });

      // Download the report
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${selectedProject}-${dateRange}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      showNotification('Report generated and downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating report:', error);
      showNotification('Failed to generate report', 'error');
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = '#667eea', trend = null }) => (
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
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon 
                  sx={{ 
                    fontSize: 16, 
                    color: trend > 0 ? '#4caf50' : '#f44336',
                    mr: 0.5 
                  }} 
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: trend > 0 ? '#4caf50' : '#f44336',
                    fontWeight: 600 
                  }}
                >
                  {trend > 0 ? '+' : ''}{trend}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const mockData = {
    overview: {
      totalTestCases: 1247,
      completedTests: 856,
      pendingTests: 241,
      failedTests: 150,
      testCoverage: 78.5,
      complianceScore: 92.3,
    },
    trends: [
      { date: '2024-01-01', testCases: 120, coverage: 65, compliance: 88 },
      { date: '2024-01-08', testCases: 145, coverage: 68, compliance: 89 },
      { date: '2024-01-15', testCases: 178, coverage: 71, compliance: 90 },
      { date: '2024-01-22', testCases: 201, coverage: 74, compliance: 91 },
      { date: '2024-01-29', testCases: 234, coverage: 76, compliance: 92 },
    ],
    testTypeDistribution: [
      { name: 'Functional', value: 35, count: 436 },
      { name: 'Usability', value: 25, count: 312 },
      { name: 'Performance', value: 20, count: 249 },
      { name: 'Security', value: 12, count: 150 },
      { name: 'Integration', value: 8, count: 100 },
    ],
    complianceBreakdown: [
      { standard: 'FDA 21 CFR Part 820', coverage: 95, testCases: 456 },
      { standard: 'IEC 62304', coverage: 88, testCases: 234 },
      { standard: 'ISO 13485', coverage: 92, testCases: 345 },
      { standard: 'HIPAA', coverage: 78, testCases: 212 },
    ],
    riskAssessment: [
      { level: 'Critical', count: 45, percentage: 3.6 },
      { level: 'High', count: 123, percentage: 9.9 },
      { level: 'Medium', count: 567, percentage: 45.5 },
      { level: 'Low', count: 512, percentage: 41.0 },
    ],
    recentActivity: [
      { id: 1, type: 'test_case_created', title: 'New test case created', description: 'User Authentication Flow', timestamp: '2024-01-30T10:30:00Z' },
      { id: 2, type: 'test_completed', title: 'Test execution completed', description: 'Patient Data Validation Suite', timestamp: '2024-01-30T09:15:00Z' },
      { id: 3, type: 'compliance_updated', title: 'Compliance standards updated', description: 'FDA 21 CFR Part 820 requirements', timestamp: '2024-01-30T08:45:00Z' },
      { id: 4, type: 'enhancement_applied', title: 'Test enhancement applied', description: 'Security testing improvements', timestamp: '2024-01-30T08:00:00Z' },
    ],
  };

  const currentData = analyticsData || mockData;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>Loading Analytics...</Typography>
      </Box>
    );
  }

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
          Analytics & Reports
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive insights and reporting for your healthcare test management
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
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                label="Date Range"
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
                <MenuItem value="1y">Last year</MenuItem>
                <MenuItem value="all">All time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadAnalyticsData}
                disabled={!selectedProject}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={generateReport}
                disabled={!selectedProject}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  },
                }}
              >
                Generate Report
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {selectedProject ? (
        <Grid container spacing={3}>
          {/* Overview Statistics */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Overview Statistics
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Test Cases"
                  value={currentData.overview.totalTestCases}
                  subtitle="All test cases"
                  icon={<ReportIcon />}
                  color="#667eea"
                  trend={12.5}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Completed Tests"
                  value={currentData.overview.completedTests}
                  subtitle="Successfully executed"
                  icon={<CheckIcon />}
                  color="#4caf50"
                  trend={8.3}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Test Coverage"
                  value={`${currentData.overview.testCoverage}%`}
                  subtitle="Coverage percentage"
                  icon={<PieChartIcon />}
                  color="#ff9800"
                  trend={3.2}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Compliance Score"
                  value={`${currentData.overview.complianceScore}%`}
                  subtitle="Standards compliance"
                  icon={<TrendingUpIcon />}
                  color="#764ba2"
                  trend={5.1}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Trends Chart */}
          <Grid item xs={12} lg={8}>
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Test Case Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={currentData.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(102, 126, 234, 0.1)" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="testCases"
                    stackId="1"
                    stroke="#667eea"
                    fill="url(#colorTestCases)"
                    name="Test Cases"
                  />
                  <Area
                    type="monotone"
                    dataKey="coverage"
                    stackId="2"
                    stroke="#764ba2"
                    fill="url(#colorCoverage)"
                    name="Coverage %"
                  />
                  <defs>
                    <linearGradient id="colorTestCases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#764ba2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#764ba2" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Test Type Distribution */}
          <Grid item xs={12} lg={4}>
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Test Type Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={currentData.testTypeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {currentData.testTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Compliance Breakdown */}
          <Grid item xs={12} lg={6}>
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Compliance Standards Coverage
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={currentData.complianceBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(102, 126, 234, 0.1)" />
                  <XAxis dataKey="standard" stroke="#666" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#666" />
                  <Tooltip />
                  <Bar dataKey="coverage" fill="url(#colorCompliance)" />
                  <defs>
                    <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#764ba2" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Risk Assessment */}
          <Grid item xs={12} lg={6}>
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.9) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Risk Assessment Distribution
              </Typography>
              <Box>
                {currentData.riskAssessment.map((risk, index) => (
                  <Box key={risk.level} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {risk.level} Risk
                      </Typography>
                      <Typography variant="body2">
                        {risk.count} ({risk.percentage}%)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${risk.percentage}%`,
                          height: '100%',
                          background: colors[index % colors.length],
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12}>
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
              <List>
                {currentData.recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: `${colors[index % colors.length]}20`,
                            color: colors[index % colors.length],
                            width: 40,
                            height: 40,
                          }}
                        >
                          {activity.type === 'test_case_created' && <ReportIcon />}
                          {activity.type === 'test_completed' && <CheckIcon />}
                          {activity.type === 'compliance_updated' && <WarningIcon />}
                          {activity.type === 'enhancement_applied' && <TrendingUpIcon />}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={`${activity.description} • ${new Date(activity.timestamp).toLocaleDateString()}`}
                        primaryTypographyProps={{
                          fontWeight: 600,
                        }}
                      />
                    </ListItem>
                    {index < currentData.recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AnalyticsIcon sx={{ fontSize: 96, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            Select a Project to View Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose a project from the dropdown above to see detailed analytics and reports
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AnalyticsReport;