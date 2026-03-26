/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from "react";
import { folderAPI, fileAPI } from "../utils/api";

const FileSystemContext = createContext();

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error("useFileSystem must be used within a FileSystemProvider");
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
      console.log("FileSystemContext: Starting data fetch...");
      try {
        const [foldersResult, filesResult] = await Promise.allSettled([
          folderAPI.list(),
          fileAPI.list(),
        ]);

        if (foldersResult.status === "fulfilled") {
          console.log(
            "FileSystemContext: Folders fetched:",
            foldersResult.value.data,
          );
          setFolders(foldersResult.value.data || []);
        } else {
          console.error(
            "FileSystemContext: Folder fetch failed:",
            foldersResult.reason,
          );
          setFolders([]);
        }

        if (filesResult.status === "fulfilled") {
          console.log(
            "FileSystemContext: Files fetched:",
            filesResult.value.data,
          );
          setFiles(filesResult.value.data || []);
        } else {
          console.error(
            "FileSystemContext: File fetch failed:",
            filesResult.reason,
          );
          setFiles([]);
        }
      } catch (error) {
        console.error("FileSystemContext: Error fetching data:", error);
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
      console.error(
        "Error creating folder:",
        error.response?.data || error.message,
      );
      return { success: false, error: "Failed to create folder" };
    }
  };

  const deleteFolder = async (folderId) => {
    try {
      await folderAPI.delete(folderId);
      setFolders(folders.filter((f) => f.id !== folderId));
      // Also remove files in this folder
      setFiles(files.filter((f) => f.folder !== folderId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting folder:", error);
      return { success: false, error: "Failed to delete folder" };
    }
  };

  const updateFolder = async (folderId, updates) => {
    try {
      const response = await folderAPI.update(folderId, updates);
      setFolders(folders.map((f) => (f.id === folderId ? response.data : f)));
      return { success: true };
    } catch (error) {
      console.error("Error updating folder:", error);
      return { success: false, error: "Failed to update folder" };
    }
  };

  const uploadFile = async (fileData) => {
    try {
      const formData = new FormData();
      formData.append("file", fileData.file);
      formData.append("name", fileData.file.name);
      // Only send folder when provided; empty string causes DRF PK validation errors.
      if (
        fileData.folder !== null &&
        fileData.folder !== undefined &&
        fileData.folder !== ""
      ) {
        formData.append("folder", String(fileData.folder));
      }
      formData.append("description", fileData.description || "");
      if (Array.isArray(fileData.tags) && fileData.tags.length > 0) {
        formData.append("tags", JSON.stringify(fileData.tags));
      }

      const normalizedMetadata =
        fileData.metadata && typeof fileData.metadata === "object"
          ? Object.fromEntries(
              Object.entries(fileData.metadata).filter(([, value]) => {
                return (
                  value !== null &&
                  value !== undefined &&
                  String(value).trim() !== ""
                );
              }),
            )
          : {};

      if (Object.keys(normalizedMetadata).length > 0) {
        formData.append("metadata", JSON.stringify(normalizedMetadata));
      }

      const response = await fileAPI.upload(formData);
      setFiles([...files, response.data]);
      return { success: true };
    } catch (error) {
      const backendError = error.response?.data;
      console.error("Error uploading file:", backendError || error.message);
      const firstFieldError =
        backendError && typeof backendError === "object"
          ? Object.values(backendError).find(
              (value) => Array.isArray(value) && value.length > 0,
            )?.[0]
          : null;
      const detail =
        backendError?.folder?.[0] ||
        backendError?.file?.[0] ||
        firstFieldError ||
        backendError?.detail ||
        "Failed to upload file";
      return { success: false, error: detail };
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await fileAPI.delete(fileId);
      setFiles(files.filter((f) => f.id !== fileId));
      return { success: true };
    } catch (error) {
      console.error("Error deleting file:", error);
      return { success: false, error: "Failed to delete file" };
    }
  };

  const updateFile = async (fileId, updates) => {
    try {
      const response = await fileAPI.update(fileId, updates);
      setFiles(files.map((f) => (f.id === fileId ? response.data : f)));
      return { success: true };
    } catch (error) {
      console.error("Error updating file:", error);
      return { success: false, error: "Failed to update file" };
    }
  };

  const value = {
    folders,
    files,
    myFiles: files.filter((f) => f.role === "OWNER"),
    sharedFiles: files.filter((f) => f.role === "EDITOR" || f.role === "VIEW"),
    isLoading,
    createFolder,
    deleteFolder,
    updateFolder,
    uploadFile,
    deleteFile,
    updateFile,
    setFiles,
  };

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
};
