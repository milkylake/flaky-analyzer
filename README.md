# Playwright Flaky Test Analyzer (flaky-analyzer)

This project is a Playwright plugin (`flaky-analyzer`) and an accompanying dashboard (`flaky-analyzer-dashboard`) designed to detect, analyze, and help diagnose unstable (flaky) tests in Playwright projects. It collects detailed information about each test attempt, identifies tests with inconsistent outcomes, and provides a web interface to visualize these results and potential causes of flakiness.

## Core Components

1.  **`flaky-analyzer` (Plugin):** A Playwright reporter that collects data on test executions (status, duration, errors, attachments like traces/screenshots/videos) and identifies flaky tests.
2.  **`flaky-analyzer-dashboard` (Dashboard):** A web application that reads the reporter's output file and displays an interactive dashboard for analyzing flaky tests, showing attempt details, error summaries, and potential reasons for flakiness.

## Requirements

*   Node.js and npm
*   A Playwright project

## Installation

1.  **Clone the repository** (which includes the plugin and dashboard) into your project:
    ```bash
    git clone https://github.com/milkylake/flaky-analyzer
    cd flaky-analyzer
    ```

2.  **Install dependencies for the plugin**:
    ```bash
    cd flaky-analyzer-plugin
    npm install
    cd ..
    ```

3.  **Install dependencies for the dashboard**:
    ```bash
    cd flaky-analyzer-dashboard
    npm install
    cd ..
    ```

4.  **Configure Playwright Reporter**:
    Open your Playwright configuration file (`playwright.config.ts` or `.js`) and add `flaky-analyzer` to the `reporter` array. Ensure the relative path to the plugin directory is correct.
    ```typescript
    import { defineConfig } from '@playwright/test';

    export default defineConfig({
      // ... other configurations
      retries: process.env.CI ? 2 : 3, // Example: Recommended to have retries for flaky test detection
      reporter: [
        ['./flaky-analyzer-plugin'] // Path to the plugin directory (relative to playwright.config.ts)
                                   // If you cloned `flaky-analyzer` into your project root, this would be
                                   // './flaky-analyzer/flaky-analyzer-plugin'
      ],
      // ... other configurations
    });
    ```
    *Adjust the path `'./flaky-analyzer-plugin'` based on where your `playwright.config.ts` is located relative to the cloned `flaky-analyzer-plugin` directory.*

## Usage

1.  **Run your Playwright tests** as usual:
    ```bash
    npx playwright test
    ```
    During execution, the `flaky-analyzer` plugin will collect data and, upon completion, create a report file in your project's root directory (or where Playwright is run).

2.  **Start the Analysis Dashboard**:
    Navigate to the dashboard directory and start it:
    ```bash
    cd flaky-analyzer-dashboard // Or the correct path to your dashboard directory
    npm run dev
    ```
    Open your browser and go to `http://localhost:8080` (or the port indicated in your terminal) to view the dashboard and analyze the test results.

## Authors and contributors

The main contributor Nurislam Z. Ainaliev, student of SPbPU ICSC. The advisor and contributor Vladimir A. Parkhomenko., Seniour Lecturer of SPbPU ICSC.

The project is completed during the preparation of Nurislam Z. Ainaliev work under course Testing of software at SPbPU Institute of Computer Science and Cybersecurity (SPbPU ICSC).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.
