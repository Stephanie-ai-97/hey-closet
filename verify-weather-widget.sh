#!/usr/bin/env bash
# Weather Widget Implementation Verification Script
# Run this to verify all files are in place

echo "🌤️  Weather Widget Implementation Verification"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    return 0
  else
    echo -e "${RED}✗${NC} $1"
    return 1
  fi
}

echo "📁 Checking Core Files..."
check_file "src/services/weatherService.ts" && SERVICE_OK=1 || SERVICE_OK=0
check_file "src/hooks/useWeather.ts" && HOOK_OK=1 || HOOK_OK=0
check_file "src/components/WeatherWidget.tsx" && COMPONENT_OK=1 || COMPONENT_OK=0
echo ""

echo "📚 Checking Documentation..."
check_file "WEATHER_QUICKSTART.md" && QUICK_OK=1 || QUICK_OK=0
check_file "WEATHER_SETUP.md" && SETUP_OK=1 || SETUP_OK=0
check_file "WEATHER_DEVELOPER_GUIDE.md" && DEV_OK=1 || DEV_OK=0
check_file "WEATHER_IMPLEMENTATION.md" && IMPL_OK=1 || IMPL_OK=0
check_file "WEATHER_COMPLETE_SUMMARY.md" && SUMMARY_OK=1 || SUMMARY_OK=0
check_file "WEATHER_FILES_GUIDE.md" && FILES_OK=1 || FILES_OK=0
echo ""

echo "🔧 Checking Configuration Files..."
grep -q "VITE_OPENWEATHERMAP_API_KEY" ".env.example" && ENV_OK=1 || ENV_OK=0
if [ $ENV_OK -eq 1 ]; then
  echo -e "${GREEN}✓${NC} .env.example (API key added)"
else
  echo -e "${RED}✗${NC} .env.example (API key missing)"
fi
echo ""

echo "📝 Checking Integration..."
grep -q "WeatherWidget" "src/pages/Dashboard.tsx" && DASH_OK=1 || DASH_OK=0
if [ $DASH_OK -eq 1 ]; then
  echo -e "${GREEN}✓${NC} Dashboard.tsx (WeatherWidget integrated)"
else
  echo -e "${RED}✗${NC} Dashboard.tsx (WeatherWidget not found)"
fi

grep -q "interface Weather" "src/types.ts" && TYPES_OK=1 || TYPES_OK=0
if [ $TYPES_OK -eq 1 ]; then
  echo -e "${GREEN}✓${NC} types.ts (Weather types added)"
else
  echo -e "${RED}✗${NC} types.ts (Weather types missing)"
fi
echo ""

echo "📊 Summary"
echo "=================================================="
TOTAL=$((SERVICE_OK + HOOK_OK + COMPONENT_OK + QUICK_OK + SETUP_OK + DEV_OK + IMPL_OK + SUMMARY_OK + FILES_OK + ENV_OK + DASH_OK + TYPES_OK))
echo "Status: $TOTAL/12 files verified"

if [ $TOTAL -eq 12 ]; then
  echo -e "${GREEN}✅ All systems go! Weather widget ready for deployment.${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some files are missing. Check the output above.${NC}"
  exit 1
fi
