import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import { FaLaughSquint, FaHeart, FaSadTear, FaFrown, FaThumbsUp, FaThumbsDown, FaFlag } from 'react-icons/fa';
import { Toaster, toast } from 'sonner';
import QRCode from 'react-qr-code';

// The URL for your backend API
let backendApiBaseUrl = process.env.REACT_APP_API_HOST || 'http://localhost:5000';

// A crucial check: ensure the URL has a protocol.
// If the environment variable from SSM only contains the hostname,
// this will prepend `http://` to make it a valid absolute URL.
if (!backendApiBaseUrl.startsWith('http://') && !backendApiBaseUrl.startsWith('https://')) {
  backendApiBaseUrl = `http://${backendApiBaseUrl}`;
}
const quotesApiUrl = `${backendApiBaseUrl}/messages`;

// -----------------------------------------------------------
// NEW CODE ADDED FOR VERSIONING
// Access the Git revision provided by the build process.
// Fallback to 'N/A' if the environment variable is not set.
// You must have updated your buildspec.yml for this to work.
// -----------------------------------------------------------
const gitRevision = process.env.REACT_APP_GIT_REVISION || 'N/A';

// Access the build time provided by the build process.
const buildTime = process.env.REACT_APP_BUILD_TIME || 'N/A'; // <-- NEW CONSTANT

console.log('Using backend API URL:', backendApiBaseUrl);
console.log('App Version (Git Revision):', gitRevision);
console.log('Build Time:', buildTime); // <-- NEW CONSOLE LOG

