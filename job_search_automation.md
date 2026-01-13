# Work Plan: AI/ML Job Search Automation Workflow

## Objective
Automatically search, customize, and optimize job applications for AI/ML positions (remote only) with ATS-defeating resumes and cover letters using Claude 4.5 and Puter.js.

## Phase 1: Multi-Platform Job Search
Expand searching capabilities to cover LinkedIn, Indeed, Glassdoor, AngelList/Wellfound, Otta, and RemoteOK.

### Tasks
- [ ] **Task 1.1**: Update `AutoApplyService.platforms` in `src/services/autoApply.js` with new platform metadata (AngelList, Otta, RemoteOK).
- [ ] **Task 1.2**: Implement real job extraction in `AgentService._executeJobSearch` (`src/services/agent.js`).
    - Replace mock data with vision-based logic that identifies job listings on the page.
    - Standardize the extracted job object: `{ title, company, location, url, description, platform }`.
- [ ] **Task 1.3**: Integrate `ActivepiecesService` (`src/services/activepieces.js`) to trigger high-volume scrapers (e.g., Apify via Activepieces) for LinkedIn and Indeed.
- [ ] **Task 1.4**: Implement a callback/polling mechanism to retrieve search results from Activepieces.

## Phase 2: Resume & Storage Integration
Bridge the gap between Puter.js cloud storage and the application logic.

### Tasks
- [ ] **Task 2.1**: Create `src/services/storage.js` to wrap `puter.fs` operations.
    - Implement `readResume(path)` and `writeResume(path, content)`.
    - Support Google Drive paths (e.g., `/mnt/google_drive`) assuming mount point in Puter.
- [ ] **Task 2.2**: Implement "Master Resume" synthesis in `src/services/resume.js`.
    - Use Claude to analyze multiple resumes found in storage and create a single "Default Master Resume" JSON structure.
- [ ] **Task 2.3**: Update `AutoApplyService` to use the `StorageService` for all file operations instead of local `fs`.

## Phase 3: ATS Optimization & Reverse Engineering
Implement 2026-compliant ATS optimization rules.

### Tasks
- [ ] **Task 3.1**: Create `src/utils/ats-optimizer.js` to handle keyword injection.
    - Implement logic to extract keywords from JD and inject them into "Professional Summary" and "Skills" sections.
    - Ensure keywords are integrated naturally (no "hidden text" hacks).
- [ ] **Task 3.2**: Prioritize **DOCX** format for submissions.
    - Integrate `docx-templates` to generate optimized DOCX files from the tailored JSON resume.
- [ ] **Task 3.3**: Implement an `ATSScore` utility to predict application success based on keyword density and formatting rules.

## Phase 4: Customization & Tailoring Loop
Refine the AI orchestration for maximum relevance.

### Tasks
- [ ] **Task 4.1**: Enhance `ResumeService.tailorResume` to include:
    - AI/ML specific skills prioritization (MLOps, RAG, Transformers, etc.).
    - Experience relevance highlighting (reordering roles based on JD match).
- [ ] **Task 4.2**: Implement "Application Notes" generation.
    - Extract Claude's "thinking tokens" or reasoning to explain *why* specific changes were made.
- [ ] **Task 4.3**: Implement `generateCoverLetter` in `ResumeService` with a focus on connecting experience to the company's specific AI challenges.

## Phase 5: Delivery & Output
Finalize the end-to-end automation flow.

### Tasks
- [ ] **Task 5.1**: Integrate `pdf-lib` for high-quality PDF generation as a secondary format.
- [ ] **Task 5.2**: Update `AutoApplyService.submitApplication` to use the optimized documents (DOCX/PDF).
- [ ] **Task 5.3**: Create a final report utility in `src/utils/report-generator.js` that summarizes the search results, tailoring reasoning, and ATS scores for the user.

## Components & File Changes

| Component | File | Change Description |
|-----------|------|--------------------|
| **Storage** | `src/services/storage.js` | **NEW**: Puter.fs abstraction. |
| **Optimizer** | `src/utils/ats-optimizer.js` | **NEW**: Keyword extraction and injection. |
| **Document** | `src/utils/doc-utils.js` | **NEW**: DOCX/PDF generation engine. |
| **Resume** | `src/services/resume.js` | **UPDATE**: Add Master Synthesis & ATS rules. |
| **Agent** | `src/services/agent.js` | **UPDATE**: Implement real vision search extraction. |
| **AutoApply** | `src/services/autoApply.js`| **UPDATE**: Extend platforms & search orchestration. |

## Build & Test Sequence
1. **Infra**: Install `docx-templates`, `pdf-lib`, `axios`.
2. **Storage**: Verify `puter.fs` connectivity.
3. **Search**: Run a test search on Otta/AngelList using the Vision Agent.
4. **Tailoring**: Test ATS scoring and keyword injection on a sample AI Engineer role.
5. **Execution**: Perform a full end-to-end "Dry Run" (Stop before final Submit).
