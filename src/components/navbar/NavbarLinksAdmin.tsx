import {
	Avatar,
	Button,
	Flex,
	Icon,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Text,
	useColorModeValue,
	useColorMode
} from '@chakra-ui/react';
import React from 'react';
import { MdNotificationsNone } from 'react-icons/md';
import { IoMdMoon, IoMdSunny } from 'react-icons/io';
import { FaEthereum } from 'react-icons/fa';
import { SidebarResponsive } from 'components/sidebar/Sidebar';
import routes from 'routes';
import { useNavigate } from 'react-router-dom'; // Use React Router's useNavigate for navigation

export default function HeaderLinks(props:any) {
	const { secondary } = props;
	const { colorMode, toggleColorMode } = useColorMode();
	const navbarIcon = useColorModeValue('gray.400', 'white');
	let menuBg = useColorModeValue('white', '#6c7069');
	const buttonBg = useColorModeValue('white', '#60645b');
	const textColor = useColorModeValue('secondaryGray.900', 'white');
	const textColorBrand = useColorModeValue('brand.700', 'brand.400');
	const ethColor = useColorModeValue('gray.700', 'white');
	const shadow = useColorModeValue('14px 17px 40px 4px rgba(112, 144, 176, 0.18)', '14px 17px 40px 4px rgba(112, 144, 176, 0.06)');
	const borderColor = useColorModeValue('#E6ECFA', 'rgba(135, 140, 189, 0.3)');
	const borderButton = useColorModeValue('secondaryGray.500', 'whiteAlpha.200');
	
	const navigate = useNavigate(); // React Router's hook for navigation
	
	// Fetch username from localStorage
	const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
	const username = userDetails.displayName || 'User'; // Default to 'User' if username is not found
	
	return (
		<Flex
			w={{ sm: '100%', md: 'auto' }}
			alignItems='center'
			flexDirection='row'
			bg={menuBg}
			flexWrap={secondary ? { base: 'wrap', md: 'nowrap' } : 'unset'}
			p='10px'
			borderRadius='30px'
			boxShadow={shadow}>
			
			<SidebarResponsive routes={routes} />
			<Menu>
				<MenuButton p='0px'>
					<Icon mt='6px' as={MdNotificationsNone} color={navbarIcon} w='18px' h='18px' me='10px' />
				</MenuButton>
			</Menu>

			<Button
				variant='no-hover'
				bg='transparent'
				p='0px'
				minW='unset'
				minH='unset'
				h='18px'
				w='max-content'
				onClick={toggleColorMode}>
				<Icon
					me='10px'
					h='18px'
					w='18px'
					color={navbarIcon}
					as={colorMode === 'light' ? IoMdMoon : IoMdSunny}
				/>
			</Button>
			<Menu>
				<MenuButton p='0px'>
					<Avatar
						_hover={{ cursor: 'pointer' }}
						color='white'
						name={username} // Use dynamic username here
						bg='#474d41'
						size='sm'
						w='40px'
						h='40px'
					/>
				</MenuButton>
				<MenuList boxShadow={shadow} p='0px' mt='10px' borderRadius='20px' bg={menuBg} border='none'>
					<Flex w='100%' mb='0px'>
						<Text
							ps='20px'
							pt='16px'
							pb='10px'
							w='100%'
							borderBottom='1px solid'
							borderColor={borderColor}
							fontSize='sm'
							fontWeight='700'
							color={textColor}>
								
							👋&nbsp; Hey, {username} {/* Replace 'Adela' with the dynamic username */}
						</Text>
					</Flex>
					<Flex flexDirection='column' p='10px'>
  <MenuItem
    borderRadius='8px'
    px='14px'
    bg={buttonBg}
    onClick={() => navigate('/profile')} // Navigate to profile
  >
    <Text fontSize='sm'>Settings</Text>
  </MenuItem>

  <MenuItem
    mt='10px' // Adds margin-top to the second MenuItem
    color='red.400'
    borderRadius='8px'
    px='14px'
    bg={buttonBg}
    onClick={() => navigate('/sign-out')} // Navigate to sign-out
  >
    <Text fontSize='sm'>Log out</Text>
  </MenuItem>
</Flex>

				</MenuList>
			</Menu>
		</Flex>
	);
}
