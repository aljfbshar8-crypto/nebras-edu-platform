import React, { useState, useRef, useEffect } from 'react';
import { MathRenderer } from './MathRenderer';
import {
  LineChart,
  PenTool,
  Eraser,
  RotateCcw,
  Sparkles,
  Camera,
  Maximize2,
  Minimize2,
  Trash2,
  Download
} from 'lucide-react';

interface MathGrapherProps {
  onSendDrawingToSolver: (dataUrl: string) => void;
}

export const MathGrapher: React.FC<MathGrapherProps> = ({ onSendDrawingToSolver }) => {
  const [activeMode, setActiveMode] = useState<'function' | 'scratchpad'>('function');

  // Function Plotter State
  const [funcExpr, setFuncExpr] = useState('x^2 - 4');
  const [xMin, setXMin] = useState(-6);
  const [xMax, setXMax] = useState(6);
  const [yMin, setYMin] = useState(-6);
  const [yMax, setYMax] = useState(6);
  const plotCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Scratchpad State
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#38bdf8');
  const [lineWidth, setLineWidth] = useState(3);

  // Function plotting logic
  useEffect(() => {
    if (activeMode !== 'function') return;
    const canvas = plotCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Coordinate mapping
    const toScreenX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Draw Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(x), 0);
      ctx.lineTo(toScreenX(x), height);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      ctx.beginPath();
      ctx.moveTo(0, toScreenY(y));
      ctx.lineTo(width, toScreenY(y));
      ctx.stroke();
    }

    // Draw Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, toScreenY(0));
    ctx.lineTo(width, toScreenY(0));
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(toScreenX(0), 0);
    ctx.lineTo(toScreenX(0), height);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Cairo, sans-serif';
    ctx.textAlign = 'center';
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      if (x !== 0) ctx.fillText(x.toString(), toScreenX(x), toScreenY(0) + 12);
    }
    ctx.textAlign = 'right';
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      if (y !== 0) ctx.fillText(y.toString(), toScreenX(0) - 5, toScreenY(y) + 4);
    }

    // Parse and plot function
    // Convert math string into JS eval safe expression
    const sanitized = funcExpr
      .replace(/\^/g, '**')
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/abs/g, 'Math.abs')
      .replace(/e\^/g, 'Math.exp')
      .replace(/ln/g, 'Math.log')
      .replace(/pi/g, 'Math.PI');

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;
    const step = (xMax - xMin) / 600;

    for (let x = xMin; x <= xMax; x += step) {
      try {
        // Safe evaluation
        const evalFunc = new Function('x', `return ${sanitized};`);
        const y = evalFunc(x);

        if (!isNaN(y) && isFinite(y) && y >= yMin * 2 && y <= yMax * 2) {
          const sx = toScreenX(x);
          const sy = toScreenY(y);
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        } else {
          started = false;
        }
      } catch {
        started = false;
      }
    }
    ctx.stroke();
  }, [funcExpr, xMin, xMax, yMin, yMax, activeMode]);

  // Scratchpad drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = scratchCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#090d16';
    } else {
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearScratchpad = () => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSendToSolver = () => {
    const canvas = activeMode === 'function' ? plotCanvasRef.current : scratchCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSendDrawingToSolver(dataUrl);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 p-6 sm:p-8 shadow-xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-3">
            <LineChart className="w-3.5 h-3.5" />
            <span>المختبر الرياضي التفاعلي والمسودة</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            الرسم البياني للدوال والمسودة اليدوية للحل
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            مثّل الدوال الرياضية بيانياً بشكل حي، أو ارسم الأشكال الهندسية والمعادلات بيدك في المسودة التفاعلية، مع إمكانية إرسال رسمك مباشرة للذكاء الاصطناعي لحله!
          </p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveMode('function')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
            activeMode === 'function'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>راسم الدوال f(x)</span>
        </button>

        <button
          onClick={() => setActiveMode('scratchpad')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
            activeMode === 'scratchpad'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>المسودة الحرة (رسم يدوي)</span>
        </button>
      </div>

      {/* ================= FUNCTION PLOTTER VIEW ================= */}
      {activeMode === 'function' && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-7 shadow-lg space-y-5">
          {/* Function Input Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 flex-1">
              <span className="font-mono text-cyan-400 font-bold text-sm">f(x) =</span>
              <input
                type="text"
                value={funcExpr}
                onChange={(e) => setFuncExpr(e.target.value)}
                placeholder="x^2 - 4, sin(x), 2*x + 1..."
                className="bg-transparent border-none outline-none text-white font-mono text-sm w-full ltr"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'x^2 - 4',
                'sin(x)',
                'x^3 - 3*x',
                'cos(2*x)',
                '1/x',
                'sqrt(x)',
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => setFuncExpr(p)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs border border-slate-700/60"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Canvas Container */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#090d16] flex items-center justify-center shadow-inner">
            <canvas
              ref={plotCanvasRef}
              width={750}
              height={420}
              className="w-full max-w-full h-auto aspect-[16/9]"
            />
          </div>

          {/* Controls & Send to solver */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>نطاق X:</span>
              <button
                onClick={() => {
                  setXMin(-10);
                  setXMax(10);
                  setYMin(-10);
                  setYMax(10);
                }}
                className="px-2 py-1 bg-slate-800 rounded text-slate-300 hover:text-white"
              >
                [-10, 10]
              </button>
              <button
                onClick={() => {
                  setXMin(-5);
                  setXMax(5);
                  setYMin(-5);
                  setYMax(5);
                }}
                className="px-2 py-1 bg-slate-800 rounded text-slate-300 hover:text-white"
              >
                [-5, 5]
              </button>
            </div>

            <button
              onClick={handleSendToSolver}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>إرسال هذا المنحنى للذكاء الاصطناعي لتحليله</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= SCRATCHPAD DRAWING VIEW ================= */}
      {activeMode === 'scratchpad' && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-7 shadow-lg space-y-4">
          {/* Scratchpad Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTool('pen')}
                className={`p-2 rounded-lg border transition ${
                  tool === 'pen'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
                title="قلم الرسم"
              >
                <PenTool className="w-4 h-4" />
              </button>

              <button
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-lg border transition ${
                  tool === 'eraser'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
                title="الممحاة"
              >
                <Eraser className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-slate-800 mx-1" />

              {/* Color choices */}
              {['#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#ffffff'].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setTool('pen');
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    color === c && tool === 'pen' ? 'border-white scale-110 shadow-md' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}

              <div className="h-5 w-px bg-slate-800 mx-1" />

              {/* Line width slider */}
              <input
                type="range"
                min={1}
                max={10}
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                className="w-20 accent-purple-500"
                title="سُمك القلم"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearScratchpad}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 text-xs font-semibold border border-slate-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح اللوحة</span>
              </button>

              <button
                onClick={handleSendToSolver}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm hover:from-purple-500 hover:to-indigo-500 shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>حل هذه المسألة المرسومة 💡</span>
              </button>
            </div>
          </div>

          {/* Drawing Canvas */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#090d16] flex items-center justify-center shadow-inner cursor-crosshair">
            <canvas
              ref={scratchCanvasRef}
              width={800}
              height={450}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseMove={draw}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
              className="w-full max-w-full h-auto aspect-[16/9] touch-none"
            />
          </div>

          <p className="text-xs text-slate-500 text-center">
            * يمكنك كتابة معادلة بخط يدك أو رسم مثلث أو دائرة هندسية والنقر على "حل هذه المسألة المرسومة" لتحليلها تلقائياً.
          </p>
        </div>
      )}
    </div>
  );
};
