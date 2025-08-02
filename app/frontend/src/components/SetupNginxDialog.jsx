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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function SetupNginxDialog({ open, onClose, onSelect }) {
  const [containers, setContainers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState('default');
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/nginx/containers')
      .then(res => res.json())
      .then(data => setContainers(data.containers || []));
  }, [open]);

  const handleRowClick = (id, name) => {
    setSelected(id);
    if (onSelect) onSelect(name, action, webhookUrl);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select the NGINX Container</DialogTitle>
      <DialogContent>
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
      </DialogContent>
    </Dialog>
  );
}
