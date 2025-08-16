import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

function TemplateCard({ name, meta = {}, onEdit }) {
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
        <Typography variant="h6" sx={{ fontSize: '1.1rem', m: 0 }}>{name}</Typography>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => onEdit?.(name)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Typography sx={{ px: 2, py: 1, fontSize: '0.98rem', color: 'text.secondary', whiteSpace: 'pre-line' }}>
        {meta.description || <span style={{ color: '#888' }}>(No description)</span>}
      </Typography>
    </Paper>
  );
}

export default TemplateCard;
