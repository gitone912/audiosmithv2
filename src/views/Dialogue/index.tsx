// Chakra imports
import {
  Box,
  Text,
  VStack,
  Button,
  IconButton,
  useColorModeValue,
  Spinner,
} from "@chakra-ui/react";
import { MdMic, MdStop } from "react-icons/md"; // Replacing icons with react-icons/md
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Groq from "groq-sdk";
import { db, auth } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";



const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true,
});

const apiKey = process.env.REACT_APP_DEEPGRAM_API_KEY!;
const Lastaudio = new Audio(
  "https://github.com/gitone912/testaudio/raw/refs/heads/main/deepgram-stella-1727359968635.mp3"
);

const systemPrompt = `You are Laura, a personal journalist capturing your user’s daily life events. You have a youthful and cheerful personality...`;


const Dialogue = () => {
  const [originalText, setOriginalText] = useState<string>("");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const transcriptBgColor = useColorModeValue("gray.50", "gray.700");
  const responseBgColor = useColorModeValue("yellow.50", "yellow.900");
  const [groqResponse, setGroqResponse] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<string>("");
  const [tempTranscript, setTempTranscript] = useState<string>(""); // New state for temp transcript
  const [isListening, setIsListening] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const navigate = useNavigate();
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const speechTimeout = useRef<NodeJS.Timeout | null>(null);
  const { transcript, resetTranscript } = useSpeechRecognition();
  

  const keepHFPMode = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.setValueAtTime(0, audioContext.currentTime); // No sound
      oscillator.connect(audioContext.destination);
      oscillator.start();

      return { stream, audioContext, oscillator };
    } catch (error) {
      console.error("Error maintaining HFP mode:", error);
    }
  };

  useEffect(() => {
    let audioElements: { stream: MediaStream | null; audioContext: AudioContext | null; oscillator: OscillatorNode | null } = {
      stream: null,
      audioContext: null,
      oscillator: null,
    };

    const initializeHFPMode = async () => {
      audioElements = await keepHFPMode();
    };

    initializeHFPMode();

    return () => {
      if (audioElements.stream) {
        const tracks = audioElements.stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (audioElements.audioContext) {
        audioElements.oscillator!.stop();
        audioElements.audioContext.close();
      }
    };
  }, []);

  const toggleBarAnimation = (play: boolean) => {
    barsRef.current.forEach((item) => {
      if (item) {
        item.style.animationPlayState = play ? "running" : "paused";
      }
    });
  };

  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      toggleBarAnimation(false);
    }
    if (audioUrl === "last") {
      Lastaudio.play();
      return;
    }
    const newAudio = new Audio(audioUrl);
    newAudio.playbackRate = 0.86;
    try {
      newAudio.play();
    } catch (error) {
      alert("Autoplay is blocked. Please click the page to start the audio.");
    }
    setCurrentAudio(newAudio);
    toggleBarAnimation(true);

    newAudio.onended = () => {
      setCurrentAudio(null);
      toggleBarAnimation(false);
    };
  };

  const getDeepgramTTS = async (text: string) => {
    const url = "https://api.deepgram.com/v1/speak?model=aura-stella-en";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const handleSpeechInput = async (transcript: string) => {
    setOriginalText(transcript);
    const updatedChatHistory = `${chatHistory} User: ${transcript} \n AI: ${groqResponse}\n`;

    try {
      setIsProcessing(true);

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `${systemPrompt} ${updatedChatHistory}`,
          },
          { role: "user", content: transcript },
        ],
        model: "llama-3.1-70b-versatile",
      });

      const groqMessage = chatCompletion.choices[0]?.message?.content || "";
      setGroqResponse(groqMessage);

      setChatHistory((prevHistory) => `${prevHistory} User: ${transcript}\nAI: ${groqMessage}\n`);

      const audioUrl = await getDeepgramTTS(groqMessage);
      if (audioUrl) {
        playAudio(audioUrl);
      }

      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
    }
  };

  const compileJournal = async () => {
    try {
      const journalPrompt = `Based on the user's input and the AI's response, compile a concise journal entry. User's input: "${originalText}". AI's response: "${groqResponse}".`;
      const journalCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: journalPrompt }],
        model: "llama3-8b-8192",
      });
      return journalCompletion.choices[0]?.message?.content || "";
    } catch (error) {
      return "";
    }
  };

  const saveChatAndNavigate = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const compiledJournalEntry = await compileJournal();
    const chatData = {
      user: user.email!,
      timestamp: new Date(),
      originalText,
      groqResponse,
      compiledJournal: compiledJournalEntry,
    };

    try {
      playAudio("last");
      await addDoc(collection(db, "chats"), chatData);
      navigate("/admin/journals");
    } catch (error) {
      console.error("Error saving chat:", error);
    }
  };

  const startListening = () => {
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = () => {
    setIsListening(false);
    SpeechRecognition.stopListening();
    saveChatAndNavigate();
    setOriginalText("");
    setGroqResponse("");
    setChatHistory("");
  };

  const toggleConnection = async () => {
    if (isConnected) {
      stopListening();
      setIsConnected(false);
    } else {
      setIsConnecting(true);
      const greetingAudioUrl = await getDeepgramTTS(
        "Hey there, welcome to Audiosmith. How are you?"
      );

      if (greetingAudioUrl) {
        const greetingAudio = new Audio(greetingAudioUrl);

        setIsConnecting(false);
        setIsConnected(true);
        greetingAudio.play();

        greetingAudio.onended = () => {
          startListening();
        };
      } else {
        setIsConnecting(false);
      }
    }
  };

  useEffect(() => {
    if (transcript && isListening) {
      if (speechTimeout.current) {
        clearTimeout(speechTimeout.current);
      }

      speechTimeout.current = setTimeout(() => {
        if (isListening) {
          handleSpeechInput(transcript);
          setTempTranscript(transcript); // Update tempTranscript as speech is recognized
          resetTranscript();
        }
      }, 1500);
    }
  }, [transcript, isListening, resetTranscript]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      setChatHistory("");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <Box minH="100vh" display="flex" justifyContent="center" alignItems="center">
      <VStack spacing={6} align="center">
        {isProcessing && <Spinner color="teal" size="xl" />}

       {/* Temporary Transcript Display */}
{tempTranscript && (
  <Text
    color="gray.500"
    fontStyle="italic"
    textAlign="center" // Center the text
    fontSize={{ base: "sm", md: "lg" }} // Responsive size: smaller on mobile, larger on desktop
    maxW={{ base: "90%", md: "80%", lg: "60%" }} // Responsive width
    mx="auto" // Horizontal center alignment
  >
    {tempTranscript}
  </Text>
)}

{/* AI Response Display */}
{groqResponse && (
  <Text
    color="yellow.500"
    fontStyle="italic"
    textAlign="center"
    fontSize={{ base: "sm", md: "lg" }} // Responsive size
    maxW={{ base: "90%", md: "80%", lg: "60%" }} // Responsive width
    mx="auto"
  >
    {groqResponse}
  </Text>
)}

{/* Transcript Display */}
{transcript && (
  <Text
    color="gray.500"
    fontStyle="italic"
    textAlign="center"
    fontSize={{ base: "sm", md: "lg" }} // Responsive size
    maxW={{ base: "90%", md: "80%", lg: "60%" }} // Responsive width
    mx="auto"
  >
    {transcript}
  </Text>
)}


        {/* Microphone Control */}
        <IconButton
  icon={isConnected ? <MdStop /> : <MdMic />}
  bg="#a1adb7" // Set custom RGB color for the outer circle
  color="white" // Set the icon color (optional, to make sure the icon contrasts well)
  onClick={toggleConnection}
  size="lg"
  isRound
  aria-label={isConnected ? "Stop" : "Start"}
  isDisabled={isProcessing || isConnecting}
  transition="transform 1s ease"
  transform={isConnected ? "translateY(140px)" : "translateY(0px)"}
/>

        <Text
          fontSize={{ base: "sm", md: "lg" }} 
          color={textColor} // Use the variable here
          transition="transform 1s ease"
          transform={isConnected ? "translateY(140px)" : "translateY(0px)"}
        >
          {isConnected
            ? "Connected! Click to End The Conversation"
            : "Disconnected - Click to start the Conversation"}
        </Text>
      </VStack>
    </Box>
  );
};

export default Dialogue;
