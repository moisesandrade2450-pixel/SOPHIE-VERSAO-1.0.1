@echo off
echo Iniciando Servidor SOPHIE de Comunicacao em Tempo Real
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js em https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado
echo.

REM Verificar se as dependencias estao instaladas
if not exist node_modules (
    echo Instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
    echo Dependencias instaladas com sucesso!
    echo.
)

REM Iniciar servidor
echo Iniciando servidor na porta 3001...
echo Acesse: http://localhost:3001
echo WebSocket: ws://localhost:3001
echo API: http://localhost:3001/api
echo.
echo Pressione CTRL+C para parar o servidor
echo.

node server-realtime.js

if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha ao iniciar servidor!
    echo Verifique se a porta 3001 esta disponivel
    pause
    exit /b 1
)

pause
