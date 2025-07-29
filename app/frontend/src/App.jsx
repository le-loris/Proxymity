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
import { useEffect, useState } from 'react';
import ServiceCard from './components/ServiceCard';
import AddCard from './components/AddCard';
import './App.css'

function App(){
  const [services, setServices] = useState([]);
  const [defaults, setDefaults] = useState({});
  const [fields, setFields] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMode, setPopupMode] = useState('add'); // 'add' ou 'edit'
  const [newService, setNewService] = useState({});
  const [addError, setAddError] = useState("");
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
    setNewService({ name: serviceName, ...services[serviceName] });
    setEditName(serviceName);
    setAddError("");
    setPopupMode('edit');
    setShowPopup(true);
  };

  const handleAdd = () => {
    // Préremplir avec les valeurs par défaut si elles existent
    const initial = { ...defaults, name: "" };
    setNewService(initial);
    setAddError("");
    setPopupMode('add');
    setShowPopup(true);
  };

  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewService((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handlePopupSubmit = (e) => {
    e.preventDefault();
    if (!newService.name) {
      setAddError("Name is required");
      return;
    }
    if (popupMode === 'add') {
      fetch('/api/services/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
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
        .catch(() => setAddError("Network error"));
    } else if (popupMode === 'edit') {
      fetch(`/api/services/edit/${encodeURIComponent(editName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
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
        .catch(() => setAddError("Network error"));
    }
  };
  
  return (
    <>
      <h1>Proxymity</h1>
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

      {showPopup && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={handlePopupSubmit} style={{
            background: '#242424',
            borderRadius: 12,
            padding: '2rem',
            minWidth: 320,
            boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxWidth: 400
          }}>
            <h2>{popupMode === 'edit' ? 'Edit' : 'Add'} a service</h2>
            {Object.entries(fields).map(([field, meta]) => (
              <div key={field} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
                  <label
                    htmlFor={field}
                    style={{ fontWeight: 600 }}
                  >
                    {meta.name || field}
                  </label>
                  <span
                    title={meta.description}
                    style={{
                      display: 'inline-block',
                      width: 15,
                      height: 15,
                      borderRadius: '50%',
                      background: '#eee',
                      color: '#333',
                      fontWeight: 700,
                      fontSize: '0.95em',
                      textAlign: 'center',
                      lineHeight: '15px',
                      cursor: 'help',
                      border: '1px solid #bbb',
                      marginLeft: 2
                    }}
                  >
                    ?
                  </span>
                </div>
                {typeof defaults[field] === 'boolean' ? (
                  <input
                    type="checkbox"
                    id={field}
                    name={field}
                    checked={!!newService[field]}
                    onChange={handleAddChange}
                  />
                ) : (
                  <input
                    type="text"
                    id={field}
                    name={field}
                    value={newService[field] ?? ''}
                    onChange={handleAddChange}
                    style={{ width: '100%' }}
                    disabled={popupMode === 'edit' && field === 'name'}
                  />
                )}
              </div>
            ))}
            <div style={{ color: 'red', minHeight: 20 }}>{addError}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {popupMode === 'edit' ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{ background: '#d32f2f', color: '#fff', border: 'none', padding: '0.5rem 1.2rem', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                >
                  Delete
                </button>
              ) : <div />}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowPopup(false)} style={{ background: '#eee', color: '#000' }}>Cancel</button>
                <button type="submit" style={{ background: '#333', color: '#fff' }}>{popupMode === 'edit' ? 'Save' : 'Add'}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default App
