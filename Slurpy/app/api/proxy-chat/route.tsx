import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock responses with different emotions and fruits
    const responses = [
      {
        message:
          "I understand you're going through a challenging time. Can you tell me more about what's been weighing on your mind?",
        emotion: "empathetic",
        fruit: "🍑",
        intensity: 72,
      },
      {
        message:
          "That sounds really difficult. It's completely normal to feel overwhelmed when facing multiple stressors. You're being very brave by reaching out.",
        emotion: "supportive",
        fruit: "🍊",
        intensity: 68,
      },
      {
        message:
          "I hear the frustration in your words. Sometimes when we're dealing with a lot, it can feel like everything is piling up at once. What would feel most helpful right now?",
        emotion: "validating",
        fruit: "🥝",
        intensity: 75,
      },
      {
        message:
          "Thank you for sharing that with me. It takes courage to be vulnerable about our struggles. I'm here to support you through this.",
        emotion: "caring",
        fruit: "🍇",
        intensity: 70,
      },
      {
        message:
          "I can sense you're working through some complex feelings. That's completely okay - healing isn't linear, and every step forward matters.",
        emotion: "understanding",
        fruit: "🍓",
        intensity: 65,
      },
    ]

    // Select response based on message content or randomly
    const randomResponse = responses[Math.floor(Math.random() * responses.length)]

    return NextResponse.json({
      success: true,
      ...randomResponse,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process message",
        message: "I'm sorry, I'm having trouble responding right now. Please try again.",
        emotion: "apologetic",
        fruit: "🍑",
        intensity: 50,
      },
      { status: 500 },
    )
  }
}
