import { useState } from 'react';

const DefaultFooter = () => {
  const [showCitation, setShowCitation] = useState(false);
  const [copied, setCopied] = useState(false);

  const bibtexCitation = `@misc{huskyholdem2025,
  title={Husky Hold'em Bench},
  author={Kumar, Bhavesh and Nguyen, Hoang and Jin, Roger},
  year={2025},
  howpublished={\\url{https://huskyholdem.nousresearch.com}},
  note={Accessed: ${new Date().toISOString().split('T')[0]}}
}`;

  const handleCiteClick = async () => {
    setShowCitation(true);
    try {
      await navigator.clipboard.writeText(bibtexCitation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy citation:', err);
    }
  };

  const closeCitation = () => {
    setShowCitation(false);
    setCopied(false);
  };

  return (
    <>
      <footer className="w-full bg-[black] border-t border-[#444] text-white font-mono tracking-widest uppercase">
        <div className="container mx-auto py-10 flex flex-col lg:flex-row justify-between items-center lg:items-start">
          <div className="text-sm pl-4 w-full lg:w-auto mb-4 lg:mb-0">
              <div className="flex flex-col items-start">
              <div>
                <span className="text-[#559CF8]">[SYSTEM::COPYRIGHT]</span> <a target="_blank" href="https://nousresearch.com/" className="underline">Nous Research</a>
              </div>
              <div>
                <span className="text-[#559CF8]">[SYSTEM::CODE]</span> <a target="_blank" href="https://github.com/NousResearch/huskyholdem-bench" className="underline">GITHUB</a>
              </div>
              </div>
          </div>
          
          {/* Center CITE button */}
          <div className="flex items-center justify-center mb-4 lg:mb-0">
            <button 
              onClick={handleCiteClick}
              className="text-[#559CF8] border border-[#559CF8] px-4 py-2 hover:bg-[#559CF8] hover:text-black transition-colors text-lg font-bold"
            >
              CITE
            </button>
          </div>
          
          <div className="text-sm pl-4 w-full lg:w-auto">
              <div className="flex flex-col items-start">
              <div>
                <span className="text-[#FFFFFF]">[SYS::CRED]</span>
                <span className="text-[#559CF8]"> Built by [<a href="https://x.com/bha_ku21" target="_blank" className="text-[#559CF8] underline">Bhavesh</a>]</span>
              </div>
              <div>
                <span className="text-[#FFFFFF]">[SYS::CRED]</span>
                <span className="text-[#559CF8]"> Built by [<a href="https://www.kipiiler.me" target="_blank" className="text-[#559CF8] underline">KIPIILER</a>]</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Citation Modal */}
      {showCitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-black border-2 border-[#559CF8] p-6 max-w-2xl w-full font-mono">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#559CF8] text-lg uppercase tracking-wider">
                [SYSTEM::CITATION]
              </h3>
              <button 
                onClick={closeCitation}
                className="text-white hover:text-[#559CF8] text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="bg-gray-900 p-4 rounded border border-[#444] mb-4">
              <pre className="text-sm text-white whitespace-pre-wrap break-words">
                {bibtexCitation}
              </pre>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {copied ? (
                  <span className="text-green-400">✓ Copied to clipboard!</span>
                ) : (
                  "Citation automatically copied to clipboard"
                )}
              </div>
              <button 
                onClick={closeCitation}
                className="text-[#559CF8] border border-[#559CF8] px-4 py-2 hover:bg-[#559CF8] hover:text-black transition-colors uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default DefaultFooter;
