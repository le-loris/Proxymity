import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import SecurityIcon from '@mui/icons-material/Security';
import './App.css';
import Logo from '../public/logo.svg';

import ServicesPage from './pages/ServicesPage';
import TemplatesPage from './pages/TemplatesPage';
import CertsPage from './pages/CertsPage';
import DashboardPage from './pages/DashboardPage';
import NginxStatus from './components/NginxStatus';

function AppContent() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  let screen = 'dashboard';
  if (path.startsWith('/services')) screen = 'services';
  else if (path.startsWith('/templates')) screen = 'templates';
  else if (path.startsWith('/certs')) screen = 'certs';

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
            <img src={Logo} alt="Proxymity Logo" style={{ height: 48, marginRight: 12 }} />
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700, fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
            {screen === 'dashboard' && 'Proxymity'}
            {screen === 'services' && 'Proxymity - Services'}
            {screen === 'templates' && 'Proxymity - Templates'}
            {screen === 'certs' && 'Proxymity - Certificates'}
          </Typography>
          <NginxStatus />
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
            <ListItem disablePadding>
              <ListItemButton selected={screen === 'certs'} onClick={() => { navigate('/certs'); setDrawerOpen(false); }}>
                <ListItemIcon><SecurityIcon /></ListItemIcon>
                <ListItemText primary="Certificates" />
              </ListItemButton>
            </ListItem>
          </List>
          <Typography variant="caption" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            Version: 1.0.0
          </Typography>
        </div>
      </Drawer>

      {/* Main content by route */}
      <div style={{ width: '90vw', paddingTop: 18, boxSizing: 'border-box', background: 'inherit' }}>
        <Routes>
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/certs" element={<CertsPage />} />
          <Route path="/" element={<DashboardPage />} />
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
