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




export default function UnifiedComponent({ accessToken }: { accessToken: string }) {
  return (
    <VoiceProvider
      auth={{ type: "accessToken", value: accessToken }}
      configId="7c28f563-25a2-4b41-b5a7-8ffcd61030a3"
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
      const compiledJournalEntry = await compileJournal();
      const chatData = {
        user: user.email!,
        timestamp: new Date(),
        chatHistory,
        compiledJournal: compiledJournalEntry,
      };
      try {
        await addDoc(collection(db, "chats"), chatData);
        setIsSaving(false);
        navigate("/savechat");
      } catch (error) {
        setIsSaving(false);
        console.error("Error saving chat:", error);
      }
    } else {
      setIsConnecting(true);
      connect().finally(() => setIsConnecting(false));
    }
  };

  const compileJournal = async () => {
    try {
      const journalPrompt = `Based on the chat history , act as a personal journal assistant who writes journal entry in user's behalf. Focus exclusively on translating the user’s confirmed answers, emotions, and reflections into a natural narrative that reflects their day. Do not infer or assume details not provided by the user. Ensure the tone is personal, introspective, and authentic, as though the user is recording their own private journal. Do not introduce any events or emotions unless the user has directly referenced them. Only include thoughts, feelings, and points confirmed by the user. Remove dialogue structure, but maintain the essence of the user’s emotions and insights. Avoid adding or imagining details beyond what has been explicitly stated by the user.  Do not mention the date of the journal. Make it a full blown journal entry. Do not add things the user didn't say or imply. Write in a length of about 2,000 characters in several pargaraphs. It should be like this everytime. Not random. Do not make it sound poetic. Just a normal journal entry written by a real human.`;
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
          onClick={() => navigate(-1)} // Navigate to the previous page
        />
      </Flex>
      <VStack spacing={6} align="center" width="100%" maxW="1200px">
        {isSaving && (
          <Modal isOpen={isSaving} onClose={() => { }}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Saving Chat</ModalHeader>
              <ModalBody>
                <Spinner color="teal" size="xl" />
              </ModalBody>
            </ModalContent>
          </Modal>
        )}

        {/* Latest User Message Box */}
        {/* <Box
          w={{ base: "100%", md: "80%", lg: "100%" }}
          maxW="800px"
          minH="150px"
        > */}
        {/* {latestUserMessage && (
            <Text
              color="white"
              textAlign="center"
              fontSize={{ base: "sm", md: "lg" }}
              wordBreak="break-word"
              p={4}
            >
              {latestUserMessage}
            </Text>
          )} */}
        {/* </Box> */}
        <AudioVisualizer />

        {/* <Box
          w={{ base: "100%", md: "80%", lg: "60%" }}
          maxW="100%"
          minH="100px"
        >
          {typedResponse && (
            <Text
              color="#fdde7f"
              textAlign="center"
              fontSize={{ base: "sm", md: "lg" }}
              wordBreak="break-word"
              p={4}
            >
              {typedResponse}
            </Text>
          )}
        </Box> */}

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
  );
}
