"use client"

import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import NewBoard from "./NewBoard"
import { useRouter } from 'next/navigation';
import { getBoards } from "@/app/actions/board"

type Board = {
  id: string
  name: string | null
  description: string | null
  createdAt: Date
  userId: string
}

export default function BoardComponent({defaultOpen = true}) {
  const [boards, setBoards] = useState<Board[]>([])
  const [open, setOpen] = useState(true)
  const router = useRouter()

  const fetchBoards = async () => {
    const data = await getBoards()
    setBoards(data)
  }

  useEffect(() => {
    setOpen(defaultOpen)
    fetchBoards()
  }, [])

  const handleNewBoard = async (title: string) => {
    await fetchBoards()
  }

  const handleBoardClick = (id : string) => {
    window.location.href = `/board/${id}`;
    setOpen(false)
  }

  return (
    
    <div>
      <Sheet open={open} onOpenChange={setOpen}>
        {!open && (
          <div className="fixed top-24 left-0 z-100">
            <SheetTrigger className="flex items-center gap-2 px-1 py-2 mt-1 rounded-r-full bg-gray-200 hover:bg-gray-300 transition">
              <ChevronRight className="w-7 h-7 opacity-75" />
            </SheetTrigger>
          </div>
        )}
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Your Boards</SheetTitle>
            <SheetDescription>
              <NewBoard onBoardCreated={handleNewBoard} />
              <div className="flex flex-col gap-2 mt-4">
                {boards.map((board) => (
                <div className="mt-4 overflow-y-auto h-[calc(100vh-160px)] pr-2">
                    {boards.map((board) => (
                    <div
                        key={board.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                        onClick={()=>handleBoardClick(board.id)}
                    >
                        {/* <div className="w-2 h-2 rounded-full bg-primary" /> */}
                        <p className="text-lg font-medium truncate">{board.name || "Untitled Board"}</p>
                    </div>
                    ))}
                  </div>
                ))}
              </div>
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  )
}
