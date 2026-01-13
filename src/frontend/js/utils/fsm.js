import { EventEmitter } from 'events';
import { logger } from './logger.js';

/**
 * JobSprint Ultimate FSM State Machine
 * 
 * Manages the agent's workflow states for autonomous job applications:
 * - IDLE: Waiting for command
 * - SEARCHING: Navigating job boards, collecting JDs
 * - ANALYZING: Parsing JD, deciding relevance (claude-sonnet-4-5)
 * - TAILORING: Generating custom Resume/Cover Letter (claude-sonnet-4-5)
 * - APPLYING: Filling forms, using Memory for Q&A
 * - VERIFYING: Checking success message
 */
export class JobSprintFSM extends EventEmitter {
    constructor() {
        super();
        
        // Define all valid states
        this.states = {
            IDLE: 'IDLE',
            SEARCHING: 'SEARCHING',
            ANALYZING: 'ANALYZING',
            TAILORING: 'TAILORING',
            APPLYING: 'APPLYING',
            VERIFYING: 'VERIFYING',
            COMPLETED: 'COMPLETED',
            FAILED: 'FAILED'
        };
        
        // Define valid transitions
        this.transitions = {
            [this.states.IDLE]: [this.states.SEARCHING],
            [this.states.SEARCHING]: [this.states.ANALYZING, this.states.FAILED],
            [this.states.ANALYZING]: [this.states.TAILORING, this.states.SEARCHING, this.states.FAILED],
            [this.states.TAILORING]: [this.states.APPLYING, this.states.FAILED],
            [this.states.APPLYING]: [this.states.VERIFYING, this.states.FAILED],
            [this.states.VERIFYING]: [this.states.COMPLETED, this.states.APPLYING, this.states.FAILED],
            [this.states.COMPLETED]: [this.states.IDLE],
            [this.states.FAILED]: [this.states.IDLE]
        };
        
        this.currentState = this.states.IDLE;
        this.stateHistory = [];
        this.stateData = {};
        this.startTime = null;
    }
    
    /**
     * Get current state
     */
    getState() {
        return this.currentState;
    }
    
    /**
     * Get all valid states
     */
    getStates() {
        return this.states;
    }
    
    /**
     * Check if transition is valid
     */
    canTransition(newState) {
        const allowedTransitions = this.transitions[this.currentState];
        return allowedTransitions && allowedTransitions.includes(newState);
    }
    
    /**
     * Transition to new state
     */
    transition(newState, data = {}) {
        if (!this.canTransition(newState)) {
            const error = new Error(`Invalid transition: ${this.currentState} -> ${newState}`);
            logger.error(`FSM Transition Error: ${error.message}`);
            throw error;
        }
        
        const previousState = this.currentState;
        this.currentState = newState;
        this.stateData = { ...this.stateData, ...data };
        
        // Record in history
        this.stateHistory.push({
            from: previousState,
            to: newState,
            timestamp: new Date().toISOString(),
            data
        });
        
        // Emit state change event
        this.emit('stateChange', {
            previousState,
            currentState: newState,
            data,
            timestamp: new Date().toISOString()
        });
        
        logger.info(`FSM State: ${previousState} -> ${newState}`);
        
        return this;
    }
    
    /**
     * Start a new job application workflow
     */
    startWorkflow(jobCriteria) {
        this.startTime = new Date();
        this.stateData = {
            jobCriteria,
            jobsFound: [],
            currentJob: null,
            applicationsSubmitted: 0,
            applicationsFailed: 0,
            currentStep: 0
        };
        
        logger.info(`Starting FSM workflow for: ${JSON.stringify(jobCriteria)}`);
        return this.transition(this.states.SEARCHING, { action: 'start', criteria: jobCriteria });
    }
    
    /**
     * Complete current step and move to next state
     */
    completeStep(nextState, stepData = {}) {
        this.stateData.currentStep++;
        return this.transition(nextState, { stepComplete: true, ...stepData });
    }
    
    /**
     * Mark workflow as completed
     */
    completeWorkflow(results = {}) {
        const duration = this.startTime 
            ? Date.now() - this.startTime.getTime() 
            : 0;
        
        const finalResults = {
            ...this.stateData,
            ...results,
            duration,
            completedAt: new Date().toISOString()
        };
        
        logger.info(`FSM Workflow completed in ${duration}ms`);
        return this.transition(this.states.COMPLETED, finalResults);
    }
    
    /**
     * Mark workflow as failed
     */
    failWorkflow(error) {
        const failureData = {
            error: error.message || error,
            failedAt: new Date().toISOString()
        };
        
        logger.error(`FSM Workflow failed: ${failureData.error}`);
        return this.transition(this.states.FAILED, failureData);
    }
    
    /**
     * Reset to idle state
     */
    reset() {
        this.currentState = this.states.IDLE;
        this.stateHistory = [];
        this.stateData = {};
        this.startTime = null;
        
        logger.info('FSM reset to IDLE state');
        return this;
    }
    
    /**
     * Get workflow statistics
     */
    getStats() {
        return {
            currentState: this.currentState,
            startTime: this.startTime?.toISOString(),
            totalTransitions: this.stateHistory.length,
            stateHistory: this.stateHistory,
            data: this.stateData,
            duration: this.startTime ? Date.now() - this.startTime.getTime() : 0
        };
    }
    
    /**
     * Get valid next states
     */
    getNextStates() {
        return this.transitions[this.currentState] || [];
    }
}

// Export singleton instance
export const jobSprintFSM = new JobSprintFSM();
