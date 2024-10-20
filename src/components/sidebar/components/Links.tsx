/* eslint-disable */

import { NavLink, useLocation } from 'react-router-dom';
// chakra imports
import { Box, Flex, HStack, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { MdLock } from 'react-icons/md';

export function SidebarLinks(props: {
	routes: RoutesType[];
}) {
	//   Chakra color mode
	let location = useLocation();
	let activeColor = useColorModeValue('gray.700', 'white');
	let inactiveColor = useColorModeValue('secondaryGray.600', 'secondaryGray.600');
	let activeIcon = useColorModeValue('brand.500', 'white');
	let textColor = useColorModeValue('secondaryGray.500', 'white');
	let brandColor = useColorModeValue('brand.500', 'brand.400');

	const { routes } = props;

	// verifies if routeName is the one active (in browser input)
	const activeRoute = (routeName: string) => {
		return location.pathname.includes(routeName);
	};

	
	const createLinks = (
		routes: RoutesType[],
	) => {
		return routes.map(
			(
				route: RoutesType,
				index: number
			) => {
				if (route.layout === '/admin' || route.layout === '/auth' || route.layout === '/rtl') {
					return (
						<NavLink key={index} to={route.layout + route.path}>
							{route.icon ? (
								<Box
									border="1px solid rgba(255, 255, 255, 0.2)" // Thinner, semi-transparent white border
									borderRadius="16px" 
									mb="15px" 
									px="20px" 
									py="20px" 
									ml="15px" 
								>
									<HStack spacing={activeRoute(route.path.toLowerCase()) ? '22px' : '26px'}>
										<Flex w="100%" alignItems="center" justifyContent="center">
											<Box
												color={activeRoute(route.path.toLowerCase()) ? activeIcon : textColor}
												me="18px"
											>
												{route.icon}
											</Box>
											<Text
												me="auto"
												color={activeRoute(route.path.toLowerCase()) ? activeColor : textColor}
												fontWeight={activeRoute(route.path.toLowerCase()) ? 'bold' : 'normal'}
												fontSize="lg"
												opacity={route.lock ? 0.2 : 1} 
											>
												{route.name}
											</Text>
											{route.lock && ( 
												<Icon as={MdLock} color={textColor} w="20px" h="20px" />
											)}
										</Flex>
										<Box
											h="36px"
											w="4px"
											bg={activeRoute(route.path.toLowerCase()) ? brandColor : 'transparent'}
											borderRadius="5px"
										/>
									</HStack>
								</Box>
							) : (
								<Box
									border="1px solid rgba(255, 255, 255, 0.6)" // Thinner, semi-transparent white border
									borderRadius="8px" // Optional: rounded corners
									mb="10px" // Adds space between links
									px="15px" // Padding inside box, left and right
									py="10px" // Padding inside box, top and bottom
									ml="10px" // Padding on the left to prevent touching the sidebar border
								>
									<HStack
										spacing={activeRoute(route.path.toLowerCase()) ? '22px' : '26px'}>
										<Text
											me='auto'
											color={activeRoute(route.path.toLowerCase()) ? activeColor : inactiveColor}
											fontWeight={activeRoute(route.path.toLowerCase()) ? 'bold' : 'normal'}
											fontSize="lg" // Larger font size
										>
											{route.name}
										</Text>
										<Box h='36px' w='4px' bg='brand.400' borderRadius='5px' />
									</HStack>
								</Box>
							)}
						</NavLink>
					);
				}
			}
		);
	};
	
	return <>{createLinks(routes)}</>
}

export default SidebarLinks;
