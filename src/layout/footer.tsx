const DefaultFooter = () => {
  return (
    <footer className="w-full bg-[black] border-t border-[#444] text-white font-mono tracking-widest uppercase">
      <div className="container mx-auto py-10 block lg:flex justify-between">
        <div className="text-sm pl-4 w-full md:w-auto">
          University of Washington, Seattle, WA, 98195
        </div>
        <div className="text-sm pl-4 w-full md:w-auto">
          ©2024 Algorithm Trading Club UW. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
export default DefaultFooter;
