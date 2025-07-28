import { useState } from 'react';

function ServiceCard({ title, data, onEdit }) {
  const [enabled, setEnabled] = useState(true);

  const toggle = () => setEnabled(!enabled);

  if (title === "Fields") return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #ddd',
      borderRadius: '12px',
      backgroundColor: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      color: '#333',
      opacity: enabled ? 1 : 0.6,
      minWidth: '250px',
      maxWidth: '300px',
      flex: '1 1 300px',
    }}>
      {/* En-tête */}
      <div style={{
        backgroundColor: '#f0f0f0',
        padding: '0.5rem 1rem',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #ddd',
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <button
            onClick={() => onEdit?.(title)}
            title="Modifier"
            style={{
              background: '#eee',
              border: 'none',
              borderRadius: '6px',
              padding: '0.25rem 0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            ✏️
          </button>
          <button
            onClick={toggle}
            title={enabled ? "Désactiver" : "Activer"}
            style={{
              background: enabled ? '#cce5cc' : '#f8d7da',
              border: 'none',
              borderRadius: '6px',
              padding: '0.25rem 0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {enabled ? '✅' : '⛔'}
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: '1rem' }}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} style={{ textAlign: 'left', marginBottom: '0.3rem', fontSize: '0.95rem' }}>
            <span style={{ fontWeight: 600 }}>{key}</span>: {value}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ServiceCard;
