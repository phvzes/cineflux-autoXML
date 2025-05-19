
const fs = require('fs');
const path = require('path');
const { PerformanceTimer, createReport } = require('./perf-helpers');

describe('Edit Decision Generation Performance', () => {
  const ITERATIONS = 5;
  const REPORT_PATH = path.join(__dirname, 'reports', 'edit-decision-report.json');
  let results = [];

  beforeAll(() => {
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
  });

  test('Edit decision list generation performance', async () => {
    const timer = new PerformanceTimer('EDL Generation');
    
    const generateEDL = () => {
      // Mock video analysis data
      const videoAnalysis = {
        scenes: [
          { time: 0.0, confidence: 0.8 },
          { time: 2.5, confidence: 0.9 },
          { time: 5.0, confidence: 0.7 },
          { time: 8.2, confidence: 0.85 },
          { time: 12.7, confidence: 0.95 }
        ],
        duration: 15.0
      };
      
      // Mock audio analysis data
      const audioAnalysis = {
        beats: [
          { time: 0.5, intensity: 0.6 },
          { time: 1.0, intensity: 0.8 },
          { time: 1.5, intensity: 0.5 },
          { time: 2.0, intensity: 0.9 },
          { time: 2.5, intensity: 0.7 },
          // ... more beats
        ],
        duration: 15.0
      };
      
      // Generate edit decision list based on scene changes and beats
      const edl = [];
      let currentTime = 0;
      
      for (let i = 0; i < videoAnalysis.scenes.length - 1; i++) {
        const sceneStart = videoAnalysis.scenes[i].time;
        const sceneEnd = videoAnalysis.scenes[i + 1].time;
        
        // Find beats within this scene
        const sceneBeats = audioAnalysis.beats.filter(
          beat => beat.time >= sceneStart && beat.time < sceneEnd
        );
        
        // Create edit decisions based on beats
        for (let j = 0; j < sceneBeats.length; j++) {
          const beat = sceneBeats[j];
          const nextBeat = sceneBeats[j + 1] || { time: sceneEnd };
          
          edl.push({
            sourceIn: beat.time,
            sourceOut: nextBeat.time,
            recordIn: currentTime,
            recordOut: currentTime + (nextBeat.time - beat.time),
            transition: beat.intensity > 0.7 ? 'CUT' : 'DISSOLVE',
            transitionDuration: beat.intensity > 0.7 ? 0 : 0.5
          });
          
          currentTime += (nextBeat.time - beat.time);
        }
      }
      
      return edl;
    };
    
    const result = await timer.measure(generateEDL, ITERATIONS);
    results.push(result);
    
    console.log(`EDL generation average time: ${result.average.toFixed(2)}ms`);
    
    // Assert that processing time is within acceptable range
    expect(result.average).toBeLessThan(500);
  });

  test('XML export performance', async () => {
    const timer = new PerformanceTimer('XML Export');
    
    const exportXML = () => {
      // Mock edit decision list
      const edl = [
        {
          sourceIn: 0.0,
          sourceOut: 2.5,
          recordIn: 0.0,
          recordOut: 2.5,
          transition: 'CUT',
          transitionDuration: 0
        },
        {
          sourceIn: 2.5,
          sourceOut: 5.0,
          recordIn: 2.5,
          recordOut: 5.0,
          transition: 'DISSOLVE',
          transitionDuration: 0.5
        },
        {
          sourceIn: 5.0,
          sourceOut: 8.2,
          recordIn: 5.0,
          recordOut: 8.2,
          transition: 'CUT',
          transitionDuration: 0
        },
        {
          sourceIn: 8.2,
          sourceOut: 12.7,
          recordIn: 8.2,
          recordOut: 12.7,
          transition: 'DISSOLVE',
          transitionDuration: 0.5
        }
      ];
      
      // Generate XML
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<xmeml version="5">\n';
      xml += '  <sequence>\n';
      xml += '    <name>Auto-Generated Sequence</name>\n';
      xml += '    <duration>15.0</duration>\n';
      xml += '    <rate>\n';
      xml += '      <timebase>30</timebase>\n';
      xml += '      <ntsc>TRUE</ntsc>\n';
      xml += '    </rate>\n';
      xml += '    <media>\n';
      xml += '      <video>\n';
      xml += '        <track>\n';
      
      // Add edit decisions to XML
      for (const edit of edl) {
        xml += '          <clipitem>\n';
        xml += `            <start>${Math.round(edit.recordIn * 30)}</start>\n`;
        xml += `            <end>${Math.round(edit.recordOut * 30)}</end>\n`;
        xml += `            <in>${Math.round(edit.sourceIn * 30)}</in>\n`;
        xml += `            <out>${Math.round(edit.sourceOut * 30)}</out>\n`;
        
        if (edit.transition === 'DISSOLVE' && edit.transitionDuration > 0) {
          xml += '            <effect>\n';
          xml += '              <name>Cross Dissolve</name>\n';
          xml += `              <duration>${Math.round(edit.transitionDuration * 30)}</duration>\n`;
          xml += '            </effect>\n';
        }
        
        xml += '          </clipitem>\n';
      }
      
      xml += '        </track>\n';
      xml += '      </video>\n';
      xml += '    </media>\n';
      xml += '  </sequence>\n';
      xml += '</xmeml>';
      
      return xml;
    };
    
    const result = await timer.measure(exportXML, ITERATIONS);
    results.push(result);
    
    console.log(`XML export average time: ${result.average.toFixed(2)}ms`);
    
    // Assert that processing time is within acceptable range
    expect(result.average).toBeLessThan(300);
  });

  test('Edit decision optimization performance', async () => {
    const timer = new PerformanceTimer('Edit Optimization');
    
    const optimizeEdits = () => {
      // Mock edit decision list with redundant edits
      const edl = [
        {
          sourceIn: 0.0,
          sourceOut: 1.0,
          recordIn: 0.0,
          recordOut: 1.0,
          transition: 'CUT',
          transitionDuration: 0
        },
        {
          sourceIn: 1.0,
          sourceOut: 2.0,
          recordIn: 1.0,
          recordOut: 2.0,
          transition: 'CUT',
          transitionDuration: 0
        },
        {
          sourceIn: 2.0,
          sourceOut: 3.0,
          recordIn: 2.0,
          recordOut: 3.0,
          transition: 'CUT',
          transitionDuration: 0
        },
        {
          sourceIn: 3.0,
          sourceOut: 4.0,
          recordIn: 3.0,
          recordOut: 4.0,
          transition: 'DISSOLVE',
          transitionDuration: 0.5
        },
        {
          sourceIn: 4.0,
          sourceOut: 5.0,
          recordIn: 4.0,
          recordOut: 5.0,
          transition: 'CUT',
          transitionDuration: 0
        },
        {
          sourceIn: 5.0,
          sourceOut: 6.0,
          recordIn: 5.0,
          recordOut: 6.0,
          transition: 'CUT',
          transitionDuration: 0
        }
      ];
      
      // Optimize by combining consecutive cuts
      const optimizedEdl = [];
      let currentEdit = null;
      
      for (const edit of edl) {
        if (!currentEdit) {
          currentEdit = { ...edit };
          continue;
        }
        
        // If current edit and next edit both have CUT transitions, combine them
        if (
          currentEdit.transition === 'CUT' && 
          edit.transition === 'CUT' &&
          Math.abs(currentEdit.sourceOut - edit.sourceIn) < 0.001 &&
          Math.abs(currentEdit.recordOut - edit.recordIn) < 0.001
        ) {
          currentEdit.sourceOut = edit.sourceOut;
          currentEdit.recordOut = edit.recordOut;
        } else {
          optimizedEdl.push(currentEdit);
          currentEdit = { ...edit };
        }
      }
      
      if (currentEdit) {
        optimizedEdl.push(currentEdit);
      }
      
      return optimizedEdl;
    };
    
    const result = await timer.measure(optimizeEdits, ITERATIONS);
    results.push(result);
    
    console.log(`Edit optimization average time: ${result.average.toFixed(2)}ms`);
    
    // Assert that processing time is within acceptable range
    expect(result.average).toBeLessThan(200);
  });

  afterAll(() => {
    // Create a performance report
    createReport(results, REPORT_PATH);
  });
});
