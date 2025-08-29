import React, { useEffect, useState } from 'react';
import SetupNginxDialog from './SetupNginxDialog';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CircleIcon from '@mui/icons-material/Circle';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import ExportButton from './ExportButton';

// API backend pour l'état du conteneur nginx
async function fetchNginxStatus() {
  try {
    const res = await fetch('/api/v1/settings/status');
    if (!res.ok) return { running: false, status: '?', color: 'warning', containerName: '?' };
    const data = await res.json();
    return data;
  } catch {
    return { running: false, status: '?', color: 'warning', containerName: '?' };
  }
}

export default function NginxStatus() {
  const [nginx, setNginx] = useState({ running: false, status: '?', color: 'warning', containerName: '?' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    fetchNginxStatus().then(setNginx);
    const interval = setInterval(() => {
      fetchNginxStatus().then(setNginx);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => {
    // open popover on click; if already open, close it
    if (anchorEl) setAnchorEl(null);
    else setAnchorEl(event.currentTarget);
  };

  const open = Boolean(anchorEl);
  
  return (
    <div
    style={{ display: 'inline-block' }}
    >
      <Paper
        onClick={handleClick}
        elevation={0}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 2,
          py: 0.5,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid',
          borderColor: `${nginx.color}.main`,
          ml: 2,
          minWidth: 120,
          cursor: 'pointer',
        }}
        >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, letterSpacing: 1 }}>
            NGINX
          </Typography>
          <CircleIcon sx={{ color: `${nginx.color}.main`, fontSize: 18 }} />
          <Typography variant="caption" sx={{ ml: 1, color: `${nginx.color}.main`, fontWeight: 500 }}>
            {nginx.containerName}
          </Typography>
        </Stack>
      </Paper>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: { px: 1, py: 1, borderRadius: 2, minWidth: 120, mt: 1},
        }}
        disableRestoreFocus
      >
        <Stack spacing={1}>
          <Button variant="outlined" size="small" color="primary" onClick={() => { setSetupOpen(true); setAnchorEl(null); }}>
            Set up
          </Button>
          <ExportButton text="Export" size="small" containerName={nginx.containerName} />
        </Stack>
      </Popover>
    <SetupNginxDialog open={setupOpen} onClose={() => setSetupOpen(false)} onSelect={async (containerName, action, webhookUrl) => {
      await fetch('/api/v1/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerName, action, webhookUrl })
      });
      //setSetupOpen(false);
      fetchNginxStatus().then(setNginx);
    }} />
    </div>
  );
}
