"use client";
import { use, useEffect, useRef, useState } from "react";
import { Pencil, Settings, Check, Plus } from "lucide-react";

import { addToBoard, generateContent } from "@/app/actions/post";
import { get } from "http";
import { getBoards } from "@/app/actions/board";

export default function PostPopup({ post, onClose }: { post: any; onClose: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(post.content);
    const [showPromptPopup, setShowPromptPopup] = useState(false);
    const [customPrompt, setCustomPrompt] = useState("Summarize this post in 3 bullet points.");
    const [boardOpen , setBoardOpen] = useState(false);
    const [boards, setBoards] = useState<any[]>([]);

    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log(post)
        console.log(post.boardId!=null)

        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose , post]);

    async function handleGenerateSummary() {
        const res = await generateContent(customPrompt, post.id);
        if (res) {
            setContent(res);
            setIsEditing(false);
        } else {
            console.error("Failed to generate summary");
        }
    }
    async function handleBoardSubmit(id : string) {
        // Logic to add the post to the board
        console.log("Post added to board");
        const res = await addToBoard(post.id, id);
        console.log("Response from addToBoard:", res);
        setBoardOpen(false);        
        onClose();
        if (res && id) {
            console.log("Post added to board with id:", id);
            window.location.href = `/board/${id}`;
        }
    }

    async function handleAddToBoard() {
        // Logic to add the post to the board
        console.log("Post added to board");
        const boards = await getBoards();
        if (boards) {
            setBoards(boards);
        } else {
            console.error("Failed to fetch boards");
        }
        setBoardOpen(true);
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center min-w-[80vw] z-50 backdrop-blur-sm">
            <div
                ref={popupRef}
                className="bg-white rounded-lg shadow-lg p-6 min-w-[80vw] relative flex flex-row"
            >
                {/* LEFT SIDE */}
                <div className="flex justify-between items-baseline mb-4 w-[40vw] flex-col m-4">
                    {post.image && (
                        <div className="w-96 aspect-[16/9] overflow-hidden rounded-lg">
                            <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <h2 className="text-xl font-semibold my-4">{post.title}</h2>
                    <div>
                    <button
                        onClick={onClose}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 m-3"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleAddToBoard}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 m-3"
                    >
                        {post.boardId==null ? <p>Add to Board</p> : <p>Remove from Board</p>}
                    </button>
                    </div>

                    {
                    boardOpen && (
                        <div className="fixed inset-0 flex items-center justify-center z-10 backdrop-blur-sm">
                        <div className="w-80 bg-white border rounded-lg shadow-lg p-4">
                            <h3 className="text-lg font-medium mb-2">Select a Board</h3>
                            {boards.map((board) => (
                            <div key={board.id} className="flex items-center justify-between mb-2">
                                <span>{board.name}</span>
                                
                                    {post.boardId == board.id ? (
                                    <button
                                    className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-600"
                                    >
                                        <div className="flex items-center gap-1 p-1">
                                            <Check size={16} />
                                        </div>                                    
                                    </button>
                                    ) : (
                                    <button
                                    onClick={()=>{handleBoardSubmit(board.id)}}
                                    className="px-2 py-1 bg-blue-400 text-white rounded hover:bg-blue-600"
                                    >
                                    <div className="flex items-center gap-1 p-1">
                                        <Plus size={16} />
                                    </div>
                                </button>
                                    )}
                                    
                            </div>
                            ))}
                            <div className="flex justify-center mt-4">
                                <button onClick={() => setBoardOpen(false)} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600  text-center">
                                    Cancel
                                </button>
                            </div>
                        </div>
                        </div>
                    )
                    }

                </div>

                {/* RIGHT SIDE */}
                <div className="flex flex-col gap-4 w-[40vw] m-4">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Content</span>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-gray-600 hover:text-gray-800"
                            title={isEditing ? "Stop Editing" : "Edit Content"}
                        >
                            <Pencil size={18} />
                        </button>
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        readOnly={!isEditing}
                        className={`w-full min-h-[150px] border rounded-md p-2 resize-none ${
                            isEditing ? "bg-white border-gray-300" : "bg-gray-100 border-gray-200"
                        }`}
                    />

                    <div className="flex items-center gap-4 relative">
                        <button
                            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={handleGenerateSummary}
                        >
                            Generate AI Summary
                        </button>
                        <button
                            className="p-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                            title="Customize Prompt"
                            onClick={() => setShowPromptPopup(!showPromptPopup)}
                        >
                            <Settings size={18} />
                        </button>

                        {showPromptPopup && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg z-10 p-4">
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Custom AI Prompt
                                </label>
                                <input
                                    type="text"
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        className="text-sm text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded"
                                        onClick={() => setShowPromptPopup(false)}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
