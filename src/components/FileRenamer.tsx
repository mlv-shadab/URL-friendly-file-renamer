import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  File, 
  Download, 
  Trash2, 
  Copy, 
  Check, 
  X, 
  FileArchive,
  AlertCircle,
  FileText,
  Music,
  Image as ImageIcon,
  FileCode,
  Table as TableIcon,
  Presentation as PresentationIcon,
  Archive
} from 'lucide-react';
import JSZip from 'jszip';
import { cn, slugify, getFileParts } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FileItem {
  id: string;
  originalFile: File;
  originalName: string;
  slugName: string;
  extension: string;
}

const getFileIcon = (extension: string) => {
  const ext = extension.toLowerCase();
  if (['.pdf'].includes(ext)) return <FileText className="w-5 h-5 text-red-500" />;
  if (['.mp3', '.wav', '.m4a'].includes(ext)) return <Music className="w-5 h-5 text-purple-500" />;
  if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) return <ImageIcon className="w-5 h-5 text-blue-500" />;
  if (['.docx', '.doc', '.txt'].includes(ext)) return <FileText className="w-5 h-5 text-blue-600" />;
  if (['.xlsx', '.xls', '.csv'].includes(ext)) return <TableIcon className="w-5 h-5 text-green-600" />;
  if (['.pptx', '.ppt'].includes(ext)) return <PresentationIcon className="w-5 h-5 text-orange-500" />;
  if (['.zip', '.rar', '.7z'].includes(ext)) return <Archive className="w-5 h-5 text-yellow-600" />;
  if (['.js', '.ts', '.html', '.css', '.json'].includes(ext)) return <FileCode className="w-5 h-5 text-gray-600" />;
  return <File className="w-5 h-5 text-gray-400" />;
};

export default function FileRenamer() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'mapping' | 'names'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((newFiles: File[]) => {
    setFiles(prev => {
      const updatedFiles = [...prev];
      const usedSlugs = new Set(updatedFiles.map(f => f.slugName + f.extension));

      newFiles.forEach(file => {
        const { name, extension } = getFileParts(file.name);
        let baseSlug = slugify(name);
        if (!baseSlug) baseSlug = 'file';
        
        let finalSlug = baseSlug;
        let counter = 1;
        
        while (usedSlugs.has(finalSlug + extension)) {
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        usedSlugs.add(finalSlug + extension);
        
        updatedFiles.push({
          id: Math.random().toString(36).substring(2, 11),
          originalFile: file,
          originalName: file.name,
          slugName: finalSlug,
          extension: extension
        });
      });
      
      return updatedFiles;
    });
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const downloadFile = (fileItem: FileItem) => {
    const url = URL.createObjectURL(fileItem.originalFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileItem.slugName + fileItem.extension;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    if (files.length === 0) return;
    
    const zip = new JSZip();
    files.forEach(fileItem => {
      zip.file(fileItem.slugName + fileItem.extension, fileItem.originalFile);
    });
    
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `renamed-files-${new Date().getTime()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyMapping = () => {
    const mapping = files.map(f => `${f.originalName} -> ${f.slugName}${f.extension}`).join('\n');
    navigator.clipboard.writeText(mapping);
    setCopyStatus('mapping');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const copyRenamedNames = () => {
    const names = files.map(f => `${f.slugName}${f.extension}`).join('\n');
    navigator.clipboard.writeText(names);
    setCopyStatus('names');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">URL-Friendly File Renamer</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Upload your files to automatically convert their names into clean, SEO-friendly slugs.
          Perfect for web uploads and organized file systems.
        </p>
      </header>

      {/* Upload Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 transition-all duration-200 flex flex-col items-center justify-center space-y-4",
          isDragging 
            ? "border-blue-500 bg-blue-50/50 scale-[1.01]" 
            : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          multiple
          className="hidden"
        />
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
          isDragging ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500"
        )}>
          <Upload className="w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">
            {isDragging ? "Drop files here" : "Click or drag files to upload"}
          </p>
          <p className="text-sm text-gray-500">
            Supports PDF, MP3, DOCX, XLSX, JPG, PNG, and more
          </p>
        </div>
      </div>

      {/* Actions Bar */}
      {files.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm sticky top-4 z-10">
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              {files.length} {files.length === 1 ? 'File' : 'Files'}
            </div>
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copyMapping}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copyStatus === 'mapping' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              Copy mapping
            </button>
            <button
              onClick={copyRenamedNames}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {copyStatus === 'names' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              Copy renamed names
            </button>
            <button
              onClick={downloadAllAsZip}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FileArchive className="w-4 h-4" />
              Download All as ZIP
            </button>
          </div>
        </div>
      )}

      {/* Preview Table */}
      <AnimatePresence mode="wait">
        {files.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-bottom border-gray-200">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Original Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">URL-Friendly Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Extension</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {files.map((file) => (
                    <motion.tr
                      layout
                      key={file.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.extension)}
                          <span className="text-sm text-gray-900 font-medium truncate max-w-[200px] md:max-w-xs" title={file.originalName}>
                            {file.originalName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 break-all">
                          {file.slugName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {file.extension.replace('.', '') || 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => downloadFile(file)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Download renamed file"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p>No files uploaded yet. Start by dragging some files above.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="pt-12 pb-8 text-center text-sm text-gray-400 border-t border-gray-100">
        <p>All processing happens in your browser. Your files are never uploaded to any server.</p>
      </footer>
    </div>
  );
}
