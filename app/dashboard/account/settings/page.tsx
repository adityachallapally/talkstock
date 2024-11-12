'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AccountSettings() {
  const { data: session, status } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
      });
      if (response.ok) {
        await signOut({ callbackUrl: '/' });
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };


  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Please sign in to view your account settings.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Information</h2>
        <p><strong>Name:</strong> {session?.user?.name}</p>
        <p><strong>Email:</strong> {session?.user?.email}</p>
        {/* Add more user information fields as needed */}
      </div>
      <div className="mt-8">
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Danger Zone</h2>
        <button
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>
    </div>
  );
}
