// app/lib/youtube.ts
import { google } from 'googleapis';
import { db } from './db';
import axios from 'axios';
import { S3Client, GetObjectCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from 'stream';

// Initialize the S3 client outside of the function
const s3Client = new S3Client({ 
  region: "us-east-1",
});

interface UploadVideoParams {
  accountId: string;
  title: string;
  description: string;
  s3Url: string;
  privacyStatus?: string;
}

// Add this function to check S3 client validity
async function checkS3ClientValidity(): Promise<boolean> {
  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    console.log("S3 client is valid. Available buckets:", response.Buckets?.map(b => b.Name).join(', '));
    return true;
  } catch (error) {
    console.error("Error validating S3 client:", error);
    return false;
  }
}

export async function uploadVideo({
  accountId,
  title,
  description,
  s3Url,
  privacyStatus = 'unlisted'
}: UploadVideoParams): Promise<any> {
  // Check S3 client validity
  const isS3ClientValid = await checkS3ClientValidity();
  if (!isS3ClientValid) {
    throw new Error('S3 client is not valid. Please check your AWS configuration.');
  }

  // Find the account using the accountId
  const account = await db.account.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    throw new Error('No account found with the provided accountId');
  }

  const { accessToken, refreshToken } = account;

  if (!accessToken || !refreshToken) {
    throw new Error('Access token or refresh token is missing for this account');
  }

  const oauth2Client = new google.auth.OAuth2();
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  try {
    const { bucket, key } = parseS3Url(s3Url);
    const signedUrl = await generateSignedUrl(bucket, key);

    console.log(`Preparing to upload video from signed URL: ${signedUrl}`);

    // Create a readable stream from the S3 file
    const fileStream = (await axios.get(signedUrl, { responseType: 'stream' })).data;

    // Get the file size
    const headResponse = await axios.head(signedUrl);
    const fileSize = parseInt(headResponse.headers['content-length'], 10);

    // Set up the video resource
    const videoResource = {
      snippet: {
        title,
        description,
      },
      status: {
        privacyStatus,
      },
    };

    // Set up resumable upload
    const resumableUpload = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: videoResource,
      media: {
        mimeType: 'video/*', // Adjust based on your video type
        body: fileStream,
      },
    }, {
      // Use resumable upload
      onUploadProgress: (evt) => {
        const progress = (evt.bytesRead / fileSize) * 100;
        console.log(`Upload progress: ${progress.toFixed(2)}%`);
      },
    });

    console.log('Full YouTube API response:', JSON.stringify(resumableUpload.data, null, 2));

    if (resumableUpload.data.id) {
      console.log('Video uploaded successfully. Video ID:', resumableUpload.data.id);
      return resumableUpload.data;
    } else {
      throw new Error('Video ID not returned');
    }
  } catch (error) {
    console.error('Error in uploadVideo:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw new Error(`Failed to upload video: ${error.message}`);
  }
}

function parseS3Url(url: string): { bucket: string; key: string } {
  const parsedUrl = new URL(url);
  let bucket = '';
  let key = '';

  // Check if the URL is virtual-hosted-style
  const hostnameParts = parsedUrl.hostname.split('.');
  if (hostnameParts[1] === 's3') {
    // Virtual-hosted-style URL: bucket is in the hostname
    bucket = hostnameParts[0];
    key = parsedUrl.pathname.slice(1); // Remove the leading '/'
  } else {
    // Path-style URL: bucket is in the path
    const pathParts = parsedUrl.pathname.split('/');
    bucket = pathParts[1];
    key = pathParts.slice(2).join('/');
  }

  return { bucket, key };
}


async function generateSignedUrl(bucket: string, key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
  return signedUrl;
  //return 'https://remotionlambda-useast1-gwr1cy06ki.s3.amazonaws.com/renders/0xqqkakv2r/out.mp4?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECoaCXVzLWVhc3QtMSJHMEUCIA0QDFL3Ib1kOjpLxOA1lG97eiJH1KbGY%2Bc3ZobwJhstAiEAkZ4Fzm9kk1MUSRszrPtu1lvDP%2BqkQ998Ix0WNiFSotUq1AMIk%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgwxMzU4MDg5NDczMTEiDGQR5d7nD8nuKv03BiqoA%2BJtXttt5js6vqiKimZHb60yNs4BLGldsXyHeJGQlEdMyufnQjG27K4fU2Z1%2FVIjzM150HJElkR00pF%2BFLTj99JzbbXX%2BRgak8hwfsc%2FalO%2FN8jf0ZnphG%2B0B1SjnPEVooJLIhh%2BNS1F%2BznPwpj4lD6Hn1JYSnGV%2BzQmxa4HbWUW8nnZNA0ev0fBun7ldXmS2eNuu4CDNyDKFolEJDvP6lO3VZjlLmuLZ%2BO0C7wZdGyuWe2XyUPwFEKx2uHTnCDbBDX0A6KI2Q3LOsV21de08Y0r5EPvw%2BUnY%2Fk0wvjmLinqleR6UNEoCgAGZLSkTgG1DsoHM5DOj7waYcZbz1EKYu0ghIuMgXaC08wOWhEqm3qBhBt1BsTDUnxgjL69N3IGijPYMOX8KunzzgA93ZxMEL4VR93xJAwjMbm%2FWFv6FfsWIXTMT8XtbehqHeV1rWdjSinM5wWqKpBuLBF1Y9r9CvhjIoWE8UxRJr7UhB7Ag88apu3mfIXDPCA51e0gAIENTzIJ5yPn%2BS%2BOK%2Fq%2F1mJTysfzm7iD5zmRxfCrIEgPXwv0JmcjKuo%2Bl94w5pXauAY65AK2HW6hxCkv7WtwXi7P6BvLbLxMoSfNMW5I9tlN%2BoG87MVgW%2FN70xxVME5yvLfpiOGPggYeEXRntOGlCR2S1RnHWfw%2Bo%2BNy198OsE7CgKya%2FbU22aJOGBkmPcRHV59ymcgv5cOjPc9TWJBGGQ%2FbvSPdHgjnZR9Biq4X9%2Bxh%2FCulwJA4fP0XxeGyy2HrE6LmFsv5lnRiUc5%2FpvHeIsF%2BaajgCCIM%2BimwqA2qf6vvSFB1U1L5y2N3ZISatARb2tGS76Zq4U7zmapaE9DnchuUSxvXrCTojVFcT2ECb9CDZUelTuvG7RdTbxxsUo0Dxfp4AekErBCBc64VcDsEENQfGiTC%2B%2FJVPcFNOE85jR5oKcmuUVJJwTA2lGg3NcMOkvZKWJFX5YPGFaV8uX8aMG2YE%2FZcP4mYPWv7QuuoJ3EFIf0r2WiiXwYB6yMc%2Ffnhn%2BLsKXoIEFa2lLaG3J7vUgXoWoNLDwPlvw%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAR7HWYCRX5WIHOJ6R%2F20241021%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20241021T173257Z&X-Amz-Expires=10800&X-Amz-SignedHeaders=host&X-Amz-Signature=d71081d01ae0eed67a42652f49719da5b02589dbc81999fd6d056a95472e09fd'

}



// Add a new function to check OAuth2 configuration
export async function checkOAuth2Config(accessToken: string): Promise<void> {
  const oauth2Client = new google.auth.OAuth2();
  
  try {
    const tokenInfo = await oauth2Client.getTokenInfo(accessToken);
    console.log('Token info:', tokenInfo);
  } catch (error) {
    console.error('Error checking OAuth2 configuration:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
  }
}
