#!/bin/bash

# GigPay Authentication - Quick Start Script
# This script helps you get started with the authentication setup

echo "🚀 GigPay Authentication Setup"
echo "================================"
echo ""

# Check if .env.development exists
if [ ! -f .env.development ]; then
    echo "❌ Error: .env.development not found"
    echo "Please copy .env.example to .env.development and add your Supabase credentials"
    echo ""
    echo "Run:"
    echo "  cp .env.example .env.development"
    echo ""
    exit 1
fi

# Check if Supabase URL is configured
if grep -q "your-project.supabase.co" .env.development; then
    echo "⚠️  Warning: Supabase URL not configured"
    echo "Please update .env.development with your actual Supabase credentials"
    echo ""
    echo "Get them from: https://supabase.com/dashboard → Settings → API"
    echo ""
    exit 1
fi

echo "✅ Environment configuration found"
echo ""

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Dependencies installed"
echo ""

# Display next steps
echo "📋 Next Steps:"
echo ""
echo "1. Configure Supabase Database:"
echo "   • Go to https://supabase.com/dashboard"
echo "   • Navigate to SQL Editor"
echo "   • Copy and run contents of: supabase/schema.sql"
echo ""
echo "2. Configure Authentication Providers:"
echo "   • Email: Enable with confirmation"
echo "   • Phone: Enable WITHOUT confirmation ⚠️"
echo "   • Google: Add OAuth credentials"
echo ""
echo "3. Start the app:"
echo "   npm start"
echo ""
echo "4. Test authentication flows:"
echo "   • Email signup → verify email → login"
echo "   • Phone signup → auto-login"
echo "   • Google OAuth → authenticate → login"
echo "   • KYC flow → upload documents"
echo ""

# Check if Supabase schema has been run
echo "📚 Documentation:"
echo "   • Setup Guide: AUTH_SETUP_README.md"
echo "   • Checklist: SETUP_CHECKLIST.md"
echo "   • KYC Reference: KYC_VALIDATION_REFERENCE.md"
echo "   • Summary: IMPLEMENTATION_COMPLETE.md"
echo ""

echo "✨ Ready to start!"
echo ""
echo "Run 'npm start' to begin development"
echo ""
