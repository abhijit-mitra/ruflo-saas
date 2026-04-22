import app from './app';

const PORT = parseInt(process.env.PORT || '4000', 10);

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});
