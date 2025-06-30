import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import prisma from '@/db';
import { YoutubeTranscript } from 'youtube-transcript';

const YOUTUBE_API_KEY = process.env.GOOGLE_API_KEY;

async function fetchTranscript(url: string) {
    const transcript = await YoutubeTranscript.fetchTranscript(url)
    let text = ""
    transcript.forEach((item) => {
        text += item.text + " "
    })
    console.log(text);
    return text;
}

function extractYoutubeVideoId(url: string): { id: string , type : "video" | "playlist" | "shorts" | "error"} {
    const parsedUrl = new URL(url);
    
    if (parsedUrl.hostname === 'www.youtube.com' || parsedUrl.hostname === 'youtube.com') {
        if (parsedUrl.pathname === '/watch') {
            return {
                id: parsedUrl.searchParams.get('v') || "",
                type: "video"
            };
        } else if (parsedUrl.pathname === '/playlist') {
            return {
                id: parsedUrl.searchParams.get('list') || "",
                type: "playlist"
            };
        } else if (parsedUrl.pathname.split('/')[1] === 'shorts') {
            return {
                id: parsedUrl.pathname.split('/')[2] || "",
                type: "shorts"
            };
        }
    } else if (parsedUrl.hostname === 'youtu.be') {
        if (parsedUrl.pathname.split('/')[1] === 'shorts') {
            return {
                id: parsedUrl.pathname.split('/')[2] || "",
                type: "shorts"
            };
        } else {
            return {
                id: parsedUrl.pathname.split('/')[1] || "",
                type: "video"
            };
        }
    }
    return {
        id: "",
        type: "error"
    }
}

async function saveYoutubePost(id: string, type: "video" | "playlist" | "shorts", email: string) {
    console.log("Saving YouTube post with ID:", id, "Type:", type, "Email:", email);
    try {
        const requestBody = (`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${YOUTUBE_API_KEY}`)
        const videoRes = await axios.get(requestBody);
        const videoData = videoRes.data.items[0]?.snippet;
        console.log(videoData);
        const transcript = await fetchTranscript(id);

        const existingPost = await prisma.post.findFirst({
            where: {
                user: { email },
                createdAt: {
                    gte: new Date(Date.now() - 10 * 1000), // 10 seconds ago
                },
            },
        });
        console.log("Checking for existing post:", existingPost);
        if (existingPost) {
            console.log('A post was already created for this user in the last 10 seconds.');
            throw new Error('A post was already created for this user in the last 10 seconds.');
        }
        console.log("Creating new post for user:", email);
        const post = await prisma.post.create({
            data: {
                title: videoData.title,
                description: videoData.description,
                image: videoData.thumbnails.standard.url,
                transcript: transcript,
                url: `https://www.youtube.com/watch?v=${id}`,
                user: {
                    connect: {
                        email: email,
                    },
                }
            }
        });
        console.log("Post created successfully:", post);        
        
    } catch (error) {
        console.error('Error fetching video data:', error);
        return {
            status: 500,
            message: 'Error fetching video data'
        };
    }
}


export async function POST(req: NextRequest) {
    const body = await req.json();
    const url = body.url;
    const email = body.email;

    console.log("Received URL:", url);
    console.log("Received Email:", email);

    const parsedUrl = new URL(url);
    let data : { id: string , type : "video" | "playlist" | "shorts" | "error"} = {id: "",type: "error"};
    console.log("Parsed URL:", parsedUrl);
    if(parsedUrl.hostname == "www.youtube.com" || parsedUrl.hostname == "youtube.com" || parsedUrl.hostname == "youtu.be") {
        console.log("Valid YouTube URL detected");
        data = extractYoutubeVideoId(url);
        if(data.type == "error") {
            return NextResponse.json({
                status: 400,
                message: "Invalid Youtube URL"
            });
        }
        console.log("Extracted Video ID:", data.id);
        saveYoutubePost(data.id, data.type, email);
    }

    return NextResponse.json({
        status: 200,
        id: data.id,
        type: data.type
    });
}