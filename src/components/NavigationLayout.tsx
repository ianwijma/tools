'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Container,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
} from '@mui/icons-material';
import type { Tool, NavigationLayoutProps } from '@/types';

const drawerWidth: number = 280;

// Tools will be added here as they are implemented
const tools: Tool[] = [];

export default function NavigationLayout({ children }: NavigationLayoutProps): JSX.Element {
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const muiTheme = useTheme();

  const handleDrawerToggle = (): void => {
    setMobileOpen(!mobileOpen);
  };

  const drawer: JSX.Element = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
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
          tools.map((tool) => (
            <ListItem key={tool.name} disablePadding>
              <ListItemButton
                component="a"
                href={tool.href}
                sx={{
                  '&:hover': {
                    backgroundColor: muiTheme.palette.action.hover,
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

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Online Tools Collection
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  );
}
