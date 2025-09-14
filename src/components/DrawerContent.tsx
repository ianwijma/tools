'use client';

import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Typography,
} from '@mui/material';
import type { ToolCategory } from '@/types';

interface DrawerContentProps {
  categories: ToolCategory[];
}

export default function DrawerContent({
  categories,
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
      {categories.length === 0 ? (
        <List>
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
        </List>
      ) : (
        categories.map((category, categoryIndex) => (
          <Box key={category.name}>
            <List
              subheader={
                <ListSubheader
                  component="div"
                  sx={{
                    backgroundColor: 'transparent',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'primary.main',
                    lineHeight: '2.5rem',
                  }}
                >
                  {category.name}
                </ListSubheader>
              }
            >
              {category.tools.map((tool) => (
                <ListItem key={tool.name} disablePadding>
                  <ListItemButton
                    component="a"
                    href={tool.href}
                    sx={{
                      pl: 2,
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
              ))}
            </List>
            {categoryIndex < categories.length - 1 && (
              <Divider sx={{ mx: 2, my: 1 }} />
            )}
          </Box>
        ))
      )}
    </Box>
  );
}
