# Browser Subagent Authentication Technique for JobSprint

## Overview

This document captures a critical technique for handling "Universal Login" and complex authentication flows, specifically for the JobSprint project. The technique involves using an autonomous `browser_subagent` to visually interact with authentication pages, mirroring human behavior.

## The Technique

Instead of trying to reverse-engineer API calls or handle complex OAuth tokens manually (which often fails due to security measures, CRSF tokens, etc.), we leverage the `browser_subagent` tool.

### Steps

1.  **Launch Browser Subagent**: Initiate the `browser_subagent` with a task specifically focused on login.
2.  **Visual Navigation**: The subagent uses visual selectors (clicking pixels, finding text) to navigate the login forms.
3.  **Credential Entry**: The subagent enters credentials (securely provided) into the standard web forms.
4.  **Verification**: The subagent verifies the login was successful by checking for a post-login state (e.g., dashboard element, redirect).
5.  **Session Persistence**: Once logged in, the browser session (cookies, local storage) is maintained for subsequent actions.

## Application to JobSprint

For JobSprint, we will use this method to authenticate with job boards and platforms that have complex anti-bot measures or standard OAuth flows (like "Continue with Google").

### Implementation Plan

- Create a dedicated workflow for login sequences.
- Use `browser_subagent` to handle the "Google Login" or email/password flows visually.
- This bypasses the need for maintaining fragile API-based login scripts.

> **Note**: This file is loaded by default to ensure we prioritize this method for authentication challenges.
