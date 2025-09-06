import React, { useState, useEffect } from 'react';
import CertCard from '../components/CertCard';
import CertForm from '../components/CertForm';
import AddCard from '../components/AddCard';

function CertsPage() {
  const [certs, setCerts] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetch('/api/v1/certs')
      .then(res => res.json())
      .then(setCerts);
    console.log("Certs loaded", certs);
  }, []);

  const handleEdit = (name) => {
    setFormData({ name, ...certs[name] });
    setEditName(name);
    setFormMode('edit');
    setFormOpen(true);
    setFormError("");
  };

  const handleAdd = () => {
    setFormData({ name: '', description: '', cert: '', key: '' });
    setFormMode('add');
    setFormOpen(true);
    setFormError("");
  };

  const handleFormSubmit = (form) => {
    setFormLoading(true);
    setFormError("");
    if (formMode === 'add') {
      fetch('/api/v1/certs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setFormError(data.error);
          } else {
            fetch('/api/v1/certs')
              .then(res => res.json())
              .then(setCerts);
            setFormOpen(false);
          }
        })
        .catch(() => setFormError("Network error"))
        .finally(() => setFormLoading(false));
    } else if (formMode === 'edit') {
      fetch(`/api/v1/certs/${encodeURIComponent(editName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setFormError(data.error);
          } else {
            fetch('/api/v1/certs')
              .then(res => res.json())
              .then(setCerts);
            setFormOpen(false);
          }
        })
        .catch(() => setFormError("Network error"))
        .finally(() => setFormLoading(false));
    }
  };

  const handleFormDelete = (name) => {
    setFormLoading(true);
    setFormError("");
    fetch(`/api/v1/certs/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setFormError(data.error);
        } else {
          fetch('/api/v1/certs')
            .then(res => res.json())
            .then(setCerts);
          setFormOpen(false);
        }
      })
      .catch(() => setFormError('Network error'))
      .finally(() => setFormLoading(false));
  };

  return (
    <>
      <div className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
           {Object.entries(certs)
        .sort(([aName], [bName]) => aName.localeCompare(bName))
        .map(([name, data]) => (
          <CertCard title={name} desc={data.description} onEdit={handleEdit} />
        ))}
        <AddCard onClick={handleAdd} type="certificate" />
      </div>        
      <CertForm
        open={formOpen}
        mode={formMode}
        initialData={formData}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        onDelete={handleFormDelete}
        loading={formLoading}
        error={formError}
      />
    </>
  );
}

export default CertsPage;
