"use client";
import { VoiceProvider, useVoice } from "@humeai/voice-react";
import { useEffect, useRef, useState } from "react";
import { Box, Flex, IconButton, Spinner, Text, VStack } from "@chakra-ui/react";
import { MdMic, MdStop } from "react-icons/md"; // Mic and Stop icons
import { useNavigate } from "react-router-dom"; // Router for navigation

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
  const router = useNavigate();

  const { disconnect, status, isMuted, unmute, mute, micFft, messages, connect } = useVoice();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [latestUserMessage, setLatestUserMessage] = useState<string | null>(null);
  const [latestAssistantMessage, setLatestAssistantMessage] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<string[]>([]);

  // States for typing animation
  const [typedResponse, setTypedResponse] = useState<string>(""); // For simulating the typing animation
  const [finalResponse, setFinalResponse] = useState<string>(""); // For storing the final AI message

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
      }, 65); // Adjust typing speed

      return () => clearInterval(interval); // Cleanup
    }
  }, [finalResponse]);

  const handleCallClick = () => {
    if (status.value === "connected") {
      disconnect();
      router("/admin/session"); 
    } else {
      setIsConnecting(true);
      connect().finally(() => setIsConnecting(false));
    }
  };

  return (
   <Box minH="100vh" display="flex" justifyContent="center" alignItems="center">
    <VStack spacing={6} align="center" width="100%" maxW="1200px">
      
      {/* Latest User Message Box */}
      <Box
      w={{ base: "100%", md: "80%", lg: "60%" }}  
      maxW="100%"  
      minH="100px"  
    >
      {latestUserMessage && (
        <Text
          color="white"
          fontStyle="italic"
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
          fontStyle="italic"
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
            bg="teal.500"
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
