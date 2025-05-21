// FFmpeg.wasm worker file
// This is a minimal worker file that will be used by FFmpeg.wasm
self.onmessage = function(e) {
  const { type, data } = e.data;
  if (type === 'run') {
    // Process data and post back results
    self.postMessage({ type: 'done', data: data });
  }
};
