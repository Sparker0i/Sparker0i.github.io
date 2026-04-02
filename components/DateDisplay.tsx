'use client';
import { useState, useEffect } from 'react';
import { formatDate, relativeTime } from '@/lib/date';

interface Props {
  dateStr: string;
  className?: string;
}

export default function DateDisplay({ dateStr, className }: Props) {
  const [display, setDisplay] = useState(formatDate(dateStr));

  useEffect(() => {
    const rel = relativeTime(dateStr);
    if (rel) setDisplay(rel);
  }, [dateStr]);

  return (
    <time dateTime={dateStr} className={className}>
      {display}
    </time>
  );
}
