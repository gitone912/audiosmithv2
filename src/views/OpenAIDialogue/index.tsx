const LOCAL_RELAY_SERVER_URL: string = '';

import { useEffect, useRef, useCallback, useState } from 'react';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from './wavtools/index.js';
import { instructions } from './utils/conversation_config.js';
import { WavRenderer } from './utils/wav_renderer';
import { EditIcon, CloseIcon, WarningIcon } from "@chakra-ui/icons"; // Replace with your actual icons
import OpenAI from "openai";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

import {
  Box,
  Flex,
  Image,
  Text,
  VStack,
  HStack,
  Stack,
  Divider,
  Button,
  Progress,
  IconButton,
  Spinner,
  Icon,
} from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import { MdStop, MdMic } from 'react-icons/md';
import { IoChevronBackOutline } from 'react-icons/io5';
import { getPrompt } from './utils/system';
import AudioVisualizer from 'views/DialogueHume/components/AudioVisualizer';

const openai = new OpenAI({apiKey: process.env.REACT_APP_OPENAI_API_KEY,dangerouslyAllowBrowser: true});

interface RealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  event: { [key: string]: any };
}

export function OpenAIDialoguePage() {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  );
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient(
      LOCAL_RELAY_SERVER_URL
        ? { url: LOCAL_RELAY_SERVER_URL }
        : { apiKey: apiKey, dangerouslyAllowAPIKeyInBrowser: true }
    )
  );
  const language = localStorage.getItem("userLanguage") || "English"; // Fallback to "Korean" if not set
  const userDetails = JSON.parse(localStorage.getItem("userDetails") || '{}');
  const fullname = userDetails.displayName || "No name provided, you can ask his/her name"; // Fallback to "Korean" if not set
  console.log(fullname)
   // Fallback to "shimmer" if not set
  const SYSTEM_MESSAGE = getPrompt(language);

  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventsScrollHeightRef = useRef(0);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  const [items, setItems] = useState<ItemType[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<{ [key: string]: boolean }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [memoryKv, setMemoryKv] = useState<{ [key: string]: any }>({});


  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  const [latestUserMessage, setLatestUserMessage] = useState<string | null>(null);
  const [latestAssistantMessage, setLatestAssistantMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0); // Initialize progress at 0


  // States for typing animation
  const [typedResponse, setTypedResponse] = useState<string>(""); // For simulating the typing animation
  const [finalResponse, setFinalResponse] = useState<string>(""); // For storing the final AI message
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleCallClick = async () => {
    if (isConnected) {
      disconnectConversation();
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
      setIsConnecting(true); // Begin "Connecting..." state
      await connectConversation();
      setIsConnecting(false);  // Transition to "Connected" state
      setIsAudioPlaying(true);
    }
  };
  
  const compileJournal = async () => {
    try {
      const journalPrompt = `use this langauge ${language} and Based on the chat history , act as a personal journal assistant who writes journal entry in user's behalf. Focus exclusively on translating the user’s confirmed answers, emotions, and reflections into a natural narrative that reflects their day. Do not infer or assume details not provided by the user. Ensure the tone is personal, introspective, and authentic, as though the user is recording their own private journal. Do not introduce any events or emotions unless the user has directly referenced them. Only include thoughts, feelings, and points confirmed by the user. Remove dialogue structure, but maintain the essence of the user’s emotions and insights. Avoid adding or imagining details beyond what has been explicitly stated by the user.  Do not mention the date of the journal. Make it a full blown journal entry. Do not add things the user didn't say or imply. Write in a length of about 2,000 characters in several pargaraphs in ${language}. It should be like this everytime. Not random. Do not make it sound poetic. Just a normal journal entry written by a real human.`;
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

  const connectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    startTimeRef.current = new Date().toISOString();
    setIsConnected(true);
    setRealtimeEvents([]);
    setItems(client.conversation.getItems());

    await wavRecorder.begin();
    await wavStreamPlayer.connect();
    await client.connect();
    const VOICE = localStorage.getItem("userVoice") || "sage";
    client.updateSession({  voice: VOICE as "alloy" | "shimmer" | "echo", instructions: SYSTEM_MESSAGE });
    client.sendUserMessageContent([
      { type: `input_text`, text: `information: this is user's name ${fullname}, start you conversation in ${language}by saying this - Hi ${fullname}, I'm ${VOICE === "sage" ? "Laura" : "William"}. Mindleaf's mental health and journaling companion. How do you feel today?` }
    ]);

    changeTurnEndType();
  }, []);

  const disconnectConversation = useCallback(async () => {
    setIsConnected(false);
    setRealtimeEvents([]);
    setItems([]);
    setMemoryKv({});

    const client = clientRef.current;
    client.disconnect();

    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.end();

    const wavStreamPlayer = wavStreamPlayerRef.current;
    await wavStreamPlayer.interrupt();
  }, []);

  const deleteConversationItem = useCallback(async (id: string) => {
    const client = clientRef.current;
    client.deleteItem(id);
  }, []);

  const changeTurnEndType = async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;

    client.updateSession({ turn_detection: { type: 'server_vad' } });

    if (client.isConnected()) {
      await wavRecorder.record((data: any) => client.appendInputAudio(data.mono));
    }
  };

  useEffect(() => {
    if (eventsScrollRef.current) {
      const eventsEl = eventsScrollRef.current;
      const scrollHeight = eventsEl.scrollHeight;
      if (scrollHeight !== eventsScrollHeightRef.current) {
        eventsEl.scrollTop = scrollHeight;
        eventsScrollHeightRef.current = scrollHeight;
      }
    }
  }, [realtimeEvents]);

  useEffect(() => {
    const conversationEls = [].slice.call(
      document.body.querySelectorAll('[data-conversation-content]')
    );
    for (const el of conversationEls) {
      const conversationEl = el as HTMLDivElement;
      conversationEl.scrollTop = conversationEl.scrollHeight;
    }
  }, [items]);

  useEffect(() => {
    let isLoaded = true;

    const wavRecorder = wavRecorderRef.current;
    const clientCanvas = clientCanvasRef.current;
    let clientCtx: CanvasRenderingContext2D | null = null;

    const wavStreamPlayer = wavStreamPlayerRef.current;
    const serverCanvas = serverCanvasRef.current;
    let serverCtx: CanvasRenderingContext2D | null = null;

    const render = () => {
      if (isLoaded) {
        if (clientCanvas) {
          if (!clientCanvas.width || !clientCanvas.height) {
            clientCanvas.width = clientCanvas.offsetWidth;
            clientCanvas.height = clientCanvas.offsetHeight;
          }
          clientCtx = clientCtx || clientCanvas.getContext('2d');
          if (clientCtx) {
            clientCtx.clearRect(0, 0, clientCanvas.width, clientCanvas.height);
            const result = wavRecorder.recording
              ? wavRecorder.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              clientCanvas,
              clientCtx,
              result.values,
              '#0099ff',
              10,
              0,
              8
            );
          }
        }
        if (serverCanvas) {
          if (!serverCanvas.width || !serverCanvas.height) {
            serverCanvas.width = serverCanvas.offsetWidth;
            serverCanvas.height = serverCanvas.offsetHeight;
          }
          serverCtx = serverCtx || serverCanvas.getContext('2d');
          if (serverCtx) {
            serverCtx.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
            const result = wavStreamPlayer.analyser
              ? wavStreamPlayer.getFrequencies('voice')
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              serverCanvas,
              serverCtx,
              result.values,
              '#009900',
              10,
              0,
              8
            );
          }
        }
        window.requestAnimationFrame(render);
      }
    };
    render();

    return () => {
      isLoaded = false;
    };
  }, []);

  

  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events, and more
   */
  useEffect(() => {
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;

    // Set instructions
    client.updateSession({ instructions: instructions });
    // Set transcription, otherwise we don't get user transcriptions back
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });

    // Add tools
    client.addTool(
      {
        name: 'set_memory',
        description: 'Saves important data about the user into memory.',
        parameters: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description:
                'The key of the memory value. Always use lowercase and underscores, no other characters.',
            },
            value: {
              type: 'string',
              description: 'Value can be anything represented as a string',
            },
          },
          required: ['key', 'value'],
        },
      },
      async ({ key, value }: { [key: string]: any }) => {
        setMemoryKv((memoryKv) => {
          const newKv = { ...memoryKv };
          newKv[key] = value;
          return newKv;
        });
        return { ok: true };
      }
    );

    // handle realtime events from client + server for event logging
    client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
      setRealtimeEvents((realtimeEvents) => {
        const lastEvent = realtimeEvents[realtimeEvents.length - 1];
        if (lastEvent?.event.type === realtimeEvent.event.type) {
          // if we receive multiple events in a row, aggregate them for display purposes
          lastEvent.count = (lastEvent.count || 0) + 1;
          return realtimeEvents.slice(0, -1).concat(lastEvent);
        } else {
          return realtimeEvents.concat(realtimeEvent);
        }
      });
    });

    client.on('error', (event: any) => console.error(event));
    client.on('conversation.interrupted', async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    });

    client.on('conversation.updated', async ({ item, delta }: any) => {
      const items = client.conversation.getItems();
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      if (item.status === 'completed') {
        let text = item.formatted.transcript || item.formatted.text || "...";
        // Format chat history based on the role
        if (item.role === 'user') {
          text = `user: ${text}`;
        } else if (item.role === 'assistant') {
          text = `AI: ${text}`;
        }
        setChatHistory((prevHistory) => [...prevHistory, text]);
      }
      if (item.status === 'completed' && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000
        );
        item.formatted.file = wavFile;
      }
      setItems(items);
    });

    setItems(client.conversation.getItems());

    return () => {
      // cleanup; resets to defaults
      client.reset();
    };
  }, []);


  useEffect(() => {
    if (!isConnected) {
      console.log("Chat History:", chatHistory);
    }
  }, [isConnected, chatHistory]);

  /**
   * Render the application
   */
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
              disconnectConversation(); // Disconnect the conversation
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

