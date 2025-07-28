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
      width: '100%',
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f4f4f4',
    }}>
      <h1 style={{
        width: '100%',
        margin: 0,
        marginBottom: '1.5rem',
        backgroundColor: '#333',
        color: '#fff',
        padding: '1rem 2rem',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        textAlign: 'left',
        boxSizing: 'border-box',
      }}>
        Gestion des services
      </h1>
      <div style={{
        maxWidth: '1200px',
        margin: '2rem auto',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
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
    </div>
  );
}

export default App;
