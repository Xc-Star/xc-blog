"use client";

import CommentBox from './CommentBox';

/** 说说评论区：紧凑排版，以说说 ID 作为页面标识。 */
export default function MomentComments({ id }: { id: string }) {
  return <CommentBox pageId={id.substring(0, 49)} compact />;
}
