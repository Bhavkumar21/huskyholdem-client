const DefaultFooter = () => {
  return (
    <footer className="w-full bg-[black] border-t border-[#444] text-white font-mono tracking-widest uppercase">
      <div className="container mx-auto py-10 block lg:flex justify-between">
        <div className="text-sm pl-4 w-full md:w-auto">
            <div className="flex flex-col items-start">
            <div>
              <span className="text-[#559CF8]">[SYSTEM::COPYRIGHT]</span> <a target="_blank" href="https://nousresearch.com/" className="underline">Nous Research</a>
            </div>
            <div>
              <span className="text-[#559CF8]">[SYSTEM::CODE]</span> <a target="_blank" href="https://github.com/NousResearch/huskyholdem-bench" className="underline">GITHUB</a>
            </div>
            </div>
        </div>
        <div className="text-sm pl-4 w-full md:w-auto">
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
  );
};
export default DefaultFooter;
