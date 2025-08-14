import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export default function SetupNginxDialog({ open, onClose, onSelect }) {
  const [containers, setContainers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState('default');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [notifierEnabled, setNotifierEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch('/api/settings/containers').then(r => r.json()),
      fetch('/api/settings/status').then(r => r.json())
    ]).then(([containersRes, statusRes]) => {
      setContainers(containersRes.containers || []);
      if (statusRes) {
        setAction(statusRes.action || 'default');
        setWebhookUrl(statusRes.webhookUrl || '');
        setNotifierEnabled(!!statusRes.notifierEnabled);
        setApiKey(statusRes.notifierApiKey || '');
        // try to pre-select container if present
        if (statusRes.containerName) {
          const found = (containersRes.containers || []).find(c => c.Names && c.Names.some(n => n.replace(/^\//, '') === statusRes.containerName));
          if (found) setSelected(found.Id);
        }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [open]);

  const handleRowClick = (id, name) => {
    setSelected(id);
    if (onSelect) onSelect(name, action, webhookUrl);
  };

  const handleTestNotification = () => {
    if (!apiKey) return;
    fetch('https://api.pushbullet.com/v2/pushes', {
      method: 'POST',
      headers: {
        'Access-Token': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'note',
        title: 'Proxymity Test',
        body: 'This is a test notification from Proxymity.',
      }),
    })
      .then(res => {
        if (res.ok) {
          alert('Test notification sent successfully!');
        } else {
          alert('Failed to send test notification.');
        }
      })
      .catch(() => alert('An error occurred while sending the test notification.'));
  };

  const handleSave = () => {
    const containerName = selected
      ? (containers.find(c => c.Id === selected)?.Names?.[0]?.replace(/^\//, '') || null)
      : null;
    const payload = {
      containerName,
      action,
      webhookUrl,
      notifier: { enabled: notifierEnabled, apiKey }
    };
    fetch('/api/settings/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(() => {
      if (onClose) onClose();
    }).catch(() => {
      // fail silently for now
      if (onClose) onClose();
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Setup Proxymity</DialogTitle>
      <DialogContent>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Select the NGINX Container
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ borderBottom: 2, borderColor: 'divider' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: 17, borderBottom: 3, borderColor: 'divider' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: 17, borderBottom: 3, borderColor: 'divider' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: 17, borderBottom: 3, borderColor: 'divider' }}>Image</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {containers.map((container) => (
                  <TableRow
                    key={container.Id}
                    hover
                    selected={selected === container.Id}
                    onClick={() => handleRowClick(container.Id, container.Names?.[0]?.replace(/^\//, '') || container.Id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{container.Names?.[0]?.replace(/^\//, '') || container.Id}</TableCell>
                    <TableCell>{container.State}</TableCell>
                    <TableCell>{container.Image}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Box mt={3}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Action
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="nginx-action-label">Export mode</InputLabel>
            <Select
              labelId="nginx-action-label"
              value={action}
              label="Export mode"
              onChange={e => setAction(e.target.value)}
            >
              <Tooltip title="Export standard, configuration locale ou fichier.">
                <MenuItem value="default">Default</MenuItem>
              </Tooltip>
              <Tooltip title="Envoie la configuration vers un webhook n8n (automatisation externe).">
                <MenuItem value="webhook">Webhook (n8n)</MenuItem>
              </Tooltip>
            </Select>
          </FormControl>
        </Box>
        <Box mt={2}>
          <TextField
            label="Webhook URL"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            fullWidth
            disabled={action !== 'webhook'}
            InputProps={{
              style: { backgroundColor: action === 'webhook' ? undefined : '#606060' }
            }}
          />
        </Box>
        <Box mt={3}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Notifier
              </Typography>
              <Switch
                checked={notifierEnabled}
                onChange={(e) => setNotifierEnabled(e.target.checked)}
                size="small"
              />
            </Stack>
            <Button
              variant="contained"
              onClick={handleTestNotification}
              disabled={!notifierEnabled || !apiKey}
              size="small"
              sx={{
                bgcolor: (!notifierEnabled || !apiKey) ? undefined : 'green',
                color: 'white',
                height: 32,
                minWidth: 72,
                '&:hover': {
                  bgcolor: (!notifierEnabled || !apiKey) ? undefined : 'darkgreen',
                },
              }}
            >
              Test
            </Button>
          </Stack>
        </Box>
        <Box mt={1}>
          <TextField
            label="Pushbullet API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            fullWidth
            disabled={!notifierEnabled}
            type="password"
            InputProps={{
              style: { backgroundColor: notifierEnabled ? undefined : '#606060' }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
