
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ServiceCard from './components/ServiceCard';
import AddCard from './components/AddCard';
import ServiceForm from './components/ServiceForm';
import TemplateCard from './components/TemplateCard';
import TemplateForm from './components/TemplateForm';
import './App.css';


import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewListIcon from '@mui/icons-material/ViewList';
import LayersIcon from '@mui/icons-material/Layers';

// Import Inter font (Google Fonts)
const interFontUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
if (typeof document !== 'undefined' && !document.getElementById('inter-font')) {
  const link = document.createElement('link');
  link.id = 'inter-font';
  link.rel = 'stylesheet';
  link.href = interFontUrl;
  document.head.appendChild(link);
}

function AppContent() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Déduire l'écran courant depuis l'URL
  const path = location.pathname;
  let screen = 'dashboard';
  if (path.startsWith('/services')) screen = 'services';
  else if (path.startsWith('/templates')) screen = 'templates';
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
  // State pour les templates (API backend)
  const [templates, setTemplates] = useState([]);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [templateFormMode, setTemplateFormMode] = useState('add');
  const [templateFormData, setTemplateFormData] = useState({ name: '', text: '' });
  const [templateFormError, setTemplateFormError] = useState('');
  const [templateFormLoading, setTemplateFormLoading] = useState(false);

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
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => setTemplates(data));
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
      {/* AppBar + Drawer */}
      <AppBar position="fixed" color="default" elevation={2} sx={{ width: '100%' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
            Proxymity
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List sx={{ width: 220 }}>
          <ListItem disablePadding>
            <ListItemButton selected={screen === 'dashboard'} onClick={() => { navigate('/'); setDrawerOpen(false); }}>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={screen === 'services'} onClick={() => { navigate('/services'); setDrawerOpen(false); }}>
              <ListItemIcon><ViewListIcon /></ListItemIcon>
              <ListItemText primary="Services" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={screen === 'templates'} onClick={() => { navigate('/templates'); setDrawerOpen(false); }}>
              <ListItemIcon><LayersIcon /></ListItemIcon>
              <ListItemText primary="Templates" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main content by route */}
      <div style={{ paddingTop: 72, minHeight: '100vh', boxSizing: 'border-box', background: 'inherit' }}>
        <Routes>
          <Route path="/services" element={
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
                loading={formLoading}
                error={formError}
              />
            </>
          } />
          <Route path="/templates" element={
            <>
              <div className="card"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}>
                {templates.map((tpl) => (
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
                  if (templateFormMode === 'add') {
                    fetch('/api/templates/add', {
                      method: 'POST',
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
                  } else {
                    fetch(`/api/templates/edit/${encodeURIComponent(tpl.name)}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: tpl.text, meta: { description: tpl.description || '' } })
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
                  }
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
          } />
          <Route path="/" element={
            <Typography variant="h4" align="center" sx={{ mt: 8, color: 'text.secondary' }}>
              Dashboard (à venir)
            </Typography>
          } />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
