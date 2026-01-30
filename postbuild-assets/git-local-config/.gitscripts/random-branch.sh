#!/bin/bash

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 检查 jq 是否已安装
if ! command -v jq &> /dev/null; then
    echo "错误：未找到 jq 命令。请先安装 jq。"
    echo "可以使用以下命令安装："
    echo "  MacOS: brew install jq"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  CentOS/RHEL: sudo yum install jq"
    echo "  Windows: choco install jq"
    echo "  Windows: scoop install jq"
    exit 1
fi

# 使用 Node.js 读取配置文件
BRANCH_TYPES_JSON=$(node "$SCRIPT_DIR/get-branch-types.cjs")

# 如果 Node.js 命令执行失败，显示错误并退出
if [ $? -ne 0 ]; then
    echo "错误：无法读取分支类型配置"
    exit 1
fi

# 替换 readarray 命令，使用 while 循环读取数组
TYPES=()
while IFS= read -r line; do
    TYPES+=("$line")
done < <(echo "$BRANCH_TYPES_JSON" | jq -r '.[].type')

DESCRIPTIONS=()
while IFS= read -r line; do
    DESCRIPTIONS+=("$line")
done < <(echo "$BRANCH_TYPES_JSON" | jq -r '.[].description')

EMOJIS=()
while IFS= read -r line; do
    EMOJIS+=("$line")
done < <(echo "$BRANCH_TYPES_JSON" | jq -r '.[].emoji')

# 始终弹出分支类型选择
# 删除参数作为分支类型的逻辑
# 弹出类型选择
index=0
while true; do
    for i in "${!TYPES[@]}"; do
        if [ "$i" -eq "$index" ]; then
            tput setaf 2  # 设置绿色
            echo ">  ${EMOJIS[$i]}  ${TYPES[$i]}: ${DESCRIPTIONS[$i]}"
            tput sgr0  # 重置颜色
        else
            echo "   ${EMOJIS[$i]}  ${TYPES[$i]}: ${DESCRIPTIONS[$i]}"
        fi
    done

    # 读取用户输入
    read -rsn1 input
    case "$input" in
        $'\x1b') # 处理箭头键
            read -rsn2 input
            if [ "$input" == "[A" ]; then
                ((index--))
                if [ "$index" -lt 0 ]; then
                    index=$((${#TYPES[@]} - 1))
                fi
            elif [ "$input" == "[B" ]; then
                ((index++))
                if [ "$index" -ge "${#TYPES[@]}" ]; then
                    index=0
                fi
            fi
            ;;
        "") # 回车键确认选择
            BRANCH_TYPE=${TYPES[$index]}
            break
            ;;
    esac
    tput cuu ${#TYPES[@]}  # 光标上移
    tput el  # 清除行

done

# 判断参数，决定分支名后缀
if [ $# -eq 1 ]; then
    SUFFIX="$1"
else
    SUFFIX=$(openssl rand -hex 8 | tr -dc 'a-z0-9' | head -c 3)
fi

# 生成分支名
if [ "$BRANCH_TYPE" = "release" ]; then
    BRANCH_NAME="${BRANCH_TYPE}/$(date +%Y%m%d)"
else
    BRANCH_NAME="${BRANCH_TYPE}/$(date +%Y%m%d)-${SUFFIX}"
fi

# 创建并切换到新分支
git checkout -b "$BRANCH_NAME"

echo "Created and switched to a new branch: $BRANCH_NAME"
