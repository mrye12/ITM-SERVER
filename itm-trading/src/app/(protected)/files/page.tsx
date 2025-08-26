"use client"
import { useEffect, useState, useRef } from "react"
import { useFileManager, FileRecord } from "@/hooks/useFileManager"
import { useRealtimeTable } from "@/hooks/useRealtimeTable"

interface FileActivity {
  id: number
  file_id: string
  user_id: string
  action: string
  details: any
  created_at: string
}

export default function FilesPage() {
  const {
    files,
    loading,
    uploadProgress,
    loadFiles,
    uploadFile,
    deleteFile,
    downloadFile,
    getFileUrl
  } = useFileManager()

  const { data: activities } = useRealtimeTable<FileActivity>({
    table: 'file_activities',
    orderBy: { column: 'created_at', ascending: false }
  })

  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [currentFolder, setCurrentFolder] = useState('/')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadFiles(currentFolder)
  }, [currentFolder, loadFiles])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    files.forEach(file => uploadFile(file, currentFolder))
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(event.dataTransfer.files)
    files.forEach(file => uploadFile(file, currentFolder))
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDelete = async (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile(fileId)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('doc') || mimeType.includes('docx')) return '📝'
    if (mimeType.includes('xls') || mimeType.includes('xlsx')) return '📊'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦'
    return '📄'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">File Manager</h1>
        <div className="text-sm text-green-600 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Real-time sync active
        </div>
      </div>

      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-4xl mb-4">📁</div>
        <h3 className="text-lg font-semibold mb-2">
          {isDragging ? 'Drop files here!' : 'Upload Files'}
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to browse
        </p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Choose Files
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Uploading... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
      </div>

      {/* Files Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Files List */}
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Files ({files.length})</h2>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p>Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📁</div>
                <p>No files uploaded yet</p>
                <p className="text-sm">Upload your first file to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file: FileRecord) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getFileIcon(file.mime_type)}
                      </span>
                      <div>
                        <div className="font-medium text-sm">
                          {file.original_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadFile(file.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded hover:bg-blue-50"
                        title="Download"
                      >
                        ⬇️
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          
          <div className="p-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">📋</div>
                <p>No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                    <span className="text-lg">
                      {activity.action === 'upload' && '⬆️'}
                      {activity.action === 'download' && '⬇️'}
                      {activity.action === 'delete' && '🗑️'}
                      {activity.action === 'share' && '🔗'}
                      {activity.action === 'rename' && '✏️'}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {activity.action === 'upload' && 'File uploaded'}
                        {activity.action === 'download' && 'File downloaded'}
                        {activity.action === 'delete' && 'File deleted'}
                        {activity.action === 'share' && 'File shared'}
                        {activity.action === 'rename' && 'File renamed'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {activity.details?.file_name && (
                          <span className="font-mono">{activity.details.file_name}</span>
                        )}
                        {activity.details?.file_size && (
                          <span> • {formatFileSize(activity.details.file_size)}</span>
                        )}
                        <br />
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {files.length}
          </div>
          <div className="text-sm text-gray-600">Total Files</div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {formatFileSize(files.reduce((total, file) => total + file.file_size, 0))}
          </div>
          <div className="text-sm text-gray-600">Total Size</div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {activities.filter(a => a.action === 'upload').length}
          </div>
          <div className="text-sm text-gray-600">Uploads Today</div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">
            {activities.filter(a => a.action === 'download').length}
          </div>
          <div className="text-sm text-gray-600">Downloads Today</div>
        </div>
      </div>
    </div>
  )
}



