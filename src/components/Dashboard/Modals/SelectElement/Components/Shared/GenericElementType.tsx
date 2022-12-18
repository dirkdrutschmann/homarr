import { Button, Card, Center, Grid, Stack, Text } from '@mantine/core';
import { TablerIcon } from '@tabler/icons';
import Image from 'next/image';
import React from 'react';
import { useStyles } from './styles';

interface GenericAvailableElementTypeProps {
  name: string;
  description?: string;
  image: string | TablerIcon;
  disabled?: boolean;
}

export const GenericAvailableElementType = ({
  name,
  description,
  image,
  disabled,
}: GenericAvailableElementTypeProps) => {
  const { classes } = useStyles();

  const Icon =
    typeof image === 'string' ? () => <Image src={image} width={24} height={24} /> : image;

  return (
    <Grid.Col span={3}>
      <Card style={{ height: '100%' }}>
        <Stack justify="space-between" style={{ height: '100%' }}>
          <Stack spacing="xs">
            <Center>
              <Icon />
            </Center>
            <Text className={classes.elementText} align="center">
              {name}
            </Text>
            {description && (
              <Text className={classes.elementText} size="xs" align="center" color="dimmed">
                {description}
              </Text>
            )}
          </Stack>
          <Button disabled={disabled} variant="light" size="xs" mt="auto" radius="md" fullWidth>
            Add to Dashboard
          </Button>
        </Stack>
      </Card>
    </Grid.Col>
  );
};
