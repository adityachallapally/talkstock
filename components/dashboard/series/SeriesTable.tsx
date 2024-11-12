// components/SeriesTable.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from 'lucide-react';

// Update this type to match your Prisma schema
type Series = {
  id: number;
  account: string;
  topic: string;
  voice: string;
  createdAt: Date;
  numberOfVideos: number;
  nextVideo: Date | null;
};

const SeriesTable = ({ series }: { series: Series[] }) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const handleEdit = (seriesId: number) => {
    console.log(`Edit series ${seriesId}`);
  };

  const handleDelete = (seriesId: number) => {
    console.log(`Delete series ${seriesId}`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Topic</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Number of Videos</TableHead>
          <TableHead>Voice</TableHead>
          <TableHead>Next Video</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {series.map((item) => (
          <TableRow
            key={item.id}
            onMouseEnter={() => setHoveredRow(item.id)}
            onMouseLeave={() => setHoveredRow(null)}
            className={hoveredRow === item.id ? 'bg-muted/50' : ''}
          >
            <TableCell className="font-medium">
              <Link href={`/series/${item.id}/edit`} className="block w-full h-full">
                {item.topic}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/series/${item.id}/edit`} className="block w-full h-full">
                {item.account}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/series/${item.id}/edit`} className="block w-full h-full">
                {item.numberOfVideos}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/series/${item.id}/edit`} className="block w-full h-full">
                {item.voice}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/series/${item.id}/edit`} className="block w-full h-full">
                {item.nextVideo ? new Date(item.nextVideo).toLocaleDateString() : 'N/A'}
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(item.id)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SeriesTable;