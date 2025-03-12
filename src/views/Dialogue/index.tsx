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




const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true,
});

const apiKey = process.env.REACT_APP_DEEPGRAM_API_KEY!;

const systemPrompt  = `
You are Laura, a mental health expert and personal journalist
Your role is that of an AI assistant for mental health and a journalist who is taking their daily life note and helping them.
The user will ask a question for help regarding mental health or as an answer to a question based on chat history.
Your goal is to help users using cognitive behavioral therapy by giving a understanding, empathetic, engaging, and discursive response.
You should be knowledgeable about all aspects of this technique and be able to provide clear and concise answers to users questions.
Start the conversation naturally with a question and keep responses short. Ask one question at a time, after 3 questions, gently shift to another aspect of the user’s day. If the user do not want to continue the conversation suggest to the user to click 'stop' button to save the conversation.
do not repeat any question again

Remember to maintain a non-judgmental and compassionate tone while providing the answer. and do not repeat same questions or phrases again, try to act like a normal human.

use triple dots ... instead of single full stop 

Use the following chat history provided to aid in the answer to the question.
`;


// console.log(localPrompt)


const Dialogue = () => {
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
    // Stop any current audio that is playing
    if (currentAudio) {
      currentAudio.pause(); // Pause the current audio
      currentAudio.currentTime = 0; // Reset to the start
      setCurrentAudio(null); // Clear the current audio
    }
  
    // Create new audio object
    const newAudio = new Audio(audioUrl);
    newAudio.playbackRate = 0.95;
  
    // Try to play the new audio
    try {
      newAudio.play();
      setIsPlaying(true); // Set playing state
      setCurrentAudio(newAudio); // Set the new audio as current
    } catch (error) {
      alert("Autoplay blocked. Please click the page to start the audio.");
    }
  
    // Handle the end of the audio playback
    newAudio.onended = () => {
      setIsPlaying(false); // Update playing state
      setCurrentAudio(null); // Clear the current audio
    };
  
    // In case the audio errors out during playback
    newAudio.onerror = () => {
      setIsPlaying(false); // Ensure playing state is false
      setCurrentAudio(null); // Clear the current audio
    };
  };
  
  const renderResponse = () => {
    if (typedResponse) return typedResponse; // Show typing animation if in progress
    return finalResponse; // Show the last fully typed response if no animation
  };

  const getDeepgramTTS = async (text: string) => {
    const url = "https://api.deepgram.com/v1/speak?model=aura-athena-en";

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
        model: "llama3-groq-70b-8192-tool-use-preview",
        max_tokens: 70,
      });
      console.log(updatedChatHistory)

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
      const journalPrompt = `Based on the user's input and the AI's response, compile a concise  journal entry. focus on translating the user's answers into a natural narrative that reflects their day, emotions, observations, and reflections. The tone should be personal, introspective, and authentic, as though the user is recording their thoughts for their own private journal. Do not mention AI, just use AI responses to understand the user's daily life context. try not to assume and add events on your own. Capture the thoughts, feelings, and key points discussed, and rewrite it in the style of personal reflection. Remove dialogue structure, but maintain the essence of the user’s emotions and insights, as if they are reflecting on the experience themselves. Do not add date or any greetings. The beginning should be a concise summary of what the user feels for that day. Don't start with "Today, I woke up feeling..." or something like that. Make it unique every time so that the entry is different for each day. Make the sound of it natural as if a real person is writing it. Don't make it sound too complicated or too formal. Conversation history: "${chatHistory}".`;
      const journalCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: journalPrompt }],
        model: "llama3-groq-70b-8192-tool-use-preview",
      });
  
      return journalCompletion.choices[0]?.message?.content || "";
    } catch (error) {
      return "";
    }
  };
  
  const compileTitle = async () => {
    try {
      const journalPrompt = `you are a title maker ,Based on the user's input, return a two words journal title, your response only should be two words title, returning more than two words or anything except title is prohibited. User's input: "${chatHistory}".`;
      const journalCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: journalPrompt }],
        model: "llama3-groq-70b-8192-tool-use-preview",
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
      chatHistory,
      title: compiledTitle,
      compiledJournal: compiledJournalEntry,
      moodEmoji:"",
      mood:"",
      summary:"",
      actions:""
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
      const greetingAudioUrl = await getDeepgramTTS(
        "Hey there, welcome to Mindleaf. How are you?"
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
  bg="#9ba192"
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

export default Dialogue;
