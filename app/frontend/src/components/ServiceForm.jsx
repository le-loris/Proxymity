import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';


function ServiceForm({
  open,
  mode = 'add',
  initialData = {},
  fields = {},
  defaults = {},
  onCancel,
  onSubmit,
  onDelete,
  loading = false,
  error = '',
}) {
  const [form, setForm] = useState(initialData);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setForm(initialData);
    setLocalError('');
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) {
      setLocalError('Name is required');
      return;
    }
    setLocalError('');
    onSubmit(form);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this service?')) {
      onDelete && onDelete(form.name);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{mode === 'edit' ? 'Edit' : 'Add'} a service</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {Object.entries(fields).map(([field, meta]) => (
              <div key={field}>
                {typeof defaults[field] === 'boolean' ? (
                  <Tooltip title={meta.description || ''} placement="right" arrow>
                    <FormControlLabel
                      control={
                        <Checkbox
                          id={field}
                          name={field}
                          checked={!!form[field]}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      }
                      label={meta.name || field}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip title={meta.description || ''} placement="right" arrow>
                    <TextField
                      id={field}
                      name={field}
                      label={meta.name || field}
                      value={form[field] ?? ''}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                      disabled={mode === 'edit' && field === 'name' || loading}
                      variant="outlined"
                    />
                  </Tooltip>
                )}
              </div>
            ))}
            <div style={{ color: 'red', minHeight: 20 }}>{localError || error}</div>
          </Stack>
        </DialogContent>
        <DialogActions>
          {mode === 'edit' && (
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={loading}
            >
              Delete
            </Button>
          )}
          <Button onClick={onCancel} color="inherit" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {mode === 'edit' ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}



export default ServiceForm;
