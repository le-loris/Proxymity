import React, { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CircleIcon from '@mui/icons-material/Circle';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';

// API backend pour l'état du conteneur nginx
async function fetchNginxStatus() {
  try {
    const res = await fetch('/api/nginx/status');
    if (!res.ok) return false;
    const data = await res.json();
    return data.running;
  } catch {
    return false;
  }
}

export default function NginxStatus() {
  const [running, setRunning] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    fetchNginxStatus().then(setRunning);
    const interval = setInterval(() => {
      fetchNginxStatus().then(setRunning);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseEnter = (event) => {
    setAnchorEl(event.currentTarget);
    setHover(true);
  };
  const handleMouseLeave = () => {
    return;
    setHover(false);
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl && hover);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'inline-block' }}
    >
      <Paper
        elevation={0}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 2,
          py: 0.5,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid',
          borderColor: running ? 'success.main' : 'error.main',
          ml: 2,
          minWidth: 90,
          cursor: 'pointer',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, letterSpacing: 1 }}>
            NGINX
          </Typography>
          <CircleIcon sx={{ color: running ? 'success.main' : 'error.main', fontSize: 18 }} />
        </Stack>
      </Paper>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleMouseLeave}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: { px: 1, py: 1, borderRadius: 2, minWidth: 120, mt: 1},
        }}
        disableRestoreFocus
      >
        <Stack spacing={1}>
          <Button variant="outlined" size="small" color="primary">
            Set up
          </Button>
          <Button variant="contained" size="small" color="primary">
            Export
          </Button>
        </Stack>
      </Popover>
    </div>
  );
}
