import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import DirPreview from './DirPreview';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
export default function SetupNginxDialog({ open, onClose, onSelect }) {
  const [containers, setContainers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState('default');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [notifierEnabled, setNotifierEnabled] = useState(false);
  const [notifierApiKey, setNotifierApiKey] = useState('');
  const [nginxDir, setNginxDir] = useState('');
  const [dirEntries, setDirEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch('/api/v1/settings/containers').then(r => r.json()),
      fetch('/api/v1/settings').then(r => r.json())
    ]).then(([containersRes, statusRes]) => {
      setContainers(containersRes.containers || []);
      if (statusRes) {  
        setAction(statusRes.action || 'default');
        setWebhookUrl(statusRes.webhookUrl || '');
        setNotifierEnabled(!!statusRes.notifierEnabled);
        setNotifierApiKey(statusRes.notifierApiKey || '');
        setNginxDir(statusRes.nginxDir || '');
        console.log('[SetupNginxDialog] containers:', containersRes);
        console.log('[SetupNginxDialog] status:', statusRes);
        // try to pre-select container if present
        if (statusRes.containerName) {
          const found = (containersRes.containers || []).find(c => c.Names && c.Names.some(n => n.replace(/^\//, '') === statusRes.containerName));
          if (found) setSelected(found.Id);
        } else {
          // If containerName is null/undefined, select first container with 'nginx' in the name
          const found = (containersRes.containers || []).find(c => c.Names && c.Names.some(n => n.includes('nginx')));
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
    if (!notifierApiKey) return;
    fetch('https://api.pushbullet.com/v2/pushes', {
      method: 'POST',
      headers: {
        'Access-Token': notifierApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'note',
        title: 'Proxymity Test',
        body: 'This is a test notification from Proxymity.',
      }),
    })
      .then(res => {
        if (!res.ok) {
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
      notifierEnabled,
      notifierApiKey,
      nginxDir
    };
    console.log('[SetupNginxDialog] Saving settings:', payload);
    fetch('/api/v1/settings', {
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

  const handleEntryClick = (it) => {
    // If it's a directory, navigate into it by appending the name to the current path
    if (it.isDir) {
      const base = nginxDir || '';
      const needsSep = base && !base.endsWith('/') && !base.endsWith('\\');
      const next = base + (needsSep ? '/' : '') + it.name;
      setNginxDir(next);
      setSelectedEntry(null);
      return;
    }
    // For files, mark as selected (no navigation)
    setSelectedEntry(it.name);
  };

  // debounced directory preview
  useEffect(() => {
    const t = setTimeout(() => {
      if (!nginxDir) return setDirEntries([]);
      fetch('/api/v1/settings/list_dirs?path=' + encodeURIComponent(nginxDir))
        .then(r => r.json())
        .then(d => setDirEntries(d.entries || []))
        .catch(() => setDirEntries([]));
    }, 350);
    return () => clearTimeout(t);
  }, [nginxDir]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Setup Proxymity</DialogTitle>
      <DialogContent>
        <Box>
          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
            <Tooltip title="Select the NGINX container to use as reference. Click a row to choose the active container." placement="right">
              <IconButton size="small" aria-label="help select container">
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
              Select the NGINX Container
            </Typography>
          </Box>
           <TableContainer component={Paper} sx={{ maxHeight: 220, overflowY: 'auto' }}>
            <Table stickyHeader>
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
                    <TableCell>
                      <Tooltip title={container.State || 'unknown'} placement="right">
                        {container.State === 'running' ? (
                          <CheckCircleIcon sx={{ color: 'green' }} fontSize="small" />
                        ) : container.State === 'paused' ? (
                          <PauseCircleOutlineIcon sx={{ color: 'orange' }} fontSize="small" />
                        ) : container.State === 'exited' || container.State === 'created' ? (
                          <ErrorOutlineIcon sx={{ color: 'red' }} fontSize="small" />
                        ) : (
                          <HelpOutlineIcon fontSize="small" />
                        )}
                      </Tooltip>
                    </TableCell>
                    <TableCell>{container.Image}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Box mt={3}>
          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
            <Tooltip title="Path to your nginx conf.d directory. Click directories below to navigate." placement="right">
              <IconButton size="small" aria-label="help nginx-dir">
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
              NGINX Directory
            </Typography>
          </Box>
          <TextField
            label="NGINX directory"
            value={nginxDir}
            onChange={(e) => setNginxDir(e.target.value)}
            fullWidth
            //helperText="Type a path to your nginx conf.d directory; contents will appear below"
            size="small"
          />
          <DirPreview nginxDir={nginxDir} setNginxDir={setNginxDir} />
        </Box>
        <Box mt={3}>
          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
            <Tooltip title="Choose how to export the configuration. Select 'Webhook' to send the config to an external automation (requires the Webhook URL below)." placement="right">
              <IconButton size="small" aria-label="help action">
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
              Action
            </Typography>
          </Box>
           <FormControl fullWidth>
            <InputLabel id="nginx-action-label">Export mode</InputLabel>
            <Select
              labelId="nginx-action-label"
              value={action}
              label="Export mode"
              onChange={e => setAction(e.target.value)}
            >
                <MenuItem value="default">Default</MenuItem>
                <MenuItem value="webhook">Webhook (n8n)</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {action === 'webhook' && (
          <Box mt={2}>
            <TextField
              label="Webhook URL"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              fullWidth
            />
          </Box>
        )}
        <Box mt={3}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Box display="flex" alignItems="center">
                <Tooltip title="Enable Pushbullet notifier and provide your Pushbullet Access Token (API Key) in the field below." placement="right">
                  <IconButton size="small" aria-label="help notifier">
                    <InfoOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                  Notifier
                </Typography>
              </Box>
              <Switch
                checked={notifierEnabled}
                onChange={(e) => setNotifierEnabled(e.target.checked)}
                size="small"
              />
            </Stack>
            <Button
              variant="contained"
              onClick={handleTestNotification}
              disabled={!notifierEnabled || !notifierApiKey}
              size="small"
              sx={{
                bgcolor: (!notifierEnabled || !notifierApiKey) ? undefined : 'green',
                color: 'white',
                height: 32,
                minWidth: 72,
                '&:hover': {
                  bgcolor: (!notifierEnabled || !notifierApiKey) ? undefined : 'darkgreen',
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
            value={notifierApiKey}
            onChange={(e) => setNotifierApiKey(e.target.value)}
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
