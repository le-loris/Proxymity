import React, { useEffect, useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CircleIcon from '@mui/icons-material/Circle';

// Appelle l'API backend pour l'état du conteneur nginx
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

  useEffect(() => {
    fetchNginxStatus().then(setRunning);
    const interval = setInterval(() => {
      fetchNginxStatus().then(setRunning);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
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
        minWidth: 90
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, letterSpacing: 1 }}>
          NGINX
        </Typography>
        <CircleIcon sx={{ color: running ? 'success.main' : 'error.main', fontSize: 18 }} />
      </Stack>
    </Paper>
  );
}
