@ECHO OFF

echo %1 %2

set /a v = %1
set /a v2 = %1 + 1
set /a v3 = %1 * 2

echo %v% %v2% %v3%
