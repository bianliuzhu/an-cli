#!/bin/bash

echo 'build...'

npm run build

echo 'publish...'

npm publish --access public

echo 'done'