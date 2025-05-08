// src/components/edit-decision/EditDecisionControls.tsx
import React, { useState } from 'react';
import { EditDecisionEngineConfig } from '../../engine/EditDecisionEngine';

interface EditDecisionControlsProps {
  /** Current configuration */
  config: EditDecisionEngineConfig;
  /** Callback when configuration is changed */
  onChange: (config: EditDecisionEngineConfig) => void;
  /** Callback when regenerate button is clicked */
  onRegenerate: () => void;
  /** Whether the controls are disabled */
  disabled?: boolean;
}

/**
 * Component for controlling edit decision generation parameters
 */
const EditDecisionControls: React.FC<EditDecisionControlsProps> = ({
  config,
  onChange,
  onRegenerate,
  disabled = false
}) => {
  const [localConfig, setLocalConfig] = useState<EditDecisionEngineConfig>(config);
  
  // Handle slider changes
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof EditDecisionEngineConfig) => {
    const value = parseFloat(e.target.value);
    
    // Update local state
    setLocalConfig(prev => {
      const newConfig = { ...prev, [key]: value };
      return newConfig;
    });
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof EditDecisionEngineConfig) => {
    const value = e.target.checked;
    
    // Update local state
    setLocalConfig(prev => {
      const newConfig = { ...prev, [key]: value };
      return newConfig;
    });
  };
  
  // Handle energy threshold changes
  const handleEnergyThresholdChange = (e: React.ChangeEvent<HTMLInputElement>, level: 'low' | 'medium' | 'high') => {
    const value = parseFloat(e.target.value);
    
    // Update local state
    setLocalConfig(prev => {
      const newConfig = { 
        ...prev, 
        energyThreshold: { 
          ...prev.energyThreshold,
          [level]: value 
        } 
      };
      return newConfig;
    });
  };
  
  // Apply changes
  const applyChanges = () => {
    onChange(localConfig);
  };
  
  // Reset to defaults
  const resetToDefaults = () => {
    const defaultConfig: EditDecisionEngineConfig = {
      beatCutPercentage: 50,
      minSceneDuration: 1.0,
      maxSceneDuration: 5.0,
      prioritizeSceneBoundaries: true,
      energyThreshold: {
        low: 0.3,
        medium: 0.6,
        high: 0.8
      },
      framerate: 30
    };
    
    setLocalConfig(defaultConfig);
    onChange(defaultConfig);
  };
  
  return (
    <div className="edit-decision-controls" style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h3 style={{ marginTop: 0 }}>Edit Decision Controls</h3>
      
      <div className="control-group" style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Beat Cut Percentage: {localConfig.beatCutPercentage}%
        </label>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={localConfig.beatCutPercentage}
          onChange={(e) => handleSliderChange(e, 'beatCutPercentage')}
          disabled={disabled}
          style={{ width: '100%' }}
        />
        <small style={{ color: '#666' }}>
          Percentage of detected beats to use for cuts. Higher values create more cuts.
        </small>
      </div>
      
      <div className="control-group" style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Minimum Scene Duration: {localConfig.minSceneDuration}s
        </label>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={localConfig.minSceneDuration}
          onChange={(e) => handleSliderChange(e, 'minSceneDuration')}
          disabled={disabled}
          style={{ width: '100%' }}
        />
        <small style={{ color: '#666' }}>
          Minimum duration between cuts in seconds.
        </small>
      </div>
      
      <div className="control-group" style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Maximum Scene Duration: {localConfig.maxSceneDuration}s
        </label>
        <input
          type="range"
          min="2"
          max="10"
          step="0.5"
          value={localConfig.maxSceneDuration}
          onChange={(e) => handleSliderChange(e, 'maxSceneDuration')}
          disabled={disabled}
          style={{ width: '100%' }}
        />
        <small style={{ color: '#666' }}>
          Maximum duration between cuts in seconds.
        </small>
      </div>
      
      <div className="control-group" style={{ marginBottom: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={localConfig.prioritizeSceneBoundaries}
            onChange={(e) => handleCheckboxChange(e, 'prioritizeSceneBoundaries')}
            disabled={disabled}
            style={{ marginRight: '8px' }}
          />
          Prioritize Scene Boundaries
        </label>
        <small style={{ color: '#666', marginLeft: '24px', display: 'block' }}>
          When enabled, cuts will prefer to align with scene boundaries rather than exact beat times.
        </small>
      </div>
      
      <div className="control-group" style={{ marginBottom: '15px' }}>
        <h4 style={{ marginBottom: '10px' }}>Energy Thresholds</h4>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Low Energy: {localConfig.energyThreshold?.low.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="0.5"
            step="0.05"
            value={localConfig.energyThreshold?.low}
            onChange={(e) => handleEnergyThresholdChange(e, 'low')}
            disabled={disabled}
            style={{ width: '100%' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Medium Energy: {localConfig.energyThreshold?.medium.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.4"
            max="0.8"
            step="0.05"
            value={localConfig.energyThreshold?.medium}
            onChange={(e) => handleEnergyThresholdChange(e, 'medium')}
            disabled={disabled}
            style={{ width: '100%' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            High Energy: {localConfig.energyThreshold?.high.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.7"
            max="1.0"
            step="0.05"
            value={localConfig.energyThreshold?.high}
            onChange={(e) => handleEnergyThresholdChange(e, 'high')}
            disabled={disabled}
            style={{ width: '100%' }}
          />
        </div>
        
        <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
          Energy thresholds determine which transitions are used based on audio energy.
        </small>
      </div>
      
      <div className="control-group" style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Output Framerate: {localConfig.framerate} fps
        </label>
        <select
          value={localConfig.framerate}
          onChange={(e) => handleSliderChange(e, 'framerate')}
          disabled={disabled}
          style={{ width: '100%', padding: '5px' }}
        >
          <option value={23.976}>23.976 fps</option>
          <option value={24}>24 fps</option>
          <option value={25}>25 fps</option>
          <option value={29.97}>29.97 fps</option>
          <option value={30}>30 fps</option>
          <option value={50}>50 fps</option>
          <option value={59.94}>59.94 fps</option>
          <option value={60}>60 fps</option>
        </select>
        <small style={{ color: '#666' }}>
          Framerate for the output sequence.
        </small>
      </div>
      
      <div className="control-buttons" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={applyChanges}
          disabled={disabled}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1
          }}
        >
          Apply Changes
        </button>
        
        <button
          onClick={resetToDefaults}
          disabled={disabled}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1
          }}
        >
          Reset to Defaults
        </button>
        
        <button
          onClick={onRegenerate}
          disabled={disabled}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1
          }}
        >
          Regenerate Edit
        </button>
      </div>
    </div>
  );
};

export default EditDecisionControls;
