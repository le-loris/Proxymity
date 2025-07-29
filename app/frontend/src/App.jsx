
import { useEffect, useState } from 'react';
import ServiceCard from './components/ServiceCard';
import AddCard from './components/AddCard';
import ServiceForm from './components/ServiceForm';
import './App.css';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import Inter font (Google Fonts)
const interFontUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
if (typeof document !== 'undefined' && !document.getElementById('inter-font')) {
  const link = document.createElement('link');
  link.id = 'inter-font';
  link.rel = 'stylesheet';
  link.href = interFontUrl;
  document.head.appendChild(link);
}

function App() {
  const [services, setServices] = useState([]);
  const [defaults, setDefaults] = useState({});
  const [fields, setFields] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState('add'); // 'add' ou 'edit'
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
  }, []);

  const handleEdit = (serviceName) => {
    setFormData({ name: serviceName, ...services[serviceName] });
    setEditName(serviceName);
    setFormError("");
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleAdd = () => {
    const initial = { ...defaults, name: "" };
    setFormData(initial);
    setFormError("");
    setFormMode('add');
    setFormOpen(true);
  };
  const handleDelete = () => {
    if (!editName) return;
    if (!window.confirm('Delete this service?')) return;
    fetch(`/api/services/edit/${encodeURIComponent(editName)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setAddError(data.error);
        } else {
          setServices(data.services);
          setShowPopup(false);
        }
      })
      .catch(() => setAddError('Network error'));
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
            setServices(data.services);
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
  
  // Thème sombre global MUI
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      background: {
        default: '#181818',
        paper: '#232323',
      },
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#9c27b0',
      },
    },
    typography: {
      fontFamily: 'Inter, Roboto, Arial, sans-serif',
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <h1 style={{ textAlign: 'center', marginTop: 24, marginBottom: 24 }}>Proxymity</h1>
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
          fields={fields}
        />
        {Object.entries(services).map(([name, service], index) => (
          <ServiceCard
            key={name}
            title={name}
            data={service}
            onEdit={handleEdit}
            fields={fields}
          />
        ))}
        <AddCard onClick={handleAdd} />
      </div>

      <ServiceForm
        open={formOpen}
        mode={formMode}
        initialData={formData}
        fields={fields}
        defaults={defaults}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        onDelete={handleFormDelete}
        loading={formLoading}
        error={formError}
      />
    </ThemeProvider>
  );
}

export default App
