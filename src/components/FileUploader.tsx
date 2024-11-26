import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';

interface FileUploaderProps {
  onFilesDrop: (files: File[]) => void;
  acceptedFiles: File[];
  onRemoveFile: (index: number) => void;
}

export function FileUploader({ onFilesDrop, acceptedFiles, onRemoveFile }: FileUploaderProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpe', '.jif', '.jfif'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    onDrop: onFilesDrop,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return '🖼️';
    }
    return '📄';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="mt-2 text-sm text-gray-500">or click to select files</p>
        <p className="mt-1 text-xs text-gray-400">
          Supports PDF and images (PDF, PNG, JPG) up to 100MB
        </p>
      </div>

      {acceptedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Selected Files:</h3>
          <ul className="space-y-2">
            {acceptedFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex items-center"
              >
                <span className="mr-2">{getFileIcon(file.type)}</span>
                <span className="text-sm text-gray-600 truncate max-w-xs">
                  {file.name}
                </span>
                <span className="mx-2 text-xs text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(index);
                  }}
                  className="ml-auto p-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}