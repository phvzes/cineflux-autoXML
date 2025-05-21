// Mock for @ffmpeg/ffmpeg
import { jest } from '@jest/globals';

export class FFmpeg {
  constructor() {
    this.load = jest.fn().mockResolvedValue(undefined);
    this.run = jest.fn().mockResolvedValue(undefined);
    this.FS = jest.fn().mockImplementation((cmd, fileName, data) => {
      if (cmd === 'readFile') {
        if (fileName === 'output.json') {
          return new TextEncoder().encode(JSON.stringify({
            streams: [{
              width: 1920,
              height: 1080,
              duration: '60.0',
              r_frame_rate: '30/1',
              codec_name: 'h264',
              bit_rate: '5000000'
            }]
          }));
        } else if (fileName === 'thumbnail.jpg') {
          return new Uint8Array([1, 2, 3]); // Mock image data
        }
      }
      return undefined;
    });
  }
}

export const createFFmpeg = () => new FFmpeg();

export const fetchFile = jest.fn().mockResolvedValue(new Uint8Array());
