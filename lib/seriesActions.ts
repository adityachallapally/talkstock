import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getSeries(accountId: string) {
  try {
    const series = await prisma.series.findMany({
      where: { accountId },
      include: { videos: true },
    });
    return series;
  } catch (error) {
    console.error('Error fetching series:', error);
    throw error;
  }
}

export async function createSeries(
  accountId: string,
  topic: string,
  voice: string,
  frequency: string
) {
  try {
    const newSeries = await prisma.series.create({
      data: {
        accountId,
        topic,
        voice,
        frequency,
      },
    });
    return newSeries;
  } catch (error) {
    console.error('Error creating series:', error);
    throw error;
  }
}

// The updateSeries function doesn't use accountId, so it remains unchanged
export async function updateSeries(
  id: number,
  data: {
    topic?: string;
    voice?: string;
    frequency?: string;
    nextPostDate?: Date | null;
    lastPostedDate?: Date | null;
  }
) {
  try {
    const updatedSeries = await prisma.series.update({
      where: { id },
      data,
    });
    return updatedSeries;
  } catch (error) {
    console.error('Error updating series:', error);
    throw error;
  }
}

// getAllSeries doesn't use accountId, so it remains unchanged
export async function getAllSeries() {
  try {
    const allSeries = await prisma.series.findMany({
      include: { videos: true },
    });
    return allSeries;
  } catch (error) {
    console.error('Error fetching all series:', error);
    throw error;
  }
}