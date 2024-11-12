import { openai } from './scriptGeneration';
import { uploadImage } from '../utils/file';
import axios from "axios";
import FormData from "form-data";
import { ScriptChunk } from './scriptGeneration';

enum VideoLength {
  Thirty = 10,
  Sixty = 20,
  Ninety = 30
}

export type ImageSection = {
  text: string;
  imagePrompt: string;
  imageUrl: string;
};

async function generateImageDescriptions(topic: string, sections: string[]): Promise<string[]> {
  try {
    const imageSections = [];

    for (const sectionText of sections) {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a creative assistant that generates image descriptions based on script segments."
          },
          {
            role: "user",
            content: `Generate a detailed image description that matches the following topic: "${topic}" and script segment: "${sectionText}". The description should be a single sentence.`
          }
        ],
        temperature: 0.7,
      });

      imageSections.push(response.choices[0].message.content?.trim());
    }
    return imageSections;
  } catch (error) {
    console.error('Error generating image descriptions:', error);
    throw error;
  }
}

export async function generateImagesForScript(topic: string, sections: string[]): Promise<string[]> {
  // try {
  //   const imagePrompts = await generateImageDescriptions(topic, sections);
  //   const imageUrls = await createImages(imagePrompts);
  //   return { imageUrls };
  // } catch (error) {
  //   console.error('Error in generateImagesForScript:', error);
  //   return { error: 'Failed to generate images for the script' };
  // }
  return [
    'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/image-1728170567260-v8Fn1VBUkeblPxuSVGlVrBJv1Vkjcc.png',
    'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/image-1728170567122-voT64JNdVzYAZTdAhFwiyvw7m66Anz.png',
    'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/image-1728170567506-22TSVabAl3YQdOY7ixf0FAmWpr9vnm.png',
    'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/image-1728170567521-7hvANQnMYzuCh9LeUpQmO0EQfw1V84.png',
    'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/image-1728170567443-va7MgTz7knC7rKqfU0ADkP0kqI46I8.png',
    'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/image-1728170568097-DA14civY5OMZUuxrTmDSPxHs03D8t2.png',
    'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/image-1728170567998-cYc7rzGhmKWRc4RhpewasAoJOQDixp.png',
    'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/image-1728170567957-1Yuk9hI4hyxN7CtSOKwxQu7raTMZ6e.png',
    'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/image-1728170567901-9BOVTFHBedyY3hQ3uszhS4YyKBJ1eN.png',
    'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/image-1728170568281-M1HOHIpRxJFFKbsS7v5ncNztRQRCyM.png'
  ];
}

async function createImages(imagePrompts: string[]): Promise<string[]> {
  try {
    return await Promise.all(
      imagePrompts.map(async (prompt) => {
        const payload = {
          prompt: prompt,
          output_format: "webp"
        };

        const response = await axios.postForm(
          `https://api.stability.ai/v2beta/stable-image/generate/core`,
          axios.toFormData(payload, new FormData()),
          {
            validateStatus: undefined,
            responseType: "arraybuffer",
            headers: { 
              Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
              Accept: "image/*" 
            },
          }
        );

        if (response.status === 200) {
          const imageData = Buffer.from(response.data).toString('base64');
          return await uploadImage(imageData);
        } else {
          throw new Error(`${response.status}: ${response.data.toString()}`);
        }
      })
    );
  } catch (error) {
    console.error("Error creating images:", error);
    throw error;
  }
}