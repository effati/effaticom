export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col items-center row-start-2 gap-4">
        <a
          target="_blank"
          href="https://open.spotify.com/artist/3cE0oEYeqTYJCuoyqF6Kz2"
          className="font-bold"
        >
          Spotify
        </a>
        <a
          target="_blank"
          href="https://www.linkedin.com/in/shayaneffati/"
          className="font-bold"
        >
          LinkedIn
        </a>
        <a
          target="_blank"
          href="https://www.instagram.com/tjajan/"
          className="font-bold"
        >
          Instagram
        </a>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <p>effati.com</p>
      </footer>
    </div>
  );
}
