import React from 'react';
import './App.css';
import GridQuestMainContainer from './GridQuestMainContainer';

// PUBLIC_INTERFACE
function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> KAVIA AI
            </div>
            <button className="btn" tabIndex={-1} style={{pointerEvents: 'none', opacity: 0.45}}>
              GridQuest
            </button>
          </div>
        </div>
      </nav>
      <main>
        <div className="container">
          <GridQuestMainContainer />
        </div>
      </main>
    </div>
  );
}

export default App;