import React from 'react';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';

function ServiceRow({ name, data, defaults, onEdit, onToggle }) {
    // Use defaults for missing data
    const enabled = typeof data.enabled !== 'undefined' ? data.enabled : (defaults && defaults.enabled);
    const favorite = typeof data.favorite !== 'undefined' ? data.favorite : (defaults && defaults.favorite);
    const domain = data.domain || (defaults && defaults.domain) || '';
    const subdomain = data.subdomain || (defaults && defaults.subdomain) || '';
    let url = '';
    if (domain) {
        url = subdomain ? `https://${subdomain}.${domain}` : `https://${domain}`;
    }
    const localIp = data.ip || (defaults && defaults.ip) || '';
    const localPort = data.port || (defaults && defaults.port) || '';
    const localIsHTTPS = typeof data.https !== 'undefined' ? data.https : defaults.https;
    const localProtocol = localIsHTTPS ? 'https' : 'http';
    const internal = `${localProtocol}://${localIp}${localPort ? `:${localPort}` : ''}`;
    console.log(data, defaults, domain, subdomain, url);

    return (
        <TableRow sx={{
            opacity: enabled ? 1 : 0.6,
            borderBottom: '2px solid #e0e0e0',
        }}>
            <TableCell>
                <IconButton size="small" onClick={() => onToggle?.(name, { ...data, favorite: !favorite })}>
                    <StarIcon fontSize="small" sx={{ color: favorite ? '#FFD700' : '#B0B0B0' }} />
                </IconButton>
                {name}
            </TableCell>
            <TableCell>
                {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                ) : '—'}
            </TableCell>
            <TableCell>{internal ? (
                <a href={internal} target="_blank" rel="noopener noreferrer">{internal}</a>
            ) : '—'}
            </TableCell>
            <TableCell>
                <IconButton size="small" onClick={() => onEdit?.(name)}>
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onToggle?.(name, { ...data, enabled: !enabled })} color={enabled ? 'success' : 'error'}>
                    {enabled ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                </IconButton>
            </TableCell>
        </TableRow>
    );
}

export default ServiceRow;
