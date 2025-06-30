"use client";

import { useRef } from "react";

type PostsComponentProps = {
  title: string;
  image: string;
  postId: string;
  content: string;
  postClick: (postId: string) => void;
};

export default function PostsComponent({
  title,
  image,
  postId,
  content,
  postClick
}: PostsComponentProps) {
  const dragged = useRef(false);

  return (
    <div
      className="border border-gray-300 rounded-lg p-4 max-w-sm shadow-md min-w-80 my-4 mx-2"
      onMouseDown={() => (dragged.current = false)}
      onMouseMove={() => (dragged.current = true)}
      onClick={() => {
        if (!dragged.current) postClick(postId);
      }}
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="w-full h-44 object-cover rounded-md mb-3"
        />
      )}
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
    </div>
  );
}
