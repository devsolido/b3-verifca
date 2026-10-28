@echo off
rem Compila e executa o Radar Fundamentalista B3 (requer JDK 17 ou superior).
cd /d "%~dp0"

where javac >nul 2>nul
if errorlevel 1 (
  echo JDK 17+ nao encontrado. Instale o JDK e tente novamente.
  exit /b 1
)

if not exist out mkdir out
javac -encoding UTF-8 -d out src\main\java\br\radar\*.java
if errorlevel 1 exit /b 1
java -cp out br.radar.Main