const App = () => {
  const [quotes, setQuotes] = useState([]);
  const [inputs, setInputs] = useState({ name: '', input1: '', input2: '', input3: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [appUrl, setAppUrl] = useState('');

  // Reaction icon map for easy rendering with colors and hover colors
  const reactionIcons = {
    laugh: { icon: FaLaughSquint, color: 'text-yellow-500', hoverColor: 'hover:text-yellow-600' },
    love: { icon: FaHeart, color: 'text-red-500', hoverColor: 'hover:text-red-600' },
    tears: { icon: FaSadTear, color: 'text-blue-500', hoverColor: 'hover:text-blue-600' },
    sad: { icon: FaFrown, color: 'text-gray-500', hoverColor: 'hover:text-gray-600' },
    like: { icon: FaThumbsUp, color: 'text-green-500', hoverColor: 'hover:text-green-600' },
    downvote: { icon: FaThumbsDown, color: 'text-gray-400', hoverColor: 'hover:text-gray-500' },
    report: { icon: FaFlag, color: 'text-red-600', hoverColor: 'hover:text-red-700' },
  };

  // Set the app URL once on component mount for the QR code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.href);
    }
  }, []);

  // Fetch all quotes from the backend
  const fetchQuotes = async () => {
    try {
      const response = await axios.get(quotesApiUrl);
      // Sanitize the incoming data to ensure all reaction counts are numbers
      const sanitizedQuotes = response.data.map(quote => ({
        ...quote,
        reactions: Object.fromEntries(
          Object.entries(quote.reactions || {}).map(([key, value]) => [key, Number(value)])
        )
      }));
      setQuotes(sanitizedQuotes);
      setMessage('');
    } catch (error) {
      toast.error('Failed to fetch quotes. Please check the backend connection.');
      console.error('Error fetching quotes:', error);
      setMessage('Could not load quotes. Backend might be unavailable.');
    }
  };

  // Fetch quotes on initial load
  useEffect(() => {
    if (backendApiBaseUrl) {
      fetchQuotes();
    } else {
      setMessage('Please configure your backend API URL to fetch quotes.');
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prevInputs => ({ ...prevInputs, [name]: value }));
  };

  // Generate a new quote by sending data to the backend
  const handleGenerateQuote = async () => {
    const { name, input1, input2, input3 } = inputs;
    if (!name.trim() || !input1.trim() || !input2.trim() || !input3.trim()) {
      setMessage('Please fill in all four fields!');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await axios.post(quotesApiUrl, { name, input1, input2, input3 });

      if (response.status !== 201) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchQuotes();
      setInputs({ name: '', input1: '', input2: '', input3: '' });
      toast.success('Quote generated and posted!');
    } catch (error) {
      console.error('Error generating quote:', error);
      toast.error('Failed to generate quote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Correctly handle a reaction click
  const handleReaction = async (quoteId, reactionName) => {
    // Optimistic UI update: Immediately increment the count on the client
    setQuotes(prevQuotes =>
      prevQuotes.map(quote =>
        quote.id === quoteId
          ? {
              ...quote,
              reactions: {
                ...quote.reactions,
                [reactionName]: (quote.reactions[reactionName] || 0) + 1,
              },
            }
          : quote
      )
    );

    // Send the update to the backend in the background
    try {
      await axios.put(`${quotesApiUrl}/${quoteId}/react`, { reaction: reactionName });
    } catch (error) {
      // Revert the optimistic update if the API call fails
      toast.error('Failed to update reaction.');
      setQuotes(prevQuotes =>
        prevQuotes.map(quote =>
          quote.id === quoteId
            ? {
                ...quote,
                reactions: {
                  ...quote.reactions,
                  [reactionName]: (quote.reactions[reactionName] || 1) - 1,
                },
              }
            : quote
        )
      );
      console.error('Error updating reaction:', error);
    }
  };

  // Logic to find the quote with the most total reactions
  const findMostReactedQuoteId = () => {
    let maxReactions = -1;
    let mostReactedId = null;

    quotes.forEach(quote => {
      const totalReactions = Object.values(quote.reactions).reduce((sum, count) => sum + count, 0);
      if (totalReactions > maxReactions) {
        maxReactions = totalReactions;
        mostReactedId = quote.id;
      }
    });
    return mostReactedId;
  };

  const mostReactedQuoteId = findMostReactedQuoteId();

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100 font-sans">
      <div className="w-full max-w-xl mx-auto p-8 rounded-2xl shadow-xl bg-white text-card-foreground">
        
        {/* QR Code Section */}
        {appUrl && (
          <div className="p-6 mb-6 bg-blue-50 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Scan to Share!
            </h2>
            <div className="p-2 bg-white rounded-lg border border-gray-200">
              <QRCode
                value={appUrl}
                size="240"
                level={"M"}
              />
            </div>
            <p className="text-center text-gray-600 mt-4 text-sm">
              Share this page with friends by scanning the QR code above.
            </p>
          </div>
        )}

        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-2">
          Funny Quote Generator
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Enter your name and three fun words to generate a silly quote!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={inputs.name}
            onChange={handleInputChange}
            className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={isLoading}
          />
          <input
            type="text"
            name="input1"
            placeholder="Input 1 (e.g., 'grumpy cat')"
            value={inputs.input1}
            onChange={handleInputChange}
            className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={isLoading}
          />
          <input
            type="text"
            name="input2"
            placeholder="Input 2 (e.g., 'meaning of life')"
            value={inputs.input2}
            onChange={handleInputChange}
            className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={isLoading}
          />
          <input
            type="text"
            name="input3"
            placeholder="Input 3 (e.g., 'old sock')"
            value={inputs.input3}
            onChange={handleInputChange}
            className="w-full px-4 py-3 text-lg rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={isLoading}
          />
        </div>
        
        <button
          onClick={handleGenerateQuote}
          disabled={isLoading}
          className="w-full px-6 py-3 bg-blue-500 text-white text-lg font-bold rounded-xl shadow-md hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving and Generating...' : 'Generate My Funny Quote'}
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm text-center ${message.includes('success') ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
            {message}
          </div>
        )}

        <hr className="my-8 border-gray-200" />

        <div className="quote-list p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
            Generated Quotes
          </h2>
          {quotes.length > 0 ? (
            quotes.map((item) => (
              <div 
                key={item.id} 
                className={`p-4 mb-3 rounded-xl border shadow-sm transition-all
                  ${item.id === mostReactedQuoteId ? 'bg-purple-100 border-purple-400 ring-4 ring-purple-200' : 'bg-blue-50 border-blue-100'}`}
              >
                <p className="m-0 text-gray-700">
                  <span className="font-bold text-blue-600">{item.name}:</span> {item.quote}
                </p>
                <div className="flex space-x-4 mt-4">
                  {Object.entries(reactionIcons).map(([reactionName, { icon: Icon, color, hoverColor }]) => (
                    <button
                      key={reactionName}
                      onClick={() => handleReaction(item.id, reactionName)}
                      className={`flex items-center transition-colors ${color} ${hoverColor}`}
                    >
                      <Icon className="w-5 h-5 mr-1" />
                      <span className="text-sm font-medium">
                        {item.reactions[reactionName] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No quotes yet. Generate one now!</p>
          )}
        </div>

        {/* ----------------------------------------------------------- */}
        {/* MODIFIED CODE: The Git revision is now plain text, not a link. */}
        {/* ----------------------------------------------------------- */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Frontend Version: {gitRevision}
          </p>
          <p>
            Frontend Build Time: {buildTime}
          </p>          
        </div>
        {/* ----------------------------------------------------------- */}
        
      </div>
    </div>
  );
};

export default App;