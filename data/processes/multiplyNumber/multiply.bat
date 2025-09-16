@ECHO OFF

@set a=%1%
@set b=%2
@set /a "product=%a%*%b%"

echo %product%
