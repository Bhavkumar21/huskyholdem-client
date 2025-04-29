import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HeroSection.css"; // Assuming you have a CSS file for styles
import CyberPunkButton from "./CyberPunkButton";

const FINAL_DEADLINE = new Date("2025-05-31T23:59:59Z");

const HeroSection: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = FINAL_DEADLINE.getTime() - now;

      if (diff <= 0) {
        setTimeLeft("Submissions closed.");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="text-center bg-black py-16 w-full h-[80vh] flex flex-col items-center justify-center overflow-clip">
    <div className="environment"></div>
    <h1 className="hero glitch layers" data-text="冷血不够，要冷码"><span>HUSKY♠ HOLD'EM</span></h1>
    <p className="hero-countdown">Final submission in: {timeLeft}</p>
    <p>A University of Washington POKERBOTS EXTRAVAGANZA</p>
    <CyberPunkButton text="REGISTER" onClick={() => navigate("/register")} className="mt-4"/>
    </section>
  );
};

export default HeroSection;
