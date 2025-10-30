import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell } from 'docx';

class ExportService {
  constructor() {
    this.formats = ['pdf', 'word', 'xml', 'markdown'];
  }

  /**
   * Export project data in specified format
   * @param {Object} projectData - Complete project data with hierarchical structure
   * @param {string} format - Export format (pdf, word, xml, markdown)
   * @param {string} projectName - Project name for file naming
   */
  async exportProject(projectData, format, projectName = 'project') {
    const fileName = `${projectName}_test_cases_${new Date().toISOString().split('T')[0]}`;
    
    switch (format.toLowerCase()) {
      case 'pdf':
        return this.exportToPDF(projectData, fileName);
      case 'word':
        return this.exportToWord(projectData, fileName);
      case 'xml':
        return this.exportToXML(projectData, fileName);
      case 'markdown':
        return this.exportToMarkdown(projectData, fileName);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to PDF format
   */
  exportToPDF(projectData, fileName) {
    const pdf = new jsPDF();
    let currentY = 20;

    // Title
    pdf.setFontSize(20);
    pdf.text(`Test Cases Report: ${projectData.name}`, 20, currentY);
    currentY += 20;

    // Project Summary
    pdf.setFontSize(12);
    pdf.text(`Project ID: ${projectData.project_id}`, 20, currentY);
    currentY += 10;
    pdf.text(`Created: ${new Date(projectData.created_date).toLocaleDateString()}`, 20, currentY);
    currentY += 10;
    pdf.text(`Status: ${projectData.status}`, 20, currentY);
    currentY += 20;

    // Statistics
    if (projectData.statistics) {
      const stats = projectData.statistics;
      pdf.text(`Statistics: ${stats.total_epics} Epics, ${stats.total_features} Features, ${stats.total_use_cases} Use Cases, ${stats.total_test_cases} Test Cases`, 20, currentY);
      currentY += 20;
    }

    // Process Epics
    projectData.epics?.forEach((epic, epicIndex) => {
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }

      // Epic Header
      pdf.setFontSize(16);
      pdf.text(`Epic ${epicIndex + 1}: ${epic.title}`, 20, currentY);
      currentY += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Description: ${epic.description || 'No description'}`, 25, currentY);
      currentY += 10;
      
      if (epic.compliance_tags?.length > 0) {
        pdf.text(`Compliance: ${epic.compliance_tags.join(', ')}`, 25, currentY);
        currentY += 10;
      }
      currentY += 5;

      // Features
      epic.features?.forEach((feature, featureIndex) => {
        if (currentY > 240) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.setFontSize(14);
        pdf.text(`  Feature ${featureIndex + 1}: ${feature.title}`, 30, currentY);
        currentY += 8;
        
        pdf.setFontSize(9);
        pdf.text(`    ${feature.description || 'No description'}`, 35, currentY);
        currentY += 8;

        // Use Cases
        feature.use_cases?.forEach((useCase, useCaseIndex) => {
          if (currentY > 235) {
            pdf.addPage();
            currentY = 20;
          }

          pdf.setFontSize(12);
          pdf.text(`    Use Case ${useCaseIndex + 1}: ${useCase.title}`, 40, currentY);
          currentY += 6;

          // Test Cases
          useCase.test_cases?.forEach((testCase, testCaseIndex) => {
            if (currentY > 230) {
              pdf.addPage();
              currentY = 20;
            }

            pdf.setFontSize(10);
            pdf.text(`      Test Case ${testCaseIndex + 1}: ${testCase.title}`, 45, currentY);
            currentY += 5;
            pdf.text(`        Priority: ${testCase.priority || 'Medium'}`, 50, currentY);
            currentY += 5;
          });
          currentY += 3;
        });
        currentY += 5;
      });
      currentY += 10;
    });

    pdf.save(`${fileName}.pdf`);
    return { success: true, format: 'PDF', fileName: `${fileName}.pdf` };
  }

  /**
   * Export to Word format
   */
  async exportToWord(projectData, fileName) {
    const sections = [];

    // Title section
    sections.push(
      new Paragraph({
        text: `Test Cases Report: ${projectData.name}`,
        heading: HeadingLevel.TITLE,
      })
    );

    // Project info
    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Project ID: ${projectData.project_id}`, break: 1 }),
          new TextRun({ text: `Created: ${new Date(projectData.created_date).toLocaleDateString()}`, break: 1 }),
          new TextRun({ text: `Status: ${projectData.status}`, break: 1 }),
        ],
      })
    );

    // Statistics
    if (projectData.statistics) {
      const stats = projectData.statistics;
      sections.push(
        new Paragraph({
          text: `Statistics: ${stats.total_epics} Epics, ${stats.total_features} Features, ${stats.total_use_cases} Use Cases, ${stats.total_test_cases} Test Cases`,
          break: 1,
        })
      );
    }

    // Process Epics
    projectData.epics?.forEach((epic, epicIndex) => {
      sections.push(
        new Paragraph({
          text: `Epic ${epicIndex + 1}: ${epic.title}`,
          heading: HeadingLevel.HEADING_1,
        })
      );

      sections.push(
        new Paragraph({
          text: epic.description || 'No description',
        })
      );

      if (epic.compliance_tags?.length > 0) {
        sections.push(
          new Paragraph({
            text: `Compliance: ${epic.compliance_tags.join(', ')}`,
          })
        );
      }

      // Features
      epic.features?.forEach((feature, featureIndex) => {
        sections.push(
          new Paragraph({
            text: `Feature ${featureIndex + 1}: ${feature.title}`,
            heading: HeadingLevel.HEADING_2,
          })
        );

        sections.push(
          new Paragraph({
            text: feature.description || 'No description',
          })
        );

        // Use Cases
        feature.use_cases?.forEach((useCase, useCaseIndex) => {
          sections.push(
            new Paragraph({
              text: `Use Case ${useCaseIndex + 1}: ${useCase.title}`,
              heading: HeadingLevel.HEADING_3,
            })
          );

          // Test Cases
          useCase.test_cases?.forEach((testCase, testCaseIndex) => {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `Test Case ${testCaseIndex + 1}: `, bold: true }),
                  new TextRun({ text: testCase.title }),
                  new TextRun({ text: ` (Priority: ${testCase.priority || 'Medium'})`, break: 1 }),
                ],
              })
            );
          });
        });
      });
    });

    const doc = new Document({
      sections: [
        {
          children: sections,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
    return { success: true, format: 'Word', fileName: `${fileName}.docx` };
  }

  /**
   * Export to XML format
   */
  exportToXML(projectData, fileName) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<project>\n';
    xml += `  <project_id>${projectData.project_id}</project_id>\n`;
    xml += `  <name><![CDATA[${projectData.name}]]></name>\n`;
    xml += `  <created_date>${projectData.created_date}</created_date>\n`;
    xml += `  <status>${projectData.status}</status>\n`;

    if (projectData.statistics) {
      xml += '  <statistics>\n';
      xml += `    <total_epics>${projectData.statistics.total_epics}</total_epics>\n`;
      xml += `    <total_features>${projectData.statistics.total_features}</total_features>\n`;
      xml += `    <total_use_cases>${projectData.statistics.total_use_cases}</total_use_cases>\n`;
      xml += `    <total_test_cases>${projectData.statistics.total_test_cases}</total_test_cases>\n`;
      xml += '  </statistics>\n';
    }

    xml += '  <epics>\n';
    projectData.epics?.forEach((epic) => {
      xml += '    <epic>\n';
      xml += `      <epic_id>${epic.epic_id}</epic_id>\n`;
      xml += `      <title><![CDATA[${epic.title}]]></title>\n`;
      xml += `      <description><![CDATA[${epic.description || ''}]]></description>\n`;
      xml += `      <priority>${epic.priority || 'Medium'}</priority>\n`;
      
      if (epic.compliance_tags?.length > 0) {
        xml += '      <compliance_tags>\n';
        epic.compliance_tags.forEach(tag => {
          xml += `        <tag>${tag}</tag>\n`;
        });
        xml += '      </compliance_tags>\n';
      }

      xml += '      <features>\n';
      epic.features?.forEach((feature) => {
        xml += '        <feature>\n';
        xml += `          <feature_id>${feature.feature_id}</feature_id>\n`;
        xml += `          <title><![CDATA[${feature.title}]]></title>\n`;
        xml += `          <description><![CDATA[${feature.description || ''}]]></description>\n`;

        xml += '          <use_cases>\n';
        feature.use_cases?.forEach((useCase) => {
          xml += '            <use_case>\n';
          xml += `              <use_case_id>${useCase.use_case_id}</use_case_id>\n`;
          xml += `              <title><![CDATA[${useCase.title}]]></title>\n`;
          xml += `              <description><![CDATA[${useCase.description || ''}]]></description>\n`;
          
          if (useCase.model_explanation) {
            xml += `              <model_explanation><![CDATA[${useCase.model_explanation}]]></model_explanation>\n`;
          }

          xml += '              <test_cases>\n';
          useCase.test_cases?.forEach((testCase) => {
            xml += '                <test_case>\n';
            xml += `                  <test_case_id>${testCase.test_case_id}</test_case_id>\n`;
            xml += `                  <title><![CDATA[${testCase.title}]]></title>\n`;
            xml += `                  <priority>${testCase.priority || 'Medium'}</priority>\n`;
            xml += `                  <test_type>${testCase.test_type || 'Functional'}</test_type>\n`;
            
            if (testCase.model_explanation) {
              xml += `                  <model_explanation><![CDATA[${testCase.model_explanation}]]></model_explanation>\n`;
            }
            
            xml += '                </test_case>\n';
          });
          xml += '              </test_cases>\n';
          xml += '            </use_case>\n';
        });
        xml += '          </use_cases>\n';
        xml += '        </feature>\n';
      });
      xml += '      </features>\n';
      xml += '    </epic>\n';
    });
    xml += '  </epics>\n';
    xml += '</project>';

    const blob = new Blob([xml], { type: 'application/xml' });
    saveAs(blob, `${fileName}.xml`);
    return { success: true, format: 'XML', fileName: `${fileName}.xml` };
  }

  /**
   * Export to Markdown format
   */
  exportToMarkdown(projectData, fileName) {
    let markdown = `# Test Cases Report: ${projectData.name}\n\n`;
    
    markdown += `**Project ID:** ${projectData.project_id}  \n`;
    markdown += `**Created:** ${new Date(projectData.created_date).toLocaleDateString()}  \n`;
    markdown += `**Status:** ${projectData.status}  \n\n`;

    if (projectData.statistics) {
      const stats = projectData.statistics;
      markdown += `## Statistics\n\n`;
      markdown += `- **Epics:** ${stats.total_epics}\n`;
      markdown += `- **Features:** ${stats.total_features}\n`;
      markdown += `- **Use Cases:** ${stats.total_use_cases}\n`;
      markdown += `- **Test Cases:** ${stats.total_test_cases}\n\n`;
    }

    markdown += `## Test Case Structure\n\n`;

    projectData.epics?.forEach((epic, epicIndex) => {
      markdown += `### Epic ${epicIndex + 1}: ${epic.title}\n\n`;
      markdown += `${epic.description || 'No description'}\n\n`;
      
      if (epic.compliance_tags?.length > 0) {
        markdown += `**Compliance:** ${epic.compliance_tags.join(', ')}\n\n`;
      }

      epic.features?.forEach((feature, featureIndex) => {
        markdown += `#### Feature ${featureIndex + 1}: ${feature.title}\n\n`;
        markdown += `${feature.description || 'No description'}\n\n`;

        feature.use_cases?.forEach((useCase, useCaseIndex) => {
          markdown += `##### Use Case ${useCaseIndex + 1}: ${useCase.title}\n\n`;
          
          if (useCase.model_explanation) {
            markdown += `**Model Explanation:** ${useCase.model_explanation}\n\n`;
          }

          if (useCase.test_cases?.length > 0) {
            markdown += `**Test Cases:**\n\n`;
            useCase.test_cases.forEach((testCase, testCaseIndex) => {
              markdown += `${testCaseIndex + 1}. **${testCase.title}** (Priority: ${testCase.priority || 'Medium'})\n`;
              if (testCase.model_explanation) {
                markdown += `   - *Model Explanation:* ${testCase.model_explanation}\n`;
              }
            });
            markdown += `\n`;
          }
        });
      });
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    saveAs(blob, `${fileName}.md`);
    return { success: true, format: 'Markdown', fileName: `${fileName}.md` };
  }

  /**
   * Get available export formats
   */
  getAvailableFormats() {
    return this.formats.map(format => ({
      value: format,
      label: format.toUpperCase(),
      description: this.getFormatDescription(format)
    }));
  }

  /**
   * Get format description
   */
  getFormatDescription(format) {
    const descriptions = {
      pdf: 'Portable Document Format - Best for printing and sharing',
      word: 'Microsoft Word Document - Editable document format',
      xml: 'XML Format - Structured data for integration',
      markdown: 'Markdown Format - Human-readable text format'
    };
    return descriptions[format] || '';
  }
}

export default new ExportService();