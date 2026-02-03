// src/components/SeccionNoticias.tsx
import React from 'react';

interface NoticiaProps {
  titulo: string;
}

const SeccionNoticias: React.FC<NoticiaProps> = ({ titulo }) => {
  // Estos datos son de ejemplo, AI Studio los llenará con Google Search después
  const noticiasEjemplo = [
    {
      id: 1,
      titular: `Últimas novedades de ${titulo}`,
      resumen: "Cargando información actualizada desde los portales de la Histórica...",
      fecha: "Recién"
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ 
        backgroundColor: '#c1121f', 
        color: 'white', 
        padding: '15px', 
        borderRadius: '15px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', textTransform: 'uppercase' }}>{titulo}</h2>
      </div>

      {noticiasEjemplo.map(n => (
        <div key={n.id} style={{ 
          backgroundColor: 'white', 
          borderRadius: '20px', 
          padding: '20px', 
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
          border: '1px solid #eee'
        }}>
          <small style={{ color: '#2d6a4f', fontWeight: 'bold' }}>{n.fecha}</small>
          <h3 style={{ margin: '10px 0', fontSize: '16px' }}>{n.titular}</h3>
          <p style={{ fontSize: '13px', color: '#666' }}>{n.resumen}</p>
        </div>
      ))}
    </div>
  );
};

export default SeccionNoticias;