title: Git Cheatsheet
date: 2020/12/23

## Creating and cloning a repository
### Clone an existing repository from a URL
```
git clone https://urlToRepo.com/repoName.git
```
### Clone an existing repository from a file and checkout a specific branch
```
git clone /path/to/repo/repoName.git -b branchName
```
### Set up a new git repository in the current directory
```
git init
```
## Staging files
### Stage all new, modified, and deleted files
```
git add -A
```
### Stage all modified and deleted files but not new (untracked) ones
```
git add -u
```

N.B. In git version 2.0 onwards git add -A and git add -u will operate on the entire working tree and not just the current path.

### Stage a specific file or set of files
```
git add path/to/file1.txt file2.txt
```

N.B. In git version 1.x using `git add <pathspec>` will only add new and modified files within the specified path-spec. From version 2.0 onwards `git add <pathspec>` will also stage files that have been deleted within the path-spec.

### Stage new and modified files in a specific directory (and deleted files in git version 2.x+)
```
git add path/to/dir
```
### Stage new, modified, and deleted files in a specific directory (in version 1.x)
```
git add -A path/to/dir
```
### Delete a file and stage the change in git
```
git rm path/to/file.txt
```
### Delete a directory and its contents and stage the change in git
```
git rm -r path/to/dir
```
## Committing
### Commit staged files with a short commit message
```
git commit -m "Commit message"
```
### Commit stages files with a custom author
```
git commit --author="John Doe &lt;john@doe.com&gt;" -m "Commit message"
```
## Viewing repository status
### View status of repository
```
git status
```
### View abbreviated status of the repository
```
git status -s
```

The left column is the status of files in the staging area and the right column is the status of files in the working tree.

M = Modified, A = Added, D = Deleted, R = Renamed, ? = Untracked files.
## Viewing repository history
### Show the last 10 commit logs
```
git log -n 10
```
### Show commit logs in a text graph format
```
git log --graph
```
## Undoing mistakes
### Change the last commit message
```
git commit --amend
```
### Change the author of the last commit
```
git commit --amend  --author="John Doe &lt;john@doe.com&gt;" -m "Commit message"
```
## Branches
### Create a new branch and switch to it
```
git checkout -b name_of_new_branch
```
### List all branches (including remote branches)
```
git branch -a
```
### Checkout an existing branch
```
git checkout name_of_existing_branch
```
### Delete a branch
```
git branch -d name_of_branch
```
### Remove local remote tracking branches that have been removed on the remote repository
```
git remote prune origin
```
## Git Ignore
The *.gitignore* file specifies files that you don't what to include as part of your git repository
```
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
```
git config --global user.name "John Doe"
git config --global user.email john@doe.com
```
### Set the committer name and email address for the current repository
```
git config user.name "John Doe"
git config user.email john@doe.com
```
### Set the default text editor to nano
```
git config --global core.editor "nano"
```