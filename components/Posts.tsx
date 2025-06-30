"use client";
import { getPosts } from "@/app/actions/post";
import PostComponent from "./Post";

import { useState,useEffect } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import PostPopup from "./PostPopup";


export default function PostsComponent() {
  const [posts, setPosts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [postOpen, setPostOpen] = useState(false);

    const fetchPosts = async () => {
      const data = await getPosts("")
      setPosts(data)
    }

    const handlePostClick = (id: string) => {
      // Handle post click logic here
      console.log("Post clicked:", id);
      setPost(posts.find((post) => post.id === id));
      console.log("Post found:", posts.find((post) => post.id === id));
      setPostOpen(true);
      setOpen(false);
    };
  
    useEffect(() => {
      fetchPosts()
    }, [open])

  if (!posts || posts.length === 0) {
    return <div>No New Posts Found</div>;
  }
  return(
    <>
    <Drawer open={open} onOpenChange={setOpen}>
    <DrawerTrigger>
      <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
          New Posts
      </button>
    </DrawerTrigger>
    <DrawerContent>
      <div className="flex flex-row overflow-x-auto">
        {posts.map((post) => (
          <PostComponent
          key={post.id}
          title={post.title || ""}
          image={post.image || ""}
          postId={post.id}
          content={post.content || "lorem ipsum"}
          postClick={handlePostClick}
          />
        ))}
      </div>  
    </DrawerContent>
  </Drawer>
    {post && postOpen && (
      <PostPopup onClose={()=>setPostOpen(false)} post={post}/>
      )}
    </>

  )
}