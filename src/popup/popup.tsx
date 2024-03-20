import React from 'react';
import ReactDOM from 'react-dom';
import Card from './Card';
import './popup.css';

const App: React.FC = () => {
  return (
    <div className="app" style={{ width: '350px', height: '250px', padding: '20px', backgroundColor: '#fff', color: '#333' }}>
      <h1>Instant Replay</h1>
      <Card
        title="Instant Replay Extension"
        description="Instant Replay Extension."
      />
    </div>
  );
}
const root = document.createElement('div')
document.body.appendChild(root)
ReactDOM.render(<App />, root)