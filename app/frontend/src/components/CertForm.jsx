import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-ini';
import 'prismjs/themes/prism-tomorrow.css';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

function CertForm({ open, mode = 'add', initialData = {}, onCancel, onSubmit, onDelete, loading = false, error = '' }) {
  const [form, setForm] = useState({ ...initialData, description: initialData.description ?? (initialData?.description ?? '') });
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
    if (!form.cert) {
      setLocalError('Certificate is required');
      return;
    }
    if (!form.key) {
      setLocalError('Private Key is required');
      return;
    }
    setLocalError('');
    const { name, cert, key, description } = form;
    onSubmit({ name, cert, key, description: description });
  };

  const handleDelete = () => {
    if (window.confirm('Delete this template?')) {
      onDelete && onDelete(form.name);
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
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
              id="description"
              name="description"
              label="Description"
              value={form.description ?? ''}
              onChange={handleChange}
              fullWidth
              size="small"
              variant="outlined"
            />
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 500, marginBottom: 4, color: '#bbb' }}>Certificate</div>
              <div style={{overflow:'auto', maxHeight: '300px'}}>
                <Editor
                value={form.cert ?? ''}
                onValueChange={code => setForm(f => ({ ...f, cert: code }))}
                highlight={code => Prism.highlight(code, Prism.languages.ini, 'ini')}
                padding={12}
                style={{
                  fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                  fontSize: 15,
                  background: '#232323',
                  borderRadius: 6,
                  minHeight: 180,
                  height: 'auto',
                  border: '1px solid #444',
                  color: '#fff',
                  outline: 'none',
                  marginBottom: 4
                }}
                textareaId="cert-text"
                name="cert"
                disabled={loading}
              />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 500, marginBottom: 4, color: '#bbb' }}>Private Key</div>
              <div style={{overflow:'auto', maxHeight: '300px'}}>
                <Editor
                value={form.key ?? ''}
                onValueChange={code => setForm(f => ({ ...f, key: code }))}
                highlight={code => Prism.highlight(code, Prism.languages.ini, 'ini')}
                padding={12}
                style={{
                  fontFamily: 'Fira Mono, Menlo, Monaco, Consolas, monospace',
                  fontSize: 15,
                  background: '#232323',
                  borderRadius: 6,
                  minHeight: 180,
                  height: 'auto',
                  border: '1px solid #444',
                  color: '#fff',
                  outline: 'none',
                  marginBottom: 4
                }}
                textareaId="key-text"
                name="key"
                disabled={loading}
              />
              </div>
            </div>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'red', minHeight: 20, flex: 1, textAlign: "center" }}>{localError || error}</span>
          <span>
            {mode === 'edit' && (
              <Button
                onClick={handleDelete}
                color="error"
                variant="contained"
                disabled={loading}
                sx={{ ml: 1 }}
              >
                Delete
              </Button>
            )}
            <Button onClick={onCancel} color="inherit" disabled={loading} sx={{ ml: 1 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ ml: 1 }}>
              {mode === 'edit' ? 'Save' : 'Add'}
            </Button>
          </span>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CertForm;
