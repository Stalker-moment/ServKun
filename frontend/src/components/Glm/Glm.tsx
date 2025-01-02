"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  FaFolder,
  FaFilePdf,
  FaFileAlt,
  FaExpandAlt,
  FaPlus,
  FaFileUpload,
  FaFolderPlus,
  FaFileImage,
  FaFileVideo,
} from "react-icons/fa";
import Notification from "./notification";
import Cookies from "js-cookie";

declare global {
  interface Window {
    AdobeDC: any;
  }
}

interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  hasChildren: boolean;
  pathThumb?: string; // Add this line
}

interface PathItem {
  id: string;
  name: string;
}

const HTTPSAPIURL = process.env.NEXT_PUBLIC_HTTPS_API_URL;

const GlmBoard = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);
  const [fileContentUrl, setFileContentUrl] = useState<string | null>(null);
  const [pathHistory, setPathHistory] = useState<PathItem[]>([
    { id: "", name: "Root" },
  ]);
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
  const [videoModalOpen, setVideoModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    file: FileItem | null;
  }>({
    show: false,
    x: 0,
    y: 0,
    file: null,
  });

  const [addDropdownOpen, setAddDropdownOpen] = useState<boolean>(false);
  const [addFolderModalOpen, setAddFolderModalOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");

  const [addFileModalOpen, setAddFileModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

  const [dragCounter, setDragCounter] = useState<number>(0);

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const addDropdownRef = useRef<HTMLDivElement>(null);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
  };

  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadController, setDownloadController] =
    useState<AbortController | null>(null);

  const fileCache = useRef<Map<string, string>>(new Map());

  // State for drag & drop
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // State for Edit Modal
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<FileItem | null>(null);
  const [editNewName, setEditNewName] = useState<string>("");

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const authHeader = Cookies.get("userAuth") || "";
        const response = await fetch(
          `https://${HTTPSAPIURL}/api/users/token/info`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setUserInfo(data);
          if (data.role === "ADMIN") {
            setIsAdmin(true);
          }
        } else {
          console.error("Gagal mengambil informasi pengguna");
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, []);

  const parentId = pathHistory[pathHistory.length - 1]?.id || "";

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const authHeader = Cookies.get("userAuth") || "";
        const response = await fetch(
          `https://${HTTPSAPIURL}/api/manage/glm/files-tree?parentId=${parentId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setFiles(data);
        } else {
          console.error("Gagal mengambil data file");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [parentId]);

  const handleItemClick = async (item: FileItem) => {
    if (item.type === "folder") {
      setPathHistory((prev) => [...prev, { id: item.id, name: item.name }]);
    } else {
      if (fileCache.current.has(item.id)) {
        const cachedUrl = fileCache.current.get(item.id)!;
        const fileExtension = item.name.split(".").pop()?.toLowerCase();

        if (["jpg", "jpeg", "png", "webp"].includes(fileExtension || "")) {
          setFileContentUrl(cachedUrl);
          setViewingFile(item);
          setImageModalOpen(true);
        } else if (["mp4", "webm"].includes(fileExtension || "")) {
          setFileContentUrl(cachedUrl);
          setViewingFile(item);
          setVideoModalOpen(true);
        } else if (fileExtension === "pdf") {
          setFileContentUrl(cachedUrl);
          setViewingFile(item);
        } else {
          showNotification("Unsupported file type.", "error");
        }
        return;
      }

      setIsDownloading(true);
      setDownloadProgress(0);

      const controller = new AbortController();
      setDownloadController(controller);

      try {
        const authHeader = Cookies.get("userAuth") || "";
        const response = await fetch(
          `https://${HTTPSAPIURL}/api/manage/getfiles`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({ path: item.path }),
            signal: controller.signal,
          },
        );

        if (response.ok && response.body) {
          const contentLength = response.headers.get("Content-Length");
          const total = contentLength ? parseInt(contentLength, 10) : 0;

          const reader = response.body.getReader();
          let receivedLength = 0;
          const chunks = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            receivedLength += value.length;
            if (total) {
              setDownloadProgress(Math.round((receivedLength / total) * 100));
            }
          }

          const blob = new Blob(chunks);
          const fileExtension = item.name.split(".").pop()?.toLowerCase();

          const objectUrl = URL.createObjectURL(blob);
          fileCache.current.set(item.id, objectUrl);

          if (["jpg", "jpeg", "png", "webp"].includes(fileExtension || "")) {
            setFileContentUrl(objectUrl);
            setViewingFile(item);
            setImageModalOpen(true);
          } else if (
            ["mp4", "webm", "mov", "mkv"].includes(fileExtension || "")
          ) {
            setFileContentUrl(objectUrl);
            setViewingFile(item);
            setVideoModalOpen(true);
          } else if (fileExtension === "pdf") {
            setFileContentUrl(objectUrl);
            setViewingFile(item);
          } else {
            showNotification("Unsupported file type.", "error");
          }
        } else {
          console.error("Gagal mendapatkan file.");
          showNotification("Failed to retrieve the file.", "error");
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Download canceled by user.");
          showNotification("Download canceled.", "error");
        } else {
          console.error("Error:", error);
          showNotification(
            "An error occurred while downloading the file.",
            "error",
          );
        }
      } finally {
        setIsDownloading(false);
        setDownloadController(null);
      }
    }
  };

  const cancelDownload = () => {
    if (downloadController) {
      downloadController.abort();
    }
    setIsDownloading(false);
    setDownloadProgress(0);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index < pathHistory.length - 1) {
      setPathHistory(pathHistory.slice(0, index + 1));
    }
  };

  const handleAddFolder = () => {
    setAddFolderModalOpen(true);
    setAddDropdownOpen(false);
  };

  const handleAddFile = () => {
    setAddFileModalOpen(true);
    setAddDropdownOpen(false);
  };

  const submitAddFolder = async () => {
    if (!newFolderName.trim()) {
      showNotification("Folder name is required.", "error");
      return;
    }

    try {
      const authHeader = Cookies.get("userAuth") || "";
      const response = await fetch(
        `https://${HTTPSAPIURL}/api/manage/glm/folders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({ parentId, name: newFolderName }),
        },
      );

      if (response.ok) {
        refreshFiles();
        setAddFolderModalOpen(false);
        setNewFolderName("");
        showNotification("Folder added successfully.", "success");
      } else {
        const errorData = await response.json();
        console.error("Gagal menambah folder:", errorData);
        showNotification("Failed to add folder.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification("An error occurred while adding folder.", "error");
    }
  };

  const uploadFileWithProgress = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const authHeader = Cookies.get("userAuth") || "";
      xhr.open(
        "POST",
        `https://${HTTPSAPIURL}/api/manage/glm/files?parentId=${parentId}`,
        true,
      );

      xhr.setRequestHeader("Authorization", authHeader);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Upload failed due to a network error."));
      };

      const formData = new FormData();
      formData.append("file", file);

      xhr.send(formData);
    });
  };

  const submitAddFile = async () => {
    if (!selectedFile) {
      showNotification("Please select a file to upload.", "error");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setAddFileModalOpen(false);

      await uploadFileWithProgress(selectedFile);

      setSelectedFile(null);
      refreshFiles();
      showNotification("File uploaded successfully.", "success");
    } catch (error) {
      console.error("Error:", error);
      showNotification("An error occurred while uploading file.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const openDeleteModal = (file: FileItem) => {
    console.log("Opening delete modal for:", file);
    setDeleteTarget(file);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const authHeader = Cookies.get("userAuth") || "";
      const response = await fetch(
        `https://${HTTPSAPIURL}/api/manage/glm/files/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        },
      );

      if (response.ok) {
        showNotification(
          `${deleteTarget.name} successfully deleted`,
          "success",
        );
        fileCache.current.delete(deleteTarget.id);

        refreshFiles();
        closeDeleteModal();
      } else {
        console.error("Failed to delete file or folder.");
        showNotification("Failed to delete file or folder.", "error");
      }
    } catch (error) {
      console.error("Error deleting file or folder:", error);
      showNotification(
        "An error occurred while deleting file or folder.",
        "error",
      );
    }
  };

  const refreshFiles = async () => {
    setLoading(true);
    try {
      const authHeader = Cookies.get("userAuth") || "";
      const response = await fetch(
        `https://${HTTPSAPIURL}/api/manage/glm/files-tree?parentId=${parentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      } else {
        console.error("Failed to refresh files.");
      }
    } catch (error) {
      console.error("Error refreshing files:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.pageX,
      y: e.pageY,
      file: item,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({
      ...contextMenu,
      show: false,
    });
  };

  const handleEdit = () => {
    if (contextMenu.file) {
      setEditTarget(contextMenu.file);
      setEditNewName(getEditableName(contextMenu.file));
      setEditModalOpen(true);
    }
    handleCloseContextMenu();
  };

  const handleDelete = () => {
    if (contextMenu.file) {
      openDeleteModal(contextMenu.file);
    }
    handleCloseContextMenu();
  };

  const handleForbidden = () => {
    showNotification("You don't have permission to change this file.", "error");
    handleCloseContextMenu();
  };

  // Function to get editable name (without extension for files)
  const getEditableName = (file: FileItem): string => {
    if (file.type === "file") {
      const lastDotIndex = file.name.lastIndexOf(".");
      if (lastDotIndex === -1) return file.name;
      return file.name.substring(0, lastDotIndex);
    }
    return file.name;
  };

  // Function to get file extension (for files)
  const getFileExtension = (file: FileItem): string => {
    if (file.type === "file") {
      const lastDotIndex = file.name.lastIndexOf(".");
      if (lastDotIndex === -1) return "";
      return file.name.substring(lastDotIndex);
    }
    return "";
  };

  const submitEdit = async () => {
    if (!editTarget) return;

    const newNameTrimmed = editNewName.trim();
    if (!newNameTrimmed) {
      showNotification("Name cannot be empty.", "error");
      return;
    }

    // For files, ensure the extension is not changed
    let finalName = newNameTrimmed;
    if (editTarget.type === "file") {
      const extension = getFileExtension(editTarget);
      finalName += extension;
    }

    try {
      const authHeader = Cookies.get("userAuth") || "";
      const response = await fetch(
        `https://${HTTPSAPIURL}/api/manage/glm/files/${editTarget.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({ newName: finalName }),
        },
      );

      if (response.ok) {
        showNotification("Successfully renamed.", "success");
        refreshFiles();
        setEditModalOpen(false);
        setEditTarget(null);
        setEditNewName("");
      } else {
        const errorData = await response.json();
        console.error("Failed to rename:", errorData);
        showNotification("Failed to rename.", "error");
      }
    } catch (error) {
      console.error("Error renaming file/folder:", error);
      showNotification("An error occurred while renaming.", "error");
    }
  };

  const openEditModal = (file: FileItem) => {
    setEditTarget(file);
    setEditNewName(getEditableName(file));
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditTarget(null);
    setEditNewName("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node) &&
        addDropdownRef.current &&
        !addDropdownRef.current.contains(event.target as Node)
      ) {
        handleCloseContextMenu();
        setAddDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (viewingFile && fileContentUrl && viewingFile.name.endsWith(".pdf")) {
      const adobeDCViewScript = document.createElement("script");
      adobeDCViewScript.src =
        "https://acrobatservices.adobe.com/view-sdk/viewer.js";
      adobeDCViewScript.onload = () => {
        if (window.AdobeDC) {
          const adobeDCView = new window.AdobeDC.View({
            clientId: "311271dd4d5f4c839cddddc595fd89b2",
          });
          adobeDCView.previewFile(
            {
              content: { location: { url: fileContentUrl } },
              metaData: { fileName: viewingFile.name },
            },
            { embedMode: "LIGHT_BOX" },
          );
        } else {
          console.error("AdobeDC is not available in the window object.");
        }
      };
      document.body.appendChild(adobeDCViewScript);
    }
  }, [viewingFile, fileContentUrl]);

  const handleDeleteClick = () => {
    if (contextMenu.file) {
      openDeleteModal(contextMenu.file);
    }
    handleCloseContextMenu();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter((prev) => prev + 1);
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter((prev) => prev - 1);
    if (dragCounter === 1) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setDragCounter(0);

    if (!isAdmin) {
      showNotification("You don't have permission to upload files.", "error");
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      setUploadProgress(0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          await uploadFileWithProgress(file);
          showNotification(
            `File ${file.name} uploaded successfully.`,
            "success",
          );
        } catch (error) {
          console.error("Error uploading file:", error);
          showNotification(
            `An error occurred while uploading ${file.name}.`,
            "error",
          );
        }
      }

      setIsUploading(false);
      refreshFiles();
    }
  };

  return (
    <div
      className="p-4"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <h2 className="mb-4 select-none text-lg font-semibold">File Manager</h2>

      {/* Visual feedback for drag & drop */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="rounded-lg bg-white p-6 text-center shadow-lg dark:bg-slate-800">
            <FaFileUpload size={48} className="mx-auto mb-4 text-blue-500" />
            <p className="text-lg font-semibold">Drop files here to upload</p>
          </div>
        </div>
      )}

      {/* Header dengan Breadcrumbs dan Add Dropdown */}
      <div className="mb-4 flex items-center justify-between">
        {/* Breadcrumbs */}
        <div className="flex select-none items-center space-x-2">
          {pathHistory.map((item, index) => (
            <React.Fragment key={item.id || "root"}>
              {index > 0 && <span className="text-gray-500">/</span>}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`select-none text-blue-500 hover:underline ${
                  index === pathHistory.length - 1 ? "font-semibold" : ""
                }`}
              >
                {item.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Tombol Add Folder/File */}
        {isAdmin && (
          <div className="relative" ref={addDropdownRef}>
            <button
              className="flex items-center justify-center rounded-md bg-green-500 p-2 text-white hover:bg-green-600"
              onClick={() => setAddDropdownOpen(!addDropdownOpen)}
              title="Add"
            >
              <FaPlus size={16} />
            </button>

            {/* Dropdown Menu */}
            {addDropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-700">
                <button
                  className="flex w-full items-center px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-600"
                  onClick={handleAddFolder}
                >
                  <FaFolderPlus className="mr-2" /> Add Folder
                </button>
                <button
                  className="flex w-full items-center px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-600"
                  onClick={handleAddFile}
                >
                  <FaFileUpload className="mr-2" /> Add File
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
  <p>Loading...</p>
) : (
  <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
    {files.map((item) => (
      <li
        key={item.id}
        className="flex cursor-pointer flex-col items-center"
        onClick={() => handleItemClick(item)}
        onContextMenu={(e) => handleContextMenu(e, item)}
      >
        <div className="mb-2 text-4xl">
          {item.type === "folder" ? (
            item.pathThumb ? (
              // Jika folder memiliki thumbnail
              <Image
                src={item.pathThumb}
                alt={item.name}
                width={256}
                height={256}
                className="object-cover rounded-md"
              />
            ) : (
              // Jika tidak ada thumbnail, tampilkan folder icon
              <FaFolder className="text-yellow-500" />
            )
          ) : item.name.endsWith(".pdf") ? (
            <FaFilePdf className="text-red-500" />
          ) : item.name.endsWith(".jpg") ||
            item.name.endsWith(".png") ||
            item.name.endsWith(".jpeg") ||
            item.name.endsWith(".webp") ? (
            <FaFileImage className="text-green-500" />
          ) : item.name.endsWith(".mp4") ||
            item.name.endsWith(".webm") ||
            item.name.endsWith(".mkv") ||
            item.name.endsWith(".mov") ? (
            <FaFileVideo className="text-blue-500" />
          ) : (
            <FaFileAlt className="text-gray-500" />
          )}
        </div>
        <p className="select-none text-center text-sm">{item.name}</p>
      </li>
    ))}
  </ul>
)}


      {/* Menampilkan Progress Download */}
      {isDownloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-semibold">Mengunduh File</h3>
            <p className="mb-2">Harap tunggu, file sedang diunduh.</p>
            <div className="w-full rounded-full bg-gray-200">
              <div
                className="h-4 rounded-full bg-blue-500"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-center">{downloadProgress}%</p>
            <button
              className="mt-4 rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              onClick={cancelDownload}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Menampilkan Progress Upload */}
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-semibold">Mengunggah File</h3>
            <p className="mb-2">Harap tunggu, file sedang diunggah.</p>
            <div className="w-full rounded-full bg-gray-200">
              <div
                className="h-4 rounded-full bg-green-500"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-center">{uploadProgress}%</p>
          </div>
        </div>
      )}

      {/* Context Menu (Klik Kanan) */}
      {contextMenu.show && (
        <div
          className="fixed z-50 rounded-md bg-white shadow-md dark:bg-slate-700"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          ref={contextMenuRef}
        >
          {isAdmin ? (
            <ul>
              <li
                className="cursor-pointer px-4 py-2 hover:bg-yellow-600"
                onClick={handleEdit}
              >
                Edit
              </li>
              <li
                className="cursor-pointer px-4 py-2 hover:bg-red-600"
                onClick={handleDelete}
              >
                Delete
              </li>
            </ul>
          ) : (
            <ul>
              <li
                className="cursor-pointer px-4 py-2 hover:bg-yellow-600"
                onClick={handleForbidden}
              >
                Edit
              </li>
              <li
                className="cursor-pointer px-4 py-2 hover:bg-red-600"
                onClick={handleForbidden}
              >
                Delete
              </li>
            </ul>
          )}
        </div>
      )}

      {/* Modal untuk Add Folder */}
      {addFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-80 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-semibold">Add New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder Name"
              className="mb-4 w-full rounded-md border border-gray-300 px-4 py-2 dark:border-slate-600"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 dark:bg-slate-600 dark:text-gray-200"
                onClick={() => {
                  setAddFolderModalOpen(false);
                  setNewFolderName("");
                }}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                onClick={submitAddFolder}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal untuk Add File */}
      {addFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-80 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-semibold">Upload File</h3>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="mb-4 w-full"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 dark:bg-slate-600 dark:text-gray-200"
                onClick={() => {
                  setAddFileModalOpen(false);
                  setSelectedFile(null);
                }}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                onClick={submitAddFile}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Folder/File */}
      {editModalOpen && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-80 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-semibold">
              Edit {editTarget.type === "folder" ? "Folder" : "File"}
            </h3>
            <input
              type="text"
              value={editNewName}
              onChange={(e) => setEditNewName(e.target.value)}
              placeholder="New Name"
              className="mb-4 w-full rounded-md border border-gray-300 px-4 py-2 dark:border-slate-600"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 dark:bg-slate-600 dark:text-gray-200"
                onClick={closeEditModal}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                onClick={submitEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal untuk Gambar */}
      {imageModalOpen && fileContentUrl && (
        <>
          {isFullscreen && document.body.classList.add("overflow-hidden")}

          <div
            className={`fixed inset-0 flex items-center justify-center ${
              isFullscreen ? "bg-black" : "bg-black bg-opacity-70"
            } z-[9999]`}
            onClick={() => !isFullscreen && setImageModalOpen(false)}
          >
            <div
              className={`relative ${
                isFullscreen
                  ? "h-screen w-screen"
                  : "rounded-lg bg-transparent p-4 shadow-lg dark:bg-transparent"
              } ${
                isFullscreen
                  ? "overflow-hidden"
                  : "mx-4 max-h-[80vh] w-full max-w-4xl"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {!isFullscreen && (
                <button
                  className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-lg text-white"
                  onClick={() => setImageModalOpen(false)}
                >
                  ✕
                </button>
              )}

              {/* Gambar */}
              <div
                className={`relative flex items-center justify-center ${
                  isFullscreen ? "h-full w-full" : "h-[70vh] max-h-full"
                } overflow-hidden`}
              >
                <Image
                  src={fileContentUrl}
                  alt={viewingFile?.name || "Gambar"}
                  layout="fill"
                  objectFit="contain"
                  className={`${
                    isFullscreen
                      ? "h-full w-full"
                      : "max-h-full max-w-full rounded-md"
                  }`}
                />
              </div>

              <button
                className="absolute bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white"
                onClick={() => {
                  toggleFullscreen();
                  if (!isFullscreen) {
                    document.body.classList.add("overflow-hidden");
                  } else {
                    document.body.classList.remove("overflow-hidden");
                  }
                }}
                title="Toggle Fullscreen"
              >
                {isFullscreen ? "🗕" : <FaExpandAlt />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal untuk Video */}
      {videoModalOpen && fileContentUrl && (
        <>
          {isFullscreen && document.body.classList.add("overflow-hidden")}

          <div
            className={`fixed inset-0 flex items-center justify-center ${
              isFullscreen ? "bg-black" : "bg-black bg-opacity-70"
            } z-[9999]`}
            onClick={() => !isFullscreen && setVideoModalOpen(false)}
          >
            <div
              className={`relative ${
                isFullscreen
                  ? "h-screen w-screen"
                  : "rounded-lg bg-transparent p-4 shadow-lg dark:bg-transparent"
              } ${
                isFullscreen
                  ? "overflow-hidden"
                  : "mx-4 max-h-[80vh] w-full max-w-4xl"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {!isFullscreen && (
                <button
                  className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-lg text-white"
                  onClick={() => setVideoModalOpen(false)}
                >
                  ✕
                </button>
              )}

              {/* Video */}
              <div
                className={`relative flex items-center justify-center ${
                  isFullscreen ? "h-full w-full" : "h-[70vh] max-h-full"
                } overflow-hidden`}
              >
                <video
                  src={fileContentUrl}
                  controls
                  autoPlay
                  loop
                  className={`${
                    isFullscreen
                      ? "h-full w-full"
                      : "max-h-full max-w-full rounded-md"
                  }`}
                />
              </div>

              <button
                className="absolute bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white"
                onClick={() => {
                  toggleFullscreen();
                  if (!isFullscreen) {
                    document.body.classList.add("overflow-hidden");
                  } else {
                    document.body.classList.remove("overflow-hidden");
                  }
                }}
                title="Toggle Fullscreen"
              >
                {isFullscreen ? "🗕" : <FaExpandAlt />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal Konfirmasi Delete */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-semibold">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 dark:bg-slate-600 dark:text-gray-200"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Folder/File */}
      {editModalOpen && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-80 rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
            <h3 className="mb-4 text-lg font-semibold">
              Edit {editTarget.type === "folder" ? "Folder" : "File"}
            </h3>
            <input
              type="text"
              value={editNewName}
              onChange={(e) => setEditNewName(e.target.value)}
              placeholder="New Name"
              className="mb-4 w-full rounded-md border border-gray-300 px-4 py-2 dark:border-slate-600"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="rounded-md bg-gray-300 px-4 py-2 text-gray-700 dark:bg-slate-600 dark:text-gray-200"
                onClick={closeEditModal}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                onClick={submitEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlmBoard;