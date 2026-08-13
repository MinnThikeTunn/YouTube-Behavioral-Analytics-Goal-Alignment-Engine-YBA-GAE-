import '@testing-library/jest-dom';

// Mock WebSocket
class MockWebSocket {
  onmessage: ((event: any) => void) | null = null;
  close() {}
}
(global as any).WebSocket = MockWebSocket;
