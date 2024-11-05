import React, { useEffect, useRef } from "react";
import { Box } from "@chakra-ui/react";

interface Options {
  smoothing: number;
  fftSize: number;
  minDecibels: number;
  scale: number;
  glow: number;
  color1: [number, number, number];
  color2: [number, number, number];
  color3: [number, number, number];
  fillOpacity: number;
  lineWidth: number;
  blendMode: GlobalCompositeOperation;
  shift: number;
  segmentWidth: number;
  amplitude: number;
}

const options: Options = {
  smoothing: 0.6,
  fftSize: 8,
  minDecibels: -70,
  scale: 0.5,
  glow: 10,
  color1: [245, 243, 214],
  color2: [245, 243, 214],
  color3: [245, 243, 214],
  fillOpacity: 0.23,
  lineWidth: 1,
  blendMode: "screen",
  shift: 15,
  segmentWidth: 10,
  amplitude: 1,
};

const WIDTH = 500;
const HEIGHT = 100;

const AudioVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);

  // Setup high-DPI scaling for canvas
  const configureCanvasForHDPI = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    context.scale(dpr, dpr);
  };

  const fetchFrequencyValue = (channel: number, index: number) => {
    const shuffleOrder = [1, 3, 0, 4, 2];
    const bandIndex = 2 * channel + shuffleOrder[index] * 6;
    return frequencyDataRef.current ? frequencyDataRef.current[bandIndex] : 0;
  };

  const calculateScaledValue = (index: number, freqValue: number) => {
    const base = Math.abs(2 - index);
    const weight = 3 - base;
    return (weight / 3) * (freqValue / 255) * options.amplitude * (HEIGHT / 2.5);
  };

  const renderWavePath = (
    context: CanvasRenderingContext2D,
    channel: number,
    hasSound: boolean
  ) => {
    const colorKey = `color${channel + 1}` as keyof Options;
    const color = options[colorKey] as [number, number, number];
    const rgbaColor = color.join(", ");

    context.fillStyle = `rgba(${rgbaColor}, ${options.fillOpacity})`;
    context.strokeStyle = context.shadowColor = `rgb(${rgbaColor})`;
    context.lineWidth = options.lineWidth;
    context.shadowBlur = options.glow;
    context.globalCompositeOperation = options.blendMode;

    const midY = HEIGHT / 2;
    const offset = (WIDTH - 15 * options.segmentWidth) / 2;

    const xOffsets = Array.from({ length: 15 }, (_, i) =>
      offset + channel * options.shift + i * options.segmentWidth * (WIDTH / 300)
    );

    const yValues = Array.from({ length: 5 }, (_, i) => {
      const freq = fetchFrequencyValue(channel, i);
      return hasSound ? Math.max(0, midY - calculateScaledValue(i, freq)) : midY;
    });

    context.beginPath();
    context.moveTo(0, midY);

    context.quadraticCurveTo(xOffsets[0] - 5, midY, xOffsets[1], yValues[0]);

    for (let i = 0; i < 4; i++) {
      const cp1X = xOffsets[i * 3 + 2] - 3;
      const cp2X = xOffsets[i * 3 + 3] + 3;

      context.bezierCurveTo(
        cp1X,
        yValues[i],
        cp2X,
        yValues[i + 1],
        xOffsets[i * 3 + 4],
        yValues[i + 1]
      );
    }

    context.quadraticCurveTo(xOffsets[14] + 5, yValues[4], WIDTH, midY);

    for (let i = 6; i >= 0; i--) {
      const cp1X = xOffsets[i * 3 + 3] + 3;
      const cp2X = xOffsets[i * 3 + 2] - 3;

      context.bezierCurveTo(
        cp1X,
        HEIGHT - yValues[i + 1],
        cp2X,
        HEIGHT - yValues[i],
        xOffsets[i * 3],
        HEIGHT - yValues[i]
      );
    }

    context.quadraticCurveTo(xOffsets[0] - 5, HEIGHT - yValues[0], 0, midY);

    context.fill();
    context.stroke();
  };

  const visualizeAudio = (context: CanvasRenderingContext2D) => {
    if (!analyserRef.current || !frequencyDataRef.current) return;

    analyserRef.current.smoothingTimeConstant = options.smoothing;
    analyserRef.current.fftSize = Math.pow(2, options.fftSize);
    analyserRef.current.minDecibels = options.minDecibels;
    analyserRef.current.getByteFrequencyData(frequencyDataRef.current);

    const hasSound = frequencyDataRef.current.some((value) => value > 10);

    context.clearRect(0, 0, WIDTH, HEIGHT);

    [0, 1, 2].forEach((channel) => renderWavePath(context, channel, hasSound));

    requestAnimationFrame(() => visualizeAudio(context));
  };

  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext("2d");
        if (context) {
          configureCanvasForHDPI(canvas, context);
          visualizeAudio(context);
        }
      }
    } catch (error) {
      console.error("Audio visualization error:", error);
    }
  };

  useEffect(() => {
    startAudioVisualization();

    return () => {
      audioContextRef.current?.close();
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
      bg="transparent"
      borderRadius="md"
      overflow="hidden"
    >
      <canvas ref={canvasRef} style={{ width: WIDTH, height: HEIGHT }} />
    </Box>
  );
};

export default AudioVisualizer;
