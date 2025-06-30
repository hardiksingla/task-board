"use server"

import prisma  from "@/db"

export async function signup(email: string, name: string, password: string) {
    try{
        await prisma.user.create({
            data: {
                email: email,
                name: name,
                password: password
            }
        })
    }
    catch (error) {
        console.log("Error in creating user", error)
        return {
            error: "User already exists",
            status: 400
        }
    }

    return {
        message: "User created successfully",
        status: 200
    }

}   