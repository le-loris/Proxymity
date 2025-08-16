
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import Tooltip from '@mui/material/Tooltip';

function AddCard({ onClick, type = 'service' }) {
  const tooltip = type === 'template' ? 'Add template' : 'Add service';
  return (
    <Tooltip title={tooltip}>
      <Paper
        elevation={4}
        sx={{
          minWidth: 80,
          minHeight: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          margin: 2,
          cursor: 'pointer',
          backgroundColor: 'background.paper',
          transition: 'background-color 0.2s',
        }}
        className="add-card"
        onClick={onClick}
      >
        <IconButton color="primary" size="large">
          <AddIcon fontSize="large" />
        </IconButton>
      </Paper>
    </Tooltip>
  );
}

export default AddCard;
