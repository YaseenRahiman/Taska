import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';
import { ReportDataResponseDto } from '../dto/report.dto';

export interface PdfGenerationOptions {
  title: string;
  subtitle?: string;
  author?: string;
  reportDate: Date;
  data: ReportDataResponseDto;
  includeCharts?: boolean;
  includeSummary?: boolean;
  includeToc?: boolean;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);
  private browser: Browser | null = null;

  /**
   * Initialize Puppeteer browser instance
   */
  private async initBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    this.logger.log('Launching Puppeteer browser...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    return this.browser;
  }

  /**
   * Generate PDF from report data
   */
  async generatePdf(options: PdfGenerationOptions): Promise<Buffer> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      this.logger.log(`Generating PDF for report: ${options.title}`);

      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });

      // Generate HTML content
      const htmlContent = this.generateHtmlContent(options);

      // Set HTML content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Generate PDF with professional settings
      const pdfData = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: this.generateHeaderTemplate(options),
        footerTemplate: this.generateFooterTemplate(options),
      });

      const pdfBuffer = Buffer.from(pdfData);

      this.logger.log(
        `PDF generated successfully: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`,
      );

      return pdfBuffer;
    } catch (error) {
      this.logger.error('Failed to generate PDF', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate complete HTML content for PDF
   */
  private generateHtmlContent(options: PdfGenerationOptions): string {
    const { title, subtitle, reportDate, data, includeCharts, includeSummary, branding } = options;
    const primaryColor = branding?.primaryColor || '#4F46E5';
    const secondaryColor = branding?.secondaryColor || '#7C3AED';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          ${this.generateCss(primaryColor, secondaryColor)}
        </style>
      </head>
      <body>
        ${this.generateCoverPage(options)}
        ${includeSummary ? this.generateSummaryPage(data) : ''}
        ${this.generateDataTables(data)}
        ${includeCharts ? this.generateChartsSection(data) : ''}
        ${this.generateAppendix(options)}
      </body>
      </html>
    `;
  }

  /**
   * Generate CSS styles for PDF
   */
  private generateCss(primaryColor: string, secondaryColor: string): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #1f2937;
      }

      .page {
        page-break-after: always;
        padding: 20px;
      }

      .page:last-child {
        page-break-after: avoid;
      }

      .cover {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
        color: white;
        text-align: center;
      }

      .cover h1 {
        font-size: 48pt;
        font-weight: bold;
        margin-bottom: 20px;
      }

      .cover .subtitle {
        font-size: 24pt;
        margin-bottom: 40px;
        opacity: 0.9;
      }

      .cover .meta {
        font-size: 14pt;
        opacity: 0.8;
      }

      h1 {
        font-size: 28pt;
        color: ${primaryColor};
        margin-bottom: 20px;
        border-bottom: 3px solid ${primaryColor};
        padding-bottom: 10px;
      }

      h2 {
        font-size: 20pt;
        color: ${secondaryColor};
        margin-top: 30px;
        margin-bottom: 15px;
      }

      h3 {
        font-size: 16pt;
        color: #374151;
        margin-top: 20px;
        margin-bottom: 10px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 10pt;
      }

      thead {
        background-color: ${primaryColor};
        color: white;
      }

      th {
        padding: 12px;
        text-align: left;
        font-weight: 600;
        border: 1px solid ${primaryColor};
      }

      td {
        padding: 10px;
        border: 1px solid #e5e7eb;
      }

      tbody tr:nth-child(even) {
        background-color: #f9fafb;
      }

      tbody tr:hover {
        background-color: #f3f4f6;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin: 20px 0;
      }

      .summary-card {
        background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
        border: 2px solid ${primaryColor};
        border-radius: 8px;
        padding: 20px;
      }

      .summary-card .label {
        font-size: 12pt;
        color: #6b7280;
        margin-bottom: 8px;
      }

      .summary-card .value {
        font-size: 28pt;
        color: ${primaryColor};
        font-weight: bold;
      }

      .chart-placeholder {
        background: #f9fafb;
        border: 2px dashed #d1d5db;
        border-radius: 8px;
        padding: 40px;
        text-align: center;
        margin: 20px 0;
        color: #6b7280;
      }

      .footer-note {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e5e7eb;
        font-size: 9pt;
        color: #6b7280;
        text-align: center;
      }

      .appendix {
        font-size: 9pt;
        color: #6b7280;
        line-height: 1.5;
      }
    `;
  }

  /**
   * Generate cover page
   */
  private generateCoverPage(options: PdfGenerationOptions): string {
    const { title, subtitle, author, reportDate, branding } = options;
    const formattedDate = reportDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
      <div class="page cover">
        ${branding?.logoUrl ? `<img src="${branding.logoUrl}" alt="Logo" style="max-width: 200px; margin-bottom: 40px;">` : ''}
        <h1>${this.escapeHtml(title)}</h1>
        ${subtitle ? `<div class="subtitle">${this.escapeHtml(subtitle)}</div>` : ''}
        <div class="meta">
          <div>Generated on: ${formattedDate}</div>
          ${author ? `<div>Author: ${this.escapeHtml(author)}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generate summary page with key metrics
   */
  private generateSummaryPage(data: ReportDataResponseDto): string {
    if (!data.summary || Object.keys(data.summary).length === 0) {
      return '';
    }

    const summaryCards = Object.entries(data.summary)
      .map(
        ([key, value]) => `
        <div class="summary-card">
          <div class="label">${this.formatLabel(key)}</div>
          <div class="value">${this.formatValue(value)}</div>
        </div>
      `,
      )
      .join('');

    return `
      <div class="page">
        <h1>Executive Summary</h1>
        <div class="summary-grid">
          ${summaryCards}
        </div>
      </div>
    `;
  }

  /**
   * Generate data tables
   */
  private generateDataTables(data: ReportDataResponseDto): string {
    if (data.rows.length === 0) {
      return `
        <div class="page">
          <h1>Report Data</h1>
          <p>No data available for the selected criteria.</p>
        </div>
      `;
    }

    const tableHeaders = data.columns.map((col) => `<th>${this.escapeHtml(col)}</th>`).join('');

    const tableRows = data.rows
      .map((row) => {
        const cells = row.map((cell) => `<td>${this.escapeHtml(String(cell || '-'))}</td>`).join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    return `
      <div class="page">
        <h1>Detailed Report Data</h1>
        <p>Total Records: <strong>${data.totalRows.toLocaleString()}</strong></p>
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate charts section (placeholder for now)
   */
  private generateChartsSection(data: ReportDataResponseDto): string {
    return `
      <div class="page">
        <h1>Data Visualizations</h1>
        <div class="chart-placeholder">
          <h3>Chart Generation Available in Future Update</h3>
          <p>Visual charts and graphs will be displayed here based on report data.</p>
          <p>Total data points: ${data.totalRows}</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate appendix
   */
  private generateAppendix(options: PdfGenerationOptions): string {
    return `
      <div class="page">
        <h1>Appendix</h1>
        <div class="appendix">
          <h3>Report Metadata</h3>
          <ul>
            <li><strong>Report Title:</strong> ${this.escapeHtml(options.title)}</li>
            <li><strong>Generated:</strong> ${options.reportDate.toISOString()}</li>
            <li><strong>Total Rows:</strong> ${options.data.totalRows.toLocaleString()}</li>
            <li><strong>Columns:</strong> ${options.data.columns.length}</li>
          </ul>

          <h3>Notes</h3>
          <p>
            This report was automatically generated by the Taska Platform Admin Portal.
            All data is accurate as of the generation timestamp. For questions or
            clarifications, please contact the platform administrator.
          </p>
        </div>

        <div class="footer-note">
          Generated by Taska Platform Admin Portal | Confidential and Proprietary
        </div>
      </div>
    `;
  }

  /**
   * Generate header template for PDF
   */
  private generateHeaderTemplate(options: PdfGenerationOptions): string {
    return `
      <div style="
        width: 100%;
        padding: 10px 40px;
        font-size: 9pt;
        color: #6b7280;
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #e5e7eb;
      ">
        <span>${this.escapeHtml(options.title)}</span>
        <span>${options.reportDate.toLocaleDateString()}</span>
      </div>
    `;
  }

  /**
   * Generate footer template for PDF
   */
  private generateFooterTemplate(options: PdfGenerationOptions): string {
    return `
      <div style="
        width: 100%;
        padding: 10px 40px;
        font-size: 9pt;
        color: #6b7280;
        display: flex;
        justify-content: space-between;
        border-top: 1px solid #e5e7eb;
      ">
        <span>Taska Platform Admin Portal</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;
  }

  /**
   * Format label for display
   */
  private formatLabel(key: string): string {
    return key
      .split(/[_-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format value for display
   */
  private formatValue(value: any): string {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Close browser instance on module destroy
   */
  async onModuleDestroy() {
    if (this.browser) {
      this.logger.log('Closing Puppeteer browser...');
      await this.browser.close();
      this.browser = null;
    }
  }
}
