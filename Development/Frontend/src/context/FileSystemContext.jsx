import React, { createContext, useState, useContext, useEffect } from 'react';
import { folderAPI, fileAPI } from '../utils/api';

const FileSystemContext = createContext();

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};

export const FileSystemProvider = ({ children }) => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      console.log('FileSystemContext: Starting data fetch...');
      try {
        const [foldersRes, filesRes] = await Promise.all([
          folderAPI.list(),
          fileAPI.list(),
        ]);
        
        console.log('FileSystemContext: Folders fetched:', foldersRes.data);
        console.log('FileSystemContext: Files fetched:', filesRes.data);
        
        const allFiles = filesRes.data || [];
        const foldersList = foldersRes.data || [];
        
        // Categorize files based on RBAC 'role'
        // 'OWNER' -> My Files
        // 'EDITOR' or 'VIEW' -> Shared With Me
        const myFiles = allFiles.filter(f => f.role === 'OWNER');
        const sharedFilesList = allFiles.filter(f => f.role === 'EDITOR' || f.role === 'VIEW');
        
        setFolders(foldersList);
        setFiles(allFiles); // Keep files as all for now, but we'll add getters for categories
      } catch (error) {
        console.error('FileSystemContext: Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const createFolder = async (folderData) => {
    try {
      const response = await folderAPI.create({
        name: folderData.name,
        color: folderData.color,
        parent: null,
        tags: folderData.tags || [],
      });
      setFolders([...folders, response.data]);
      return { success: true };
    } catch (error) {
      console.error('Error creating folder:', error.response?.data || error.message);
      return { success: false, error: 'Failed to create folder' };
    }
  };

  const deleteFolder = async (folderId) => {
    try {
      await folderAPI.delete(folderId);
      setFolders(folders.filter(f => f.id !== folderId));
      // Also remove files in this folder
      setFiles(files.filter(f => f.folder !== folderId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting folder:', error);
      return { success: false, error: 'Failed to delete folder' };
    }
  };

  const updateFolder = async (folderId, updates) => {
    try {
      const response = await folderAPI.update(folderId, updates);
      setFolders(folders.map(f => f.id === folderId ? response.data : f));
      return { success: true };
    } catch (error) {
      console.error('Error updating folder:', error);
      return { success: false, error: 'Failed to update folder' };
    }
  };

  const uploadFile = async (fileData) => {
    try {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('name', fileData.file.name);
      formData.append('folder', fileData.folder || '');
      formData.append('description', fileData.description || '');
      formData.append('tags', JSON.stringify(fileData.tags || []));
      
      if (fileData.metadata) {
        if (fileData.metadata.author) {
          formData.append('metadata', JSON.stringify({ author: fileData.metadata.author }));
        }
      }

      const response = await fileAPI.upload(formData);
      setFiles([...files, response.data]);
      return { success: true };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: 'Failed to upload file' };
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await fileAPI.delete(fileId);
      setFiles(files.filter(f => f.id !== fileId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: 'Failed to delete file' };
    }
  };

  const updateFile = async (fileId, updates) => {
    try {
      const response = await fileAPI.update(fileId, updates);
      setFiles(files.map(f => f.id === fileId ? response.data : f));
      return { success: true };
    } catch (error) {
      console.error('Error updating file:', error);
      return { success: false, error: 'Failed to update file' };
    }
  };

  const value = {
    folders,
    files,
    myFiles: files.filter(f => f.role === 'OWNER'),
    sharedFiles: files.filter(f => f.role === 'EDITOR' || f.role === 'VIEW'),
    isLoading,
    createFolder,
    deleteFolder,
    updateFolder,
    uploadFile,
    deleteFile,
    updateFile,
  };

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
};
