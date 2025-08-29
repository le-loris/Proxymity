
import React, { useState, useEffect } from 'react';
import TemplateCard from '../components/TemplateCard';
import AddCard from '../components/AddCard';
import TemplateForm from '../components/TemplateForm';

function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({ name: '', text: '' });
  const [formMode, setFormMode] = useState('add');
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetch('/api/v1/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data));
  }, []);

  const handleEdit = (tplName) => {
    console.log('Editing template:', tplName, templates);
    const tpl = templates[tplName];
    setFormData({ name: tplName, text: tpl.text, description: tpl?.description || '' });
    setEditName(tplName);
    setFormError('');
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleAdd = () => {
    setFormData({ name: '', text: '' });
    setFormError('');
    setFormMode('add');
    setFormOpen(true);
  };

  const handleFormSubmit = (form) => {
    setFormLoading(true);
    setFormError('');
    if (formMode === 'add') {
      fetch('/api/v1/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setFormError(data.error);
          } else {
            fetch('/api/v1/templates')
              .then(res => res.json())
              .then(setTemplates);
            setFormOpen(false);
          }
        })
        .catch(() => setFormError('Network error'))
        .finally(() => setFormLoading(false));
    } else if (formMode === 'edit') {
      fetch(`/api/v1/templates/${encodeURIComponent(editName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setFormError(data.error);
          } else {
            fetch('/api/v1/templates')
              .then(res => res.json())
              .then(setTemplates);
            setFormOpen(false);
          }
        })
        .catch(() => setFormError('Network error'))
        .finally(() => setFormLoading(false));
    }
  };

  const handleFormDelete = (name) => {
    setFormLoading(true);
    setFormError('');
    fetch(`/api/v1/templates/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setFormError(data.error);
        } else {
          fetch('/api/v1/templates')
              .then(res => res.json())
              .then(setTemplates);
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
          {/*console.log('Rendering templates:', templates)*/}
        {Object.entries(templates)
          .sort(([aName], [bName]) => aName.localeCompare(bName))
          .map(([name, template], index) => (
            <TemplateCard
              key={name}
              name={name}
              meta={template}
              onEdit={() => handleEdit(name)}
            />
          ))}
        <AddCard onClick={handleAdd} type="template" />
      </div>
      <TemplateForm
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

export default TemplatesPage;
