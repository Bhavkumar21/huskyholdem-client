import { ReactElement } from "react";
import DefaultFooter from "./footer";
import DefaultHeader from "./header";

const DefaultLauyout = ({ children }: { children: ReactElement }) => {
  return (
    <div className="h-screen">
      <DefaultHeader />
      <div className="w-auto items-center justify-center flex">
        <div className="w-full">{children}</div>
      </div>
      <DefaultFooter />
    </div>
  );
};

export default DefaultLauyout;
