import { AgentDashboard } from './components/AgentDashboard';
import { LiveLogs } from './components/LiveLogs';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AgentDashboard />
      <div className="p-6 pt-0">
        <LiveLogs />
      </div>
    </div>
  );
}

export default App;
