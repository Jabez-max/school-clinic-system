import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      
      {/* Main Content Container */}
      <div className="max-w-4xl mx-auto text-center space-y-8">
        
        {/* Logo or Icon (Optional placeholder) */}
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 p-4 rounded-full shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
          Welcome to <span className="text-blue-600">CLINNOVATE</span>
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          The all-in-one School Clinic Management System. Streamlining health records, clinic visits, and medical inventory for a safer and healthier campus.
        </p>

        {/* Call to Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-md flex items-center justify-center"
          >
            Proceed to Login
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </Link>
          
          <Link 
            href="/register" 
            className="w-full sm:w-auto px-8 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition flex items-center justify-center"
          >
            Create an Account
          </Link>
        </div>
      </div>

      {/* Simple Footer */}
      <div className="absolute bottom-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} CLINNOVATE School Clinic System. All rights reserved.
      </div>

    </div>
  );
}