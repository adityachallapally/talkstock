import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface UploadVideoPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function UploadVideoPopup({ isOpen, onClose }: UploadVideoPopupProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      router.push(`/dashboard/videos/processing/${data.id}`)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}