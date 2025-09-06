import React, { useState, useEffect } from 'react';
import { Paper, Stack, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

function CertCard({ title, desc, onEdit }) {
  return (
    <Paper
      elevation={4}
      sx={{
        minWidth: 260,
        maxWidth: 340,
        margin: 2,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="service-card"
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, pt: 1.2, pb: 1, borderBottom: '1px solid', borderColor: 'divider', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem', m: 0 }}>{title}</Typography>
          <IconButton size="small" onClick={() => onEdit?.(title)}>
            <EditIcon fontSize="small" />
          </IconButton>
      </Stack>
        <Typography sx={{ px: 2, py: 1, fontSize: '0.98rem', color: 'text.secondary', whiteSpace: 'pre-line' }}>
        {desc || <span style={{ color: '#888' }}>(No description)</span>}
      </Typography>
    </Paper>
  );
}

export default CertCard;