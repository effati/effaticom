export const Sparkles = () => {
  return (
    <div className="fixed inset-0 -z-10">
      {Array.from({ length: 500 }).map((_, index) => (
        <div
          key={index}
          className="absolute w-0.5 h-2 bg-foreground rounded-full animate-sparkle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 3 + 10}s`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Sparkles;
