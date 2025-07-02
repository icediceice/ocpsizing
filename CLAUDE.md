# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an OpenShift Resource Planning Calculator - a single-page web application that helps users calculate resource requirements and capacity planning for OpenShift clusters. The application provides:

1. **Sizing Mode**: Calculate required infrastructure based on workload specifications
2. **Capacity Mode**: Determine workload capacity based on available infrastructure
3. **Export functionality**: Export calculations to Excel format
4. **State persistence**: Save/load configuration states

## Architecture

The application is built as a single-page application with vanilla JavaScript using separated concerns:

- **index.html**: Contains the HTML structure and references to external assets
- **css/style.css**: Contains all application styles and responsive design rules
- **js/main.js**: Contains all application logic and functionality

## Key JavaScript Functions

The main application logic is contained in js/main.js:

- `calculateResources()`: Main calculation function for sizing mode
- `calculateCapacity()`: Main calculation function for capacity mode  
- `calculateSubscriptions()`: Handles OpenShift subscription calculations
- `addWorkload()`: Dynamically adds workload input forms
- `exportToExcel()`: Generates Excel export using XLSX library
- `saveInputsToLocalStorage()`/`loadInputsFromLocalStorage()`: State persistence functionality

## External Dependencies

The application uses CDN-hosted libraries:
- Chart.js (3.9.1): For generating charts and visualizations
- XLSX (0.18.5): For Excel export functionality

## Data Structures

- `workloads[]`: Array storing workload configurations
- `WORKLOAD_PRESETS`: Object containing predefined workload templates for containers and VMs
- `selectedSubscriptionType`: Current subscription model ('core' or 'socket')
- `selectedLoggingStack`: Current logging stack ('elasticsearch' or 'loki')

## Development Notes

Since this is a client-side only application:
- No build process or package manager required
- No separate bundling or transpilation needed
- Open index.html directly in a browser to run
- Code is organized into separate files for maintainability:
  - HTML structure: index.html
  - Styling: css/style.css
  - Logic: js/main.js

## Testing

To test the application:
1. Open index.html in a web browser
2. Test both Sizing and Capacity modes
3. Verify calculations with different workload types
4. Test state save/load functionality
5. Test Excel export feature