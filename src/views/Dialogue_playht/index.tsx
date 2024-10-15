// Chakra imports
import {
  Box,
  Text,
  VStack,
  Button,
  IconButton,
  useColorModeValue,
  Spinner,
  keyframes,
  Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    useToast,
} from "@chakra-ui/react";
import { MdMic, MdStop } from "react-icons/md"; // Replacing icons with react-icons/md
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Groq from "groq-sdk";
import { db, auth } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { localPrompt , jPrompt, tPrompt} from "systemPrompt";




const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true,
});


  
const systemPrompt = {localPrompt};
// console.log(localPrompt)


const DialoguePht = () => {
  const [originalText, setOriginalText] = useState<string>("");
  const textColor = useColorModeValue("gray.800", "gray.100");

  const [groqResponse, setGroqResponse] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<string>("");
  const [tempTranscript, setTempTranscript] = useState<string>(""); // New state for temp transcript
  const [isListening, setIsListening] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const navigate = useNavigate();
  const speechTimeout = useRef<NodeJS.Timeout | null>(null);
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [typedResponse, setTypedResponse] = useState<string>(""); // New state for typing animation
  const [finalResponse, setFinalResponse] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);


   // Check if the browser is Chrome
   const toast = useToast(); // Initialize the toast hook
   const {browserSupportsSpeechRecognition } = useSpeechRecognition()

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      // Show Chakra UI toast instead of an alert
      toast({
        title: "Unsupported Browser",
        description: "The Dialogue feature is only for chrome for now, in future we will allow this browser as well . We Highly Recommend to switch to Google Chrome for a better experience.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top", // Show toast at the top of the screen
      });
    }
  }, [browserSupportsSpeechRecognition, toast]);
  useEffect(() => {
    let index = 0;

    if (groqResponse && isPlaying) {
      // Start typing the new response
      const interval = setInterval(() => {
        setTypedResponse((prev) => prev + groqResponse.charAt(index));
        index++;

        // Once typing completes, store the final response and clear the interval
        if (index >= groqResponse.length) {
          clearInterval(interval);
          setFinalResponse(groqResponse); // Save the completed message
        }
      }, 50); // Adjust typing speed (50ms per character)

      return () => clearInterval(interval); // Cleanup on unmount or dependency change
    } else {
      setTypedResponse(""); // Reset if audio isn't playing yet
    }
  }, [groqResponse, isPlaying]);
  const keepHFPMode = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
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

  

  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    const newAudio = new Audio(audioUrl);
    newAudio.playbackRate = 0.86;

    try {
      newAudio.play();
      setIsPlaying(true);
    } catch (error) {
      alert("Autoplay blocked. Please click the page to start the audio.");
    }

    setCurrentAudio(newAudio);
    newAudio.onended = () => {
      setCurrentAudio(null);
      setIsPlaying(false);
    };
  };
  const renderResponse = () => {
    if (typedResponse) return typedResponse; // Show typing animation if in progress
    return finalResponse; // Show the last fully typed response if no animation
  };

  const getPlayHTTTS = async (text:string) => {
    try {
      const response = await fetch('http://localhost:5000/playht-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
  
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } else {
        console.error('Backend Error:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error:', error);
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
        max_tokens: 40,
      });

      const groqMessage = chatCompletion.choices[0]?.message?.content || "";
      setGroqResponse(groqMessage);

      setChatHistory((prevHistory) => `${prevHistory} User: ${transcript}\nAI: ${groqMessage}\n`);

      const audioUrl = await getPlayHTTTS(groqMessage);
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
      const journalPrompt = `${jPrompt}. Conversation history: "${chatHistory}".`;
      console.log(journalPrompt)
      const journalCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: journalPrompt }],
        model: "llama-3.1-70b-versatile",
      });
  
      return journalCompletion.choices[0]?.message?.content || "";
    } catch (error) {
      return "";
    }
  };
  
  const compileTitle = async () => {
    try {
      const journalPrompt = `you are a title maker ,Based on the user's input, return a two words journal title, your response only should be two words title, returning more than two words or anything except title is prohibited. User's input: "${tempTranscript}".`;
      const journalCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: journalPrompt }],
        model: "llama-3.1-70b-versatile",
      });
      return journalCompletion.choices[0]?.message?.content || "";
    } catch (error) {
      return "";
    }
  };

  const saveChatAndNavigate = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSaving(true); 
    const compiledJournalEntry = await compileJournal();
    const compiledTitle = await compileTitle();
    const chatData = {
      user: user.email!,
      timestamp: new Date(),
      originalText,
      groqResponse,
      title: compiledTitle,
      compiledJournal: compiledJournalEntry,
    };

    // playAudio("https://github.com/gitone912/testaudio/raw/refs/heads/main/deepgram-stella-1727359968635.mp3");
    try {
      await addDoc(collection(db, "chats"), chatData);
      setIsSaving(false);
      navigate("/savechat");
    } catch (error) {
      setIsSaving(false);
      console.error("Error saving chat:", error);
    }
  };

  const startListening = () => {
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true ,language:'en-CA'});
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
      const greetingAudioUrl = await getPlayHTTTS(
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
  const waveAnimation = keyframes`
    0% { height: 5px }
    50% { height: 20px }
    100% { height: 5px }
  `;

  // Waveform component
  const Waveform = () => (
    <Box display="flex" gap="2px" alignItems="center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Box
          key={i}
          bg="white"
          width="4px"
          borderRadius="2px"
          animation={`${waveAnimation} 0.5s ease-in-out ${i * 0.1}s infinite`}
        />
      ))}
    </Box>
  );


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
      }, 2000);
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
      {isSaving && (
      <Modal isOpen={isSaving} onClose={() => {}}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Saving Chat</ModalHeader>
          <ModalBody>
            <Spinner color="teal" size="xl" />
          </ModalBody>
        </ModalContent>
      </Modal>
    )}
        {isProcessing && <Spinner color="teal" size="xl" />}

       {/* Temporary Transcript Display */}
{tempTranscript && (
  <Text
    color={textColor}
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
<Text
          color="#fdde7f"
          fontStyle="italic"
          textAlign="center"
          fontSize={{ base: "sm", md: "lg" }}
          maxW={{ base: "90%", md: "80%", lg: "60%" }}
          mx="auto"
        >
          {renderResponse()} {/* Display the correct text based on animation progress */}
        </Text>

{/* Transcript Display */}
{transcript && (
  <Text
    color='gray.300'
    fontStyle="italic"
    textAlign="center"
    fontSize={{ base: "sm", md: "lg" }} // Responsive size
    maxW={{ base: "90%", md: "80%", lg: "60%" }} // Responsive width
    mx="auto"
  >
    {transcript}
  </Text>
)}


<IconButton
  icon={
    isConnecting ? ( // Show Spinner when connecting
      <Spinner color="white" size="md" />
    ) : isConnected ? (
      isPlaying ? (
        <Waveform /> // Show waveform when playing
      ) : (
        <MdStop /> // Show stop icon when connected but not playing
      )
    ) : (
      <MdMic /> // Show mic icon when disconnected
    )
  }
  bg="#a1adb7"
  color="white"
  onClick={toggleConnection}
  size="lg"
  isRound
  aria-label={isConnected ? "Stop" : "Start"}
  isDisabled={isProcessing || isConnecting} // Disable during processing or connecting
  transition="transform 1s ease"
  transform={isConnected ? "translateY(140px)" : "translateY(0px)"}
/>

<Text
  fontSize={{ base: "sm", md: "lg" }}
  color="gray.400"
  transition="transform 1s ease"
  transform={isConnected ? "translateY(140px)" : "translateY(0px)"}
>
  {isConnecting
    ? "Connecting..." // Show "Connecting..." text during connection attempt
    : isConnected
    ? "Connected! Click to End The Conversation"
    : "Disconnected - Click to Start the Conversation"}
</Text>

      </VStack>
    </Box>
  );
};

export default DialoguePht;
