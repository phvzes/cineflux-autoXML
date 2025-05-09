// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProjectProvider } from './context/ProjectContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { AnalysisProvider } from './context/AnalysisContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProjectProvider>
        <WorkflowProvider>
          <AnalysisProvider>
            <App />
          </AnalysisProvider>
        </WorkflowProvider>
      </ProjectProvider>
    </BrowserRouter>
  </React.StrictMode>
);
