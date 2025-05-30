import App from './app';

// Create and start the application
const app = new App();

// Start the server
app.start().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
