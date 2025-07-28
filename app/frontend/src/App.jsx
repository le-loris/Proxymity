import { useEffect, useState } from 'react';
import ServiceCard from './components/ServiceCard';
import AddCard from './components/AddCard';

function App() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => setServices(data));
  }, []);

  const handleEdit = (serviceName) => {
    alert(`Édition du service : ${serviceName}`);
  };

  const handleAdd = () => {
    alert('Ajout d’un nouveau service');
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '2rem auto',
      fontFamily: 'sans-serif',
    }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Gestion des services</h1>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.5rem',
      }}>
        {services.map((service, index) => (
          <ServiceCard
            key={index}
            title={service.name}
            data={{
              Domaine: service.domain,
              Port: service.port,
              SousDomaine: service.subdomain,
            }}
            onEdit={handleEdit}
          />
        ))}

        <AddCard onClick={handleAdd} />
      </div>
    </div>
  );
}

export default App;
