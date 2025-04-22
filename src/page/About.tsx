import React from "react";

const About: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-4xl font-bold mb-4">About Us</h1>
            <p className="text-lg">This is a simple about page using React and Tailwind CSS.</p>
        </div>
    );
}

export default About;