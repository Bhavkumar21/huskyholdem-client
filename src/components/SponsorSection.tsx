import React from "react";
import "./SponsorSection.css";
import GlitchImage from "./GlightImage";

const sponsors = [
  { name: "Jane Street", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Jane_Street_Capital_Logo.svg/1280px-Jane_Street_Capital_Logo.svg.png", link: "https://www.janestreet.com" },
  { name: "QuantConnect", src: "https://algotrading101.com/learn/wp-content/uploads/2020/11/QuantConnect-Guide.png", link: "https://www.quantconnect.com" },
  { name: "Wolfram", src: "https://students.washington.edu/atcuw/img/wolfram.jpeg", link: "https://www.wolfram.com" },
  { name: "QuantInsti", src: "https://students.washington.edu/atcuw/img/qi.png", link: "https://www.quantinsti.com" },
];

const SponsorSection: React.FC = () => {
  return (
    <section className="sponsor-section">
      <h2 className="sponsor-title">OUR SPONSORS</h2>
      <p className="sponsor-contact">
        Sponsorship inquiries:{" "}
        <a href="mailto:uwfeclub@gmail.com">uwfeclub@gmail.com</a>
      </p>

      <div className="sponsor-grid">
        {sponsors.map((sponsor) => (
          <a
            key={sponsor.name}
            href={sponsor.link}
            target="_blank"
            rel="noopener noreferrer"
            className="sponsor-card"
          >
            <img src={sponsor.src} alt={sponsor.name} />
          </a>
        ))}
      </div>
      <div className="glitch-image-container min-h-[30vh] w-full flex justify-center items-center">
        <GlitchImage imageSrc="https://media.licdn.com/dms/image/v2/C4E0BAQFDyQj1pXubxQ/company-logo_200_200/company-logo_200_200/0/1630586949571?e=1750896000&v=beta&t=HFUrj5-7R8YP_08aSgebs0uVxCkYhXQZ5uhOgmO7DuM" height={300} width={800}/>
      </div>
    </section>
  );
};

export default SponsorSection;
