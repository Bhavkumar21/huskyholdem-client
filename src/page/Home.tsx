import React from "react";
import HeroSection from "../components/HeroSection";
import SponsorSection from "../components/SponsorSection";
import TimelineSection from "../components/TimelineSection";
import PrizeSection from "../components/PrizeSection";

const Home: React.FC = () => {

    return (
        <>
        <HeroSection />
        <div className="flex min-h-[50vh]  flex-col w-full items-center justify-center text-white">
        <div className="flex w-[70vw] flex-col items-center justify-center mt-20">
        <h1 className="text-4xl font-bold mb-4">Welcome to Husky Hold`em</h1>
            <p className="text-lg text-center mt-10">In this computerized tournament, autonomous pokerbots face off in a strategic clash of algorithms and chance. A fusion of economics, computer science, and math, pushing participants to showcase interdisciplinary talents. The tournament unfolds in two intense rounds—first, a 6 player's bot battle, and then a final round where winning teams send a representative for a roundtable poker showdown. Join us at the forefront of competitive gaming, where skill meets silicon in a thrilling poker revolution.</p>
        </div>
        </div>

        <div className="flex w-full items-center justify-center mt-16 mb-16">
            <div className="w-[90vw] max-w-4xl">
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                        src="https://lu.ma/embed/event/evt-YfjMEEdENzFvGxZ/simple"
                        className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg border border-gray-600/50"
                        style={{
                            minHeight: "400px",
                            background: "rgba(0, 0, 0, 0.1)"
                        }}
                        allowFullScreen={true}
                        tabIndex={0}
                    />
                </div>
            </div>
        </div>

        <PrizeSection />
        <TimelineSection />
        <div className="flex min-h-[30vh]  flex-col w-full items-center justify-center text-white">
        <div className="flex w-[70vw] flex-col items-center justify-center mt-10">
        <h1 className="text-4xl font-bold mb-4">KEYNOTE SPEAKERS</h1>
        <p className="text-lg text-center mt-10">Coming soon!</p>
        </div>
        </div>
        <div className="flex min-h-[30vh]  flex-col w-full items-center justify-center text-white">
        <div className="flex w-[70vw] flex-col items-center justify-center mt-10">
        <h1 className="text-4xl font-bold mb-4">WORKSHOP</h1>
            <p className="text-lg text-center mt-10">Coming soon!</p>
        </div>
        </div>
        <SponsorSection />
        </>
    );
}

export default Home;