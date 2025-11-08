#!/bin/bash

# Interactive LLM Payment Agent Launcher
# Quick setup script for the conversational AI payment demo

echo "═══════════════════════════════════════════════════════════════════"
echo "🤖 Interactive LLM Payment Agent Setup"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Check which provider is configured
if [ -z "$LLM_PROVIDER" ]; then
    export LLM_PROVIDER=ollama
    echo "ℹ️  Using default provider: Ollama (free, local)"
fi

# Check if using Ollama (free, local)
if [ "$LLM_PROVIDER" = "ollama" ]; then
    echo "✅ Configuration:"
    echo "   Provider: Ollama (free, local LLM)"
    echo "   Model: ${LLM_MODEL:-qwen2.5:7b}"
    echo ""

    # Check if Ollama is running
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "❌ Ollama is not running"
        echo ""
        echo "Please install and start Ollama:"
        echo ""
        echo "1. Install Ollama:"
        echo "   curl -fsSL https://ollama.com/install.sh | sh"
        echo ""
        echo "2. Start Ollama:"
        echo "   ollama serve"
        echo ""
        echo "3. Download a model (in another terminal):"
        echo "   ollama pull qwen2.5:7b  # Best model for payment analysis"
        echo ""
        echo "Then run this script again."
        echo ""
        exit 1
    fi

    # Check if model is available
    MODEL_NAME="${LLM_MODEL:-qwen2.5:7b}"
    if ! curl -s http://localhost:11434/api/tags | grep -q "\"name\":\"$MODEL_NAME\""; then
        echo "⚠️  Model '$MODEL_NAME' not found locally"
        echo ""
        echo "Downloading model (this may take a few minutes)..."
        ollama pull "$MODEL_NAME"

        if [ $? -ne 0 ]; then
            echo "❌ Failed to download model"
            exit 1
        fi
    fi

    echo "✅ Ollama is running and ready"
    echo ""
else
    # Check if API key is set for cloud providers
    if [ -z "$LLM_API_KEY" ]; then
        echo "❌ LLM API key not configured"
        echo ""
        echo "Please set your API key first:"
        echo ""
        echo "For OpenAI GPT-4:"
        echo "  export LLM_PROVIDER=openai"
        echo "  export LLM_API_KEY=sk-your-openai-api-key"
        echo ""
        echo "For Anthropic Claude:"
        echo "  export LLM_PROVIDER=anthropic"
        echo "  export LLM_API_KEY=sk-ant-your-anthropic-api-key"
        echo ""
        echo "Or use Ollama (free, no API key needed):"
        echo "  export LLM_PROVIDER=ollama"
        echo "  ollama serve"
        echo ""
        echo "Then run this script again."
        echo ""
        exit 1
    fi

    echo "✅ Configuration:"
    echo "   Provider: $LLM_PROVIDER"
    echo "   API Key: ${LLM_API_KEY:0:10}...${LLM_API_KEY: -4}"
    echo ""
fi

# Check if AP2Stellar server is running
if ! curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "⚠️  AP2Stellar server is not running"
    echo ""
    echo "Please start the server in another terminal:"
    echo "  cd /home/roger/dev/code/ap2stellar"
    echo "  npm run dev"
    echo ""
    read -p "Press Enter when server is running..."
    echo ""
fi

# Check server again
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "✅ AP2Stellar server is running"
else
    echo "❌ Server still not responding. Please check and try again."
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🚀 Starting Interactive LLM Payment Agent"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
if [ "$LLM_PROVIDER" = "ollama" ]; then
    echo "Using Ollama (free, local) - No API costs!"
else
    echo "Using $LLM_PROVIDER - API costs may apply"
fi
echo ""
echo "You can now chat with your AI payment assistant!"
echo ""
echo "Try asking:"
echo "  • 'What's the exchange rate for 100 XLM to USDC?'"
echo "  • 'I want to send 50 XLM to a merchant'"
echo "  • 'Help me make a payment'"
echo ""
echo "Type 'exit' to quit"
echo ""
sleep 2

# Run the interactive agent
cd "$(dirname "$0")"
npx tsx interactive-llm-agent.ts
