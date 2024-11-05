// ConversationalAI.js
import React, { useState } from 'react';
import { useConversation } from '@11labs/react';
import { Box, Progress, Flex, Icon, VStack, IconButton, Spinner,Text } from '@chakra-ui/react';
import { progress } from 'framer-motion';
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
type Language = 'English' | 'German' | 'Hindi';
type Voice = 'sage' | 'verse';

const ConversationalAI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // Array to store chat messages
  const navigate = useNavigate();

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const userDetails = JSON.parse(localStorage.getItem("userDetails") || '{}');
  const fullname = userDetails.displayName || "No name provided, you can ask his/her name"; // Fallback to "Korean" if not set
  const agentIds: Record<Language, Record<Voice, string>> = {
    English: { sage: "xeygTJ4Yhs9JWGo26B1n", verse: "dnahoCWCFsaftsd3sF9L" },
    German: { sage: "CT4BsgMckjcGH2Fp8gsn", verse: "7vMz9pDt7rCmtb8WONOp" },
    Hindi: { sage: "Rxx24annJQReIjjwILkP", verse: "z2a1IlgjNDRNrLiSZ3w7" }
  };
  
  const language = (localStorage.getItem("userLanguage") || "English") as Language;
  const VOICE = (localStorage.getItem("userVoice") || "sage") as Voice;
  
  let agentId: string | undefined;
  
  if (agentIds[language]) {
    agentId = agentIds[language][VOICE];
  }
  


  const { startSession, endSession, status, isSpeaking } = useConversation({
    onConnect: () => {
      console.log("Connected to the conversation");
      setIsConnected(true);
    },
    onDisconnect: () => {
      console.log("Disconnected from the conversation");
      setIsConnected(false);
    },
    onMessage: (item) => {
      console.log("Received message:", item);

      // Extract message text and format it based on role
      let text = item.message || "...";
      if (item.source === 'user') {
        text = `User: ${text}`;
      } else if (item.source === 'ai') {
        text = `AI: ${text}`;
      }

      // Update chat history
      setChatHistory((prevHistory) => [...prevHistory, text]);
    },
    onError: (error) => {
      console.error("Error:", error);
    },
  });

  const handleConnect = async () => {
    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start conversation session with the agent ID
      if (agentIds[language]) {
        agentId = agentIds[language][VOICE];
      }
      
      if (!agentId) {
        console.error("No agent ID found for the selected language and voice.");
      } else {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          await startSession({ agentId });
        } catch (error) {
          console.error("Failed to start conversation:", error);
        }
      }
      await startSession({ agentId });
    } catch (error) {
      console.error("Failed to start conversation:", error);
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
    if (status === "connected") {
     handleDisconnect();
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
          chatHistory,
          compiledJournal: compiledJournalEntry,
        };
        await addDoc(collection(db, "chats"), chatData);
        clearInterval(interval);
        setProgress(100);
        navigate("/savechat");
      } catch (error) {
        clearInterval(interval);
        console.error("Error saving chat:", error);
        setProgress(0);
      } finally {
        setIsSaving(false);
        setTimeout(() => setProgress(0), 500);
      }
    } else {
      setIsConnecting(true);
      handleConnect();
      setIsConnecting(false);
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
              handleDisconnect(); // Disconnect the conversation
              navigate('../admin'); // Navigate to the admin page
            }}
             // Navigate to the previous page
          />
        </Flex>
        <VStack spacing={6} align="center" width="100%" maxW="1200px">

      
          {/* Events Block */}
          <AudioVisualizer />
          {/* Conversation Block */}
          

          {/* Actions */}
          <IconButton
  icon={isConnecting ? <Spinner color="white" size="md" /> : isConnected ? <MdStop /> : <MdMic />}
  bg="#9ba192"
  color="white"
  onClick={handleCallClick}
  size="lg"
  isRound
  aria-label={isConnected ? "Stop" : "Start"}
  isDisabled={isConnecting}  // Prevent double-clicks while connecting
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
};
export default ConversationalAI;