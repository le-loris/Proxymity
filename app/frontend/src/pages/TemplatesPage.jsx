import React, { useState, useEffect } from 'react';
import TemplateCard from '../components/TemplateCard';
import AddCard from '../components/AddCard';
import TemplateForm from '../components/TemplateForm';

function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [templateFormMode, setTemplateFormMode] = useState('add');
  const [templateFormData, setTemplateFormData] = useState({ name: '', text: '' });
  const [templateFormError, setTemplateFormError] = useState('');
  const [templateFormLoading, setTemplateFormLoading] = useState(false);

  useEffect(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data));
  }, []);

  return (
    <>
      <div className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
        {templates
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((tpl) => (
            <TemplateCard
              key={tpl.name}
              name={tpl.name}
              meta={tpl.meta}
              onEdit={() => {
                setTemplateFormData({
                  name: tpl.name,
                  text: tpl.text,
                  description: tpl.meta?.description || ''
                });
                setTemplateFormMode('edit');
                setTemplateFormOpen(true);
              }}
            />
          ))}
        <AddCard onClick={() => {
          setTemplateFormData({ name: '', text: '' });
          setTemplateFormMode('add');
          setTemplateFormOpen(true);
        }} type="template" />
      </div>
      <TemplateForm
        open={templateFormOpen}
        mode={templateFormMode}
        initialData={templateFormData}
        onCancel={() => setTemplateFormOpen(false)}
        onSubmit={(tpl) => {
          setTemplateFormLoading(true);
          setTemplateFormError('');
          console.log('[TemplatesPage] onSubmit:', tpl, 'mode:', templateFormMode);
          const ifName = templateFormMode === 'edit' ? `/${encodeURIComponent(tpl.name)}` : '';
          fetch(`/api/templates/${templateFormMode}${ifName}`, {
            method:'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tpl)
          })
            .then(res => res.json())
            .then(data => {
              if (data.error) {
                setTemplateFormError(data.error);
              } else {
                fetch('/api/templates')
                  .then(res => res.json())
                  .then(setTemplates);
                setTemplateFormOpen(false);
              }
            })
            .catch(() => setTemplateFormError('Network error'))
            .finally(() => setTemplateFormLoading(false));
        }}
        onDelete={(name) => {
          setTemplateFormLoading(true);
          fetch(`/api/templates/edit/${encodeURIComponent(name)}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          })
            .then(res => res.json())
            .then(data => {
              if (data.error) {
                setTemplateFormError(data.error);
              } else {
                fetch('/api/templates')
                  .then(res => res.json())
                  .then(setTemplates);
                setTemplateFormOpen(false);
              }
            })
            .catch(() => setTemplateFormError('Network error'))
            .finally(() => setTemplateFormLoading(false));
        }}
        loading={templateFormLoading}
        error={templateFormError}
      />
    </>
  );
}

export default TemplatesPage;
