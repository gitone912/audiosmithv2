import { Box, Flex, Stack } from '@chakra-ui/react';
import Brand from 'components/sidebar/components/Brand';
import SidebarLinks from './Links';

function SidebarContent(props: { routes: RoutesType[]; onClose: () => void }) {
	const { routes, onClose } = props;

	return (
		<Flex direction="column" height="100vh" pt="25px" borderRadius="30px" pe={{ lg: '16px', '2xl': '16px' }}>
			<Brand />
			<Stack direction="column" mt="8px" mb="auto" overflowY="auto" height="calc(100vh - 100px)">
				<Box ps="20px" pe={{ lg: '16px', '2xl': '16px' }}>
					<SidebarLinks routes={routes} onClose={onClose} />
				</Box>
			</Stack>
		</Flex>
	);
}

export default SidebarContent;
