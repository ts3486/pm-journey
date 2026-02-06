"use client";

import { useState, useRef } from "react";

type FileUploadMockupProps = {
  description?: string;
};

type MockFile = {
  name: string;
  size: number;
  type: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
};

export function FileUploadMockup({ description }: FileUploadMockupProps) {
  const [files, setFiles] = useState<MockFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES = 5;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "application/pdf"];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: 許可されていないファイル形式です（JPEG, PNG, GIF, PDF のみ）`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: ファイルサイズが10MBを超えています`;
    }
    return null;
  };

  const addFiles = (newFiles: FileList) => {
    setError(null);

    if (files.length + newFiles.length > MAX_FILES) {
      setError(`ファイルは最大${MAX_FILES}個までアップロードできます`);
      return;
    }

    const validatedFiles: MockFile[] = [];
    const errors: string[] = [];

    Array.from(newFiles).forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
      } else {
        validatedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          status: "pending",
          progress: 0,
        });
      }
    });

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }

    if (validatedFiles.length > 0) {
      setFiles((prev) => [...prev, ...validatedFiles]);

      validatedFiles.forEach((_, index) => {
        simulateUpload(files.length + index);
      });
    }
  };

  const simulateUpload = (fileIndex: number) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === fileIndex ? { ...f, status: "uploading" as const } : f)),
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        clearInterval(interval);
        const success = Math.random() > 0.2;
        setFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex
              ? {
                  ...f,
                  status: success ? ("success" as const) : ("error" as const),
                  progress: 100,
                  error: success ? undefined : "アップロードに失敗しました",
                }
              : f,
          ),
        );
      } else {
        setFiles((prev) =>
          prev.map((f, i) => (i === fileIndex ? { ...f, progress: Math.min(progress, 99) } : f)),
        );
      }
    }, 500);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">ファイルアップロード</h2>
        {description && <p className="text-sm text-gray-500 mt-2">{description}</p>}
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <div className="text-4xl mb-2">📁</div>
        <p className="text-sm text-gray-600">
          ファイルをドラッグ＆ドロップ
          <br />
          または<span className="text-blue-600">クリックして選択</span>
        </p>
        <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF, PDF / 最大10MB / 最大5ファイル</p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            アップロードファイル ({files.length}/{MAX_FILES})
          </h3>
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
              <div className="w-8 h-8 flex items-center justify-center text-lg">
                {file.type.startsWith("image/") ? "🖼️" : "📄"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                {file.status === "uploading" && (
                  <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                {file.status === "error" && (
                  <p className="text-xs text-red-500 mt-1">{file.error}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {file.status === "uploading" && (
                  <span className="text-xs text-gray-500">{Math.round(file.progress)}%</span>
                )}
                {file.status === "success" && (
                  <span className="text-green-500 text-sm">✓</span>
                )}
                {file.status === "error" && (
                  <button
                    onClick={() => simulateUpload(index)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    再試行
                  </button>
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs text-gray-500">
        <p className="font-medium mb-1">仕様情報:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>対応形式: JPEG, PNG, GIF, PDF</li>
          <li>最大サイズ: 10MB/ファイル</li>
          <li>最大ファイル数: 5</li>
          <li>ドラッグ＆ドロップ対応</li>
          <li>アップロード失敗時は再試行可能</li>
        </ul>
      </div>
    </div>
  );
}
