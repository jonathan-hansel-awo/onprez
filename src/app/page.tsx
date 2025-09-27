export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">
          Hello from OnPrez! 🚀
        </h1>
        <p className="text-xl mb-8 text-gray-600">
          Welcome to your digital identity platform with integrated booking.
        </p>
        <div className="max-w-md mx-auto">
          <p className="mb-4">This is the beginning of something amazing...</p>
          <ul className="text-left space-y-2">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Next.js 14 with App Router
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              TypeScript configured
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Tailwind CSS ready
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Ready for development
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}