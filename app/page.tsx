"use client";
import Image from "next/image";
import { useSession } from "next-auth/react";
// import TestBoard from "@/components/Test";
import dynamic from 'next/dynamic';

const TestBoard = dynamic(() => import('../components/BoardCanvas'), { ssr: false });

export default function Home() {

    return (
    <div>
    </div>
  );
}
