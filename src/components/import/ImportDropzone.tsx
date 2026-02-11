'use client'

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ImportedFile {
  name: string;
  size: string;
  status: "uploading" | "success" | "error";
  progress: number;
}

const ImportDropzone = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<ImportedFile[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: ImportedFile[] = droppedFiles.map((file) => ({
      name: file.name,
      size: formatFileSize(file.size),
      status: "uploading",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((file, index) => {
      const interval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.name === file.name && f.status === "uploading") {
              const newProgress = f.progress + Math.random() * 30;
              if (newProgress >= 100) {
                clearInterval(interval);
                return { ...f, progress: 100, status: "success" };
              }
              return { ...f, progress: newProgress };
            }
            return f;
          })
        );
      }, 500);
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newFiles: ImportedFile[] = selectedFiles.map((file) => ({
        name: file.name,
        size: formatFileSize(file.size),
        status: "uploading",
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      newFiles.forEach((file) => {
        const interval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) => {
              if (f.name === file.name && f.status === "uploading") {
                const newProgress = f.progress + Math.random() * 30;
                if (newProgress >= 100) {
                  clearInterval(interval);
                  return { ...f, progress: 100, status: "success" };
                }
                return { ...f, progress: newProgress };
              }
              return f;
            })
          );
        }, 500);
      });
    }
  };

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
      >
        <input
          type="file"
          id="file-input"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
              isDragging ? "bg-primary/20" : "bg-muted"
            }`}
          >
            <Upload
              className={`h-7 w-7 transition-colors duration-300 ${
                isDragging ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
          <div>
            <p className="font-medium">
              Drop your spreadsheets here, or{" "}
              <label
                htmlFor="file-input"
                className="text-primary cursor-pointer hover:underline"
              >
                browse
              </label>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Supports CSV, XLSX, XLS files up to 50MB
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <span className="text-xs text-muted-foreground">{file.size}</span>
                </div>
                {file.status === "uploading" && (
                  <Progress value={file.progress} className="h-1" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {file.status === "success" && (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                )}
                {file.status === "error" && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeFile(file.name)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportDropzone;
