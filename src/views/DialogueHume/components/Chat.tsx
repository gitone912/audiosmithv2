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

  // Variables to store latest messages and chat history
  const [latestUserMessage, setLatestUserMessage] = useState<string | null>(null);
  const [latestAssistantMessage, setLatestAssistantMessage] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<string[]>([]); // Array to hold the full conversation history

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
    // Whenever messages change, update the latest message and chat history
    const latestMessage = messages[messages.length - 1];
  
    if (latestMessage) {
      if (latestMessage.type === "user_message" || latestMessage.type === "assistant_message") {
        // Ensure 'message' property exists on the latestMessage object
        const content = (latestMessage as any).message?.content;
        
        if (latestMessage.type === "user_message") {
          setLatestUserMessage(content);
        } else if (latestMessage.type === "assistant_message") {
          setLatestAssistantMessage(content);
        }
  
        // Add the message content to the chat history
        if (content) {
          setChatHistory((prevHistory) => [...prevHistory, content]);
        }
      }
    }
  }, [messages]);
  

  const handleCallClick = () => {
    if (status.value === "connected") {
      disconnect();
      router("/admin/session"); // Navigate to dashboard after disconnect
    } else {
      setIsConnecting(true);
      connect().finally(() => setIsConnecting(false));
    }
  };

  return (
    <>
      {/* Messages Section */}
      <Box minH="100vh" display="flex" justifyContent="center" alignItems="center">
        <VStack spacing={6} align="center">

          {/* Display the latest user message */}
          <Box
  bg="transparent" // Transparent background
  p={4}            // Add some padding if needed
>
          {latestUserMessage && (
                <Text
                  color="white"
                  fontStyle="italic"
                  textAlign="center"
                  fontSize={{ base: "sm", md: "lg" }}
                  maxW={{ base: "90%", md: "80%", lg: "60%" }}
                  mx="auto"
                >
                  {latestUserMessage}
                </Text>
          )}
           </Box>
           <Box
  bg="transparent" // Transparent background
  p={4}            
>
          {/* Display the latest assistant message */}
          {latestAssistantMessage && (

                <Text
                  color="#fdde7f"
                  fontStyle="italic"
                  textAlign="center"
                  fontSize={{ base: "sm", md: "lg" }}
                  maxW={{ base: "90%", md: "80%", lg: "60%" }}
                  mx="auto"
                >
                  {latestAssistantMessage}
                </Text>
          )}
         </Box>

          <IconButton
            icon={
              isConnecting ? (
                <Spinner color="white" size="md" />
              )
                : status.value === "connected" ? (
                  <MdStop />
                ) : (
                  <MdMic />
                )
            }
            bg="#a1adb7"
            color="white"
            onClick={handleCallClick}
            size="lg"
            isRound
            aria-label={status.value === "connected" ? "Stop" : "Start"}
            isDisabled={isConnecting}
            transition="transform 1s ease"
            transform={status.value === "connected" ? "translateY(140px)" : "translateY(0px)"}
          />

          {/* Status Text */}
          <Text
            fontSize={{ base: "sm", md: "lg" }}
            color="gray.400"
            transition="transform 1s ease"
            transform={status.value === "connected" ? "translateY(140px)" : "translateY(0px)"}
            ml={4}
          >
            {isConnecting
              ? "Connecting..."
              : status.value === "connected"
                ? "Connected! Click to End The Conversation"
                : "Disconnected - Click to Start the Conversation"}
          </Text>

        </VStack>
      </Box>
    </>
  );
}
