#!/bin/bash

echo -e "${BLUE}start build..${NC}"

npm run build


echo -e "${BLUE}update package.json version...${NC}"

# 定义颜色变量
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 使用颜色输出文本
# echo -e "${RED}这是红色文字${NC}"
# echo -e "${GREEN}这是绿色文字${NC}"
# echo -e "${YELLOW}这是黄色文字${NC}"
# echo -e "${BLUE}这是蓝色文字${NC}"

# 提取当前版本号
current_version=$(grep -o '"version": *"[0-9]\+\.[0-9]\+\.[0-9]\+"' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')

# 分割版本号为数组
IFS='.' read -r -a version_parts <<< "$current_version"

# 增加版本号的最后一位
version_parts[2]=$((version_parts[2] + 1))

# 生成新的版本号
new_version="${version_parts[0]}.${version_parts[1]}.${version_parts[2]}"

# 更新 package.json 中的版本号
sed -i '' "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/" package.json

echo -e "${GREEN}Version updated to $new_version ${NC}"


echo -e "${BLUE}publish...${NC}"

npm publish --access public

echo -e "${GREEN} all done ${NC}"


