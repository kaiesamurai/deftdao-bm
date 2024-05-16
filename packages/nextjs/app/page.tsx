import Image from "next/image";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-[90%] md:w-[75%]">
        <h1 className="text-center mb-6">
          <span className="block text-2xl mb-2">Roll Swap</span>
          <span className="block text-4xl font-bold">Swap with request for quotes</span>
        </h1>
        <div className="flex flex-col items-center justify-center">
          <Image src="/logo.png" width="727" height="231" alt="banner" className="rounded-xl border-4 border-primary" />
          <div className="max-w-3xl">
            <p className="text-center text-lg mt-8"></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
