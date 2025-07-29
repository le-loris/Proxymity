import { useEffect, useState } from 'react';
import ServiceCard from './components/ServiceCard';
import AddCard from './components/AddCard';
import './App.css'

function App(){
  const [services, setServices] = useState([]);
  const [defaults, setDefaults] = useState({});
  const [fields, setFields] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState({});
  const [addError, setAddError] = useState("");

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
    alert(`Édition du service : ${serviceName}`);
  };

  const handleAdd = () => {
    // Préremplir avec les valeurs par défaut si elles existent
    const initial = { ...defaults, name: "" };
    setNewService(initial);
    setAddError("");
    setShowAdd(true);
  };

  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewService((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newService.name) {
      setAddError("Le nom est obligatoire");
      return;
    }
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
          setShowAdd(false);
        }
      })
      .catch(() => setAddError("Erreur réseau"));
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
        />
        {Object.entries(services).map(([name, service], index) => (
          <ServiceCard
            key={name}
            title={name}
            data={service}
            onEdit={handleEdit}
          />
        ))}
        <AddCard onClick={handleAdd} />
      </div>

      {showAdd && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={handleAddSubmit} style={{
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
            <h2>Ajouter un service</h2>
            {Object.entries(fields).map(([field, value]) => (
              <div key={field} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <label htmlFor={field} style={{ fontWeight: 600 }}>{field}</label>
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
                  />
                )}
              </div>
            ))}
            <div style={{ color: 'red', minHeight: 20 }}>{addError}</div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background: '#eee', color: '#000' }}>Annuler</button>
              <button type="submit" style={{ background: '#333', color: '#fff' }}>Ajouter</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default App
