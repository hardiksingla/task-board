"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createBoard } from "@/app/actions/board"

export default function NewBoard({ onBoardCreated }: { onBoardCreated: (title: string) => void }) {
    const [newBoardTitle, setNewBoardTitle] = useState("")
    const [newBoardDescription, setNewBoardDescription] = useState("")  

  const newBoardButton = async () => {
    if(newBoardTitle.length > 1) {
        await createBoard(newBoardTitle, newBoardDescription)
        onBoardCreated(newBoardTitle)
    }
    setNewBoardDescription("")
    setNewBoardTitle("")
  }

  return (
    <div>
        <div className="flex gap-2 justify-between">
        <input
            type="text"
            placeholder="Board Name"
            onChange={(e) => setNewBoardTitle(e.target.value)}
            value={newBoardTitle}
            className="border border-gray-300 rounded-md p-2 w-full"
        />
        <Button variant="outline" onClick={newBoardButton}>
            Create Board
        </Button>
        </div>
        <textarea 
            placeholder="Description" 
            className="border border-gray-300 rounded-md p-2 w-full mt-2" 
            onChange={(e)=>setNewBoardDescription(e.target.value)}
            value={newBoardDescription}
            />
    </div>
  )
}
