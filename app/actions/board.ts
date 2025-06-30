"use server"

import prisma from "@/db";
import { getServerSession } from "next-auth";

export async function createBoard(name: string,description: string) {
    const session = await getServerSession();
    if (!session) {
        console.log("No session found");
        return null;
    }
    if (!session.user || !session.user.email) {
        console.log("No user or email found in session");
        return null;
    }
    console.log("Session found Board", session.user.email);
    const board = await prisma.board.create({
        data: {
            name,
            description,
            user: {
                connect: {
                    email: session.user.email,
                },
            },
        },
    });
    return board;
}

export async function getBoards() {
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
    const boards = await prisma.user.findUnique({
        where: {
            email: session.user.email,
        },
        include: {
            boards: true,
        },
    });
    console.log(boards?.boards);
    return boards?.boards || [];
}