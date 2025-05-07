import React from 'react';
import { WorkflowProvider, useWorkflow } from './context/WorkflowContext';
import { WorkflowStepper } from './components/WorkflowStepper';
import { AccessibleDialog } from './components/AccessibleDialog';
import { Loading, ErrorState } from './components/AsyncStates';
import { ApplicationStep } from './types/UITypes';
import { colorPalette } from './theme';

// Placeholder component for each step
const StepContent: React.FC<{ step: ApplicationStep }> = ({ step }) => {
  const { state, setStep, startProcessing, updateProgress, completeProcessing } = useWorkflow();

  // Simulate processing for demo purposes
  const handleStartProcessing = () => {
    startProcessing(`Processing ${step}...`);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      updateProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        completeProcessing();
      }
    }, 500);
  };

  // Determine which step to render
  const renderStepContent = () => {
    switch (step) {
      case ApplicationStep.WELCOME:
        return (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ color: colorPalette.offWhite }}>
              Welcome to CineFlux-AutoXML
            </h1>
            <p className="mb-6" style={{ color: colorPalette.lightGrey }}>
              A powerful tool for automating XML generation for video editing projects.
            </p>
            <button
              className="px-6 py-3 rounded-md transition-colors duration-200"
              style={{
                backgroundColor: colorPalette.subtleOrange,
                color: colorPalette.offWhite,
              }}
              onClick={() => setStep(ApplicationStep.FILE_UPLOAD)}
            >
              Get Started
            </button>
          </div>
        );
      
      case ApplicationStep.FILE_UPLOAD:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: colorPalette.offWhite }}>
              Upload Media Files
            </h2>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center mb-4"
              style={{
                borderColor: colorPalette.darkGrey,
                backgroundColor: colorPalette.richBlack,
                color: colorPalette.lightGrey,
              }}
            >
              <p className="mb-2">Drag and drop files here or click to browse</p>
              <button
                className="px-4 py-2 rounded-md mt-2"
                style={{
                  backgroundColor: colorPalette.darkGrey,
                  color: colorPalette.offWhite,
                }}
              >
                Browse Files
              </button>
            </div>
            <div className="flex justify-between mt-6">
              <button
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: 'transparent',
                  color: colorPalette.lightGrey,
                  border: `1px solid ${colorPalette.darkGrey}`,
                }}
                onClick={() => setStep(ApplicationStep.WELCOME)}
              >
                Back
              </button>
              <button
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: colorPalette.subtleOrange,
                  color: colorPalette.offWhite,
                }}
                onClick={() => setStep(ApplicationStep.MEDIA_ANALYSIS)}
              >
                Continue
              </button>
            </div>
          </div>
        );
      
      case ApplicationStep.MEDIA_ANALYSIS:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: colorPalette.offWhite }}>
              Media Analysis
            </h2>
            <p className="mb-6" style={{ color: colorPalette.lightGrey }}>
              Analyze your media files to extract metadata and prepare for XML generation.
            </p>
            <div className="mb-6">
              <div
                className="p-4 rounded-md mb-2"
                style={{ backgroundColor: colorPalette.darkGrey }}
              >
                <div className="flex justify-between items-center">
                  <span style={{ color: colorPalette.offWhite }}>video_file.mp4</span>
                  <span style={{ color: colorPalette.subtleGreen }}>Ready for analysis</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: 'transparent',
                  color: colorPalette.lightGrey,
                  border: `1px solid ${colorPalette.darkGrey}`,
                }}
                onClick={() => setStep(ApplicationStep.FILE_UPLOAD)}
              >
                Back
              </button>
              <button
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: colorPalette.subtleOrange,
                  color: colorPalette.offWhite,
                }}
                onClick={handleStartProcessing}
                disabled={state.isProcessing}
              >
                {state.isProcessing ? 'Analyzing...' : 'Start Analysis'}
              </button>
            </div>
          </div>
        );
      
      case ApplicationStep.EDIT_CONFIGURATION:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: colorPalette.offWhite }}>
              Edit Configuration
            </h2>
            <p className="mb-6" style={{ color: colorPalette.lightGrey }}>
              Configure the XML generation settings.
            </p>
            <div
              className="p-4 rounded-md mb-4"
              style={{ backgroundColor: colorPalette.darkGrey }}
            >
              <h3 className="font-medium mb-2" style={{ color: colorPalette.offWhite }}>
                XML Format
              </h3>
              <select
                className="w-full p-2 rounded-md mb-4"
                style={{
                  backgroundColor: colorPalette.richBlack,
                  color: colorPalette.offWhite,
                  border: `1px solid ${colorPalette.darkGrey}`,
                }}
              >
                <option value="fcpxml">Final Cut Pro XML</option>
                <option value="premiere">Adobe Premiere XML</option>
                <option value="davinci">DaVinci Resolve XML</option>
              </select>
              
              <h3 className="font-medium mb-2" style={{ color: colorPalette.offWhite }}>
                Timeline Settings
              </h3>
              <div className="flex mb-2">
                <div className="flex-1 mr-2">
                  <label
                    className="block mb-1 text-sm"
                    style={{ color: colorPalette.lightGrey }}
                  >
                    Frame Rate
                  </label>
                  <select
                    className="w-full p-2 rounded-md"
                    style={{
                      backgroundColor: colorPalette.richBlack,
                      color: colorPalette.offWhite,
                      border: `1px solid ${colorPalette.darkGrey}`,
                    }}
                  >
                    <option value="23.976">23.976 fps</option>
                    <option value="24">24 fps</option>
                    <option value="25">25 fps</option>
                    <option value="29.97">29.97 fps</option>
                    <option value="30">30 fps</option>
                    <option value="60">60 fps</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label
                    className="block mb-1 text-sm"
                    style={{ color: colorPalette.lightGrey }}
                  >
                    Resolution
                  </label>
                  <select
                    className="w-full p-2 rounded-md"
                    style={{
                      backgroundColor: colorPalette.richBlack,
                      color: colorPalette.offWhite,
                      border: `1px solid ${colorPalette.darkGrey}`,
                    }}
                  >
                    <option value="1920x1080">1920x1080 (HD)</option>
                    <option value="3840x2160">3840x2160 (4K UHD)</option>
                    <option value="4096x2160">4096x2160 (4K DCI)</option>
                    <option value="1280x720">1280x720 (HD 720p)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: 'transparent',
                  color: colorPalette.lightGrey,
                  border: `1px solid ${colorPalette.darkGrey}`,
                }}
                onClick={() => setStep(ApplicationStep.MEDIA_ANALYSIS)}
              >
                Back
              </button>
              <button
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: colorPalette.subtleOrange,
                  color: colorPalette.offWhite,
                }}
                onClick={() => setStep(ApplicationStep.PREVIEW)}
              >
                Continue
              </button>
            </div>
          </div>
        );
      
      case ApplicationStep.PREVIEW:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: colorPalette.offWhite }}>
              Preview
            </h2>
            <p className="mb-6" style={{ color: colorPalette.lightGrey }}>
              Preview the generated XML before exporting.
            </p>
            <div
              className="p-4 rounded-md mb-4 font-mono text-sm overflow-auto"
              style={{
                backgroundColor: colorPalette.darkGrey,
                color: colorPalette.offWhite,
                maxHeight: '300px',
              }}
            >
              <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat1080p24" frameDuration="1/24s" width="1920" height="1080"/>
    <asset id="r2" name="video_file.mp4" start="0s" duration="60s" format="r1" hasAudio="1" hasVideo="1"/>
  </resources>
  <library>
    <event name="CineFlux Event">
      <project name="CineFlux Project">
        <sequence format="r1" duration="60s">
          <spine>
            <clip name="video_file" offset="0s" duration="60s" start="0s">
              <video ref="r2" offset="0s" start="0s" duration="60s"/>
              <audio ref="r2" offset="0s" start="0s" duration="60s"/>
            </clip>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`}</pre>
            </div>
            <div className="flex justify-between mt-6">
              <button
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: 'transparent',
                  color: colorPalette.lightGrey,
                  border: `1px solid ${colorPalette.darkGrey}`,
                }}
                onClick={() => setStep(ApplicationStep.EDIT_CONFIGURATION)}
              >
                Back
              </button>
              <button
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: colorPalette.subtleOrange,
                  color: colorPalette.offWhite,
                }}
                onClick={() => setStep(ApplicationStep.EXPORT)}
              >
                Continue to Export
              </button>
            </div>
          </div>
        );
      
      case ApplicationStep.EXPORT:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: colorPalette.offWhite }}>
              Export
            </h2>
            <p className="mb-6" style={{ color: colorPalette.lightGrey }}>
              Export your XML file for use in your video editing software.
            </p>
            <div
              className="p-6 rounded-md mb-6 text-center"
              style={{ backgroundColor: colorPalette.darkGrey }}
            >
              <h3 className="font-medium mb-4" style={{ color: colorPalette.offWhite }}>
                Export Options
              </h3>
              <div className="flex justify-center space-x-4">
                <button
                  className="px-4 py-3 rounded-md flex flex-col items-center"
                  style={{
                    backgroundColor: colorPalette.richBlack,
                    color: colorPalette.offWhite,
                    border: `1px solid ${colorPalette.subtleOrange}`,
                  }}
                  onClick={handleStartProcessing}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="mt-2">Download XML</span>
                </button>
                <button
                  className="px-4 py-3 rounded-md flex flex-col items-center"
                  style={{
                    backgroundColor: colorPalette.richBlack,
                    color: colorPalette.offWhite,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 16V17C4 17.5304 4.21071 18.0391 4.58579 18.4142C4.96086 18.7893 5.46957 19 6 19H18C18.5304 19 19.0391 18.7893 19.4142 18.4142C19.7893 18.0391 20 17.5304 20 17V16M16 8L12 4M12 4L8 8M12 4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="mt-2">Copy to Clipboard</span>
                </button>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: 'transparent',
                  color: colorPalette.lightGrey,
                  border: `1px solid ${colorPalette.darkGrey}`,
                }}
                onClick={() => setStep(ApplicationStep.PREVIEW)}
              >
                Back
              </button>
              <button
                className="px-4 py-2 rounded-md"
                style={{
                  backgroundColor: colorPalette.subtleGreen,
                  color: colorPalette.offWhite,
                }}
                onClick={() => setStep(ApplicationStep.WELCOME)}
              >
                Start New Project
              </button>
            </div>
          </div>
        );
      
      case ApplicationStep.SETTINGS:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: colorPalette.offWhite }}>
              Settings
            </h2>
            <div
              className="p-4 rounded-md mb-4"
              style={{ backgroundColor: colorPalette.darkGrey }}
            >
              <h3 className="font-medium mb-2" style={{ color: colorPalette.offWhite }}>
                Application Settings
              </h3>
              <div className="mb-4">
                <label
                  className="flex items-center"
                  style={{ color: colorPalette.offWhite }}
                >
                  <input
                    type="checkbox"
                    className="mr-2"
                  />
                  Enable auto-save
                </label>
              </div>
              <div className="mb-4">
                <label
                  className="block mb-1 text-sm"
                  style={{ color: colorPalette.lightGrey }}
                >
                  Default XML Format
                </label>
                <select
                  className="w-full p-2 rounded-md"
                  style={{
                    backgroundColor: colorPalette.richBlack,
                    color: colorPalette.offWhite,
                    border: `1px solid ${colorPalette.darkGrey}`,
                  }}
                >
                  <option value="fcpxml">Final Cut Pro XML</option>
                  <option value="premiere">Adobe Premiere XML</option>
                  <option value="davinci">DaVinci Resolve XML</option>
                </select>
              </div>
            </div>
            <button
              className="px-4 py-2 rounded-md"
              style={{
                backgroundColor: colorPalette.subtleOrange,
                color: colorPalette.offWhite,
              }}
              onClick={() => setStep(state.stepHistory[state.stepHistory.length - 1] || ApplicationStep.WELCOME)}
            >
              Back to Previous Step
            </button>
          </div>
        );
      
      default:
        return <ErrorState message="Unknown step" />;
    }
  };

  return (
    <div className="p-6">
      {state.isProcessing && step !== ApplicationStep.MEDIA_ANALYSIS ? (
        <Loading message={state.statusMessage} />
      ) : (
        renderStepContent()
      )}
    </div>
  );
};

// Main App component
const AppContent: React.FC = () => {
  const { state, setStep } = useWorkflow();
  const [showHelpDialog, setShowHelpDialog] = React.useState(false);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colorPalette.richBlack, color: colorPalette.offWhite }}
    >
      <header
        className="p-4 flex justify-between items-center"
        style={{ backgroundColor: colorPalette.charcoal }}
      >
        <div className="flex items-center">
          <h1 className="text-xl font-bold">CineFlux-AutoXML</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-md"
            style={{ backgroundColor: colorPalette.darkGrey }}
            onClick={() => setShowHelpDialog(true)}
            aria-label="Help"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 17V17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 10C9 8.89543 9.89543 8 11 8H12C13.1046 8 14 8.89543 14 10C14 10.9337 13.3601 11.7414 12.4949 11.9397C12.2273 12.0131 12 12.2339 12 12.5V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className="p-2 rounded-md"
            style={{ backgroundColor: colorPalette.darkGrey }}
            onClick={() => setStep(ApplicationStep.SETTINGS)}
            aria-label="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="mb-8">
          <WorkflowStepper
            currentStep={state.currentStep}
            isProcessing={state.isProcessing}
            progressPercentage={state.progressPercentage}
            statusMessage={state.statusMessage}
            onStepClick={setStep}
          />
        </div>

        <div
          className="p-6 rounded-lg"
          style={{ backgroundColor: colorPalette.charcoal }}
        >
          <StepContent step={state.currentStep} />
        </div>
      </div>

      {/* Help Dialog */}
      {showHelpDialog && (
        <AccessibleDialog
          isOpen={showHelpDialog}
          onClose={() => setShowHelpDialog(false)}
          title="Help & Keyboard Shortcuts"
          description="Learn how to use CineFlux-AutoXML efficiently"
        >
          <div>
            <h3 className="text-lg font-medium mb-2" style={{ color: colorPalette.offWhite }}>
              Keyboard Shortcuts
            </h3>
            <div
              className="p-4 rounded-md mb-4"
              style={{ backgroundColor: colorPalette.darkGrey }}
            >
              <div className="grid grid-cols-2 gap-2">
                <div style={{ color: colorPalette.lightGrey }}>Next Step</div>
                <div style={{ color: colorPalette.offWhite }}>Alt + Right Arrow</div>
                <div style={{ color: colorPalette.lightGrey }}>Previous Step</div>
                <div style={{ color: colorPalette.offWhite }}>Alt + Left Arrow</div>
                <div style={{ color: colorPalette.lightGrey }}>Open Settings</div>
                <div style={{ color: colorPalette.offWhite }}>Alt + S</div>
                <div style={{ color: colorPalette.lightGrey }}>Help</div>
                <div style={{ color: colorPalette.offWhite }}>Alt + H</div>
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-2" style={{ color: colorPalette.offWhite }}>
              Getting Started
            </h3>
            <p className="mb-4" style={{ color: colorPalette.lightGrey }}>
              CineFlux-AutoXML helps you generate XML files for video editing software. Follow the step-by-step process to upload your media, analyze it, configure settings, and export the final XML.
            </p>
            
            <button
              className="w-full px-4 py-2 rounded-md"
              style={{
                backgroundColor: colorPalette.subtleOrange,
                color: colorPalette.offWhite,
              }}
              onClick={() => setShowHelpDialog(false)}
            >
              Close
            </button>
          </div>
        </AccessibleDialog>
      )}
    </div>
  );
};

// Wrap the app with the workflow provider
const App: React.FC = () => {
  return (
    <WorkflowProvider>
      <AppContent />
    </WorkflowProvider>
  );
};

export default App;
