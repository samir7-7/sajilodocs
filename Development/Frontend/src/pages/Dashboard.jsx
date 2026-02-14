import React, { useState } from "react";
import { Plus, Upload, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useFileSystem } from "../context/FileSystemContext";
import { useAuth } from "../context/AuthContext";
import FolderCard from "../components/features/FolderCard";
import FileList from "../components/features/FileList";
import CreateFolderModal from "../components/features/CreateFolderModal";
import UploadFileModal from "../components/features/UploadFileModal";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { cn } from "../utils/cn";
import ContextMenu from "../components/common/ContextMenu";
import ShareModal from "../components/features/ShareModal";

const Dashboard = () => {
  console.log("Dashboard rendering...");
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    folders,
    files, // Keep files for general use if needed, though myFiles/sharedFiles will be primary for the list
    myFiles,
    sharedFiles,
    isLoading,
    createFolder,
    deleteFolder,
    deleteFile,
    uploadFile,
    updateFile,
  } = useFileSystem();

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' or 'shared'
  
  // Context Menu & Share Modal State
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, item: null, type: null });
  const [shareModal, setShareModal] = useState({ isOpen: false, item: null, type: null });

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      item,
      type
    });
  };

  const handleShareAction = (item, type) => {
    setShareModal({
      isOpen: true,
      item,
      type
    });
  };

  const currentFiles = activeTab === 'mine' ? myFiles : sharedFiles;

  const filteredFolders = (folders || []).filter(
    (f) =>
      f && f.name && (
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.tags &&
        Array.isArray(f.tags) &&
        f.tags.some((t) => t && t.toLowerCase().includes(searchQuery.toLowerCase())))
      )
  );

  const filteredFiles = (currentFiles || []).filter(
    (f) =>
      f && (
      f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.metadata &&
        typeof f.metadata === 'object' &&
        f.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      )
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="h-10 w-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Preparing your workspace...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Dashboard Top Section */}
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
        <div>
          <nav className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
            <span className="hover:text-[#0061FF] cursor-pointer transition-colors">SajiloDocs</span>
            <span>/</span>
            <span className="text-slate-900">Home</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            className="h-11 px-6 bg-[#0061FF] hover:bg-[#0052D9] text-white rounded-md font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload size={18} />
            <span>Upload</span>
          </Button>
          <Button
            variant="outline"
            className="h-11 px-4 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-md font-bold transition-all active:scale-95"
            onClick={() => setIsCreateFolderOpen(true)}
          >
            <Plus size={20} />
          </Button>
        </div>
      </div>

      {/* Suggested / Starred (Placeholder for future features) */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Folders</h2>
          <Button variant="ghost" className="text-[#0061FF] font-bold text-sm h-auto p-0 hover:bg-transparent">
            View all
          </Button>
        </div>
        
        {filteredFolders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onEdit={(f) => alert(`Edit folder: ${f.name}`)}
                onDelete={deleteFolder}
                onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl py-12 flex flex-col items-center">
             <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                <Plus size={32} className="text-slate-300" />
             </div>
             <p className="text-slate-500 font-medium">Organize your files by creating a folder</p>
          </div>
        )}
      </div>

      {/* Files Section */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === 'mine' ? 'My Files' : 'Shared With Me'}
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              {activeTab === 'mine' ? 'Access and manage your personal documents' : 'Files shared with you by others'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('mine')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  activeTab === 'mine' ? "bg-white text-[#0061FF] shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                Personal
              </button>
              <button 
                onClick={() => setActiveTab('shared')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  activeTab === 'shared' ? "bg-white text-[#0061FF] shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                Shared
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight"></h2> {/* Title moved to new header section */}
          <div className="flex items-center gap-4">
             <div className="flex border border-slate-200 rounded-lg p-1">
                <button className="p-1 px-3 bg-slate-50 text-[#0061FF] rounded-md text-xs font-bold">List</button>
                <button className="p-1 px-3 text-slate-400 rounded-md text-xs font-bold hover:text-slate-600 transition-colors">Grid</button>
             </div>
          </div>
        </div>

        <FileList
          files={filteredFiles}
          onContextMenu={(e, file) => handleContextMenu(e, file, 'file')}
          onEdit={(f, isOpen) => {
            if (isOpen) {
              navigate(`/dashboard/document/${f.id}`);
            } else {
              alert(`Edit file: ${f.name}`);
            }
          }}
          onDelete={deleteFile}
        />
      </div>

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreate={createFolder}
      />
      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={uploadFile}
      />

      {/* Sharing and Action Overlays */}
      <ContextMenu
        {...contextMenu}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        items={{
          onOpen: (item) => contextMenu.type === 'folder' 
            ? navigate(`/dashboard/folder/${item.id}`) 
            : navigate(`/dashboard/document/${item.id}`),
          onShare: (item) => handleShareAction(item, contextMenu.type),
          onRename: (item) => alert(`Rename ${contextMenu.type}: ${item.name}`),
          onDelete: (item) => contextMenu.type === 'folder' ? deleteFolder(item.id) : deleteFile(item.id),
          onDownload: contextMenu.type === 'file' ? (file) => {
            if (file.file_url) {
              const link = document.createElement('a');
              link.href = file.file_url;
              link.download = file.name;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          } : null
        }}
      />

      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ ...shareModal, isOpen: false })}
        item={shareModal.item}
        type={shareModal.type}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
