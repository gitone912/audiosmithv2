/**
 * Running a local relay server will allow you to hide your API key
 * and run custom logic on the server
 *
 * Set the local relay server address to:
 * REACT_APP_LOCAL_RELAY_SERVER_URL=http://localhost:8081
 *
 * This will also require you to set OPENAI_API_KEY= in a `.env` file
 * You can run it with `npm run relay`, in parallel with `npm start`
 */
const LOCAL_RELAY_SERVER_URL: string = '';

import { useEffect, useRef, useCallback, useState } from 'react';

import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from './wavtools/index.js';
import { instructions } from './utils/conversation_config.js';
import { WavRenderer } from './utils/wav_renderer';
import { EditIcon, CloseIcon, WarningIcon } from "@chakra-ui/icons"; // Replace with your actual icons

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
} from "@chakra-ui/react";

/**
 * Type for all event logs
 */
interface RealtimeEvent {
  time: string;
  source: 'client' | 'server';
  count?: number;
  event: { [key: string]: any };
}

export function OpenAIDialoguePage() {
  /**
   * Ask user for API Key
   * If we're using the local relay server, we don't need this
   */
  const apiKey =process.env.REACT_APP_OPENAI_API_KEY;


  /**
   * Instantiate:
   * - WavRecorder (speech input)
   * - WavStreamPlayer (speech output)
   * - RealtimeClient (API client)
   */
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
        : {
            apiKey: apiKey,
            dangerouslyAllowAPIKeyInBrowser: true,
          }
    )
  );
  const SYSTEM_MESSAGE = 'You are a helpful and bubbly human assistant named pinky who loves to chat about anything and flirts a lot the user is interested about and is prepared to offer them facts. You have a penchant for dad jokes, owl jokes, and rickrolling – subtly. Always stay positive, but work in a joke when appropriate.';
const VOICE = 'alloy';

  /**
   * References for
   * - Rendering audio visualization (canvas)
   * - Autoscrolling event logs
   * - Timing delta for event log displays
   */
  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventsScrollHeightRef = useRef(0);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  /**
   * All of our variables for displaying application state
   * - items are all conversation items (dialog)
   * - realtimeEvents are event logs, which can be expanded
   * - memoryKv is for set_memory() function
   * - coords, marker are for get_weather() function
   */
  const [items, setItems] = useState<ItemType[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<{
    [key: string]: boolean;
  }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [memoryKv, setMemoryKv] = useState<{ [key: string]: any }>({});


  
  /**
   * When you click the API key
   */


  /**
   * Connect to conversation:
   * WavRecorder taks speech input, WavStreamPlayer output, client is API client
   */
  const connectConversation = useCallback(async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    

    // Set state variables
    startTimeRef.current = new Date().toISOString();
    setIsConnected(true);
    setRealtimeEvents([]);
    setItems(client.conversation.getItems());

    // Connect to microphone
    await wavRecorder.begin();

    // Connect to audio output
    await wavStreamPlayer.connect();

    // Connect to realtime API
    await client.connect();
    client.updateSession({
      voice: VOICE,
      instructions: SYSTEM_MESSAGE,
    }
    )
    client.sendUserMessageContent([
      {
        type: `input_text`,
        text: `Hello!`,
        
        // text: `For testing purposes, I want you to list ten car brands. Number each item, e.g. "one (or whatever number you are one): the item name".`
      },
    ]);

    changeTurnEndType();
  }, []);

  /**
   * Disconnect and reset conversation state
   */
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

  /**
   * In push-to-talk mode, start recording
   * .appendInputAudio() for each sample
   */

  /**
   * Switch between Manual <> VAD mode for communication
   */
  const changeTurnEndType = async () => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
  
    // Set turn detection to server_vad by default
    client.updateSession({
      turn_detection: { type: 'server_vad' },
    });
  
    // Start recording if connected
    if (client.isConnected()) {
      await wavRecorder.record((data: any) => client.appendInputAudio(data.mono));
    }
  };
  /**
   * Auto-scroll the event logs
   */
  useEffect(() => {
    if (eventsScrollRef.current) {
      const eventsEl = eventsScrollRef.current;
      const scrollHeight = eventsEl.scrollHeight;
      // Only scroll if height has just changed
      if (scrollHeight !== eventsScrollHeightRef.current) {
        eventsEl.scrollTop = scrollHeight;
        eventsScrollHeightRef.current = scrollHeight;
      }
    }
  }, [realtimeEvents]);

  /**
   * Auto-scroll the conversation logs
   */
  useEffect(() => {
    const conversationEls = [].slice.call(
      document.body.querySelectorAll('[data-conversation-content]')
    );
    for (const el of conversationEls) {
      const conversationEl = el as HTMLDivElement;
      conversationEl.scrollTop = conversationEl.scrollHeight;
    }
  }, [items]);

  /**
   * Set up render loops for the visualization canvas
   */
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
   * Set all of our instructions, tools, events and more
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

  /**
   * Render the application
   */
  return (
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
  onClick={isConnected ? disconnectConversation : connectConversation}
>
  {isConnected ? "Disconnect" : "Connect"}
</Button>
          </Flex>
        </Flex>

       
      </Flex>
    </Box>
  );
};