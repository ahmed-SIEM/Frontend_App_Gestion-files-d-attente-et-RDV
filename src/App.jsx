import { useState } from 'react';

function App() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000');
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage('❌ Erreur connexion backend - Assure-toi que le backend tourne !');
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px'
    }}>
      <div style={{
        background: 'white',
        padding: '60px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{ 
          fontSize: '48px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🎫 FileZen Frontend
        </h1>
        
        <p style={{ 
          fontSize: '18px',
          color: '#666',
          marginBottom: '40px'
        }}>
          Bienvenue sur l'interface React !
        </p>

        <button 
          onClick={testBackend}
          disabled={loading}
          style={{ 
            padding: '16px 40px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s',
            marginBottom: '30px'
          }}
          onMouseOver={(e) => {
            if (!loading) e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
          }}
        >
          {loading ? '⏳ Test en cours...' : '🔌 Tester la connexion Backend'}
        </button>

        {message && (
          <div style={{
            padding: '20px',
            background: message.includes('❌') ? '#fee' : '#e8f5e9',
            border: `2px solid ${message.includes('❌') ? '#f44336' : '#4caf50'}`,
            borderRadius: '12px',
            marginTop: '20px'
          }}>
            <p style={{ 
              fontSize: '16px',
              color: message.includes('❌') ? '#c62828' : '#2e7d32',
              margin: 0
            }}>
              {message}
            </p>
          </div>
        )}

        <p style={{ 
          marginTop: '30px',
          fontSize: '14px',
          color: '#999'
        }}>
          Powered by React + Vite ⚡
        </p>
      </div>
    </div>
  );
}

export default App;