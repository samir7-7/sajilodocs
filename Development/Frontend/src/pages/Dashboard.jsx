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

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    folders,
    files,
    isLoading,
    createFolder,
    deleteFolder,
    deleteFile,
    uploadFile,
  } = useFileSystem();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFolders = folders.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.tags &&
        f.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.metadata &&
        f.metadata.description &&
        f.metadata.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {user?.first_name || user?.username || "User"}👋🏻
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Here's what's happening with your documents.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 flex-1 sm:flex-initial"
              onClick={() => setIsCreateFolderOpen(true)}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Folder</span>
              <span className="sm:hidden">Folder</span>
            </Button>
            <Button
              size="sm"
              className="gap-2 flex-1 sm:flex-initial"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Upload size={18} />
              <span className="hidden sm:inline">Upload File</span>
              <span className="sm:hidden">Upload</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="w-full sm:max-w-md">
          <Input
            icon={Search}
            placeholder="Search folders, files, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white"
          />
        </div>
      </div>

      {/* Folders Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Folders</h2>
        {filteredFolders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onEdit={(f) => alert(`Edit folder: ${f.name}`)}
                onDelete={deleteFolder}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No folders found.</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Files
        </h2>
        <FileList
          files={filteredFiles}
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
    </DashboardLayout>
  );
};

export default Dashboard;
