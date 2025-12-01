import React, { useState } from "react";
import { Sparkles, Download } from "lucide-react";
import { generateImage } from "../api";

const ImageMode = () => {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setImageUrl("");

    try {
      console.log("Generating image with DALL-E 3:", { prompt });
      const url = await generateImage(prompt);
      console.log("Generated image URL:", url);
      setImageUrl(url);
    } catch (error) {
      console.error("Error in ImageMode:", error);
      alert(
        `Error: ${
          error.message || "Unknown error occurred. Check console for details."
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "generated-image.png";
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-4 sm:p-8 flex flex-col gap-6 sm:gap-8 h-full overflow-y-auto">
      {!imageUrl && (
        <div className="text-center space-y-3 sm:space-y-4 mt-8 sm:mt-12 px-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-linear-to-br from-purple-100 to-pink-100 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg">
            <span className="text-4xl sm:text-5xl">🎨</span>
          </div>
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-3">
              AI Image Generator
            </h2>
            <p className="text-gray-600 text-sm sm:text-lg px-4">
              Powered by DALL-E 3 • Create stunning visuals from text
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/50">
        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 uppercase tracking-wide">
          Describe Your Vision
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A serene Japanese garden at sunset with cherry blossoms, koi pond, and traditional wooden bridge..."
          className="w-full h-32 sm:h-40 p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm sm:text-base text-gray-700 placeholder:text-gray-400 transition-all"
        />
        <div className="mt-4 sm:mt-6 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-2 sm:gap-3 bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold text-base sm:text-lg shadow-lg shadow-purple-500/40"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Creating Magic...</span>
                <span className="sm:hidden">Creating...</span>
              </>
            ) : (
              <>
                <Sparkles size={20} className="sm:w-[22px] sm:h-[22px]" />
                <span className="hidden sm:inline">Generate Image</span>
                <span className="sm:hidden">Generate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {imageUrl && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-gray-200/50 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Your Creation
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Generated with DALL-E 3
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 transition-all font-medium text-sm sm:text-base shadow-md shadow-purple-500/30"
              title="Download image"
            >
              <Download size={16} className="sm:w-[18px] sm:h-[18px]" />{" "}
              Download
            </button>
          </div>
          <div className="relative group">
            <img
              src={imageUrl}
              alt="Generated"
              className="w-full rounded-xl sm:rounded-2xl shadow-2xl border-2 sm:border-4 border-gray-100 transition-transform group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl sm:rounded-2xl flex items-end p-4 sm:p-6">
              <p className="text-white font-medium text-xs sm:text-sm line-clamp-3">
                {prompt}
              </p>
            </div>
          </div>
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-purple-50 rounded-lg sm:rounded-xl border border-purple-100">
            <p className="text-xs sm:text-sm text-gray-700">
              <span className="font-semibold text-purple-700">Prompt:</span>{" "}
              {prompt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageMode;
