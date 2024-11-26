import  { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { FileDown, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { PDFService, PDFError, PDFOptions } from './services/pdfService';
import { ImageLayout } from './components/ImageLayout';

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [layoutOptions, setLayoutOptions] = useState<Pick<PDFOptions, 'imagesPerPage' | 'orientation' | 'margins' | 'border'>>({
    imagesPerPage: 1,
    orientation: 'portrait',
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
    border: {
      enabled: false,
      width: 1,
      color: '#000000',
    },
  });

  const handleFilesDrop = async (newFiles: File[]) => {
    if (!newFiles.length) return;

    for (const file of newFiles) {
      const error = await PDFService.validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
    }
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const createPDF = async () => {
    if (files.length === 0) {
      toast.error('Please add some files first');
      return;
    }

    setIsProcessing(true);
    try {
      const pdfBytes = await PDFService.createPDF(files, layoutOptions);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'combined-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF created successfully!');
      setFiles([]);
    } catch (error) {
      console.error('Error creating PDF:', error);
      const message = error instanceof PDFError 
        ? error.message 
        : 'Failed to create PDF. Please try again.';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              PDF Creator
            </h1>
            <p className="text-lg text-gray-600">
              Combine images and PDFs into a single high-quality document
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <FileUploader 
              onFilesDrop={handleFilesDrop} 
              acceptedFiles={files}
              onRemoveFile={handleRemoveFile}
            />

            {files.some(file => file.type.startsWith('image/')) && (
              <div className="mt-8">
                <ImageLayout
                  options={layoutOptions}
                  onChange={setLayoutOptions}
                />
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-8 text-center">
                <button
                  onClick={createPDF}
                  disabled={isProcessing}
                  className={`
                    inline-flex items-center px-6 py-3 rounded-lg text-white
                    ${isProcessing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'}
                    transition-colors duration-200
                  `}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-5 h-5 mr-2" />
                      Create PDF
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;