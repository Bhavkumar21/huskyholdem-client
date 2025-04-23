import React, { useState } from "react";
import Sketch from "react-p5";
import p5Types from "p5";
import { Glitch } from "./Glight";

interface GlitchSketchProps {
  imageSrc: string;
  width: number;
  height: number;
}

const GlitchImage: React.FC<GlitchSketchProps> = ({ imageSrc, width, height }) => {
  const [glitch, setGlitch] = useState<Glitch | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const preload = (p5: p5Types) => {
    p5.loadImage(imageSrc, (img: any) => {
      const newGlitch = new Glitch(img, p5);
      setGlitch(newGlitch);
      setIsLoaded(true);
    });
  };

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(width, height).parent(canvasParentRef);
    p5.background(0);
  };

  const draw = (p5: p5Types) => {
    p5.clear(0, 0, 0, 0);
    p5.background(0);
    if (isLoaded && glitch) {
      glitch.show();
    }
  };

  return <Sketch preload={preload} setup={setup} draw={draw} />;
};

export default GlitchImage;
