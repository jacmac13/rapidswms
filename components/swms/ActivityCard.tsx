'use client';
import type { SwmsActivity } from '@/lib/types';
interface Props { activity: SwmsActivity; index: number; }
export function ActivityCard({ activity, index }: Props) {
  return <div>Activity {index}: {activity.task}</div>;
}
