'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TestResult {
  success: boolean;
  searchTerm?: string;
  videoUrl?: string;
  error?: string;
}

export function PixabayTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testPixabay = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-pixabay');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test Pixabay'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Pixabay API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testPixabay}
          disabled={isLoading}
        >
          {isLoading ? 'Testing...' : 'Test Pixabay Video Search'}
        </Button>

        {result && (
          <div className="mt-4">
            {result.success ? (
              <div className="space-y-2">
                <p>✅ Success!</p>
                <p>Search term: <span className="font-medium">{result.searchTerm}</span></p>
                <p>Video URL: <a href={result.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{result.videoUrl}</a></p>
                {result.videoUrl && (
                  <video 
                    src={result.videoUrl} 
                    controls 
                    className="mt-4 w-full max-w-lg rounded-lg"
                  />
                )}
              </div>
            ) : (
              <div className="text-red-500">
                ❌ Error: {result.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 