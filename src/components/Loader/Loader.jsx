import {
  HStack,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Stack,
  SimpleGrid,
} from "@chakra-ui/react";

export const Loader = () => {
  const loaders = Array.from({ length: 10 });

  return (
    <SimpleGrid m={6} columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={8}>
      {loaders.map((_, idx) => (
        <Stack gap="6" maxW="xs" key={idx}>
          <HStack width="full">
            <SkeletonCircle size="10" />
            <SkeletonText noOfLines={2} />
          </HStack>
          <Skeleton height="200px" />
        </Stack>
      ))}
    </SimpleGrid>
  );
};

