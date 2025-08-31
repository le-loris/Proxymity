import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { RocketLaunch } from '@mui/icons-material';

export default function ExportButton({ onExport, text = 'Export Configuration', size = 'medium', containerName }) {
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/v1/export', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerName ? { containerName } : {})
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Export failed: ' + (data.error || res.statusText));
      }
      if (onExport) onExport(data);
    } catch (e) {
      alert('Export error: ' + e.message);
    } finally {
      setExporting(false);
    }
  };
  return (
    <Button
      variant="contained"
      startIcon={<RocketLaunch />}
      disabled={exporting}
      color={exporting ? 'inherit' : 'primary'}
      onClick={handleExport}
      size={size}
    >
      {exporting ? (text === 'Export Configuration' ? 'Exporting…' : '…') : text}
    </Button>
  );
}
