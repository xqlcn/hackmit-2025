import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-white flex items-center justify-center">
      <div className="text-center px-6 max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6">
          TimeShifter
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-2xl mx-auto">
          Align your day with your body's natural rhythm.
        </p>
        <Link 
          href="/demo"
          className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors duration-200 shadow-lg"
        >
          Try the Demo →
        </Link>
      </div>
    </div>
  );
}
