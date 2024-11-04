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
import { collection, addDoc } from "firebase/firestore";
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
} from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';

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
  const SYSTEM_MESSAGE = 'You are a helpful and bubbly human assistant named pinky who loves to chat about anything and flirts a lot the user is interested about and is prepared to offer them facts. You have a penchant for dad jokes, owl jokes, and rickrolling – subtly. Always stay positive, but work in a joke when appropriate.';
  const VOICE = 'alloy';

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
      setIsConnecting(true);
      connectConversation();
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
    client.updateSession({ voice: VOICE, instructions: SYSTEM_MESSAGE });
    client.sendUserMessageContent([
      { type: `input_text`, text: `Hello!` }
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
    <Box
      data-component="ConsolePage"
      fontFamily="'Roboto Mono', monospace"
      fontWeight="400"
      fontStyle="normal"
      fontSize="12px"
      height="100%"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      mx="2"
    >

      {/* Content Main */}
      <Flex
        className="content-main"
        flex="1"
        mx="4"
        display="flex"
        overflow="hidden"
        mb="6"
      >
        {/* Content Logs */}
        <Flex className="content-logs" flex="1" direction="column" overflow="hidden">
          {/* Events Block */}
          <Box className="content-block events" flex="1" position="relative">
            <Box className="visualization">
              <Flex className="visualization-entry client" color="#0099ff" gap="2">
                <canvas ref={clientCanvasRef} width="100" height="40" />
              </Flex>
              <Flex className="visualization-entry server" color="#009900" gap="2">
                <canvas ref={serverCanvasRef} width="100" height="40" />
              </Flex>
            </Box>
          </Box>

          {/* Conversation Block */}
          <Box
            className="content-block conversation"
            flex="none"
            width="100%"
            height="200px"
            overflow="hidden"
            borderTop="1px solid #e7e7e7"
            mt="4"
          >
            <Text className="content-block-title" px="4" pt="4" pb="1">
              conversation
            </Text>
            <Box
              className="content-block-body"
              px="2"
              overflow="auto"
              data-conversation-content
              height="calc(200px - 24px)"
            >
              {!items.length && "awaiting connection..."}
              {items.map((conversationItem) => (
                <Flex
                  key={conversationItem.id}
                  className="conversation-item"
                  position="relative"
                  align="flex-start"
                  gap="4"
                  mb="4"
                  _hover={{ ".close": { display: "flex" } }}
                >
                  {/* Speaker */}
                  <VStack
                    className={`speaker ${conversationItem.role || ""}`}
                    align="start"
                    width="80px"
                    color={
                      conversationItem.role === "user"
                        ? "#0099ff"
                        : conversationItem.role === "assistant"
                        ? "#009900"
                        : "#101010"
                    }
                  >
                    <Text>
                      {(conversationItem.role || conversationItem.type).replaceAll(
                        "_",
                        " "
                      )}
                    </Text>
                    <Box
                      className="close"
                      position="absolute"
                      top="0"
                      right="-5"
                      bg="#aaa"
                      color="#fff"
                      display="none"
                      borderRadius="full"
                      p="0.5"
                      cursor="pointer"
                      _hover={{ bg: "#696969" }}
                      onClick={() => deleteConversationItem(conversationItem.id)}
                    >
                      <CloseIcon boxSize="3" />
                    </Box>
                  </VStack>

                  {/* Speaker Content */}
                  <Box className="speaker-content" color="#18181b" wordBreak="break-word">
                    {/* Function Call Output */}
                    {conversationItem.type === "function_call_output" && (
                      <Text>{conversationItem.formatted.output}</Text>
                    )}
                    {/* Tool Call */}
                    {conversationItem.formatted.tool && (
                      <Text>
                        {conversationItem.formatted.tool.name}(
                        {conversationItem.formatted.tool.arguments})
                      </Text>
                    )}
                    {/* User Message */}
                    {!conversationItem.formatted.tool &&
                      conversationItem.role === "user" && (
                        <Text>
                          {conversationItem.formatted.transcript ||
                            (conversationItem.formatted.audio?.length
                              ? "(awaiting transcript)"
                              : conversationItem.formatted.text ||
                                "(item sent)")}
                        </Text>
                      )}
                    {/* Assistant Message */}
                    {!conversationItem.formatted.tool &&
                      conversationItem.role === "assistant" && (
                        <Text>
                          {conversationItem.formatted.transcript ||
                            conversationItem.formatted.text ||
                            "(truncated)"}
                        </Text>
                      )}
                  </Box>
                </Flex>
              ))}
            </Box>
          </Box>

          {/* Actions */}
          <Flex
            className="content-actions"
            align="center"
            justify="center"
            gap="4"
            mt="4"
          >
            <Box flex="1" />
            <Button
              colorScheme={isConnected ? "gray" : "blue"}
              variant={isConnected ? "outline" : "solid"}
              onClick={handleCallClick}
            >
              {isConnected ? "Disconnect" : "Connect"}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Box>
     )}
    </>
  );
};

