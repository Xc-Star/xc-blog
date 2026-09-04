"use client";

import { usePathname } from 'next/navigation';

import CommentBox from './CommentBox';

/** 通用评论区：以当前路径作为页面标识。 */
export default function Comments() {
  const pathname = usePathname();
  return <CommentBox pageId={(pathname.replace(/\/$/, '') || '/').substring(0, 49)} />;
}
