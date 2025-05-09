import React, { useState, useEffect } from 'react';
import { EditingMode } from '../../../types/ProjectSettings';

interface ProjectSettingsFormProps {
  onSettingsChange: (settings: ProjectSettingsFormData) => void;
  initialSettings?: Partial<ProjectSettingsFormData>;
}

export interface ProjectSettingsFormData {
  projectName: string;
  projectDescription: string;
  editingMode: EditingMode;
}

/**
 * Component for editing basic project settings
 */
const ProjectSettingsForm: React.FC<ProjectSettingsFormProps> = ({
  onSettingsChange,
  initialSettings,
}) => {
  const [formData, setFormData] = useState<ProjectSettingsFormData>({
    projectName: initialSettings?.projectName || '',
    projectDescription: initialSettings?.projectDescription || '',
    editingMode: initialSettings?.editingMode || EditingMode.STANDARD,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProjectSettingsFormData, string>>>({});

  // Update parent component when form data changes
  useEffect(() => {
    onSettingsChange(formData);
  }, [formData, onSettingsChange]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof ProjectSettingsFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProjectSettingsFormData, string>> = {};
    
    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = () => {
    validateForm();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Project Settings
        </h2>
        
        {/* Project Name */}
        <div>
          <label
            htmlFor="projectName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="projectName"
            name="projectName"
            value={formData.projectName}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 ${
              errors.projectName
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="Enter project name"
          />
          {errors.projectName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.projectName}</p>
          )}
        </div>
        
        {/* Project Description */}
        <div>
          <label
            htmlFor="projectDescription"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Project Description
          </label>
          <textarea
            id="projectDescription"
            name="projectDescription"
            value={formData.projectDescription}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
            placeholder="Enter project description (optional)"
          />
        </div>
        
        {/* Editing Mode */}
        <div>
          <label
            htmlFor="editingMode"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Editing Style
          </label>
          <select
            id="editingMode"
            name="editingMode"
            value={formData.editingMode}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value={EditingMode.MINIMAL}>Minimal - Fewer cuts, longer takes</option>
            <option value={EditingMode.STANDARD}>Standard - Balanced pacing</option>
            <option value={EditingMode.DYNAMIC}>Dynamic - Frequent cuts, high energy</option>
            <option value={EditingMode.CINEMATIC}>Cinematic - Artistic composition</option>
            <option value={EditingMode.DOCUMENTARY}>Documentary - Content focused</option>
            <option value={EditingMode.CUSTOM}>Custom - Advanced settings</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Select an editing style that best matches your project's needs
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettingsForm;
