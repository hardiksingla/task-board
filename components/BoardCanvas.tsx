'use client';

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { motion } from 'framer-motion';
import { use, useEffect, useState } from 'react';
import { getPost, getPosts, updatePostPosition } from '@/app/actions/post';
import PostsComponent from './Post';
import PostPopup from './PostPopup';


export default function Board({boardId} : { boardId: string }) {
  const [cards, setCards] = useState<any[]>([]);
  const [postData , setPostData] = useState<any[]>([]);
  const [disablePanning, setDisablePanning] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [postOpen, setPostOpen] = useState(false);

    async function postClick(postId: string){
        console.log("Post clicked:", postId);
        const post = await getPost(postId);
        if (post) {
            setPost(post);
        }
        setPostOpen(true);
    };

    const handleDragEnd = async (postId: string, x: number, y: number) => {
        try {
            await updatePostPosition(postId, x, y);
            console.log(`Updated position for post ${postId}: x=${x}, y=${y}`);
        } catch (error) {
            console.error('Failed to update post position:', error);
        }
    };

    useEffect(() => {
    const fetchPosts = async () => {
      console.log("Fetching posts for boardId:", boardId);  
      const res = await getPosts(boardId);
        if (res) {
        setPostData(res);
            const posts = res.map((post: any, index: number) => ({
            id: `card-${index}`,
            postId: post.id,
            content: (
            <PostsComponent
                title={post.title}
                image={post.image}
                postId={post.id}
                content={post.content}
                postClick={postClick}
            />
            ),
            // Use stored position or default position
            x: post.x ?? (450 + index * 300),
            y: post.y ?? 150,
        }));
        setCards(posts);
        } else {
        console.error("Failed to fetch posts");
        }
    };
    fetchPosts();
    }, []);


  return (
    <div className="w-screen h-[90vh] bg-gray-100 overflow-hidden">
      <TransformWrapper
        limitToBounds={false}
        minScale={0.1}
        maxScale={10}
        initialScale={1}
        disabled={disablePanning}
        centerOnInit={true}
        doubleClick={{ disabled: true }}
        wheel={{ step: 10 }}
      >
        <TransformComponent wrapperClass="w-full h-full">
          <div className="relative w-[2000px] h-[2000px] ">
            {cards.map((card) => (
              <motion.div
                key={card.id}
                id={card.id}
                drag
                dragMomentum={false}
                onDragStart={(event) => {
                  event.stopPropagation(); // ✅ Prevent zoom-pan from triggering
                  setDisablePanning(true);
                }}
                onPointerDown={(event) => {
                  event.stopPropagation(); // ✅ Also important: stops pan initiation
                }}
                onDragEnd={(event, info) => {
                  event.stopPropagation(); // ✅ Optional, for safety
                  setDisablePanning(false);
                  const newX = card.x + info.offset.x;
                  const newY = card.y + info.offset.y;

                  setCards(prev => prev.map(c =>
                    c.id === card.id ? { ...c, x: newX, y: newY } : c
                  ));
                  console.log(`Card ${card.postId} moved to x: ${newX}, y: ${newY}`);
                  handleDragEnd(card.postId, newX, newY);
                }}
                initial={{ x: card.x, y: card.y }}
                className="absolute cursor-move"
              >
                {card.content}
              </motion.div>

            ))}
          </div>
        </TransformComponent>
      </TransformWrapper>
      {post && postOpen && (
            <PostPopup onClose={()=>setPostOpen(false)} post={post}/>
        )}
    </div>
  );
}