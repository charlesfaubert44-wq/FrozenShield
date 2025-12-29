@echo off
REM FrozenShield API Manual Testing Script - Windows Version
REM This script provides comprehensive manual tests for all API endpoints
REM
REM Usage: manual-tests.bat [base_url]
REM Example: manual-tests.bat http://localhost:5000
REM
REM Requirements:
REM - curl (included in Windows 10+)

setlocal enabledelayedexpansion

REM Colors using PowerShell
set "PS_GREEN=[System.Console]::ForegroundColor='Green';"
set "PS_RED=[System.Console]::ForegroundColor='Red';"
set "PS_YELLOW=[System.Console]::ForegroundColor='Yellow';"
set "PS_BLUE=[System.Console]::ForegroundColor='Cyan';"
set "PS_RESET=[System.Console]::ResetColor();"

REM Base URL
if "%~1"=="" (
    set "BASE_URL=http://localhost:5000"
) else (
    set "BASE_URL=%~1"
)
set "API_URL=%BASE_URL%/api"

REM Test results
set /a TESTS_PASSED=0
set /a TESTS_FAILED=0
set /a TESTS_TOTAL=0

REM Token storage
set "TOKEN="
set "PROJECT_ID="
set "CONTACT_ID="

echo =====================================
echo FROZENSHIELD API TESTING SUITE
echo =====================================
echo.
echo Base URL: %BASE_URL%
echo API URL: %API_URL%
echo.

REM ==============================
REM HEALTH CHECK
REM ==============================
echo =====================================
echo CHECKING SERVER STATUS
echo =====================================
echo.

echo TEST: Server health check
curl -s "%API_URL%/health" > health.tmp
findstr /C:"healthy" health.tmp >nul
if !errorlevel! equ 0 (
    powershell -Command "!PS_GREEN! Write-Host '√ PASS: Server is running and healthy'; !PS_RESET!"
    set /a TESTS_PASSED+=1
) else (
    powershell -Command "!PS_RED! Write-Host 'X FAIL: Server is not responding correctly'; !PS_RESET!"
    set /a TESTS_FAILED+=1
)
set /a TESTS_TOTAL+=1
del health.tmp

echo.
pause
echo.

REM ==============================
REM AUTHENTICATION TESTS
REM ==============================
echo =====================================
echo TESTING AUTHENTICATION ENDPOINTS
echo =====================================
echo.

REM Test: Register admin
echo TEST: POST /api/auth/register - Register first admin
curl -s -X POST "%API_URL%/auth/register" ^
    -H "Content-Type: application/json" ^
    -d "{\"username\":\"testadmin\",\"email\":\"admin@test.com\",\"password\":\"TestPassword123!\"}" > register.tmp

findstr /C:"token" register.tmp >nul
if !errorlevel! equ 0 (
    for /f "tokens=2 delims=:," %%a in ('findstr /C:"token" register.tmp') do (
        set "TOKEN=%%a"
        set "TOKEN=!TOKEN:"=!"
        set "TOKEN=!TOKEN: =!"
    )
    powershell -Command "!PS_GREEN! Write-Host '√ PASS: Admin registered successfully'; !PS_RESET!"
    echo INFO: Token saved for subsequent tests
    set /a TESTS_PASSED+=1
) else (
    echo INFO: Registration failed (admin may already exist), trying login...

    REM Try login instead
    curl -s -X POST "%API_URL%/auth/login" ^
        -H "Content-Type: application/json" ^
        -d "{\"username\":\"testadmin\",\"password\":\"TestPassword123!\"}" > login.tmp

    findstr /C:"token" login.tmp >nul
    if !errorlevel! equ 0 (
        for /f "tokens=2 delims=:," %%a in ('findstr /C:"token" login.tmp') do (
            set "TOKEN=%%a"
            set "TOKEN=!TOKEN:"=!"
            set "TOKEN=!TOKEN: =!"
        )
        powershell -Command "!PS_GREEN! Write-Host '√ PASS: Login successful'; !PS_RESET!"
        echo INFO: Token saved for subsequent tests
        set /a TESTS_PASSED+=1
    ) else (
        powershell -Command "!PS_RED! Write-Host 'X FAIL: Login failed'; !PS_RESET!"
        echo INFO: Cannot continue with authenticated tests
        set /a TESTS_FAILED+=1
    )
    del login.tmp
)
set /a TESTS_TOTAL+=1
del register.tmp

REM Test: Login with wrong password
echo.
echo TEST: POST /api/auth/login - Wrong password (should fail)
curl -s -o nul -w "%%{http_code}" -X POST "%API_URL%/auth/login" ^
    -H "Content-Type: application/json" ^
    -d "{\"username\":\"testadmin\",\"password\":\"WrongPassword123!\"}" > status.tmp

