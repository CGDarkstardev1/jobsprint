# GEMINI.md: A Guide to the Puter.js AI Automation System

## Directory Overview

This directory contains the implementation guide and setup script for a comprehensive AI automation system built on the Puter.js framework. The system is designed to be a zero-touch, full-stack solution that leverages free AI models for natural language processing, voice recognition, and workflow automation.

The core of this project is the `jobsprint.txt` file, which includes:
- A detailed implementation guide for the system.
- A sophisticated bash script for automated setup and deployment.

## Key Files

- **`jobsprint.txt`**: The main file containing the implementation guide and the setup script. It details the system's architecture, components, and deployment procedures.

## Building and Running

The project is set up and run using the bash script located within `jobsprint.txt`. The script is designed to be executed in a Linux environment and automates the entire setup process.

To run the system, you would first need to extract the bash script from `jobsprint.txt` and then execute it. The script provides a beautiful terminal user interface (TUI) using `gum` to guide the user through the installation process.

### Key Commands

The setup script creates several helper scripts for managing the system:

- **Start the System:**
  ```bash
  sudo puter-startup
  ```

- **Check Status:**
  ```bash
  sudo puter-status
  ```

- **Stop the System:**
  ```bash
  sudo puter-shutdown
  ```

## Development Conventions

The project follows a set of modern development conventions, as inferred from the implementation guide and setup script:

- **Automation:** The entire setup process is automated through a single bash script, ensuring consistency and reducing manual errors.
- **User Experience:** The setup script uses `gum` to create a beautiful and interactive terminal user interface, prioritizing a good user experience.
- **Modularity:** The system is composed of several interconnected services, including a Puter.js application, n8n, PostgreSQL, Redis, and RabbitMQ.
- **Security:** The setup script includes steps for configuring a firewall, setting up SSL certificates, and managing secrets through an environment file.
- **Monitoring:** The system includes a monitoring script that checks the status of services, disk space, and memory usage.
