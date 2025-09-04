import React, { useState, useEffect } from 'react';
import ServiceCard from '../components/ServiceCard';
import AddCard from '../components/AddCard';
import ServiceForm from '../components/ServiceForm';
import ServiceRow from '../components/ServiceRow';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Stack, IconButton } from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';

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
  const [displayMode, setDisplayMode] = useState('card'); // 'card' or 'list'
  
  useEffect(() => {
    try{
      fetch('/api/v1/services')
        .then((res) => res.json())
        .then((data) => setServices(data));
      fetch('/api/v1/meta/defaults')
        .then((res) => res.json())
        .then((data) => setDefaults(data));
      fetch('/api/v1/meta/fields')
        .then((res) => res.json())
        .then((data) => setFields(data));
      // load templates from backend for ServiceForm
      fetch('/api/v1/templates')
        .then(res => res.json())
        .then(data => setTemplates(data))
    }catch(e){console.log("Error fetching data:", e);}
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
      fetch('/api/v1/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setFormError(data.error);
          } else {
            fetch('/api/v1/services')
              .then(res => res.json())
              .then(setServices);
            setFormOpen(false);
          }
        })
        .catch(() => setFormError("Network error"))
        .finally(() => setFormLoading(false));
    } else if (formMode === 'edit') {
     fetch(`/api/v1/services/${encodeURIComponent(editName)}`, {
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
            fetch('/api/v1/services')
              .then(res => res.json())
              .then(setServices);
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
    fetch(`/api/v1/services/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setFormError(data.error);
        } else {
          fetch('/api/v1/services')
              .then(res => res.json())
              .then(setServices);
          setFormOpen(false);
        }
      })
      .catch(() => setFormError('Network error'))
      .finally(() => setFormLoading(false));
  };

  return (
    <div style={{ position: 'relative', minWidth: '90vw', paddingTop:'2rem', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 12, right: 32, zIndex: 2, display: 'flex', gap: 4, alignItems: 'center' }}>
        <IconButton
          onClick={() => setDisplayMode('card')}
          sx={{ color: displayMode === 'card' ? '#fff' : '#888' }}
        >
          <GridViewIcon />
        </IconButton>
        <div style={{ width: 1, height: 28, background: '#888', opacity: 0.5, borderRadius: 2 }} />
        <IconButton
          onClick={() => setDisplayMode('list')}
          sx={{ color: displayMode === 'list' ? '#fff' : '#888' }}
        >
          <TableRowsIcon />
        </IconButton>
      </div>
      <div style={{ width: '90vw', margin: '0 auto', marginTop: 48 }}>
        {displayMode === 'card' ? (
          <div className="card"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              minHeight: '60vh',
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
                  onToggle={(title, newData) => {
                    fetch(`/api/v1/services/${encodeURIComponent(title)}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newData)
                    })
                      .then(res => res.json())
                      .then(data => {
                        if (!data.error)
                          fetch('/api/v1/services')
                            .then(res => res.json())
                            .then(setServices);
                      });
                  }}
                  fields={fields}
                  templates={templates}
                  defaults={defaults}
                />
              ))}
            <AddCard onClick={handleAdd} type="service" />
          </div>
        ) : (
          <TableContainer component={Paper} sx={{ margin: '0 auto', marginTop: 0, p: 0 }}>
            <Table sx={{ marginTop: 0 }}>     
              <TableHead>
                <TableRow sx={{borderBottom: '3px solid #e0e0e0'}}>
                  <TableCell sx={{ fontFamily: 'Inter, Roboto, Arial, sans-serif', fontWeight: 'bold', fontSize: '1.15rem' }}>Service</TableCell>
                  <TableCell sx={{ fontFamily: 'Inter, Roboto, Arial, sans-serif', fontWeight: 'bold', fontSize: '1.15rem' }}>External URL</TableCell>
                  <TableCell sx={{ fontFamily: 'Inter, Roboto, Arial, sans-serif', fontWeight: 'bold', fontSize: '1.15rem' }}>Endpoint</TableCell>
                  <TableCell sx={{ fontFamily: 'Inter, Roboto, Arial, sans-serif', fontWeight: 'bold', fontSize: '1.15rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(services)
                  .sort(([aName], [bName]) => aName.localeCompare(bName))
                  .map(([name, service]) => (
                    <ServiceRow
                      key={name}
                      name={name}
                      data={service}
                      defaults={defaults}
                      onEdit={handleEdit}
                      onToggle={(title, newData) => {
                        fetch(`/api/v1/services/${encodeURIComponent(title)}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newData)
                        })
                          .then(res => res.json())
                          .then(data => {
                            if (!data.error)
                              fetch('/api/v1/services')
                                .then(res => res.json())
                                .then(setServices);
                          });
                      }}
                    />
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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
    </div>
  );
}

export default ServicesPage;
