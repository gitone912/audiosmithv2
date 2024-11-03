import { NavLink, useLocation } from 'react-router-dom';
import { Box, Flex, HStack, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { MdLock } from 'react-icons/md';

export function SidebarLinks(props: { routes: RoutesType[]; onClose: () => void }) {
	let location = useLocation();
	let activeColor = useColorModeValue('gray.700', 'white');
	let textColor = useColorModeValue('#474d4', 'white');
	let brandColor = useColorModeValue('brand.500', 'brand.400');

	const { routes, onClose } = props;

	const activeRoute = (routeName: string) => location.pathname.includes(routeName);

	const createLinks = (routes: RoutesType[]) =>
		routes.map((route: RoutesType, index: number) => {
			if (route.layout === '/admin' || route.layout === '/auth' || route.layout === '/rtl') {
				return (
					<NavLink key={index} to={route.layout + route.path} onClick={onClose}>
						<Box
							border="1px solid rgba(255, 255, 255, 0.2)"
							borderRadius="16px"
							mb="15px"
							px="20px"
							py="20px"
							ml="15px"
						>
							<HStack spacing={activeRoute(route.path.toLowerCase()) ? '22px' : '26px'}>
								<Flex w="100%" alignItems="center" justifyContent="center">
									<Box color={activeRoute(route.path.toLowerCase()) ? '#474d4' : textColor} me="18px">
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
									{route.lock && <Icon as={MdLock} color={textColor} w="20px" h="20px" />}
								</Flex>
								<Box h="36px" w="4px" bg={activeRoute(route.path.toLowerCase()) ? brandColor : 'transparent'} borderRadius="5px" />
							</HStack>
						</Box>
					</NavLink>
				);
			}
		});

	return (
		<Box height="100%" overflowY="auto" padding="10px">
			{createLinks(routes)}
		</Box>
	);
}

export default SidebarLinks;
