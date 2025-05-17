// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProjectProvider } from './context/ProjectContext';
import { WorkflowProvider } from './context/WorkflowContext';
import { AnalysisProvider } from './context/AnalysisContext';
import AudioService from './services/AudioService';
import './index.css';

// Create an instance of AudioService
const audioService = new AudioService();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProjectProvider>
        <WorkflowProvider audioService={audioService}>
          <AnalysisProvider>
            <App />
          </AnalysisProvider>
        </WorkflowProvider>
      </ProjectProvider>
    </BrowserRouter>
  </React.StrictMode>
);
