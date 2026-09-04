"use client";

import { usePathname } from 'next/navigation';

import CommentBox from './CommentBox';

/** 灵境工坊评论区：pageId 可按月份等维度自定义。 */
export default function LabComments({ pageId }: { pageId?: string }) {
  const pathname = usePathname();
  return <CommentBox pageId={(pageId || pathname.replace(/\/$/, '') || '/').substring(0, 49)} />;
}
