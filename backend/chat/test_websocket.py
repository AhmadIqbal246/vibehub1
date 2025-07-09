import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8000/ws/chat/5/"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected successfully!")
            
            # Send a test message
            await websocket.send(json.dumps({
                "message": "Hello World",
                "sender": "TestUser"
            }))
            
            # Wait for response
            response = await websocket.recv()
            print(f"Received: {response}")
            
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())