// scripts/refreshAllTokens.ts

import { db } from "@/lib/db";
import { refreshYoutubeToken } from "@/lib/utils/refreshYoutubeToken";

export async function refreshAllTokens() {
  const accounts = await db.account.findMany({
    where: { platform: 'YouTube' },
  });

  for (const account of accounts) {
    try {
      await refreshYoutubeToken(account.userId);
      console.log(`Refreshed token for user ${account.userId}`);
    } catch (error) {
      console.error(`Failed to refresh token for user ${account.userId}:`, error);
    }
  }
}