set /p STATUS=<status.tmp
if "!STATUS!"=="401" (
    powershell -Command "!PS_GREEN! Write-Host '√ PASS: Correctly rejected wrong password'; !PS_RESET!"
    set /a TESTS_PASSED+=1
) else (
    powershell -Command "!PS_RED! Write-Host 'X FAIL: Did not reject wrong password'; !PS_RESET!"
    set /a TESTS_FAILED+=1
)
set /a TESTS_TOTAL+=1
del status.tmp

REM Test: Get current admin
if not "!TOKEN!"=="" (
    echo.
    echo TEST: GET /api/auth/me - Get current admin
    curl -s -o nul -w "%%{http_code}" -X GET "%API_URL%/auth/me" ^
        -H "Authorization: Bearer !TOKEN!" > status.tmp

    set /p STATUS=<status.tmp
    if "!STATUS!"=="200" (
        powershell -Command "!PS_GREEN! Write-Host '√ PASS: Retrieved current admin successfully'; !PS_RESET!"
        set /a TESTS_PASSED+=1
    ) else (
        powershell -Command "!PS_RED! Write-Host 'X FAIL: Failed to retrieve current admin'; !PS_RESET!"
        set /a TESTS_FAILED+=1
    )
    set /a TESTS_TOTAL+=1
    del status.tmp
)

REM Test: Get admin without token
echo.
echo TEST: GET /api/auth/me - Without token (should fail)
curl -s -o nul -w "%%{http_code}" -X GET "%API_URL%/auth/me" > status.tmp

set /p STATUS=<status.tmp
if "!STATUS!"=="401" (
    powershell -Command "!PS_GREEN! Write-Host '√ PASS: Correctly rejected request without token'; !PS_RESET!"
    set /a TESTS_PASSED+=1
) else (
    powershell -Command "!PS_RED! Write-Host 'X FAIL: Did not reject request without token'; !PS_RESET!"
    set /a TESTS_FAILED+=1
)
set /a TESTS_TOTAL+=1
del status.tmp

echo.
pause
echo.

REM ==============================
REM PROJECT TESTS
REM ==============================
echo =====================================
echo TESTING PROJECT ENDPOINTS
echo =====================================
echo.

REM Test: Get all projects
echo TEST: GET /api/projects - Get all projects
curl -s -o nul -w "%%{http_code}" -X GET "%API_URL%/projects" > status.tmp

set /p STATUS=<status.tmp
if "!STATUS!"=="200" (
    powershell -Command "!PS_GREEN! Write-Host '√ PASS: Retrieved all projects'; !PS_RESET!"
    set /a TESTS_PASSED+=1
) else (
    powershell -Command "!PS_RED! Write-Host 'X FAIL: Failed to retrieve projects'; !PS_RESET!"
    set /a TESTS_FAILED+=1
)
set /a TESTS_TOTAL+=1
del status.tmp

REM Test: Get featured projects
echo.
echo TEST: GET /api/projects/featured - Get featured projects
curl -s -o nul -w "%%{http_code}" -X GET "%API_URL%/projects/featured" > status.tmp

set /p STATUS=<status.tmp
if "!STATUS!"=="200" (
    powershell -Command "!PS_GREEN! Write-Host '√ PASS: Retrieved featured projects'; !PS_RESET!"
    set /a TESTS_PASSED+=1
) else (
    powershell -Command "!PS_RED! Write-Host 'X FAIL: Failed to retrieve featured projects'; !PS_RESET!"
    set /a TESTS_FAILED+=1
)
set /a TESTS_TOTAL+=1
del status.tmp

REM Test: Create project without auth
echo.
echo TEST: POST /api/projects - Without auth (should fail)
curl -s -o nul -w "%%{http_code}" -X POST "%API_URL%/projects" ^
    -H "Content-Type: application/json" ^
    -d "{\"title\":\"Test Project\",\"description\":\"This should fail\"}" > status.tmp

set /p STATUS=<status.tmp
if "!STATUS!"=="401" (
    powershell -Command "!PS_GREEN! Write-Host '√ PASS: Correctly rejected unauthenticated project creation'; !PS_RESET!"
    set /a TESTS_PASSED+=1
) else (
    powershell -Command "!PS_RED! Write-Host 'X FAIL: Did not reject unauthenticated request'; !PS_RESET!"
    set /a TESTS_FAILED+=1
)
set /a TESTS_TOTAL+=1
del status.tmp

