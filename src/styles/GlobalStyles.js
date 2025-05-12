import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #121212;
    color: #ffffff;
    height: 100vh;
    overflow: hidden;
  }

  #root {
    height: 100vh;
  }

  a {
    color: #1DB954;
    text-decoration: none;
  }

  button {
    font-family: 'Montserrat', sans-serif;
  }

  /* Añadir la fuente Montserrat desde Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
`;

export default GlobalStyles;
