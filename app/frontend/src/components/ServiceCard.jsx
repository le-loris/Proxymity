
import { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

function ServiceCard({ title, data, onEdit, onToggleEnabled, fields, defaults}) {
  
  // enabled : valeur du service ou du default
  const enabled = typeof data.enabled !== 'undefined' ? data.enabled : (data.DefaultsEnabled ?? true);
  const domain = data.domain || (defaults && defaults.domain) || '';
  const subdomain = data.subdomain || '';
  const url = domain && subdomain ? `https://${subdomain}.${domain}` : null;
  console.log(data, defaults, domain, subdomain, url);

  if (title === "Fields") return null;

  return (
    <Paper
      elevation={4}
      sx={{
        opacity: enabled ? 1 : 0.6,
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
      {/* En-tête */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, pt: 1.2, pb: 1, borderBottom: '1px solid', borderColor: 'divider', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
        <Typography variant="h6" sx={{ fontSize: '1.1rem', m: 0 }}>{title}</Typography>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit?.(title)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {url && enabled && (
              <Tooltip title="Open website">
                <IconButton size="small" component="a" href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {title !== "Defaults" && (
              <Tooltip title={enabled ? "Disable" : "Enable"}>
                <IconButton size="small" onClick={e => { e.stopPropagation(); onToggleEnabled?.(title, { ...data, enabled: !enabled }); }} color={enabled ? 'success' : 'error'}>
                  {enabled ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
        </Stack>
      </Stack>

      {/* Contenu */}
      <Stack sx={{ px: 2, py: 1 }}>
        {Object.entries(data)
          .filter(([key]) => key !== 'name' && key !== 'enabled')
          .filter(([key, value]) => value !== "" && value !== undefined && value !== null)
          .map(([key, value]) => (
            <Typography key={key} sx={{ textAlign: 'left', mb: 0.5, fontSize: '0.95rem' }}>
              <span style={{ fontWeight: 600 }}>{fields && fields[key] && fields[key].name ? fields[key].name : key}</span>: {typeof value === 'boolean' ? (value ? <CheckCircleIcon color="success" fontSize="inherit" sx={{ verticalAlign: 'middle' }} /> : <BlockIcon color="error" fontSize="inherit" sx={{ verticalAlign: 'middle' }} />) : value}
            </Typography>
        ))}
      </Stack>  
    </Paper>
  );
}

export default ServiceCard;
