import React from "react";
import HeroSection from "../components/HeroSection";
import SponsorSection from "../components/SponsorSection";
import TimelineSection from "../components/TimelineSection";

const Home: React.FC = () => {

    return (
        <div>
        <HeroSection />

        <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page</h1>
            <p className="text-lg">This is a simple home page using React and Tailwind CSS.</p>
        </div>
        <TimelineSection />
        <SponsorSection />
        </div>
    );
}

export default Home;