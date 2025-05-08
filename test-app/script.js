document.addEventListener('DOMContentLoaded', () => {
  // Constants
  const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac'];
  const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/webm'];
  
  // Elements
  const musicDropzone = document.getElementById('music-dropzone');
  const musicError = document.getElementById('music-error');
  const musicFileContainer = document.getElementById('music-file');
  
  const videoDropzone = document.getElementById('video-dropzone');
  const videoError = document.getElementById('video-error');
  const videoFilesContainer = document.getElementById('video-files');
  
  const startButton = document.getElementById('start-button');
  
  // State
  let musicFile = null;
  let videoFiles = [];
  
  // Helper functions
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
  
  function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  function validateAudioFile(file) {
    if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload MP3, WAV, or M4A files.';
    }
    
    if (file.size > MAX_AUDIO_SIZE) {
      return `File is too large. Maximum size is ${formatFileSize(MAX_AUDIO_SIZE)}.`;
    }
    
    return null;
  }
  
  function validateVideoFile(file) {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload MP4, MOV, or MKV files.';
    }
    
    if (file.size > MAX_VIDEO_SIZE) {
      return `File is too large. Maximum size is ${formatFileSize(MAX_VIDEO_SIZE)}.`;
    }
    
    return null;
  }
  
  function updateStartButton() {
    startButton.disabled = !(musicFile && videoFiles.length > 0);
  }
  
  function getVideoDuration(file) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(null);
      };
      
      video.src = URL.createObjectURL(file);
    });
  }
  
  function getAudioDuration(file) {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
      
      audio.onerror = () => {
        window.URL.revokeObjectURL(audio.src);
        resolve(null);
      };
      
      audio.src = URL.createObjectURL(file);
    });
  }
  
  function generateVideoThumbnail(file) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Seek to 25% of the video
        video.currentTime = video.duration * 0.25;
      };
      
      video.onseeked = () => {
        // Create a canvas to capture the thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        
        // Draw the video frame to the canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get the thumbnail as a data URL
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        
        window.URL.revokeObjectURL(video.src);
        resolve(thumbnail);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(null);
      };
      
      video.src = URL.createObjectURL(file);
    });
  }
  
  // Music dropzone event handlers
  musicDropzone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    musicDropzone.classList.add('active');
  });
  
  musicDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    musicDropzone.classList.add('active');
  });
  
  musicDropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    musicDropzone.classList.remove('active');
    musicDropzone.classList.remove('reject');
  });
  
  musicDropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    musicDropzone.classList.remove('active');
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    const file = files[0];
    const error = validateAudioFile(file);
    
    if (error) {
      musicError.textContent = error;
      musicDropzone.classList.add('reject');
      return;
    }
    
    musicError.textContent = '';
    musicFile = file;
    
    // Get audio duration
    const duration = await getAudioDuration(file);
    
    // Display the file
    musicFileContainer.innerHTML = `
      <div class="file-item">
        <div class="file-thumbnail">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B0B0B5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-meta">
            ${file.type} • ${formatFileSize(file.size)} • ${duration ? formatDuration(duration) : 'Unknown duration'}
          </div>
        </div>
        <button class="remove-button" id="remove-music">Remove</button>
      </div>
    `;
    
    document.getElementById('remove-music').addEventListener('click', () => {
      musicFile = null;
      musicFileContainer.innerHTML = '';
      updateStartButton();
    });
    
    updateStartButton();
  });
  
  musicDropzone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPTED_AUDIO_TYPES.join(',');
    
    input.addEventListener('change', async (e) => {
      if (e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const error = validateAudioFile(file);
      
      if (error) {
        musicError.textContent = error;
        return;
      }
      
      musicError.textContent = '';
      musicFile = file;
      
      // Get audio duration
      const duration = await getAudioDuration(file);
      
      // Display the file
      musicFileContainer.innerHTML = `
        <div class="file-item">
          <div class="file-thumbnail">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B0B0B5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          </div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-meta">
              ${file.type} • ${formatFileSize(file.size)} • ${duration ? formatDuration(duration) : 'Unknown duration'}
            </div>
          </div>
          <button class="remove-button" id="remove-music">Remove</button>
        </div>
      `;
      
      document.getElementById('remove-music').addEventListener('click', () => {
        musicFile = null;
        musicFileContainer.innerHTML = '';
        updateStartButton();
      });
      
      updateStartButton();
    });
    
    input.click();
  });
  
  // Video dropzone event handlers
  videoDropzone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    videoDropzone.classList.add('active');
  });
  
  videoDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    videoDropzone.classList.add('active');
  });
  
  videoDropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    videoDropzone.classList.remove('active');
    videoDropzone.classList.remove('reject');
  });
  
  videoDropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    videoDropzone.classList.remove('active');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    // Validate all files
    let hasError = false;
    
    for (const file of files) {
      const error = validateVideoFile(file);
      
      if (error) {
        videoError.textContent = error;
        videoDropzone.classList.add('reject');
        hasError = true;
        break;
      }
    }
    
    if (hasError) return;
    
    videoError.textContent = '';
    
    // Process each valid video file
    for (const file of files) {
      const fileId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add to state
      videoFiles.push(file);
      
      // Create placeholder
      const fileElement = document.createElement('div');
      fileElement.className = 'file-item';
      fileElement.id = fileId;
      fileElement.innerHTML = `
        <div class="file-thumbnail">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B0B0B5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
        </div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-meta">
            ${file.type} • ${formatFileSize(file.size)} • Loading metadata...
          </div>
        </div>
        <button class="remove-button" data-id="${fileId}">Remove</button>
      `;
      
      videoFilesContainer.appendChild(fileElement);
      
      // Get video metadata
      const [duration, thumbnail] = await Promise.all([
        getVideoDuration(file),
        generateVideoThumbnail(file)
      ]);
      
      // Update the file element with metadata
      const fileInfoElement = fileElement.querySelector('.file-info');
      fileInfoElement.querySelector('.file-meta').textContent = 
        `${file.type} • ${formatFileSize(file.size)} • ${duration ? formatDuration(duration) : 'Unknown duration'}`;
      
      // Update thumbnail if available
      if (thumbnail) {
        const thumbnailElement = fileElement.querySelector('.file-thumbnail');
        thumbnailElement.innerHTML = `<img src="${thumbnail}" alt="Thumbnail">`;
      }
      
      // Add remove event listener
      fileElement.querySelector('.remove-button').addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const element = document.getElementById(id);
        const index = Array.from(videoFilesContainer.children).indexOf(element);
        
        if (index !== -1) {
          videoFiles.splice(index, 1);
          element.remove();
          updateStartButton();
        }
      });
    }
    
    updateStartButton();
  });
  
  videoDropzone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPTED_VIDEO_TYPES.join(',');
    input.multiple = true;
    
    input.addEventListener('change', async (e) => {
      if (e.target.files.length === 0) return;
      
      const files = Array.from(e.target.files);
      
      // Validate all files
      let hasError = false;
      
      for (const file of files) {
        const error = validateVideoFile(file);
        
        if (error) {
          videoError.textContent = error;
          hasError = true;
          break;
        }
      }
      
      if (hasError) return;
      
      videoError.textContent = '';
      
      // Process each valid video file
      for (const file of files) {
        const fileId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Add to state
        videoFiles.push(file);
        
        // Create placeholder
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.id = fileId;
        fileElement.innerHTML = `
          <div class="file-thumbnail">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B0B0B5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-meta">
              ${file.type} • ${formatFileSize(file.size)} • Loading metadata...
            </div>
          </div>
          <button class="remove-button" data-id="${fileId}">Remove</button>
        `;
        
        videoFilesContainer.appendChild(fileElement);
        
        // Get video metadata
        const [duration, thumbnail] = await Promise.all([
          getVideoDuration(file),
          generateVideoThumbnail(file)
        ]);
        
        // Update the file element with metadata
        const fileInfoElement = fileElement.querySelector('.file-info');
        fileInfoElement.querySelector('.file-meta').textContent = 
          `${file.type} • ${formatFileSize(file.size)} • ${duration ? formatDuration(duration) : 'Unknown duration'}`;
        
        // Update thumbnail if available
        if (thumbnail) {
          const thumbnailElement = fileElement.querySelector('.file-thumbnail');
          thumbnailElement.innerHTML = `<img src="${thumbnail}" alt="Thumbnail">`;
        }
        
        // Add remove event listener
        fileElement.querySelector('.remove-button').addEventListener('click', (e) => {
          const id = e.target.getAttribute('data-id');
          const element = document.getElementById(id);
          const index = Array.from(videoFilesContainer.children).indexOf(element);
          
          if (index !== -1) {
            videoFiles.splice(index, 1);
            element.remove();
            updateStartButton();
          }
        });
      }
      
      updateStartButton();
    });
    
    input.click();
  });
  
  // Start button event handler
  startButton.addEventListener('click', () => {
    alert('Analysis would start here with:\n' + 
          `Music: ${musicFile.name}\n` + 
          `Videos: ${videoFiles.map(f => f.name).join(', ')}`);
  });
});
