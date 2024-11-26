import React from 'react';
import { Layout, Maximize, Minimize } from 'lucide-react';
import { PDFOptions } from '../services/pdfService';

interface ImageLayoutProps {
  options: Pick<PDFOptions, 'imagesPerPage' | 'orientation' | 'margins' | 'border'>;
  onChange: (options: Pick<PDFOptions, 'imagesPerPage' | 'orientation' | 'margins' | 'border'>) => void;
}

export function ImageLayout({ options, onChange }: ImageLayoutProps) {
  const layouts = [
    { value: 1, label: '1 per page' },
    { value: 2, label: '2 per page' },
    { value: 4, label: '4 per page' },
  ] as const;

  const updateOptions = (updates: Partial<typeof options>) => {
    onChange({ ...options, ...updates });
  };

  return (
    <div className="space-y-8 border-t pt-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Layout className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-700">Layout Options</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images per Page
            </label>
            <div className="flex gap-4">
              {layouts.map((layout) => (
                <button
                  key={layout.value}
                  onClick={() => updateOptions({ imagesPerPage: layout.value })}
                  className={`
                    flex-1 p-4 rounded-lg border-2 transition-all
                    ${options.imagesPerPage === layout.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'}
                  `}
                >
                  <div className="aspect-[1/1.4] mb-3 border rounded bg-white flex items-center justify-center">
                    <div className="grid gap-2" style={{
                      gridTemplateColumns: layout.value === 4 ? 'repeat(2, 1fr)' : '1fr',
                      gridTemplateRows: layout.value === 1 ? '1fr' : 'repeat(2, 1fr)',
                    }}>
                      {Array.from({ length: layout.value }).map((_, i) => (
                        <div
                          key={i}
                          className="w-6 h-4 bg-gray-300 rounded"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-center text-gray-600">
                    {layout.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Orientation
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => updateOptions({ orientation: 'portrait' })}
                className={`
                  flex-1 p-4 rounded-lg border-2 transition-all flex flex-col items-center
                  ${options.orientation === 'portrait'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'}
                `}
              >
                <Maximize className="w-6 h-8 mb-2" />
                <span className="text-sm font-medium">Portrait</span>
              </button>
              <button
                onClick={() => updateOptions({ orientation: 'landscape' })}
                className={`
                  flex-1 p-4 rounded-lg border-2 transition-all flex flex-col items-center
                  ${options.orientation === 'landscape'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-200'}
                `}
              >
                <Maximize className="w-8 h-6 mb-2 rotate-90" />
                <span className="text-sm font-medium">Landscape</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-4">Margins & Border</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Margins (mm)
            </label>
            <div className="grid grid-cols-2 gap-4">
              {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                <div key={side}>
                  <label className="block text-sm text-gray-600 capitalize mb-1">
                    {side}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={options.margins[side]}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(100, Number(e.target.value)));
                      updateOptions({
                        margins: { ...options.margins, [side]: value }
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Border
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.border.enabled}
                  onChange={(e) => updateOptions({
                    border: { ...options.border, enabled: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {options.border.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Width (mm)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={options.border.width}
                    onChange={(e) => {
                      const value = Math.max(0.1, Math.min(10, Number(e.target.value)));
                      updateOptions({
                        border: { ...options.border, width: value }
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={options.border.color}
                    onChange={(e) => updateOptions({
                      border: { ...options.border, color: e.target.value }
                    })}
                    className="w-full h-10 p-1 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Preview</h3>
        <div className={`
          relative bg-white border shadow-sm rounded-lg
          ${options.orientation === 'landscape' ? 'aspect-[1.414/1]' : 'aspect-[1/1.414]'}
        `}>
          <div
            className="absolute inset-0 grid gap-2 p-4"
            style={{
              padding: `${options.margins.top}mm ${options.margins.right}mm ${options.margins.bottom}mm ${options.margins.left}mm`,
              gridTemplateColumns: options.imagesPerPage === 4 ? 'repeat(2, 1fr)' : '1fr',
              gridTemplateRows: options.imagesPerPage === 1 ? '1fr' : 'repeat(2, 1fr)',
            }}
          >
            {Array.from({ length: options.imagesPerPage }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-lg"
                style={{
                  border: options.border.enabled
                    ? `${options.border.width}mm solid ${options.border.color}`
                    : undefined
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}