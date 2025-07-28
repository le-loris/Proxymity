import { useEffect, useState } from 'react';
import ServiceCard from './components/ServiceCard';
//import AddCard from './components/AddCard';
import './App.css'

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
    <>
      <h1>Proxymity</h1>
      <div className="card">
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
          {/* <AddCard onClick={handleAdd} /> */}
        </div>
        
      </div>
    </>
  )
}

export default App;
