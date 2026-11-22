
"use client";

import { useState, useEffect } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

interface PredictionResult {
  prediction: string;
  confidence: number;
  gradcam?: string;
}

interface HistoryItem {
  id: string;
  image_name: string;
  prediction: string;
  confidence: number;
  created_at: string;
}

interface Statistics {
  total_predictions: number;
  normal_cases: number;
  pneumonia_cases: number;
  average_confidence: number;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  const fetchHistory = async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/history`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Unable to load prediction history.");
      }

      setHistory(data.history || []);
    } catch (err) {
      console.error("History error:", err);
      setHistoryError(
        err instanceof Error
          ? err.message
          : "Unable to connect to backend."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchStatistics = async () => {
    setStatsLoading(true);
    setStatsError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/statistics`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Unable to load statistics.");
      }

      setStatistics({
        total_predictions: data.total_predictions,
        normal_cases: data.normal_cases,
        pneumonia_cases: data.pneumonia_cases,
        average_confidence: data.average_confidence,
      });
    } catch (err) {
      console.error("Statistics error:", err);
      setStatsError(
        err instanceof Error
          ? err.message
          : "Unable to connect to backend."
      );
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchStatistics();
  }, []);

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Please select a JPG or PNG image.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      setError("Please upload a chest X-ray image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/predict`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Prediction failed.");
      }

      if (!data.success || !data.result) {
        throw new Error("Invalid response from API.");
      }

      const predictionData = data.result;

      setResult({
        prediction: predictionData.prediction,
        confidence: predictionData.confidence,
        gradcam: data.gradcam || predictionData.gradcam || undefined,
      });

      await Promise.all([
        fetchHistory(),
        fetchStatistics(),
      ]);
    } catch (err) {
      console.error("Prediction error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError("");
  };

  const normalPercentage =
    statistics && statistics.total_predictions > 0
      ? (statistics.normal_cases / statistics.total_predictions) * 100
      : 0;

  const pneumoniaPercentage =
    statistics && statistics.total_predictions > 0
      ? (statistics.pneumonia_cases / statistics.total_predictions) * 100
      : 0;

  return (
    <main className="min-h-screen bg-[#07111f] text-white">

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-[#0b1728]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">
              PneumoAI
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Intelligent X-Ray Analysis
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="text-green-400">System Online</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-10 text-center">
        <span className="text-cyan-400 text-sm font-semibold tracking-[3px]">
          ARTIFICIAL INTELLIGENCE
        </span>

        <h2 className="text-4xl md:text-6xl font-bold mt-5">
          Chest X-Ray
          <span className="block text-cyan-400 mt-2">
            Pneumonia Detection
          </span>
        </h2>

        <p className="text-slate-400 max-w-2xl mx-auto mt-6 leading-7">
          Upload a chest X-ray image and let our deep learning
          model classify it as NORMAL or PNEUMONIA.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">

        {/* Upload and Result */}
        <div className="grid md:grid-cols-2 gap-7">

          {/* Upload Panel */}
          <div className="bg-[#0d1b2d] border border-slate-700 rounded-2xl p-7 shadow-xl">

            <div className="flex justify-between items-center mb-7">
              <h3 className="text-xl font-bold">
                Upload X-Ray
              </h3>
              <span className="text-cyan-400 text-sm">Step 01</span>
            </div>

            <label className="border-2 border-dashed border-cyan-600 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer hover:bg-slate-800/60 transition">
              <span className="text-5xl mb-5">📤</span>

              <span className="font-semibold text-lg">
                Choose X-Ray Image
              </span>

              <span className="text-sm text-slate-400 mt-2">
                Click to browse JPG or PNG
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {preview && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-cyan-400 font-semibold">
                    Image Preview
                  </h4>

                  <button
                    type="button"
                    onClick={resetImage}
                    className="text-red-400 text-sm hover:text-red-300"
                  >
                    Remove Image
                  </button>
                </div>

                <div className="bg-black/30 rounded-xl p-3">
                  <img
                    src={preview}
                    alt="Uploaded Chest X-Ray"
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                </div>

                <p className="text-xs text-green-400 mt-3 break-all">
                  ✓ {selectedFile?.name}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handlePredict}
              disabled={!selectedFile || loading}
              className="w-full mt-7 py-4 rounded-xl font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition"
            >
              {loading ? "Analyzing X-Ray..." : "Predict Pneumonia →"}
            </button>

            {loading && (
              <div className="mt-5 text-center">
                <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-cyan-400 text-sm mt-3">
                  AI model is analyzing your image...
                </p>
              </div>
            )}

            {error && (
              <div className="mt-5 bg-red-950/50 border border-red-500 rounded-xl p-4 text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Result Panel */}
          <div className="bg-[#0d1b2d] border border-slate-700 rounded-2xl p-7 shadow-xl">

            <div className="flex justify-between items-center mb-7">
              <h3 className="text-xl font-bold">
                Analysis Result
              </h3>

              <span className="text-cyan-400 text-sm">Step 02</span>
            </div>

            {!result && !loading && (
              <div className="min-h-72 flex flex-col justify-center items-center text-center">
                <div className="text-6xl mb-5">🩻</div>

                <h4 className="text-lg font-semibold text-slate-300">
                  Waiting for Analysis
                </h4>

                <p className="text-sm text-slate-500 mt-3 max-w-xs">
                  Upload a chest X-ray and click Predict to
                  see the AI classification result.
                </p>
              </div>
            )}

            {loading && (
              <div className="min-h-72 flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-cyan-400 mt-5">
                  Processing image...
                </p>
              </div>
            )}

            {result && (
              <div className="min-h-72">

                <div className="text-center py-5">
                  <div className="text-5xl mb-4">
                    {result.prediction === "PNEUMONIA" ? "⚠️" : "✓"}
                  </div>

                  <p className="text-sm text-slate-400 mb-3">
                    AI Classification
                  </p>

                  <h4 className={`text-3xl font-bold ${
                    result.prediction === "PNEUMONIA"
                      ? "text-red-400"
                      : "text-green-400"
                  }`}>
                    {result.prediction}
                  </h4>
                </div>

                <div className="bg-[#14243a] rounded-xl p-5 mt-5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">
                      Confidence Score
                    </span>

                    <span className="text-cyan-400 text-xl font-bold">
                      {result.confidence}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-700 h-3 rounded-full mt-4 overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(0, result.confidence))}%`
                      }}
                    />
                  </div>
                </div>

                {result.gradcam && (
                  <div className="mt-8 bg-[#14243a] rounded-xl p-5">
                    <h4 className="text-xl font-bold text-cyan-400 mb-3">
                      Grad-CAM Visualization
                    </h4>

                    <p className="text-sm text-slate-400 mb-4">
                      Visual explanation of the image regions influencing the model prediction.
                    </p>

                    <img
                      src={`data:image/png;base64,${result.gradcam}`}
                      alt="Grad-CAM Heatmap"
                      className="w-full max-h-80 object-contain rounded-xl border border-cyan-600 bg-black/30"
                    />
                  </div>
                )}

                {!result.gradcam && (
                  <p className="text-xs text-yellow-400 text-center mt-5">
                    Grad-CAM image was not included in the API response.
                  </p>
                )}

                <p className="text-xs text-slate-400 text-center mt-5">
                  Analysis completed successfully.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="mt-12">

          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold">
                Statistics Dashboard
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                Overview of all X-ray prediction records
              </p>
            </div>

            <button
              type="button"
              onClick={fetchStatistics}
              disabled={statsLoading}
              className="px-5 py-3 rounded-lg bg-cyan-400 text-slate-950 font-semibold hover:bg-cyan-300 disabled:opacity-50 transition"
            >
              {statsLoading ? "Loading..." : "↻ Refresh Statistics"}
            </button>
          </div>

          {statsLoading && !statistics && (
            <p className="text-center text-cyan-400 py-8">
              Loading statistics...
            </p>
          )}

          {statsError && (
            <p className="text-center text-red-400 py-5">
              {statsError}
            </p>
          )}

          {statistics && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                <div className="bg-[#0d1b2d] border border-slate-700 rounded-2xl p-6">
                  <p className="text-sm text-slate-400">
                    Total Predictions
                  </p>
                  <h4 className="text-3xl font-bold text-cyan-400 mt-4">
                    {statistics.total_predictions}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2">
                    All analyzed X-rays
                  </p>
                </div>

                <div className="bg-[#0d1b2d] border border-slate-700 rounded-2xl p-6">
                  <p className="text-sm text-slate-400">
                    NORMAL Cases
                  </p>
                  <h4 className="text-3xl font-bold text-green-400 mt-4">
                    {statistics.normal_cases}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2">
                    Classified as NORMAL
                  </p>
                </div>

                <div className="bg-[#0d1b2d] border border-slate-700 rounded-2xl p-6">
                  <p className="text-sm text-slate-400">
                    PNEUMONIA Cases
                  </p>
                  <h4 className="text-3xl font-bold text-red-400 mt-4">
                    {statistics.pneumonia_cases}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2">
                    Classified as PNEUMONIA
                  </p>
                </div>

                <div className="bg-[#0d1b2d] border border-slate-700 rounded-2xl p-6">
                  <p className="text-sm text-slate-400">
                    Average Confidence
                  </p>
                  <h4 className="text-3xl font-bold text-cyan-400 mt-4">
                    {statistics.average_confidence}%
                  </h4>
                  <p className="text-xs text-slate-500 mt-2">
                    Average model confidence
                  </p>
                </div>

              </div>

              {/* Prediction Distribution */}
              <div className="mt-7 bg-[#0d1b2d] border border-slate-700 rounded-2xl p-7">

                <h4 className="text-xl font-bold mb-2">
                  Prediction Distribution
                </h4>

                <p className="text-sm text-slate-400 mb-8">
                  Distribution of NORMAL and PNEUMONIA predictions
                </p>

                <div className="space-y-7">

                  <div>
                    <div className="flex justify-between mb-3">
                      <span className="text-green-400 font-semibold">
                        NORMAL
                      </span>
                      <span className="text-slate-300 text-sm">
                        {statistics.normal_cases} ({normalPercentage.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-700 h-5 rounded-full overflow-hidden">
                      <div
                        className="bg-green-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${normalPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                      <span className="text-red-400 font-semibold">
                        PNEUMONIA
                      </span>
                      <span className="text-slate-300 text-sm">
                        {statistics.pneumonia_cases} ({pneumoniaPercentage.toFixed(1)}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-700 h-5 rounded-full overflow-hidden">
                      <div
                        className="bg-red-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${pneumoniaPercentage}%` }}
                      />
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>

        {/* Prediction History */}
        <div className="mt-12 bg-[#0d1b2d] border border-slate-700 rounded-2xl p-7 shadow-xl">

          <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
            <div>
              <h3 className="text-2xl font-bold">
                Prediction History
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                Previous X-ray analysis records from database
              </p>
            </div>

            <button
              type="button"
              onClick={fetchHistory}
              disabled={historyLoading}
              className="px-5 py-3 rounded-lg bg-cyan-400 text-slate-950 font-semibold hover:bg-cyan-300 disabled:opacity-50 transition"
            >
              {historyLoading ? "Loading..." : "↻ Refresh History"}
            </button>
          </div>

          {historyLoading && (
            <p className="text-center text-cyan-400 py-8">
              Loading prediction history...
            </p>
          )}

          {historyError && (
            <p className="text-center text-red-400 py-5">
              {historyError}
            </p>
          )}

          {!historyLoading && !historyError && history.length === 0 && (
            <p className="text-center text-slate-400 py-8">
              No prediction history found.
            </p>
          )}

          {!historyLoading && !historyError && history.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-cyan-400 text-sm">
                    <th className="p-4">Image Name</th>
                    <th className="p-4">Prediction</th>
                    <th className="p-4">Confidence</th>
                    <th className="p-4">Date &amp; Time</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800 hover:bg-slate-800/40 transition"
                    >
                      <td className="p-4 text-sm text-slate-300 break-all">
                        {item.image_name}
                      </td>

                      <td className="p-4">
                        <span className={`font-semibold text-sm ${
                          item.prediction === "PNEUMONIA"
                            ? "text-red-400"
                            : "text-green-400"
                        }`}>
                          {item.prediction}
                        </span>
                      </td>

                      <td className="p-4 text-sm text-cyan-400 font-semibold">
                        {item.confidence}%
                      </td>

                      <td className="p-4 text-sm text-slate-400">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!historyLoading && !historyError && history.length > 0 && (
            <p className="text-xs text-slate-500 mt-5">
              Total records: {history.length}
            </p>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 border border-slate-800 bg-[#0b1728] rounded-xl p-5 text-center">
          <p className="text-sm text-slate-400">
            <span className="text-cyan-400 font-semibold">
              Research Disclaimer:
            </span>{" "}
            This AI system is an educational research prototype.
            It is not intended for clinical diagnosis or medical decisions.
          </p>
        </div>

      </section>

      <footer className="border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
        PneumoAI | Deep Learning Research Project
      </footer>

    </main>
  );
}
