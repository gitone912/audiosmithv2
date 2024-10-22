import React, { useEffect, useRef } from "react";
import { Box } from "@chakra-ui/react";

interface Options {
  smoothing: number;
  fft: number;
  minDecibels: number;
  scale: number;
  glow: number;
  color1: [number, number, number];
  color2: [number, number, number];
  color3: [number, number, number];
  fillOpacity: number;
  lineWidth: number;
  blend: GlobalCompositeOperation;
  shift: number;
  width: number;
  amp: number;
}

const opts: Options = {
  smoothing: 0.6,
  fft: 8,
  minDecibels: -70,
  scale: 0.5, // Smaller scale for more contained waves
  glow: 10, // Softer glow
  color1: [245, 243, 214],
  color2: [245, 243, 214],
  color3: [245, 243, 214],
  fillOpacity: 0.23,
  lineWidth: 1, // Thinner lines
  blend: "screen",
  shift: 15, // Smaller shift to reduce horizontal spacing between waves
  width: 10, // Narrower segments for smaller curves
  amp: 1, // Reduced amplitude for subtle waves
};

const WIDTH = 500;
const HEIGHT = 100;


const AudioVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqsRef = useRef<Uint8Array | null>(null);

  // Adjust for HDPI screens
  const scaleCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    ctx.scale(dpr, dpr); // Scale context to maintain crispness
  };

  const getFreq = (channel: number, i: number) => {
    const shuffle = [1, 3, 0, 4, 2];
    const band = 2 * channel + shuffle[i] * 6;
    return freqsRef.current ? freqsRef.current[band] : 0;
  };

  const scale = (i: number, freqValue: number) => {
    const base = Math.abs(2 - i); // 2, 1, 0, 1, 2
    const weight = 3 - base; // 1, 2, 3, 2, 1
    return (weight / 3) * (freqValue / 255) * opts.amp * (HEIGHT / 2.5); 
  };
  
  const drawPath = (ctx: CanvasRenderingContext2D, channel: number, hasSound: boolean) => {
    const colorKey = `color${channel + 1}` as keyof Options;
    const color = opts[colorKey] as [number, number, number];
    const rgbaColor = color.map(Math.floor).join(", ");
  
    ctx.fillStyle = `rgba(${rgbaColor}, ${opts.fillOpacity})`;
    ctx.strokeStyle = ctx.shadowColor = `rgb(${rgbaColor})`;
    ctx.lineWidth = opts.lineWidth;
    ctx.shadowBlur = opts.glow;
    ctx.globalCompositeOperation = opts.blend;
  
    const midY = HEIGHT / 2;
    const offset = (WIDTH - 15 * opts.width) / 2;
  
    // Generate X-offsets for wave segments
    const xOffsets = Array.from({ length: 15 }, (_, i) =>
      offset + channel * opts.shift + i * opts.width * (WIDTH / 300)
    );
  
    // Get frequency values and adjust based on sound input
    const yValues = Array.from({ length: 5 }, (_, i) => {
      const freq = getFreq(channel, i);
      return hasSound ? Math.max(0, midY - scale(i, freq)) : midY;
    });
  
    ctx.beginPath();
    ctx.moveTo(0, midY); // Start at the mid-line
  
    // Extra smooth entry with more curved quadratic transition
    ctx.quadraticCurveTo(xOffsets[0] - 5, midY, xOffsets[1], yValues[0]);
  
    // Draw the main wave with smoother Bézier curves
    for (let i = 0; i < 4; i++) {
      const cp1X = xOffsets[i * 3 + 2] - 3; // Shifted control point closer
      const cp2X = xOffsets[i * 3 + 3] + 3; // Adjust for extra curvature
  
      ctx.bezierCurveTo(
        cp1X, yValues[i], // Control point 1 (x, y)
        cp2X, yValues[i + 1], // Control point 2 (x, y)
        xOffsets[i * 3 + 4], yValues[i + 1] // End point (x, y)
      );
    }
  
    // Smoothly exit the wave with another quadratic curve
    ctx.quadraticCurveTo(
      xOffsets[14] + 5, yValues[4], WIDTH, midY
    );
  
    ctx.lineTo(WIDTH, midY); // Draw to the right edge
  
    // Mirror the wave at the bottom with smooth transitions
    for (let i = 6; i >= 0; i--) {
      const cp1X = xOffsets[i * 3 + 3] + 3; // Shift control point closer
      const cp2X = xOffsets[i * 3 + 2] - 3;
  
      ctx.bezierCurveTo(
        cp1X, HEIGHT - yValues[i + 1], // Control point 1 (x, y)
        cp2X, HEIGHT - yValues[i], // Control point 2 (x, y)
        xOffsets[i * 3], HEIGHT - yValues[i] // End point (x, y)
      );
    }
  
    // Extra smooth closing transition
    ctx.quadraticCurveTo(xOffsets[0] - 5, HEIGHT - yValues[0], 0, midY);
  
    ctx.fill();
    ctx.stroke();
  };
  

  const visualize = (ctx: CanvasRenderingContext2D) => {
    if (!analyserRef.current || !freqsRef.current) return;
  
    analyserRef.current.smoothingTimeConstant = opts.smoothing;
    analyserRef.current.fftSize = Math.pow(2, opts.fft);
    analyserRef.current.minDecibels = opts.minDecibels;
    analyserRef.current.getByteFrequencyData(freqsRef.current);
  
    const hasSound = freqsRef.current.some((val) => val > 10); // Detect sound presence
  
    ctx.clearRect(0, 0, WIDTH, HEIGHT); // Clear the canvas
  
    drawPath(ctx, 0, hasSound);
    drawPath(ctx, 1, hasSound);
    drawPath(ctx, 2, hasSound);
  
    requestAnimationFrame(() => visualize(ctx));
  };

  const startVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();

      contextRef.current = audioContext;
      analyserRef.current = analyser;
      freqsRef.current = new Uint8Array(analyser.frequencyBinCount);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          scaleCanvas(canvas, ctx); // Scale for HDPI
          visualize(ctx);
        }
      }
    } catch (error) {
      console.error("Audio visualization failed:", error);
    }
  };

  useEffect(() => {
    startVisualization();

    return () => {
      contextRef.current?.close();
    };
  }, []);

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      w={{ base: "100%", md: "80%", lg: "60%" }}
      maxW="100%"
      minH="100px"
      bg="transparent" // Ensure transparent background
      borderRadius="md"
      overflow="hidden"
    >
      <canvas ref={canvasRef} style={{ width: WIDTH, height: HEIGHT }} />
    </Box>
  );
};

export default AudioVisualizer;
