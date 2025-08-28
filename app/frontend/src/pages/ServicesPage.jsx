import React, { useState, useEffect } from 'react';
import ServiceCard from '../components/ServiceCard';
import AddCard from '../components/AddCard';
import ServiceForm from '../components/ServiceForm';

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [defaults, setDefaults] = useState({});
  const [fields, setFields] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({});
  const [formMode, setFormMode] = useState('add');
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => setServices(data));
    fetch('/api/defaults')
      .then((res) => res.json())
      .then((data) => setDefaults(data));
    fetch('/api/fields')
      .then((res) => res.json())
      .then((data) => setFields(data));
    // load templates from backend for ServiceForm
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        // templates route returns array of {name, text, meta} or {templates: [...]}
        if (Array.isArray(data)) setTemplates(data);
        else if (data && Array.isArray(data.templates)) setTemplates(data.templates);
      })
      .catch(() => setTemplates([]));
  }, []);

  const handleEdit = (serviceName) => {
    let serviceData = services[serviceName];
    if (serviceName === 'Defaults') {
      serviceData = { ...defaults };
    }
    setFormData({ name: serviceName, ...serviceData });
    setEditName(serviceName);
    setFormError("");
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleAdd = () => {
    const initial = { enabled: defaults.enabled, name: "New Service" };
    setFormData(initial);
    setFormError("");
    setFormMode('add');
    setFormOpen(true);
  };

  const handleFormSubmit = (form) => {
    setFormLoading(true);
    setFormError("");
    if (formMode === 'add') {
      fetch('/api/services/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setFormError(data.error);
          } else {
            setServices(data.services);
            setFormOpen(false);
          }
        })
        .catch(() => setFormError("Network error"))
        .finally(() => setFormLoading(false));
    } else if (formMode === 'edit') {
      fetch(`/api/services/edit/${encodeURIComponent(editName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setFormError(data.error);
          } else {
            // If we edited Defaults, backend returns the updated defaults in data.defaults
            if (editName === 'Defaults' && data.defaults) {
              setDefaults(data.defaults);
            }
            // Update services list if present
            if (data.services) setServices(data.services);
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
    if (name === 'Defaults') {
      // prevent deletion of defaults
      setFormError('Cannot delete Defaults');
      setFormLoading(false);
      return;
    }
    fetch(`/api/services/edit/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setFormError(data.error);
        } else {
          setServices(data.services);
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
        <ServiceCard
          key={"Defaults"}
          title={"Defaults"}
          data={defaults}
          onEdit={handleEdit}
          fields={fields}
        />
        {Object.entries(services)
          .sort(([aName], [bName]) => aName.localeCompare(bName))
          .map(([name, service], index) => (
            <ServiceCard
              key={name}
              title={name}
              data={service}
              onEdit={handleEdit}
              onToggleEnabled={(title, newData) => {
                fetch(`/api/services/edit/${encodeURIComponent(title)}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newData)
                })
                  .then(res => res.json())
                  .then(data => {
                    if (!data.error) setServices(data.services);
                  });
              }}
              fields={fields}
              templates={templates}
              defaults={defaults}
            />
          ))}
        <AddCard onClick={handleAdd} type="service" />
      </div>
      <ServiceForm
        open={formOpen}
        mode={formMode}
        initialData={formData}
        fields={fields}
        defaults={defaults}
        templates={templates}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        onDelete={handleFormDelete}
        allowDelete={formData.name !== 'Defaults'}
        loading={formLoading}
        error={formError}
      />
    </>
  );
}

export default ServicesPage;
