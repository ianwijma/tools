'use client';

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import type { Tool } from '@/types';

interface DrawerContentProps {
  tools: Tool[];
}

export default function DrawerContent({
  tools,
}: DrawerContentProps): JSX.Element {
  return (
    <Box>
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ fontWeight: 'bold' }}
        >
          Online Tools
        </Typography>
      </Toolbar>
      <List>
        {tools.length === 0 ? (
          <ListItem>
            <ListItemText
              primary="No tools available yet"
              secondary="Tools will appear here as they are implemented"
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'text.secondary',
              }}
              secondaryTypographyProps={{
                fontSize: '0.75rem',
              }}
            />
          </ListItem>
        ) : (
          tools.map((tool: Tool) => (
            <ListItem key={tool.name} disablePadding>
              <ListItemButton
                component="a"
                href={tool.href}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon>{tool.icon}</ListItemIcon>
                <ListItemText
                  primary={tool.name}
                  secondary={tool.description}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );
}
