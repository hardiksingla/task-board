"use client"

import { useRouter } from 'next/navigation';

import { useState } from "react";
import { signup } from "@/app/actions/user";
import { signIn } from 'next-auth/react';

export function SignupComponent() {
    const [Name, setName] = useState("");
    const [Email, setEmail] = useState("");
    const [Password, setPassword] = useState("");
    const [Error, setError] = useState(false);
    const router = useRouter();

    async function handler(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        const res = await signup(Email, Name, Password);
        if (res.status === 200) {
            console.log("User created successfully");
            const res = await signIn('credentials', {
                email: Email,
                password: Password,
                redirect: false,
            });
            router.push("/");
        }
        else {
            setError(true);
            console.log("User already exists");
        }
        console.log("Sign in clicked");
    }

    function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
        setName(event.target.value);
    }
    function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
        setEmail(event.target.value);
    }
    function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
        setPassword(event.target.value);
    }

    return (
        <div className="h-screen flex justify-center flex-col">
            <div className="flex justify-center">
                <div className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100">
                    <div>
                        <div className="px-10 justify-center flex items-center">
                            <div className="text-3xl font-extrabold">
                                Sign up
                            </div>
                        </div>
                        {Error && 
                              <div className="flex items-center gap-3 border border-red-300 bg-red-50 text-red-800 text-sm rounded-lg p-4 mt-4 shadow-sm">
                                <svg
                                className="w-5 h-5 text-red-500 shrink-0"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.054 0 1.918-.816 1.995-1.85L21 18V6c0-1.054-.816-1.918-1.85-1.995L18 4H6c-1.054 0-1.918.816-1.995 1.85L4 6v12c0 1.054.816 1.918 1.85 1.995L6 20z" />
                                </svg>
                                <p><span className="font-semibold">Error:</span> Account creation failed. Please try again.</p>
                            </div>
                        }
                        <div className="pt-2">
                            <LabelledInput label="Name" placeholder="John Doe" onChangeFunction={handleNameChange} />
                            <LabelledInput label="Email" type="email" placeholder="john.doe@gmail.com" onChangeFunction={handleEmailChange} />
                            <LabelledInput label="Password" type="password" placeholder="123456" onChangeFunction={handlePasswordChange} />
                            <button
                                onClick={handler}
                                type="button"
                                className="mt-8 w-full text-white bg-gray-800 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
                            >
                                Sign up
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface LabelledInputType {
    label: string;
    placeholder: string;
    type?: string;
    onChangeFunction: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function LabelledInput({ label, placeholder, type, onChangeFunction }: LabelledInputType) {
    return (
        <div>
            <label className="block mb-2 text-sm text-black font-semibold pt-4">{label}</label>
            <input
                onChange={onChangeFunction}
                type={type || "text"}
                id={label.toLowerCase()}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder={placeholder}
                required
            />
        </div>
    );
}