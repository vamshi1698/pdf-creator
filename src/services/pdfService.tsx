import { PDFDocument, PageSizes, rgb } from 'pdf-lib';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export interface PDFOptions {
  imagesPerPage: 1 | 2 | 4;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  border: {
    enabled: boolean;
    width: number;
    color: string;
  };
  orientation: 'portrait' | 'landscape';
}

export class PDFError extends Error {
  constructor(message: string, public readonly fileName?: string) {
    super(message);
    this.name = 'PDFError';
  }
}

export class PDFService {
  static async validateFile(file: File): Promise<string | null> {
    if (!file) {
      return 'Invalid file provided';
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File ${file.name} is too large. Maximum size is 100MB`;
    }

    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf'
    ];

    const supportedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.jpe', '.jif', '.jfif'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!supportedTypes.includes(file.type) || !supportedExtensions.includes(fileExtension)) {
      return `File ${file.name} is not supported. Please use PDF, JPG, JPEG, or PNG files`;
    }

    return null;
  }

  static async createPDF(files: File[], options: PDFOptions): Promise<Uint8Array> {
    if (!files.length) {
      throw new PDFError('No files provided');
    }

    const pdfDoc = await PDFDocument.create().catch(() => {
      throw new PDFError('Failed to create PDF document');
    });
    
    const images: File[] = [];
    const pdfs: File[] = [];
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        images.push(file);
      } else if (file.type === 'application/pdf') {
        pdfs.push(file);
      }
    });

    if (images.length > 0) {
      await this.addImagesToDocument(pdfDoc, images, options);
    }

    for (const file of pdfs) {
      try {
        await this.addPDFToPDF(pdfDoc, file);
      } catch (error) {
        if (error instanceof PDFError) throw error;
        throw new PDFError(
          `Failed to process ${file.name}: ${error.message || 'Unknown error'}`,
          file.name
        );
      }
    }

    try {
      return await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
    } catch (error) {
      throw new PDFError('Failed to save PDF document: ' + (error.message || 'Unknown error'));
    }
  }

  private static async addImagesToDocument(
    pdfDoc: PDFDocument,
    images: File[],
    options: PDFOptions
  ) {
    const { imagesPerPage, margins, border, orientation } = options;
    const imageGroups = this.chunkArray(images, imagesPerPage);
    
    const pageSize = orientation === 'landscape' 
      ? [PageSizes.A4[1], PageSizes.A4[0]]
      : PageSizes.A4;
    
    for (const group of imageGroups) {
      try {
        const page = pdfDoc.addPage(pageSize);
        const { width, height } = page.getSize();
        
        const cols = imagesPerPage === 4 ? 2 : 1;
        const rows = imagesPerPage === 1 ? 1 : 2;
        
        const contentWidth = width - margins.left - margins.right;
        const contentHeight = height - margins.top - margins.bottom;
        
        const imageWidth = (contentWidth - (cols - 1) * margins.right) / cols;
        const imageHeight = (contentHeight - (rows - 1) * margins.bottom) / rows;
        
        for (let i = 0; i < group.length; i++) {
          const file = group[i];
          const row = Math.floor(i / cols);
          const col = i % cols;
          
          const x = margins.left + col * (imageWidth + margins.right);
          const y = height - margins.top - (row + 1) * imageHeight - row * margins.bottom;
          
          await this.embedImageInPage(pdfDoc, page, file, {
            x,
            y,
            width: imageWidth,
            height: imageHeight,
            border,
          });
        }
      } catch (error) {
        throw new PDFError(`Only jpg, pdf, png are allowed`);
      }
    }
  }

  private static async embedImageInPage(
    pdfDoc: PDFDocument,
    page: PDFDocument['getPages'][0],
    file: File,
    dimensions: {
      x: number;
      y: number;
      width: number;
      height: number;
      border: PDFOptions['border'];
    }
  ) {
    try {
      const imageBytes = await file.arrayBuffer();
      let image;
      
      if (file.type.includes('jpeg') || file.type.includes('jpg')) {
        image = await pdfDoc.embedJpg(imageBytes);
      } else if (file.type.includes('png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        throw new PDFError(`Unsupported image format: ${file.type}`, file.name);
      }

      if (!image) {
        throw new PDFError('Failed to embed image', file.name);
      }

      const aspectRatio = image.width / image.height;
      let { width, height } = dimensions;
      
      if (width / height > aspectRatio) {
        width = height * aspectRatio;
      } else {
        height = width / aspectRatio;
      }

      const x = dimensions.x + (dimensions.width - width) / 2;
      const y = dimensions.y + (dimensions.height - height) / 2;

      if (dimensions.border.enabled) {
        const borderWidth = dimensions.border.width;
        const [r, g, b] = dimensions.border.color
          .match(/\w\w/g)!
          .map(x => parseInt(x, 16) / 255);
        
        page.drawRectangle({
          x: x - borderWidth,
          y: y - borderWidth,
          width: width + borderWidth * 2,
          height: height + borderWidth * 2,
          borderWidth,
          borderColor: rgb(r, g, b),
        });
      }

      page.drawImage(image, { x, y, width, height });
    } catch (error) {
      throw new PDFError(`Failed to embed image: ${error.message}`, file.name);
    }
  }

  private static async addPDFToPDF(pdfDoc: PDFDocument, file: File) {
    if (!file || !pdfDoc) {
      throw new PDFError('Invalid PDF document');
    }

    try {
      const existingPdfBytes = await file.arrayBuffer();
      const existingPdf = await PDFDocument.load(existingPdfBytes);
      const copiedPages = await pdfDoc.copyPages(existingPdf, existingPdf.getPageIndices());
      
      if (!copiedPages.length) {
        throw new PDFError('PDF document has no pages', file.name);
      }

      copiedPages.forEach((page) => pdfDoc.addPage(page));
    } catch (error) {
      if (error instanceof PDFError) {
        throw error;
      }
      throw new PDFError(
        `Failed to merge PDF: ${error.message || 'Unknown error'}`,
        file.name
      );
    }
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}