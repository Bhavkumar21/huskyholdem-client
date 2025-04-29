const DefaultFooter = () => {
  return (
    <footer className="w-full bg-[black] border-t border-[#444] text-white font-mono tracking-widest uppercase">
      <div className="container mx-auto py-10 block lg:flex justify-between">
        <div className="text-sm pl-4 w-full md:w-auto">
          University of Washington, Seattle, WA, 98195
        </div>
        <div className="text-sm pl-4 w-full md:w-auto">
          <div>
          <span className="text-[#ff00cc]">[SYSTEM::COPYRIGHT]</span> ALGORITHMIC TRADING CLUB @ UW
          <span className="text-[#39ff14]">[2025]</span>
          </div>
            <div className="flex flex-col items-start">
            <div>
              <span className="text-[#ff00cc] w-full">[SYS::STATUS]</span> <span className="text-[#39ff14]">ACTIVE</span>
            </div>
            <div>
              <span className="text-[#ff00cc]">[SYS::VERSION]</span> <span className="text-[#39ff14]"> 2025.0.0</span>
            </div>
            <div>
              <span className="text-[#39ff14]">[SYS::CRED]</span>
              <span className="text-[#ff00cc]"> Built by [<a href="https://www.kipiiler.me" className="text-[#ff00cc] underline">KIPIILER</a>]</span>
            </div>
            <div>
              <span className="text-[#39ff14]">[SYS::CRED]</span>
              <span className="text-[#ff00cc]"> Designed by [<a href="https://www.thaongx.com/" className="text-[#ff00cc] underline">THAONGX</a>]</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default DefaultFooter;