REM Test: Create project with auth
if not "!TOKEN!"=="" (
    echo.
    echo TEST: POST /api/projects - Create project with auth
    curl -s -X POST "%API_URL%/projects" ^
        -H "Content-Type: application/json" ^
        -H "Authorization: Bearer !TOKEN!" ^
        -d "{\"title\":\"Test API Project\",\"description\":\"A project created during API testing\",\"tags\":[\"Testing\",\"API\"],\"featured\":true,\"order\":99}" > create_project.tmp

    findstr /C:"_id" create_project.tmp >nul
    if !errorlevel! equ 0 (
        for /f "tokens=2 delims=:," %%a in ('findstr /C:"_id" create_project.tmp') do (
            set "PROJECT_ID=%%a"
            set "PROJECT_ID=!PROJECT_ID:"=!"
            set "PROJECT_ID=!PROJECT_ID: =!"
        )
        powershell -Command "!PS_GREEN! Write-Host '√ PASS: Created project successfully'; !PS_RESET!"
        echo INFO: Project ID: !PROJECT_ID!
        set /a TESTS_PASSED+=1
    ) else (
        powershell -Command "!PS_RED! Write-Host 'X FAIL: Failed to create project'; !PS_RESET!"
        set /a TESTS_FAILED+=1
    )
    set /a TESTS_TOTAL+=1
    del create_project.tmp
)

REM Test: Delete project with auth
if not "!TOKEN!"=="" if not "!PROJECT_ID!"=="" (
    echo.
    echo TEST: DELETE /api/projects/:id - Delete project with auth
    curl -s -o nul -w "%%{http_code}" -X DELETE "%API_URL%/projects/!PROJECT_ID!" ^
        -H "Authorization: Bearer !TOKEN!" > status.tmp

    set /p STATUS=<status.tmp
    if "!STATUS!"=="200" (
        powershell -Command "!PS_GREEN! Write-Host '√ PASS: Deleted project successfully'; !PS_RESET!"
        set /a TESTS_PASSED+=1
    ) else (
        powershell -Command "!PS_RED! Write-Host 'X FAIL: Failed to delete project'; !PS_RESET!"
        set /a TESTS_FAILED+=1
    )
    set /a TESTS_TOTAL+=1
    del status.tmp
)

echo.
pause
echo.

REM ==============================
REM CONTACT TESTS
REM ==============================
echo =====================================
echo TESTING CONTACT ENDPOINTS
echo =====================================
echo.

REM Test: Submit contact form
echo TEST: POST /api/contact - Submit contact form
curl -s -X POST "%API_URL%/contact" ^
    -H "Content-Type: application/json" ^
    -d "{\"name\":\"Test User\",\"email\":\"testuser@example.com\",\"message\":\"This is a test message for API testing purposes.\",\"honeypot\":\"\"}" > contact.tmp

findstr /C:"success" contact.tmp >nul
if !errorlevel! equ 0 (
    for /f "tokens=2 delims=:," %%a in ('findstr /C:"id" contact.tmp') do (
        set "CONTACT_ID=%%a"
        set "CONTACT_ID=!CONTACT_ID:"=!"
        set "CONTACT_ID=!CONTACT_ID: =!"
    )
    powershell -Command "!PS_GREEN! Write-Host '√ PASS: Contact form submitted successfully'; !PS_RESET!"
    set /a TESTS_PASSED+=1
) else (
    powershell -Command "!PS_RED! Write-Host 'X FAIL: Failed to submit contact form'; !PS_RESET!"
    set /a TESTS_FAILED+=1
)
set /a TESTS_TOTAL+=1
del contact.tmp

REM Test: Submit with short message
echo.
echo TEST: POST /api/contact - Message too short (should fail)
curl -s -o nul -w "%%{http_code}" -X POST "%API_URL%/contact" ^
    -H "Content-Type: application/json" ^
    -d "{\"name\":\"Test\",\"email\":\"test@example.com\",\"message\":\"Short\"}" > status.tmp

set /p STATUS=<status.tmp
if "!STATUS!"=="400" (
    powershell -Command "!PS_GREEN! Write-Host '√ PASS: Correctly rejected message that is too short'; !PS_RESET!"
    set /a TESTS_PASSED+=1
) else (
    powershell -Command "!PS_RED! Write-Host 'X FAIL: Did not reject short message'; !PS_RESET!"
    set /a TESTS_FAILED+=1
)
set /a TESTS_TOTAL+=1
del status.tmp

REM Test: Get contacts without auth
echo.
echo TEST: GET /api/contact - Without auth (should fail)
curl -s -o nul -w "%%{http_code}" -X GET "%API_URL%/contact" > status.tmp

