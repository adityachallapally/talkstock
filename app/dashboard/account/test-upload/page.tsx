'use client'

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function TestUploadPage() {
  const { data: session } = useSession();
  const [uploadStatus, setUploadStatus] = useState('');

  const handleUpload = async () => {
    if (!session?.user?.email) {
      setUploadStatus('Error: User not authenticated.');
      return;
    }

    setUploadStatus('Uploading...');

    try {
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: session.user.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload video');
      }

      const { videoId } = await response.json();
      setUploadStatus(`Video uploaded successfully. Video ID: ${videoId}`);
    } catch (error) {
      setUploadStatus(`Error uploading video: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Test YouTube Video Upload</h1>
      <button
        onClick={handleUpload}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Upload Test Video
      </button>
      {uploadStatus && (
        <p className="mt-4 text-gray-700">{uploadStatus}</p>
      )}
    </div>
  );
}