@echo off
setlocal EnableDelayedExpansion

:: 获取脚本所在目录的绝对路径
set "SCRIPT_DIR=%~dp0"

:: 检查 jq 是否已安装
where jq >nul 2>nul
if errorlevel 1 (
    echo 错误：未找到 jq 命令。请先安装 jq。
    echo 可以使用以下命令安装：
    echo   Windows ^(Chocolatey^): choco install jq
    echo   Windows ^(Scoop^): scoop install jq
    echo 或者从以下地址下载：
    echo   https://stedolan.github.io/jq/download/
    exit /b 1
)

:: 使用 Node.js 读取配置文件
for /f "delims=" %%i in ('node "%SCRIPT_DIR%get-branch-types.cjs"') do set "BRANCH_TYPES_JSON=%%i"

:: 如果 Node.js 命令执行失败，显示错误并退出
if errorlevel 1 (
    echo 错误：无法读取分支类型配置
    exit /b 1
)

:: 使用临时文件存储解析后的数据
echo %BRANCH_TYPES_JSON% | jq -r ".[].type" > "%temp%\types.txt"
echo %BRANCH_TYPES_JSON% | jq -r ".[].description" > "%temp%\descriptions.txt"
echo %BRANCH_TYPES_JSON% | jq -r ".[].emoji" > "%temp%\emojis.txt"

:: 读取数据到数组
set i=0
for /f "delims=" %%a in (%temp%\types.txt) do (
    set "TYPES[!i!]=%%a"
    set /a i+=1
)
set TYPE_COUNT=%i%

set i=0
for /f "delims=" %%a in (%temp%\descriptions.txt) do (
    set "DESCRIPTIONS[!i!]=%%a"
    set /a i+=1
)

set i=0
for /f "delims=" %%a in (%temp%\emojis.txt) do (
    set "EMOJIS[!i!]=%%a"
    set /a i+=1
)

:: 删除临时文件
del "%temp%\types.txt" "%temp%\descriptions.txt" "%temp%\emojis.txt"

:: 如果提供了命令行参数，直接使用它
if not "%~1"=="" (
    set BRANCH_TYPE=%~1
) else (
    :: 显示选项列表
    echo 请选择分支类型 (输入数字选择):
    for /l %%i in (0,1,%TYPE_COUNT%) do (
        if %%i lss %TYPE_COUNT% (
            echo %%i. !EMOJIS[%%i]! !TYPES[%%i]!: !DESCRIPTIONS[%%i]!
        )
    )

    :: 获取用户输入
    set /p "choice=请输入选择的数字: "
    set "BRANCH_TYPE=!TYPES[%choice%]!"
)

:: 生成随机后缀
set "chars=0123456789abcdefghijklmnopqrstuvwxyz"
set "RANDOM_SUFFIX="
for /L %%i in (1,1,3) do (
    set /a "rand=!random! %% 36"
    for %%j in (!rand!) do set "RANDOM_SUFFIX=!RANDOM_SUFFIX!!chars:~%%j,1!"
)

:: 获取当前日期
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "CURRENT_DATE=%datetime:~0,8%"

:: 创建分支名
if "%BRANCH_TYPE%"=="release" (
    set "BRANCH_NAME=%BRANCH_TYPE%/%CURRENT_DATE%"
) else (
    set "BRANCH_NAME=%BRANCH_TYPE%/%CURRENT_DATE%-%RANDOM_SUFFIX%"
)

:: 创建并切换到新分支
git checkout -b "%BRANCH_NAME%"

echo 已创建并切换到新分支: %BRANCH_NAME%

endlocal
