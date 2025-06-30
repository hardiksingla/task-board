"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PostsComponent from "./Posts";

export default function NavbarComponent() {
    const { data: session, status } = useSession();
    const router = useRouter();

    return (
        <div className="bg-white shadow-md px-6 py-3 flex justify-between items-center sticky top-0 z-50 ">
            {/* Logo or Title */}
            <div className="text-xl font-bold text-blue-600">
                InsightBoard
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
                {status === "loading" && (
                    <p className="text-gray-500">Checking auth...</p>
                )}

                {status === "unauthenticated" && (
                    <button
                        onClick={() => router.push("/api/auth/signin")}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        Sign in
                    </button>
                )}

                {status === "authenticated" && (
                    <>
                        {/* User Avatar & Welcome */}
                        <div className="flex items-center gap-2">
                            {session.user?.image && (
                                <Image
                                    src={session.user.image}
                                    alt="Profile"
                                    width={32}
                                    height={32}
                                    className="rounded-full"
                                />
                            )}
                            <p className="text-gray-700 font-medium">
                                Hi, {session.user?.name?.split(" ")[0]}
                            </p>
                        </div>

                        {/* Posts Button */}
                        <PostsComponent />

                        {/* Sign Out Button */}
                        <button
                            onClick={() => router.push("/api/auth/signout")}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                            Sign out
                        </button>
                    </>
                )}
                {/* {JSON.stringify(session)} */}
            </div>
        </div>
    );
}
