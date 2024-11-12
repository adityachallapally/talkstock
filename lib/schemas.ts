import { z } from "zod";

export const VoiceEnum = z.enum(["Echo", "Alloy", "Onyx", "Fable"]);
export const DurationEnum = z.enum(["30-60", "60-90"]);
export const FrequencyEnum = z.enum(["daily", "weekly", "biweekly", "monthly"]);
export const LanguageEnum = z.enum(["en", "es", "fr", "de", "it"]);

export const VideoSchema = z.object({
  topic: z.string().min(1, "Topic is required").default('General Interest'),
  voice: VoiceEnum.default('Onyx'),
  language: LanguageEnum.default('en'),
  duration: DurationEnum.default('30-60'),
  isSeries: z.boolean().default(false),
});

export type VideoSchemaType = z.infer<typeof VideoSchema>;

export const SeriesSchema = VideoSchema.extend({
  frequency: FrequencyEnum.default('weekly'),
  destination: z.string().email("Invalid email address").default('default@example.com'),
});

export type SeriesSchemaType = z.infer<typeof SeriesSchema>;

export const VideoDataSchema = z.object({
  id: z.number(),
  script: z.string(),
  audioSrc: z.string(),
  imageUrls: z.array(z.string()),
  transcriptionSrc: z.string(),
  title: z.string(),
  caption: z.string(),
  videoLink: z.string(),
  seriesId: z.number().nullable(),
  createdAt: z.date(),
  postedAt: z.date().nullable(),
  postStatus: z.string(),
  durationInFrames: z.number().nullable(),
});

export type VideoData = z.infer<typeof VideoDataSchema>;