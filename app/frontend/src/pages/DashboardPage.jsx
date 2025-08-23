import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Button, Stack, Divider, Alert } from '@mui/material';
import { Power, PowerOff, CheckCircleOutline, ErrorOutline, RocketLaunch, AddCircleOutline, History } from '@mui/icons-material';

// Une petite fonction pour formater les dates proprement
const formatDate = (isoString) => {
  if (!isoString) return "Jamais";
  return new Date(isoString).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // On utilise Promise.all pour lancer tous les appels réseau en parallèle
    const fetchData = async () => {
      try {
        const [statsRes, statusRes, activityRes, lastExportRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/settings/status'),
          fetch('/api/activity'),
          fetch('/api/export/last')
        ]);

        if (!statsRes.ok || !statusRes.ok || !activityRes.ok || !lastExportRes.ok) {
          throw new Error('Une des réponses du réseau n\'était pas OK');
        }

        const statsData = await statsRes.json();
        const statusData = await statusRes.json();
        const activityData = await activityRes.json();
        const lastExportData = await lastExportRes.json();

        setStats(statsData);
        setStatus(statusData);
        setActivity(activityData);
        // lastExportData is an array, take the first element's date if exists
        setStatus(s => ({ ...s, lastExport: lastExportData[0]?.date || null }));
      } catch (err) {
        setError("Impossible de charger les données du dashboard. Vérifiez la connexion à l'API.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Le tableau vide [] assure que cet effet ne s'exécute qu'une fois

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {/* === CARTE ÉTAT DU SYSTÈME === */}
        <Grid item xs={12} md={6} lg={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>État du Système</Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {status.running ? (
                    <Power color="success" sx={{ mr: 1 }} />
                  ) : (
                    <PowerOff color="error" sx={{ mr: 1 }} />
                  )}
                  <Typography>NGINX : {status.running ? 'Actif' : 'Arrêté'}</Typography>
                </Box>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  Dernier export : {formatDate(status.lastExport)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* === CARTE STATISTIQUES === */}
        <Grid item xs={12} md={6} lg={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Statistiques</Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Typography variant="h5">{stats.totalServices || 0} <span style={{fontSize: '1rem', color: '#888'}}>Services</span></Typography>
                <Box sx={{ pl: 2 }}>
                   <Typography> - Actifs : {stats.enabledServices || 0}</Typography>
                   <Typography> - Inactifs : {(stats.totalServices || 0) - (stats.enabledServices || 0)}</Typography>
                </Box>
                <Divider />
                <Typography variant="h5">{stats.totalTemplates || 0} <span style={{fontSize: '1rem', color: '#888'}}>Templates</span></Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* === CARTE ACTIONS RAPIDES === */}
        <Grid item xs={12} md={6} lg={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Actions Rapides</Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Button variant="contained" startIcon={<RocketLaunch />}>Exporter la Configuration</Button>
                <Button variant="outlined" startIcon={<AddCircleOutline />}>Ajouter un Service</Button>
                <Button variant="outlined" startIcon={<AddCircleOutline />}>Ajouter un Template</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* === CARTE ACTIVITÉ RÉCENTE === */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <History />
                <Typography variant="h6">Activité Récente</Typography>
              </Stack>
              <Stack spacing={1.5}>
                {activity.length > 0 ? (
                  activity.map((item, index) => (
                    <Box key={index}>
                      <Typography variant="body1">{item.message}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDate(item.timestamp)}</Typography>
                      {index < activity.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">Aucune activité récente à afficher.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DashboardPage;