import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  MessageCircle, 
  Bot, 
  User, 
  Leaf,
  Lightbulb,
  HelpCircle
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const AssistantPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Mock messages for demonstration (can be removed when implementing real chat)
  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'Hello! I\'m your AgroTrack AI Assistant. I can help you with plant care advice, troubleshooting plant issues, and answering questions about gardening. How can I assist you today?',
      sender: 'assistant',
      timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    },
    {
      id: '2',
      content: 'My tomato plant leaves are turning yellow. What could be causing this?',
      sender: 'user',
      timestamp: new Date(Date.now() - 3 * 60 * 1000) // 3 minutes ago
    },
    {
      id: '3',
      content: 'Yellow leaves on tomato plants can indicate several issues:\n\n🔍 **Common causes:**\n• **Overwatering** - Most common cause\n• **Nutrient deficiency** - Often nitrogen\n• **Natural aging** - Lower leaves naturally yellow\n• **Disease** - Fungal infections\n\n💧 **Quick fixes:**\n• Check soil moisture before watering\n• Ensure good drainage\n• Consider a balanced fertilizer\n• Remove affected leaves\n\nCan you tell me more about your watering schedule and soil conditions?',
      sender: 'assistant',
      timestamp: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
    }
  ];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate assistant response delay
    setTimeout(() => {
      const assistantResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Thank you for your message! This is a demo response. Real AI integration coming soon.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const displayMessages = messages.length > 0 ? messages : mockMessages;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto h-full">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bot className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">AI Assistant</h1>
                <p className="text-muted-foreground">Get personalized plant care advice and gardening help</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </Badge>
              <Badge variant="secondary">
                Plant Care Expert
              </Badge>
            </div>
          </div>

          {/* Chat Container */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b bg-green-50">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span>Chat with AI Assistant</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                {displayMessages.length === 0 ? (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="p-4 bg-green-100 rounded-full">
                      <Bot className="w-12 h-12 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        Welcome to AI Assistant
                      </h3>
                      <p className="text-muted-foreground max-w-md">
                        Ask me anything about plant care, gardening tips, or troubleshooting plant issues. 
                        I'm here to help your garden thrive!
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 w-full max-w-2xl">
                      <Card className="p-4 hover:bg-green-50 cursor-pointer transition-colors">
                        <div className="flex items-center space-x-2">
                          <Leaf className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium">Plant Care Tips</span>
                        </div>
                      </Card>
                      <Card className="p-4 hover:bg-blue-50 cursor-pointer transition-colors">
                        <div className="flex items-center space-x-2">
                          <Lightbulb className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium">Troubleshooting</span>
                        </div>
                      </Card>
                      <Card className="p-4 hover:bg-purple-50 cursor-pointer transition-colors">
                        <div className="flex items-center space-x-2">
                          <HelpCircle className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium">Ask Questions</span>
                        </div>
                      </Card>
                    </div>
                  </div>
                ) : (
                  /* Messages List */
                  <div className="space-y-4">
                    {displayMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={
                            message.sender === 'assistant' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-blue-100 text-blue-600'
                          }>
                            {message.sender === 'assistant' ? (
                              <Bot className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`flex flex-col max-w-[80%] ${
                          message.sender === 'user' ? 'items-end' : 'items-start'
                        }`}>
                          <div className={`px-4 py-2 rounded-2xl ${
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-green-100 text-green-600">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t p-4 bg-white">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about plant care, troubleshooting, or gardening tips..."
                      className="pr-12 py-3 text-sm"
                      disabled={isTyping}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="h-10 px-4 bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  💡 Pro tip: Be specific about your plant type and symptoms for better advice
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Leaf className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Plant Identification</h3>
                  <p className="text-sm text-muted-foreground">Help identify your plants</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Care Schedules</h3>
                  <p className="text-sm text-muted-foreground">Watering & fertilizing advice</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Problem Solving</h3>
                  <p className="text-sm text-muted-foreground">Diagnose plant issues</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AssistantPage;
