@ECHO OFF

@set a=%1
@set b=%2

if "%b%"=="0" (
  echo 2nd argument can't be zero 1>&2
  exit /b 1
)

@set /a "quot=a/b"
@set /a "remain=a%%b"

echo %quot% %remain%
