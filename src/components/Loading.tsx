/**
 * Loading.tsx
 * 
 * A loading spinner component used during lazy loading of components.
 */

import React from 'react';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }: any) => {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-gray-900">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xl text-white">{message}</p>
      </div>
    </div>
  );
};

export default Loading;
