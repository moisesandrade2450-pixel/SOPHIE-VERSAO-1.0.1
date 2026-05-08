@echo off
echo Limpando caches do Expo...
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo Limpando cache do npm...
npm cache clean --force

echo Iniciando Expo com cache limpo na porta 8082...
npx expo start --port 8082 --clear

pause
