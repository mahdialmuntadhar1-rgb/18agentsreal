/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ActiveJobs } from './pages/ActiveJobs';
import { DiscoveryRuns } from './pages/DiscoveryRuns';
import { CollectedRecords } from './pages/CollectedRecords';
import { CleaningWorkspace } from './pages/CleaningWorkspace';
import { StagingQueue } from './pages/StagingQueue';
import { PushControl } from './pages/PushControl';
import { LogsEvents } from './pages/LogsEvents';
import { FinalReportPage } from './pages/reports/FinalReportPage';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'jobs': return <ActiveJobs />;
      case 'discovery': return <DiscoveryRuns />;
      case 'records': return <CollectedRecords />;
      case 'cleaning': return <CleaningWorkspace />;
      case 'staging': return <StagingQueue />;
      case 'push': return <PushControl />;
      case 'logs': return <LogsEvents />;
      case 'final-report': return <FinalReportPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
