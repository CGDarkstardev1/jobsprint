/**
 * Test script for Enhanced AI Cover Letter Generator
 * Verifies integration with LLM abstraction layer and RAG system
 */

import { LLMAbstractionLayer } from './llm-abstraction.service';
import { RAGSystem } from './rag-system.service';
import {
  EnhancedAICoverLetterGenerator,
  CoverLetterGenerationRequest,
} from './aiCoverLetterGenerator.service';

// Mock environment variables for testing
process.env.OPENAI_API_KEY = 'test-key';
process.env.ANTHROPIC_API_KEY = 'test-key';

async function testCoverLetterGenerator() {
  console.log('🚀 Testing Enhanced AI Cover Letter Generator...');

  try {
    // Initialize services
    const llmService = new LLMAbstractionLayer();
    const ragSystem = new RAGSystem();

    // Initialize cover letter generator
    const generator = new EnhancedAICoverLetterGenerator(llmService, ragSystem);

    // Test request
    const request: CoverLetterGenerationRequest = {
      resume: `JOHN DOE
SOFTWARE ENGINEER

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years in full-stack development, specializing in React, Node.js, and cloud technologies.

SKILLS
JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, Kubernetes

EXPERIENCE
Senior Software Engineer | Tech Corp | 2021-Present
- Led development of microservices architecture serving 1M+ users
- Implemented CI/CD pipelines reducing deployment time by 60%
- Mentored junior developers and conducted code reviews

Software Engineer | Startup Inc | 2019-2021
- Built responsive web applications using React and TypeScript
- Integrated third-party APIs and optimized database queries
- Collaborated with cross-functional teams in agile environment

EDUCATION
BS Computer Science | University | 2019`,

      jobDescription: `Senior Full Stack Developer

We are looking for an experienced Senior Full Stack Developer to join our growing engineering team. You will be responsible for designing, developing, and maintaining web applications using modern technologies.

Requirements:
- 5+ years of experience in full-stack development
- Proficiency in React, Node.js, and TypeScript
- Experience with cloud platforms (AWS preferred)
- Knowledge of microservices architecture
- Strong problem-solving skills and attention to detail

Responsibilities:
- Design and develop scalable web applications
- Collaborate with product and design teams
- Mentor junior developers
- Participate in code reviews and architectural decisions
- Ensure high performance and security standards

What we offer:
- Competitive salary and equity
- Remote work flexibility
- Health and dental insurance
- Professional development opportunities`,

      userProfile: {
        currentPosition: 'Senior Software Engineer',
        yearsExperience: 5,
        industries: ['technology', 'software'],
        startupExperience: true,
        enterpriseExperience: true,
      },

      companyInfo: {
        name: 'Innovative Tech Solutions',
        website: 'https://innovativetech.com',
        industry: 'technology',
        about: 'Leading provider of innovative software solutions for enterprise clients.',
      },

      tone: 'professional',
      length: 'medium',
      parallel: false, // Start with sequential for testing
    };

    console.log('📝 Generating cover letter...');

    // Generate cover letter
    const result = await generator.generateCoverLetter(request);

    console.log('✅ Cover letter generated successfully!');
    console.log('📊 Generation Stats:');
    console.log(`   - Processing Time: ${result.generationMetadata.processingTime}ms`);
    console.log(`   - Sections Generated: ${result.generationMetadata.sectionsGenerated}`);
    console.log(`   - Total Cost: $${result.generationMetadata.totalCost.toFixed(4)}`);

    console.log('\n📄 Generated Cover Letter:');
    console.log('='.repeat(50));
    console.log(result.content);
    console.log('='.repeat(50));

    console.log('\n🎯 Analysis Results:');
    console.log(`   - Personalization Score: ${result.personalizationScore}/100`);
    console.log(`   - Company Alignment: ${result.companyAlignment}/100`);
    console.log(`   - Tone: ${result.tone}`);

    console.log('\n💡 Suggestions:');
    result.suggestions.forEach((suggestion, i) => {
      console.log(`   ${i + 1}. ${suggestion}`);
    });

    console.log('\n🏷️ Personalization Notes:');
    result.template.personalizationNotes.forEach((note, i) => {
      console.log(`   ${i + 1}. ${note}`);
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Run the test
testCoverLetterGenerator().catch(console.error);
