import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Button, Stack, Divider, Alert } from '@mui/material';
import { Power, PowerOff, AddCircleOutline, History } from '@mui/icons-material';
import ExportButton from '../components/ExportButton';

// Date formatting function
const formatDate = (isoString) => {
  if (!isoString) return "Never";
  return new Date(isoString).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const dashboardCardStyle = {
  minWidth: 260,
  maxWidth: 340,
  // minHeight: 260,
  // maxHeight: 260,
  height: 260,
  display: 'flex',
  flexDirection: 'column',
  margin: 2,
  borderRadius: 2,
  border: '1px solid white',
};

function getActivityMessage(item) {
  // Compose a readable message based on type, target, name, and details
  switch (item.type) {
    case 'service':
      if (item.target === 'add') return `Service "${item.name}" was added.`;
      if (item.target === 'edit') return `Service "${item.name}" was edited.`;
      if (item.target === 'delete') return `Service "${item.name}" was deleted.`;
      break;
    case 'template':
      if (item.target === 'add') return `Template "${item.name}" was added.`;
      if (item.target === 'edit') return `Template "${item.name}" was edited.`;
      if (item.target === 'delete') return `Template "${item.name}" was deleted.`;
      break;
    case 'export':
      if (item.target === 'webhook') return `Export triggered via webhook (${item.name}).`;
      if (item.target === 'generator') return `Exported configuration files.`;
      break;
    case 'nginx':
      if (item.target === 'container') return `NGINX container "${item.name}" tested${item.result?.restarted ? ' and restarted' : ''}.`;
      break;
    case 'notification':
      if (item.target === 'pushbullet') return `Notification sent: ${item.name}`;
      break;
    case 'error':
      return `Error in ${item.target}${item.name ? ` (${item.name})` : ''}.`;
    default:
      return item.message || 'Unknown activity.';
  }
}

// ...existing code...

function DashboardPage() {
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Le hook useEffect pour récupérer les données reste le même
  useEffect(() => {
    const fetchData = async () => {
      let statsData = null;
      let statusData = null;
      let activityData = [];
      let lastExportData = null;
      let errorMsg = null;
      try {
        const [statsRes, statusRes, activityRes, lastExportRes] = await Promise.all([
          fetch('/api/stats').catch(() => null),
          fetch('/api/settings/status').catch(() => null),
          fetch('/api/activity').catch(() => null),
          fetch('/api/export/last').catch(() => null)
        ]);

        if (statsRes && statsRes.ok) {
          statsData = await statsRes.json();
          console.log("Stats data:", statsData);
          setStats(statsData);
        } else {
          errorMsg = (errorMsg ? errorMsg + '\n' : '') + "Statistiques non chargées.";
        }
        if (statusRes && statusRes.ok) {
          statusData = await statusRes.json();
          setStatus(statusData);
        } else {
          errorMsg = (errorMsg ? errorMsg + '\n' : '') + "État du système non chargé.";
        }
        if (activityRes && activityRes.ok) {
          activityData = await activityRes.json();
          setActivity(activityData);
        } else {
          errorMsg = (errorMsg ? errorMsg + '\n' : '') + "Activité non chargée.";
        }
        if (lastExportRes && lastExportRes.ok) {
          lastExportData = await lastExportRes.json();
          setStatus(s => ({ ...s, lastExport: lastExportData[0]?.timestamp || null }));
        } else {
          errorMsg = (errorMsg ? errorMsg + '\n' : '') + "Dernier export non chargé.";
        }
        if (errorMsg) setError(errorMsg);
      } catch (err) {
  setError("Unable to load dashboard data. Please check API connectivity.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error as a non-blocking alert, but always render dashboard content
  return (
    <div className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
      {error && <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>}
        {/* === SYSTEM STATUS CARD === */}
          <Card elevation={4} sx={dashboardCardStyle}>
            <Box sx={{ px: 2, pt: 1.2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">System Status</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1 }}>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {status?.running ? (
                    <Power color="success" sx={{ mr: 1 }} />
                  ) : (
                    <PowerOff color="error" sx={{ mr: 1 }} />
                  )}
                  <Typography>NGINX: {status.running ? 'Active' : 'Stopped'}</Typography>
                </Box>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  Last export: {formatDate(status.lastExport)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

        {/* === STATISTICS CARD === */}
          <Card elevation={4} sx={dashboardCardStyle}>
            <Box sx={{ px: 2, pt: 1.2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">Statistics</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1 }}>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant="h5">{stats.enabledServices || 0} <span style={{fontSize: '1rem', color: '#888'}}>Active services</span></Typography>
                <Divider />
                <Typography variant="h5">{(stats.totalServices || 0) - (stats.enabledServices || 0)} <span style={{fontSize: '1rem', color: '#888'}}>Inactive services</span></Typography>
                <Divider />
                <Typography variant="h5">{stats.totalTemplates || 0} <span style={{fontSize: '1rem', color: '#888'}}>Templates</span></Typography>
              </Stack>
            </CardContent>
          </Card>

        {/* === QUICK ACTIONS CARD === */}
          <Card elevation={4} sx={dashboardCardStyle}>
            <Box sx={{ px: 2, pt: 1.2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6">Quick Actions</Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <Stack spacing={2} sx={{ width: '100%' }}>
                <ExportButton />
                <Button variant="outlined" startIcon={<AddCircleOutline />}>Add Service</Button>
                <Button variant="outlined" startIcon={<AddCircleOutline />}>Add Template</Button>
              </Stack>
            </CardContent>
          </Card>
        
        {/* === RECENT ACTIVITY CARD === */}
          <Card elevation={4} sx={dashboardCardStyle}>
            <Box sx={{ px: 2, pt: 1.2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <History />
                <Typography variant="h6">Recent Activity</Typography>
              </Stack>
            </Box>
            <CardContent sx={{ overflowY: 'auto', p: 0 }}>
              <Stack spacing={1.5} sx={{ p: 2 }}>
                {activity.length > 0 ? (
                  activity.slice(0, 5).reverse().map((item, index) => (
                    <Box key={index}>
                      <Typography variant="body1">{getActivityMessage(item)}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDate(item.timestamp)}</Typography>
                      {index < Math.min(activity.length, 5) - 1 && <Divider sx={{ mt: 1.5 }} />}
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">No recent activity to display.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
    </div>
  );
}

export default DashboardPage;