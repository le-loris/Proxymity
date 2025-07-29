import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

function TemplateForm({ open, mode = 'add', initialData = {}, onCancel, onSubmit, onDelete, loading = false, error = '' }) {
  const [form, setForm] = useState(initialData);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    setForm(initialData);
    setLocalError('');
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) {
      setLocalError('Name is required');
      return;
    }
    if (!form.text) {
      setLocalError('Text is required');
      return;
    }
    setLocalError('');
    onSubmit(form);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this template?')) {
      onDelete && onDelete(form.name);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{mode === 'edit' ? 'Edit' : 'Add'} a template</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              id="name"
              name="name"
              label="Name"
              value={form.name ?? ''}
              onChange={handleChange}
              fullWidth
              size="small"
              disabled={mode === 'edit'}
              variant="outlined"
            />
            <TextField
              id="text"
              name="text"
              label="Text"
              value={form.text ?? ''}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              minRows={8}
              maxRows={20}
              variant="outlined"
            />
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

export default TemplateForm;
