import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { logger } from './logger.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Document Utilities
 * 
 * Handles generation of PDF and DOCX files for tailored resumes.
 */
export const docUtils = {
    /**
     * Generate ATS-optimized PDF from resume data
     */
    async generatePDF(resume, outputPath) {
        logger.info(`Generating PDF: ${outputPath}`);
        
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        let y = height - 50;

        // Header
        page.drawText(resume.name || 'Resume', { x: 50, y, size: 20, font: boldFont });
        y -= 25;
        
        if (resume.contact) {
            const contactStr = `${resume.contact.email} | ${resume.contact.phone} | ${resume.contact.location}`;
            page.drawText(contactStr, { x: 50, y, size: 10, font });
            y -= 30;
        }

        // Summary
        if (resume.summary) {
            page.drawText('PROFESSIONAL SUMMARY', { x: 50, y, size: 12, font: boldFont });
            y -= 15;
            const lines = this._splitTextIntoLines(resume.summary, font, 10, width - 100);
            for (const line of lines) {
                page.drawText(line, { x: 50, y, size: 10, font });
                y -= 12;
            }
            y -= 20;
        }

        // Skills
        if (resume.skills && resume.skills.length > 0) {
            page.drawText('SKILLS', { x: 50, y, size: 12, font: boldFont });
            y -= 15;
            const skillsStr = resume.skills.join(', ');
            const lines = this._splitTextIntoLines(skillsStr, font, 10, width - 100);
            for (const line of lines) {
                page.drawText(line, { x: 50, y, size: 10, font });
                y -= 12;
            }
            y -= 20;
        }

        // Experience
        if (resume.experience) {
            page.drawText('EXPERIENCE', { x: 50, y, size: 12, font: boldFont });
            y -= 15;
            
            for (const exp of resume.experience) {
                if (y < 100) {
                    page = pdfDoc.addPage();
                    y = height - 50;
                }
                
                page.drawText(`${exp.title} - ${exp.company}`, { x: 50, y, size: 11, font: boldFont });
                y -= 12;
                page.drawText(`${exp.startDate} - ${exp.endDate || 'Present'}`, { x: 50, y, size: 9, font });
                y -= 15;
                
                const lines = this._splitTextIntoLines(exp.description || '', font, 10, width - 100);
                for (const line of lines) {
                    if (y < 50) {
                        page = pdfDoc.addPage();
                        y = height - 50;
                    }
                    page.drawText(line, { x: 50, y, size: 10, font });
                    y -= 12;
                }
                y -= 10;
            }
        }

        const pdfBytes = await pdfDoc.save();
        await fs.writeFile(outputPath, pdfBytes);
    },

    /**
     * Generate ATS-optimized DOCX from resume data
     */
    async generateDOCX(resume, outputPath, templatePath) {
        logger.info(`Generating DOCX: ${outputPath}`);
        
        try {
            let content;
            if (templatePath) {
                content = await fs.readFile(templatePath, 'binary');
            } else {
                // For demo/fallback, we'd need a base template or generate one
                logger.warn('No DOCX template provided, skipping DOCX generation for now.');
                return;
            }
            
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            doc.render(resume);

            const buf = doc.toBuffer();
            await fs.writeFile(outputPath, buf);
        } catch (error) {
            logger.error('Failed to generate DOCX:', error.message);
        }
    },

    _splitTextIntoLines(text, font, size, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const width = font.widthOfTextAtSize(testLine, size);
            if (width < maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }
};
