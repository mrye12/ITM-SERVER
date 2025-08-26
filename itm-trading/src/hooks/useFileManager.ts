"use client"
import { useState, useCallback } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useRealtime } from '@/contexts/RealtimeContext'

export interface FileRecord {
  id: string
  name: string
  original_name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by: string
  folder_path: string
  is_public: boolean
  metadata: any
  created_at: string
  updated_at: string
}

export interface FileActivity {
  id: number
  file_id: string
  user_id: string
  action: 'upload' | 'download' | 'delete' | 'share' | 'rename'
  details: any
  created_at: string
}

export function useFileManager() {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [activities, setActivities] = useState<FileActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const { subscribeToTable } = useRealtime()

  // Load files with real-time subscription
  const loadFiles = useCallback(async (folderPath: string = '/') => {
    setLoading(true)
    try {
      const { data, error } = await supabaseBrowser()
        .from('files')
        .select(`
          *,
          uploaded_user:profiles!files_uploaded_by_fkey(full_name)
        `)
        .eq('folder_path', folderPath)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])

      // Subscribe to real-time changes
      const unsubscribe = subscribeToTable('files', (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload

        setFiles(currentFiles => {
          switch (eventType) {
            case 'INSERT':
              return [newRecord, ...currentFiles]
            case 'UPDATE':
              return currentFiles.map(file => 
                file.id === newRecord.id ? newRecord : file
              )
            case 'DELETE':
              return currentFiles.filter(file => file.id !== oldRecord.id)
            default:
              return currentFiles
          }
        })

        // Show real-time notification
        if (eventType === 'INSERT') {
          showNotification(`📁 New file uploaded: ${newRecord.original_name}`)
        } else if (eventType === 'DELETE') {
          showNotification(`🗑️ File deleted: ${oldRecord.original_name}`)
        }
      })

      return unsubscribe
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }, [subscribeToTable])

  // Upload file with progress tracking
  const uploadFile = useCallback(async (
    file: File, 
    folderPath: string = '/',
    isPublic: boolean = false
  ) => {
    try {
      setUploadProgress(0)
      const { data: { user } } = await supabaseBrowser().auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseBrowser().storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Save file record to database
      const { data: fileRecord, error: dbError } = await supabaseBrowser()
        .from('files')
        .insert({
          name: fileName,
          original_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
          folder_path: folderPath,
          is_public: isPublic,
          metadata: {
            lastModified: file.lastModified,
            webkitRelativePath: (file as any).webkitRelativePath || ''
          }
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Log activity
      await logFileActivity(fileRecord.id, 'upload', {
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type
      })

      setUploadProgress(100)
      showNotification(`✅ File uploaded: ${file.name}`)
      
      return fileRecord
    } catch (error) {
      console.error('Upload error:', error)
      showNotification(`❌ Upload failed: ${(error as Error).message}`)
      throw error
    } finally {
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [])

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const { data: { user } } = await supabaseBrowser().auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get file info first
      const { data: file, error: fetchError } = await supabaseBrowser()
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fetchError) throw fetchError

      // Delete from storage
      const { error: storageError } = await supabaseBrowser().storage
        .from('documents')
        .remove([file.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabaseBrowser()
        .from('files')
        .delete()
        .eq('id', fileId)

      if (dbError) throw dbError

      // Log activity
      await logFileActivity(fileId, 'delete', {
        file_name: file.original_name
      })

      showNotification(`🗑️ File deleted: ${file.original_name}`)
    } catch (error) {
      console.error('Delete error:', error)
      showNotification(`❌ Delete failed: ${(error as Error).message}`)
      throw error
    }
  }, [])

  // Download file
  const downloadFile = useCallback(async (fileId: string) => {
    try {
      const { data: file, error: fetchError } = await supabaseBrowser()
        .from('files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fetchError) throw fetchError

      const { data: downloadData, error: downloadError } = await supabaseBrowser().storage
        .from('documents')
        .download(file.file_path)

      if (downloadError) throw downloadError

      // Create download link
      const url = URL.createObjectURL(downloadData)
      const a = document.createElement('a')
      a.href = url
      a.download = file.original_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Log activity
      await logFileActivity(fileId, 'download', {
        file_name: file.original_name
      })

      showNotification(`⬇️ Downloaded: ${file.original_name}`)
    } catch (error) {
      console.error('Download error:', error)
      showNotification(`❌ Download failed: ${(error as Error).message}`)
      throw error
    }
  }, [])

  // Get file URL for preview
  const getFileUrl = useCallback(async (filePath: string) => {
    const { data } = await supabaseBrowser().storage
      .from('documents')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    return data?.signedUrl || null
  }, [])

  // Log file activity
  const logFileActivity = useCallback(async (
    fileId: string, 
    action: FileActivity['action'], 
    details: any = {}
  ) => {
    try {
      const { data: { user } } = await supabaseBrowser().auth.getUser()
      if (!user) return

      await supabaseBrowser()
        .from('file_activities')
        .insert({
          file_id: fileId,
          user_id: user.id,
          action,
          details,
          ip_address: '127.0.0.1', // Could get real IP from headers
          user_agent: navigator.userAgent
        })
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }, [])

  // Show notification (could be replaced with toast library)
  const showNotification = useCallback((message: string) => {
    // Simple notification - could be enhanced with proper toast system
    console.log('📢 File Notification:', message)
    
    // Optional: Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('ITM Trading - File Update', {
        body: message,
        icon: '/favicon.ico'
      })
    }
  }, [])

  return {
    files,
    activities,
    loading,
    uploadProgress,
    loadFiles,
    uploadFile,
    deleteFile,
    downloadFile,
    getFileUrl,
    logFileActivity
  }
}

