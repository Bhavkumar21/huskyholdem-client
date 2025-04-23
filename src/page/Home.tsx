import React from "react";
import { useAuth } from "../context/AuthContext";


const Home: React.FC = () => {
    const { user } = useAuth();
    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <div>{user?.username || "not login"}</div>
        <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page</h1>
        <p className="text-lg">This is a simple home page using React and Tailwind CSS.</p>
        </div>
    );
}

export default Home;