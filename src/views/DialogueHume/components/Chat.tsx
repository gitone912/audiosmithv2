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
} from "@chakra-ui/react";
import { MdMic, MdStop } from "react-icons/md"; // Mic and Stop icons
import { useNavigate } from "react-router-dom"; // Router for navigation
import Groq from "groq-sdk";
import { db, auth } from "../../../firebase";
import { collection, addDoc } from "firebase/firestore";

const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY!,
  dangerouslyAllowBrowser: true,
});


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
      const journalPrompt = `Based on the user's input and the AI's response, compile a concise and short journal entry. focus on translating the user's answers into a natural narrative that reflects their day, emotions, observations, and reflections. The tone should be personal, introspective, and authentic, as though the user is recording their thoughts for their own private journal. Do not mention AI, just use AI responses to understand the user's daily life context. try not to assume and add events on your own. Conversation history: "${chatHistory}".`;
      const journalCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: journalPrompt }],
        model: "llama3-groq-70b-8192-tool-use-preview",
      });

      return journalCompletion.choices[0]?.message?.content || "";
    } catch (error) {
      return "";
    }
  };

  return (
    <Box minH="100vh" display="flex" justifyContent="center" alignItems="center">
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
        <Box
          w={{ base: "100%", md: "80%", lg: "60%" }}
          maxW="100%"
          minH="100px"
        >
          {latestUserMessage && (
            <Text
              color="white"
              textAlign="center"
              fontSize={{ base: "sm", md: "lg" }}
              wordBreak="break-word"
              p={4}
            >
              {latestUserMessage}
            </Text>
          )}
        </Box>

        <Box
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
        </Box>

        <IconButton
          icon={isConnecting ? <Spinner color="white" size="md" /> : isAudioPlaying ? <MdStop /> : <MdMic />}
          bg="#a1adb7"
          color="white"
          onClick={handleCallClick}
          size="lg"
          isRound
          aria-label={isAudioPlaying ? "Stop" : "Start"}
          isDisabled={isConnecting}
        />

        <Text fontSize={{ base: "sm", md: "lg" }} color="gray.400">
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
