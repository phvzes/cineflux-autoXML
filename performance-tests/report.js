
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a performance report from test results
 */
class PerformanceReportGenerator {
  constructor(reportsDir) {
    this.reportsDir = reportsDir || path.join(__dirname, 'reports');
    this.reports = [];
  }

  /**
   * Load all JSON reports from the reports directory
   */
  loadReports() {
    if (!fs.existsSync(this.reportsDir)) {
      console.error(`Reports directory not found: ${this.reportsDir}`);
      return;
    }

    const files = fs.readdirSync(this.reportsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    this.reports = jsonFiles.map(file => {
      const filePath = path.join(this.reportsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      try {
        return JSON.parse(content);
      } catch (error) {
        console.error(`Error parsing ${file}: ${error.message}`);
        return null;
      }
    }).filter(Boolean);

    return this.reports;
  }

  /**
   * Generate a CLI report
   */
  generateCliReport() {
    if (this.reports.length === 0) {
      this.loadReports();
    }

    if (this.reports.length === 0) {
      console.log(chalk.yellow('No performance reports found.'));
      return;
    }

    console.log(chalk.bold.blue('\n=== CineFlux-AutoXML Performance Report ===\n'));

    // Group results by category
    const categories = {
      'WebAssembly Loading': [],
      'Audio Analysis': [],
      'Video Processing': [],
      'Edit Decision Generation': []
    };

    this.reports.forEach(report => {
      report.results.forEach(result => {
        if (result.name.includes('FFmpeg') || result.name.includes('OpenCV') || result.name.includes('Web Audio API')) {
          categories['WebAssembly Loading'].push(result);
        } else if (result.name.includes('Beat') || result.name.includes('Waveform') || result.name.includes('Frequency')) {
          categories['Audio Analysis'].push(result);
        } else if (result.name.includes('Frame') || result.name.includes('Scene') || result.name.includes('Thumbnail')) {
          categories['Video Processing'].push(result);
        } else if (result.name.includes('EDL') || result.name.includes('XML') || result.name.includes('Edit')) {
          categories['Edit Decision Generation'].push(result);
        }
      });
    });

    // Print results by category
    Object.entries(categories).forEach(([category, results]) => {
      if (results.length === 0) return;

      console.log(chalk.bold.green(`\n${category}:`));
      console.log(chalk.gray('─'.repeat(50)));
      
      console.log(chalk.bold('Operation'.padEnd(30) + 'Avg (ms)'.padEnd(12) + 'Min (ms)'.padEnd(12) + 'Max (ms)'));
      console.log(chalk.gray('─'.repeat(50)));
      
      results.forEach(result => {
        const name = result.name.padEnd(30);
        const avg = result.average.toFixed(2).padEnd(12);
        const min = result.min.toFixed(2).padEnd(12);
        const max = result.max.toFixed(2);
        
        console.log(`${name}${avg}${min}${max}`);
      });
    });

    console.log('\n');
  }

  /**
   * Generate a JSON report
   * @param {string} outputPath - Path to save the JSON report
   */
  generateJsonReport(outputPath) {
    if (this.reports.length === 0) {
      this.loadReports();
    }

    if (this.reports.length === 0) {
      console.log(chalk.yellow('No performance reports found.'));
      return;
    }

    const combinedResults = [];
    this.reports.forEach(report => {
      combinedResults.push(...report.results);
    });

    const jsonReport = {
      timestamp: new Date().toISOString(),
      results: combinedResults
    };

    fs.writeFileSync(outputPath, JSON.stringify(jsonReport, null, 2));
    console.log(chalk.green(`JSON report saved to: ${outputPath}`));

    return jsonReport;
  }

  /**
   * Generate a HTML report
   * @param {string} outputPath - Path to save the HTML report
   */
  generateHtmlReport(outputPath) {
    if (this.reports.length === 0) {
      this.loadReports();
    }

    if (this.reports.length === 0) {
      console.log(chalk.yellow('No performance reports found.'));
      return;
    }

    // Group results by category
    const categories = {
      'WebAssembly Loading': [],
      'Audio Analysis': [],
      'Video Processing': [],
      'Edit Decision Generation': []
    };

    this.reports.forEach(report => {
      report.results.forEach(result => {
        if (result.name.includes('FFmpeg') || result.name.includes('OpenCV') || result.name.includes('Web Audio API')) {
          categories['WebAssembly Loading'].push(result);
        } else if (result.name.includes('Beat') || result.name.includes('Waveform') || result.name.includes('Frequency')) {
          categories['Audio Analysis'].push(result);
        } else if (result.name.includes('Frame') || result.name.includes('Scene') || result.name.includes('Thumbnail')) {
          categories['Video Processing'].push(result);
        } else if (result.name.includes('EDL') || result.name.includes('XML') || result.name.includes('Edit')) {
          categories['Edit Decision Generation'].push(result);
        }
      });
    });

    // Generate HTML
    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CineFlux-AutoXML Performance Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #2c3e50;
          text-align: center;
          margin-bottom: 30px;
        }
        h2 {
          color: #3498db;
          border-bottom: 2px solid #3498db;
          padding-bottom: 5px;
          margin-top: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .chart-container {
          height: 300px;
          margin-bottom: 50px;
        }
        .timestamp {
          text-align: center;
          color: #7f8c8d;
          font-size: 0.9em;
          margin-bottom: 30px;
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
      <h1>CineFlux-AutoXML Performance Report</h1>
      <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
    `;

    // Add charts and tables for each category
    Object.entries(categories).forEach(([category, results]) => {
      if (results.length === 0) return;

      const categoryId = category.toLowerCase().replace(/\s+/g, '-');
      
      html += `
        <h2>${category}</h2>
        <div class="chart-container">
          <canvas id="${categoryId}-chart"></canvas>
        </div>
        <table>
          <thead>
            <tr>
              <th>Operation</th>
              <th>Average (ms)</th>
              <th>Median (ms)</th>
              <th>Min (ms)</th>
              <th>Max (ms)</th>
              <th>Iterations</th>
            </tr>
          </thead>
          <tbody>
      `;

      results.forEach(result => {
        html += `
          <tr>
            <td>${result.name}</td>
            <td>${result.average.toFixed(2)}</td>
            <td>${result.median.toFixed(2)}</td>
            <td>${result.min.toFixed(2)}</td>
            <td>${result.max.toFixed(2)}</td>
            <td>${result.iterations}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;
    });

    // Add chart initialization JavaScript
    html += `
      <script>
        document.addEventListener('DOMContentLoaded', function() {
    `;

    Object.entries(categories).forEach(([category, results]) => {
      if (results.length === 0) return;

      const categoryId = category.toLowerCase().replace(/\s+/g, '-');
      
      html += `
          // Chart for ${category}
          new Chart(document.getElementById('${categoryId}-chart'), {
            type: 'bar',
            data: {
              labels: [${results.map(r => `'${r.name}'`).join(', ')}],
              datasets: [
                {
                  label: 'Average Time (ms)',
                  data: [${results.map(r => r.average.toFixed(2)).join(', ')}],
                  backgroundColor: 'rgba(54, 162, 235, 0.5)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                },
                {
                  label: 'Min Time (ms)',
                  data: [${results.map(r => r.min.toFixed(2)).join(', ')}],
                  backgroundColor: 'rgba(75, 192, 192, 0.5)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
                },
                {
                  label: 'Max Time (ms)',
                  data: [${results.map(r => r.max.toFixed(2)).join(', ')}],
                  backgroundColor: 'rgba(255, 99, 132, 0.5)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Time (ms)'
                  }
                }
              }
            }
          });
      `;
    });

    html += `
        });
      </script>
    </body>
    </html>
    `;

    fs.writeFileSync(outputPath, html);
    console.log(chalk.green(`HTML report saved to: ${outputPath}`));

    return html;
  }
}

// If this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new PerformanceReportGenerator();
  generator.generateCliReport();
  generator.generateJsonReport(path.join(__dirname, 'reports', 'combined-report.json'));
  generator.generateHtmlReport(path.join(__dirname, 'reports', 'performance-report.html'));
}

export default PerformanceReportGenerator;
