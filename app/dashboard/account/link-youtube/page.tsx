import YouTubeLoginButton from "@/components/dashboard/account/link-youtube/YouTubeLoginButton";

export default function ConnectYouTubePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Connect Your YouTube Account</h1>
      <p className="mb-6 text-gray-600 text-center max-w-md">
        Click the button below to connect your YouTube account. This will allow you to upload videos directly from our app.
      </p>
      <YouTubeLoginButton />
      <p className="mt-4 text-sm text-gray-500">
        You can connect multiple YouTube accounts if needed.
      </p>
    </div>
  );
}