/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import CommandCenter from "./pages/CommandCenter";
import Overview from "./pages/Overview";
import ApprovalHub from "./pages/ApprovalHub";
import FinalReport from "./pages/FinalReport";
import PilotRuns from "./pages/PilotRuns";
import Agents from "./pages/Agents";
import AgentCommander from "./pages/AgentCommander";
import Pipelines from "./pages/Pipelines";
import TaskManager from "./pages/TaskManager";
import QC from "./pages/QC";
import ReviewTable from "./pages/ReviewTable";
import DataCleaner from "./pages/DataCleaner";
import Logs from "./pages/Logs";
import Export from "./pages/Export";

import { AuthProvider } from "./AuthContext";
import { SupabaseSetupGuard } from "./components/SupabaseSetupGuard";

export default function App() {
  return (
    <SupabaseSetupGuard>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<CommandCenter />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/approval" element={<ApprovalHub />} />
              <Route path="/report" element={<FinalReport />} />
              <Route path="/pilot" element={<PilotRuns />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/commander" element={<AgentCommander />} />
              <Route path="/pipelines" element={<Pipelines />} />
              <Route path="/tasks" element={<TaskManager />} />
              <Route path="/qc" element={<QC />} />
              <Route path="/review" element={<ReviewTable />} />
              <Route path="/cleaner" element={<DataCleaner />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/export" element={<Export />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </SupabaseSetupGuard>
  );
}
