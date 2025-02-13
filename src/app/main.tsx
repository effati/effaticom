"use client";

import HeadViewer from "./head";

export const Main = () => {
  return (
    <div className="flex flex-col row-start-2 gap-20 grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 sm:p-20 ">
      <div className="flex flex-col gap-4 items-center fixed inset-0 -z-10 top-[100px]">
        <h1>Shayan</h1>
        <h1>Effati</h1>
      </div>
      <div className="w-[500px] h-[500px]">
        <HeadViewer />
      </div>
      <div className="flex flex-col gap-4 items-center">
        <a
          target="_blank"
          href="https://open.spotify.com/artist/3cE0oEYeqTYJCuoyqF6Kz2"
          className="text-bagel"
        >
          Spotify
        </a>
        <a
          target="_blank"
          href="https://www.linkedin.com/in/shayaneffati/"
          className="text-bagel"
        >
          LinkedIn
        </a>
        <a
          target="_blank"
          href="https://www.instagram.com/tjajan/"
          className="text-bagel"
        >
          Instagram
        </a>
      </div>
    </div>
  );
};
