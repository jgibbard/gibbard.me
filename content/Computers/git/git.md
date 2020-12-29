title: Git Cheatsheet
date: 2020/12/23
description: Dear future self, if you are reading this it looks like you have forgotten how to do something in Git again... Don't worry, it happens; this page has been created just for you!
main_image: git.svg
# Git Cheatsheet

## Creating and cloning a repository
### Clone an existing repository from a URL
```sh
git clone https://urlToRepo.com/repoName.git
```
### Clone an existing repository from a file and checkout a specific branch
```sh
git clone /path/to/repo/repoName.git -b branchName
```
### Set up a new git repository in the current directory
```sh
git init
```
## Staging files
### Stage all new, modified, and deleted files
```sh
git add -A
```
### Stage all modified and deleted files but not new (untracked) ones
```sh
git add -u
```

N.B. In git version 2.0 onwards git add -A and git add -u will operate on the entire working tree and not just the current path.

### Stage a specific file or set of files
```sh
git add path/to/file1.txt file2.txt
```

N.B. In git version 1.x using `git add <pathspec>` will only add new and modified files within the specified path-spec. From version 2.0 onwards `git add <pathspec>` will also stage files that have been deleted within the path-spec.

### Stage new and modified files in a specific directory (and deleted files in git version 2.x+)
```sh
git add path/to/dir
```
### Stage new, modified, and deleted files in a specific directory (in version 1.x)
```sh
git add -A path/to/dir
```
### Delete a file and stage the change in git
```sh
git rm path/to/file.txt
```
### Delete a directory and its contents and stage the change in git
```sh
git rm -r path/to/dir
```
## Committing
### Commit staged files with a short commit message
```sh
git commit -m "Commit message"
```
### Commit stages files with a custom author
```sh
git commit --author="John Doe <john@doe.com>" -m "Commit message"
```
## Viewing repository status
### View status of repository
```sh
git status
```
### View abbreviated status of the repository
```sh
git status -s
```

The left column is the status of files in the staging area and the right column is the status of files in the working tree.

M = Modified, A = Added, D = Deleted, R = Renamed, ? = Untracked files.
## Viewing repository history
### Show the last 10 commit logs
```sh
git log -n 10
```
### Show commit logs in a text graph format
```sh
git log --graph
```
## Undoing mistakes
### Change the last commit message
```sh
git commit --amend
```
### Change the author of the last commit
```sh
git commit --amend  --author="John Doe <john@doe.com>" -m "Commit message"
```
## Branches
### Create a new branch and switch to it
```sh
git checkout -b name_of_new_branch
```
### List all branches (including remote branches)
```sh
git branch -a
```
### Checkout an existing branch
```sh
git checkout name_of_existing_branch
```
### Delete a branch
```sh
git branch -d name_of_branch
```
### Remove local remote tracking branches that have been removed on the remote repository
```sh
git remote prune origin
```
## Git Ignore
The *.gitignore* file specifies files that you don't what to include as part of your git repository

```sh
# Ignore .bak files in all directories
*.bak

# Ignore any files in a log/ directory
log/

# Ignore log/*.txt (but not log/foo/*.txt
log/*.txt

# Ignore all .txt files in a log directory or any of its sub directories
log/**/*.txt
```

## Git Configuration
### Set the committer name and email address globally
```sh
git config --global user.name "John Doe"
git config --global user.email john@doe.com
```
### Set the committer name and email address for the current repository
```sh
git config user.name "John Doe"
git config user.email john@doe.com
```
### Set the default text editor to nano
```sh
git config --global core.editor "nano"
```