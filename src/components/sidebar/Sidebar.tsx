import React, { useState } from 'react';
import {
  Box,
  Flex,
  Drawer,
  DrawerBody,
  Icon,
  useColorModeValue,
  DrawerOverlay,
  useDisclosure,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import Content from 'components/sidebar/components/Content';
import { renderThumb, renderTrack, renderView } from 'components/scrollbar/Scrollbar';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { IoChevronForwardOutline, IoChevronBackOutline } from 'react-icons/io5'; // New icons

function Sidebar(props: {
  routes: RoutesType[];
  setSidebarOpen: (open: boolean) => void;
  isOpen: boolean; // <-- Add this to props
}) {
  const { routes, setSidebarOpen, isOpen } = props;

  let variantChange = '0.2s linear';
  let shadow = useColorModeValue('14px 17px 40px 4px rgba(112, 144, 176, 0.08)', 'unset');
  let sidebarBg = useColorModeValue('white', 'rgb(75, 80, 70)');
  let sidebarMargins = '0px';

  // Disclosure for opening/closing sidebar in desktop mode
  const { onOpen, onClose } = useDisclosure();

  // Manage sidebar state
  const toggleSidebar = () => {
    setSidebarOpen(!isOpen);
    if (isOpen) {
      onClose();
      setSidebarOpen(false); // Notify parent to adjust content width
    } else {
      onOpen();
      setSidebarOpen(true);  // Notify parent to adjust content width
    }
  };

  return (
    <>
      {/* Toggle icon for desktop mode */}
      <Flex
  display={{ sm: 'none', xl: 'flex' }} // Hide on small screens, show on desktop
  alignItems="center"
  position="fixed"
  top="20px"
  left="20px"
  zIndex="10"
>
  <Icon
    as={isOpen ? IoChevronBackOutline : IoChevronForwardOutline}
    color={useColorModeValue('gray.400', 'white')}
    w="24px"
    h="24px"
    _hover={{ cursor: 'pointer' }}
    onClick={toggleSidebar}
  />
</Flex>


      {/* Sidebar for desktop mode */}
      {isOpen && (
        <Box display={{ sm: 'none', xl: 'block' }} position="fixed" minH="100%">
          <Box
            bg={sidebarBg}
            transition={variantChange}
            w="350px"
            h="100vh"
            m={sidebarMargins}
            minH="100%"
            overflowX="hidden"
            boxShadow={shadow}
          >
            
              <Content routes={routes} onClose={onClose} />

          </Box>
        </Box>
      )}
    </>
  );
}

// SidebarResponsive remains unchanged
export function SidebarResponsive(props: { routes: RoutesType[] }) {
  let sidebarBackgroundColor = useColorModeValue('white', 'rgb(75, 80, 70)');
  let menuColor = useColorModeValue('gray.400', 'white');
  const { isOpen, onOpen, onClose } = useDisclosure(); // Track state
  const btnRef = React.useRef();

  const { routes } = props;

  return (
    <Flex display={{ sm: 'flex', xl: 'none' }} alignItems="center">
      <Flex ref={btnRef} w="max-content" h="max-content" onClick={onOpen}>
        <Icon
          as={IoChevronForwardOutline}
          color={menuColor}
          my="auto"
          w="20px"
          h="20px"
          me="10px"
          _hover={{ cursor: 'pointer' }}
        />
      </Flex>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        placement={document.documentElement.dir === 'rtl' ? 'right' : 'left'}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay />
        <DrawerContent w="300px" maxW="300px" bg={sidebarBackgroundColor}>
          <DrawerCloseButton
            zIndex="3"
            onClick={onClose}
            _focus={{ boxShadow: 'none' }}
            _hover={{ boxShadow: 'none' }}
          />
          <DrawerBody maxW="285px" px="0rem" pb="0">
            <Scrollbars
              autoHide
              renderTrackVertical={renderTrack}
              renderThumbVertical={renderThumb}
              renderView={renderView}
            >
              <Content routes={routes} onClose={onClose} /> {/* Pass onClose */}
            </Scrollbars>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
}

// PROPS
export default Sidebar;
