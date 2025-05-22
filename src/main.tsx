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

console.log('Main.tsx: Starting application initialization');

// Check if root element exists
const rootElement = document.getElementById('root');
console.log('Main.tsx: Root element found:', rootElement);

// Create an instance of AudioService
const audioService = new AudioService();
console.log('Main.tsx: AudioService created');

try {
  console.log('Main.tsx: Attempting to create React root and render app');
  const root = ReactDOM.createRoot(rootElement!);
  root.render(
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
  console.log('Main.tsx: App rendered successfully');
} catch (error) {
  console.error('Main.tsx: Error rendering application:', error);
}
