// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ProjectProvider } from './context/ProjectContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { AnalysisProvider } from './context/AnalysisContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProjectProvider>
      <WorkflowProvider>
        <AnalysisProvider>
          <App />
        </AnalysisProvider>
      </WorkflowProvider>
    </ProjectProvider>
  </React.StrictMode>
);