set /p STATUS=<status.tmp
if "!STATUS!"=="401" (
    powershell -Command "!PS_GREEN! Write-Host '√ PASS: Correctly rejected unauthenticated access to contacts'; !PS_RESET!"
    set /a TESTS_PASSED+=1
) else (
    powershell -Command "!PS_RED! Write-Host 'X FAIL: Did not reject unauthenticated access'; !PS_RESET!"
    set /a TESTS_FAILED+=1
)
set /a TESTS_TOTAL+=1
del status.tmp

REM Test: Get contacts with auth
if not "!TOKEN!"=="" (
    echo.
    echo TEST: GET /api/contact - Get all contacts with auth
    curl -s -o nul -w "%%{http_code}" -X GET "%API_URL%/contact" ^
        -H "Authorization: Bearer !TOKEN!" > status.tmp

    set /p STATUS=<status.tmp
    if "!STATUS!"=="200" (
        powershell -Command "!PS_GREEN! Write-Host '√ PASS: Retrieved all contacts successfully'; !PS_RESET!"
        set /a TESTS_PASSED+=1
    ) else (
        powershell -Command "!PS_RED! Write-Host 'X FAIL: Failed to retrieve contacts'; !PS_RESET!"
        set /a TESTS_FAILED+=1
    )
    set /a TESTS_TOTAL+=1
    del status.tmp
)

REM Test: Delete contact with auth
if not "!TOKEN!"=="" if not "!CONTACT_ID!"=="" (
    echo.
    echo TEST: DELETE /api/contact/:id - Delete contact with auth
    curl -s -o nul -w "%%{http_code}" -X DELETE "%API_URL%/contact/!CONTACT_ID!" ^
        -H "Authorization: Bearer !TOKEN!" > status.tmp

    set /p STATUS=<status.tmp
    if "!STATUS!"=="200" (
        powershell -Command "!PS_GREEN! Write-Host '√ PASS: Deleted contact successfully'; !PS_RESET!"
        set /a TESTS_PASSED+=1
    ) else (
        powershell -Command "!PS_RED! Write-Host 'X FAIL: Failed to delete contact'; !PS_RESET!"
        set /a TESTS_FAILED+=1
    )
    set /a TESTS_TOTAL+=1
    del status.tmp
)

echo.
pause
echo.

REM ==============================
REM SEO TESTS
REM ==============================
echo =====================================
echo TESTING SEO ENDPOINTS
echo =====================================
echo.

REM Test: Get sitemap
echo TEST: GET /sitemap.xml - Get sitemap
curl -s "%BASE_URL%/sitemap.xml" > sitemap.tmp
findstr /C:"xml" sitemap.tmp >nul
if !errorlevel! equ 0 (
    powershell -Command "!PS_GREEN! Write-Host '√ PASS: Retrieved sitemap successfully'; !PS_RESET!"
    set /a TESTS_PASSED+=1
) else (
    powershell -Command "!PS_RED! Write-Host 'X FAIL: Failed to retrieve sitemap'; !PS_RESET!"
    set /a TESTS_FAILED+=1
)
set /a TESTS_TOTAL+=1
del sitemap.tmp

REM Test: Get structured data
echo.
echo TEST: GET /structured-data.json - Get structured data
curl -s "%BASE_URL%/structured-data.json" > structured.tmp
findstr /C:"@context" structured.tmp >nul
if !errorlevel! equ 0 (
    powershell -Command "!PS_GREEN! Write-Host '√ PASS: Retrieved structured data successfully'; !PS_RESET!"
    set /a TESTS_PASSED+=1
) else (
    powershell -Command "!PS_RED! Write-Host 'X FAIL: Failed to retrieve structured data'; !PS_RESET!"
    set /a TESTS_FAILED+=1
)
set /a TESTS_TOTAL+=1
del structured.tmp

echo.
pause
echo.

REM ==============================
REM TEST SUMMARY
REM ==============================
echo =====================================
echo TEST SUMMARY
echo =====================================
echo.
echo Total Tests: !TESTS_TOTAL!
powershell -Command "!PS_GREEN! Write-Host 'Passed: !TESTS_PASSED!'; !PS_RESET!"
powershell -Command "!PS_RED! Write-Host 'Failed: !TESTS_FAILED!'; !PS_RESET!"

set /a PASS_RATE=0
if !TESTS_TOTAL! gtr 0 (
    set /a PASS_RATE=!TESTS_PASSED! * 100 / !TESTS_TOTAL!
)
echo Pass Rate: !PASS_RATE!%%

echo.
if !TESTS_FAILED! equ 0 (
    powershell -Command "!PS_GREEN! Write-Host 'All tests passed!'; !PS_RESET!"
) else (
    powershell -Command "!PS_RED! Write-Host 'Some tests failed. Please review the output above.'; !PS_RESET!"
)

echo.
pause
