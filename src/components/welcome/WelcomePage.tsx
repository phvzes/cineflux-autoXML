import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Video, 
  Music, 
  Clock, 
  Zap, 
  Code, 
  Settings, 
  ChevronRight, 
  Calendar,
  Edit3
} from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { colorPalette } from '@/theme';
import './WelcomePage.css';

/**
 * Props for the WelcomePage component
 */
interface WelcomePageProps {
  /**
   * Callback function when the "Get Started" button is clicked
   */
  onGetStarted: () => void;
}

// Mock data for recent projects
const MOCK_RECENT_PROJECTS = [
  {
    id: 'proj-001',
    name: 'Summer Music Video',
    lastOpened: new Date(2025, 4, 5), // May 5, 2025
    status: 'completed',
    thumbnail: '/thumbnails/summer-video.jpg'
  },
  {
    id: 'proj-002',
    name: 'Product Launch Promo',
    lastOpened: new Date(2025, 4, 3), // May 3, 2025
    status: 'in-progress',
    thumbnail: '/thumbnails/product-launch.jpg'
  },
  {
    id: 'proj-003',
    name: 'Interview Series',
    lastOpened: new Date(2025, 4, 1), // May 1, 2025
    status: 'completed',
    thumbnail: '/thumbnails/interview.jpg'
  },
  {
    id: 'proj-004',
    name: 'Travel Montage',
    lastOpened: new Date(2025, 3, 28), // April 28, 2025
    status: 'in-progress',
    thumbnail: '/thumbnails/travel.jpg'
  }
];

// Feature highlight data
const FEATURES = [
  {
    icon: <Zap size={24} />,
    title: 'Automated Editing',
    description: 'Intelligent algorithms analyze your footage and music to create perfectly timed cuts.'
  },
  {
    icon: <Music size={24} />,
    title: 'Music Sync',
    description: 'Automatically sync video clips to the beat and mood of your soundtrack.'
  },
  {
    icon: <Video size={24} />,
    title: 'Scene Detection',
    description: 'Smart scene detection identifies the best moments in your footage.'
  },
  {
    icon: <Code size={24} />,
    title: 'XML Export',
    description: 'Export directly to industry-standard XML format for seamless integration with Premiere Pro.'
  },
  {
    icon: <Settings size={24} />,
    title: 'Customizable',
    description: 'Fine-tune the automated results with intuitive controls and settings.'
  },
  {
    icon: <Edit3 size={24} />,
    title: 'Edit Preview',
    description: 'Preview your edits in real-time before exporting to your NLE.'
  }
];

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="feature-card">
      <div className="feature-icon-container">
        <div className="feature-icon">{icon}</div>
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );
};

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    lastOpened: Date;
    status: string;
    thumbnail?: string;
  };
  onClick: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="project-card cursor-pointer" onClick={() => onClick(project.id)}>
      {project.thumbnail ? (
        <div 
          className="project-thumbnail"
          style={{ backgroundImage: `url(${project.thumbnail})` }}
        ></div>
      ) : (
        <div className="project-thumbnail-placeholder">
          <FileText size={32} className="text-[#FF7A45]" />
        </div>
      )}
      
      <div className="project-details">
        <div className="flex justify-between items-start mb-2">
          <h3 className="project-title mr-2">{project.name}</h3>
          <div className={`project-status ${project.status === 'completed' ? 'status-completed' : 'status-in-progress'}`}>
            {project.status === 'completed' ? 'Completed' : 'In Progress'}
          </div>
        </div>
        <div className="project-date">
          <Clock size={14} className="mr-1" />
          <span>{formatDate(project.lastOpened)}</span>
        </div>
      </div>
    </div>
  );
};

export const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted }) => {
  const { dispatch } = useProject();
  const [recentProjects, setRecentProjects] = useState(MOCK_RECENT_PROJECTS);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  useEffect(() => {
    // Update date every minute (for "Today" display)
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleCreateNewProject = () => {
    // Navigate to the input step
    dispatch({ type: 'SET_STEP', payload: 'input' });
  };
  
  const handleOpenProject = (projectId: string) => {
    // In a real app, this would load the project data
    console.log(`Opening project: ${projectId}`);
    // For now, just navigate to the input step
    dispatch({ type: 'SET_STEP', payload: 'input' });
  };
  
  return (
    <div className="welcome-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="welcome-header">
          <h1 className="welcome-title">
            Welcome to CineFlux-AutoXML
          </h1>
          <p className="welcome-subtitle">
            Intelligent video editing automation for content creators and filmmakers
          </p>
        </div>
        
        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <button 
            className="action-card create-project-card flex flex-col items-center justify-center p-8"
            onClick={handleCreateNewProject}
          >
            <FileText size={48} className="mb-4" />
            <span className="text-2xl font-semibold">Create New Project</span>
            <span className="mt-2 opacity-80">Start from scratch with a new video project</span>
          </button>
          
          <div className="action-card date-card flex flex-col p-8">
            <div className="flex items-center mb-6">
              <Calendar size={24} className="text-[#FF7A45] mr-2" />
              <h2 className="text-2xl font-semibold text-[#F5F5F7]">
                Today's Date
              </h2>
            </div>
            <div className="flex-grow flex flex-col justify-center items-center">
              <div className="text-4xl font-bold mb-2 text-[#F5F5F7]">
                {currentDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <p className="text-[#B0B0B5]">
                Ready to create something amazing today?
              </p>
            </div>
          </div>
        </div>
        
        {/* Recent Projects */}
        <div className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="section-title">
              Recent Projects
            </h2>
            <button className="flex items-center text-sm text-[#FF7A45] hover:text-[#FF6A35] transition-colors duration-200">
              View All
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentProjects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={handleOpenProject}
              />
            ))}
          </div>
        </div>
        
        {/* Features */}
        <div>
          <h2 className="section-title">
            Powerful Features
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
