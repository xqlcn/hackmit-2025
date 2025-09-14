import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-6xl mx-auto">
          {/* Main Hero Content */}
          <div className="mb-16">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
              TimeShifter
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Align your day with your body's natural rhythm. Optimize your schedule based on your chronotype for peak productivity and well-being.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href="/demo"
                className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Try the Demo →
              </Link>
              <button className="inline-block bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/30 transition-all duration-200 border border-white/30">
                Learn More
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Scheduling</h3>
              <p className="text-white/80 text-sm">AI-powered schedule optimization based on your chronotype and energy patterns.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Energy Optimization</h3>
              <p className="text-white/80 text-sm">Schedule high-focus tasks during your peak energy hours for maximum productivity.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Well-being Focus</h3>
              <p className="text-white/80 text-sm">Prioritize sleep, exercise, and breaks to maintain long-term health and performance.</p>
            </div>
          </div>

          {/* Sample Timeline Preview */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-16">
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">See Your Day Optimized</h3>
            <div className="bg-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/80 text-sm">Sample Schedule</span>
                <span className="text-white/60 text-xs">Based on Morning Chronotype</span>
              </div>
              
              {/* Mini Timeline */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-16 text-white/80 text-sm">06:00</div>
                  <div className="flex-1 bg-white/10 rounded-lg p-3 ml-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                      <span className="text-white text-sm">Morning Exercise</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-16 text-white/80 text-sm">09:00</div>
                  <div className="flex-1 bg-white/10 rounded-lg p-3 ml-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div>
                      <span className="text-white text-sm">Deep Focus Work</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-16 text-white/80 text-sm">14:00</div>
                  <div className="flex-1 bg-white/10 rounded-lg p-3 ml-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-amber-400 rounded-full mr-3"></div>
                      <span className="text-white text-sm">Break & Lunch</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-16 text-white/80 text-sm">22:00</div>
                  <div className="flex-1 bg-white/10 rounded-lg p-3 ml-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-300 rounded-full mr-3"></div>
                      <span className="text-white text-sm">Wind Down</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">95%</div>
              <div className="text-white/80 text-sm">Productivity Increase</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">2.5hrs</div>
              <div className="text-white/80 text-sm">Daily Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">10k+</div>
              <div className="text-white/80 text-sm">Users Optimized</div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center">
            <p className="text-white/80 mb-6">Ready to transform your daily routine?</p>
            <Link 
              href="/demo"
              className="inline-block bg-white text-indigo-600 px-12 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Your Optimized Day →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
