"use client";
import { VoiceProvider, useVoice } from "@humeai/voice-react";
import { useEffect, useRef, useState } from "react";
import {
  Box, Flex, IconButton, Spinner, Text, VStack, Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  useToast,
  Icon,
  Progress,
} from "@chakra-ui/react";
import { MdMic, MdStop } from "react-icons/md"; // Mic and Stop icons
import { useNavigate } from "react-router-dom"; // Router for navigation
import Groq from "groq-sdk";
import { db, auth } from "../../../firebase";
import { collection, addDoc } from "firebase/firestore";
import AudioVisualizer from "./AudioVisualizer";
import { IoChevronBackOutline } from "react-icons/io5";
import OpenAI from "openai";

const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true,
});
const openai = new OpenAI({apiKey: process.env.REACT_APP_OPENAI_API_KEY,dangerouslyAllowBrowser: true});
function getConfigId() {
  const voice = localStorage.getItem("userVoice") || "sage"; // Fallback to "shimmer" if not set
  if (voice === "sage") return "7c28f563-25a2-4b41-b5a7-8ffcd61030a3";
  if (voice === "verse") return "947def19-77e0-4f98-8f15-564a42b70fa5";
  return "7c28f563-25a2-4b41-b5a7-8ffcd61030a3"; // default configId
}



export default function UnifiedComponent({ accessToken }: { accessToken: string }) {
  const configId = getConfigId();
  return (
    <VoiceProvider
      auth={{ type: "accessToken", value: accessToken }}
      configId={configId}
    >
      <InnerComponent />
    </VoiceProvider>
  );
}

function InnerComponent() {
  const timeout = useRef<number | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const { disconnect, status, isMuted, unmute, mute, micFft, messages, connect } = useVoice();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [latestUserMessage, setLatestUserMessage] = useState<string | null>(null);
  const [latestAssistantMessage, setLatestAssistantMessage] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [progress, setProgress] = useState(0); // Initialize progress at 0


  // States for typing animation
  const [typedResponse, setTypedResponse] = useState<string>(""); // For simulating the typing animation
  const [finalResponse, setFinalResponse] = useState<string>(""); // For storing the final AI message
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setIsAudioPlaying(status.value === "connected");
  }, [status]);

  useEffect(() => {
    if (timeout.current) {
      window.clearTimeout(timeout.current);
    }

    timeout.current = window.setTimeout(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
      }
    }, 200);
  }, [messages]);

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];

    if (latestMessage) {
      let content = (latestMessage as any)?.message?.content;

      if (latestMessage.type === "user_message") {
        setLatestUserMessage(content);
      } else if (latestMessage.type === "assistant_message") {
        // Prepend a dummy character (non-breaking space)
        content = "\u00A0" + content;

        // Start the typing effect when there's an assistant message
        setFinalResponse(content || "");
        setTypedResponse(""); // Reset the typed response
      }

      if (content) {

        setChatHistory((prevHistory) => [...prevHistory, content]);
      }
    }
  }, [messages]);


  // Typing animation effect
  useEffect(() => {
    let index = 0;

    if (finalResponse) {
      const interval = setInterval(() => {
        setTypedResponse((prev) => prev + finalResponse.charAt(index));
        index++;

        if (index >= finalResponse.length) {
          clearInterval(interval);
        }
      }, 50); // Adjust typing speed

      return () => clearInterval(interval); // Cleanup
    }
  }, [finalResponse]);

  const handleCallClick = async () => {
    if (status.value === "connected") {
      disconnect();
      const user = auth.currentUser;
      if (!user) return;
  
      setIsSaving(true);
      setProgress(10); // Start progress at 10%
  
      const interval = setInterval(() => {
        setProgress(prev => (prev < 80 ? prev + 1 : prev));
      }, 100); // Increment progress every 100ms up to 80%
  
      try {
        const compiledJournalEntry = await compileJournal();
        const chatData = {
          user: user.email!,
          timestamp: new Date(),
          chatHistory,
          compiledJournal: compiledJournalEntry,
        };
        await addDoc(collection(db, "chats"), chatData);
        clearInterval(interval);
        setProgress(100); // Complete progress bar on success
        navigate("/savechat");
      } catch (error) {
        clearInterval(interval);
        console.error("Error saving chat:", error);
        setProgress(0); // Reset progress on error
      } finally {
        setIsSaving(false);
        setTimeout(() => setProgress(0), 500); // Reset progress after a delay
      }
    } else {
      setIsConnecting(true);
      connect().finally(() => setIsConnecting(false));
    }
  };
  

  const compileJournal = async () => {
    try {
      const journalPrompt = `based on the chat history, act as a personal journal assistant who writes a journal entry on the user's behalf. Focus only on translating the user’s confirmed answers, emotions, and reflections into a natural, everyday narrative that reflects their day. Do not infer or assume details that the user hasn't provided. Keep the tone personal and straightforward, like the user is talking casually about their day.

Avoid adding events or emotions unless they were directly mentioned by the user. Only include thoughts, feelings, and points confirmed by the user. Maintain the user's emotions and insights, but remove the structure of direct dialogue. Do not add anything that wasn't explicitly said or implied by the user.

Write in a maximum length of 2,000 characters in several paragraphs, keeping the language simple and clear. If there's not much information, write briefly. If there's more, expand accordingly. Make the journal sound real and relatable, like how an everyday person would talk to themselves. Do not add any greeting or intro like "Dear Journal". Do not make the language flowery or poetic. Stick to normal, simple words that people use today.`;
      const journalCompletion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: journalPrompt },
          { role: "user", content: `Chat History: ${chatHistory}` },
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
          onClick={() => { disconnect(); navigate('../admin')}}
        />
      </Flex>
      <VStack spacing={6} align="center" width="100%" maxW="1200px">

        <AudioVisualizer />

        <IconButton
          icon={isConnecting ? <Spinner color="white" size="md" /> : isAudioPlaying ? <MdStop /> : <MdMic />}
          bg="#9ba192"
          color="white"
          onClick={handleCallClick}
          size="lg"
          isRound
          aria-label={isAudioPlaying ? "Stop" : "Start"}
          isDisabled={isConnecting}
          transition="transform 1s ease"
          transform={isAudioPlaying ? "translateY(180px)" : "translateY(0px)"}
        />

        <Text fontSize={{ base: "sm", md: "lg" }} color="gray.400" transition="transform 1s ease"
          transform={isAudioPlaying ? "translateY(180px)" : "translateY(0px)"}>
          {isConnecting
            ? "Connecting..."
            : isAudioPlaying
              ? "Connected! Click to End The Conversation"
              : "Disconnected - Click to Start the Conversation"}
        </Text>
      </VStack>
    </Box>
      )}
    </>
  );
}
