import { createTheme, PaletteMode } from '@mui/material';
import {
    grey,
    blueGrey,
    teal, // Using Teal as primary
    amber, // Using Amber/Gold as secondary
    common,
} from '@mui/material/colors';

// Define base font settings
const baseTypography = {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', // Default sans-serif for UI elements/headings
    h1: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', fontWeight: 500 },
    h2: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', fontWeight: 500 },
    h3: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', fontWeight: 500 },
    h4: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', fontWeight: 500, fontSize: '1.8rem' },
    h5: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', fontWeight: 500, fontSize: '1.5rem' },
    h6: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', fontWeight: 500, fontSize: '1.25rem' },
    // Set body text to use the serif font for readability
    body1: { fontFamily: '"Noto Serif", "Georgia", serif', lineHeight: 1.7, fontSize: '1rem' },
    body2: { fontFamily: '"Noto Serif", "Georgia", serif', lineHeight: 1.6, fontSize: '0.9rem' },
    button: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }, // Removed textTransform
    caption: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
    overline: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
};

export const getTheme = (mode: PaletteMode) => createTheme({
  palette: {
    mode, // This sets the base mode (light or dark)
    ...(mode === 'light'
      ? {
          // --- Light Mode Palette ---
          primary: {
            main: teal[800], // Deep teal
            contrastText: common.white,
          },
          secondary: {
            main: amber[700], // Gold/Amber accent
            contrastText: grey[900],
          },
          background: {
            default: grey[100], // Light grey background
            paper: common.white, // White paper elements (cards, etc.)
          },
          text: {
            primary: blueGrey[900], // Very dark blue-grey for text
            secondary: blueGrey[700], // Lighter blue-grey
          },
          divider: grey[300], // Light divider
        }
      : {
          // --- Dark Mode Palette ---
          primary: {
            main: teal[300], // Lighter teal for dark mode
            contrastText: grey[900],
          },
          secondary: {
            main: amber[300], // Lighter amber
            contrastText: grey[900],
          },
          background: {
            default: '#1a1a1a', // Very dark grey, slightly off-black
            paper: '#262626',   // Darker paper surface
          },
          text: {
            primary: grey[100], // Off-white text
            secondary: grey[400], // Lighter grey secondary text
          },
          divider: grey[800], // Dark divider
        }),
  },
  typography: baseTypography, // Use the base typography settings
  components: {
    // --- Component Overrides ---
    MuiAppBar: { // Example: Make AppBar slightly different in dark mode
        styleOverrides: {
            root: ({ theme }) => ({
                backgroundColor: theme.palette.mode === 'dark' ? grey[900] : theme.palette.primary.main,
            }),
        },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
            // Subtle border in dark mode, slightly more noticeable in light
            border: theme.palette.mode === 'dark' ? `1px solid ${grey[800]}` : `1px solid ${grey[300]}`,
            boxShadow: 'none', // Cleaner look, rely on borders/backgrounds
        })
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
           borderRadius: 4, // Slightly less rounded
           textTransform: 'none', // Moved textTransform here - it belongs in MuiButton styling, not typography
        },
        containedSecondary: ({ theme }) => ({ // Ensure secondary button text is readable
            color: theme.palette.secondary.contrastText,
        }),
      }
    },
    MuiLink: { // Style links to use accent colors
        styleOverrides: {
            root: ({ theme }) => ({
                color: theme.palette.primary.main, // Use primary color for links
                textDecoration: 'none',
                '&:hover': {
                    textDecoration: 'underline',
                },
            }),
        },
    },
    MuiChip: { // Style chips for categories/tags
      styleOverrides: {
        root: ({ theme }) => ({
           backgroundColor: theme.palette.mode === 'dark' ? grey[700] : grey[200],
        }),
      },
    }
  }
});
