"use client"

import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, BarChart3, User, Bot } from "lucide-react"
import SlideDrawer from "@/components/slide-drawer"

interface Message {
  id: string
  content: string
  sender: "user" | "slurpy"
  timestamp: Date
  emotion?: string
  intensity?: number
}

// Typing indicator component
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 px-4 py-3 bg-sage-100 rounded-2xl max-w-20"
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-sage-400 rounded-full"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 0.2,
          }}
        />
      ))}
    </motion.div>
  )
}

// Message bubble component
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} mb-6`}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-500 flex-shrink-0 rounded-full flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl relative ${
            isUser ? "bg-white border border-clay-400/40 text-sage-600" : "bg-sage-100 text-sage-800"
          }`}
        >
          <p className="font-display leading-relaxed">{message.content}</p>
        </div>
        <span className="text-xs text-sage-400 mt-1 px-2 ml-2">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-clay-400 to-sage-300 flex-shrink-0 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState<"chats" | "analysis">("chats")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Slurpy, your AI companion. I'm here to listen and support you. How are you feeling today?",
      sender: "slurpy",
      timestamp: new Date(),
      emotion: "welcoming",
      intensity: 75,
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [insightDrawerOpen, setInsightDrawerOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [newMessage])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setNewMessage("")
    setIsTyping(true)

    setTimeout(() => {
      const responses = [
        {
          content:
            "I hear you. That sounds like a lot to process. Can you tell me more about what's making you feel this way?",
          emotion: "empathetic",
        },
        {
          content: "Thank you for sharing that with me. It takes courage to open up about your feelings.",
          emotion: "supportive",
        },
        {
          content: "I'm here to listen without judgment. What would help you feel more supported right now?",
          emotion: "caring",
        },
        {
          content: "That's completely valid. Many people experience similar feelings. You're not alone in this.",
          emotion: "validating",
        },
      ]

      const response = responses[Math.floor(Math.random() * responses.length)]

      const slurpyMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: "slurpy",
        timestamp: new Date(),
        emotion: response.emotion,
        intensity: Math.floor(Math.random() * 30) + 60,
      }

      setMessages((prev) => [...prev, slurpyMessage])
      setIsTyping(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-sand-50 bg-gradient-to-tr from-sand-50 via-sage-50 to-transparent">
      {/* Slide Drawer */}
      <SlideDrawer selectedTab={selectedTab} onTabChange={setSelectedTab} onSidebarToggle={setSidebarOpen} />

      <div className={`flex h-screen transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"}`}>
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-sand-200 bg-white/80 backdrop-blur-sm">
            <div className="w-10" /> {/* Spacer for hamburger */}
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-sage-500" />
              <span className="font-display text-sage-500">Slurpy</span>
            </div>
            <Sheet open={insightDrawerOpen} onOpenChange={setInsightDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="text-sage-500 border-sage-200 bg-transparent">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Insights
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] p-0">
                <div className="p-6 h-full overflow-y-auto">
                  <h2 className="font-display text-sage-500 text-xl mb-4">Insights</h2>

                  {/* Current Mood Container */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🍑</span>
                      <div>
                        <p className="font-sans font-medium text-sage-600">Current Mood</p>
                        <p className="font-sans text-sm text-sage-400">Your mood data will appear here</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-sage-500">Intensity</span>
                        <span className="text-sage-600">--</span>
                      </div>
                      <div className="h-2 bg-sand-200 rounded-full">
                        <div className="h-full bg-sage-400 rounded-full w-0 transition-all duration-300"></div>
                      </div>
                    </div>
                  </div>

                  {/* Emotion Trends Container */}
                  <div className="mb-6">
                    <h3 className="font-sans font-medium text-sage-600 mb-3">Emotion Trends</h3>
                    <div className="h-32 bg-sand-100 rounded-lg flex items-center justify-center">
                      <p className="text-sage-400 text-sm">Chart data will appear here</p>
                    </div>
                  </div>

                  {/* Session Summary Container */}
                  <div>
                    <h3 className="font-sans font-medium text-sage-600 mb-3">Session Summary</h3>
                    <div className="space-y-2 text-sm text-sage-500">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-sage-400 rounded-full mt-2 flex-shrink-0" />
                        <span>Session insights will appear here</span>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 pb-32">
            <div className="max-w-4xl mx-auto py-6 my-1.5">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              <AnimatePresence>
                {isTyping && (
                  <div className="flex justify-start mb-6">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-500 flex-shrink-0 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <TypingIndicator />
                    </div>
                  </div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Bar */}
          <div className="sticky bottom-0 bg-sand-50/90 backdrop-blur-lg border-t border-sand-200 px-6 py-5.5.5.5.5 py-3">
            <div className="max-w-4xl mx-auto">
              {/* Message Input */}
              <div className="flex gap-3 items-center">
                {" "}
                {/* Changed from items-end to items-center */}
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Share what's on your mind..."
                    className="w-full resize-none bg-transparent border-sand-200 focus:ring-sage-300 focus:border-sage-300 rounded-xl min-h-[44px] max-h-32 font-display py-3" // Added py-3 for consistent padding
                    rows={1}
                    disabled={isTyping}
                  />
                </div>
                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isTyping}
                  className="bg-sage-500 hover:bg-sage-400 text-white rounded-xl px-4 py-2 h-11 flex-shrink-0 transition-all duration-200 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
