// app/components/UploadVideo.tsx
'use client';

import { useState, FormEvent, ChangeEvent } from 'react';

export default function UploadVideo() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file');
      return;
    }
    // Implement file upload to your server
    // Then call your API to upload to YouTube
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" onChange={handleFileChange} />
      <input 
        type="text" 
        value={title} 
        onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} 
        placeholder="Title" 
      />
      <textarea 
        value={description} 
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} 
        placeholder="Description" 
      />
      <button type="submit">Upload to YouTube</button>
    </form>
  );
}