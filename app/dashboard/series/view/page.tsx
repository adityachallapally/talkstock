// app/dashboard/view_series/page.tsx
import SeriesTableWrapper from '@/components/dashboard/series/SeriesTableWrapper';
import { getAllSeries } from '@/lib/seriesActions';

export default async function ViewSeriesPage() {
  const seriesData = await getAllSeries();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">View Series</h1>
      <SeriesTableWrapper initialSeriesData={seriesData} />
    </div>
  );
}