import React, { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Box, Progress, Flex, Icon, VStack, IconButton, Spinner, Text } from '@chakra-ui/react';
import { IoChevronBackOutline } from 'react-icons/io5';
import { MdStop, MdMic } from 'react-icons/md';
import AudioVisualizer from './components/AudioVisualizer';
import { useNavigate } from 'react-router-dom';
import OpenAI from 'openai';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const ConversationalAI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const navigate = useNavigate();

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0); // Track reconnection attempts

  const userDetails = JSON.parse(localStorage.getItem("userDetails") || '{}');
  const fullname = userDetails.displayName || "No name provided, you can ask his/her name";

  const agentIds: { [key: string]: { [key: string]: string } } = {
    English: { sage: "xeygTJ4Yhs9JWGo26B1n", verse: "dnahoCWCFsaftsd3sF9L" },
    German: { sage: "CT4BsgMckjcGH2Fp8gsn", verse: "7vMz9pDt7rCmtb8WONOp" },
    Hindi: { sage: "Rxx24annJQReIjjwILkP", verse: "z2a1IlgjNDRNrLiSZ3w7" }
  };
  
  const language = (localStorage.getItem("userLanguage") || "English");
  const VOICE = (localStorage.getItem("userVoice") || "sage");
  const agentId = agentIds[language]?.[VOICE];

  const { startSession, endSession, status, isSpeaking } = useConversation({
    onConnect: () => {
      console.log("Connected to the conversation");
      setIsConnecting(false);
      setIsConnected(true);
      setReconnectAttempts(0); // Reset reconnection attempts
    },
    onDisconnect: () => {
      console.log("Disconnected from the conversation");
      setIsConnected(false);

      // Reconnect if disconnected unexpectedly
      if (status !== "disconnected") {
        console.log("Attempting to reconnect...");
        if (reconnectAttempts < 3) {  // Limit the reconnection attempts
          setTimeout(() => handleConnect(), 2000); // Retry connection after a delay
          setReconnectAttempts(reconnectAttempts + 1);
        }
      }
    },
    onMessage: (item) => {
      const text = item.source === 'user' ? `User: ${item.message}` : `AI: ${item.message}`;
      setChatHistory(prevHistory => [...prevHistory, text]);
    },
    onError: (error) => {
      console.error("WebSocket Error:", error);
      setIsConnecting(false); // Stop connecting on error
    },
  });

  const handleConnect = async () => {
    try {
      if (status === "connected" || status === "connecting") return; // Prevent multiple connections

      setIsConnecting(true);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      if (agentId) {
        await startSession({ agentId });
      } else {
        console.error("No agent ID found for the selected language and voice.");
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await endSession();
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  };

  const handleCallClick = async () => {
    if (isConnected) {
      handleDisconnect();
      saveChatHistory();
    } else {
      handleConnect();
    }
  };

  const saveChatHistory = async () => {
    setIsSaving(true);
    setProgress(10);
    const interval = setInterval(() => setProgress(prev => (prev < 80 ? prev + 1 : prev)), 100);

    try {
      const compiledJournalEntry = await compileJournal();
      const chatData = {
        user: auth.currentUser?.email || 'Anonymous',
        timestamp: new Date(),
        chatHistory,
        compiledJournal: compiledJournalEntry,
      };
      await addDoc(collection(db, "chats"), chatData);
      setProgress(100);
      navigate("/savechat");
    } catch (error) {
      console.error("Error saving chat:", error);
    } finally {
      clearInterval(interval);
      setIsSaving(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const compileJournal = async () => {
    try {
      const journalPrompt = `...`;  // Truncated for readability
      const journalCompletion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: journalPrompt },
          { role: "user", content: `Chat History: ${chatHistory.join("\n")}` },
        ],
        model: "gpt-4",
      });
      return journalCompletion.choices[0]?.message?.content || "";
    } catch (error) {
      return "";
    }
  };

  return (
    <>
      {isSaving ? (
        <Box minH="100vh" display="flex" justifyContent="center" alignItems="center" bg="rgb(51, 56, 46)" position="fixed" top="0" left="0" width="100%" zIndex="20">
          <Text fontSize="xl" mb={4} color="white">Generating Journal Entry</Text>
          <Progress value={progress} size="xs" width="200px" bg="rgb(51, 56, 46)" sx={{ "& > div": { backgroundColor: "rgb(137, 142, 133)" } }} />
        </Box>
      ) : (
        <Box minH="100vh" display="flex" justifyContent="center" alignItems="center">
          <Flex position="fixed" top="20px" left="20px" zIndex="10">
            <Icon as={IoChevronBackOutline} color="white" w="24px" h="24px" _hover={{ cursor: 'pointer' }} onClick={() => { handleDisconnect(); navigate('../admin'); }} />
          </Flex>
          <VStack spacing={6} align="center" width="100%" maxW="1200px">
            <AudioVisualizer />
            <IconButton
              icon={isConnecting ? <Spinner color="white" size="md" /> : isConnected ? <MdStop /> : <MdMic />}
              bg="#9ba192"
              color="white"
              onClick={handleCallClick}
              size="lg"
              isRound
              aria-label={isConnected ? "Stop" : "Start"}
              isDisabled={isConnecting}
              transition="transform 0.5s ease"
              transform={isConnected ? "translateY(180px)" : "translateY(0px)"}
            />
            <Text fontSize={{ base: "sm", md: "lg" }} color="gray.400" transition="transform 0.5s ease" transform={isConnected ? "translateY(180px)" : "translateY(0px)"}>
              {isConnecting ? "Connecting..." : isConnected ? "Connected! Click to End The Conversation" : "Disconnected - Click to Start the Conversation"}
            </Text>
          </VStack>
        </Box>
      )}
    </>
  );
};

export default ConversationalAI;
