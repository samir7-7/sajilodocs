import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useFileSystem } from '../context/FileSystemContext';
import FileList from '../components/features/FileList';
import { Button } from '../components/common/Button';
import { ArrowLeft, Upload, Grid3x3, List, ChevronRight, FolderOpen } from 'lucide-react';
import UploadFileModal from '../components/features/UploadFileModal';

const FolderView = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { folders, files, isLoading, uploadFile, deleteFile } = useFileSystem();
  const [folder, setFolder] = useState(null);
  const [folderFiles, setFolderFiles] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  useEffect(() => {
    const f = folders.find(item => String(item.id) === folderId);
    setFolder(f);
    const related = files.filter(file => String(file.folder) === folderId);
    setFolderFiles(related);
  }, [folderId, folders, files]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!folder) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FolderOpen size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">Folder not found</p>
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="mt-4">
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="hover:text-gray-900 transition-colors"
          >
            All Files
          </button>
          <ChevronRight size={16} />
          <span className="text-gray-900 font-medium">{folder.name}</span>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{folder.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {folderFiles.length} {folderFiles.length === 1 ? 'file' : 'files'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                aria-label="List view"
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 size={18} />
              </button>
            </div>

            <Button size="sm" className="gap-2" onClick={() => setIsUploadModalOpen(true)}>
              <Upload size={18} />
              <span className="hidden sm:inline">Upload File</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </div>
        </div>
      </div>

      {/* File List/Grid */}
      {folderFiles.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <FileList
            files={folderFiles}
            viewMode={viewMode}
            onEdit={(f, isOpen) => {
              if (isOpen) {
                navigate(`/dashboard/document/${f.id}`);
              }
            }}
            onDelete={deleteFile}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No files yet</h3>
            <p className="text-gray-500 mb-6">
              Upload your first file to this folder to get started
            </p>
            <Button onClick={() => setIsUploadModalOpen(true)} className="gap-2">
              <Upload size={18} />
              Upload File
            </Button>
          </div>
        </div>
      )}

      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={uploadFile}
        initialFolderId={folderId}
      />
    </DashboardLayout>
  );
};

export default FolderView;
