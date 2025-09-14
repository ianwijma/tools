import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
} from '@mui/material';
import NavigationLayout from '@/components/NavigationLayout';

export default function Home(): JSX.Element {
  return (
    <NavigationLayout>
      <Box>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Welcome to Online Tools Collection
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          A collection of useful online tools that prioritize frontend execution for performance and privacy.
        </Typography>
        
        <Card sx={{ mt: 4, p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Getting Started
          </Typography>
          <Typography variant="body1" paragraph>
            This project is set up with Material Design and Material UI components, ready for you to add your own tools.
          </Typography>
          <Typography variant="body1" paragraph>
            To add a new tool:
          </Typography>
          <Typography variant="body2" component="div" sx={{ pl: 2 }}>
            1. Create a new page in <code>src/app/[tool-name]/page.tsx</code><br/>
            2. Add the tool to the navigation in <code>src/components/NavigationLayout.tsx</code><br/>
            3. Follow the Material Design guidelines for consistent UI
          </Typography>
        </Card>

        <Card sx={{ mt: 3, p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            About This Project
          </Typography>
          <Typography variant="body1" paragraph>
            This collection of tools is designed with a frontend-first approach, ensuring fast performance 
            and user privacy. Most tools run entirely in your browser, with server-side processing only 
            when necessary for complex operations.
          </Typography>
          <Typography variant="body1">
            All tools follow Material Design principles for a consistent, accessible, and responsive user experience.
          </Typography>
        </Card>
      </Box>
    </NavigationLayout>
  );
}
