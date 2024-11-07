// Required imports
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Text,
  VStack,
  IconButton,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  useToast,
  Flex,
  Icon,
  Progress,
} from "@chakra-ui/react";
import { MdMic, MdStop } from "react-icons/md";
import { IoChevronBackOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const Monologue = () => {
  const [connectionStatus, setConnectionStatus] = useState("Disconnected - Click to Start the Conversation");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [tempTranscript, setTempTranscript] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
    const language = (localStorage.getItem("userLanguage") || "English");
    const VOICE = (localStorage.getItem("userVoice") || "sage");

    const startListening = async () => {
      setIsConnecting(true);
      setConnectionStatus("Connecting...");
      const selectedLanguage = language === "German" ? "de" : language === "Hindi" ? "hi" : "en-US";
  
      // Initialize WebSocket connection with enhanced parameters
      socketRef.current = new WebSocket(`wss://api.deepgram.com/v1/listen?language=${selectedLanguage}&model=general-enhanced&profanity_filter=false&filler_words=false&interim_results=false`, [
        "token",
        "e2b10be16ef191908492b50e6deab126112a1d1f",
      ]);
  
      socketRef.current.onopen = () => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
          mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
  
          mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
            if (event.data.size > 0 && socketRef.current?.readyState === 1) {
              socketRef.current.send(event.data);
            }
          });
  
          mediaRecorderRef.current.start(500); // Send audio data every second
        });
        setTimeout(() => {
          setIsConnected(true);
          setIsConnecting(false);
          setConnectionStatus("Connected! Click to End The Conversation");
          console.log("WebSocket connected");
        }, 2000); // 2-second delay
      };
  
      socketRef.current.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel.alternatives[0]?.transcript;
  
        if (transcript && received.is_final) {
          setTempTranscript((prev) => `${prev} ${transcript}`); // Append new text to `tempTranscript`
          console.log("Received transcript:", transcript);
        }
      };
  
      socketRef.current.onclose = () => {
        console.log("WebSocket closed");
        setIsConnected(false);
        setConnectionStatus("Disconnected - Click to Start the Conversation");
      };
  
      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnecting(false);
        setConnectionStatus("Error connecting");
      };
    };
  

  const stopListening = () => {
    mediaRecorderRef.current?.stop();
    socketRef.current?.close();
    setConnectionStatus("Disconnected - Click to Start the Conversation");
    setIsConnected(false);
  };

  const toggleConnection = async () => {
    if (isConnected) {
      stopListening();
      const user = auth.currentUser;
      if (!user) return;

      setIsSaving(true);
      setProgress(10);

      const interval = setInterval(() => {
        setProgress((prev) => (prev < 80 ? prev + 1 : prev));
      }, 100);

      try {
        const compiledJournalEntry = await compileJournal();
        const chatData = {
          user: user.email!,
          timestamp: new Date(),
          chatHistory:tempTranscript,
          compiledJournal: compiledJournalEntry,
        };
        await addDoc(collection(db, "chat_monologue"), chatData);
        clearInterval(interval);
        setProgress(100);
        navigate("/savechatmono");
      } catch (error) {
        clearInterval(interval);
        console.error("Error saving chat:", error);
        setProgress(0);
      } finally {
        setIsSaving(false);
        setTimeout(() => setProgress(0), 500);
      }
    } else {
      startListening();
    }
  };

  const compileJournal = async () => {
    try {
      const journalPrompt = `In ${language} language , Based on the chat history , act as a personal journal assistant who writes journal entry in user's behalf. Focus exclusively on translating the user’s confirmed answers, emotions, and reflections into a natural narrative that reflects their day. Do not infer or assume details not provided by the user. Ensure the tone is personal, introspective, and authentic, as though the user is recording their own private journal. Do not introduce any events or emotions unless the user has directly referenced them. Only include thoughts, feelings, and points confirmed by the user. Remove dialogue structure, but maintain the essence of the user’s emotions and insights. Avoid adding or imagining details beyond what has been explicitly stated by the user.  Do not mention the date of the journal. Make it a full blown journal entry. Do not add things the user didn't say or imply. Write in a length of about 2,000 characters in several pargaraphs. It should be like this everytime. Not random. Do not make it sound poetic. Just a normal journal entry written by a real human.`;
      const journalCompletion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: journalPrompt },
          { role: "user", content: `Chat History: ${tempTranscript}` },
        ],
        model: "gpt-4o",
      });

      return journalCompletion.choices[0]?.message?.content || "";
    } catch (error) {
      return "";
    }
  };

  return (
    <>
    {isSaving ? (
        <Box
        minH="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
        position="fixed"
        top="0"
        left="0"
        width="100%"
        height="100%"
        zIndex="20"
        bg="rgb(51, 56, 46)" // Dark green background
      >
        <Text fontSize="xl" mb={4} color="white">
          Generating Journal Entry
        </Text>
        <Progress
          value={progress}
          size="xs" // Smaller size as shown in the image
          width="200px" // Adjust this width to control the bar's length
          sx={{
            "& > div": {
              backgroundColor: "rgb(137, 142, 133)", // Filling element color
            },
          }}
          bg="rgb(51, 56, 46)" // Non-filled part color to match the background
        />
      </Box>
      ) : (
    <Box minH="100vh" display="flex" justifyContent="center" alignItems="center">
       <Flex
          display={{ sm: 'flex', xl: 'flex' }}
          alignItems="center"
          position="fixed"
          top="20px"
          left="20px"
          zIndex="10"
        >
          <Icon
            as={IoChevronBackOutline}
            color='white'
            w="24px"
            h="24px"
            _hover={{ cursor: 'pointer' }}
            onClick={() => {
              stopListening() // Disconnect the conversation
              navigate('../admin'); // Navigate to the admin page
            }}
             // Navigate to the previous page
          />
        </Flex>
      <VStack spacing={6} align="center">

        <Text color="gray.300" textAlign="center" fontSize={{ base: "sm", md: "lg" }} maxW={{ base: "90%", md: "80%", lg: "60%" }} mx="auto">
          {tempTranscript}
        </Text>

        <IconButton
  icon={isConnecting ? <Spinner color="white" size="md" /> : isConnected ? <MdStop /> : <MdMic />}
  bg="#9ba192"
  color="white"
          onClick={toggleConnection}
          size="lg"
          isRound
          aria-label={isConnected ? "Stop" : "Start"}
          isDisabled={isConnecting}
          transition="transform 1s ease"
  transform={isConnected ? "translateY(180px)" : "translateY(0px)"}
        />

<Text fontSize={{ base: "sm", md: "lg" }} color="gray.400" transition="transform 1s ease"
          transform={isConnected ? "translateY(180px)" : "translateY(0px)"}>
          {connectionStatus}
        </Text>
      </VStack>
    </Box>
    )}
    </>
  );
};

export default Monologue;
