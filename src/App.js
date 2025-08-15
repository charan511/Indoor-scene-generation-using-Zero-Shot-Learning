import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import './App.css';

const presets = [
  { name: "Modern Living Room", prompt: "A modern living room with large windows and minimalist furniture" },
  { name: "Cozy Bedroom", prompt: "A cozy bedroom with natural light and neutral colors" },
  { name: "Rustic Kitchen", prompt: "A rustic kitchen with wooden countertops and open shelving" },
  { name: "Sleek Bathroom", prompt: "A sleek bathroom with walk-in shower and marble tiles" },
  { name: "Home Office", prompt: "A home office with built-in bookshelves and ergonomic furniture" }
];

function App() {
  const apiUrl = process.env.REACT_APP_API_URL || 'https://0f8b-34-124-239-88.ngrok-free.app';
  console.log('API URL being used:', apiUrl);

  const [prompt, setPrompt] = useState('');
  const [qualityLevel, setQualityLevel] = useState(7.5);
  const [detailLevel, setDetailLevel] = useState(50);
  const [numImages, setNumImages] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [suggestions, setSuggestions] = useState({
    roomTypes: [], designStyles: [], materials: [], colors: [], lighting: []
  });
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [rearrangementSuggestions, setRearrangementSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!apiUrl) {
        setErrorMessage('API URL is not set. Please check your environment configuration.');
        return;
      }
      try {
        console.log('Fetching suggestions from:', `${apiUrl}/api/design-suggestions`);
        const response = await axios.get(`${apiUrl}/api/design-suggestions`);
        const data = response.data || {};
        setSuggestions({
          roomTypes: data.roomTypes || [],
          designStyles: data.designStyles || [],
          materials: data.materials || [],
          colors: data.colors || [],
          lighting: data.lighting || []
        });
      } catch (err) {
        console.error('Failed to load suggestions:', err);
        const errorDetail = err.response?.data?.error || err.message || 'Unknown error';
        setErrorMessage(`Failed to load suggestions: ${errorDetail}. Please try again later.`);
      }
    };
    fetchSuggestions();
  }, [apiUrl]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a valid image (JPG, PNG, WebP, or AVIF).');
      return;
    }

    // Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrorMessage('Image size exceeds 5MB. Please upload a smaller file.');
      return;
    }

    setUploadedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setErrorMessage('');
    setRearrangementSuggestions([]);
  };

  const analyzeRoom = async () => {
    if (!uploadedImage) {
      setErrorMessage('Please upload an image of your bedroom.');
      return;
    }
    if (!apiUrl) {
      setErrorMessage('API URL is not set. Please check your environment configuration.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('image', uploadedImage);

      console.log('Making request to:', `${apiUrl}/api/analyze-room`);
      const response = await axios.post(`${apiUrl}/api/analyze-room`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('API response:', response.data);
      setRearrangementSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Room analysis failed:', err);
      const errorDetail = err.response?.data?.error || err.message || 'Unknown error';
      setErrorMessage(`Failed to analyze room: ${errorDetail}. Please try again.`);
      // Fallback: Mock suggestions if API fails
      setRearrangementSuggestions([
        'Move the bed to the corner near the window to maximize natural light.',
        'Add a nightstand on the left side of the bed for convenience.',
        'Rearrange furniture to create an open pathway from the door to the window.'
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateImages = async () => {
    if (!prompt) return setErrorMessage('Please enter a description for your design.');
    if (prompt.length > 500) return setErrorMessage('Description is too long (max 500 characters).');
    if (!apiUrl) return setErrorMessage('API URL is not set. Please check your environment configuration.');

    setIsGenerating(true);
    setErrorMessage('');
    try {
      console.log('Making request to:', `${apiUrl}/api/generate`);
      console.log('Request payload:', { prompt, qualityLevel, detailLevel, numImages });
      const response = await axios.post(`${apiUrl}/api/generate`, {
        prompt,
        qualityLevel,
        detailLevel,
        numImages
      });
      console.log('API response:', response.data);
      const generatedImages = response.data.images?.map(img => `data:image/jpeg;base64,${img}`) || [];
      setImages(generatedImages);
      setEnhancedPrompt(response.data.enhancedPrompt || '');
      console.log('Set images:', generatedImages);
    } catch (err) {
      console.error('Image generation failed:', err);
      const errorDetail = err.response?.data?.error || err.message || 'Unknown error';
      setErrorMessage(`Failed to generate images: ${errorDetail}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateImages();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4">
      <header className="text-center mb-12 w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-primary">Interior Design Studio</h1>
        <p className="text-lg text-text mt-2">Craft your vision with elegant, bespoke designs</p>
      </header>
      <main className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center">
        {errorMessage && (
          <div className="error-message" id="error-message">
            <p>{errorMessage}</p>
            <button
              onClick={() => setErrorMessage('')}
              className="text-sm text-error underline"
              aria-label="Dismiss error message"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="w-full max-w-3xl mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Upload Your Bedroom Image</h2>
          <div className="image-upload-wrapper">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleImageUpload}
              className="image-upload-input"
              aria-label="Upload bedroom image"
            />
            {imagePreview && (
              <div className="image-preview">
                <img
                  src={imagePreview}
                  alt="Uploaded bedroom preview"
                  className="w-full max-w-md h-auto max-h-80 object-cover rounded-lg"
                />
              </div>
            )}
            <button
              onClick={analyzeRoom}
              disabled={isAnalyzing || !uploadedImage}
              className={`analyze-button w-full max-w-xs mt-4 bg-primary text-white py-2 rounded-lg hover:bg-primary-dark disabled:bg-border disabled:cursor-not-allowed focus:ring-2 focus:ring-accent transition-all ${isAnalyzing ? 'loading' : ''}`}
              aria-label={isAnalyzing ? 'Analyzing room' : 'Analyze room'}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Room'}
            </button>
          </div>
          {rearrangementSuggestions.length > 0 && (
            <div className="rearrangement-suggestions mt-6">
              <h3 className="text-lg font-semibold mb-2 text-primary">Rearrangement Suggestions</h3>
              <ul className="list-disc pl-5 text-text">
                {rearrangementSuggestions.map((suggestion, index) => (
                  <li key={index} className="fade-in">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="w-full max-w-3xl relative">
          <textarea
            className="w-full max-w-3xl p-4 border border-border rounded-lg mb-2 focus:ring-2 focus:ring-accent focus:border-primary transition-all text-center"
            rows={6}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., A modern kitchen with marble countertops and pendant lighting"
            aria-label="Interior design description input"
            aria-describedby={errorMessage ? 'error-message' : undefined}
            style={{ minWidth: '300px', resize: 'vertical' }}
          />
          <p className="text-sm text-text text-right">{prompt.length}/500 characters</p>
        </div>

        <div className="w-full max-w-3xl grid md:grid-cols-3 gap-8 mb-8 flex justify-center">
          <div className="flex flex-col items-center">
            <label className="block font-medium mb-2 text-text">Style Adherence: {qualityLevel}</label>
            <input
              type="range"
              min="5.0"
              max="12.0"
              step="0.5"
              value={qualityLevel}
              onChange={(e) => setQualityLevel(parseFloat(e.target.value))}
              className="w-full max-w-xs accent-primary"
              aria-label="Style adherence slider"
              aria-valuenow={qualityLevel}
              aria-valuemin="5.0"
              aria-valuemax="12.0"
            />
          </div>
          <div className="flex flex-col items-center">
            <label className="block font-medium mb-2 text-text">Detail Level: {detailLevel}</label>
            <input
              type="range"
              min="30"
              max="100"
              step="5"
              value={detailLevel}
              onChange={(e) => setDetailLevel(parseInt(e.target.value))}
              className="w-full max-w-xs accent-primary"
              aria-label="Detail level slider"
              aria-valuenow={detailLevel}
              aria-valuemin="30"
              aria-valuemax="100"
            />
          </div>
          <div className="flex flex-col items-center">
            <label className="block font-medium mb-2 text-text">Number of Images</label>
            <select
              value={numImages}
              onChange={(e) => setNumImages(Number(e.target.value))}
              className="w-full max-w-xs border border-border rounded-lg p-2 focus:ring-2 focus:ring-accent focus:border-primary"
              aria-label="Number of images selector"
            >
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        <div className="w-full max-w-3xl mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Design Presets</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => { setPrompt(preset.prompt); setSelectedPreset(preset.name); }}
                className={`preset-button px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedPreset === preset.name
                    ? 'bg-primary text-white'
                    : 'bg-background text-text hover:bg-primary hover:text-white'
                } focus:ring-2 focus:ring-accent focus:ring-offset-2`}
                aria-pressed={selectedPreset === preset.name}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full max-w-3xl mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Design Suggestions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggestions.roomTypes.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-text">Room Types</h3>
                <ul className="list-disc pl-5 text-text">
                  {suggestions.roomTypes.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {suggestions.designStyles.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-text">Design Styles</h3>
                <ul className="list-disc pl-5 text-text">
                  {suggestions.designStyles.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={generateImages}
          disabled={isGenerating || !apiUrl}
          className={`generate-button w-full max-w-3xl bg-primary text-white py-4 rounded-lg hover:bg-primary-dark disabled:bg-border disabled:cursor-not-allowed mb-8 focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all ${isGenerating ? 'loading' : ''}`}
          aria-label={isGenerating ? 'Generating images' : 'Generate design'}
        >
          {isGenerating ? 'Generating...' : 'Generate Design'}
        </button>

        {isGenerating && (
          <div className="loader-wrapper">
            <ClipLoader color="#1e3a8a" />
          </div>
        )}

        {enhancedPrompt && (
          <div className="w-full max-w-3xl mt-8 fade-in text-center bg-white/80 border border-border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2 text-primary">Refined Design Brief</h3>
            <p className="text-text italic">{enhancedPrompt}</p>
          </div>
        )}

        <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8 justify-items-center">
          {images.length === 0 && !isGenerating ? (
            <p className="text-text text-center col-span-full">
              No images generated yet. Enter a prompt and click "Generate Design"!
            </p>
          ) : (
            images.map((src, i) => (
              <div key={i} className="image-card">
                <img src={src} alt={`Generated interior design ${i + 1}`} className="w-full max-w-md h-auto max-h-80 object-cover" />
                <a
                  href={src}
                  download={`interior-${i + 1}.jpg`}
                  className="download-button"
                  aria-label={`Download generated interior design ${i + 1}`}
                >
                  Download
                </a>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;