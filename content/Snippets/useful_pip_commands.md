title: Useful pip commands
date: 2022/02/06

#### Install from a .whl file
```bash
python -m pip install file.whl
```

#### Install from a git repository 
```bash
# Repo is python package
pip install git+https://url_of_repo.git
# Repo contains python package in subdirectory
pip install git+https://url_of_repo.git#subdirectory=path/to/python/setup/file
```
