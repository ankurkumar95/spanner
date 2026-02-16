import { useState, useCallback, useRef } from 'react';
import { X, Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useUploadCompanies, useUploadContacts } from '../../hooks/useUploads';
import { useSegments } from '../../hooks/useSegments';
import { UploadBatch } from '../../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadType: 'company' | 'contact';
  segmentId?: string;
}

export function UploadModal({ isOpen, onClose, uploadType, segmentId }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedSegment, setSelectedSegment] = useState(segmentId || '');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadBatch | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: segmentsData } = useSegments({ limit: 100 });
  const uploadCompanies = useUploadCompanies();
  const uploadContacts = useUploadContacts();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    if (uploadType === 'company' && !selectedSegment) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (uploadType === 'company' && selectedSegment) {
      formData.append('segment_id', selectedSegment);
    }

    try {
      let result: UploadBatch;
      if (uploadType === 'company') {
        result = await uploadCompanies.mutateAsync(formData);
      } else {
        result = await uploadContacts.mutateAsync(formData);
      }
      setUploadResult(result);
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Upload failed:', error);
    }
  };

  const handleClose = () => {
    setFile(null);
    setSelectedSegment(segmentId || '');
    setUploadResult(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  const isUploading = uploadCompanies.isPending || uploadContacts.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/50 transition-opacity" onClick={handleClose} />

        <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Upload {uploadType === 'company' ? 'Companies' : 'Contacts'}
            </h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors duration-150"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {!uploadResult ? (
              <div className="space-y-6">
                {uploadType === 'company' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Segment *
                    </label>
                    <select
                      value={selectedSegment}
                      onChange={(e) => setSelectedSegment(e.target.value)}
                      disabled={!!segmentId}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select a segment</option>
                      {segmentsData?.items.map((segment) => (
                        <option key={segment.id} value={segment.id}>
                          {segment.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    CSV File *
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-150 ${
                      isDragging
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                  >
                    {file ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center">
                          <FileText className="h-12 w-12 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{file.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          onClick={() => setFile(null)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center">
                          <Upload className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Drop your CSV file here, or{' '}
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                              browse
                            </button>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">CSV files only</p>
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleClose}
                    disabled={isUploading}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || isUploading || (uploadType === 'company' && !selectedSegment)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  {uploadResult.status === 'completed' ? (
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  ) : uploadResult.status === 'failed' ? (
                    <AlertCircle className="h-16 w-16 text-red-500" />
                  ) : (
                    <Upload className="h-16 w-16 text-primary-500" />
                  )}
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Upload {uploadResult.status === 'completed' ? 'Completed' : uploadResult.status === 'failed' ? 'Failed' : 'Processing'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{uploadResult.file_name}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Total Rows</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{uploadResult.total_rows}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Valid Rows</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{uploadResult.valid_rows}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Invalid Rows</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{uploadResult.invalid_rows}</span>
                  </div>
                </div>

                {uploadResult.invalid_rows > 0 && uploadResult.error_report_url && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 mb-2">
                      Some rows contained errors and were not imported.
                    </p>
                    <a
                      href={uploadResult.error_report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-amber-900 hover:text-amber-800 underline"
                    >
                      Download error report
                    </a>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors duration-150"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
