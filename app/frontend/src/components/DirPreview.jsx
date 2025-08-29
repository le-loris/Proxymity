import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import { useTheme } from '@mui/material/styles';

export default function DirPreview({ nginxDir, setNginxDir, externalEntries, onSelect }) {
  const [dirEntries, setDirEntries] = useState(externalEntries || []);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    if (externalEntries) {
      setDirEntries(externalEntries);
      return;
    }
    const t = setTimeout(() => {
      if (!nginxDir) return setDirEntries([]);
      fetch('/api/v1/settings/list_dirs?path=' + encodeURIComponent(nginxDir))
        .then(r => r.json())
        .then(d => setDirEntries(d || []))
        .catch(() => setDirEntries([]));
    }, 250);
    console.log('Fetching dir entries for', nginxDir, dirEntries);
    return () => clearTimeout(t);
  }, [nginxDir, externalEntries]);

  const handleEntryClick = (it) => {
    if (it.isDir) {
      const base = nginxDir || '';
      const needsSep = base && !base.endsWith('/') && !base.endsWith('\\');
      const next = base + (needsSep ? '/' : '') + it.name;
      setNginxDir(next);
      setSelectedEntry(null);
      if (onSelect) onSelect({ type: 'dir', name: it.name, path: next });
      return;
    }
    setSelectedEntry(it.name);
    if (onSelect) onSelect({ type: 'file', name: it.name, path: nginxDir });
  };

  return (
    <Box sx={{ mt: 1, minHeight: 160, maxHeight: 160, overflow: 'auto', bgcolor: "#2e2e2e", p: 1, borderRadius: 1 }}>
      {(dirEntries.files===undefined || (dirEntries.files!==undefined && dirEntries.files.length === 0) || dirEntries.length === 0) ? (
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>No entries</Typography>
      ) : (
        <List disablePadding>
          { console.log(dirEntries)}
          { dirEntries.files.map((it) => (
            <ListItemButton
              key={it.name}
              onClick={() => handleEntryClick(it)}
              selected={selectedEntry === it.name}
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                '&:hover': { backgroundColor: theme.palette.action.hover },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {it.isDir ? <FolderOpenIcon sx={{ color: theme.palette.info.main }} fontSize="small" /> : <DescriptionIcon sx={{ color: theme.palette.text.primary }} fontSize="small" />}
              </ListItemIcon>
              <ListItemText
                primary={it.name}
                primaryTypographyProps={{
                  variant: 'body2',
                  color: it.isDir ? 'info.main' : 'text.primary',
                }}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}
