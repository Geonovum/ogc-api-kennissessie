@ECHO OFF

if not "%~2"=="" if not "%~2"=="0" timeout /t %~2 /nobreak >nul
echo %~1
