// app/dashboard/account/link-youtube/youtube-success/page.tsx
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function YouTubeSuccess() {
  const session = await auth();
  
  if (!session || !session.user) {
    return <div>Not authenticated</div>;
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email! },
    include: {
      accounts: {
        where: { platform: 'YouTube' },
        include: {
          channels: true
        }
      }
    }
  });

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div>
      <h1>YouTube Account(s) Linked Successfully!</h1>
      {user.accounts.map((account) => (
        <div key={account.id}>
          <h2>YouTube Account</h2>
          <h3>Linked Channels:</h3>
          {account.channels.map((channel) => (
            <div key={channel.id}>
              {channel.thumbnail && <img src={channel.thumbnail} alt={channel.title} />}
              <p>Channel Name: {channel.title}</p>
              <p>Channel ID: {channel.channelId}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}