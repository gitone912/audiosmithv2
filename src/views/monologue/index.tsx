// Chakra imports
import {
    Box,
    Text,
    VStack,
    IconButton,
    useColorModeValue,
    Spinner,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    useToast,
    Flex,
    Icon,
  } from "@chakra-ui/react";
  import { MdMic, MdStop } from "react-icons/md"; // Replacing icons with react-icons/md
  import React, { useState, useEffect, useRef } from "react";
  import { useNavigate } from "react-router-dom";
  import { db, auth } from "../../firebase";
  import { collection, addDoc } from "firebase/firestore";
  import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
  import Groq from "groq-sdk";
import { IoChevronBackOutline } from "react-icons/io5";
  

  const groq = new Groq({
    apiKey: process.env.REACT_APP_GROQ_API_KEY!,
    dangerouslyAllowBrowser: true,
  });
  const Monologue = () => {
    const [originalText, setOriginalText] = useState<string>("");
    const textColor = useColorModeValue("gray.800", "gray.100");
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<string>(""); // Full chat history
    const [tempTranscript, setTempTranscript] = useState<string>(""); // Append transcripts as they come
    const [isListening, setIsListening] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [firstSpeech, setFirstSpeech] = useState<boolean>(true); // Track if it's the first speech
    const navigate = useNavigate();
    const speechTimeout = useRef<NodeJS.Timeout | null>(null);
    const { transcript, resetTranscript } = useSpeechRecognition();
     // Check if the browser is Chrome
     const toast = useToast(); // Initialize the toast hook

  // Check if the browser is Chrome
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
  
    const compileJournal = async () => {
        try {
          const journalPrompt = `Based on the user's input, compile a concise journal entry. User's input: "${tempTranscript}".`;
          const journalCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: journalPrompt }],
            model: "llama3-8b-8192",
          });
          return journalCompletion.choices[0]?.message?.content || "";
        } catch (error) {
          return "";
        }
      };


      const saveChatAndNavigate = async () => {
        const user = auth.currentUser;
        if (!user) return;
      
        setIsSaving(true); // Start showing saving modal
      
        const compiledJournalEntry = await compileJournal();
        const chatData = {
          user: user.email!,
          timestamp: new Date(),
          original_text: tempTranscript,
          compiledJournal: compiledJournalEntry, // Save the user's speech as-is
        };
      
        try {
          await addDoc(collection(db, "chat_monologue"), chatData); // Save to 'chat_monologue' collection
          setIsSaving(false); // Hide saving modal
          navigate("/savechatmono");
        } catch (error) {
          setIsSaving(false); // Hide saving modal even on error
          console.error("Error saving chat:", error);
        }
      };
      
  
    const handleSpeechInput = async (transcript: string) => {
      setOriginalText(transcript);
      setChatHistory((prevHistory) => `${prevHistory} User: ${transcript}\n`);
      setTempTranscript((prevTranscript) => `${prevTranscript} ${transcript}\n`); // Append transcripts
      setFirstSpeech(false); // First speech has now occurred
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
      setChatHistory("");
      setTempTranscript("");
    };
  
    const toggleConnection = async () => {
      if (isConnected) {
        stopListening();
        setIsConnected(false);
      } else {
        setIsConnecting(true);
        setIsConnecting(false);
        setIsConnected(true);
        startListening();
      }
    };
  
    useEffect(() => {
      handleSpeechInput(transcript);
      }, [transcript]);
      
  
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
        <Flex
        display={{ sm: 'none', xl: 'flex' }}
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
        <VStack spacing={6} align="center">     
        {isSaving && (
      <Modal isOpen={isSaving} onClose={() => {}}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Saving Chat</ModalHeader>
          <ModalBody>
            <Spinner color="teal" size="xl" />
            <Text textAlign="center" mt={4}>Please wait while we save your chat...</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    )}
            
          {isProcessing && <Spinner color="teal" size="xl" />}
          {/* Show "Speak to Write" only when connected and hide after first speech */}
          {isConnected && firstSpeech && (
            <Text
              color="gray.400"
              textAlign="center"
              fontSize={{ base: "md", md: "lg" }}
            >
              Speak to Write
            </Text>
          )}
  
  
          {/* Transcript Display */}
          {transcript && (
            <Text
              color="gray.300"
              textAlign="center"
              fontSize={{ base: "sm", md: "lg" }} // Responsive size
              maxW={{ base: "90%", md: "80%", lg: "60%" }} // Responsive width
              mx="auto"
            >
              {transcript}
            </Text>
          )}
  
          <IconButton
            icon={isConnecting ? <Spinner color="white" size="md" /> : isConnected ? <MdStop /> : <MdMic />}
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
              ? "Connecting..."
              : isConnected
              ? "Connected! Click to End The Conversation"
              : "Disconnected - Click to Start the Conversation"}
          </Text>
        </VStack>
      </Box>
    );
  };
  
  export default Monologue;
  