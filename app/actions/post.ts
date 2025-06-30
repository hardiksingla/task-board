"use server"

import prisma from "@/db";
import { getServerSession } from "next-auth"
import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function getPosts(boardId : string) {
    console.log("board" , boardId)
    const session = await getServerSession();
    if (!session) {
        console.log("No session found");
        return [];
    }
    if (!session.user || !session.user.email) {
        console.log("No user or email found in session");
        return [];
    }
    console.log("Session found", session.user.email);
    let posts : any = [];
    if (!boardId) {
        posts = await prisma.post.findMany({
            where: {
                boardId: null,
                user: {
                    email: session.user.email,
                },
            },
        });
    }
    else{
        posts = await prisma.post.findMany({
        where: {
            user: {
            email: session.user.email,
            },
            boardId: boardId, // e.g. "abcd-1234-xyz"
        },
        });
    }

    // console.log(posts);
    return posts || [];
}

export async function generateContent( prompt : string, id : string ) {
    const session = await getServerSession();
    if (!session) {
        console.log("No session found");
        return [];
    }
    if (!session.user || !session.user.email) {
        console.log("No user or email found in session");
        return [];
    }
    console.log("Session found", session.user.email);

    const post = await prisma.post.findUnique({
        where: {
            id: id,
        },
    });
    if (!post) {
        console.log("Post not found");
        return false;
    }
    const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `I am giving you the transcript description and title of a youtube video you job is to ${prompt} also do not add any * or any other markdown symbols the details are : ${post.transcript} \n ${post.description} \n ${post.title}\n ${prompt}`,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(text ?? "No text generated");

    if (text) {
        await prisma.post.update({
            where: {
                id: id,
            },
            data: {
                content: text,
            },
        });
    }

    return text;   
}

export async function addToBoard(id : string, boardId : string) {
    const session = await getServerSession();
    if (!session) {
        console.log("No session found");
        return [];
    }
    if (!session.user || !session.user.email) {
        console.log("No user or email found in session");
        return [];
    }
    console.log("Session found", session.user.email);
    const post = await prisma.post.findUnique({
        where: {
            id: id,
        },
    });
    if (!post) {
        console.log("Post not found");
        return false;
    }
    await prisma.board.update({
        where: {
            id: boardId,
        },
        data: {
            posts: {
                connect: {
                    id: post.id,
                },
            },
        },
    });
    return true;
}

export async function getPost(id : string){
    const session = await getServerSession();
    if (!session) {
        console.log("No session found");
        return [];
    }
    if (!session.user || !session.user.email) {
        console.log("No user or email found in session");
        return [];
    }
    console.log("Session found", session.user.email);
    const post = await prisma.post.findFirst({
        where: {
            id: id,
            user: {
                email: session.user.email,
            },
        },
    });
    if (!post) {
        console.log("Post not found");
        return false;
    }
    return post;
} 

// Add this to your post actions file
export async function updatePostPosition(postId: string, x: number, y: number) {
  const session = await getServerSession();
  if (!session) {
    console.log("No session found");
    return false;
  }
  if (!session.user || !session.user.email) {
    console.log("No user or email found in session");
    return false;
  }

  if (!postId) {
    console.log("No postId provided");
    return false;
  }

  try {
    // First verify the post exists and belongs to the user
    const existingPost = await prisma.post.findFirst({
      where: {
        id: postId,
        user: {
          email: session.user.email,
        },
      },
    });

    if (!existingPost) {
      console.log("Post not found or doesn't belong to user");
      return false;
    }

    const result = await prisma.post.update({
      where: { id: postId },
      data: { x, y }
    });
    return result;
  } catch (error) {
    console.error('Error updating post position:', error);
    return false;
  }
}