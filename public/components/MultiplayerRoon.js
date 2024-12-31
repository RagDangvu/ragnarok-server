import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Users } from 'lucide-react';

const MultiplayerRoom = () => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [gameLink, setGameLink] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    // Tạo room ID ngẫu nhiên
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    
    // Tạo game link
    const baseUrl = window.location.origin;
    const newGameLink = `${baseUrl}/multiplayer.html?room=${newRoomId}&host=${encodeURIComponent(username)}`;
    setGameLink(newGameLink);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(gameLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 bg-opacity-50">
      <Card className="w-full max-w-md bg-white bg-opacity-90">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">Create Game Room</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-100">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!roomId && (
                <Button 
                  onClick={handleCreateRoom}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Create Room
                </Button>
              )}

              {gameLink && (
                <div className="space-y-4">
                  <Alert className="bg-green-100">
                    <AlertDescription>
                      Room created successfully! Share this link with your friend:
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex items-center space-x-2">
                    <Input
                      value={gameLink}
                      readOnly
                      className="flex-1 p-2 border rounded bg-gray-50"
                    />
                    <Button
                      onClick={copyLink}
                      className="bg-gray-200 hover:bg-gray-300"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {copied && (
                    <Alert className="bg-blue-100">
                      <AlertDescription>Link copied to clipboard!</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={() => window.location.href = gameLink}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Join Game
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiplayerRoom;