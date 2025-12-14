@echo off
echo HEAD: > git_state.txt
git rev-parse HEAD >> git_state.txt
echo ORIGIN/MAIN: >> git_state.txt
git rev-parse origin/main >> git_state.txt
echo STATUS: >> git_state.txt
git status >> git_state.txt
